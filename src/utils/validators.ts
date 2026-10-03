export function validateTimeFormat(time: string): boolean {
  const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
  return regex.test(time);
}

export function validateClockTimes(clockIn?: string, clockOut?: string): string | null {
  if (!clockIn || !clockOut) {
    return null;
  }

  if (!validateTimeFormat(clockIn) || !validateTimeFormat(clockOut)) {
    return 'Format waktu tidak valid (HH:mm:ss)';
  }

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
