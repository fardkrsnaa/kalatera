export function validateTimeFormat(time: string): boolean {
  return validateTime12h(time);
}

export function validateTime12h(time: string): boolean {
  const regex = /^(0[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (AM|PM)$/;
  return regex.test(time);
}

export function validateTime24h(time: string): boolean {
  const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
  return regex.test(time);
}

export function parseTime12h(time: string): { h24: number; h12: number; m: number; s: number; period: 'AM' | 'PM' } | null {
  const m = time.match(/^(0[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (AM|PM)$/);
  if (!m) return null;
  const h12 = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  const secs = parseInt(m[3], 10);
  const period = m[4] as 'AM' | 'PM';
  let h24 = h12 % 12;
  if (period === 'PM') h24 += 12;
  return { h24, h12, m: mins, s: secs, period };
}

export function parseTimeAny(time: string): { h: number; m: number; s: number } | null {
  const p12 = parseTime12h(time);
  if (p12) return { h: p12.h24, m: p12.m, s: p12.s };
  const m24 = time.match(/^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/);
  if (m24) return { h: parseInt(m24[1], 10), m: parseInt(m24[2], 10), s: parseInt(m24[3], 10) };
  return null;
}

export function formatTime24To12h(time24: string): string {
  const parts = time24.split(':').map(Number);
  const h24 = parts[0]; const m = parts[1]; const s = parts[2];
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${period}`;
}

export function formatTime12hShort(time12h: string): string {
  const p = parseTime12h(time12h);
  if (!p) return time12h;
  return `${String(p.h12).padStart(2, '0')}:${String(p.m).padStart(2, '0')} ${p.period}`;
}

export function validateClockTimes(clockIn?: string, clockOut?: string): string | null {
  if (!clockIn || !clockOut) {
    return null;
  }
  if (!validateTime12h(clockIn) || !validateTime12h(clockOut)) {
    return 'Format waktu tidak valid (hh:mm:ss AM/PM)';
  }
  return null;
}

export function validateClockTimesAny(clockIn?: string, clockOut?: string): string | null {
  if (!clockIn || !clockOut) return null;
  const okIn = !!parseTimeAny(clockIn);
  const okOut = !!parseTimeAny(clockOut);
  if (!okIn || !okOut) return 'Format waktu tidak valid (hh:mm:ss AM/PM)';
  return null;
}

export function validateBreakMinutes(breakMinutes: number): string | null {
  if (breakMinutes < 0) {
    return 'Istirahat tidak boleh negatif';
  }
  if (breakMinutes > 480) {
    return 'Istirahat maksimal 8 jam (480 menit)';
  }
  return null;
}

export function validateNormalHours(normalHours: number): string | null {
  if (normalHours <= 0) {
    return 'Jam normal harus lebih dari 0';
  }
  if (normalHours > 24) {
    return 'Jam normal maksimal 24 jam';
  }
  return null;
}
