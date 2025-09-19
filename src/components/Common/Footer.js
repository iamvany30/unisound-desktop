import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import Player from '../Player/Player'; 
import NowPlayingPage from '../../pages/NowPlayingPage'; 
import './Footer.css';

const Footer = () => {
    const { isNowPlayingOpen, currentTrack } = usePlayer();
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenMounted, setHasBeenMounted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionDirection, setTransitionDirection] = useState('none');
    
    const containerRef = useRef(null);
    const animationTimeoutRef = useRef(null);
    const transitionTimeoutRef = useRef(null);
    const previousOpenState = useRef(isNowPlayingOpen);

    
    useEffect(() => {
        if (previousOpenState.current !== isNowPlayingOpen) {
            setIsTransitioning(true);
            setTransitionDirection(isNowPlayingOpen ? 'to-fullscreen' : 'to-mini');
            
            
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
            
            
            transitionTimeoutRef.current = setTimeout(() => {
                setIsTransitioning(false);
                setTransitionDirection('none');
            }, 600); 
            
            previousOpenState.current = isNowPlayingOpen;
        }
    }, [isNowPlayingOpen]);

    
    useEffect(() => {
        if (currentTrack && !hasBeenMounted) {
            setHasBeenMounted(true);
            
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 100);
            return () => clearTimeout(timer);
        } else if (!currentTrack) {
            setIsVisible(false);
            setHasBeenMounted(false);
        }
    }, [currentTrack, hasBeenMounted]);

    
    useEffect(() => {
        const handleKeyPress = (event) => {
            
            if (event.key === 'Escape' && isNowPlayingOpen) {
                
                
            }
        };

        if (isNowPlayingOpen) {
            document.addEventListener('keydown', handleKeyPress);
            
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
            document.body.style.overflow = '';
        };
    }, [isNowPlayingOpen]);

    
    const handleTransitionEnd = useCallback((event) => {
        if (event.target === containerRef.current && event.propertyName === 'height') {
            
            if (containerRef.current) {
                containerRef.current.style.willChange = 'auto';
            }
            setIsTransitioning(false);
        }
    }, []);

    const handleTransitionStart = useCallback(() => {
        
        if (containerRef.current) {
            containerRef.current.style.willChange = 'height, backdrop-filter, background-color';
        }
        setIsTransitioning(true);
    }, []);

    
    useEffect(() => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        
        if (isTransitioning) {
            container.classList.add('transitioning');
            container.classList.add(transitionDirection);
        } else {
            container.classList.remove('transitioning');
            container.classList.remove('to-fullscreen', 'to-mini');
        }
    }, [isTransitioning, transitionDirection]);

    
    useEffect(() => {
        if (currentTrack && !isNowPlayingOpen) {
            
            const preloadTimer = setTimeout(() => {
                
            }, 500);
            
            return () => clearTimeout(preloadTimer);
        }
    }, [currentTrack, isNowPlayingOpen]);

    
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
            if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        };
    }, []);

    
    if (!currentTrack) {
        return null;
    }

    
    const containerClasses = [
        'unified-player-container',
        isNowPlayingOpen && 'open',
        isVisible && 'fade-in',
        isTransitioning && 'transitioning',
        transitionDirection !== 'none' && transitionDirection
    ].filter(Boolean).join(' ');

    return (
        <footer 
            ref={containerRef}
            className={containerClasses}
            onTransitionEnd={handleTransitionEnd}
            onTransitionStart={handleTransitionStart}
            role="region"
            aria-label="Music Player"
            aria-expanded={isNowPlayingOpen}
        >
            <div 
                className="now-playing-wrapper"
                aria-hidden={!isNowPlayingOpen}
                
                
                inert={!isNowPlayingOpen || undefined}
                style={{ pointerEvents: isNowPlayingOpen ? 'auto' : 'none' }}
            >
                <NowPlayingPage />
            </div>

            <div 
                className="player-wrapper"
                aria-hidden={isNowPlayingOpen}
                
                
                inert={isNowPlayingOpen || undefined}
                style={{ pointerEvents: !isNowPlayingOpen ? 'auto' : 'none' }}
            >
                <Player />
            </div>
        </footer>
    );
};

export default Footer;