import { getAllRecords, getSettings, saveSettings } from './storage';
import { getAllPhotos, savePhoto, clearAllPhotos } from './idb';
import { store } from './store';

export interface BackupData {
  version: number;
  exportedAt: string;
  schemaVersion: number;
  records: Record<string, unknown>;
  settings: unknown;
  photos: Record<string, { base64: string; mime: string; w: number; h: number; createdAt: number }>;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function exportBackup(): Promise<string> {
  const records = getAllRecords();
  const settings = getSettings();
  const schemaVersion = parseInt(localStorage.getItem('kalatera:schemaVersion') ?? '2', 10);
  const allPhotos = await getAllPhotos();
  const photos: BackupData['photos'] = {};
  for (const [id, data] of Object.entries(allPhotos)) {
    const base64 = await blobToBase64(data.blob);
    photos[id] = { base64, mime: data.mime, w: data.w, h: data.h, createdAt: data.createdAt };
  }
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    schemaVersion,
    records: records as unknown as Record<string, unknown>,
    settings,
    photos,
  };
  return JSON.stringify(backup);
}

export async function downloadBackup(): Promise<void> {
  const json = await exportBackup();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  a.href = url;
  a.download = `kalatera-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(jsonStr: string): Promise<void> {
  const data = JSON.parse(jsonStr) as BackupData;
  if (!data.records || typeof data.records !== 'object') throw new Error('File backup tidak valid: records hilang');
  localStorage.setItem('kalatera:v1:records', JSON.stringify(data.records));
  if (data.settings) {
    saveSettings(data.settings as never);
  }
  if (data.schemaVersion) {
    localStorage.setItem('kalatera:schemaVersion', String(data.schemaVersion));
  }
  await clearAllPhotos();
  if (data.photos) {
    for (const [id, p] of Object.entries(data.photos)) {
      try {
        const blob = base64ToBlob(p.base64);
        await savePhoto(id, { blob, mime: p.mime, w: p.w, h: p.h, createdAt: p.createdAt });
      } catch {}
    }
  }
  store.notify();
}

export async function handleImportFile(file: File): Promise<void> {
  const text = await file.text();
  await importBackup(text);
}
