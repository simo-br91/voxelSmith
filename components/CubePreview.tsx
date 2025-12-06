import React from 'react';

interface CubePreviewProps {
  textureUrl: string | null;
  size?: number;
}

export const CubePreview: React.FC<CubePreviewProps> = ({ textureUrl, size = 80 }) => {
  if (!textureUrl) {
    return (
      <div 
        className="bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-gray-600 text-xs"
        style={{ width: size, height: size }}
      >
        No Tex
      </div>
    );
  }

  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    backgroundImage: `url(${textureUrl})`,
    backgroundSize: 'cover',
    imageRendering: 'pixelated', // Critical for voxel look
    border: '1px solid rgba(0,0,0,0.2)',
  };

  return (
    <div 
      className="perspective-container" 
      style={{ 
        width: size, 
        height: size, 
        perspective: '400px',
        overflow: 'visible' 
      }}
    >
      <style>{`
        .cube-spinner {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: spin 6s infinite linear;
        }
        @keyframes spin {
          from { transform: rotateX(-20deg) rotateY(0deg); }
          to { transform: rotateX(-20deg) rotateY(360deg); }
        }
      `}</style>
      <div className="cube-spinner">
        {/* Front */}
        <div style={{ ...faceStyle, transform: `rotateY(0deg) translateZ(${size/2}px)` }} />
        {/* Back */}
        <div style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${size/2}px)` }} />
        {/* Right */}
        <div style={{ ...faceStyle, transform: `rotateY(90deg) translateZ(${size/2}px)` }} />
        {/* Left */}
        <div style={{ ...faceStyle, transform: `rotateY(-90deg) translateZ(${size/2}px)` }} />
        {/* Top */}
        <div style={{ ...faceStyle, transform: `rotateX(90deg) translateZ(${size/2}px)` }} />
        {/* Bottom */}
        <div style={{ ...faceStyle, transform: `rotateX(-90deg) translateZ(${size/2}px)` }} />
      </div>
    </div>
  );
};