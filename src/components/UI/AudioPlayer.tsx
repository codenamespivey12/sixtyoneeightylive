import React, { useEffect, useRef } from 'react';
import { useGemini } from '../../contexts/GeminiContext';

/**
 * AudioPlayer component that plays audio data received from Gemini
 * This component doesn't render any visible UI elements, it just plays audio
 */
const AudioPlayer: React.FC = () => {
  const { audioData } = useGemini();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    // Play audio when audioData changes
    if (audioData) {
      try {
        // Create a data URL from the base64 audio data
        const audioSrc = `data:audio/mp3;base64,${audioData}`;
        
        // Set the source and play
        audioRef.current.src = audioSrc;
        
        // Log for debugging
        console.log('[AudioPlayer] Playing audio data');
        
        // Play the audio
        const playPromise = audioRef.current.play();
        
        // Handle play promise (required for modern browsers)
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('[AudioPlayer] Audio playback started successfully');
            })
            .catch(error => {
              console.error('[AudioPlayer] Audio playback failed:', error);
            });
        }
      } catch (error) {
        console.error('[AudioPlayer] Error playing audio:', error);
      }
    }

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioData]);

  // This component doesn't render anything visible
  return null;
};

export default AudioPlayer;
