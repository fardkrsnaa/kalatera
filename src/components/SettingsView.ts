import { getSettings, saveSettings, clearAllData } from '../core/storage';
import { showToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { store } from '../core/store';

export class SettingsView {
  public element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'stagger-item';
    this.render();
  }

  private render(): void {
    const settings = getSettings();

    this.element.innerHTML = `
      <div class="fade-in-up" style="animation-delay: 0.1s;">
        <div class="card" style="max-width: 600px; margin: 0 auto;">
          <h2 style="font-size: var(--text-2xl); font-weight: 600; margin-bottom: var(--spacing-6);">Pengaturan</h2>
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
      </div>
    `;

    this.element.querySelector('#default-break')!.addEventListener('change', () => this.saveSettings());
    this.element.querySelector('#default-hours')!.addEventListener('change', () => this.saveSettings());
    this.element.querySelector('#btn-clear-data')!.addEventListener('click', () => this.clearAllData());
  }

  private saveSettings(): void {
    const breakMinutes = parseInt((this.element.querySelector('#default-break') as HTMLInputElement).value, 10);
    const normalHours = parseFloat((this.element.querySelector('#default-hours') as HTMLInputElement).value);

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
  }

  private clearAllData(): void {
    const dialog = new ConfirmDialog('Apakah Anda yakin ingin menghapus SEMUA data absensi dan foto? Tindakan ini tidak dapat dibatalkan.');
    dialog.onConfirm(() => {
      clearAllData();
      store.notify();
      showToast('Semua data berhasil dihapus', 'success');
      this.render(); // Re-render to show defaults
    });
    dialog.open();
  }
}