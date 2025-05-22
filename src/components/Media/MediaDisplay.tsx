import React, { useState, useEffect, useRef } from 'react';
import useWebcam from '../../hooks/useWebcam';
import useScreenShare from '../../hooks/useScreenShare';
import ComicSFXOverlay from '../UI/ComicSFXOverlay';

const MediaDisplay: React.FC = () => {
  // Refs for media elements
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Media hooks
  const { stream: webcamStream, status: webcamStatus } = useWebcam();
  const { stream: screenStream, status: screenStatus } = useScreenShare();
  
  // SFX state
  const [showSfx, setShowSfx] = useState(false);
  const [sfxType, setSfxType] = useState<'pow' | 'bam' | 'zap'>('zap');
  
  // Determine active media type
  const activeStream = screenStatus === 'active' ? screenStream : webcamStatus === 'active' ? webcamStream : null;
  const mediaType = screenStatus === 'active' ? 'screen' : webcamStatus === 'active' ? 'webcam' : 'none';
  
  // Handle media stream changes
  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
      
      // Show a comic effect when media changes
      setSfxType(mediaType === 'webcam' ? 'pow' : 'zap');
      setShowSfx(true);
      setTimeout(() => setShowSfx(false), 1500);
      
      console.log(`[MediaDisplay] ${mediaType.toUpperCase()} is now active`);  
    } else if (videoRef.current && !activeStream) {
      videoRef.current.srcObject = null;
      console.log('[MediaDisplay] No media stream active');
    }
  }, [activeStream, mediaType]);

  return (
    <div className="media-display">
      <div className="panel-title">MEDIA VIEWER</div>
      
      <div className="media-container">
        {mediaType === 'none' ? (
          <div className="no-media-placeholder">
            <div className="placeholder-icon">📺</div>
            <p>No media source connected.</p>
            <p>Use the utility belt controls to activate your webcam or share your screen.</p>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef}
              autoPlay 
              muted 
              playsInline
              className={`media-video ${mediaType}-video`}
            />
            <div className="media-type-indicator">
              {mediaType === 'webcam' ? 'CAMERA ACTIVE' : 'SCREEN SHARING'}
            </div>
          </>
        )}
      </div>
      
      {/* Comic effect overlay */}
      {showSfx && <ComicSFXOverlay visible={showSfx} type={sfxType} />}
    </div>
  );
};

export default MediaDisplay;
