import { describe, it, expect } from 'vitest';
import { computeDuration, calculateMinutesBetween } from './calc';
import type { DayRecord } from './storage';

function makeRecord(
  status: DayRecord['status'],
  clockIn?: string,
  clockOut?: string,
  breakMinutes = 30,
  normalHours = 8
): DayRecord {
  return {
    date: '2026-10-03',
    status,
    clockIn: clockIn ? { time: clockIn, photoId: 'x', lat: 0, lon: 0, address: '-' } : undefined,
    clockOut: clockOut ? { time: clockOut, photoId: 'y', lat: 0, lon: 0, address: '-' } : undefined,
    breakMinutes,
    normalHours,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('calc', () => {
  it('case 1: 08:00-16:00, break 30, WORK, normal 8h → 7h 30m work, 0 OT', () => {
    const record = makeRecord('WORK', '08:00:00', '16:00:00', 30, 8);
    const result = computeDuration(record);
    expect(result.workMinutes).toBe(450);
    expect(result.overtimeMinutes).toBe(0);
  });

  it('case 2: 08:00-18:00, break 30, WORK, normal 8h → 8h work, 1h 30m OT', () => {
    const record = makeRecord('WORK', '08:00:00', '18:00:00', 30, 8);
    const result = computeDuration(record);
    expect(result.workMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(90);
  });

  it('case 3: 22:00-06:00 (midnight cross), break 30, WORK, normal 8h → 7h 30m work, 0 OT', () => {
    const record = makeRecord('WORK', '22:00:00', '06:00:00', 30, 8);
    const result = computeDuration(record);
    expect(result.workMinutes).toBe(450);
    expect(result.overtimeMinutes).toBe(0);
  });

  it('case 4: 08:00-17:00, break 60, WORK, normal 8h → 8h work, 0 OT', () => {
    const record = makeRecord('WORK', '08:00:00', '17:00:00', 60, 8);
    const result = computeDuration(record);
    expect(result.workMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(0);
  });

  it('case 5: OFF status → 0 work, 0 OT', () => {
    const record = makeRecord('OFF');
    const result = computeDuration(record);
    expect(result.workMinutes).toBe(0);
    expect(result.overtimeMinutes).toBe(0);
  });

  it('case 6: 10:00-14:00, break 0, MIDDLE, normal 8h → 4h work, 0 OT', () => {
    const record = makeRecord('MIDDLE', '10:00:00', '14:00:00', 0, 8);
    const result = computeDuration(record);
    expect(result.workMinutes).toBe(240);
    expect(result.overtimeMinutes).toBe(0);
  });

  it('case 7: 08:00-20:00, break 30, OVERTIME, normal 8h → 0 work, 11h 30m OT', () => {
    const record = makeRecord('OVERTIME', '08:00:00', '20:00:00', 30, 8);
    const result = computeDuration(record);
    expect(result.workMinutes).toBe(0);
    expect(result.overtimeMinutes).toBe(690);
  });

  it('case 8: clock in only (no clock out) → 0 work, 0 OT', () => {
    const record = makeRecord('WORK', '08:00:00', undefined, 30, 8);
    const result = computeDuration(record);
    expect(result.workMinutes).toBe(0);
    expect(result.overtimeMinutes).toBe(0);
  });

  it('calculateMinutesBetween: same day', () => {
    expect(calculateMinutesBetween('08:00:00', '16:00:00')).toBe(480);
  });

  it('calculateMinutesBetween: midnight cross', () => {
    expect(calculateMinutesBetween('22:00:00', '06:00:00')).toBe(480);
  });
});
