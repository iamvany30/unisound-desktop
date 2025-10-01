import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { useArtwork } from '../hooks/useArtwork';
import { useTranslation } from 'react-i18next';
import ParallaxTilt from 'react-parallax-tilt';
import PlayerControls from '../components/Player/PlayerControls';
import ProgressBar from '../components/Player/ProgressBar';
import VolumeControl from '../components/Player/VolumeControl';
import { ChevronDown, Music } from 'lucide-react';
import './NowPlayingPage.css';



const UI_HIDE_DELAY = 3500; 


const extractDominantColor = (imageUrl) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                
                const imageData = ctx.getImageData(img.width * 0.25, img.height * 0.25, img.width * 0.5, img.height * 0.5);
                
                let r = 0, g = 0, b = 0;
                const pixelCount = imageData.data.length / 4;
                
                for (let i = 0; i < imageData.data.length; i += 4) {
                    r += imageData.data[i];
                    g += imageData.data[i + 1];
                    b += imageData.data[i + 2];
                }
                
                resolve([Math.floor(r / pixelCount), Math.floor(g / pixelCount), Math.floor(b / pixelCount)]);
            } catch (error) {
                console.warn('Color extraction failed:', error);
                resolve([30, 30, 50]); 
            }
        };
        img.onerror = () => resolve([30, 30, 50]); 
        img.src = imageUrl;
    });
};




const useUIHider = (isPlaying, isOpen) => {
    const [isUIHidden, setIsUIHidden] = useState(false);
    const hideTimeoutRef = useRef(null);

    const resetHideTimer = useCallback(() => {
        setIsUIHidden(false);
        clearTimeout(hideTimeoutRef.current);
        if (isPlaying && isOpen) {
            hideTimeoutRef.current = setTimeout(() => setIsUIHidden(true), UI_HIDE_DELAY);
        }
    }, [isPlaying, isOpen]);

    useEffect(() => {
        resetHideTimer();
        return () => clearTimeout(hideTimeoutRef.current);
    }, [isPlaying, isOpen, resetHideTimer]);

    return { isUIHidden, resetHideTimer };
};


const MarqueeText = memo(({ text }) => {
    const ref = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (ref.current) {
                setIsOverflowing(ref.current.scrollWidth > ref.current.clientWidth);
            }
        };
        checkOverflow();
        const resizeObserver = new ResizeObserver(checkOverflow);
        if (ref.current) {
            resizeObserver.observe(ref.current);
        }
        return () => resizeObserver.disconnect();
    }, [text]);

    return (
        <div ref={ref} className="marquee-container">
            <span className={`marquee-text ${isOverflowing ? 'is-overflowing' : ''}`}>{text}</span>
            {isOverflowing && <span className="marquee-text marquee-text--clone" aria-hidden="true">{text}</span>}
        </div>
    );
});
MarqueeText.displayName = 'MarqueeText';


const PlayerBackground = memo(({ artworkSrc }) => (
    <div className="now-playing-bg" style={{ backgroundImage: artworkSrc ? `url(${artworkSrc})` : 'none' }} />
));
PlayerBackground.displayName = 'PlayerBackground';



const NowPlayingPage = () => {
    const { currentTrack, isPlaying, isNowPlayingOpen, toggleNowPlaying } = usePlayer();
    const { artworkSrc } = useArtwork(currentTrack);
    const { t } = useTranslation('player');
    
    const [accentColor, setAccentColor] = useState('rgba(30, 30, 50, 0.3)');
    const { isUIHidden, resetHideTimer } = useUIHider(isPlaying, isNowPlayingOpen);
    
    useEffect(() => {
        if (artworkSrc) {
            extractDominantColor(artworkSrc).then(colorData => {
                setAccentColor(`rgba(${colorData.join(',')}, 0.5)`);
            });
        } else {
            setAccentColor('rgba(30, 30, 50, 0.3)'); 
        }
    }, [artworkSrc]);

    
    const handleInteraction = useCallback(() => {
        if (isNowPlayingOpen) {
            resetHideTimer();
        }
    }, [isNowPlayingOpen, resetHideTimer]);

    if (!currentTrack) {
        return null; 
    }
    
    const pageClasses = `now-playing-page ${isNowPlayingOpen ? 'open' : ''} ${isUIHidden ? 'ui-hidden' : ''}`;

    return (
        <div 
            className={pageClasses} 
            style={{ '--dynamic-accent-color': accentColor }}
            onMouseMove={handleInteraction}
            onClick={handleInteraction}
        >
            <PlayerBackground artworkSrc={artworkSrc} />
            <div className="dynamic-color-overlay" />
            <div className="now-playing-blur-overlay" />

            <div className="now-playing-content">
                <div className="now-playing-layout">
                    <div className="top-buttons">
                        <button 
                            className="control-button" 
                            onClick={(e) => { e.stopPropagation(); toggleNowPlaying(); }} 
                            aria-label={t('collapsePlayer')}
                        >
                            <ChevronDown size={32} />
                        </button>
                    </div>

                    <div className="main-content-area">
                        <ParallaxTilt 
                            tiltMaxAngleX={8} 
                            tiltMaxAngleY={8} 
                            glareEnable={true} 
                            glareMaxOpacity={0.1} 
                            scale={1.05} 
                            transitionSpeed={2000} 
                            className="main-display-area"
                        >
                            <div className="artwork-main">
                                {artworkSrc ? (
                                    <img src={artworkSrc} alt={t('coverArtFor', { title: currentTrack.title })} />
                                ) : (
                                    <div className="fallback"><Music size={100} /></div>
                                )}
                            </div>
                        </ParallaxTilt>
                        <div className="track-info-full">
                            <h1><MarqueeText text={currentTrack.title} /></h1>
                            <div><MarqueeText text={currentTrack.formattedArtists} /></div>
                        </div>
                    </div>
                    
                    <div className="controls-container-full" onClick={(e) => e.stopPropagation()}>
                        <ProgressBar />
                        <div className="now-playing-controls-grid">
                            <div />
                            <PlayerControls />
                            <VolumeControl />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NowPlayingPage;