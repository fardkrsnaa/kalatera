import { CameraManager, type FacingMode } from '../core/camera';
import { getCurrentPosition } from '../core/geolocation';
import { drawWatermark } from '../core/watermark';
import { savePhoto, checkStorageQuota } from '../core/idb';
import { formatDateTime } from '../utils/format';

export interface CaptureResult {
  photoId: string;
  lat: number;
  lon: number;
  address: string;
}

export class CameraModal {
  private container: HTMLDivElement;
  private video: HTMLVideoElement;
  private camera: CameraManager;
  private facingMode: FacingMode = 'environment';
  private type: 'CLOCK IN' | 'CLOCK OUT';
  private onCaptureCallback: ((result: CaptureResult) => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  constructor(type: 'CLOCK IN' | 'CLOCK OUT') {
    this.type = type;
    this.camera = new CameraManager();
    this.container = document.createElement('div');
    this.video = document.createElement('video');
    this.render();
  }

  private render(): void {
    this.container.className = 'modal-overlay';
    this.container.innerHTML = `
      <div class="modal" style="max-width: 800px;">
        <div class="modal-header">
          <h2>${this.type}</h2>
          <button class="btn-close" aria-label="Tutup">✕</button>
        </div>
        <div class="modal-body">
          <div style="position: relative; background: black; border-radius: var(--radius-md); overflow: hidden;">
            <video id="camera-video" style="width: 100%; display: block;" playsinline muted autoplay></video>
            <div id="camera-status" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: rgba(0,0,0,0.8); padding: var(--spacing-md); border-radius: var(--radius-md); display: none;">
              <p>Memuat kamera...</p>
            </div>
          </div>
          <div id="camera-error" style="color: var(--color-danger); margin-top: var(--spacing-sm); display: none;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-switch">
            <span>🔄</span> Ganti Kamera
          </button>
          <button class="btn btn-primary" id="btn-capture">
            <span>📷</span> Ambil Foto
          </button>
        </div>
      </div>
    `;

    this.video = this.container.querySelector('#camera-video')!;
    
    this.container.querySelector('.btn-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-switch')!.addEventListener('click', () => this.switchCamera());
    this.container.querySelector('#btn-capture')!.addEventListener('click', () => this.capture());
  }

  async open(): Promise<void> {
    document.body.appendChild(this.container);
    
    const statusEl = this.container.querySelector('#camera-status') as HTMLDivElement;
    statusEl.style.display = 'block';

    try {
      await this.camera.start(this.video, this.facingMode);
      statusEl.style.display = 'none';
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Gagal membuka kamera');
      statusEl.style.display = 'none';
    }
  }

  private async switchCamera(): Promise<void> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    const statusEl = this.container.querySelector('#camera-status') as HTMLDivElement;
    statusEl.style.display = 'block';

    try {
      await this.camera.start(this.video, this.facingMode);
      statusEl.style.display = 'none';
      this.hideError();
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Gagal mengganti kamera');
      statusEl.style.display = 'none';
    }
  }

  private async capture(): Promise<void> {
    const captureBtn = this.container.querySelector('#btn-capture') as HTMLButtonElement;
    captureBtn.disabled = true;
    captureBtn.textContent = 'Memproses...';

    try {
      const quota = await checkStorageQuota();
      if (quota.available < 5 * 1024 * 1024) {
        throw new Error('Ruang penyimpanan kurang dari 5MB. Hapus beberapa data.');
      }

      const position = await getCurrentPosition();

      const photoBlob = await this.camera.capture({
        facingMode: this.facingMode,
        maxWidth: 800,
        quality: 0.7,
      });

      const canvas = document.createElement('canvas');
      const img = await this.blobToImage(photoBlob);
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const now = new Date();
      drawWatermark(canvas, ctx, {
        type: this.type,
        datetime: formatDateTime(now),
        location: position.address,
      });

      const finalBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat foto'))),
          'image/jpeg',
          0.7
        );
      });

      const photoId = this.generateId();
      await savePhoto(photoId, {
        blob: finalBlob,
        mime: 'image/jpeg',
        w: canvas.width,
        h: canvas.height,
        createdAt: Date.now(),
      });

      if (this.onCaptureCallback) {
        this.onCaptureCallback({
          photoId,
          lat: position.lat,
          lon: position.lon,
          address: position.address,
        });
      }

      this.close();
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Gagal mengambil foto');
      captureBtn.disabled = false;
      captureBtn.innerHTML = '<span>📷</span> Ambil Foto';
    }
  }

  private blobToImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Gagal memuat gambar'));
      };
      img.src = url;
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private showError(message: string): void {
    const errorEl = this.container.querySelector('#camera-error') as HTMLDivElement;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  private hideError(): void {
    const errorEl = this.container.querySelector('#camera-error') as HTMLDivElement;
    errorEl.style.display = 'none';
  }

  private async close(): Promise<void> {
    await this.camera.stop();
    this.container.remove();
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  onCapture(callback: (result: CaptureResult) => void): void {
    this.onCaptureCallback = callback;
  }

  onClose(callback: () => void): void {
    this.onCloseCallback = callback;
  }
}
