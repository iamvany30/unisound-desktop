
import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useSimpleDebounce } from './useDebounce';

const PLAYER_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ERROR: 'error'
};

export const usePlayerState = () => {
    const [state, setState] = useState(PLAYER_STATES.IDLE);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState(null);
    
    
    const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
    const [isLyricsVisible, setIsLyricsVisible] = useState(false);
    
    
    const [isCurrentTrackLiked, setIsCurrentTrackLiked] = useState(false);
    const [currentTrackUuid, setCurrentTrackUuid] = useState(null);
    
    const debouncedProgress = useSimpleDebounce(progress, 1000);
    
    
    const isPlaying = state === PLAYER_STATES.PLAYING;
    const isLoading = state === PLAYER_STATES.LOADING;
    
    
    const setPlayerState = useCallback((newState) => {
        setState(newState);
        if (newState !== PLAYER_STATES.ERROR) {
            setError(null);
        }
    }, []);
    
    const setPlayerError = useCallback((errorMessage) => {
        setState(PLAYER_STATES.ERROR);
        setError(errorMessage);
    }, []);
    
    
    const handleSetVolume = useCallback((newVolume) => {
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    }, []);
    
    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);
    
    
    const toggleNowPlaying = useCallback(() => {
        setIsNowPlayingOpen(prev => !prev);
    }, []);
    
    const toggleLyricsWindow = useCallback(() => {
        setIsLyricsVisible(prev => {
            const newState = !prev;
            window.electronAPI?.toggleKaraokeWindow?.(newState);
            return newState;
        });
    }, []);
    
    
    const toggleLike = useCallback(async () => {
        if (!currentTrackUuid) return;
        
        const wasLiked = isCurrentTrackLiked;
        setIsCurrentTrackLiked(!wasLiked);
        
        try {
            if (wasLiked) {
                await api.tracks.removeInteraction(currentTrackUuid);
            } else {
                await api.tracks.like(currentTrackUuid);
            }
        } catch (error) {
            
            setIsCurrentTrackLiked(wasLiked);
            console.error('Failed to toggle like:', error);
        }
    }, [currentTrackUuid, isCurrentTrackLiked]);
    
    
    const updateCurrentTrack = useCallback(async (track) => {
        const trackUuid = track?.uuid;
        setCurrentTrackUuid(trackUuid);
        
        if (!trackUuid || track?.isLocal) {
            setIsCurrentTrackLiked(false);
            return;
        }
        
        try {
            const { is_liked } = await api.tracks.getInteractionStatus(trackUuid);
            setIsCurrentTrackLiked(is_liked);
        } catch (error) {
            setIsCurrentTrackLiked(false);
            console.error('Failed to get like status:', error);
        }
    }, []);
    
    
    useEffect(() => {
        const unsubscribe = window.electronAPI?.onKaraokeWindowClosed?.(() => {
            setIsLyricsVisible(false);
        });
        return () => unsubscribe?.();
    }, []);
    
    
    const resetForNewTrack = useCallback(() => {
        setProgress(0);
        setDuration(0);
        setError(null);
    }, []);
    
    return {
        
        state,
        isPlaying,
        isLoading,
        progress,
        debouncedProgress,
        duration,
        volume,
        isMuted,
        error,
        isNowPlayingOpen,
        isLyricsVisible,
        isCurrentTrackLiked,
        
        
        setPlayerState,
        setProgress,
        setDuration,
        setError: setPlayerError,
        setVolume: handleSetVolume,
        toggleMute,
        toggleNowPlaying,
        toggleLyricsWindow,
        toggleLike,
        updateCurrentTrack,
        resetForNewTrack,
        
        
        PLAYER_STATES
    };
};