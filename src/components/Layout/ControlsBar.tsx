import React, { useState, useEffect } from 'react';
import { useGemini } from '../../contexts/GeminiContext';
import useMicrophone from '../../hooks/useMicrophone';
import useWebcam from '../../hooks/useWebcam';
import useScreenShare from '../../hooks/useScreenShare';

type ControlButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

const ControlButton: React.FC<ControlButtonProps> = ({ label, active = false, onClick }) => (
  <button 
    className={`control-button ${active ? 'active' : ''}`} 
    onClick={onClick}
  >
    <span className="button-icon">{label.charAt(0)}</span>
    <span className="button-label">{label}</span>
  </button>
);

const ControlsBar: React.FC = () => {
  // Gemini context for API connection
  const { isConnected, connectToGemini, disconnectFromGemini } = useGemini();
  
  // Custom hooks for media access
  const { status: micStatus, startMicrophone, stopMicrophone } = useMicrophone();
  const { status: webcamStatus, startWebcam, stopWebcam } = useWebcam();
  const { status: screenStatus, startScreenShare, stopScreenShare } = useScreenShare();
  
  // Local state
  const [apiKey, setApiKey] = useState<string>('');
  
  // Check for API key in .env file on component mount
  useEffect(() => {
    const envApiKey = import.meta.env?.VITE_GEMINI_API_KEY;
    if (envApiKey) {
      setApiKey(envApiKey as string);
      console.log('[ControlsBar] Found API key in environment variables');
    }
  }, []);
  
  // Derived state for button status
  const micActive = micStatus === 'active';
  const cameraActive = webcamStatus === 'active';
  const screenActive = screenStatus === 'active';

  const toggleMic = async () => {
    try {
      if (micActive) {
        await stopMicrophone();
      } else {
        await startMicrophone();
      }
      console.log(`[ControlsBar] Microphone ${!micActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('[ControlsBar] Microphone error:', error);
    }
  };

  const toggleCamera = async () => {
    try {
      // First stop screen sharing if active
      if (screenActive) {
        await stopScreenShare();
      }
      
      // Then toggle camera
      if (cameraActive) {
        await stopWebcam();
      } else {
        await startWebcam();
      }
      
      console.log(`[ControlsBar] Camera ${!cameraActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('[ControlsBar] Camera error:', error);
    }
  };

  const toggleScreen = async () => {
    try {
      // First stop webcam if active
      if (cameraActive) {
        await stopWebcam();
      }
      
      // Then toggle screen sharing
      if (screenActive) {
        await stopScreenShare();
      } else {
        await startScreenShare();
      }
      
      console.log(`[ControlsBar] Screen sharing ${!screenActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('[ControlsBar] Screen sharing error:', error);
    }
  };

  const toggleConnection = async () => {
    try {
      if (isConnected) {
        await disconnectFromGemini();
      } else {
        if (!apiKey) {
          alert('Please set your Gemini API key in the .env file as VITE_GEMINI_API_KEY');
          return;
        }
        await connectToGemini(apiKey);
      }
    } catch (error) {
      console.error('[ControlsBar] Connection error:', error);
    }
  };

  return (
    <>
      <ControlButton 
        label="MIC" 
        active={micActive} 
        onClick={toggleMic} 
      />
      
      <ControlButton 
        label="CAM" 
        active={cameraActive} 
        onClick={toggleCamera} 
      />
      
      <ControlButton 
        label="SCREEN" 
        active={screenActive} 
        onClick={toggleScreen} 
      />
      <div className="connection-status">
        {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
      </div>
      <ControlButton 
        label={isConnected ? "DISCONNECT" : "CONNECT"} 
        active={isConnected} 
        onClick={toggleConnection} 
      />
    </>
  );
};

export default ControlsBar;
