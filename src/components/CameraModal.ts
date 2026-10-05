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
          <h2 style="font-size: var(--text-xl);">${this.type}</h2>
          <button class="btn-close" aria-label="Tutup">✕</button>
        </div>
        <div class="modal-body" style="padding: 0;">
          <div style="position: relative; background: black; overflow: hidden; min-height: 400px;">
            <video id="camera-video" style="width: 100%; display: block; border-radius: var(--radius-lg);" playsinline muted autoplay></video>
            <div id="camera-status" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; background: rgba(0,0,0,0.85); padding: var(--spacing-6); border-radius: var(--radius-lg); display: none; backdrop-filter: blur(8px); text-align: center;">
              <div style="margin-bottom: var(--spacing-3);">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
              </div>
              <p style="font-weight: 500;">Memuat kamera...</p>
            </div>
          </div>
          <div id="camera-error" style="color: var(--color-danger); padding: var(--spacing-4); display: none; background: var(--color-danger-light); margin: var(--spacing-4); border-radius: var(--radius-md);"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-switch">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Ganti Kamera
          </button>
          <button class="btn btn-primary btn-lg" id="btn-capture">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Ambil Foto
          </button>
        </div>
      </div>
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    this.video = this.container.querySelector('#camera-video')!;
    
    this.container.querySelector('.btn-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-switch')!.addEventListener('click', () => this.switchCamera());
    this.container.querySelector('#btn-capture')!.addEventListener('click', () => this.capture());

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
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
    this.container.remove();
    try {
      await this.camera.stop();
    } catch {}
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
