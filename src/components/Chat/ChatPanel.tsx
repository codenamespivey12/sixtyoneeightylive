import React, { useState } from 'react'; // Removed useEffect as it wasn't used directly here
import { useGemini } from '../../contexts/GeminiContext';
import { AVAILABLE_VOICES } from '../../contexts/GeminiContext'; // Import AVAILABLE_VOICES
import type { VoicePreference } from '../../types/gemini.types';
import ComicSFXOverlay from '../UI/ComicSFXOverlay';

const ChatPanel: React.FC = () => {
  const { 
    messages, 
    sendMessage, 
    isConnected, 
    connectionStatus, 
    errorMessage: contextErrorMessage, // Renamed to avoid conflict
    selectedVoice,
    updateVoicePreference,
    isMicrophoneOn,
    toggleMicrophone,
    microphoneStream, // available if needed, but sendAudioData is separate
    microphoneError,
    microphoneVolume,
    isWebcamOn,
    toggleWebcam,
    webcamStream, 
    webcamError,
    isScreenShareOn,
    toggleScreenShare,
    screenShareStream, 
    screenShareError,
  } = useGemini();

  const [inputText, setInputText] = useState('');
  const [showSfx, setShowSfx] = useState(false);
  const [sfxType, setSfxType] = useState<'pow' | 'bam' | 'zap'>('pow');

  const handleSendMessage = () => {
    let videoStreamToUse: MediaStream | undefined = undefined;
    if (isScreenShareOn && screenShareStream) {
      videoStreamToUse = screenShareStream;
      console.log('[ChatPanel] Sending with Screen Share stream');
    } else if (isWebcamOn && webcamStream) {
      videoStreamToUse = webcamStream;
      console.log('[ChatPanel] Sending with Webcam stream');
    }

    if (!inputText.trim() && !videoStreamToUse) {
      console.log('[ChatPanel] No text or active video stream to send.');
      return;
    }
    if (!isConnected) {
      console.log('[ChatPanel] Not connected, cannot send message.');
      return;
    }
    
    sendMessage(inputText, videoStreamToUse); // Context's sendMessage handles the GeminiMessage creation
    
    if (inputText.trim()) {
      setInputText('');
    }
    
    setSfxType(inputText.trim() ? 'pow' : 'zap'); // 'zap' if only video
    setShowSfx(true);
    setTimeout(() => setShowSfx(false), 1500);
    
    console.log('[ChatPanel] Message/video sent. Text:', inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-panel">
      <div className="panel-title">MOJO'S CHAT ROOM</div>
      
      {connectionStatus === 'error' && contextErrorMessage && (
        <div className="error-message component-error">
          Error: {contextErrorMessage}
        </div>
      )}
      
      {/* Media Controls Section */}
      <div className="media-controls panel-section">
        <div className="control-header">MEDIA CONTROLS</div>
        <div className="control-group">
          <label htmlFor="voice-select">Mojo's Voice: </label>
          <select 
            id="voice-select" 
            value={selectedVoice} 
            onChange={(e) => updateVoicePreference(e.target.value as VoicePreference)}
            disabled={!isConnected}
            className="voice-select"
          >
            {AVAILABLE_VOICES.map(voice => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <button 
            onClick={toggleMicrophone} 
            disabled={!isConnected} 
            className={`media-toggle ${isMicrophoneOn ? 'active' : ''}`}
          >
            Mic ({isMicrophoneOn ? "ON" : "OFF"})
          </button>
          {isMicrophoneOn && microphoneStream && (
            <span className="mic-volume">Vol: {(microphoneVolume * 100).toFixed(0)}%</span>
          )}
        </div>
        {microphoneError && <div className="error-message media-error">Mic: {microphoneError.message}</div>}
        
        <div className="control-group">
          <button 
            onClick={toggleWebcam} 
            disabled={!isConnected} 
            className={`media-toggle ${isWebcamOn ? 'active' : ''}`}
          >
            Webcam ({isWebcamOn ? "ON" : "OFF"})
          </button>
        </div>
        {webcamError && <div className="error-message media-error">Webcam: {webcamError.message}</div>}

        <div className="control-group">
          <button 
            onClick={toggleScreenShare} 
            disabled={!isConnected} 
            className={`media-toggle ${isScreenShareOn ? 'active' : ''}`}
          >
            Screen ({isScreenShareOn ? "ON" : "OFF"})
          </button>
        </div>
        {screenShareError && <div className="error-message media-error">Screen: {screenShareError.message}</div>}
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat-message">
            {isConnected ? 
              "Connected! Send a message or video to Mojo. Don't forget to enable your microphone!" : 
              'Connect to Gemini using the CONNECT button in the utility belt.'}
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`chat-message ${message.isUser ? 'user-message' : 'ai-message'}`}
            >
              {message.content.split('\n').map((line, index) => (
                <React.Fragment key={index}>{line}<br/></React.Fragment>
              ))}
            </div>
          ))
        )}
      </div>
      
      <div className="chat-input-area">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? "Type your message, or just send video..." : "Connect to Gemini first..."}
          className="chat-input"
          rows={2}
          disabled={!isConnected}
        />
        <button 
          className="send-button" 
          onClick={handleSendMessage}
          disabled={!isConnected || (!inputText.trim() && !isWebcamOn && !isScreenShareOn && (!microphoneStream || !isMicrophoneOn))} // Also check mic if no text/video
        >
          SEND
        </button>
      </div>
      
      {showSfx && <ComicSFXOverlay visible={showSfx} type={sfxType} />}
    </div>
  );
};

export default ChatPanel;
