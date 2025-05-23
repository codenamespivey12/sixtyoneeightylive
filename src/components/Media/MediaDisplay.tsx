import React, { useEffect, useRef } from 'react';
import { useGemini } from '../../contexts/GeminiContext';
// import ComicSFXOverlay from '../UI/ComicSFXOverlay'; // SFX can be re-added later if needed

const MediaDisplay: React.FC = () => {
  const { 
    webcamStream, 
    isWebcamOn, 
    screenShareStream, 
    isScreenShareOn 
  } = useGemini();

  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (webcamVideoRef.current && webcamStream) {
      webcamVideoRef.current.srcObject = webcamStream;
      console.log('[MediaDisplay] Webcam stream attached.');
    } else if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
    }
  }, [webcamStream, isWebcamOn]); // Re-run if stream or on-status changes

  useEffect(() => {
    if (screenShareVideoRef.current && screenShareStream) {
      screenShareVideoRef.current.srcObject = screenShareStream;
      console.log('[MediaDisplay] Screen share stream attached.');
    } else if (screenShareVideoRef.current) {
      screenShareVideoRef.current.srcObject = null;
    }
  }, [screenShareStream, isScreenShareOn]); // Re-run if stream or on-status changes

  const noMediaActive = !isWebcamOn && !isScreenShareOn;

  return (
    <div className="media-display">
      <div className="panel-title">LOCAL MEDIA PREVIEW</div>
      
      <div className="media-container">
        {noMediaActive && (
          <div className="no-media-placeholder">
            <div className="placeholder-icon">📺</div>
            <p>Local media previews will appear here.</p>
            <p>Enable Webcam or Screen Share from the Chat Panel.</p>
          </div>
        )}

        {isWebcamOn && webcamStream && (
          <div className="media-feed webcam-feed">
            <video 
              ref={webcamVideoRef}
              autoPlay 
              muted 
              playsInline
              className="media-video"
            />
            <div className="media-type-indicator">WEBCAM PREVIEW</div>
          </div>
        )}

        {isScreenShareOn && screenShareStream && (
          <div className="media-feed screenshare-feed">
            <video 
              ref={screenShareVideoRef}
              autoPlay 
              muted 
              playsInline
              className="media-video"
            />
            <div className="media-type-indicator">SCREEN SHARE PREVIEW</div>
          </div>
        )}
      </div>
      
      {/* SFX can be re-added here if desired, e.g., based on isWebcamOn/isScreenShareOn changes */}
      {/* {showSfx && <ComicSFXOverlay visible={showSfx} type={sfxType} />} */}
    </div>
  );
};

export default MediaDisplay;
