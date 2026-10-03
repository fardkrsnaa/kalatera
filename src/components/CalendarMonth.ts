import { getAllRecords } from '../core/storage';
import { computeDuration } from '../core/calc';
import { getDaysInMonth, getFirstDayOfMonth } from '../core/date';
import { formatDuration } from '../utils/format';
import { store } from '../core/store';
import { exportToExcel } from '../core/export';
import { showToast } from './Toast';

export class CalendarMonth {
  private container: HTMLDivElement;
  private currentYear: number;
  private currentMonth: number;

  constructor() {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.container = document.createElement('div');
    this.render();

    store.subscribe(() => this.render());
  }

  private render(): void {
    const records = getAllRecords();
    const daysInMonth = getDaysInMonth(this.currentYear, this.currentMonth);
    const firstDay = getFirstDayOfMonth(this.currentYear, this.currentMonth);

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    let totalWorkDays = 0;
    let totalOffDays = 0;
    let totalWorkMinutes = 0;
    let totalOvertimeMinutes = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = records[dateStr];
      
      if (record) {
        if (record.status === 'OFF') {
          totalOffDays++;
        } else if (record.clockIn && record.clockOut) {
          totalWorkDays++;
          const duration = computeDuration(record);
          totalWorkMinutes += duration.workMinutes;
          totalOvertimeMinutes += duration.overtimeMinutes;
        }
      }
    }

    const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const calendarGrid: string[] = [];
    
    const today = new Date();
    const isCurrentMonth = this.currentYear === today.getFullYear() && this.currentMonth === today.getMonth();

    for (let i = 0; i < firstDay; i++) {
      calendarGrid.push('<div class="day-cell empty"></div>');
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = records[dateStr];
      const dayOfWeek = new Date(this.currentYear, this.currentMonth, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = isCurrentMonth && day === today.getDate();
      
      let cellClass = 'day-cell';
      if (isWeekend) cellClass += ' weekend';
      if (isToday) cellClass += ' today';
      let cellContent = `<div class="day-number">${day}</div>`;

      if (record) {
        cellClass += ` has-record status-${record.status.toLowerCase()}`;
        
        if (record.status === 'OFF') {
          cellContent += '<div class="day-badge badge badge-off">Libur</div>';
        } else if (record.clockIn && record.clockOut) {
          const duration = computeDuration(record);
          cellContent += `
            <div class="day-time">${record.clockIn.time.slice(0, 5)} - ${record.clockOut.time.slice(0, 5)}</div>
            <div class="day-duration">${formatDuration(duration.workMinutes)}</div>
          `;
          if (duration.overtimeMinutes > 0) {
            cellContent += `<div class="day-overtime">+${formatDuration(duration.overtimeMinutes)} OT</div>`;
          }
        } else if (record.clockIn) {
          cellContent += '<div class="day-badge badge badge-work">Sedang Bekerja</div>';
        }
      }

      calendarGrid.push(`<div class="${cellClass}" data-date="${dateStr}">${cellContent}</div>`);
    }

    this.container.className = 'card';
    this.container.innerHTML = `
      <div class="calendar-header">
        <div class="calendar-nav">
          <button class="btn btn-secondary btn-icon" id="btn-prev-month" aria-label="Bulan Sebelumnya">‹</button>
          <button class="btn btn-secondary" id="btn-today">Hari Ini</button>
          <button class="btn btn-secondary btn-icon" id="btn-next-month" aria-label="Bulan Berikutnya">›</button>
        </div>
        <h2>${monthNames[this.currentMonth]} ${this.currentYear}</h2>
        <button class="btn btn-primary" id="btn-export">📥 Excel</button>
      </div>

      <div class="calendar-summary">
        <div class="calendar-summary-grid">
          <div class="summary-item">
            <div class="summary-label">Hari Kerja</div>
            <div class="summary-value">${totalWorkDays}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Hari Libur</div>
            <div class="summary-value">${totalOffDays}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Jam Kerja</div>
            <div class="summary-value primary">${formatDuration(totalWorkMinutes)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Lembur</div>
            <div class="summary-value danger">${formatDuration(totalOvertimeMinutes)}</div>
          </div>
        </div>
      </div>

      <div class="calendar-grid">
        <div class="day-labels">
          ${dayLabels.map(label => `<div class="day-label">${label}</div>`).join('')}
        </div>
        <div class="days-grid">
          ${calendarGrid.join('')}
        </div>
      </div>
    `;

    this.container.querySelector('#btn-prev-month')!.addEventListener('click', () => this.prevMonth());
    this.container.querySelector('#btn-next-month')!.addEventListener('click', () => this.nextMonth());
    this.container.querySelector('#btn-today')!.addEventListener('click', () => this.goToday());
    this.container.querySelector('#btn-export')!.addEventListener('click', () => this.exportExcel());

    this.container.querySelectorAll('.day-cell.has-record').forEach((cell) => {
      cell.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const date = target.dataset.date;
        if (date) {
          this.showDayDetail(date);
        }
      });
    });
  }

  private prevMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.render();
  }

  private nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.render();
  }

  private goToday(): void {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.render();
  }

  private showDayDetail(date: string): void {
    const event = new CustomEvent('showDayDetail', { detail: { date } });
    window.dispatchEvent(event);
  }

  private async exportExcel(): Promise<void> {
    const btn = this.container.querySelector('#btn-export') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Mengekspor...';

    try {
      await exportToExcel({
        year: this.currentYear,
        month: this.currentMonth,
      });
      showToast('File Excel berhasil diunduh', 'success');
    } catch (error) {
      showToast('Gagal mengekspor Excel', 'error');
      console.error(error);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '📥 Simpan ke Excel';
    }
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  destroy(): void {
    this.container.remove();
  }
}
