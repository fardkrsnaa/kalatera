export type FacingMode = 'user' | 'environment';

export interface CameraOptions {
  facingMode: FacingMode;
  maxWidth: number;
  quality: number;
}

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  async start(video: HTMLVideoElement, facingMode: FacingMode): Promise<void> {
    await this.stop();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      this.videoElement = video;
      video.srcObject = this.stream;
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.muted = true;
      
      await video.play();
    } catch (error) {
      throw new Error('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.');
    }
  }

  async stop(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  async capture(options: CameraOptions): Promise<Blob> {
    if (!this.videoElement || !this.stream) {
      throw new Error('Kamera belum aktif');
    }

    const video = this.videoElement;
    const canvas = document.createElement('canvas');
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) {
      throw new Error('Video belum siap');
    }

    let targetWidth = videoWidth;
    let targetHeight = videoHeight;

    if (videoWidth > options.maxWidth) {
      const ratio = options.maxWidth / videoWidth;
      targetWidth = options.maxWidth;
      targetHeight = Math.round(videoHeight * ratio);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Gagal membuat foto'));
          }
        },
        'image/jpeg',
        options.quality
      );
    });
  }
}
