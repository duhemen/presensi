// ============================================================
// File: src/services/api.js
// Simulasi API Server menggunakan LocalStorage
// ============================================================

const ATTENDANCE_KEY = 'attendance_logs';
const LEAVE_KEY = 'leave_logs';

// ---------- Helper: LocalStorage aman ----------
const readDB = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeDB = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('LocalStorage penuh atau error:', err);
    throw new Error('Penyimpanan lokal penuh. Bersihkan data lama terlebih dahulu.');
  }
};

// ---------- API: Kirim Absensi ----------
export const sendAttendanceToServer = async (attendanceData) => {
  if (!attendanceData?.employeeId) {
    throw new Error('Data absensi tidak valid: employeeId wajib ada.');
  }

  const logs = readDB(ATTENDANCE_KEY);
  const newLog = {
    id: 'ATT-' + Date.now(),
    ...attendanceData,
    timestamp: new Date().toISOString(),
  };
  logs.push(newLog);
  writeDB(ATTENDANCE_KEY, logs);

  // Simulasi latency jaringan
  return new Promise((resolve) =>
    setTimeout(
      () => resolve({ status: 'success', message: 'Presensi berhasil disimpan ke basis data pusat!' }),
      400
    )
  );
};

// ---------- API: Kirim Pengajuan Cuti ----------
export const submitLeaveRequest = async (leaveData) => {
  if (!leaveData?.employeeId || !leaveData?.startDate || !leaveData?.endDate) {
    throw new Error('Data pengajuan tidak lengkap.');
  }

  const leaves = readDB(LEAVE_KEY);
  const newLeave = {
    id: 'LEAVE-' + Date.now(),
    ...leaveData,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };
  leaves.push(newLeave);
  writeDB(LEAVE_KEY, leaves);

  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          status: 'success',
          message: `Pengajuan ${leaveData.leaveType} berhasil dikirim ke HRD!`,
        }),
      400
    )
  );
};

// ---------- API: Ambil Semua Data Laporan ----------
export const fetchAllReportData = () => ({
  attendance: readDB(ATTENDANCE_KEY),
  leaves: readDB(LEAVE_KEY),
});
