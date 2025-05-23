// Types for Gemini Live API interactions

// String literal types for response modalities (as seen in backend.txt)
export type Modality = 'TEXT' | 'AUDIO' | 'VIDEO';
// Constants for easier usage
export const MODALITIES = {
  TEXT: 'TEXT' as Modality,
  AUDIO: 'AUDIO' as Modality,
  VIDEO: 'VIDEO' as Modality
};

// String literal types for media resolution (as seen in backend.txt)
export type MediaResolution = 'MEDIA_RESOLUTION_LOW' | 'MEDIA_RESOLUTION_MEDIUM' | 'MEDIA_RESOLUTION_HIGH';
// Constants for easier usage
export const MEDIA_RESOLUTIONS = {
  LOW: 'MEDIA_RESOLUTION_LOW' as MediaResolution,
  MEDIUM: 'MEDIA_RESOLUTION_MEDIUM' as MediaResolution,
  HIGH: 'MEDIA_RESOLUTION_HIGH' as MediaResolution
};

// String literal types for turn coverage (as seen in backend.txt)
export type TurnCoverage = 'TURN_INCLUDES_ALL_INPUT';
// Constants for easier usage
export const TURN_COVERAGES = {
  ALL_INPUT: 'TURN_INCLUDES_ALL_INPUT' as TurnCoverage
};

// Interface for WAV conversion options (as seen in backend.txt)
export interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

// Type for inline data in model responses (as seen in backend.txt)
export type InlineData = {
  data?: string;
  mimeType?: string;
};

// Type for file data in model responses (as seen in backend.txt)
export type FileData = {
  fileUri: string;
};

// Type for model response parts (as seen in backend.txt)
export type ModelResponsePart = {
  text?: string;
  inlineData?: InlineData;
  fileData?: FileData;
};

// Type for server content (as seen in backend.txt)
export type ServerContent = {
  turnComplete?: boolean;
  modelTurn?: {
    parts?: ModelResponsePart[];
  };
};

// Type for server message (as seen in backend.txt)
export type LiveServerMessage = {
  serverContent?: ServerContent;
};

// Type for Gemini session (updated for new SDK)
export interface Session {
  // Methods for the new SDK
  sendClientContent: (content: any) => void;
  sendRealtimeInput: (input: any) => void;
  close: () => void;
}

// Basic response type for client-side handling
export type GeminiResponse = {
  text?: string;
  audioData?: string;
  mimeType?: string;
  isComplete?: boolean;
};

// Message type for sending to Gemini
export type GeminiMessage = {
  text: string;
  mediaStream?: MediaStream;
};

// Function type for unsubscribing from message listeners
export type UnsubscribeFunction = () => void;

// Voice preference type with 'Leda' as default (as seen in backend.txt)
export type VoicePreference = 'Leda' | string;

// Connection status type
export type GeminiConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Connection error type
export type GeminiConnectionError = {
  code: string;
  message: string;
  details?: unknown;
};

// Configuration for Gemini service
export type GeminiConfig = {
  apiKey: string;
  voicePreference: VoicePreference;
  model: string;
  systemPrompt: string;
};

// Speech configuration type (as seen in backend.txt)
export type SpeechConfig = {
  voiceConfig: {
    prebuiltVoiceConfig: {
      voiceName: VoicePreference;
    };
  };
};

// Context window compression config (as seen in backend.txt)
export type ContextWindowCompressionConfig = {
  triggerTokens: string;
  slidingWindow: {
    targetTokens: string;
  };
};

// Realtime input configuration (as seen in backend.txt)
export type RealtimeInputConfig = {
  turnCoverage: TurnCoverage;
};

// Complete Gemini API configuration (as seen in backend.txt)
export type GeminiApiConfig = {
  responseModalities: Modality[];
  mediaResolution: MediaResolution;
  speechConfig: SpeechConfig;
  realtimeInputConfig: RealtimeInputConfig;
  contextWindowCompression: ContextWindowCompressionConfig;
  systemInstruction: {
    parts: [
      {
        text: string;
      }
    ];
  };
};
