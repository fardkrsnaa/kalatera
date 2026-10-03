# Kalatera

Sistem Absensi Digital - Website absensi dengan foto berwatermark, tanpa backend.

## Fitur

- ✅ Clock In/Out dengan foto kamera berwatermark (tanggal, jam, lokasi)
- ✅ Timer live saat sedang bekerja
- ✅ Status absensi: Kerja, Libur, Middle, Lembur
- ✅ Perhitungan otomatis jam kerja & lembur
- ✅ Kalender bulanan dengan ringkasan
- ✅ Edit & hapus record
- ✅ Export ke Excel (.xlsx)
- ✅ Dark mode otomatis
- ✅ PWA (installable)
- ✅ Responsif (PC & mobile)

## Tech Stack

- Vite + TypeScript
- localStorage (data absensi)
- IndexedDB (foto)
- ExcelJS (export)
- Nominatim OpenStreetMap (reverse geocoding)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy ke Vercel

1. Push ke GitHub
2. Import project di Vercel
3. Deploy (otomatis HTTPS)

## Test

```bash
npm test
```

## Browser Support

- Chrome/Edge (desktop & Android)
- Safari (desktop & iOS)

Kamera & lokasi butuh HTTPS atau localhost.
