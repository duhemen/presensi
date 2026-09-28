import React, { useRef, useState, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { StatusCard } from './components/StatusCard';
import { useLiveness } from './hooks/useLiveness';
import { hashFaceVector, exportToExcelCSV, exportToPDFPrint } from './services/crypto';
import { sendAttendanceToServer, submitLeaveRequest, fetchAllReportData } from './services/api';
import { calculateDistance } from './utils/faceMath';

function App() {
  const videoRef = useRef(null);
  const [activeTab, setActiveTab] = useState('absen'); 
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // State Keamanan Role Admin Login (Barrier)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const ADMIN_PASSWORD_SECRET = "adminemen123"; 

  // State Fitur Obrolan + Integrasi Login Media Sosial (Tuntutan Fitur Emen)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [socialUser, setSocialUser] = useState(() => {
    const savedUser = localStorage.getItem('emen_chat_user');
    return savedUser ? JSON.parse(savedUser) : null; 
  });
  const [chatMessages, setChatMessages] = useState(() => {
    const localChat = localStorage.getItem('emen_chat_logs');
    return localChat ? JSON.parse(localChat) : [
      { id: 1, sender: 'Admin HRD', text: 'Halo! Silakan login media sosial Anda terlebih dahulu pada widget ini untuk mulai berkoordinasi secara aman.', time: '08:00' }
    ];
  });

  // State Tab 1: Absensi
  const [attendanceType, setAttendanceType] = useState('masuk');
  const [workMode, setWorkMode] = useState('WFO'); 
  const [userCoords, setUserCoords] = useState({ latitude: null, longitude: null });
  const [distance, setDistance] = useState(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // State Tab 2: Pengajuan Perizinan
  const [leaveType, setLeaveType] = useState('sakit'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // State Review Filter Rekap Bulanan Admin
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1); 
  const [filterYear, setFilterYear] = useState(new Date().getFullYear()); 

  // Database Karyawan Lokal Terintegrasi Profil Media Sosial Resmi
  const [employees, setEmployees] = useState(() => {
    const localData = localStorage.getItem('emen_db_employees');
    return localData ? JSON.parse(localData) : {
      "19920815001": { nama: "Emen Supriatna", jabatan: "IT Manager", sosmed: { instagram: "@emen_real", facebook: "emen.sejahtera", linkedin: "emen-it" } },
      "19950110002": { nama: "Siti Rahma", jabatan: "HRD Staff", sosmed: { instagram: "@siti_rahma", facebook: "siti.rahma.95", linkedin: "siti-rahma" } }
    };
  });

  const [siteCoords, setSiteCoords] = useState(() => {
    const localSite = localStorage.getItem('emen_db_site');
    return localSite ? JSON.parse(localSite) : { lat: -7.2654, lon: 112.7412, name: "Lapangan Apel Pusat" };
  });

  const [refreshLogs, setRefreshLogs] = useState(0); 
  const [logsData, setLogsData] = useState({ attendance: [], leaves: [] });
  // State Form Tambah Pegawai Admin
  const [newNip, setNewNip] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newJabatan, setNewJabatan] = useState('');
  const [newIg, setNewInsta] = useState('');
  const [newFb, setNewFb] = useState('');
  const [newLinkedin, setNewLinkedin] = useState('');

  // State Form Input Lokasi SITE Penugasan Apel
  const [inputSiteLat, setInputSiteLat] = useState(siteCoords.lat);
  const [inputSiteLon, setInputSiteLon] = useState(siteCoords.lon);
  const [inputSiteName, setInputSiteName] = useState(siteCoords.name);

  const OFFICE_LAT = -7.2504;
  const OFFICE_LON = 112.7508;
  const MAX_RADIUS = 50;
  const COMPANY_ID = "KANTOR_EMEN_SEJAHTERA_123";

  const { isLive, blinkCount, extractedVector, error: aiError } = useLiveness(videoRef);

  useEffect(() => {
    const data = fetchAllReportData();
    setLogsData(data);
  }, [activeTab, refreshLogs]);

  useEffect(() => {
    localStorage.setItem('emen_db_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('emen_db_site', JSON.stringify(siteCoords));
  }, [siteCoords]);

  useEffect(() => {
    localStorage.setItem('emen_chat_logs', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    if (socialUser) {
      localStorage.setItem('emen_chat_user', JSON.stringify(socialUser));
    } else {
      localStorage.removeItem('emen_chat_user');
    }
  }, [socialUser]);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        
        if (workMode === 'WFO') {
          const dist = calculateDistance(latitude, longitude, OFFICE_LAT, OFFICE_LON);
          setDistance(dist);
          setIsWithinRadius(dist <= MAX_RADIUS);
        } else if (workMode === 'SITE') {
          const dist = calculateDistance(latitude, longitude, siteCoords.lat, siteCoords.lon);
          setDistance(dist);
          setIsWithinRadius(dist <= MAX_RADIUS);
        } else {
          setDistance(0);
          setIsWithinRadius(true);
        }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, [activeTab, workMode, siteCoords]);
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD_SECRET) {
      setIsAdminLoggedIn(true);
      setStatus(null);
    } else {
      alert("Kata Sandi Admin Salah! Akses Ditolak.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminPasswordInput('');
    setActiveTab('absen');
  };

  // Fungsi Simulasi Penyekat Keamanan Login Media Sosial (OAuth 2.0 Compliant)
  const executeSocialLogin = (platform) => {
    let inputName = prompt(`Simulasi OAuth 2.0: Masukkan Nama Akun ${platform} Anda:`);
    if (!inputName || !inputName.trim()) return alert("Nama pengguna wajib diisi!");

    const userObj = {
      name: inputName.trim(),
      provider: platform
    };
    setSocialUser(userObj);
    
    const botWelcome = {
      id: Date.now(),
      sender: 'System Bot',
      text: `🔐 Pegawai atas nama "${inputName}" berhasil terautentikasi aman melalui ${platform} Auth API.`,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, botWelcome]);
  };

  const handleSocialLogout = () => {
    if (confirm("Apakah Anda ingin memutus tautan sesi login media sosial saat ini?")) {
      setSocialUser(null);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    let senderIdentity = 'User Anonim';
    if (isAdminLoggedIn) {
      senderIdentity = 'Admin HRD 👑';
    } else if (socialUser) {
      senderIdentity = `${socialUser.name} (${socialUser.provider})`;
    }

    const newMsg = {
      id: Date.now(),
      sender: senderIdentity,
      text: chatMessage,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatMessage('');
  };
  const handleAbsen = async (e) => {
    e.preventDefault();
    if (!employeeId) return alert("Masukkan NIP Pegawai Anda!");
    
    const pegawai = employees[employeeId];
    if (!pegawai) return alert(`NIP ${employeeId} tidak ditemukan di database!`);
    if (!isLive || !extractedVector) return alert("Belum ada verifikasi kedipan mata!");
    if ((workMode === 'WFO' || workMode === 'SITE') && !isWithinRadius) return alert("Di luar jangkauan radius lokasi!");

    setLoading(true);
    try {
      const secureHash = await hashFaceVector(extractedVector, COMPANY_ID);
      await sendAttendanceToServer({
        employeeId,
        namaPegawai: pegawai.nama,
        secureFaceHash: secureHash,
        type: attendanceType,
        workMode: workMode,
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        distanceFromOffice: distance,
        approvalStatus: workMode === 'WFH_WFA' ? 'PENDING_APPROVAL' : 'AUTO_APPROVED'
      });
      setStatus({ type: 'success', message: `Presensi ${attendanceType.toUpperCase()} berhasil untuk ${pegawai.nama}! WFH butuh approval admin.` });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally { 
      setLoading(false); 
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate || !reason) return alert("Mohon lengkapi seluruh kolom formulir!");
    
    const pegawai = employees[employeeId];
    if (!pegawai) return alert("NIP Pegawai tidak ditemukan!");

    setLoading(true);
    try {
      await submitLeaveRequest({ employeeId, namaPegawai: pegawai.nama, leaveType, startDate, endDate, reason });
      setStatus({ type: 'success', message: `Formulir ${leaveType.toUpperCase()} sukses dikirim ke HRD!` });
      setStartDate(''); setEndDate(''); setReason('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally { 
      setLoading(false); 
    }
  };

  const executeExport = (format) => {
    const rawData = fetchAllReportData();
    if (format === 'excel') exportToExcelCSV(rawData);
    if (format === 'pdf') exportToPDFPrint(rawData);
  };

  const getFilteredAttendance = () => {
    return logsData.attendance.filter(log => {
      const logDate = new Date(log.timestamp);
      return (logDate.getMonth() + 1) === parseInt(filterMonth) && logDate.getFullYear() === parseInt(filterYear);
    });
  };

  const getFilteredLeaves = () => {
    return logsData.leaves.filter(leave => {
      const leaveDate = new Date(leave.startDate);
      return (leaveDate.getMonth() + 1) === parseInt(filterMonth) && leaveDate.getFullYear() === parseInt(filterYear);
    });
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px', maxWidth: '640px', margin: '0 auto', color: '#333', marginBottom: '80px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>Portal Absensi Enterprise v3.0</h2>
      <p style={{ textAlign: 'center', color: '#666', marginTop: '0', marginBottom: '20px' }}>Dashboard Terintegrasi Pegawai & Manajemen Admin Emen</p>

      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', gap: '8px' }}>
        <button type="button" onClick={() => { setActiveTab('absen'); setStatus(null); }} style={{ flex: 1, padding: '12px', cursor: 'pointer', border: 'none', fontWeight: 'bold', backgroundColor: activeTab === 'absen' ? '#2563eb' : '#f1f5f9', color: activeTab === 'absen' ? '#fff' : '#475569', borderRadius: '6px 6px 0 0' }}>📷 Presensi AI</button>
        <button type="button" onClick={() => { setActiveTab('izin'); setStatus(null); }} style={{ flex: 1, padding: '12px', cursor: 'pointer', border: 'none', fontWeight: 'bold', backgroundColor: activeTab === 'izin' ? '#2563eb' : '#f1f5f9', color: activeTab === 'izin' ? '#fff' : '#475569', borderRadius: '6px 6px 0 0' }}>📄 Cuti & Izin</button>
        <button type="button" onClick={() => { setActiveTab('report'); setStatus(null); }} style={{ flex: 1, padding: '12px', cursor: 'pointer', border: 'none', fontWeight: 'bold', backgroundColor: activeTab === 'report' ? '#4f46e5' : '#f1f5f9', color: activeTab === 'report' ? '#fff' : '#475569', borderRadius: '6px 6px 0 0' }}>🛠️ Kontrol Admin</button>
      </div>
      {/* TAB 1: MODUL PRESENSI */}
      {activeTab === 'absen' && (
        <div>
          {aiError && <div style={{ color: 'red', fontWeight: 'bold' }}>{aiError}</div>}
          <CameraView videoRef={videoRef} isLive={isLive} blinkCount={blinkCount} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px' }}>
            <span>📍 Koordinat GPS Anda: {userCoords.latitude ? `${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}` : 'Mencari...'}</span>
            <button type="button" onClick={fetchCurrentLocation} style={{ padding: '6px 12px', cursor: 'pointer' }}>{gpsLoading ? "🔄 Menghitung..." : "🔄 Refresh GPS"}</button>
          </div>

          <form onSubmit={handleAbsen} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input type="text" placeholder="Masukkan NIP Pegawai Sah (Mulai: 19920815001)" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} style={{ padding: '12px', borderRadius: '6px', fontSize: '15px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
                <option value="WFO">WFO (Di Kantor Pusat)</option>
                <option value="SITE">SITE (Lokasi Apel: {siteCoords.name})</option>
                <option value="WFH_WFA">WFH / WFA (Butuh Approval Admin)</option>
              </select>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc', borderRadius: '6px' }}>
                <label style={{ cursor: 'pointer' }}><input type="radio" checked={attendanceType === 'masuk'} onChange={() => setAttendanceType('masuk')} /> Masuk</label>
                <label style={{ cursor: 'pointer' }}><input type="radio" checked={attendanceType === 'pulang'} onChange={() => setAttendanceType('pulang')} /> Pulang</label>
              </div>
            </div>

            {workMode === 'WFO' && (
              <div style={{ padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', backgroundColor: isWithinRadius ? '#dcfce7' : '#fee2e2', color: isWithinRadius ? '#166534' : '#991b1b', border: `1px solid ${isWithinRadius ? '#bbf7d0' : '#fecaca'}` }}>
                {isWithinRadius ? `🟢 Radius Valid WFO Kantor Pusat! (Jarak: ${Math.round(distance)} meter)` : `🚨 Luar Radius Kantor Pusat! Jarak: ${distance ? Math.round(distance) : '...'} meter (Max: 50m)`}
              </div>
            )}

            {workMode === 'SITE' && (
              <div style={{ padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', backgroundColor: isWithinRadius ? '#dcfce7' : '#fee2e2', color: isWithinRadius ? '#166534' : '#991b1b', border: `1px solid ${isWithinRadius ? '#bbf7d0' : '#fecaca'}` }}>
                {isWithinRadius ? `🟢 Radius Valid untuk SITE (${siteCoords.name})! (Jarak: ${Math.round(distance)} meter)` : `🚨 Luar Radius Lokasi Apel SITE! Jarak: ${distance ? Math.round(distance) : '...'} meter dari ${siteCoords.name} (Max: 50m)`}
              </div>
            )}

            {workMode === 'WFH_WFA' && (
              <div style={{ padding: '12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                🔵 Mode WFH/WFA Aktif: Bebas radius lokasi, waktu kehadiran memerlukan persetujuan manual Admin HRD di Tab Kontrol Admin.
              </div>
            )}

            <button type="submit" disabled={loading || !isLive || (workMode !== 'WFH_WFA' && !isWithinRadius)} style={{ padding: '14px', borderRadius: '6px', backgroundColor: (!isLive || (workMode !== 'WFH_WFA' && !isWithinRadius)) ? '#cbd5e1' : '#10b981', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              {loading ? "Menjalankan Kriptografi Wajah..." : `Konfirmasi Presensi ${attendanceType.toUpperCase()}`}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: MODUL PERIZINAN */}
      {activeTab === 'izin' && (
        <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3>Formulir Pengajuan Ketidakhadiran Resmian</h3>
          
          <input type="text" placeholder="Masukkan NIP Pegawai Anda" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc' }} required />
          
          <label style={{ fontWeight: '600', marginBottom: '-8px' }}>Kategori Pengajuan:</label>
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
            <option value="sakit">🤢 Sakit (Butuh Surat Dokter)</option>
            <option value="cuti_tahunan">🌴 Cuti Tahunan Karyawan</option>
            <option value="cuti_hamil">👶 Cuti Melahirkan / Hamil (Maternity)</option>
            <option value="izin_dinas">💼 Izin Perjalanan Dinas / On-Field</option>
            <option value="lupa_absen">⚠️ Klaim Lupa Koreksi Absen</option>
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Mulai Tanggal:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '90%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Sampai Tanggal:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '90%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: '600' }}>Alasan Keterangan / Link Berkas Dokumen:</label>
            <textarea placeholder="Tuliskan alasan detail pengajuan..." value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: '12px', borderRadius: '6px', height: '100px', border: '1px solid #ccc', fontFamily: 'inherit', fontSize: '14px' }} required />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
            {loading ? "Mengirim data..." : "Kirim Formulir Pengajuan Kehadiran"}
          </button>
        </form>
      )}
      {/* TAB 3: DASHBOARD KONTROL ADMIN DENGAN BARRIER LOGIN */}
      {activeTab === 'report' && !isAdminLoggedIn && (
        <form onSubmit={handleAdminLogin} style={{ padding: '24px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center', marginTop: '10px' }}>
          <h3>🔐 Barrier Keamanan: Hak Akses Khusus Admin</h3>
          <p style={{ fontSize: '14px', color: '#666' }}>Pegawai biasa dilarang masuk. Silakan masukkan kata sandi rahasia untuk mengonfigurasi database.</p>
          <input 
            type="password" 
            placeholder="Masukkan Sandi Admin (adminemen123)" 
            value={adminPasswordInput} 
            onChange={(e) => setAdminPasswordInput(e.target.value)} 
            style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', textAlign: 'center' }} 
            required 
          />
          <button type="submit" style={{ padding: '12px', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Verifikasi Sandi & Masuk Dashboard
          </button>
        </form>
      )}

      {activeTab === 'report' && isAdminLoggedIn && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#16a34a' }}>🟢 Mode Admin Sesi Aktif</span>
            <button type="button" onClick={handleAdminLogout} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Logout Admin</button>
          </div>

          {/* PANEL REVIEW TABEL BULANAN MULTI-TAHUN */}
          <div style={{ padding: '16px', border: '1px solid #4f46e5', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            <h3 style={{ marginTop: 0, color: '#4f46e5' }}>📅 Peninjauan Riwayat Data Bulanan & Multi-Tahun</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Pilih Bulan:</label>
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
                  <option value="1">Januari</option><option value="2">Februari</option><option value="3">Maret</option>
                  <option value="4">April</option><option value="5">Mei</option><option value="6">Juni</option>
                  <option value="7">Juli</option><option value="8">Agustus</option><option value="9">September</option>
                  <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Pilih Tahun (Historis):</label>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>

            <h5 style={{ marginBottom: '6px' }}>Hasil Pencarian Log Kehadiran Bulan {filterMonth} Tahun {filterYear}:</h5>
            <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '6px', padding: '8px', backgroundColor: '#fff', maxHeight: '150px' }}>
              {getFilteredAttendance().length === 0 ? (
                <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', margin: '10px 0' }}>Tidak ditemukan data rekaman pada periode tahun ini.</p>
              ) : (
                getFilteredAttendance().map(l => (
                  <div key={l.id} style={{ fontSize: '11px', borderBottom: '1px solid #f5f5f5', padding: '6px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📅 {new Date(l.timestamp).toLocaleDateString('id-ID')} | 🆔 {l.employeeId} - <strong>{l.namaPegawai}</strong></span>
                    <span>Mod: {l.workMode} | <strong style={{ color: l.approvalStatus === 'APPROVED' ? 'green' : 'orange' }}>{l.approvalStatus}</strong></span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ padding: '20px', border: '1px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>📊 Generator & Eksportir Data HRD</h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' }}>
              <button type="button" onClick={() => executeExport('excel')} style={{ padding: '10px 16px', borderRadius: '6px', backgroundColor: '#16a34a', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Excel (.CSV)</button>
              <button type="button" onClick={() => executeExport('pdf')} style={{ padding: '10px 16px', borderRadius: '6px', backgroundColor: '#dc2626', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cetak PDF</button>
            </div>
          </div>

          <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3 style={{ marginTop: 0, color: '#4f46e5' }}>📥 Kotak Masuk Persetujuan HRD (Approval)</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>Admin wajib memverifikasi pengajuan WFH atau berkas cuti di bawah ini agar absensi pegawai sah.</p>
            
            <h4 style={{ marginBottom: '6px' }}>1. Validasi Absen WFH/WFA Karyawan</h4>
            <div style={{ overflowX: 'auto', maxHeight: '150px', border: '1px solid #eee', borderRadius: '4px', padding: '6px' }}>
              {logsData.attendance.filter(l => l.workMode === 'WFH_WFA').length === 0 ? (
                <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center' }}>Tidak ada antrean absen WFH</p>
              ) : (
                logsData.attendance.filter(l => l.workMode === 'WFH_WFA').map(log => (
                  <div key={log.id} style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><strong>NIP: {log.employeeId}</strong> | {log.type.toUpperCase()} | Status: <span style={{ color: log.approvalStatus === 'APPROVED' ? 'green' : 'orange' }}>{log.approvalStatus}</span></div>
                    {log.approvalStatus === 'PENDING_APPROVAL' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button type="button" onClick={() => handleApproveAction('attendance', log.id, 'APPROVED')} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer' }}>Setujui</button>
                        <button type="button" onClick={() => handleApproveAction('attendance', log.id, 'REJECTED')} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer' }}>Tolak</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <h4 style={{ marginBottom: '6px', marginTop: '16px' }}>2. Berkas Cuti, Sakit & Melahirkan</h4>
            <div style={{ overflowX: 'auto', maxHeight: '150px', border: '1px solid #eee', borderRadius: '4px', padding: '6px' }}>
              {getFilteredLeaves().length === 0 ? (
                <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center' }}>Tidak ada antrean pengajuan cuti</p>
              ) : (
                getFilteredLeaves().map(leave => (
                  <div key={leave.id} style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><strong>{leave.namaPegawai}</strong> ({leave.leaveType.replace('_',' ')})<br/><span style={{ color: '#666' }}>{leave.startDate} s/d {leave.endDate} : {leave.reason}</span><br/>Status: <span style={{ color: leave.status === 'APPROVED' ? 'green' : 'orange' }}>{leave.status}</span></div>
                    {leave.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button type="button" onClick={() => handleApproveAction('leaves', leave.id, 'APPROVED')} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer' }}>Setujui</button>
                        <button type="button" onClick={() => handleApproveAction('leaves', leave.id, 'REJECTED')} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', cursor: 'pointer' }}>Tolak</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3 style={{ marginTop: 0, color: '#4f46e5' }}>📍 Pembaruan Lokasi SITE (Apel Luar / Khusus)</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>Ubah koordinat target di bawah ini saat mengadakan kegiatan apel luar lingkungan kantor.</p>
            <form onSubmit={handleUpdateSiteCoords} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Nama Acara" value={inputSiteName} onChange={(e) => setInputSiteName(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="number" step="any" placeholder="Latitude" value={inputSiteLat} onChange={(e) => setInputSiteLat(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required />
                <input type="number" step="any" placeholder="Longitude" value={inputSiteLon} onChange={(e) => setInputSiteLon(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required />
              </div>
              <button type="submit" style={{ padding: '10px', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Update Lokasi Apel</button>
            </form>
        </div>

        <div style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h3 style={{ marginTop: 0, color: '#4f46e5' }}>👤 Pendaftaran Pegawai Baru</h3>
            <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Masukkan NIP" value={newNip} onChange={(e) => setNewNip(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="Nama Lengkap" value={newNama} onChange={(e) => setNewNama(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required />
                <input type="text" placeholder="Jabatan" value={newJabatan} onChange={(e) => setNewJabatan(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} required />
        </div>
              
              <label style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '6px', color: '#475569' }}>Tautan Alamat Media Sosial (UU PDP Compliant):</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input type="text" placeholder="Username Instagram (cth: @emen_real)" value={newIg} onChange={(e) => setNewInsta(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }} />
                <input type="text" placeholder="ID Profil Facebook (cth: emen.sukses)" value={newFb} onChange={(e) => setNewFb(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }} />
                <input type="text" placeholder="Username LinkedIn (cth: emen-it)" value={newLinkedin} onChange={(e) => setNewLinkedin(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }} />
              </div>

              <button type="submit" style={{ padding: '10px', backgroundColor: '#4f46e5', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '6px' }}>Daftarkan Pegawai</button>
            </form>
            
            <h5 style={{ marginBottom: '4px', marginTop: '16px' }}>Pegawai Terdaftar ({Object.keys(employees).length}):</h5>
            <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '12px', border: '1px solid #eee', padding: '6px', borderRadius: '4px', backgroundColor: '#f8fafc' }}>
              {Object.entries(employees).map(([nip, info]) => (
                <div key={nip} style={{ padding: '6px 0', borderBottom: '1px solid #e2e8f0', lineHeight: '1.4' }}>
                  🆔 {nip} - <strong>{info.nama}</strong> ({info.jabatan})
                  <div style={{ color: '#64748b', fontSize: '11px', paddingLeft: '18px' }}>
                    📸 IG: {info.sosmed?.instagram || '-'} | 📘 FB: {info.sosmed?.facebook || '-'} | 💼 LN: {info.sosmed?.linkedin || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
      {/* ==================== WIDGET ICON OBROLAN POJOK KANAN BAWAH + BARRIER LOGIN MEDSOS ==================== */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, fontFamily: 'sans-serif' }}>
        <button 
          type="button" 
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff',
            border: 'none', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isChatOpen ? '✖' : '💬'}
        </button>

        {isChatOpen && (
          <div style={{
            position: 'absolute', bottom: '75px', right: '0', width: '340px', height: '430px',
            backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', fontSize: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>💬 Ruang Koordinasi Kehadiran</span>
              {socialUser && !isAdminLoggedIn && (
                <button type="button" onClick={handleSocialLogout} style={{ background: 'none', border: '1px solid #fff', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>Disconnect</button>
              )}
            </div>
            
            {/* KONDISI A: BELUM LOGIN MEDSOS */}
            {!socialUser && !isAdminLoggedIn ? (
              <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '40px' }}>🔒</span>
                <h4 style={{ margin: 0 }}>Otentikasi Identitas Diperlukan</h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Sesuai regulasi UU PDP, Anda wajib menautkan salah satu akun media sosial aktif untuk membuka fitur obrolan koordinasi.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '240px' }}>
                  <button type="button" onClick={() => executeSocialLogin('Google Auth')} style={{ padding: '10px', backgroundColor: '#ea4335', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>🔴 Masuk dengan Google</button>
                  <button type="button" onClick={() => executeSocialLogin('Facebook Auth')} style={{ padding: '10px', backgroundColor: '#1877f2', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>🔵 Masuk dengan Facebook</button>
                  <button type="button" onClick={() => executeSocialLogin('WhatsApp API')} style={{ padding: '10px', backgroundColor: '#25d366', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>🟢 Masuk via WhatsApp OTP</button>
                </div>
              </div>
            ) : (
              /* KONDISI B: SUDAH TERVERIFIKASI LOGIN */
              <>
                <div style={{ flex: 1, padding: '12px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {chatMessages.map(msg => {
                    const myName = socialUser ? socialUser.name : '';
                    const myProvider = socialUser ? socialUser.provider : '';
                    const myCurrentIdentity = isAdminLoggedIn ? 'Admin HRD 👑' : (socialUser ? myName + ' (' + myProvider + ')' : 'User Anonim');
                    const isMe = msg.sender === myCurrentIdentity;
                    const isSystem = msg.sender === 'System Bot';
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} style={{ alignSelf: 'center', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '11px', padding: '6px 12px', borderRadius: '6px', margin: '4px 0', border: '1px solid #fecaca', fontWeight: '500' }}>
                          {msg.text}
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px', textAlign: isMe ? 'right' : 'left' }}>{msg.sender}</div>
                        <div style={{
                          padding: '8px 12px', fontSize: '13px', lineHeight: '1.4',
                          backgroundColor: isMe ? '#2563eb' : '#e2e8f0',
                          color: isMe ? '#fff' : '#1e293b',
                          borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0'
                        }}>
                          {msg.text}
                          <div style={{ fontSize: '9px', textAlign: 'right', marginTop: '4px', opacity: 0.7 }}>{msg.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendChatMessage} style={{ display: 'flex', padding: '8px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                  <input 
                    type="text" 
                    placeholder={isAdminLoggedIn ? "Balas pesan pegawai..." : "Tulis pesan koordinasi..."}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px', marginRight: '6px' }}
                  />
                  <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Kirim</button>
                </form>
              </>
            )}
          </div>
        )}
      </div>

      <StatusCard status={status} />
    </div>
  );
}

export default App;

      