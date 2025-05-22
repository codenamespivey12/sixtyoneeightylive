import React, { useState } from 'react';
import { useGemini } from '../../contexts/GeminiContext';
import ComicSFXOverlay from '../UI/ComicSFXOverlay';

const ChatPanel: React.FC = () => {
  const { messages, sendMessage, isConnected, connectionStatus, errorMessage } = useGemini();
  const [inputText, setInputText] = useState('');
  const [showSfx, setShowSfx] = useState(false);
  const [sfxType, setSfxType] = useState<'pow' | 'bam' | 'zap'>('pow');

  const handleSendMessage = () => {
    if (!inputText.trim() || !isConnected) return;
    
    // Send message to Gemini via context
    sendMessage(inputText);
    
    // Clear input
    setInputText('');
    
    // Show comic effect
    setSfxType('pow');
    setShowSfx(true);
    setTimeout(() => setShowSfx(false), 1500);
    
    console.log('[ChatPanel] Message sent:', inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-panel">
      <div className="panel-title">CHAT PANEL</div>
      
      {connectionStatus === 'error' && errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat-message">
            {isConnected ? 
              'Connected! Send a message to Mojo.' : 
              'Connect to Gemini using the CONNECT button in the utility belt.'}
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`chat-message ${message.isUser ? 'user-message' : 'ai-message'}`}
            >
              {message.content}
            </div>
          ))
        )}
      </div>
      
      <div className="chat-input-area">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? "Type your message here..." : "Connect to Gemini first..."}
          className="chat-input"
          disabled={!isConnected}
        />
        <button 
          className="send-button" 
          onClick={handleSendMessage}
          disabled={!isConnected || !inputText.trim()}
        >
          SEND
        </button>
      </div>
      
      {/* Comic effect overlay */}
      {showSfx && <ComicSFXOverlay visible={showSfx} type={sfxType} />}
    </div>
  );
};

export default ChatPanel;
