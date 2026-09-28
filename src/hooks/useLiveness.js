// ============================================================
// File: src/hooks/useLiveness.js
// Custom Hook: Deteksi kedipan mata (liveness) + ekstraktor wajah
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { calculateEAR, extractKeyFaceVector } from '../utils/faceMath';

// URL CDN resmi (jangan diubah tanpa verifikasi)
const MEDIAPIPE_WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm';

const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// Ambang batas EAR untuk deteksi kedipan
const EAR_CLOSED_THRESHOLD = 0.22;
const EAR_OPEN_THRESHOLD = 0.28;
const MIN_BLINKS_TO_VERIFY = 2;

export const useLiveness = (videoRef) => {
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [extractedVector, setExtractedVector] = useState(null);
  const [error, setError] = useState(null);

  const wasEyeOpenRef = useRef(true);
  const requestRef = useRef(null);

  // ---------- 1. Muat model AI MediaPipe sekali ----------
  useEffect(() => {
    let isMounted = true;

    const initAI = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_CDN);
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        if (isMounted) setFaceLandmarker(landmarker);
      } catch (err) {
        if (isMounted) {
          setError(
            'Gagal memuat model AI Wajah: ' +
              (err?.message || 'Periksa koneksi internet dan izin kamera.')
          );
        }
      }
    };

    initAI();
    return () => {
      isMounted = false;
    };
  }, []);

  // ---------- 2. Loop deteksi frame ----------
  useEffect(() => {
    if (!faceLandmarker || !videoRef.current) return;

    const detectFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const timestamp = performance.now();
        try {
          const result = faceLandmarker.detectForVideo(video, timestamp);

          if (result?.faceLandmarks?.length > 0) {
            const landmarks = result.faceLandmarks[0];

            const leftEAR = calculateEAR(landmarks, 'left');
            const rightEAR = calculateEAR(landmarks, 'right');
            const avgEAR = (leftEAR + rightEAR) / 2.0;

            if (avgEAR < EAR_CLOSED_THRESHOLD) {
              if (wasEyeOpenRef.current) {
                setBlinkCount((prev) => {
                  const next = prev + 1;
                  if (next >= MIN_BLINKS_TO_VERIFY) setIsLive(true);
                  return next;
                });
                wasEyeOpenRef.current = false;
              }
            } else if (avgEAR > EAR_OPEN_THRESHOLD) {
              wasEyeOpenRef.current = true;
            }

            setExtractedVector(extractKeyFaceVector(landmarks));
          }
        } catch {
          // Abaikan frame error — video mungkin belum stabil
        }
      }
      requestRef.current = requestAnimationFrame(detectFrame);
    };

    requestRef.current = requestAnimationFrame(detectFrame);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [faceLandmarker, videoRef]);

  return { isLive, blinkCount, extractedVector, error };
};
