import { getAllRecords } from '../core/storage';
import { computeDuration } from '../core/calc';
import { detectShift, getShiftBadgeClass, type Shift } from '../core/shift';
import { formatDuration } from '../utils/format';
import { formatTime12hShort } from '../utils/validators';
import { DataTable } from './DataTable';
import { DetailModal } from './DetailModal';
import { EditModal } from './EditModal';
import { deleteRecordWithConfirm } from './ConfirmDialog';
import { store } from '../core/store';

interface TableRow {
  date: string;
  day: string;
  status: string;
  clockIn: string;
  clockOut: string;
  workMinutes: number;
  overtimeMinutes: number;
  shift: Shift;
  note?: string;
  originalRecord: any;
}

export class DataAbsensiView {
  public element: HTMLElement;
  private table: DataTable<TableRow> | null = null;
  private currentYear: number;
  private currentMonth: number;

  constructor() {
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth();
    this.element = document.createElement('div');
    this.element.className = 'stagger-item';
    this.render();
    store.subscribe(() => this.refreshTable());
  }

  private render(): void {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    this.element.innerHTML = `
      <div class="fade-in-up" style="animation-delay: 0.1s;">
        <div class="view-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-6); flex-wrap: wrap; gap: var(--spacing-4);">
          <div>
            <h2 style="font-size: var(--text-2xl); font-weight: 600;">Data Absensi</h2>
            <p style="color: var(--color-text-secondary); font-size: var(--text-sm);">Kelola dan lihat riwayat absensi</p>
          </div>
          <div style="display: flex; gap: var(--spacing-3); align-items: center;">
            <select class="form-select" id="month-select" style="width: auto;">
              ${Array.from({ length: 12 }, (_, i) => `
                <option value="${i}" ${i === this.currentMonth ? 'selected' : ''}>${monthNames[i]}</option>
              `).join('')}
            </select>
            <select class="form-select" id="year-select" style="width: auto;">
              ${Array.from({ length: 5 }, (_, i) => this.currentYear - 2 + i).map(y => `
                <option value="${y}" ${y === this.currentYear ? 'selected' : ''}>${y}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div id="table-container"></div>
      </div>
    `;

    this.element.querySelector('#month-select')!.addEventListener('change', (e) => {
      this.currentMonth = parseInt((e.target as HTMLSelectElement).value, 10);
      this.refreshTable();
    });

    this.element.querySelector('#year-select')!.addEventListener('change', (e) => {
      this.currentYear = parseInt((e.target as HTMLSelectElement).value, 10);
      this.refreshTable();
    });

    this.refreshTable();
  }

  private refreshTable(): void {
    const records = getAllRecords();
    const rows: TableRow[] = [];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    for (let day = 1; day <= new Date(this.currentYear, this.currentMonth + 1, 0).getDate(); day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = records[dateStr];
      const dayOfWeek = new Date(this.currentYear, this.currentMonth, day).getDay();

      if (!record) continue;

      let statusLabel = '';
      let clockIn = '-';
      let clockOut = '-';
      let workMinutes = 0;
      let overtimeMinutes = 0;
      let shift: Shift = 'Pagi';

      if (record.status === 'OFF') {
        statusLabel = 'Libur';
      } else if (record.status === 'IZIN') {
        statusLabel = 'Izin';
      } else if (record.clockIn && record.clockOut) {
        const duration = computeDuration(record);
        statusLabel = 'Hadir';
        clockIn = formatTime12hShort(record.clockIn.time);
        clockOut = formatTime12hShort(record.clockOut.time);
        workMinutes = duration.workMinutes;
        overtimeMinutes = duration.overtimeMinutes;
        shift = detectShift(record.clockIn.time);
      } else if (record.clockIn) {
        statusLabel = 'Sedang Bekerja';
        clockIn = formatTime12hShort(record.clockIn.time);
        shift = detectShift(record.clockIn.time);
      } else {
        statusLabel = 'Belum Clock In';
      }

      rows.push({
        date: dateStr,
        day: dayNames[dayOfWeek],
        status: statusLabel,
        clockIn,
        clockOut,
        workMinutes,
        overtimeMinutes,
        shift,
        note: record.note,
        originalRecord: record
      });
    }

    rows.sort((a, b) => b.date.localeCompare(a.date));

    if (this.table) {
      this.table.updateData(rows);
    } else {
      this.table = new DataTable<TableRow>({
        columns: [
          { key: 'day', header: 'Hari', width: '80px' },
          { key: 'date', header: 'Tanggal', width: '120px' },
          { key: 'status', header: 'Status', width: '140px', render: (row) => this.renderStatus(row) },
          { key: 'clockIn', header: 'Jam Masuk', width: '130px' },
          { key: 'clockOut', header: 'Jam Pulang', width: '130px' },
          { key: 'workMinutes', header: 'Jam Kerja', width: '130px', render: (row) => formatDuration(row.workMinutes) },
          { key: 'overtimeMinutes', header: 'Lembur', width: '110px', render: (row) => row.overtimeMinutes > 0 ? `+${formatDuration(row.overtimeMinutes)}` : '-' },
          { key: 'shift', header: 'Shift', width: '110px', render: (row) => this.renderShiftBadge(row) },
        ],
        data: rows,
        sortable: true,
        filterable: true,
        paginated: true,
        pageSize: 15,
        pageSizes: [10, 15, 25, 50],
        emptyMessage: `Belum ada absensi untuk ${new Date(this.currentYear, this.currentMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
        onRowClick: (row) => this.openDetail(row),
        onAction: (action, row) => this.handleAction(action, row)
      });
      this.element.querySelector('#table-container')!.appendChild(this.table.element);
    }
  }

  private renderStatus(row: TableRow): string {
    const statusClass = row.status === 'Libur' ? 'badge-off' :
                        row.status === 'Izin' ? 'badge-izin' :
                        row.status === 'Sedang Bekerja' ? 'badge-work' : 'badge-work';
    return `<span class="badge ${statusClass}">${row.status}</span>`;
  }

  private renderShiftBadge(row: TableRow): string {
    if (row.status === 'Libur' || row.status === 'Belum Clock In') {
      return '<span style="color: var(--color-text-tertiary);">-</span>';
    }
    const badgeClass = getShiftBadgeClass(row.shift);
    return `<span class="badge ${badgeClass} badge-dot">${row.shift}</span>`;
  }

  private openDetail(row: TableRow): void {
    const modal = new DetailModal(row.date);
    modal.open();
  }

  private handleAction(action: string, row: TableRow): void {
    if (action === 'edit') {
      const modal = new EditModal(row.date);
      modal.open();
    } else if (action === 'delete') {
      deleteRecordWithConfirm(row.date);
    }
  }

  destroy(): void {
    this.table?.destroy();
  }
}
