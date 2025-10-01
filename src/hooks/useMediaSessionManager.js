

import { useEffect } from 'react';
import { useArtwork } from './useArtwork';

export const useMediaSessionManager = (currentTrack, isPlaying, playerActions, positionState) => {
    const { togglePlay, playNext, playPrev, seek } = playerActions;
    const { progress, duration } = positionState;
    const { artworkSrc } = useArtwork(currentTrack);

    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        if (!currentTrack) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
            try {
                navigator.mediaSession.setPositionState(null);
            } catch (e) {}
            return;
        }

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title || 'Unknown Title',
            artist: currentTrack.formattedArtists || 'Unknown Artist',
            album: currentTrack.album || 'UniSound',
            artwork: artworkSrc ? [{ src: artworkSrc, sizes: '512x512', type: 'image/png' }] : []
        });

        navigator.mediaSession.setActionHandler('play', togglePlay);
        navigator.mediaSession.setActionHandler('pause', togglePlay);
        navigator.mediaSession.setActionHandler('nexttrack', playNext);
        navigator.mediaSession.setActionHandler('previoustrack', playPrev);
        
        try {
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (!details.fastSeek) seek(details.seekTime);
            });
        } catch (e) {
            
        }

    }, [currentTrack, isPlaying, artworkSrc, togglePlay, playNext, playPrev, seek]);

    useEffect(() => {
        if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
            
            if (currentTrack && duration > 0) {
                
                
                const safeProgress = Math.min(progress, duration);

                try {
                    navigator.mediaSession.setPositionState({
                        duration: duration,
                        playbackRate: 1,
                        position: safeProgress,
                    });
                } catch (e) {
                    
                    console.warn("Could not set Position State:", e.message);
                }
            }
        }
    }, [progress, duration, currentTrack]);
};