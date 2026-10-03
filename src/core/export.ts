import { Workbook } from 'exceljs';
import { getAllRecords } from './storage';
import { computeDuration } from './calc';
import { formatDuration, formatDecimal } from '../utils/format';

export interface ExportOptions {
  year: number;
  month: number;
}

export async function exportToExcel(options: ExportOptions): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Absensi');

  sheet.columns = [
    { header: 'Tanggal', key: 'date', width: 12 },
    { header: 'Hari', key: 'day', width: 10 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Jam Masuk', key: 'clockIn', width: 12 },
    { header: 'Jam Keluar', key: 'clockOut', width: 12 },
    { header: 'Istirahat (menit)', key: 'break', width: 16 },
    { header: 'Jam Kerja', key: 'work', width: 12 },
    { header: 'Lembur', key: 'overtime', width: 12 },
    { header: 'Lokasi Masuk', key: 'locationIn', width: 30 },
    { header: 'Lokasi Keluar', key: 'locationOut', width: 30 },
    { header: 'Catatan', key: 'note', width: 30 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  const records = getAllRecords();
  const daysInMonth = new Date(options.year, options.month + 1, 0).getDate();

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  let totalWorkMinutes = 0;
  let totalOvertimeMinutes = 0;
  let totalWorkDays = 0;
  let totalOffDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${options.year}-${String(options.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(options.year, options.month, day);
    const dayName = dayNames[dateObj.getDay()];
    const record = records[dateStr];

    if (!record) {
      sheet.addRow({
        date: dateStr,
        day: dayName,
        status: '-',
        clockIn: '-',
        clockOut: '-',
        break: '-',
        work: '-',
        overtime: '-',
        locationIn: '-',
        locationOut: '-',
        note: '-',
      });
      continue;
    }

    const duration = computeDuration(record);

    if (record.status === 'OFF') {
      totalOffDays++;
    } else if (record.clockIn && record.clockOut) {
      totalWorkDays++;
      totalWorkMinutes += duration.workMinutes;
      totalOvertimeMinutes += duration.overtimeMinutes;
    }

    const statusMap: Record<string, string> = {
      WORK: 'Kerja',
      OFF: 'Libur',
      MIDDLE: 'Middle',
      OVERTIME: 'Lembur',
    };

    sheet.addRow({
      date: dateStr,
      day: dayName,
      status: statusMap[record.status] || record.status,
      clockIn: record.clockIn?.time || '-',
      clockOut: record.clockOut?.time || '-',
      break: record.status === 'OFF' ? '-' : record.breakMinutes,
      work: record.status === 'OFF' ? '-' : `${formatDuration(duration.workMinutes)} (${formatDecimal(duration.workMinutes)})`,
      overtime: record.status === 'OFF' ? '-' : `${formatDuration(duration.overtimeMinutes)} (${formatDecimal(duration.overtimeMinutes)})`,
      locationIn: record.clockIn?.address || '-',
      locationOut: record.clockOut?.address || '-',
      note: record.note || '-',
    });
  }

  const totalRow = sheet.addRow({
    date: 'TOTAL',
    day: '',
    status: `${totalWorkDays} hari kerja, ${totalOffDays} hari libur`,
    clockIn: '',
    clockOut: '',
    break: '',
    work: `${formatDuration(totalWorkMinutes)} (${formatDecimal(totalWorkMinutes)})`,
    overtime: `${formatDuration(totalOvertimeMinutes)} (${formatDecimal(totalOvertimeMinutes)})`,
    locationIn: '',
    locationOut: '',
    note: '',
  });

  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kalatera_Absensi_${options.year}-${String(options.month + 1).padStart(2, '0')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
