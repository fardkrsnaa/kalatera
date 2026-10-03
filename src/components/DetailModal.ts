import { getRecord } from '../core/storage';
import { computeDuration } from '../core/calc';
import { formatDuration, formatDecimal, formatDateTime } from '../utils/format';
import { getPhoto } from '../core/idb';
import { parseDate } from '../core/date';
import { EditModal } from './EditModal';
import { deleteRecordWithConfirm } from './ConfirmDialog';

export class DetailModal {
  private container: HTMLDivElement;
  private date: string;

  constructor(date: string) {
    this.date = date;
    this.container = document.createElement('div');
    this.render();
  }

  private async render(): Promise<void> {
    const record = getRecord(this.date);
    
    if (!record) {
      this.close();
      return;
    }

    const dateObj = parseDate(this.date);
    const duration = computeDuration(record);

    let photosHtml = '';
    
    if (record.clockIn) {
      const photo = record.clockIn.photoId !== 'no-photo' ? await getPhoto(record.clockIn.photoId) : null;
      const photoUrl = photo ? URL.createObjectURL(photo.blob) : '';
      photosHtml += `
        <div style="margin-bottom: var(--spacing-md);">
          <h3 style="margin-bottom: var(--spacing-sm);">Clock In</h3>
          ${photoUrl ? `<img src="${photoUrl}" style="max-width: 100%; border-radius: var(--radius-md); margin-bottom: var(--spacing-xs);" />` : '<p style="font-size: 0.875rem; color: var(--color-text-secondary); font-style: italic;">Tanpa foto</p>'}
          <p style="font-size: 0.875rem;"><strong>Waktu:</strong> ${record.clockIn.time}</p>
          <p style="font-size: 0.875rem;"><strong>Lokasi:</strong> ${record.clockIn.address}</p>
          <p style="font-size: 0.75rem; color: var(--color-text-secondary);">Koordinat: ${record.clockIn.lat.toFixed(6)}, ${record.clockIn.lon.toFixed(6)}</p>
        </div>
      `;
    }

    if (record.clockOut) {
      const photo = record.clockOut.photoId !== 'no-photo' ? await getPhoto(record.clockOut.photoId) : null;
      const photoUrl = photo ? URL.createObjectURL(photo.blob) : '';
      photosHtml += `
        <div style="margin-bottom: var(--spacing-md);">
          <h3 style="margin-bottom: var(--spacing-sm);">Clock Out</h3>
          ${photoUrl ? `<img src="${photoUrl}" style="max-width: 100%; border-radius: var(--radius-md); margin-bottom: var(--spacing-xs);" />` : '<p style="font-size: 0.875rem; color: var(--color-text-secondary); font-style: italic;">Tanpa foto</p>'}
          <p style="font-size: 0.875rem;"><strong>Waktu:</strong> ${record.clockOut.time}</p>
          <p style="font-size: 0.875rem;"><strong>Lokasi:</strong> ${record.clockOut.address}</p>
          <p style="font-size: 0.75rem; color: var(--color-text-secondary);">Koordinat: ${record.clockOut.lat.toFixed(6)}, ${record.clockOut.lon.toFixed(6)}</p>
        </div>
      `;
    }

    this.container.className = 'modal-overlay';
    this.container.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h2>Detail Absensi</h2>
          <button class="btn-close" aria-label="Tutup">✕</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <div style="margin-bottom: var(--spacing-md);">
            <p style="font-size: 1.25rem; font-weight: 600;">${formatDateTime(dateObj)}</p>
            <div class="badge badge-${record.status.toLowerCase()}" style="margin-top: var(--spacing-xs);">
              ${record.status === 'WORK' ? 'Kerja' : record.status === 'OFF' ? 'Libur' : record.status === 'MIDDLE' ? 'Middle' : 'Lembur'}
            </div>
          </div>

          ${record.status !== 'OFF' ? `
            <div style="background: var(--color-surface); padding: var(--spacing-md); border-radius: var(--radius-md); margin-bottom: var(--spacing-md);">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md);">
                <div>
                  <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Jam Kerja</div>
                  <div style="font-size: 1.25rem; font-weight: 600;">${formatDuration(duration.workMinutes)}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${formatDecimal(duration.workMinutes)} jam</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Lembur</div>
                  <div style="font-size: 1.25rem; font-weight: 600; color: var(--color-danger);">${formatDuration(duration.overtimeMinutes)}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${formatDecimal(duration.overtimeMinutes)} jam</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Istirahat</div>
                  <div style="font-size: 1rem; font-weight: 600;">${record.breakMinutes} menit</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: var(--color-text-secondary);">Jam Normal</div>
                  <div style="font-size: 1rem; font-weight: 600;">${record.normalHours} jam</div>
                </div>
              </div>
            </div>
          ` : ''}

          ${photosHtml}

          ${record.note ? `
            <div style="margin-top: var(--spacing-md);">
              <h3 style="margin-bottom: var(--spacing-sm);">Catatan</h3>
              <p style="font-size: 0.875rem;">${record.note}</p>
            </div>
          ` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" id="btn-delete">Hapus</button>
          <button class="btn btn-primary" id="btn-edit">Edit</button>
          <button class="btn btn-secondary" id="btn-close">Tutup</button>
        </div>
      </div>
    `;

    this.container.querySelector('.btn-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-close')!.addEventListener('click', () => this.close());
    this.container.querySelector('#btn-edit')!.addEventListener('click', () => this.openEdit());
    this.container.querySelector('#btn-delete')!.addEventListener('click', () => this.deleteRecord());

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
  }

  async open(): Promise<void> {
    await this.render();
    document.body.appendChild(this.container);
  }

  private openEdit(): void {
    this.close();
    const editModal = new EditModal(this.date);
    editModal.open();
  }

  private async deleteRecord(): Promise<void> {
    this.close();
    await deleteRecordWithConfirm(this.date);
  }

  private close(): void {
    this.container.querySelectorAll('img').forEach(img => {
      if (img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });
    this.container.remove();
  }
}
