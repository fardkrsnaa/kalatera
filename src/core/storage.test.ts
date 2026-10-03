import { describe, it, expect, beforeEach } from 'vitest';
import {
  initStorage,
  getAllRecords,
  saveRecord,
  getRecord,
  deleteRecord,
  getSettings,
  clearAllData,
  type DayRecord,
} from '../core/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('storage', () => {
  it('should initialize with default settings', () => {
    initStorage();
    const settings = getSettings();
    expect(settings.defaultBreakMinutes).toBe(30);
    expect(settings.defaultNormalHours).toBe(8);
  });

  it('should save and retrieve records', () => {
    initStorage();
    const record: DayRecord = {
      date: '2026-10-03',
      status: 'WORK',
      clockIn: {
        time: '08:00:00',
        photoId: 'photo1',
        lat: -6.2,
        lon: 106.8,
        address: 'Jakarta',
      },
      breakMinutes: 30,
      normalHours: 8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveRecord(record);
    const retrieved = getRecord('2026-10-03');
    expect(retrieved).toEqual(record);
  });

  it('should delete records', () => {
    initStorage();
    const record: DayRecord = {
      date: '2026-10-03',
      status: 'WORK',
      breakMinutes: 30,
      normalHours: 8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveRecord(record);
    expect(getRecord('2026-10-03')).toBeDefined();
    
    deleteRecord('2026-10-03');
    expect(getRecord('2026-10-03')).toBeUndefined();
  });

  it('should get all records', () => {
    initStorage();
    const r1: DayRecord = {
      date: '2026-10-01',
      status: 'WORK',
      breakMinutes: 30,
      normalHours: 8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const r2: DayRecord = {
      date: '2026-10-02',
      status: 'OFF',
      breakMinutes: 30,
      normalHours: 8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveRecord(r1);
    saveRecord(r2);

    const all = getAllRecords();
    expect(Object.keys(all).length).toBe(2);
    expect(all['2026-10-01']).toEqual(r1);
    expect(all['2026-10-02']).toEqual(r2);
  });

  it('should clear all data', () => {
    initStorage();
    const record: DayRecord = {
      date: '2026-10-03',
      status: 'WORK',
      breakMinutes: 30,
      normalHours: 8,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveRecord(record);
    expect(Object.keys(getAllRecords()).length).toBe(1);

    clearAllData();
    expect(Object.keys(getAllRecords()).length).toBe(0);
  });
});
