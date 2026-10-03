export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T, index: number) => string;
  sortable?: boolean;
}

export interface DataTableConfig<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  pageSizes?: number[];
  onRowClick?: (row: T, index: number) => void;
  onAction?: (action: string, row: T, index: number) => void;
  emptyMessage?: string;
}

export class DataTable<T> {
  public element: HTMLElement;
  private config: DataTableConfig<T>;
  private currentPage = 1;
  private pageSize: number;
  private sortColumn: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private filteredData: T[] = [];

  constructor(config: DataTableConfig<T>) {
    this.config = config;
    this.pageSize = config.pageSize || 10;
    this.element = document.createElement('div');
    this.element.className = 'data-table-container';
    this.applyFilters();
    this.render();
  }

  private applyFilters(): void {
    this.filteredData = [...this.config.data];
    
    if (this.sortColumn) {
      this.filteredData.sort((a, b) => {
        const aVal = (a as any)[this.sortColumn!];
        const bVal = (b as any)[this.sortColumn!];
        const direction = this.sortDirection === 'asc' ? 1 : -1;
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
      });
    }
  }

  private getPaginatedData(): T[] {
    if (!this.config.paginated) return this.filteredData;
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  private getTotalPages(): number {
    if (!this.config.paginated) return 1;
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  private render(): void {
    const data = this.getPaginatedData();
    const totalPages = this.getTotalPages();

    this.element.innerHTML = `
      ${this.config.filterable ? this.renderToolbar() : ''}
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              ${this.config.columns.map(col => `
                <th 
                  style="${col.width ? `width: ${col.width};` : ''}" 
                  class="${col.sortable ? 'sortable' : ''}"
                  data-key="${col.key}"
                >
                  <div class="th-content">
                    <span>${col.header}</span>
                    ${col.sortable ? `
                      <svg class="sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    ` : ''}
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.length > 0 ? data.map((row, index) => `
              <tr class="stagger-item" data-index="${index}" style="cursor: ${this.config.onRowClick || this.config.onAction ? 'pointer' : 'default'};">
                ${this.config.columns.map(col => `
                  <td>${col.render ? col.render(row, index) : (row as any)[col.key]}</td>
                `).join('')}
              </tr>
            `).join('') : `
              <tr>
                <td colspan="${this.config.columns.length}" class="data-table-empty">
                  <div class="empty-state">
                    <div class="empty-state-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="3" x2="21" y2="3"></line>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="3" y1="15" x2="21" y2="15"></line>
                        <line x1="3" y1="21" x2="21" y2="21"></line>
                        <line x1="3" y1="3" x2="3" y2="21"></line>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                      </svg>
                    </div>
                    <h3 class="empty-state-title">Tidak Ada Data</h3>
                    <p class="empty-state-description">${this.config.emptyMessage || 'Belum ada record absensi untuk periode ini.'}</p>
                  </div>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
      ${this.config.paginated && totalPages > 1 ? this.renderPagination(totalPages) : ''}
    `;

    this.bindEvents();
    this.staggerRows();
  }

  private renderToolbar(): string {
    return `
      <div class="data-table-toolbar">
        <div class="toolbar-left">
          <label class="search-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" class="form-input search-input" placeholder="Cari..." style="padding-left: 40px; width: 280px;" />
          </label>
        </div>
        <div class="toolbar-right">
          ${this.config.paginated ? `
            <select class="form-select page-size-select" style="width: auto; padding: var(--spacing-2) var(--spacing-8) var(--spacing-2) var(--spacing-3);">
              ${(this.config.pageSizes || [10, 25, 50]).map(size => `
                <option value="${size}" ${size === this.pageSize ? 'selected' : ''}>${size} / halaman</option>
              `).join('')}
            </select>
          ` : ''}
        </div>
      </div>
    `;
  }

  private renderPagination(totalPages: number): string {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(`<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`);
    }

    return `
      <div class="data-table-pagination">
        <div class="pagination-info">
          Menampilkan ${Math.min((this.currentPage - 1) * this.pageSize + 1, this.filteredData.length)} - ${Math.min(this.currentPage * this.pageSize, this.filteredData.length)} dari ${this.filteredData.length} data
        </div>
        <div class="pagination-controls">
          <button class="btn btn-secondary btn-sm" id="prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div class="page-numbers">${pages.join('')}</div>
          <button class="btn btn-secondary btn-sm" id="next-page" ${this.currentPage === totalPages ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    // Sort
    this.element.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-key')!;
        if (this.sortColumn === key) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = key;
          this.sortDirection = 'asc';
        }
        this.applyFilters();
        this.currentPage = 1;
        this.render();
      });
    });

    // Search
    const searchInput = this.element.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      let debounce: number;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = window.setTimeout(() => {
          this.applyFilters();
          this.currentPage = 1;
          this.render();
        }, 300);
      });
    }

    // Page size
    const pageSizeSelect = this.element.querySelector('.page-size-select') as HTMLSelectElement;
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', () => {
        this.pageSize = parseInt(pageSizeSelect.value, 10);
        this.currentPage = 1;
        this.render();
      });
    }

    // Pagination
    this.element.querySelector('#prev-page')?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
      }
    });

    this.element.querySelector('#next-page')?.addEventListener('click', () => {
      const totalPages = this.getTotalPages();
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.render();
      }
    });

    this.element.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.getAttribute('data-page')!, 10);
        this.render();
      });
    });

    // Row click
    if (this.config.onRowClick || this.config.onAction) {
      this.element.querySelectorAll('tbody tr[data-index]').forEach(tr => {
        tr.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('button, a, select, input')) return;
          const index = parseInt(tr.getAttribute('data-index')!, 10);
          const row = this.getPaginatedData()[index];
          if (this.config.onRowClick) {
            this.config.onRowClick(row, index);
          }
        });
      });
    }
  }

  private staggerRows(): void {
    const rows = this.element.querySelectorAll('tbody tr.stagger-item');
    rows.forEach((row, index) => {
      (row as HTMLElement).style.animationDelay = `${index * 50}ms`;
    });
  }

  public updateData(data: T[]): void {
    this.config.data = data;
    this.applyFilters();
    this.currentPage = 1;
    this.render();
  }

  public destroy(): void {
    this.element.remove();
  }
}