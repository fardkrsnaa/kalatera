import { getRecord, saveRecord, type Status } from '../core/storage';
import { showToast } from './Toast';
import { store } from '../core/store';
import { validateTime12h, validateBreakMinutes, validateNormalHours } from '../utils/validators';
import { TimeInput12h } from './TimeInput12h';

export class EditModal {
  private container: HTMLDivElement;
  private date: string;
  private clockInInput: TimeInput12h | null = null;
  private clockOutInput: TimeInput12h | null = null;

  constructor(date: string) {
    this.date = date;
    this.container = document.createElement('div');
    this.render();
  }

  private render(): void {
    const record = getRecord(this.date);

    if (!record) {
      this.close();
      return;
    }

    const clockInVal = record.clockIn?.time || '';
    const clockOutVal = record.clockOut?.time || '';

    this.container.className = 'modal-overlay';
    this.container.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Edit Absensi</h2>
          <button class="btn-close" aria-label="Tutup">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-form">
            <div class="form-group">
              <label class="form-label" for="status">Status</label>
              <select id="status" class="form-select" required>
                <option value="WORK" ${record.status === 'WORK' ? 'selected' : ''}>Kerja</option>
                <option value="OFF" ${record.status === 'OFF' ? 'selected' : ''}>Libur</option>
                <option value="IZIN" ${record.status === 'IZIN' ? 'selected' : ''}>Izin</option>
                <option value="MIDDLE" ${record.status === 'MIDDLE' ? 'selected' : ''}>Middle</option>
                <option value="OVERTIME" ${record.status === 'OVERTIME' ? 'selected' : ''}>Lembur</option>
              </select>
            </div>

            <div id="time-fields" style="${record.status === 'OFF' || record.status === 'IZIN' ? 'display: none;' : ''}">
              <div class="form-group" id="clock-in-group"></div>
              <div class="form-group" id="clock-out-group"></div>

              <div class="form-group">
                <label class="form-label" for="break-minutes">Istirahat (menit)</label>
                <input type="number" id="break-minutes" class="form-input" value="${record.breakMinutes}" min="0" max="480" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="normal-hours">Jam Normal (jam/hari)</label>
                <input type="number" id="normal-hours" class="form-input" value="${record.normalHours}" min="1" max="24" step="0.5" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="note">Catatan</label>
              <textarea id="note" class="form-textarea" placeholder="Catatan opsional...">${record.note || ''}</textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel">Batal</button>
          <button class="btn btn-primary" id="btn-save">Simpan</button>
        </div>
      </div>
    `;

    this.clockInInput = new TimeInput12h({ label: 'Jam Masuk', namePrefix: 'clock-in', value: clockInVal || undefined });
    this.clockOutInput = new TimeInput12h({ label: 'Jam Keluar', namePrefix: 'clock-out', value: clockOutVal || undefined });
    this.clockInInput.mount(this.container.querySelector('#clock-in-group')!);
    this.clockOutInput.mount(this.container.querySelector('#clock-out-group')!);

    const statusSelect = this.container.querySelector('#status') as HTMLSelectElement;
    const timeFields = this.container.querySelector('#time-fields') as HTMLDivElement;

    statusSelect.addEventListener('change', () => {
      const v = statusSelect.value;
      timeFields.style.display = v === 'OFF' || v === 'IZIN' ? 'none' : 'block';
    });

    this.container.querySelector('.btn-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-cancel')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-save')!.addEventListener('click', () => this.save());

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
  }

  private save(): void {
    const record = getRecord(this.date);
    if (!record) {
      this.close();
      return;
    }

    const status = (this.container.querySelector('#status') as HTMLSelectElement).value as Status;
    const clockInVal = this.clockInInput?.getValue() ?? '';
    const clockOutVal = this.clockOutInput?.getValue() ?? '';
    const breakMinutes = parseInt((this.container.querySelector('#break-minutes') as HTMLInputElement).value, 10);
    const normalHours = parseFloat((this.container.querySelector('#normal-hours') as HTMLInputElement).value);
    const note = (this.container.querySelector('#note') as HTMLTextAreaElement).value.trim();

    if (status === 'OFF' || status === 'IZIN') {
      record.status = status;
      record.clockIn = undefined;
      record.clockOut = undefined;
      record.breakMinutes = breakMinutes;
      record.normalHours = normalHours;
      record.note = note || undefined;
      record.updatedAt = Date.now();

      saveRecord(record);
      store.notify();
      showToast('Absensi berhasil diperbarui', 'success');
      this.close();
      return;
    }

    const hasClockInOut = clockInVal || clockOutVal;
    if (hasClockInOut && clockInVal && !validateTime12h(clockInVal)) {
      showToast('Format jam masuk tidak valid (hh:mm:ss AM/PM)', 'error');
      return;
    }
    if (clockOutVal && !validateTime12h(clockOutVal)) {
      showToast('Format jam keluar tidak valid (hh:mm:ss AM/PM)', 'error');
      return;
    }

    const breakError = validateBreakMinutes(breakMinutes);
    if (breakError) {
      showToast(breakError, 'error');
      return;
    }

    const normalError = validateNormalHours(normalHours);
    if (normalError) {
      showToast(normalError, 'error');
      return;
    }

    if (!clockInVal && !clockInInputEmptyAllowed(record)) {
      showToast('Jam masuk wajib diisi', 'error');
      return;
    }

    record.status = status;
    record.breakMinutes = breakMinutes;
    record.normalHours = normalHours;
    record.note = note || undefined;
    record.updatedAt = Date.now();

    if (clockInVal && record.clockIn) {
      record.clockIn.time = clockInVal;
    } else if (clockInVal && !record.clockIn) {
      record.clockIn = { time: clockInVal, photoId: 'manual-edit', lat: 0, lon: 0, address: 'Manual Edit' };
    }

    if (clockOutVal && record.clockOut) {
      record.clockOut.time = clockOutVal;
    } else if (clockOutVal && record.clockIn) {
      record.clockOut = {
        time: clockOutVal,
        photoId: 'manual-edit',
        lat: record.clockIn.lat,
        lon: record.clockIn.lon,
        address: record.clockIn.address,
      };
    } else if (!clockOutVal) {
      record.clockOut = undefined;
    }

    saveRecord(record);
    store.notify();
    showToast('Absensi berhasil diperbarui', 'success');
    this.close();
  }

  open(): void {
    document.body.appendChild(this.container);
  }

  private close(): void {
    this.container.remove();
  }
}

function clockInInputEmptyAllowed(record: { status: Status }): boolean {
  return record.status === 'OFF' || record.status === 'IZIN';
}
