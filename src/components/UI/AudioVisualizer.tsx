import React, { useEffect, useRef, useState } from 'react';

type AudioVisualizerProps = {
  audioStream?: MediaStream | null;
};

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioStream }) => {
  const [levels, setLevels] = useState<number[]>(Array(15).fill(0));
  const animationRef = useRef<number | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // Set up audio analyzer when stream changes
  useEffect(() => {
    if (!audioStream) {
      // If no stream, set all levels to random low values for visual effect
      animationRef.current = requestAnimationFrame(simulateAudioLevels);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
    
    // Clean up previous audio context
    if (analyzerRef.current) {
      analyzerRef.current = null;
      dataArrayRef.current = null;
    }
    
    // Set up new audio analyzer with the stream
    const audioContext = new AudioContext();
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 64;
    
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyzer);
    
    analyzerRef.current = analyzer;
    dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);
    
    // Start visualization
    animationRef.current = requestAnimationFrame(updateAudioLevels);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioContext.close();
    };
  }, [audioStream]);
  
  // Function to update levels with real audio data
  const updateAudioLevels = () => {
    if (!analyzerRef.current || !dataArrayRef.current) {
      return;
    }
    
    analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Use a subset of the frequency data for visualization
    const newLevels = Array(15).fill(0).map((_, i) => {
      const index = Math.floor(i * (dataArrayRef.current!.length / 15));
      // Scale values from 0-255 to 0-1
      return dataArrayRef.current![index] / 255;
    });
    
    setLevels(newLevels);
    animationRef.current = requestAnimationFrame(updateAudioLevels);
  };
  
  // Function to simulate audio levels when no stream is available
  const simulateAudioLevels = () => {
    const newLevels = levels.map(() => Math.random() * 0.3); // Lower random values
    setLevels(newLevels);
    animationRef.current = requestAnimationFrame(simulateAudioLevels);
  };
  
  return (
    <div className="audio-visualizer">
      {levels.map((level, index) => (
        <div 
          key={index} 
          className="visualizer-bar" 
          style={{ 
            height: `${Math.max(2, level * 40)}px` 
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
