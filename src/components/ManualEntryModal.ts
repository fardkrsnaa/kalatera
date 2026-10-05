import { saveRecord, getSettings, type Status, type DayRecord } from '../core/storage';
import { showToast } from './Toast';
import { store } from '../core/store';
import { validateTime12h, validateBreakMinutes, validateNormalHours } from '../utils/validators';
import { TimeInput12h } from './TimeInput12h';

export class ManualEntryModal {
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
    const settings = getSettings();

    this.container.className = 'modal-overlay';
    this.container.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Input Manual — ${this.date}</h2>
          <button class="btn-close" aria-label="Tutup">✕</button>
        </div>
        <div class="modal-body">
          <form id="manual-entry-form">
            <div class="form-group">
              <label class="form-label" for="manual-status">Status</label>
              <select id="manual-status" class="form-select" required>
                <option value="WORK" selected>Kerja</option>
                <option value="OFF">Libur</option>
                <option value="IZIN">Izin</option>
                <option value="MIDDLE">Middle</option>
                <option value="OVERTIME">Lembur</option>
              </select>
            </div>

            <div id="manual-time-fields">
              <div class="form-group" id="manual-clock-in-group"></div>
              <div class="form-group" id="manual-clock-out-group"></div>

              <div class="form-group">
                <label class="form-label" for="manual-break">Istirahat (menit)</label>
                <input type="number" id="manual-break" class="form-input" value="${settings.defaultBreakMinutes}" min="0" max="480" required />
              </div>

              <div class="form-group">
                <label class="form-label" for="manual-normal">Jam Normal (jam/hari)</label>
                <input type="number" id="manual-normal" class="form-input" value="${settings.defaultNormalHours}" min="1" max="24" step="0.5" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="manual-note">Catatan</label>
              <textarea id="manual-note" class="form-textarea" placeholder="Catatan opsional..."></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="manual-btn-cancel">Batal</button>
          <button class="btn btn-primary" id="manual-btn-save">Simpan</button>
        </div>
      </div>
    `;

    this.clockInInput = new TimeInput12h({ label: 'Jam Masuk', namePrefix: 'manual-clock-in' });
    this.clockOutInput = new TimeInput12h({ label: 'Jam Keluar', namePrefix: 'manual-clock-out' });
    this.clockInInput.mount(this.container.querySelector('#manual-clock-in-group')!);
    this.clockOutInput.mount(this.container.querySelector('#manual-clock-out-group')!);

    const statusSelect = this.container.querySelector('#manual-status') as HTMLSelectElement;
    const timeFields = this.container.querySelector('#manual-time-fields') as HTMLDivElement;

    statusSelect.addEventListener('change', () => {
      const v = statusSelect.value;
      timeFields.style.display = v === 'OFF' || v === 'IZIN' ? 'none' : 'block';
    });

    this.container.querySelector('.btn-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#manual-btn-cancel')!.addEventListener('click', () => this.close());
    this.container.querySelector('#manual-btn-save')!.addEventListener('click', () => this.save());

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.close();
    });
  }

  private save(): void {
    const status = (this.container.querySelector('#manual-status') as HTMLSelectElement).value as Status;
    const clockInVal = this.clockInInput?.getValue() ?? '';
    const clockOutVal = this.clockOutInput?.getValue() ?? '';
    const breakMinutes = parseInt((this.container.querySelector('#manual-break') as HTMLInputElement).value, 10);
    const normalHours = parseFloat((this.container.querySelector('#manual-normal') as HTMLInputElement).value);
    const note = (this.container.querySelector('#manual-note') as HTMLTextAreaElement).value.trim();

    if (status === 'OFF' || status === 'IZIN') {
      const breakError = validateBreakMinutes(breakMinutes);
      if (breakError) { showToast(breakError, 'error'); return; }
      const normalError = validateNormalHours(normalHours);
      if (normalError) { showToast(normalError, 'error'); return; }

      const record: DayRecord = {
        date: this.date,
        status,
        breakMinutes,
        normalHours,
        note: note || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveRecord(record);
      store.notify();
      showToast('Absensi manual berhasil disimpan', 'success');
      this.close();
      return;
    }

    if (!validateTime12h(clockInVal)) {
      showToast('Jam masuk wajib diisi', 'error');
      return;
    }

    if (clockOutVal && !validateTime12h(clockOutVal)) {
      showToast('Format jam keluar tidak valid (hh:mm:ss AM/PM)', 'error');
      return;
    }

    const breakError = validateBreakMinutes(breakMinutes);
    if (breakError) { showToast(breakError, 'error'); return; }

    const normalError = validateNormalHours(normalHours);
    if (normalError) { showToast(normalError, 'error'); return; }

    const record: DayRecord = {
      date: this.date,
      status,
      clockIn: {
        time: clockInVal,
        photoId: 'manual-entry',
        lat: 0,
        lon: 0,
        address: 'Manual Entry',
      },
      breakMinutes,
      normalHours,
      note: note || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (clockOutVal && validateTime12h(clockOutVal)) {
      record.clockOut = {
        time: clockOutVal,
        photoId: 'manual-entry',
        lat: 0,
        lon: 0,
        address: 'Manual Entry',
      };
    }

    saveRecord(record);
    store.notify();
    showToast('Absensi manual berhasil disimpan', 'success');
    this.close();
  }

  open(): void {
    document.body.appendChild(this.container);
  }

  private close(): void {
    this.container.remove();
  }
}
