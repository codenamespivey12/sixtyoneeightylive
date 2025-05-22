import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as geminiLiveService from '../services/geminiLiveService';
import type { 
  GeminiMessage, 
  GeminiConnectionStatus 
} from '../types/gemini.types';

// Define the context state type
interface GeminiContextState {
  connectionStatus: GeminiConnectionStatus;
  messages: Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
  }>;
  audioData: string | null;
  errorMessage: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connectToGemini: (apiKey: string) => Promise<void>;
  disconnectFromGemini: () => Promise<void>;
  sendMessage: (text: string, mediaStream?: MediaStream) => Promise<void>;
}

// Create the context with default values
const GeminiContext = createContext<GeminiContextState>({
  connectionStatus: 'disconnected',
  messages: [],
  audioData: null,
  errorMessage: null,
  isConnecting: false,
  isConnected: false,
  connectToGemini: async () => {},
  disconnectFromGemini: async () => {},
  sendMessage: async () => {},
});

// Provider props
interface GeminiProviderProps {
  children: ReactNode;
}

// Provider component
export const GeminiProvider: React.FC<GeminiProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<GeminiConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<GeminiContextState['messages']>([]);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Handle incoming messages from Gemini
  useEffect(() => {
    // Set up message listener
    const unsubscribe = geminiLiveService.onGeminiMessage((response) => {
      if (response.text) {
        addMessage(response.text, false);
      }
      
      if (response.audioData) {
        setAudioData(response.audioData);
      }
    });
    
    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Helper to add a message to the chat
  const addMessage = (content: string, isUser: boolean) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content,
        isUser,
        timestamp: new Date(),
      },
    ]);
  };
  
  // Connect to Gemini
  const connectToGemini = async (apiKey: string) => {
    try {
      setConnectionStatus('connecting');
      setIsConnecting(true);
      setErrorMessage(null);
      
      await geminiLiveService.connectToGemini(apiKey);
      
      setConnectionStatus('connected');
      setIsConnected(true);
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('[GeminiContext] Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Disconnect from Gemini
  const disconnectFromGemini = async () => {
    try {
      await geminiLiveService.disconnectFromGemini();
      setConnectionStatus('disconnected');
      setIsConnected(false);
    } catch (error) {
      setErrorMessage(`Disconnection error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('[GeminiContext] Disconnection error:', error);
    }
  };
  
  // Send a message to Gemini
  const sendMessage = async (text: string, mediaStream?: MediaStream) => {
    if (!text.trim() && !mediaStream) return;
    
    try {
      // Add user message to chat
      addMessage(text, true);
      
      // Send message to Gemini
      const message: GeminiMessage = {
        text,
        mediaStream
      };
      
      await geminiLiveService.sendChatMessage(message);
    } catch (error) {
      setErrorMessage(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
      console.error('[GeminiContext] Send message error:', error);
    }
  };
  
  // Provide the context value
  const contextValue: GeminiContextState = {
    connectionStatus,
    messages,
    audioData,
    errorMessage,
    isConnecting,
    isConnected,
    connectToGemini,
    disconnectFromGemini,
    sendMessage,
  };
  
  return (
    <GeminiContext.Provider value={contextValue}>
      {children}
    </GeminiContext.Provider>
  );
};

// Custom hook to use the Gemini context
export const useGemini = () => useContext(GeminiContext);

export default GeminiContext;
