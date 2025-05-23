import { useState, useEffect, useCallback } from 'react';

type MicrophoneStatus = 'inactive' | 'requesting' | 'active' | 'error';

interface UseMicrophoneResult {
  stream: MediaStream | null;
  status: MicrophoneStatus;
  error: Error | null;
  volume: number;
  startMicrophone: () => Promise<void>;
  stopMicrophone: () => void;
}

/**
 * Custom hook to access and manage microphone audio stream
 * @returns Object containing stream, status, error, volume, and control functions
 */
export function useMicrophone(): UseMicrophoneResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<MicrophoneStatus>('inactive');
  const [error, setError] = useState<Error | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyzer, setAnalyzer] = useState<AnalyserNode | null>(null);

  // Clean up function to stop all tracks when component unmounts or status changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [stream, audioContext]);

  // Function to start microphone
  const startMicrophone = useCallback(async () => {
    // Reset state
    setError(null);
    setStatus('requesting');

    try {
      // Define audio constraints
      const audioConstraints: MediaStreamConstraints = {
        audio: {
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      console.log('[useMicrophone] Using audio constraints:', audioConstraints.audio);

      // Request microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);

      // Create audio context for volume analysis
      const context = new AudioContext();
      const source = context.createMediaStreamSource(audioStream);
      const analyzerNode = context.createAnalyser();
      analyzerNode.fftSize = 256;
      source.connect(analyzerNode);

      setStream(audioStream);
      setAudioContext(context);
      setAnalyzer(analyzerNode);
      setStatus('active');
      
      // Start monitoring volume
      monitorVolume(analyzerNode);
      
      console.log('[useMicrophone] Microphone started successfully');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('[useMicrophone] Error starting microphone:', err);
    }
  }, []);

  // Function to stop microphone
  const stopMicrophone = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setAnalyzer(null);
    setStatus('inactive');
    setVolume(0);
    console.log('[useMicrophone] Microphone stopped');
  }, [stream, audioContext]);

  // Function to monitor microphone volume
  const monitorVolume = useCallback((analyzerNode: AnalyserNode) => {
    const dataArray = new Uint8Array(analyzerNode.frequencyBinCount);
    
    const updateVolume = () => {
      if (status !== 'active' || !analyzerNode) return;
      
      // This is where we use the analyzer reference from the hook's state
      // If available, use the analyzer from state, otherwise use the one passed to the function
      const activeAnalyzer = analyzer || analyzerNode;
      activeAnalyzer.getByteFrequencyData(dataArray);
      
      // Calculate average volume from frequency data
      let sum = 0;
      for (const value of dataArray) {
        sum += value;
      }
      const average = sum / dataArray.length;
      
      // Normalize to 0-1 range
      const normalizedVolume = average / 255;
      setVolume(normalizedVolume);
      
      // Continue monitoring
      requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
  }, [status, analyzer]);

  return {
    stream,
    status,
    error,
    volume,
    startMicrophone,
    stopMicrophone
  };
}

export default useMicrophone;
