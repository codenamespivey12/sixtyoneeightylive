import { useState, useEffect, useCallback } from 'react';

type ScreenShareStatus = 'inactive' | 'requesting' | 'active' | 'error';

interface UseScreenShareResult {
  stream: MediaStream | null;
  status: ScreenShareStatus;
  error: Error | null;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
}

/**
 * Custom hook to access and manage screen sharing stream
 * @returns Object containing stream, status, error, and control functions
 */
export function useScreenShare(): UseScreenShareResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<ScreenShareStatus>('inactive');
  const [error, setError] = useState<Error | null>(null);

  // Clean up function to stop all tracks when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Function to start screen sharing
  const startScreenShare = useCallback(async () => {
    // Reset state
    setError(null);
    setStatus('requesting');

    try {
      // Request screen sharing access
      // TypeScript doesn't fully recognize all the options for getDisplayMedia
      // Using a more generic type for the constraints
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        // The following would be the ideal settings, but TypeScript doesn't recognize these properties
        // We'll keep them commented for reference
        // video: {
        //   cursor: 'always',
        //   displaySurface: 'monitor'
        // }
      } as MediaStreamConstraints);

      // Set up track ended listener
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('[useScreenShare] Screen sharing stopped by user');
        stopScreenShare();
      });

      setStream(screenStream);
      setStatus('active');
      console.log('[useScreenShare] Screen sharing started successfully');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error(String(err)));
      console.error('[useScreenShare] Error starting screen sharing:', err);
    }
  }, []);

  // Function to stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStatus('inactive');
    console.log('[useScreenShare] Screen sharing stopped');
  }, [stream]);

  return {
    stream,
    status,
    error,
    startScreenShare,
    stopScreenShare
  };
}

export default useScreenShare;
