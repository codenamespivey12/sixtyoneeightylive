import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import * as geminiLiveService from '../services/geminiLiveService';
import { useMicrophone, useWebcam, useScreenShare } from '../hooks';
import type { 
  GeminiMessage, 
  GeminiConnectionStatus,
  VoicePreference 
} from '../types/gemini.types';

// Available voices (as per documentation)
export const AVAILABLE_VOICES: VoicePreference[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Leda', 'Orus', 'Zephyr'];
const DEFAULT_VOICE: VoicePreference = 'Leda';

// Define the context state type
interface GeminiContextState {
  connectionStatus: GeminiConnectionStatus;
  messages: Array<{
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
  }>;
  audioData: string | null; // For received audio from Gemini
  errorMessage: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  
  selectedVoice: VoicePreference;
  microphoneStream: MediaStream | null;
  isMicrophoneOn: boolean;
  microphoneError: Error | null;
  microphoneVolume: number; // from useMicrophone
  webcamStream: MediaStream | null;
  isWebcamOn: boolean;
  webcamError: Error | null;
  screenShareStream: MediaStream | null;
  isScreenShareOn: boolean;
  screenShareError: Error | null;

  connectToGemini: (apiKey: string) => Promise<void>;
  disconnectFromGemini: () => Promise<void>;
  sendMessage: (text: string, videoStream?: MediaStream) => Promise<void>;
  updateVoicePreference: (voice: VoicePreference) => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleWebcam: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}

// Create the context with default values
const GeminiContext = createContext<GeminiContextState>({
  connectionStatus: 'disconnected',
  messages: [],
  audioData: null,
  errorMessage: null,
  isConnecting: false,
  isConnected: false,
  
  selectedVoice: DEFAULT_VOICE,
  microphoneStream: null,
  isMicrophoneOn: false,
  microphoneError: null,
  microphoneVolume: 0,
  webcamStream: null,
  isWebcamOn: false,
  webcamError: null,
  screenShareStream: null,
  isScreenShareOn: false,
  screenShareError: null,

  connectToGemini: async () => {},
  disconnectFromGemini: async () => {},
  sendMessage: async () => {},
  updateVoicePreference: async () => {},
  toggleMicrophone: async () => {},
  toggleWebcam: async () => {},
  toggleScreenShare: async () => {},
});

// Provider props
interface GeminiProviderProps {
  children: ReactNode;
}

// Provider component
export const GeminiProvider: React.FC<GeminiProviderProps> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<GeminiConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<GeminiContextState['messages']>([]);
  const [audioData, setAudioData] = useState<string | null>(null); // For received audio
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Voice Preference
  const [selectedVoice, setSelectedVoice] = useState<VoicePreference>(DEFAULT_VOICE);

  // Media Hooks
  const { 
    stream: micStream, 
    status: micStatus, 
    error: micError, 
    volume: micVolume,
    startMicrophone, 
    stopMicrophone 
  } = useMicrophone();
  const { 
    stream: camStream, 
    status: camStatus, 
    error: camError, 
    startWebcam, 
    stopWebcam 
  } = useWebcam();
  const { 
    stream: shareStream, 
    status: shareStatus, 
    error: shareError, 
    startScreenShare, 
    stopScreenShare 
  } = useScreenShare();

  // Derived media states
  const isMicrophoneOn = micStatus === 'active';
  const isWebcamOn = camStatus === 'active';
  const isScreenShareOn = shareStatus === 'active';
  
  // Handle incoming messages from Gemini (for text and received audio)
  useEffect(() => {
    // Set up message listener for text and incoming audio data from Gemini
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
  
  // Send a message to Gemini (text and optional videoStream)
  const sendMessage = async (text: string, videoStream?: MediaStream) => {
    if (!text.trim() && !videoStream) {
      console.log('[GeminiContext] sendMessage: Empty message and no video stream.');
      return;
    }
    
    try {
      // Add user message to chat
      if (text.trim()) { // Only add user message if there's text
        addMessage(text, true);
      }
      
      // Send message to Gemini
      const message: GeminiMessage = {
        text: text.trim(), // Ensure text is trimmed
        videoStream // This will be webcam or screen share stream
      };
      
      console.log('[GeminiContext] Sending message to service:', message);
      await geminiLiveService.sendChatMessage(message);

    } catch (error) {
      const errMsg = `Failed to send message: ${error instanceof Error ? error.message : String(error)}`;
      setErrorMessage(errMsg);
      console.error('[GeminiContext] Send message error:', error);
      addMessage(`Error: ${errMsg}`, false); // Show error in chat
    }
  };

  // Update voice preference
  const updateVoicePreference = async (voice: VoicePreference) => {
    try {
      setErrorMessage(null);
      await geminiLiveService.setVoicePreference(voice);
      setSelectedVoice(voice);
      console.log(`[GeminiContext] Voice preference updated to ${voice}`);
    } catch (error) {
      const errMsg = `Failed to set voice preference: ${error instanceof Error ? error.message : String(error)}`;
      setErrorMessage(errMsg);
      console.error('[GeminiContext] Set voice preference error:', error);
    }
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    try {
      setErrorMessage(null);
      if (isMicrophoneOn) {
        stopMicrophone();
        console.log('[GeminiContext] Microphone stopped.');
      } else {
        await startMicrophone();
        console.log('[GeminiContext] Microphone started.');
      }
    } catch (error) { // Should be caught by useMicrophone hook's error state
      console.error('[GeminiContext] Toggle microphone error:', error);
      // Error state is handled by micError from the hook
    }
  };

  // Toggle webcam
  const toggleWebcam = async () => {
    try {
      setErrorMessage(null);
      if (isWebcamOn) {
        stopWebcam();
        console.log('[GeminiContext] Webcam stopped.');
      } else {
        await startWebcam();
        console.log('[GeminiContext] Webcam started.');
      }
    } catch (error) {
      console.error('[GeminiContext] Toggle webcam error:', error);
      // Error state is handled by camError from the hook
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    try {
      setErrorMessage(null);
      if (isScreenShareOn) {
        stopScreenShare();
        console.log('[GeminiContext] Screen share stopped.');
      } else {
        await startScreenShare();
        console.log('[GeminiContext] Screen share started.');
      }
    } catch (error) {
      console.error('[GeminiContext] Toggle screen share error:', error);
      // Error state is handled by shareError from the hook
    }
  };
  
  // Provide the context value
  const contextValue: GeminiContextState = {
    connectionStatus,
    messages,
    audioData, // Received audio from Gemini
    errorMessage,
    isConnecting,
    isConnected,
    
    selectedVoice,
    microphoneStream: micStream,
    isMicrophoneOn,
    microphoneError: micError,
    microphoneVolume: micVolume,
    webcamStream: camStream,
    isWebcamOn,
    webcamError: camError,
    screenShareStream: shareStream,
    isScreenShareOn,
    screenShareError: shareError,

    connectToGemini,
    disconnectFromGemini,
    sendMessage,
    updateVoicePreference,
    toggleMicrophone,
    toggleWebcam,
    toggleScreenShare,
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
