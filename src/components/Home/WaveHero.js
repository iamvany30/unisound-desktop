
import React, { useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import './WaveHero.css';

const WaveHero = ({ onPlayWave, isPlaying = false, title }) => {
  const containerRef = useRef(null);

  
  useEffect(() => {
    const heroContainer = containerRef.current;
    if (!heroContainer) return;

    const handleMouseMove = (e) => {
      const { left, top, width, height } = heroContainer.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      heroContainer.style.setProperty('--mouse-x', `${(x / width) * 100}%`);
      heroContainer.style.setProperty('--mouse-y', `${(y / height) * 100}%`);
    };

    heroContainer.addEventListener('mousemove', handleMouseMove);

    return () => {
      heroContainer.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="wave-hero-container" ref={containerRef}>
      <div className="noise-overlay"></div>
      
      <div className="wave-blobs-container">
        <div className="wave-blob blob-1"></div>
        <div className="wave-blob blob-2"></div>
        <div className="wave-blob blob-3"></div>
        <div className="wave-blob blob-4"></div>
        <div className="wave-blob blob-5"></div>
      </div>

      <div className="floating-particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="wave-hero-content">
        <button
          onClick={onPlayWave}
          className={`wave-play-button ${isPlaying ? 'is-playing' : ''}`}
          aria-label={title || "Play My Wave"}
        >
          <div className="play-icon-container">
            <div className="icon-glow"></div>
            <div className="play-pause-icon">
              {isPlaying ? (
                <Pause className="play-icon" fill="currentColor" />
              ) : (
                <Play className="play-icon" fill="currentColor" />
              )}
            </div>
          </div>
          <span className="play-text">{title || 'Моя волна'}</span>
        </button>
      </div>

      <div className="ambient-light"></div>
    </div>
  );
};

export default WaveHero;