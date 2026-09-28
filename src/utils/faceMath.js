/**
 * Menghitung jarak Euclidean antara dua titik koordinat 3D.
 */
const euclideanDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) +
    Math.pow(point1.y - point2.y, 2) +
    Math.pow(point1.z - point2.z, 2)
  );
};

/**
 * Menghitung Eye Aspect Ratio (EAR) untuk mendeteksi kedipan.
 * Menggunakan indeks titik standar MediaPipe Face Mesh.
 * @param {Array} landmarks - Array koordinat wajah dari MediaPipe.
 * @param {string} eye - 'left' atau 'right'.
 * @returns {number} - Nilai rasio mata (makin kecil artinya mata tertutup).
 */
export const calculateEAR = (landmarks, eye = 'left') => {
  // Indeks koordinat mata MediaPipe Face Mesh v2
  const eyeIndices = eye === 'left' 
    ? { p1: 33, p2: 160, p3: 158, p4: 133, p5: 153, p6: 144 }
    : { p1: 362, p2: 385, p3: 387, p4: 263, p5: 373, p6: 380 };

  const p1 = landmarks[eyeIndices.p1];
  const p2 = landmarks[eyeIndices.p2];
  const p3 = landmarks[eyeIndices.p3];
  const p4 = landmarks[eyeIndices.p4];
  const p5 = landmarks[eyeIndices.p5];
  const p6 = landmarks[eyeIndices.p6];

  // Jarak vertikal kelopak mata
  const v1 = euclideanDistance(p2, p6);
  const v2 = euclideanDistance(p3, p5);

  // Jarak horizontal sudut mata
  const h = euclideanDistance(p1, p4);

  // Rumus EAR
  const ear = (v1 + v2) / (2.0 * h);
  return ear;
};

/**
 * Mengekstrak koordinat wajah penting menjadi array rata (Flat Vector) untuk hashing.
 * Mengurangi jumlah titik dari 468 ke 30 titik utama untuk stabilitas pencocokan biner.
 */
export const extractKeyFaceVector = (landmarks) => {
  // Ambil beberapa titik kunci representatif (hidung, mata, rahang, bibir)
  const keyIndices = [
    1, 4, 33, 61, 133, 159, 263, 291, 362, 386, 
    10, 152, 234, 454, 107, 336, 6, 197, 168, 8,
    57, 287, 13, 14, 78, 308, 95, 324, 88, 318
  ];
  
  const vector = [];
  keyIndices.forEach(index => {
    if (landmarks[index]) {
      vector.push(landmarks[index].x);
      vector.push(landmarks[index].y);
      vector.push(landmarks[index].z);
    }
  });
  
  return vector;
};

/**
 * Menghitung jarak antara dua titik koordinat GPS (Latitude, Longitude) menggunakan Rumus Haversine.
 * @returns {number} - Jarak dalam satuan Meter.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Jari-jari bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; 
  return distance; // Hasil dalam meter
};
