import { getRecord, saveRecord, getSettings } from '../core/storage';
import { getToday, getCurrentTime } from '../core/date';
import { CameraModal, type CaptureResult } from './CameraModal';
import { PhotoOptionDialog } from './PhotoOptionDialog';
import { showToast } from './Toast';
import { store } from '../core/store';
import { formatDuration, formatDecimal } from '../utils/format';
import { getLiveMinutes } from '../core/calc';
import { getCurrentPosition } from '../core/geolocation';

export class ClockPanel {
  private container: HTMLDivElement;
  private timerInterval: number | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.render();
    this.startTimer();
    
    store.subscribe(() => this.render());
  }

  private render(): void {
    const today = getToday();
    const record = getRecord(today);

    const hasClockIn = record?.clockIn !== undefined;
    const hasClockOut = record?.clockOut !== undefined;

    let statusHtml = '';
    let statusBadge = '';
    
    if (!hasClockIn) {
      statusBadge = '<span class="badge badge-off">Belum Absen</span>';
      statusHtml = '<p style="color: var(--color-text-secondary); font-size: var(--text-sm); margin-top: var(--spacing-2);">Mulai hari kerja Anda dengan clock in</p>';
    } else if (hasClockIn && !hasClockOut && record.clockIn) {
      const liveMin = getLiveMinutes(record.clockIn.time);
      statusBadge = '<span class="badge badge-work badge-dot">Sedang Bekerja</span>';
      statusHtml = `
        <div style="margin: var(--spacing-6) 0;">
          <div style="font-size: var(--text-4xl); font-weight: 700; color: var(--color-primary); line-height: 1;">
            ${formatDuration(liveMin)}
          </div>
          <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--spacing-2);">
            ${formatDecimal(liveMin)} jam · Clock In: ${record.clockIn.time.slice(0, 5)}
          </div>
        </div>
      `;
    } else {
      statusBadge = '<span class="badge badge-work">Selesai</span>';
      statusHtml = '<p style="color: var(--color-text-secondary); font-size: var(--text-sm); margin-top: var(--spacing-2);">Absensi hari ini sudah lengkap</p>';
    }

    this.container.className = 'card card-elevated';
    this.container.style.cssText = 'background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%);';
    this.container.innerHTML = `
      <div style="text-align: center;">
        <h2 style="font-size: var(--text-2xl); font-weight: 600; margin-bottom: var(--spacing-3);">Absensi Hari Ini</h2>
        ${statusBadge}
        ${statusHtml}
        <div style="margin-top: var(--spacing-8); display: flex; flex-direction: column; gap: var(--spacing-3);">
          ${!hasClockIn ? `
            <select id="status-select" class="form-select" aria-label="Pilih Status" style="text-align: center; font-weight: 500;">
              <option value="WORK">🏢 Kerja</option>
              <option value="OFF">🏖️ Libur</option>
              <option value="MIDDLE">⏰ Middle</option>
              <option value="OVERTIME">🌙 Lembur</option>
            </select>
            <button class="btn btn-primary btn-lg" id="btn-clock-in" style="box-shadow: var(--shadow-primary);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Clock In
            </button>
          ` : ''}
          ${hasClockIn && !hasClockOut ? `
            <button class="btn btn-primary btn-lg" id="btn-clock-out" style="box-shadow: var(--shadow-primary);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Clock Out
            </button>
          ` : ''}
        </div>
      </div>
    `;

    const btnClockIn = this.container.querySelector('#btn-clock-in');
    if (btnClockIn) {
      btnClockIn.addEventListener('click', () => this.handleClockIn());
    }

    const btnClockOut = this.container.querySelector('#btn-clock-out');
    if (btnClockOut) {
      btnClockOut.addEventListener('click', () => this.handleClockOut());
    }
  }

  private async handleClockIn(): Promise<void> {
    const statusSelect = this.container.querySelector('#status-select') as HTMLSelectElement;
    const status = statusSelect.value as 'WORK' | 'OFF' | 'MIDDLE' | 'OVERTIME';

    if (status === 'OFF') {
      const today = getToday();
      const settings = getSettings();
      const record = {
        date: today,
        status: 'OFF' as const,
        breakMinutes: settings.defaultBreakMinutes,
        normalHours: settings.defaultNormalHours,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveRecord(record);
      store.notify();
      showToast('Status Libur disimpan', 'success');
      return;
    }

    const dialog = new PhotoOptionDialog('CLOCK IN');
    dialog.onPhoto(() => {
      this.openCameraForClockIn(status);
    });
    dialog.onNoPhoto(async () => {
      await this.saveClockInNoPhoto(status);
    });
    dialog.open();
  }

  private async openCameraForClockIn(status: 'WORK' | 'MIDDLE' | 'OVERTIME'): Promise<void> {
    const modal = new CameraModal('CLOCK IN');
    modal.onCapture((result: CaptureResult) => {
      this.saveClockIn(result, status);
    });
    await modal.open();
  }

  private async saveClockInNoPhoto(status: 'WORK' | 'MIDDLE' | 'OVERTIME'): Promise<void> {
    const today = getToday();
    const time = getCurrentTime();
    const settings = getSettings();
    const position = await getCurrentPosition();

    const record = {
      date: today,
      status,
      clockIn: {
        time,
        photoId: 'no-photo',
        lat: position.lat,
        lon: position.lon,
        address: position.address,
      },
      breakMinutes: settings.defaultBreakMinutes,
      normalHours: settings.defaultNormalHours,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveRecord(record);
    store.notify();
    showToast('Clock In berhasil (tanpa foto)', 'success');
  }

  private saveClockIn(result: CaptureResult, status: 'WORK' | 'MIDDLE' | 'OVERTIME'): void {
    const today = getToday();
    const time = getCurrentTime();
    const settings = getSettings();

    const record = {
      date: today,
      status,
      clockIn: {
        time,
        photoId: result.photoId,
        lat: result.lat,
        lon: result.lon,
        address: result.address,
      },
      breakMinutes: settings.defaultBreakMinutes,
      normalHours: settings.defaultNormalHours,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveRecord(record);
    store.notify();
    showToast('Clock In berhasil', 'success');
  }

  private async handleClockOut(): Promise<void> {
    const dialog = new PhotoOptionDialog('CLOCK OUT');
    dialog.onPhoto(() => {
      this.openCameraForClockOut();
    });
    dialog.onNoPhoto(async () => {
      await this.saveClockOutNoPhoto();
    });
    dialog.open();
  }

  private async openCameraForClockOut(): Promise<void> {
    const modal = new CameraModal('CLOCK OUT');
    modal.onCapture((result: CaptureResult) => {
      this.saveClockOut(result);
    });
    await modal.open();
  }

  private async saveClockOutNoPhoto(): Promise<void> {
    const today = getToday();
    const time = getCurrentTime();
    const record = getRecord(today);

    if (!record || !record.clockIn) {
      showToast('Clock In belum dilakukan', 'error');
      return;
    }

    const position = await getCurrentPosition();

    record.clockOut = {
      time,
      photoId: 'no-photo',
      lat: position.lat,
      lon: position.lon,
      address: position.address,
    };
    record.updatedAt = Date.now();

    saveRecord(record);
    store.notify();
    showToast('Clock Out berhasil (tanpa foto)', 'success');
  }

  private saveClockOut(result: CaptureResult): void {
    const today = getToday();
    const time = getCurrentTime();
    const record = getRecord(today);

    if (!record || !record.clockIn) {
      showToast('Clock In belum dilakukan', 'error');
      return;
    }

    record.clockOut = {
      time,
      photoId: result.photoId,
      lat: result.lat,
      lon: result.lon,
      address: result.address,
    };
    record.updatedAt = Date.now();

    saveRecord(record);
    store.notify();
    showToast('Clock Out berhasil', 'success');
  }

  private startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = window.setInterval(() => {
      const today = getToday();
      const record = getRecord(today);
      if (record?.clockIn && !record.clockOut) {
        this.render();
      }
    }, 1000);
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  destroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.container.remove();
  }
}
