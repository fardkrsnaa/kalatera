import { parseTimeAny } from '../utils/validators';

export type Shift = 'Pagi' | 'Siang' | 'Malam' | 'Dini Hari';

export function detectShift(clockInTime: string): Shift {
  const parsed = parseTimeAny(clockInTime);
  const hour = parsed ? parsed.h : parseInt(clockInTime.split(':')[0], 10);
  if (hour >= 6 && hour < 11) return 'Pagi';
  if (hour >= 11 && hour < 17) return 'Siang';
  if (hour >= 17 && hour < 23) return 'Malam';
  return 'Dini Hari';
}

export function getShiftColor(shift: Shift): string {
  const colors: Record<Shift, string> = {
    'Pagi': 'var(--color-success)',
    'Siang': 'var(--color-primary)',
    'Malam': 'var(--color-warning)',
    'Dini Hari': 'var(--color-danger)'
  };
  return colors[shift];
}

export function getShiftBadgeClass(shift: Shift): string {
  const classes: Record<Shift, string> = {
    'Pagi': 'badge-work',
    'Siang': 'badge-work',
    'Malam': 'badge-middle',
    'Dini Hari': 'badge-overtime'
  };
  return classes[shift];
}
