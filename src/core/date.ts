import { formatTime24To12h } from '../utils/validators';

export function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTime(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return formatTime24To12h(`${h}:${m}:${s}`);
}

export function getCurrentTime24(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function parseTime(timeStr: string): { h: number; m: number; s: number } {
  const ampm = timeStr.match(/^(0[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (AM|PM)$/);
  if (ampm) {
    let h12 = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const s = parseInt(ampm[3], 10);
    const period = ampm[4];
    let h = h12 % 12;
    if (period === 'PM') h += 12;
    return { h, m, s };
  }
  const [h, m, s] = timeStr.split(':').map(Number);
  return { h, m, s };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function addMonths(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
