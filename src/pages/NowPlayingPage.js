
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { useArtwork } from '../hooks/useArtwork';
import api from '../services/api';
import Hls from 'hls.js';
import { API_BASE_URL } from '../config';

import { Color } from 'color-thief-react';
import ParallaxTilt from 'react-parallax-tilt';

import PlayerControls from '../components/Player/PlayerControls';
import ProgressBar from '../components/Player/ProgressBar';
import VolumeControl from '../components/Player/VolumeControl';

import { ChevronDown, Music, MessageSquare } from 'lucide-react';
import './NowPlayingPage.css';

const MarqueeText = ({ text }) => {
    const ref = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (ref.current) {
                setIsOverflowing(ref.current.scrollWidth > ref.current.clientWidth);
            }
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
};


const NowPlayingPage = () => {
    const { 
        currentTrack, 
        toggleNowPlaying, 
        isNowPlayingOpen,
        isLyricsVisible,    
        toggleLyricsWindow,  
        ...playerControls 
    } = usePlayer();
    
    const { artworkSrc } = useArtwork(currentTrack?.uuid);
    const [dominantColor, setDominantColor] = useState(null);

    const [accentColor, setAccentColor] = useState('rgba(30, 30, 50, 0.3)');
    const [videoSrc, setVideoSrc] = useState(null);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [isUIHidden, setIsUIHidden] = useState(false);
    const [isCursorHidden, setIsCursorHidden] = useState(false);
    const [isPageReady, setIsPageReady] = useState(false);
    
    const videoRef = useRef(null);
    const hlsVideoRef = useRef(null);
    const hideTimeoutRef = useRef(null);
    const cursorTimeoutRef = useRef(null);
    const readyTimeoutRef = useRef(null);

    const UI_HIDE_DELAY = 3000;
    const CURSOR_HIDE_DELAY = 2000;
    
    useEffect(() => {
        if (dominantColor) setAccentColor(`rgba(${dominantColor.join(',')}, 0.5)`);
    }, [dominantColor]);

    useEffect(() => {
        if (isNowPlayingOpen) {
            readyTimeoutRef.current = setTimeout(() => setIsPageReady(true), 100);
        } else {
            setIsPageReady(false);
            setIsUIHidden(false);
            setIsCursorHidden(false);
        }
        return () => clearTimeout(readyTimeoutRef.current);
    }, [isNowPlayingOpen]);
    
    const showUI = useCallback(() => {
        setIsUIHidden(false);
        setIsCursorHidden(false);
        clearTimeout(hideTimeoutRef.current);
        clearTimeout(cursorTimeoutRef.current);
    }, []);

    const startHideTimer = useCallback(() => {
        clearTimeout(hideTimeoutRef.current);
        if (videoSrc && playerControls.isPlaying && isPageReady) {
            hideTimeoutRef.current = setTimeout(() => {
                setIsUIHidden(true);
                cursorTimeoutRef.current = setTimeout(() => setIsCursorHidden(true), CURSOR_HIDE_DELAY);
            }, UI_HIDE_DELAY);
        }
    }, [videoSrc, playerControls.isPlaying, isPageReady]);

    const handleMouseMove = useCallback(() => { if (isPageReady) { showUI(); startHideTimer(); }}, [showUI, startHideTimer, isPageReady]);
    const handleClick = useCallback(() => { if (isPageReady) { showUI(); startHideTimer(); }}, [showUI, startHideTimer, isPageReady]);

    useEffect(() => {
        const video = videoRef.current;
        const cleanup = () => {
            if (hlsVideoRef.current) { hlsVideoRef.current.destroy(); hlsVideoRef.current = null; }
            setVideoSrc(null);
        };
        cleanup();

        if (!currentTrack || !video) return;

        const hlsManifestPath = currentTrack.video_hls_manifest;
        const legacyVideoFilename = currentTrack.video_full_filename || currentTrack.video_short_filename;

        if (hlsManifestPath && Hls.isSupported()) {
            setIsVideoLoading(true);
            const hlsUrl = `${API_BASE_URL}/media/video/hls/${hlsManifestPath}`;
            const hls = new Hls();
            hlsVideoRef.current = hls;
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => setIsVideoLoading(false));
            hls.on(Hls.Events.ERROR, (event, data) => { if (data.fatal) setIsVideoLoading(false); });
            setVideoSrc(hlsUrl);
        } else if (legacyVideoFilename) {
            setVideoSrc(api.player.getVideoUrl(legacyVideoFilename));
            setIsVideoLoading(true); 
        } else {
            setVideoSrc(null);
            setIsVideoLoading(false);
        }

        if (isPageReady) showUI();
        
        return cleanup;
    }, [currentTrack, isPageReady, showUI]);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl || !currentTrack || !isPageReady) return;
        if (playerControls.isPlaying && videoEl.paused) videoEl.play().catch(console.error);
        else if (!playerControls.isPlaying && !videoEl.paused) videoEl.pause();
        const offset = currentTrack.video_audio_sync_offset_seconds || 0;
        const targetTime = playerControls.progress + offset;
        if (Math.abs(targetTime - videoEl.currentTime) > 1.5) videoEl.currentTime = targetTime;
    }, [playerControls.progress, playerControls.isPlaying, currentTrack, isPageReady]);

    useEffect(() => {
        if (videoSrc && playerControls.isPlaying && isPageReady) startHideTimer();
        else if (isPageReady) showUI();
    }, [videoSrc, playerControls.isPlaying, startHideTimer, showUI, isPageReady]);
    
    useEffect(() => () => {
        clearTimeout(hideTimeoutRef.current);
        clearTimeout(cursorTimeoutRef.current);
        clearTimeout(readyTimeoutRef.current);
    }, []);

    if (!currentTrack) return null;
    
    const showVideo = videoSrc && !isVideoLoading;
    const pageClasses = [ 'now-playing-page', showVideo && 'video-active', isUIHidden && 'ui-hidden', isCursorHidden && 'cursor-hidden', isLyricsVisible && 'lyrics-visible', isPageReady && 'ready' ].filter(Boolean).join(' ');

    return (
        <div 
            className={pageClasses} 
            role="application" 
            aria-label={`Now playing: ${currentTrack.title} by ${currentTrack.formattedArtists}`}
            style={{ '--dynamic-accent-color': accentColor }}
        >
            <div className="now-playing-bg" style={{ backgroundImage: artworkSrc ? `url(${artworkSrc})` : 'none', opacity: showVideo ? 0 : 1 }} />
            <video ref={videoRef} key={currentTrack.uuid} className="now-playing-bg-video" loop muted playsInline preload="auto" onCanPlay={() => setIsVideoLoading(false)} style={{ opacity: showVideo ? 1 : 0 }} />
            <div className="dynamic-color-overlay" />
            <div className="now-playing-blur-overlay" />

            <div className="now-playing-content" onMouseMove={handleMouseMove} onClick={handleClick}>
                <div className="now-playing-layout">
                    <div className="top-buttons">
                        <button className="control-button" onClick={(e) => { e.stopPropagation(); toggleNowPlaying(); }} aria-label="Свернуть плеер"><ChevronDown size={32} /></button>
                        {currentTrack.has_lrc && 
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
                                {artworkSrc ? <img src={artworkSrc} alt={`${currentTrack.title} by ${currentTrack.formattedArtists}`} /> : <div className="fallback"><Music size={100} /></div>}
                            </div>
                        </ParallaxTilt>
                        <div className="track-info-full">
                            <h1><MarqueeText text={currentTrack.title} /></h1>
                            <div><MarqueeText text={currentTrack.formattedArtists} /></div>
                        </div>
                    </div>
                    
                    <div className="controls-container-full" onClick={(e) => e.stopPropagation()}>
                        <ProgressBar progress={playerControls.progress} duration={playerControls.duration} onSeek={playerControls.seek} />
                        <div className="now-playing-controls-grid">
                            <div />
                            <PlayerControls player={playerControls} />
                            <VolumeControl />
                        </div>
                    </div>
                </div>

                {artworkSrc && (
                    <Color src={artworkSrc} crossOrigin="anonymous" quality={10}>
                        {({ data }) => {
                            if (data && JSON.stringify(dominantColor) !== JSON.stringify(data)) {
                                setDominantColor(data);
                            }
                            return null;
                        }}
                    </Color>
                )}
            </div>

        </div>
    );
};

export default NowPlayingPage;