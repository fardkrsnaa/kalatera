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
      <div class="modal" style="max-width: 440px;">
        <div class="modal-header">
          <h2 style="font-size: var(--text-xl);">${type}</h2>
          <button class="btn-close" aria-label="Tutup">✕</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: var(--spacing-6); color: var(--color-text-secondary); text-align: center;">Pilih metode absensi</p>
          <div style="display: flex; flex-direction: column; gap: var(--spacing-3);">
            <button class="btn btn-primary btn-lg" id="btn-with-photo" style="width: 100%; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              Ambil Foto
            </button>
            <button class="btn btn-secondary btn-lg" id="btn-no-photo" style="width: 100%; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Tanpa Foto
            </button>
          </div>
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
