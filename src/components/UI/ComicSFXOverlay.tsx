import React, { useState, useEffect } from 'react';

type SFXType = 'pow' | 'bam' | 'zap';

type ComicSFXOverlayProps = {
  visible?: boolean;
  type?: SFXType;
  duration?: number;
  onHide?: () => void;
};

const ComicSFXOverlay: React.FC<ComicSFXOverlayProps> = ({
  visible = false,
  type = 'pow',
  duration = 1500,
  onHide
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  
  useEffect(() => {
    setIsVisible(visible);
    
    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onHide) onHide();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);
  
  if (!isVisible) return null;
  
  return (
    <div className="comic-sfx-overlay">
      <div className={`sfx ${type}`}>
        {type === 'pow' ? 'POW!' : type === 'bam' ? 'BAM!' : 'ZAP!'}
      </div>
    </div>
  );
};

export default ComicSFXOverlay;
