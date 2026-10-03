import { SettingsModal } from './SettingsModal';

export class Header {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('header');
    this.render();
  }

  private render(): void {
    this.container.style.cssText = 'text-align: center; padding: var(--spacing-lg) 0; position: relative;';
    this.container.innerHTML = `
      <button class="btn btn-secondary" id="btn-settings" style="position: absolute; right: 0; top: var(--spacing-lg);" aria-label="Pengaturan">
        ⚙️
      </button>
      <h1 style="color: var(--color-primary); margin-bottom: var(--spacing-xs);">Kalatera</h1>
      <p style="color: var(--color-text-secondary); font-size: 0.875rem;">Sistem Absensi Digital</p>
    `;

    this.container.querySelector('#btn-settings')!.addEventListener('click', () => {
      const modal = new SettingsModal();
      modal.open();
    });
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }
}
