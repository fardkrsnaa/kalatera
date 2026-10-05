import { getMonthlySummary } from '../core/calc';
import { exportAdminSummary } from '../core/export';
import { formatDuration, formatDecimal } from '../utils/format';
import { showToast } from './Toast';
import { store } from '../core/store';

export class AdminSummaryView {
  public element: HTMLElement;
  private currentYear: number;
  private currentMonth: number;

  constructor() {
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth();
    this.element = document.createElement('div');
    this.element.className = 'stagger-item';
    this.render();
    store.subscribe(() => this.render());
  }

  private render(): void {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const s = getMonthlySummary(this.currentYear, this.currentMonth);

    this.element.innerHTML = `
      <div class="fade-in-up" style="animation-delay: 0.1s;">
        <div class="view-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-6); flex-wrap: wrap; gap: var(--spacing-4);">
          <div>
            <h2 style="font-size: var(--text-2xl); font-weight: 600;">Ringkasan Admin</h2>
            <p style="color: var(--color-text-secondary); font-size: var(--text-sm);">Rekap bulanan lembur &amp; izin</p>
          </div>
          <div style="display: flex; gap: var(--spacing-3); align-items: center; flex-wrap: wrap;">
            <select class="form-select" id="admin-month" style="width: auto;">
              ${Array.from({ length: 12 }, (_, i) => `<option value="${i}" ${i === this.currentMonth ? 'selected' : ''}>${monthNames[i]}</option>`).join('')}
            </select>
            <select class="form-select" id="admin-year" style="width: auto;">
              ${Array.from({ length: 5 }, (_, i) => this.currentYear - 2 + i).map(y => `<option value="${y}" ${y === this.currentYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
            <button class="btn btn-primary" id="btn-admin-export">📥 Export Admin</button>
          </div>
        </div>

        <p style="color: var(--color-text-secondary); font-size: var(--text-sm); margin-bottom: var(--spacing-6);">${monthNames[this.currentMonth]} ${this.currentYear}</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-4);">
          <div class="card">
            <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Total Jam Lembur</div>
            <div style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-danger); margin-top: var(--spacing-1);">${formatDuration(s.overtimeMinutes)}</div>
            <div style="font-size: var(--text-xs); color: var(--color-text-secondary);">${formatDecimal(s.overtimeMinutes)} jam</div>
          </div>
          <div class="card">
            <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Total Hari Izin</div>
            <div style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-warning); margin-top: var(--spacing-1);">${s.izinDays}</div>
            <div style="font-size: var(--text-xs); color: var(--color-text-secondary);">hari</div>
          </div>
          <div class="card">
            <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Hari Kerja</div>
            <div style="font-size: var(--text-2xl); font-weight: 700; margin-top: var(--spacing-1);">${s.workDays}</div>
            <div style="font-size: var(--text-xs); color: var(--color-text-secondary);">hari</div>
          </div>
          <div class="card">
            <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Hari Libur</div>
            <div style="font-size: var(--text-2xl); font-weight: 700; margin-top: var(--spacing-1);">${s.offDays}</div>
            <div style="font-size: var(--text-xs); color: var(--color-text-secondary);">hari</div>
          </div>
          <div class="card">
            <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">Total Jam Kerja</div>
            <div style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-primary); margin-top: var(--spacing-1);">${formatDuration(s.totalWorkMinutes)}</div>
            <div style="font-size: var(--text-xs); color: var(--color-text-secondary);">${formatDecimal(s.totalWorkMinutes)} jam</div>
          </div>
        </div>
      </div>
    `;

    this.element.querySelector('#admin-month')!.addEventListener('change', (e) => {
      this.currentMonth = parseInt((e.target as HTMLSelectElement).value, 10);
      this.render();
    });
    this.element.querySelector('#admin-year')!.addEventListener('change', (e) => {
      this.currentYear = parseInt((e.target as HTMLSelectElement).value, 10);
      this.render();
    });
    this.element.querySelector('#btn-admin-export')!.addEventListener('click', () => this.handleExport());
  }

  private async handleExport(): Promise<void> {
    const btn = this.element.querySelector('#btn-admin-export') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Mengekspor...';
    try {
      await exportAdminSummary({ year: this.currentYear, month: this.currentMonth });
      showToast('Rekap admin berhasil diunduh', 'success');
    } catch (e) {
      showToast('Gagal mengekspor rekap admin', 'error');
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.textContent = '📥 Export Admin';
    }
  }
}
