import { getRecord, saveRecord, type Status } from '../core/storage';
import { showToast } from './Toast';
import { store } from '../core/store';
import { validateClockTimes, validateBreakMinutes, validateNormalHours } from '../utils/validators';

export class EditModal {
  private container: HTMLDivElement;
  private date: string;

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

    const clockInTime = record.clockIn?.time || '';
    const clockOutTime = record.clockOut?.time || '';

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
                <option value="MIDDLE" ${record.status === 'MIDDLE' ? 'selected' : ''}>Middle</option>
                <option value="OVERTIME" ${record.status === 'OVERTIME' ? 'selected' : ''}>Lembur</option>
              </select>
            </div>

            <div id="time-fields" style="${record.status === 'OFF' ? 'display: none;' : ''}">
              <div class="form-group">
                <label class="form-label" for="clock-in">Jam Masuk (HH:mm:ss)</label>
                <input type="text" id="clock-in" class="form-input" value="${clockInTime}" placeholder="08:00:00" />
              </div>

              <div class="form-group">
                <label class="form-label" for="clock-out">Jam Keluar (HH:mm:ss)</label>
                <input type="text" id="clock-out" class="form-input" value="${clockOutTime}" placeholder="16:00:00" />
              </div>

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

    const statusSelect = this.container.querySelector('#status') as HTMLSelectElement;
    const timeFields = this.container.querySelector('#time-fields') as HTMLDivElement;

    statusSelect.addEventListener('change', () => {
      timeFields.style.display = statusSelect.value === 'OFF' ? 'none' : 'block';
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
    const clockInInput = (this.container.querySelector('#clock-in') as HTMLInputElement).value.trim();
    const clockOutInput = (this.container.querySelector('#clock-out') as HTMLInputElement).value.trim();
    const breakMinutes = parseInt((this.container.querySelector('#break-minutes') as HTMLInputElement).value, 10);
    const normalHours = parseFloat((this.container.querySelector('#normal-hours') as HTMLInputElement).value);
    const note = (this.container.querySelector('#note') as HTMLTextAreaElement).value.trim();

    if (status === 'OFF') {
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

    const timeError = validateClockTimes(clockInInput, clockOutInput);
    if (timeError) {
      showToast(timeError, 'error');
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

    if (!clockInInput) {
      showToast('Jam masuk wajib diisi', 'error');
      return;
    }

    record.status = status;
    record.breakMinutes = breakMinutes;
    record.normalHours = normalHours;
    record.note = note || undefined;
    record.updatedAt = Date.now();

    if (clockInInput && record.clockIn) {
      record.clockIn.time = clockInInput;
    }

    if (clockOutInput && record.clockOut) {
      record.clockOut.time = clockOutInput;
    } else if (clockOutInput && record.clockIn) {
      record.clockOut = {
        time: clockOutInput,
        photoId: 'manual-edit',
        lat: record.clockIn.lat,
        lon: record.clockIn.lon,
        address: record.clockIn.address,
      };
    } else {
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
