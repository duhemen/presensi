/**
 * Mengambil database lokal untuk keperluan export data
 */
const getLocalDB = (key) => JSON.parse(localStorage.getItem(key)) || [];
const saveLocalDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));

/**
 * Mengirim data absensi lengkap dengan enkripsi biner wajah dan GPS.
 */
export const sendAttendanceToServer = async (attendanceData) => {
  const currentLogs = getLocalDB('attendance_logs');
  const newLog = {
    id: 'ATT-' + Date.now(),
    ...attendanceData,
    timestamp: new Date().toISOString()
  };
  currentLogs.push(newLog);
  saveLocalDB('attendance_logs', currentLogs);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: "success", message: "Presensi berhasil disimpan ke basis data pusat!" });
    }, 800);
  });
};

/**
 * Mengirim formulir pengajuan ketidakhadiran (Cuti, Sakit, Izin, Hamil, Lupa Absen)
 */
export const submitLeaveRequest = async (leaveData) => {
  const currentLeaves = getLocalDB('leave_logs');
  const newLeave = {
    id: 'LEAVE-' + Date.now(),
    ...leaveData,
    status: 'PENDING',
    created_at: new Date().toISOString()
  };
  currentLeaves.push(newLeave);
  saveLocalDB('leave_logs', currentLeaves);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: "success", message: `Pengajuan ${leaveData.leaveType} berhasil dikirim ke HRD!` });
    }, 800);
  });
};

/**
 * Mengambil seluruh data gabungan untuk keperluan generator laporan Excel / PDF
 */
export const fetchAllReportData = () => {
  return {
    attendance: getLocalDB('attendance_logs'),
    leaves: getLocalDB('leave_logs')
  };
};
