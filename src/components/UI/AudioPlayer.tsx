import React, { useEffect, useRef } from 'react';
import { useGemini } from '../../contexts/GeminiContext';

// AudioContext Management
let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext({ sampleRate: 24000 }); // Set sample rate based on known PCM rate
    console.log('[AudioPlayer] New AudioContext created with sample rate 24000 Hz');
  }
  return audioContext;
};

// Base64 to ArrayBuffer Conversion
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * AudioPlayer component that plays audio data received from Gemini
 */
const AudioPlayer: React.FC = () => {
  const { audioData, audioMimeType } = useGemini();
  const audioRef = useRef<HTMLAudioElement | null>(null); // For non-PCM audio

  const playPcmData = (ctx: AudioContext, data: string) => {
    let arrayBuffer;
    try {
      arrayBuffer = base64ToArrayBuffer(data);
    } catch (e) {
      console.error('[AudioPlayer] Error converting base64 to ArrayBuffer:', e);
      return;
    }

    ctx.decodeAudioData(arrayBuffer)
      .then(decodedBuffer => {
        console.log('[AudioPlayer] Audio data decoded successfully.');
        const source = ctx.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(ctx.destination);
        source.start(0);
        console.log('[AudioPlayer] PCM playback started via Web Audio API.');
      })
      .catch(error => {
        console.error('[AudioPlayer] Error decoding PCM audio data:', error);
      });
  };

  useEffect(() => {
    if (audioData) {
      const currentMimeType = audioMimeType || 'audio/mp3'; // Default if not provided

      // Standardize PCM mime type check
      const isPcm = currentMimeType.startsWith('audio/pcm') || 
                    currentMimeType.startsWith('audio/L16') || 
                    currentMimeType.startsWith('audio/l16');


      if (isPcm) {
        console.log('[AudioPlayer] Attempting to play PCM audio using Web Audio API.');
        const localAudioContext = getAudioContext();

        if (localAudioContext.state === 'suspended') {
          localAudioContext.resume().then(() => {
            console.log('[AudioPlayer] AudioContext resumed.');
            playPcmData(localAudioContext, audioData);
          }).catch(e => console.error('[AudioPlayer] Error resuming AudioContext:', e));
        } else {
          playPcmData(localAudioContext, audioData);
        }
      } else {
        console.log(`[AudioPlayer] Attempting to play audio with MIME type: ${currentMimeType} using HTMLAudioElement.`);
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        try {
          const audioSrc = `data:${currentMimeType};base64,${audioData}`;
          audioRef.current.src = audioSrc;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log('[AudioPlayer] HTMLAudioElement playback started for', currentMimeType))
              .catch(error => console.error('[AudioPlayer] HTMLAudioElement playback failed:', error));
          }
        } catch (error) {
          console.error('[AudioPlayer] Error setting up HTMLAudioElement:', error);
        }
      }
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      // Web Audio API sources stop themselves.
      // If we needed to stop them, we'd need a ref to the sourceNode.
      // For now, this is sufficient as Gemini responses are typically short.
    };
  }, [audioData, audioMimeType]); // playPcmData is stable as it's defined outside but relies on audioData from closure.

  return null;
};

export default AudioPlayer;
