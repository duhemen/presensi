import bcrypt from 'bcryptjs';

/**
 * Mengubah array koordinat wajah (landmarked vector) menjadi hash abstrak satu arah.
 */
export const hashFaceVector = async (faceVector, companyId) => {
  if (!Array.isArray(faceVector) || faceVector.length === 0) {
    throw new Error("Vektor wajah tidak valid atau kosong.");
  }

  const normalizedString = faceVector
    .map(num => num.toFixed(4))
    .join(',');

  const dataToHash = `${normalizedString}_${companyId}`;
  const salt = bcrypt.genSaltSync(10);
  const secureHash = bcrypt.hashSync(dataToHash, salt);

  return secureHash;
};

/**
 * Memverifikasi apakah wajah saat ini cocok dengan hash yang tersimpan di server.
 */
export const verifyFaceVector = (currentFaceVector, companyId, storedHash) => {
  const normalizedString = currentFaceVector
    .map(num => num.toFixed(4))
    .join(',');
    
  const dataToVerify = `${normalizedString}_${companyId}`;
  return bcrypt.compareSync(dataToVerify, storedHash);
};

/**
 * Membuat dan mengunduh file Excel berbasis CSV dari data absensi secara instan.
 */
export const exportToExcelCSV = (data) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Header Kolom
  csvContent += "ID Transaksi,ID Karyawan,Jenis Data,Kategori,Detail Lokasi/Alasan,Waktu\n";
  
  // Isi Log Absensi Wajah
  if (data.attendance && Array.isArray(data.attendance)) {
    data.attendance.forEach(log => {
      csvContent += `${log.id},${log.employeeId},Presensi,${log.type.toUpperCase()},${log.workMode} (${Math.round(log.distanceFromOffice)}m),${log.timestamp}\n`;
    });
  }
  
  // Isi Log Pengajuan Cuti/Izin
  if (data.leaves && Array.isArray(data.leaves)) {
    data.leaves.forEach(log => {
      csvContent += `${log.id},${log.employeeId},Pengajuan,${log.leaveType.toUpperCase()},"${log.reason} (${log.startDate} s/d ${log.endDate})",${log.created_at}\n`;
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Laporan_Absensi_Emen_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Membuka mode cetak dokumen PDF standar rapi untuk laporan fisik berkas.
 */
export const exportToPDFPrint = (data) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Gagal membuka jendela cetak. Mohon izinkan pop-up pada browser Anda.");
    return;
  }

  let html = `
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
  `;
  
  if (data.attendance && Array.isArray(data.attendance)) {
    data.attendance.forEach(log => {
      html += `<tr><td>${log.id}</td><td>${log.employeeId}</td><td>${log.type.toUpperCase()}</td><td>${log.workMode.toUpperCase()}</td><td>${Math.round(log.distanceFromOffice)}m</td><td>${new Date(log.timestamp).toLocaleString('id-ID')}</td></tr>`;
    });
  } else {
    html += `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Belum ada data rekaman presensi</td></tr>`;
  }
  
  html += `
      </table>
      <h3>2. Log Pengajuan Izin, Sakit & Cuti</h3>
      <table>
        <tr><th>ID Log</th><th>ID Karyawan</th><th>Jenis Pengajuan</th><th>Tanggal Durasi</th><th>Alasan Dokumen</th><th>Status</th></tr>
  `;
  
  if (data.leaves && Array.isArray(data.leaves)) {
    data.leaves.forEach(log => {
      html += `<tr><td>${log.id}</td><td>${log.employeeId}</td><td>${log.leaveType.toUpperCase()}</td><td>${log.startDate} s/d ${log.endDate}</td><td>${log.reason}</td><td>${log.status}</td></tr>`;
    });
  } else {
    html += `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Belum ada data pengajuan ketidakhadiran</td></tr>`;
  }
  
  html += `</table></body></html>`;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};
