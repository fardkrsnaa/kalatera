export class Header {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('header');
    this.render();
  }

  private render(): void {
    this.container.style.cssText = `
      text-align: center; 
      padding: var(--spacing-8) 0 var(--spacing-10) 0; 
    `;
    this.container.innerHTML = `
      <div style="display: inline-flex; align-items: center; gap: var(--spacing-3); margin-bottom: var(--spacing-2);">
        <div style="
          width: 48px; 
          height: 48px; 
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%); 
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-primary);
        ">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <h1 style="
          font-size: var(--text-4xl); 
          font-weight: 700; 
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          line-height: 1;
        ">Kalatera</h1>
      </div>
      <p style="color: var(--color-text-secondary); font-size: var(--text-sm); font-weight: 500;">Sistem Absensi Digital</p>
    `;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }
}
