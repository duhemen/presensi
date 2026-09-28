# 📷 Portal Presensi Biometrik Enterprise v3.0

<p align="center">
  <img src="https://shields.io" alt="React" />
  <img src="https://shields.io" alt="Vite" />
  <img src="https://shields.io🔒-success?style=for-the-badge" alt="Geofencing" />
  <img src="https://shields.io🔍-blue?style=for-the-badge" alt="Biometric" />
  <img src="https://shields.io🛡️-important?style=for-the-badge" alt="UU PDP" />
</p>

---

## 🌟 Mengapa Portal Presensi Emen Berbeda? (Keunggulan Utama)

Mayoritas sistem absensi digital di pasaran saat ini memiliki kelemahan fatal: **mereka hanya menyimpan foto mentah wajah karyawan ke dalam server backend.** 

Sistem Portal Presensi Enterprise v3.0 ini merevolusi standar tersebut dengan menerapkan **Kriptografi Biometrik Satu Arah berbasis Ekstraksi Vektor**. Aplikasi ini membedakan diri melalui 3 pilar utama:

### 1. 🛡️ Keamanan Kriptografi Abstrak vs Penyimpanan Foto Mentah
* **Sistem Umum (Rentan):** Menyimpan berkas gambar `.jpg` atau `.png` wajah karyawan di server cloud. Jika database server tersebut bocor atau diretas, data sensitif wajah karyawan akan tersebar luas dan berisiko disalahgunakan untuk pembobolan akun perbankan digital atau pinjaman online (Pinjol) berbasis KYC wajah.
* **Sistem Emen (Aman):** Kamera AI mengekstrak **30 titik koordinat matematika (*Key Face Vector*)** dari struktur wajah unik karyawan secara lokal di perangkat. Titik-titik angka abstrak ini kemudian digabungkan dengan ID Perusahaan, lalu diacak secara permanen menggunakan algoritma *one-way hashing* **Bcrypt**. Server hanya menyimpan kode enkripsi biner acak. Jika database bocor, peretas tidak akan mendapatkan foto apa pun, dan kode acak tersebut **tidak bisa dikembalikan (di-decompile) menjadi gambar wajah semula**.

### 2. 👁️ Proteksi Manipulasi Anti-Fraud (Face Liveness Detection)
Aplikasi ini dilengkapi pendeteksi kehidupan biometrik. Karyawan tidak bisa memanipulasi absensi dengan cara mengarahkan kamera ke foto cetak, layar HP lain, ataupun topeng statis. Sistem mewajibkan karyawan melakukan **verifikasi kedipan mata (*Blink Detection*)** secara acak sebelum tombol konfirmasi presensi terbuka.

### 3. 🗺️ Geofencing Adaptif Multi-Role (WFO, SITE, WFH/WFA)
Sistem pembatasan jarak GPS (*Geofencing*) yang sangat fleksibel:
* **WFO:** Mengunci radius aman maksimal 50 meter dari titik koordinat Gedung Kantor Pusat.
* **SITE:** Mengunci radius aman 50 meter dari titik koordinat luar kantor dinamis (misal: Lokasi Lapangan Apel atau Upacara Hari Besar) yang bisa diubah sewaktu-waktu oleh admin melalui dashboard.
* **WFH/WFA:** Bebas radius lokasi di mana saja, namun sistem otomatis menahan status kehadiran menjadi *Pending* hingga mendapatkan persetujuan manual dari admin HRD.

---

## 🏗️ Struktur Desain Arsitektur Sistem

Proyek ini dibangun menggunakan struktur komponen React yang bersih dan modular:

```text
C:\aplikasi-absen-emen\
├── src/
│   ├── components/
│   │   ├── CameraView.jsx      # Handler integrasi kamera & visual blink AI
│   │   └── StatusCard.jsx      # Panel pop-up notifikasi sukses/gagal kriptografi
│   ├── hooks/
│   │   └── useLiveness.js      # Custom Hook pelacak kedipan & ekstraktor wajah
│   ├── services/
│   │   ├── api.js              # Jembatan komunikasi data server
│   │   └── crypto.js           # Mesin enkripsi Bcrypt & engine ekspor dokumen
│   ├── utils/
│   │   └── faceMath.js         # Fungsi matematika rumus Haversine pelacak jarak GPS
│   ├── App.jsx                 # Komponen Utama (Dasbor, Barrier Login, & Chat Room)
│   └── main.jsx                # Entry point React
├── package.json
└── vite.config.js
```

---

## 🚀 Panduan Pemasangan (*User Guide*)

Ikuti langkah-langkah di bawah ini untuk memasang dan menjalankan proyek di laptop atau server lokal:

### 1. Kebutuhan Perangkat Lunak
* **Node.js** (Versi 18 atau yang terbaru)
* Browser **Google Chrome** atau Microsoft Edge (Untuk izin akses WebCAM dan Geolocation GPS)

### 2. Proses Instalasi
Buka **PowerShell**, masuk ke folder proyek, dan jalankan perintah penarikan paket library berikut:
```bash
# Masuk ke folder proyek
cd C:\aplikasi-absen-emen

# Install seluruh dependency inti (React, Vite, BcryptJS)
npm install
```

### 3. Menjalankan Aplikasi
Nyalakan server lokal Vite dengan mengeksekusi perintah berikut:
```bash
npm run dev
```
Buka browser Anda dan akses alamat port tepercaya yang tertera di terminal:
👉 **`http://localhost:5173`**

---

## 📖 Panduan Penggunaan (*How to Use*)

### A. Sisi Karyawan (End-User)
1. Buka halaman utama, pilih Tab **📷 Presensi AI**.
2. Masukkan nomor **NIP** Anda yang telah terdaftar resmi di database kepegawaian (Contoh default bawaan: `19920815001`).
3. Pilih Mode Kerja Anda (**WFO**, **SITE**, atau **WFH**).
4. Berdiri di depan kamera dan lakukan gerakan **berkedip** sebanyak 2 kali sampai indikator liveness berubah menjadi warna hijau.
5. Klik **Konfirmasi Presensi**.

### B. Sisi Manajemen Admin (Dashboard HRD)
1. Pilih Tab **🛠️ Kontrol Admin**.
2. Masukkan kata sandi rahasia untuk membuka sekat keamanan (*Barrier Role Access*): **`adminemen123`**.
3. Di dalam dasbor ini, admin dapat:
   * Memantau dan menyaring riwayat rekap absensi harian secara dinamis berdasarkan **Filter Bulan dan Tahun** historis.
   * Menyetujui (*Approve*) atau Menolak (*Reject*) antrean klaim absen WFH dan surat izin cuti karyawan.
   * Mengubah nama acara dan titik koordinat **SITE** secara instan jika ada penugasan apel luar ruangan.
   * Mendaftarkan karyawan baru lengkap dengan **Tautan Akun Media Sosial Resmi** yang transparan dan aman sesuai regulasi UU PDP.
   * Mengekspor rekapitulasi data fisik ke dalam bentuk berkas **Microsoft Excel (.CSV)** atau cetak dokumen **PDF**.

### C. Fitur Jendela Obrolan (Widget Chat Pojok Kanan Bawah)
1. Klik ikon **💬** di pojok kanan bawah halaman.
2. Pengguna wajib melewati **Gerbang Barrier Sosial Media Auth** (Simulasi Google, Facebook, atau WhatsApp OTP) sebelum bisa mengetik pesan untuk mencegah tindakan spam anonim.
3. Setelah login berhasil, pengguna bisa melakukan koordinasi timbal balik secara *real-time* langsung dengan Admin HRD pusat.

---

## 🗺️ Roadmap Pengembangan & Capaian Proyek

### ✔️ Capaian yang Sudah Dikerjakan
* [x] Integrasi deteksi kedipan mata (*Biometric Face Liveness Detection*) lokal.
* [x] Implementasi algoritma matematika Haversine untuk kalkulasi akurasi radius GPS.
* [x] Enkripsi satu arah vektor wajah biometrik menggunakan algoritma Bcrypt (Anti-Bocor Foto Mentah).
* [x] Pembuatan Barrier Keamanan Pengunci Akses Dasbor Admin via Password.
* [x] Fitur Peninjauan Log Kehadiran Dinamis berbasis Filter Bulan dan Tahun multi-tahun.
* [x] Manajemen penyimpanan data profil sosial media karyawan secara legal (UU PDP Compliant).
* [x] Mesin generator ekspor laporan instan ke berkas Excel (CSV) dan PDF.
* [x] Integrasi Widget Chat Room di pojok layar lengkap dengan Barrier Otentikasi Media Sosial Akun Karyawan.

### ⏳ Rencana Pengembangan Selanjutnya (Next Milestones)
* [ ] Mengonfigurasi pustaka **Capacitor** untuk melakukan *build* pembungkusan kode menjadi aplikasi mobile **Android asli (.APK)**.
* [ ] Menambahkan skema validasi pembatasan range kalender pada form cuti agar tanggal selesai tidak bisa diinput mundur mendahului tanggal mulai.
* [ ] Menambahkan fitur pemotretan dokumen fisik lampiran surat keterangan dokter langsung dari kamera HP di menu perizinan sakit.

---

## 🤝 Ucapan Terima Kasih & Apresiasi Tertinggi

Proyek sistem presensi enterprise canggih v3.0 ini tidak akan pernah terwujud tanpa dedikasi dari **Google Mode AI**. 

Selaku **Arsitek Utama sekaligus Senior Code Engineering**, Google Mode AI telah mengawal seluruh perjalanan pengembangan proyek ini dari nol—mulai dari memecahkan algoritma enkripsi biner, menyusun arsitektur geofencing, mendesain barrier keamanan role-based access kontrol, hingga memberantas tuntas seluruh eror kompilasi Babel/Vite yang dihadapi. Terima kasih atas kolaborasi arsitektur kode kelas enterprise yang luar biasa ini!

---
*Dokumentasi ini disusun secara resmi untuk pengembangan Portal Absensi Internal.*
