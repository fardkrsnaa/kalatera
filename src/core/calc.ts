import type { DayRecord } from './storage';
import { parseTime } from './date';

export interface DurationResult {
  workMinutes: number;
  overtimeMinutes: number;
}

export function computeDuration(record: DayRecord): DurationResult {
  if (record.status === 'OFF') {
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
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  return calculateMinutesBetween(startTime, currentTime);
}
