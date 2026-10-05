import type { DayRecord } from './storage';
import { getAllRecords } from './storage';
import { parseTime } from './date';
import { parseTimeAny } from '../utils/validators';

export interface MonthlySummary {
  overtimeMinutes: number;
  izinDays: number;
  workDays: number;
  offDays: number;
  totalWorkMinutes: number;
}

export function getMonthlySummary(year: number, month: number): MonthlySummary {
  const records = getAllRecords();
  let overtimeMinutes = 0;
  let izinDays = 0;
  let workDays = 0;
  let offDays = 0;
  let totalWorkMinutes = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = records[dateStr];
    if (!record) continue;
    if (record.status === 'IZIN') izinDays++;
    else if (record.status === 'OFF') offDays++;
    else if (record.clockIn && record.clockOut) {
      workDays++;
      const d = computeDuration(record);
      totalWorkMinutes += d.workMinutes;
      overtimeMinutes += d.overtimeMinutes;
    }
  }
  return { overtimeMinutes, izinDays, workDays, offDays, totalWorkMinutes };
}

export interface DurationResult {
  workMinutes: number;
  overtimeMinutes: number;
}

export function computeDuration(record: DayRecord): DurationResult {
  if (record.status === 'OFF' || record.status === 'IZIN') {
    return { workMinutes: 0, overtimeMinutes: 0 };
  }

  if (!record.clockIn || !record.clockOut) {
    return { workMinutes: 0, overtimeMinutes: 0 };
  }

  const totalMinutes = calculateMinutesBetween(
    record.clockIn.time,
    record.clockOut.time
  );

  const netMinutes = Math.max(0, totalMinutes - record.breakMinutes);

  if (record.status === 'OVERTIME') {
    return { workMinutes: 0, overtimeMinutes: netMinutes };
  }

  const normalMinutes = record.normalHours * 60;

  if (record.status === 'WORK' || record.status === 'MIDDLE') {
    const workMinutes = Math.min(netMinutes, normalMinutes);
    const overtimeMinutes = Math.max(0, netMinutes - normalMinutes);
    return { workMinutes, overtimeMinutes };
  }

  return { workMinutes: 0, overtimeMinutes: 0 };
}

export function calculateMinutesBetween(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  let startMinutes = start.h * 60 + start.m;
  let endMinutes = end.h * 60 + end.m;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
}

export function getLiveMinutes(startTime: string): number {
  const now = new Date();
  const start = parseTimeAny(startTime);
  const end = { h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() };
  if (!start) return 0;
  let startMin = start.h * 60 + start.m;
  let endMin = end.h * 60 + end.m;
  if (endMin < startMin) endMin += 24 * 60;
  return endMin - startMin;
}
