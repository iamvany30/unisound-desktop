import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { useArtwork } from '../hooks/useArtwork';
import api from '../services/api';
import Hls from 'hls.js';
import { API_BASE_URL } from '../config';
import ParallaxTilt from 'react-parallax-tilt';
import PlayerControls from '../components/Player/PlayerControls';
import ProgressBar from '../components/Player/ProgressBar';
import VolumeControl from '../components/Player/VolumeControl';
import { ChevronDown, Music, MessageSquare } from 'lucide-react';
import './NowPlayingPage.css';

const UI_HIDE_DELAY = 3000;
const CURSOR_HIDE_DELAY = 2000;

const extractDominantColor = (imageUrl) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(
                    Math.floor(img.width * 0.25), 
                    Math.floor(img.height * 0.25), 
                    Math.floor(img.width * 0.5), 
                    Math.floor(img.height * 0.5)
                );
                
                let r = 0, g = 0, b = 0;
                const pixelCount = imageData.data.length / 4;
                
                for (let i = 0; i < imageData.data.length; i += 4) {
                    r += imageData.data[i];
                    g += imageData.data[i + 1];
                    b += imageData.data[i + 2];
                }
                
                r = Math.floor(r / pixelCount);
                g = Math.floor(g / pixelCount);
                b = Math.floor(b / pixelCount);
                
                resolve([r, g, b]);
            } catch (error) {
                console.warn('Color extraction failed:', error);
                resolve([30, 30, 50]);
            }
        };
        img.onerror = () => resolve([30, 30, 50]);
        img.src = imageUrl;
    });
};

const useUIHider = (isPlaying, isPageReady) => {
    const [isUIHidden, setIsUIHidden] = useState(false);
    const [isCursorHidden, setIsCursorHidden] = useState(false);
    const hideTimeoutRef = useRef(null);
    const cursorTimeoutRef = useRef(null);

    const resetHideTimers = useCallback(() => {
        setIsUIHidden(false);
        setIsCursorHidden(false);
        clearTimeout(hideTimeoutRef.current);
        clearTimeout(cursorTimeoutRef.current);

        if (isPlaying && isPageReady) {
            hideTimeoutRef.current = setTimeout(() => {
                setIsUIHidden(true);
                cursorTimeoutRef.current = setTimeout(() => setIsCursorHidden(true), CURSOR_HIDE_DELAY);
            }, UI_HIDE_DELAY);
        }
    }, [isPlaying, isPageReady]);

    useEffect(() => {
        resetHideTimers();
    }, [isPlaying, isPageReady, resetHideTimers]);
    
    useEffect(() => () => {
        clearTimeout(hideTimeoutRef.current);
        clearTimeout(cursorTimeoutRef.current);
    }, []);

    return { isUIHidden, isCursorHidden, resetHideTimers };
};

const MarqueeText = memo(({ text }) => {
    const ref = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (ref.current) setIsOverflowing(ref.current.scrollWidth > ref.current.clientWidth);
        };
        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    return (
        <div ref={ref} className="marquee-container">
            <span className={`marquee-text ${isOverflowing ? 'is-overflowing' : ''}`}>{text}</span>
            {isOverflowing && <span className="marquee-text marquee-text--clone" aria-hidden="true">{text}</span>}
        </div>
    );
});
MarqueeText.displayName = 'MarqueeText';

const PlayerBackground = memo(({ track, artworkSrc }) => {
    const { progress, isPlaying } = usePlayer();
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [videoSrc, setVideoSrc] = useState(null);
    const [isVideoLoading, setIsVideoLoading] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        const cleanup = () => {
            if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
            setVideoSrc(null);
        };
        cleanup();

        if (!track || !video) return;

        const hlsPath = track.video_hls_manifest;
        const legacyVideoFile = track.video_full_filename || track.video_short_filename;

        if (hlsPath && Hls.isSupported()) {
            setIsVideoLoading(true);
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(`${API_BASE_URL}/media/video/hls/${hlsPath}`);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => setIsVideoLoading(false));
            setVideoSrc("hls");
        } else if (legacyVideoFile) {
            setIsVideoLoading(true);
            setVideoSrc(api.player.getVideoUrl(legacyVideoFile));
        } else {
            setVideoSrc(null);
            setIsVideoLoading(false);
        }
        
        return cleanup;
    }, [track]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !track) return;

        if (isPlaying && video.paused) video.play().catch(console.error);
        else if (!isPlaying && !video.paused) video.pause();

        const offset = track.video_audio_sync_offset_seconds || 0;
        const targetTime = progress + offset;
        if (Math.abs(targetTime - video.currentTime) > 1.5) {
            video.currentTime = targetTime;
        }
    }, [progress, isPlaying, track]);

    const showVideo = videoSrc && !isVideoLoading;

    return (
        <>
            <div className="now-playing-bg" style={{ backgroundImage: artworkSrc ? `url(${artworkSrc})` : 'none', opacity: showVideo ? 0 : 1 }} />
            <video ref={videoRef} key={track.uuid} className="now-playing-bg-video" loop muted playsInline preload="auto" onCanPlay={() => setIsVideoLoading(false)} src={!Hls.isSupported() ? videoSrc : undefined} style={{ opacity: showVideo ? 1 : 0 }} />
            <div className="dynamic-color-overlay" />
            <div className="now-playing-blur-overlay" />
        </>
    );
});
PlayerBackground.displayName = 'PlayerBackground';

const PlayerUI = memo(({ track, artworkSrc, isLyricsVisible, toggleNowPlaying, toggleLyricsWindow }) => {
    const { progress, duration, seek } = usePlayer();

    return (
        <div className="now-playing-layout">
            <div className="top-buttons">
                <button className="control-button" onClick={(e) => { e.stopPropagation(); toggleNowPlaying(); }} aria-label="Свернуть плеер"><ChevronDown size={32} /></button>
                {track.has_lrc && 
                    <button 
                        className={`control-button lyrics-toggle-button ${isLyricsVisible ? 'active' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); toggleLyricsWindow(); }} 
                        aria-label="Показать/скрыть текст"
                    >
                        <MessageSquare size={24} />
                    </button>
                }
            </div>

            <div className="main-content-area">
                <ParallaxTilt tiltMaxAngleX={8} tiltMaxAngleY={8} glareEnable={true} glareMaxOpacity={0.1} scale={1.05} transitionSpeed={2000} className="main-display-area">
                    <div className="artwork-main">
                        {artworkSrc ? <img src={artworkSrc} alt={`${track.title} by ${track.formattedArtists}`} /> : <div className="fallback"><Music size={100} /></div>}
                    </div>
                </ParallaxTilt>
                <div className="track-info-full">
                    <h1><MarqueeText text={track.title} /></h1>
                    <div><MarqueeText text={track.formattedArtists} /></div>
                </div>
            </div>
            
            <div className="controls-container-full" onClick={(e) => e.stopPropagation()}>
                <ProgressBar progress={progress} duration={duration} onSeek={seek} />
                <div className="now-playing-controls-grid">
                    <div />
                    <PlayerControls />
                    <VolumeControl />
                </div>
            </div>
        </div>
    );
});
PlayerUI.displayName = 'PlayerUI';

const NowPlayingPage = () => {
    const { currentTrack, isPlaying, isNowPlayingOpen, isLyricsVisible, toggleNowPlaying, toggleLyricsWindow } = usePlayer();
    const { artworkSrc } = useArtwork(currentTrack);
    
    const [accentColor, setAccentColor] = useState('rgba(30, 30, 50, 0.3)');
    const [dominantColorData, setDominantColorData] = useState(null);
    const [isPageReady, setIsPageReady] = useState(false);

    const { isUIHidden, isCursorHidden, resetHideTimers } = useUIHider(isPlaying, isPageReady);
    
    useEffect(() => {
        let readyTimeout;
        if (isNowPlayingOpen) {
            readyTimeout = setTimeout(() => setIsPageReady(true), 100);
        } else {
            setIsPageReady(false);
        }
        return () => clearTimeout(readyTimeout);
    }, [isNowPlayingOpen]);
    
    useEffect(() => {
        if (artworkSrc) {
            extractDominantColor(artworkSrc)
                .then(colorData => {
                    if (JSON.stringify(colorData) !== JSON.stringify(dominantColorData)) {
                        setDominantColorData(colorData);
                    }
                })
                .catch(error => {
                    console.warn('Failed to extract color:', error);
                });
        } else {
            setDominantColorData([30, 30, 50]);
        }
    }, [artworkSrc, dominantColorData]);
    
    useEffect(() => {
        if (dominantColorData) {
            const newColor = `rgba(${dominantColorData.join(',')}, 0.5)`;
            setAccentColor(newColor);
        }
    }, [dominantColorData]);

    const handleInteraction = useCallback(() => {
        if (isPageReady) {
            resetHideTimers();
        }
    }, [isPageReady, resetHideTimers]);

    if (!currentTrack) return null;
    
    const pageClasses = [
        'now-playing-page',
        isPageReady && 'ready',
        isUIHidden && 'ui-hidden',
        isCursorHidden && 'cursor-hidden',
        isLyricsVisible && 'lyrics-visible'
    ].filter(Boolean).join(' ');

    return (
        <div 
            className={pageClasses} 
            style={{ '--dynamic-accent-color': accentColor }}
            onMouseMove={handleInteraction}
            onClick={handleInteraction}
        >
            <PlayerBackground track={currentTrack} artworkSrc={artworkSrc} />

            <div className="now-playing-content">
                <PlayerUI 
                    track={currentTrack}
                    artworkSrc={artworkSrc}
                    isLyricsVisible={isLyricsVisible}
                    toggleNowPlaying={toggleNowPlaying}
                    toggleLyricsWindow={toggleLyricsWindow}
                />
            </div>
        </div>
    );
};

export default NowPlayingPage;