import { useState, useEffect, useCallback } from 'react';

type WebcamStatus = 'inactive' | 'requesting' | 'active' | 'error';

interface UseWebcamResult {
  stream: MediaStream | null;
  status: WebcamStatus;
  error: Error | null;
  startWebcam: () => Promise<void>;
  stopWebcam: () => void;
}

/**
 * Custom hook to access and manage webcam video stream
 * @returns Object containing stream, status, error, and control functions
 */
export function useWebcam(): UseWebcamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<WebcamStatus>('inactive');
  const [error, setError] = useState<Error | null>(null);

  // Clean up function to stop all tracks when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Function to start webcam
  const startWebcam = useCallback(async () => {
    // Reset state
    setError(null);
    setStatus('requesting');

    try {
      // Define video constraints
      const videoConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };
      console.log('[useWebcam] Using video constraints:', videoConstraints.video);

      // Request webcam access
      const videoStream = await navigator.mediaDevices.getUserMedia(videoConstraints);

      setStream(videoStream);
      setStatus('active');
      console.log('[useWebcam] Webcam started successfully');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('[useWebcam] Error starting webcam:', err);
    }
  }, []);

  // Function to stop webcam
  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStatus('inactive');
    console.log('[useWebcam] Webcam stopped');
  }, [stream]);

  return {
    stream,
    status,
    error,
    startWebcam,
    stopWebcam
  };
}

export default useWebcam;
