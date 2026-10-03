import { getSettings, saveSettings, clearAllData } from '../core/storage';
import { showToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { store } from '../core/store';

export class SettingsModal {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.render();
  }

  private render(): void {
    const settings = getSettings();

    this.container.className = 'modal-overlay';
    this.container.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 style="font-size: var(--text-xl);">Pengaturan</h2>
          <button class="btn-close" aria-label="Tutup">✕</button>
        </div>
        <div class="modal-body">
          <form id="settings-form">
            <div class="form-group">
              <label class="form-label" for="default-break">Istirahat Default (menit)</label>
              <input type="number" id="default-break" class="form-input" value="${settings.defaultBreakMinutes}" min="0" max="480" required />
              <p class="form-helper">Waktu istirahat default untuk record baru</p>
            </div>

            <div class="form-group">
              <label class="form-label" for="default-hours">Jam Normal Default (jam)</label>
              <input type="number" id="default-hours" class="form-input" value="${settings.defaultNormalHours}" min="1" max="24" step="0.5" required />
              <p class="form-helper">Jam kerja normal per hari (batas sebelum dihitung lembur)</p>
            </div>

            <div class="divider"></div>

            <div class="form-group" style="margin-bottom: 0;">
              <button type="button" class="btn btn-danger" id="btn-clear-data" style="width: 100%;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Hapus Semua Data
              </button>
              <p class="form-helper">Menghapus semua record absensi dan foto. Tindakan ini tidak dapat dibatalkan.</p>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel">Batal</button>
          <button class="btn btn-primary" id="btn-save">Simpan</button>
        </div>
      </div>
    `;

    this.container.querySelector('.btn-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-cancel')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-save')!.addEventListener('click', () => this.save());
    this.container.querySelector('#btn-clear-data')!.addEventListener('click', () => this.clearAllData());

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
  }

  private save(): void {
    const breakMinutes = parseInt((this.container.querySelector('#default-break') as HTMLInputElement).value, 10);
    const normalHours = parseFloat((this.container.querySelector('#default-hours') as HTMLInputElement).value);

    if (breakMinutes < 0 || breakMinutes > 480) {
      showToast('Istirahat harus 0-480 menit', 'error');
      return;
    }

    if (normalHours <= 0 || normalHours > 24) {
      showToast('Jam normal harus 1-24 jam', 'error');
      return;
    }

    saveSettings({
      defaultBreakMinutes: breakMinutes,
      defaultNormalHours: normalHours,
    });

    showToast('Pengaturan berhasil disimpan', 'success');
    this.close();
  }

  private clearAllData(): void {
    const dialog = new ConfirmDialog('Apakah Anda yakin ingin menghapus SEMUA data absensi dan foto? Tindakan ini tidak dapat dibatalkan.');
    dialog.onConfirm(() => {
      clearAllData();
      store.notify();
      showToast('Semua data berhasil dihapus', 'success');
      this.close();
    });
    dialog.open();
  }

  open(): void {
    document.body.appendChild(this.container);
  }

  private close(): void {
    this.container.remove();
  }
}
