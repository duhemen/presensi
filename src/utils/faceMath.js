// ============================================================
// File: src/utils/faceMath.js
// Utilitas matematika: EAR, ekstraksi vektor wajah, Haversine GPS
// ============================================================

/**
 * Jarak Euclidean 2D (x, y) — lebih stabil untuk perhitungan EAR.
 */
const euclideanDistance2D = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Menghitung Eye Aspect Ratio (EAR) — indikator mata terbuka/tertutup.
 * EAR < 0.22 → mata tertutup (berkedip)
 * EAR > 0.28 → mata terbuka
 *
 * @param {Array} landmarks - Array 468 titik MediaPipe Face Mesh.
 * @param {'left'|'right'} eye - Mata yang diukur.
 * @returns {number} Nilai EAR.
 */
export const calculateEAR = (landmarks, eye = 'left') => {
  if (!Array.isArray(landmarks) || landmarks.length === 0) return 0;

  // Indeks titik mata MediaPipe Face Mesh v2
  const idx =
    eye === 'left'
      ? { p1: 33, p2: 160, p3: 158, p4: 133, p5: 153, p6: 144 }
      : { p1: 362, p2: 385, p3: 387, p4: 263, p5: 373, p6: 380 };

  const p1 = landmarks[idx.p1];
  const p2 = landmarks[idx.p2];
  const p3 = landmarks[idx.p3];
  const p4 = landmarks[idx.p4];
  const p5 = landmarks[idx.p5];
  const p6 = landmarks[idx.p6];

  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 0;

  const v1 = euclideanDistance2D(p2, p6);
  const v2 = euclideanDistance2D(p3, p5);
  const h = euclideanDistance2D(p1, p4);

  if (h === 0) return 0;
  return (v1 + v2) / (2.0 * h);
};

/**
 * Mengekstrak 30 titik kunci wajah (×3 koordinat = 90 angka) menjadi vektor rata.
 * Digunakan sebagai input hashing biometrik.
 */
export const extractKeyFaceVector = (landmarks) => {
  if (!Array.isArray(landmarks) || landmarks.length === 0) return [];

  const keyIndices = [
    1, 4, 33, 61, 133, 159, 263, 291, 362, 386,
    10, 152, 234, 454, 107, 336, 6, 197, 168, 8,
    57, 287, 13, 14, 78, 308, 95, 324, 88, 318,
  ];

  const vector = [];
  keyIndices.forEach((i) => {
    const lm = landmarks[i];
    if (lm) {
      vector.push(lm.x, lm.y, lm.z);
    }
  });
  return vector;
};

/**
 * Menghitung jarak antara dua koordinat GPS (Haversine).
 * @returns {number} Jarak dalam meter.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Radius bumi (meter)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
