export class PhotoOptionDialog {
  private container: HTMLDivElement;
  private onPhotoCallback: (() => void) | null = null;
  private onNoPhotoCallback: (() => void) | null = null;

  constructor(type: 'CLOCK IN' | 'CLOCK OUT') {
    this.container = document.createElement('div');
    this.render(type);
  }

  private render(type: string): void {
    this.container.className = 'modal-overlay';
    this.container.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2>${type}</h2>
          <button class="btn-close" aria-label="Tutup">✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: var(--spacing-md);">Pilih metode absensi:</p>
          <button class="btn btn-primary" id="btn-with-photo" style="width: 100%; margin-bottom: var(--spacing-sm);">
            📷 Ambil Foto
          </button>
          <button class="btn btn-secondary" id="btn-no-photo" style="width: 100%;">
            ✓ Tanpa Foto
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('.btn-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-with-photo')!.addEventListener('click', () => {
      if (this.onPhotoCallback) {
        this.onPhotoCallback();
      }
      this.close();
    });
    this.container.querySelector('#btn-no-photo')!.addEventListener('click', () => {
      if (this.onNoPhotoCallback) {
        this.onNoPhotoCallback();
      }
      this.close();
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
  }

  open(): void {
    document.body.appendChild(this.container);
  }

  private close(): void {
    this.container.remove();
  }

  onPhoto(callback: () => void): void {
    this.onPhotoCallback = callback;
  }

  onNoPhoto(callback: () => void): void {
    this.onNoPhotoCallback = callback;
  }
}
