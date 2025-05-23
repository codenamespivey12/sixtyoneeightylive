
import React, { useEffect, useRef } from 'react';
import { useGemini } from '../../contexts/GeminiContext';

// AudioContext Management
let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext({ sampleRate: 24000 }); // Gemini provides 24kHz audio
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

// Helper function to create a WAV header
function createWavHeader(pcmDataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number): ArrayBuffer {
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmDataLength;
  // The RIFF chunk size includes the WAVE header and the fmt and data chunks.
  // So, it's 4 (for "WAVE") + (8 + fmt_chunk_size) + (8 + data_chunk_size)
  // Standard fmt_chunk_size for PCM is 16.
  // So, RIFF chunk size = 4 + (8 + 16) + (8 + dataSize) = 36 + dataSize
  const riffChunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44); // Standard WAV header size
  const view = new DataView(buffer);

  // RIFF identifier ("RIFF")
  view.setUint8(0, 'R'.charCodeAt(0));
  view.setUint8(1, 'I'.charCodeAt(0));
  view.setUint8(2, 'F'.charCodeAt(0));
  view.setUint8(3, 'F'.charCodeAt(0));
  // RIFF chunk size
  view.setUint32(4, riffChunkSize, true);
  // WAVE identifier ("WAVE")
  view.setUint8(8, 'W'.charCodeAt(0));
  view.setUint8(9, 'A'.charCodeAt(0));
  view.setUint8(10, 'V'.charCodeAt(0));
  view.setUint8(11, 'E'.charCodeAt(0));
  // fmt sub-chunk identifier ("fmt ")
  view.setUint8(12, 'f'.charCodeAt(0));
  view.setUint8(13, 'm'.charCodeAt(0));
  view.setUint8(14, 't'.charCodeAt(0));
  view.setUint8(15, ' '.charCodeAt(0));
  // Size of fmt chunk (16 for PCM)
  view.setUint32(16, 16, true);
  // Audio format (1 for PCM)
  view.setUint16(20, 1, true);
  // Number of channels
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint32(28, byteRate, true);
  // Block align (NumChannels * BitsPerSample/8)
  view.setUint16(32, blockAlign, true);
  // Bits per sample
  view.setUint16(34, bitsPerSample, true);
  // data sub-chunk identifier ("data")
  view.setUint8(36, 'd'.charCodeAt(0));
  view.setUint8(37, 'a'.charCodeAt(0));
  view.setUint8(38, 't'.charCodeAt(0));
  view.setUint8(39, 'a'.charCodeAt(0));
  // data chunk size (pcmDataLength)
  view.setUint32(40, dataSize, true);

  return buffer;
}

/**
 * AudioPlayer component that plays audio data received from Gemini
 */
const AudioPlayer: React.FC = () => {
  const { audioData } = useGemini();
  const audioMimeType = 'audio/mp3'; // Default MIME type
  const audioRef = useRef<HTMLAudioElement | null>(null); // For non-PCM audio

  const playPcmDataAsWav = (ctx: AudioContext, base64PcmData: string) => {
    let pcmArrayBuffer;
    try {
      pcmArrayBuffer = base64ToArrayBuffer(base64PcmData);
    } catch (e) {
      console.error('[AudioPlayer] Error converting base64 PCM to ArrayBuffer:', e);
      return;
    }

    const pcmDataLength = pcmArrayBuffer.byteLength;
    // Gemini audio is 24000 Hz, mono, 16-bit PCM
    const header = createWavHeader(pcmDataLength, 24000, 1, 16);

    const wavBuffer = new ArrayBuffer(header.byteLength + pcmDataLength);
    const headerView = new Uint8Array(header);
    const pcmView = new Uint8Array(pcmArrayBuffer);
    const wavView = new Uint8Array(wavBuffer);

    wavView.set(headerView, 0);
    wavView.set(pcmView, header.byteLength);

    ctx.decodeAudioData(wavBuffer)
      .then(decodedBuffer => {
        console.log('[AudioPlayer] WAV data decoded successfully.');
        const source = ctx.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(ctx.destination);
        source.start(0);
        console.log('[AudioPlayer] PCM (as WAV) playback started via Web Audio API.');
      })
      .catch(error => {
        console.error('[AudioPlayer] Error decoding PCM (as WAV) audio data:', error);
      });
  };

  useEffect(() => {
    if (audioData) {
      const currentMimeType = audioMimeType || 'audio/mp3'; // Default if not provided

      // Standardize PCM mime type check
      const isPcm = currentMimeType.toLowerCase().startsWith('audio/pcm') ||
                    currentMimeType.toLowerCase().startsWith('audio/l16'); // L16 is often used for 16-bit PCM

      if (isPcm) {
        console.log('[AudioPlayer] Attempting to play PCM audio by packaging as WAV using Web Audio API.');
        const localAudioContext = getAudioContext();

        if (localAudioContext.state === 'suspended') {
          localAudioContext.resume().then(() => {
            console.log('[AudioPlayer] AudioContext resumed.');
            playPcmDataAsWav(localAudioContext, audioData);
          }).catch(e => console.error('[AudioPlayer] Error resuming AudioContext:', e));
        } else {
          playPcmDataAsWav(localAudioContext, audioData);
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
              .catch((error: Error) => console.error('[AudioPlayer] HTMLAudioElement playback failed:', error));
          }
        } catch (error: unknown) {
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
    };
  }, [audioData, audioMimeType]);

  return null;
};

export default AudioPlayer;