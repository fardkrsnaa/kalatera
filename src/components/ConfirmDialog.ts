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
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2>Konfirmasi</h2>
        </div>
        <div class="modal-body">
          <p>${this.message}</p>
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
