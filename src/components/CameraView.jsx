// ============================================================
// File: src/components/CameraView.jsx
// ============================================================
import React, { useEffect, useRef } from 'react';

export const CameraView = ({ videoRef, isLive, blinkCount }) => {
  const streamRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        alert(
          'Akses kamera ditolak atau tidak tersedia. Mohon izinkan akses kamera di browser Anda.\n\nDetail: ' +
            err.message
        );
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          borderRadius: '12px',
          transform: 'scaleX(-1)',
          backgroundColor: '#222',
        }}
      />

      {/* Overlay indikator panduan */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: isLive ? '#22c55e' : '#eab308',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {isLive ? '✅ Manusia Hidup Terverifikasi' : `⏳ Silakan Berkedip: ${blinkCount}/2`}
      </div>
    </div>
  );
};
