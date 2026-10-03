import { router } from '../core/router';

export class AppShell {
  private container: HTMLDivElement;
  private viewContainer: HTMLElement;
  private sidebar!: HTMLElement;
  private currentView: HTMLElement | null = null;
  private isSidebarCollapsed = false;
  private isTransitioning = false;

  constructor() {
    this.container = document.createElement('div');
    this.render();
    this.viewContainer = this.container.querySelector('#view-container')!;
    this.bindEvents();
    this.initRouter();
  }

  private render(): void {
    this.container.className = 'app-shell';
    this.container.innerHTML = `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h1 class="sidebar-title">Kalatera</h1>
        </div>
        <nav class="sidebar-nav" id="sidebar-nav"></nav>
        <div class="sidebar-footer">
          <button class="btn btn-ghost" id="btn-toggle-sidebar" style="width: 100%; justify-content: center;" aria-label="Toggle sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span class="sidebar-item-label">Collapse</span>
          </button>
        </div>
      </aside>

      <div class="mobile-overlay" id="mobile-overlay"></div>

      <main class="main-content">
        <header class="main-header">
          <div class="main-header-left">
            <button class="btn btn-ghost btn-icon" id="btn-mobile-menu" aria-label="Open menu" style="display: none;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 class="main-header-title" id="page-title">Absensi</h1>
          </div>
        </header>
        <div class="main-body">
          <div class="view-transition-container" id="view-container"></div>
        </div>
      </main>
    `;

    this.sidebar = this.container.querySelector('#sidebar')!;
    this.renderSidebarNav();
  }

  private renderSidebarNav(): void {
    const nav = this.container.querySelector('#sidebar-nav')!;
    const currentRoute = router.getCurrentRoute();

    const items = [
      { route: 'absensi' as const, icon: this.getIcon('dashboard'), label: 'Absensi' },
      { route: 'data' as const, icon: this.getIcon('table'), label: 'Data Absensi' },
      { route: 'settings' as const, icon: this.getIcon('settings'), label: 'Pengaturan' },
    ];

    nav.innerHTML = items.map(item => `
      <a href="#${item.route}" class="sidebar-item ${currentRoute === item.route ? 'active' : ''}" data-route="${item.route}">
        ${item.icon}
        <span class="sidebar-item-label">${item.label}</span>
      </a>
    `).join('');

    nav.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = (item as HTMLElement).dataset.route as 'absensi' | 'data' | 'settings';
        router.navigate(route);
        this.closeMobileDrawer();
      });
    });
  }

  private getIcon(name: string): string {
    const icons: Record<string, string> = {
      dashboard: `<svg class="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>`,
      table: `<svg class="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="3" x2="21" y2="3"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="3" y1="21" x2="21" y2="21"></line><line x1="3" y1="3" x2="3" y2="21"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
      settings: `<svg class="sidebar-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m13.2 5.2l-4.2-4.2m0-6l-4.2-4.2"></path></svg>`,
    };
    return icons[name] || '';
  }

  private bindEvents(): void {
    this.container.querySelector('#btn-toggle-sidebar')!.addEventListener('click', () => {
      this.toggleSidebar();
    });

    this.container.querySelector('#btn-mobile-menu')!.addEventListener('click', () => {
      this.openMobileDrawer();
    });

    this.container.querySelector('#mobile-overlay')!.addEventListener('click', () => {
      this.closeMobileDrawer();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeMobileDrawer();
      }
    });
  }

  private initRouter(): void {
    router.subscribe((route) => {
      this.updateActiveNav(route);
      this.switchView(route);
      this.closeMobileDrawer();
    });
  }

  private updateActiveNav(route: string): void {
    this.container.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-route') === route);
    });

    const titles: Record<string, string> = {
      absensi: 'Absensi',
      data: 'Data Absensi',
      settings: 'Pengaturan'
    };
    this.container.querySelector('#page-title')!.textContent = titles[route] || 'Kalatera';
  }

  private async switchView(route: string): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const { AbsensiView } = await import('./AbsensiView');
    const { DataAbsensiView } = await import('./DataAbsensiView');
    const { SettingsView } = await import('./SettingsView');

    const oldView = this.currentView;
    let newViewElement: HTMLElement;

    switch (route) {
      case 'data':
        newViewElement = new DataAbsensiView().element;
        break;
      case 'settings':
        newViewElement = new SettingsView().element;
        break;
      default:
        newViewElement = new AbsensiView().element;
    }

    // Prepare new view for transition
    newViewElement.classList.add('view-page', 'entering');
    
    if (oldView) {
      await this.crossFadeTransition(oldView, newViewElement);
    } else {
      // First load - just show new view
      newViewElement.classList.remove('entering');
      newViewElement.classList.add('active');
      this.viewContainer.appendChild(newViewElement);
      this.staggerChildren(newViewElement);
    }

    this.currentView = newViewElement;
    this.isTransitioning = false;
  }

  private async crossFadeTransition(oldView: HTMLElement, newView: HTMLElement): Promise<void> {
    // Ensure container has relative positioning
    this.viewContainer.style.position = 'relative';
    this.viewContainer.style.minHeight = '200px';

    // Add new view to container (both views in DOM now)
    newView.classList.add('view-page', 'entering');
    this.viewContainer.appendChild(newView);

    // Force reflow to ensure initial state is applied
    void newView.offsetWidth;

    // Start transition: old leaves, new enters
    oldView.classList.add('view-page', 'active', 'leaving');
    newView.classList.remove('entering');
    newView.classList.add('active');

    // Stagger children of new view
    this.staggerChildren(newView);

    // Wait for transition to complete
    await this.sleep(250);

    // Cleanup old view
    oldView.remove();
    oldView.classList.remove('active', 'leaving');
    
    // Cleanup new view classes
    newView.classList.remove('leaving', 'entering');
    // Keep 'view-page' and 'active'
  }

  private staggerChildren(view: HTMLElement): void {
    const items = view.querySelectorAll('.stagger-item, .card, .day-cell.has-record, tbody tr');
    items.forEach((item, index) => {
      (item as HTMLElement).style.animationDelay = `${index * 50}ms`;
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    this.container.classList.toggle('sidebar-collapsed', this.isSidebarCollapsed);
    const btn = this.container.querySelector('#btn-toggle-sidebar');
    if (btn) {
      btn.querySelector('.sidebar-item-label')!.textContent = this.isSidebarCollapsed ? 'Expand' : 'Collapse';
    }
  }

  private openMobileDrawer(): void {
    this.sidebar.classList.add('mobile-drawer', 'show');
    this.container.querySelector('#mobile-overlay')!.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  private closeMobileDrawer(): void {
    this.sidebar.classList.remove('show');
    this.container.querySelector('#mobile-overlay')!.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => {
      this.sidebar.classList.remove('mobile-drawer');
    }, 300);
  }

  get element(): HTMLElement {
    return this.container;
  }
}