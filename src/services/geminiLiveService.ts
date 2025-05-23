import { GoogleGenAI, Modality } from '@google/genai';
import type { Session } from '@google/genai';

import type {
  GeminiResponse,
  GeminiMessage,
  UnsubscribeFunction,
  VoicePreference,
  GeminiConnectionStatus,
  GeminiConnectionError,
  GeminiApiConfig,
  LiveServerMessage
} from '../types/gemini.types';

// Constants for the Gemini Live API
const MODEL_NAME = 'gemini-2.5-flash-preview-native-audio-dialog'; // Using a more stable model without audio requirements
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
let currentVoiceName: VoicePreference = DEFAULT_VOICE;
let genAI: GoogleGenAI | null = null;
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
 * Connects to the Gemini Live API using the provided API key
 * Using the model: 'models/gemini-2.5-flash-preview-native-audio-dialog'
 * With voice 'Leda' and the complete system prompt from backend.txt
 * @param key - The API key for authentication with the Gemini API
 * @returns Promise that resolves when connection is established
 */
export async function connectToGemini(key: string): Promise<void> {
  console.log('[GeminiService] Connecting to Gemini Live API');
  console.log('[GeminiService] Using model:', MODEL_NAME);
  console.log('[GeminiService] Using voice:', currentVoiceName); // Use currentVoiceName

  // Store the API key
  apiKey = key;

  try {
    // Initialize the Google GenAI client
    genAI = new GoogleGenAI({ apiKey });

    // Create a simplified configuration for the new SDK based on the example
    const config = {
      responseModalities: [Modality.AUDIO],
      systemInstruction: {
        parts: [{
          text: SYSTEM_PROMPT
        }]
      },
      speechConfig: { // Add speechConfig
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: currentVoiceName
          }
        }
      }
    };
    console.log('[GeminiService] responseModalities set to AUDIO');
    console.log('[GeminiService] speechConfig set with voice:', currentVoiceName);

    // Save the active configuration for later use
    activeConfig = config as unknown as GeminiApiConfig;

    // Reset the response queue and audio parts
    responseQueue = [];
    audioParts = [];

    // Connect to sixtyoneeighty live
    if (genAI) {
      session = await genAI.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: function() {
            console.log('[GeminiService] WebSocket connection opened');
          },
          onmessage: function(message: any) {
            console.log('[GeminiService] Received message from Gemini');
            responseQueue.push(message as LiveServerMessage);
          },
          onerror: function(e: ErrorEvent) {
            console.error('[GeminiService] WebSocket error:', e.message);
          },
          onclose: function(e: CloseEvent) {
            console.log('[GeminiService] WebSocket closed:', e.reason);
            isConnected = false;
            session = undefined;

            // If the connection was closed due to voice extraction issues,
            // we'll try again with a different configuration
            if (e.reason && e.reason.includes("Cannot extract voices")) {
              console.log('[GeminiService] Reconnecting with text-only configuration...');
              // We'll handle reconnection in the UI layer
            }
          }
        },
        config
      });
    }

    isConnected = true;
    console.log('[GeminiService] Connected successfully');
  } catch (error) {
    console.error('[GeminiService] Connection error:', error);
    throw error;
  }
}

/**
 * Disconnects from the Gemini Live API
 * @returns Promise that resolves when disconnection is complete
 */
export async function disconnectFromGemini(): Promise<void> {
  console.log('[GeminiService] Disconnecting from Gemini Live API');

  if (session) {
    session.close();
  }

  // Reset state
  session = undefined;
  genAI = null;
  isConnected = false;
  responseQueue = [];
  audioParts = [];

  console.log('[GeminiService] Disconnected successfully');
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

    // Try to reconnect if the connection was lost
    if (!isConnected && apiKey) {
      console.log('[GeminiService] Attempting to reconnect...');
      try {
        await connectToGemini(apiKey);
        console.log('[GeminiService] Reconnected successfully, retrying message send');
        return sendChatMessage(message); // Retry sending the message
      } catch (reconnectError) {
        console.error('[GeminiService] Reconnection failed:', reconnectError);
        return Promise.reject(new Error('Not connected to Gemini and reconnection failed'));
      }
    }

    return Promise.reject(new Error('Not connected to Gemini'));
  }

  try {
    // Send the message to the Gemini Live API using the format from the example
    if (session) {
      session.sendClientContent({
        turns: message.text
      });
    }

    // Video Sending Logic
    if (message.videoStream && message.videoStream.active && session && isConnected) {
      console.log('[GeminiService] Attempting to send video frame...');
      try {
        await new Promise<void>((resolve, reject) => {
          const video = document.createElement('video');
          // Ensure we're working with a non-null MediaProvider
          const mediaStream = message.videoStream as MediaStream;
          video.srcObject = mediaStream;
          video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              const base64VideoFrame = dataUrl.split(',')[1]; // Remove "data:image/jpeg;base64," prefix

              if (session) {
                session.sendRealtimeInput({
                  video: {
                    data: base64VideoFrame,
                    mimeType: 'image/jpeg'
                  }
                });
                console.log('[GeminiService] Video frame sent successfully.');
              } else {
                console.warn('[GeminiService] Session became undefined before sending video frame.');
              }
            } else {
              console.error('[GeminiService] Failed to get canvas context for video frame.');
            }
            resolve();
          };
          video.onerror = (e) => {
            console.error('[GeminiService] Error loading video for frame capture:', e);
            reject(new Error('Error loading video for frame capture'));
          };
          video.play().catch(e => { // Ensure video is playing to capture a frame
             console.warn('[GeminiService] Video play() promise rejected:', e);
             // Attempt to resolve anyway if metadata is already loaded or will load
             // This can happen if the stream is short or already processed
             if (video.readyState >= 2) { // HAVE_CURRENT_DATA or more
                const event = new Event('loadedmetadata');
                video.onloadedmetadata && video.onloadedmetadata(event); // Check if onloadedmetadata exists before calling
             }
          });
        });
      } catch (videoError) {
        console.error('[GeminiService] Error processing video frame:', videoError);
        // Potentially reject the main promise or handle error as appropriate
        // For now, just logging, as text might have already been sent.
      }
    }

    // Process the response using handleTurn
    const responseTurn = await handleTurn();
    console.log('[GeminiService] Received response turn with', responseTurn.length, 'messages');

    return Promise.resolve();
  } catch (error) {
    console.error('[GeminiService] Error sending message:', error);

    // If there was an error sending the message, check if we're still connected
    if (!isConnected && apiKey) {
      console.log('[GeminiService] Connection lost during message send, attempting to reconnect...');
      try {
        await connectToGemini(apiKey);
        console.log('[GeminiService] Reconnected successfully, retrying message send');
        return sendChatMessage(message); // Retry sending the message
      } catch (reconnectError) {
        console.error('[GeminiService] Reconnection failed:', reconnectError);
      }
    }

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
    let audioData: string | undefined = undefined;
    let audioMimeType: string | undefined = undefined;

    if (message.serverContent?.modelTurn?.parts) {
      const part = message.serverContent.modelTurn.parts[0];

      if (part?.text) {
        textContent = part.text;
        console.log(`[GeminiService] Text content extracted: "${textContent}"`);
      }

      if (part?.inlineData) {
        console.log(`[GeminiService] Audio data received`);
        audioData = part.inlineData.data;
        audioMimeType = part.inlineData.mimeType; // Extract mimeType
        if (audioMimeType) {
          console.log('[GeminiService] Audio MIME type received:', audioMimeType);
        }

        // Store audio parts for potential WAV conversion
        if (audioData) {
          audioParts.push(audioData);
        }
      }

      if (part?.fileData) {
        console.log(`[GeminiService] File: ${part.fileData.fileUri}`);
      }
    }

    // Only send non-empty responses to subscribers
    if (textContent || audioData) {
      // Prepare response for subscribers
      const response: GeminiResponse = {
        text: textContent || undefined,
        audioData: audioData,
        audioMimeType: audioMimeType, // Add audioMimeType
        isComplete: message.serverContent?.turnComplete || false
      };

      // Notify all subscribers
      messageCallbacks.forEach(callback => {
        try {
          callback(response);
        } catch (error) {
          console.error('[GeminiService] Error in message callback:', error);
        }
      });

      // Log the content being sent to subscribers
      if (textContent) {
        console.log('[GeminiService] Sending text to subscribers:', textContent);
      }
      if (audioData) {
        console.log('[GeminiService] Sending audio data to subscribers');
      }
    }

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

/**
 * Initializes local media (webcam and microphone)
 * @returns Promise that resolves with video and audio streams
 */
export async function initializeLocalMedia(): Promise<{ videoStream: MediaStream, audioStream: MediaStream }> {
  console.log('[GeminiService] Initializing local media');

  try {
    // Use navigator.mediaDevices to get user media
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000 // Gemini Live API expects 16kHz audio
      }
    });

    console.log('[GeminiService] Media initialized successfully');
    return { videoStream, audioStream };
  } catch (error) {
    console.error('[GeminiService] Error initializing media:', error);
    // Return empty streams as fallback
    return {
      videoStream: new MediaStream(),
      audioStream: new MediaStream()
    };
  }
}

/**
 * Sets the voice preference for the Gemini Live API
 * Default voice is 'Leda' as specified in backend.txt
 * @param voiceName - Name of the voice to use
 * @returns Promise that resolves when voice preference is set
 */
export async function setVoicePreference(voiceName: VoicePreference = DEFAULT_VOICE): Promise<void> {
  console.log(`[GeminiService] Attempting to set voice preference to: ${voiceName}`);

  const oldVoiceName = currentVoiceName;
  currentVoiceName = voiceName;

  if (isConnected && session && oldVoiceName !== voiceName) {
    console.log(`[GeminiService] Voice changed from ${oldVoiceName} to ${voiceName}. Reconnecting...`);
    try {
      await disconnectFromGemini();
      // Ensure apiKey is available and connectToGemini is called
      if (apiKey) {
        await connectToGemini(apiKey);
        console.log(`[GeminiService] Reconnected successfully with new voice: ${voiceName}`);
      } else {
        console.error('[GeminiService] API key not available, cannot reconnect.');
        // Potentially revert voice change or handle error appropriately
        currentVoiceName = oldVoiceName; // Revert if reconnection isn't possible
        throw new Error('API key not available for reconnection.');
      }
    } catch (error) {
      console.error('[GeminiService] Error during reconnection after voice change:', error);
      currentVoiceName = oldVoiceName; // Revert voice change on error
      // Propagate the error to the caller
      throw error;
    }
  } else if (isConnected && session && oldVoiceName === voiceName) {
    console.log(`[GeminiService] Voice preference is already ${voiceName}. No change needed.`);
  } else {
    // Not connected, or voice is the same. Preference will be used on next connection.
    console.log(`[GeminiService] Voice preference set to ${voiceName}. It will be used on the next connection.`);
  }
  // If no reconnection was needed or it completed successfully
  return Promise.resolve();
}

/**
 * Gets the current connection status with the Gemini Live API
 * @returns The current connection status
 */
export function getConnectionStatus(): GeminiConnectionStatus {
  if (isConnected && session) {
    return 'connected';
  } else if (!isConnected && !session) {
    return 'disconnected';
  } else {
    return 'connecting';
  }
}

/**
 * Gets the last connection error, if any
 * @returns The last connection error or null if none
 */
export function getLastError(): GeminiConnectionError | null {
  // Placeholder implementation - in a real app, we would track errors
  return null;
}

/**
 * Sends audio data to the Gemini Live API
 * @param audioData - The audio data to send (should be 16-bit PCM, 16kHz, mono)
 * @returns Promise that resolves when audio is sent
 */
export async function sendAudioData(audioData: ArrayBuffer): Promise<void> {
  console.log('[GeminiService] Sending audio data');

  // Check if we have an active session
  if (!session || !isConnected) {
    console.error('[GeminiService] Cannot send audio: Not connected to Gemini');
    return Promise.reject(new Error('Not connected to Gemini'));
  }

  try {
    // Convert ArrayBuffer to base64 string
    const base64Audio = btoa(
      new Uint8Array(audioData)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Send the audio data to the Gemini Live API
    if (session) {
      session.sendRealtimeInput({
        audio: {
          data: base64Audio,
          mimeType: "audio/pcm;rate=16000"
        }
      });
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[GeminiService] Error sending audio data:', error);
    return Promise.reject(error);
  }
}

/**
 * Signals the start of voice activity to the Gemini Live API
 * Use this when automatic voice activity detection is disabled
 * @returns Promise that resolves when signal is sent
 */
export async function signalActivityStart(): Promise<void> {
  console.log('[GeminiService] Signaling activity start');

  // Check if we have an active session
  if (!session || !isConnected) {
    console.error('[GeminiService] Cannot signal activity: Not connected to Gemini');
    return Promise.reject(new Error('Not connected to Gemini'));
  }

  try {
    // Send activity start signal
    if (session) {
      session.sendRealtimeInput({
        activityStart: {}
      });
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[GeminiService] Error signaling activity start:', error);
    return Promise.reject(error);
  }
}

/**
 * Signals the end of voice activity to the Gemini Live API
 * Use this when automatic voice activity detection is disabled
 * @returns Promise that resolves when signal is sent
 */
export async function signalActivityEnd(): Promise<void> {
  console.log('[GeminiService] Signaling activity end');

  // Check if we have an active session
  if (!session || !isConnected) {
    console.error('[GeminiService] Cannot signal activity: Not connected to Gemini');
    return Promise.reject(new Error('Not connected to Gemini'));
  }

  try {
    // Send activity end signal
    if (session) {
      session.sendRealtimeInput({
        activityEnd: {}
      });
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[GeminiService] Error signaling activity end:', error);
    return Promise.reject(error);
  }
}