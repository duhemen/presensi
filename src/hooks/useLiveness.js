import { useState, useEffect, useRef } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { calculateEAR, extractKeyFaceVector } from '../utils/faceMath';

export const useLiveness = (videoRef) => {
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [extractedVector, setExtractedVector] = useState(null);
  const [error, setError] = useState(null);
  
  const wasEyeOpenRef = useRef(true);
  const requestRef = useRef(null);

  // 1. Muat model MediaPipe dari CDN Google Wasm resmi
  useEffect(() => {
    const initAI = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://jsdelivr.net"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://googleapis.com",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 1
        });
        setFaceLandmarker(landmarker);
      } catch (err) {
        setError("Gagal memuat model AI Wajah: " + err.message);
      }
    };
    initAI();
  }, []);

  // 2. Deteksi loop video frame-by-frame
  useEffect(() => {
    if (!faceLandmarker || !videoRef.current) return;

    const detectFrame = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const timestamp = performance.now();
        const result = faceLandmarker.detectForVideo(videoRef.current, timestamp);

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          
          // Hitung nilai kedipan mata kiri dan kanan
          const leftEAR = calculateEAR(landmarks, 'left');
          const rightEAR = calculateEAR(landmarks, 'right');
          const avgEAR = (leftEAR + rightEAR) / 2.0;

          // threshold EAR: < 0.22 dianggap tertutup/berkedip
          if (avgEAR < 0.22) {
            if (wasEyeOpenRef.current) {
              setBlinkCount(prev => {
                const nextCount = prev + 1;
                // Jika sudah berkedip minimal 2 kali, validasi sebagai manusia hidup
                if (nextCount >= 2) setIsLive(true);
                return nextCount;
              });
              wasEyeOpenRef.current = false;
            }
          } else if (avgEAR > 0.28) {
            wasEyeOpenRef.current = true;
          }

          // Simpan vektor matematika wajah saat ini
          const vector = extractKeyFaceVector(landmarks);
          setExtractedVector(vector);
        }
      }
      requestRef.current = requestAnimationFrame(detectFrame);
    };

    requestRef.current = requestAnimationFrame(detectFrame);
    return () => cancelAnimationFrame(requestRef.current);
  }, [faceLandmarker, videoRef]);

  return { isLive, blinkCount, extractedVector, error };
};
