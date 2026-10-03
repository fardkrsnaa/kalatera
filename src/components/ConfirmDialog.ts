import { deleteRecord, getRecord } from '../core/storage';
import { showToast } from './Toast';
import { store } from '../core/store';
import { deletePhoto } from '../core/idb';

export class ConfirmDialog {
  private container: HTMLDivElement;
  private message: string;
  private onConfirmCallback: (() => void) | null = null;

  constructor(message: string) {
    this.message = message;
    this.container = document.createElement('div');
    this.render();
  }

  private render(): void {
    this.container.className = 'modal-overlay';
    this.container.innerHTML = `
      <div class="modal" style="max-width: 440px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: var(--spacing-3);">
            <div style="
              width: 40px; 
              height: 40px; 
              background: var(--color-danger-light); 
              border-radius: var(--radius-full); 
              display: flex; 
              align-items: center; 
              justify-content: center;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 style="font-size: var(--text-xl);">Konfirmasi</h2>
          </div>
        </div>
        <div class="modal-body">
          <p style="color: var(--color-text-secondary); line-height: 1.6;">${this.message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel">Batal</button>
          <button class="btn btn-danger" id="btn-confirm">Hapus</button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-cancel')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-confirm')!.addEventListener('click', () => {
      if (this.onConfirmCallback) {
        this.onConfirmCallback();
      }
      this.close();
    });

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
  }

  open(): void {
    document.body.appendChild(this.container);
  }

  private close(): void {
    this.container.remove();
  }

  onConfirm(callback: () => void): void {
    this.onConfirmCallback = callback;
  }
}

export async function deleteRecordWithConfirm(date: string): Promise<void> {
  const record = getRecord(date);
  if (!record) {
    showToast('Record tidak ditemukan', 'error');
    return;
  }

  const dialog = new ConfirmDialog('Apakah Anda yakin ingin menghapus absensi ini?');
  dialog.onConfirm(async () => {
    if (record.clockIn && record.clockIn.photoId !== 'no-photo') {
      await deletePhoto(record.clockIn.photoId).catch(() => {});
    }
    if (record.clockOut && record.clockOut.photoId !== 'no-photo') {
      await deletePhoto(record.clockOut.photoId).catch(() => {});
    }

    deleteRecord(date);
    store.notify();
    showToast('Absensi berhasil dihapus', 'success');
  });
  dialog.open();
}
