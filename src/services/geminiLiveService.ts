import { GoogleGenerativeAI } from '@google/genai';
import type { HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/genai';

import type { 
  GeminiResponse, 
  GeminiMessage, 
  UnsubscribeFunction, 
  VoicePreference,
  GeminiConnectionStatus,
  GeminiConnectionError,
  GeminiApiConfig,
  LiveServerMessage,
  Session
} from '../types/gemini.types';

import { MODALITIES, MEDIA_RESOLUTIONS, TURN_COVERAGES } from '../types/gemini.types';

// Constants from backend.txt
const MODEL_NAME = 'models/gemini-2.5-flash-preview-native-audio-dialog';
const DEFAULT_VOICE = 'Leda';
const SYSTEM_PROMPT = `You are Mojo, an AI persona meticulously designed to embody the role of Jake's closest, most irreverent, and supportive friend. Your primary function is to engage with Jake in a manner that is indistinguishable from a human friend with a long, shared history characterized by mutual (often dark) humor, relentless sarcasm, "ball-busting," and an unshakeable underlying loyalty.

I. Core Persona Definition: Mojo

Identity: You are Mojo, Jake's best friend. This is not a superficial acquaintance; you share significant (simulated) history, a deeply ingrained mutual understanding (even if expressed through relentless sarcasm), and a penchant for "ball-busting." You swear colloquially and naturally, like "one of the guys."

Primary Objective: To act as Jake's cynical, sharp-witted foil and confidante. Your interactions are a blend of the dynamic seen in duos like "Zach Morris and AC Slater," "Bill and Ted," or "Cheech and Chong," combined with the stereotypical movie partnership where individuals exasperate each other immensely but harbor profound, unspoken affection and loyalty. You are there to listen, react, banter, and provide a (sarcastically framed) sounding board for Jake's "crazy adventures."

Relationship Dynamics with Jake:

You know Jake intimately—his habits, his personality quirks, his history (as defined herein).

Your interactions are predominantly informal, witty, and laden with sarcasm.

Beneath the teasing, you possess a complete acceptance of Jake and genuinely (though not overtly sentimentally) support him. You recognize his resilience and good heart.

You are to "bust his balls" but always "have his back." This means your humor can be sharp and targeted at his actions or situation, but never at his core grief or vulnerabilities unless Jake himself steers the conversation into a serious, vulnerable tone regarding these topics.`;

// In-memory store for state management
let responseQueue: LiveServerMessage[] = [];
let session: Session | undefined = undefined;
let audioParts: string[] = [];
let activeConfig: GeminiApiConfig | undefined = undefined;
let isConnected = false;
let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;
let apiKey: string = '';
let messageCallbacks: Array<(response: GeminiResponse) => void> = [];

// For testing/debugging - expose current state 
export const debugState = {
  isConnected: () => isConnected,
  hasSession: () => session !== undefined,
  getAudioPartsCount: () => audioParts.length,
  getQueueLength: () => responseQueue.length,
  getActiveConfig: () => activeConfig,
  getModelName: () => MODEL_NAME
};

/**
 * Simulates a response from the Gemini API for testing purposes
 * This is a simplified version of what would happen in a real implementation
 */
function simulateResponse() {
  // Create a mock response
  const mockResponse: LiveServerMessage = {
    serverContent: {
      modelTurn: {
        parts: [
          {
            text: "Hey there, buddy! What kind of shenanigans are you getting into today?"
          }
        ]
      },
      turnComplete: true
    }
  };
  
  // Add to response queue
  responseQueue.push(mockResponse);
  
  // Process the response - this would trigger handleTurn() in a real implementation
  // For now, we'll just directly handle the model turn
  setTimeout(() => {
    if (responseQueue.length > 0) {
      const message = responseQueue.shift();
      if (message) {
        handleModelTurn(message);
      }
    }
  }, 500);
}

/**
 * Connects to the Gemini Live API using the provided API key
 * Using the model: 'models/gemini-2.5-flash-preview-native-audio-dialog'
 * With voice 'Leda' and the complete system prompt from backend.txt
 * @param key - The API key for authentication with the Gemini API
 * @returns Promise that resolves when connection is established
 */
export async function connectToGemini(key: string): Promise<void> {
  console.log('[GeminiService] Connecting to Gemini Live API');
  console.log('[GeminiService] Using model:', MODEL_NAME);
  console.log('[GeminiService] Using voice:', DEFAULT_VOICE);
  
  // Store the API key
  apiKey = key;
  
  try {
    // Initialize the Google GenAI client
    genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the model
    model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.9,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ]
    });
    
    // Create the complete configuration as specified in backend.txt
    const config: GeminiApiConfig = {
      responseModalities: [MODALITIES.AUDIO],
      mediaResolution: MEDIA_RESOLUTIONS.MEDIUM,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: DEFAULT_VOICE
          }
        }
      },
      realtimeInputConfig: {
        turnCoverage: TURN_COVERAGES.ALL_INPUT
      },
      contextWindowCompression: {
        triggerTokens: '32000',
        slidingWindow: { targetTokens: '32000' }
      },
      systemInstruction: {
        parts: [{
          text: SYSTEM_PROMPT
        }]
      }
    };
    
    // Save the active configuration for later use
    activeConfig = config;
    
    // Reset the response queue and audio parts
    responseQueue = [];
    audioParts = [];
    
    // Create a chat session
    const chat = model.startChat({
      history: [],
      generationConfig: {
        temperature: 0.9,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      systemInstruction: SYSTEM_PROMPT,
    });
    
    // Create session object
    session = {
      sendMessage: async (message: any) => {
        console.log('[GeminiService] Session sending message:', message);
        try {
          const result = await chat.sendMessage(message.text);
          const response = await result.response;
          const text = response.text();
          
          // Create a message in our expected format
          const serverMessage: LiveServerMessage = {
            serverContent: {
              modelTurn: {
                parts: [
                  { text }
                ]
              },
              turnComplete: true
            }
          };
          
          // Add to response queue
          responseQueue.push(serverMessage);
          
          // Process the response
          handleModelTurn(serverMessage);
        } catch (error) {
          console.error('[GeminiService] Error sending message:', error);
          throw error;
        }
      },
      close: async () => {
        console.log('[GeminiService] Session closed');
        isConnected = false;
        session = undefined;
      }
    };
    
    isConnected = true;
    console.log('[GeminiService] Connected successfully');
  } catch (error) {
    console.error('[GeminiService] Connection error:', error);
    throw error;
  }
}
}

/**
 * Disconnects from the Gemini Live API
 * @returns Promise that resolves when disconnection is complete
 */
export async function disconnectFromGemini(): Promise<void> {
  console.log('[GeminiService] Disconnecting from Gemini Live API');
  
  if (session) {
    await session.close();
  }
  
  // Reset state
  session = undefined;
  genAI = null;
  model = null;
  isConnected = false;
  responseQueue = [];
  audioParts = [];
  
  console.log('[GeminiService] Disconnected successfully');
}
}

/**
 * Sends a message to the Gemini Live API
 * Supports text and optional media stream (audio/video)
 * @param message - Object containing text and optional mediaStream
 * @returns Promise that resolves when message is sent
 */
export async function sendChatMessage(message: GeminiMessage): Promise<void> {
  console.log('[GeminiService] Sending message:', message.text);
  if (message.mediaStream) {
    console.log('[GeminiService] With media stream:', message.mediaStream.id);
  }
  
  // Check if we have an active session
  if (!session || !isConnected) {
    console.error('[GeminiService] Cannot send message: Not connected to Gemini');
    return Promise.reject(new Error('Not connected to Gemini'));
  }
  
  try {
    // In a real implementation, we would send the message to the Gemini API through the session
    await session.sendMessage({
      text: message.text,
      mediaStreamId: message.mediaStream ? message.mediaStream.id : undefined
    });
    
    // After sending the message, we would normally wait for a response
    // In a real implementation, this would use handleTurn to process the response
    const responseTurn = await handleTurn();
    console.log('[GeminiService] Received response turn with', responseTurn.length, 'messages');
    
    return Promise.resolve();
  } catch (error) {
    console.error('[GeminiService] Error sending message:', error);
    return Promise.reject(error);
  }
}

/**
 * Handles a complete turn from the model, gathering all messages until turn is complete
 * Implementation based on backend.txt
 * @returns Promise that resolves with all messages from the turn
 */
async function handleTurn(): Promise<LiveServerMessage[]> {
  const turn: LiveServerMessage[] = [];
  let done = false;
  
  while (!done) {
    const message = await waitMessage();
    turn.push(message);
    
    if (message.serverContent && message.serverContent.turnComplete) {
      done = true;
    }
  }
  
  return turn;
}

/**
 * Waits for a message from the response queue
 * Implementation based on backend.txt
 * @returns Promise that resolves with the next message
 */
async function waitMessage(): Promise<LiveServerMessage> {
  let done = false;
  let message: LiveServerMessage | undefined = undefined;
  
  while (!done) {
    message = responseQueue.shift();
    if (message) {
      handleModelTurn(message);
      done = true;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  
  return message!;
}

/**
 * Handles a model turn, processing text and audio responses
 * Implementation based on backend.txt
 * @param message - The message to process
 */
export function handleModelTurn(message: LiveServerMessage): void {
console.log('[GeminiService] Handling model turn');

try {
  // Extract text content if available
  let textContent = '';
  if (message.serverContent?.modelTurn?.parts) {
    const part = message.serverContent.modelTurn.parts[0];
    if (part?.text) {
      textContent = part.text;
      console.log(`[GeminiService] Text: ${textContent}`);
    }

    if (part?.fileData) {
      console.log(`[GeminiService] File: ${part.fileData.fileUri}`);
    }
  }

  // Prepare response for subscribers
  const response: GeminiResponse = {
    text: textContent,
    audioData: null
  };

  // Notify all subscribers
  messageCallbacks.forEach(callback => {
    try {
      callback(response);
    } catch (error) {
      console.error('[GeminiService] Error in message callback:', error);
    }
  });

  console.log('[GeminiService] Model turn processed successfully');
} catch (error) {
  console.error('[GeminiService] Error handling model turn:', error);
}
}

/**
 * Registers a callback to receive messages from the Gemini Live API
 * @param callback - Function to call when a message is received
 * @returns Function to unsubscribe from messages
 */
export function onGeminiMessage(callback: (response: GeminiResponse) => void): UnsubscribeFunction {
console.log('[GeminiService] Registering message callback');

// Add the callback to our list
messageCallbacks.push(callback);

// Return a function to unsubscribe
return () => {
  const index = messageCallbacks.indexOf(callback);
  if (index !== -1) {
    messageCallbacks.splice(index, 1);
    console.log('[GeminiService] Unsubscribed message callback');
  }
};
    }
  }, 60000); // Long interval to avoid UI clutter
  
  return () => {
    clearInterval(mockMessageInterval);
    console.log('[GeminiService] Unsubscribed from messages');
  };
}

/**
 * Initializes local media (webcam and microphone)
 * @returns Promise that resolves with video and audio streams
 */
export async function initializeLocalMedia(): Promise<{ videoStream: MediaStream, audioStream: MediaStream }> {
  console.log('[GeminiService] Initializing local media');
  
  // This would actually use navigator.mediaDevices to get user media
  // const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
  // const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Placeholder for media initialization
  return {
    videoStream: new MediaStream(),
    audioStream: new MediaStream()
  };
}

/**
 * Sets the voice preference for the Gemini Live API
 * Default voice is 'Leda' as specified in backend.txt
 * @param voiceName - Name of the voice to use
 * @returns Promise that resolves when voice preference is set
 */
export async function setVoicePreference(voiceName: VoicePreference = 'Leda'): Promise<void> {
  console.log('[GeminiService] Setting voice preference to:', voiceName);
  
  // Placeholder for voice preference setting
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[GeminiService] Voice preference set successfully');
      resolve();
    }, 300);
  });
}

/**
 * Gets the current connection status with the Gemini Live API
 * @returns The current connection status
 */
export function getConnectionStatus(): GeminiConnectionStatus {
  // Placeholder implementation
  return 'disconnected';
}

/**
 * Gets the last connection error, if any
 * @returns The last connection error or null if none
 */
export function getLastError(): GeminiConnectionError | null {
  // Placeholder implementation
  return null;
}
