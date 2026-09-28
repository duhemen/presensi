import React, { useEffect, useRef } from 'react';

export const CameraView = ({ videoRef, isLive, blinkCount }) => {
  const streamRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        alert("Akses kamera ditolak atau tidak tersedia: " + err.message);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
        style={{ width: '100%', borderRadius: '12px', transform: 'scaleX(-1)', backgroundColor: '#222' }}
      />
      
      {/* Overlay Indikator Panduan */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        backgroundColor: isLive ? '#22c55e' : '#eab308',
        color: '#fff',
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: 'bold',
        fontSize: '14px'
      }}>
        {isLive ? "✅ Manusia Hidup Terverifikasi" : `⏳ Silakan Berkedip: ${blinkCount}/2`}
      </div>
    </div>
  );
};
