// ============================================================
// File: src/services/crypto.js
// Mesin enkripsi Bcrypt + Ekspor Laporan (CSV & PDF)
// ============================================================
import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Mengubah array koordinat wajah menjadi hash Bcrypt satu arah (non-blocking).
 */
export const hashFaceVector = async (faceVector, companyId) => {
  if (!Array.isArray(faceVector) || faceVector.length === 0) {
    throw new Error('Vektor wajah tidak valid atau kosong.');
  }

  const normalized = faceVector.map((n) => Number(n).toFixed(4)).join(',');
  const dataToHash = `${normalized}_${companyId}`;

  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(dataToHash, salt);
};

/**
 * Memverifikasi apakah wajah saat ini cocok dengan hash yang tersimpan.
 */
export const verifyFaceVector = async (currentFaceVector, companyId, storedHash) => {
  if (!Array.isArray(currentFaceVector) || currentFaceVector.length === 0) return false;
  const normalized = currentFaceVector.map((n) => Number(n).toFixed(4)).join(',');
  return bcrypt.compare(`${normalized}_${companyId}`, storedHash);
};

// ------------------------------------------------------------
// CSV Escape Helper
// ------------------------------------------------------------
const escapeCSV = (value) => {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Mengunduh laporan sebagai file CSV (dapat dibuka di Excel).
 * Menggunakan Blob + BOM UTF-8 agar karakter Indonesia tidak rusak.
 */
export const exportToExcelCSV = (data) => {
  const rows = [];
  rows.push('ID Transaksi,ID Karyawan,Jenis Data,Kategori,Detail Lokasi/Alasan,Waktu');

  (data?.attendance || []).forEach((log) => {
    rows.push(
      [
        escapeCSV(log.id),
        escapeCSV(log.employeeId),
        'Presensi',
        escapeCSV((log.type || '').toUpperCase()),
        escapeCSV(`${log.workMode || '-'} (${Math.round(log.distanceFromOffice || 0)}m)`),
        escapeCSV(log.timestamp),
      ].join(',')
    );
  });

  (data?.leaves || []).forEach((log) => {
    rows.push(
      [
        escapeCSV(log.id),
        escapeCSV(log.employeeId),
        'Pengajuan',
        escapeCSV((log.leaveType || '').toUpperCase()),
        escapeCSV(`${log.reason || '-'} (${log.startDate} s/d ${log.endDate})`),
        escapeCSV(log.created_at),
      ].join(',')
    );
  });

  const csvContent = '\uFEFF' + rows.join('\n'); // BOM agar Excel membaca UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `Laporan_Absensi_Emen_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Membuka jendela cetak untuk laporan PDF.
 */
export const exportToPDFPrint = (data) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Gagal membuka jendela cetak. Mohon izinkan pop-up pada browser Anda.');
  }

  const escapeHTML = (v) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const attendanceRows = (data?.attendance || []).length
    ? data.attendance
        .map(
          (log) => `
            <tr>
              <td>${escapeHTML(log.id)}</td>
              <td>${escapeHTML(log.employeeId)}</td>
              <td>${escapeHTML((log.type || '').toUpperCase())}</td>
              <td>${escapeHTML((log.workMode || '').toUpperCase())}</td>
              <td>${Math.round(log.distanceFromOffice || 0)}m</td>
              <td>${escapeHTML(new Date(log.timestamp).toLocaleString('id-ID'))}</td>
            </tr>`
        )
        .join('')
    : `<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Belum ada data rekaman presensi</td></tr>`;

  const leaveRows = (data?.leaves || []).length
    ? data.leaves
        .map(
          (log) => `
            <tr>
              <td>${escapeHTML(log.id)}</td>
              <td>${escapeHTML(log.employeeId)}</td>
              <td>${escapeHTML((log.leaveType || '').toUpperCase())}</td>
              <td>${escapeHTML(log.startDate)} s/d ${escapeHTML(log.endDate)}</td>
              <td>${escapeHTML(log.reason)}</td>
              <td>${escapeHTML(log.status)}</td>
            </tr>`
        )
        .join('')
    : `<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Belum ada data pengajuan ketidakhadiran</td></tr>`;

  const html = `
    <html>
    <head>
      <title>Laporan Absensi & Cuti Karyawan</title>
      <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
        th { background-color: #f8fafc; font-weight: bold; }
        h2 { text-align: center; margin-bottom: 2px; color: #1e3a8a; }
        p { text-align: center; font-size: 12px; color: #64748b; margin-top: 0; }
        h3 { border-bottom: 2px solid #3b82f6; padding-bottom: 4px; color: #1e293b; }
      </style>
    </head>
    <body>
      <h2>LAPORAN ABSENSI & PERSONALIA ENTERPRISE</h2>
      <p>Dicetak otomatis pada tanggal: ${new Date().toLocaleString('id-ID')}</p>

      <h3>1. Log Presensi Biometrik & GPS</h3>
      <table>
        <tr><th>ID Log</th><th>ID Karyawan</th><th>Tipe</th><th>Mode Kerja</th><th>Jarak</th><th>Waktu</th></tr>
        ${attendanceRows}
      </table>

      <h3>2. Log Pengajuan Izin, Sakit & Cuti</h3>
      <table>
        <tr><th>ID Log</th><th>ID Karyawan</th><th>Jenis Pengajuan</th><th>Tanggal Durasi</th><th>Alasan Dokumen</th><th>Status</th></tr>
        ${leaveRows}
      </table>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
