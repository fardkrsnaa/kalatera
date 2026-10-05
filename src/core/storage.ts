import { formatTime24To12h, validateTime24h } from '../utils/validators';

const SCHEMA_VERSION = 2;
const SCHEMA_KEY = 'kalatera:schemaVersion';
const RECORDS_KEY = 'kalatera:v1:records';
const SETTINGS_KEY = 'kalatera:v1:settings';

export type Status = 'WORK' | 'OFF' | 'MIDDLE' | 'OVERTIME' | 'IZIN';

export interface ClockEvent {
  time: string;
  photoId: string;
  lat: number;
  lon: number;
  address: string;
}

export interface DayRecord {
  date: string;
  status: Status;
  clockIn?: ClockEvent;
  clockOut?: ClockEvent;
  breakMinutes: number;
  normalHours: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  defaultBreakMinutes: number;
  defaultNormalHours: number;
}

export type RecordsMap = Record<string, DayRecord>;

function getCurrentVersion(): number {
  const v = localStorage.getItem(SCHEMA_KEY);
  return v ? parseInt(v, 10) : 0;
}

function setVersion(v: number): void {
  localStorage.setItem(SCHEMA_KEY, v.toString());
}

function migrateTimeFormat(data: RecordsMap): RecordsMap {
  for (const key of Object.keys(data)) {
    const r = data[key];
    if (r.clockIn?.time && validateTime24h(r.clockIn.time)) {
      try { r.clockIn.time = formatTime24To12h(r.clockIn.time); } catch {}
    }
    if (r.clockOut?.time && validateTime24h(r.clockOut.time)) {
      try { r.clockOut.time = formatTime24To12h(r.clockOut.time); } catch {}
    }
  }
  return data;
}

function migrate(oldVersion: number, newVersion: number, data: RecordsMap): RecordsMap {
  if (oldVersion === newVersion) return data;
  let result = data;
  if (oldVersion < 2 && newVersion >= 2) {
    result = migrateTimeFormat(result);
  }
  return result;
}

export function initStorage(): void {
  const current = getCurrentVersion();
  if (current < SCHEMA_VERSION) {
    const raw = localStorage.getItem(RECORDS_KEY);
    let records: RecordsMap = {};
    if (raw) {
      try {
        records = JSON.parse(raw);
      } catch {
        console.warn('Corrupt data, resetting');
      }
    }
    const migrated = migrate(current, SCHEMA_VERSION, records);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(migrated));
    setVersion(SCHEMA_VERSION);
  }

  if (!localStorage.getItem(SETTINGS_KEY)) {
    saveSettings({ defaultBreakMinutes: 30, defaultNormalHours: 8 });
  }
}

export function getAllRecords(): RecordsMap {
  const raw = localStorage.getItem(RECORDS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getRecord(date: string): DayRecord | undefined {
  return getAllRecords()[date];
}

export function saveRecord(record: DayRecord): void {
  const all = getAllRecords();
  all[record.date] = record;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

export function deleteRecord(date: string): void {
  const all = getAllRecords();
  delete all[date];
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}

export function getSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return { defaultBreakMinutes: 30, defaultNormalHours: 8 };
  try {
    return JSON.parse(raw);
  } catch {
    return { defaultBreakMinutes: 30, defaultNormalHours: 8 };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearAllData(): void {
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(SCHEMA_KEY);
}
