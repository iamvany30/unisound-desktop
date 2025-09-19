import { useEffect } from 'react';
import api from '../services/api';


export const useMediaSessionManager = (currentTrack, isPlaying, playerActions, positionState) => {
    const { togglePlay, playNext, playPrev, seek } = playerActions;
    const { progress, duration } = positionState;

    useEffect(() => {
        if (!('mediaSession' in navigator)) {
            return;
        }

        if (!currentTrack) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
            navigator.mediaSession.setPositionState(null); 
            return;
        }

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        const artworkSrc = api.player.getArtworkUrl(currentTrack.uuid);
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title,
            artist: currentTrack.formattedArtists,
            album: currentTrack.album || 'UniSound',
            artwork: artworkSrc ? [{ src: artworkSrc, sizes: '512x512', type: 'image/png' }] : []
        });

        navigator.mediaSession.setActionHandler('play', () => togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());

        try {
             navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.fastSeek) return;
                seek(details.seekTime);
            });
        } catch (error) {
            console.warn('The "seekto" media session action is not supported.');
        }

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('play', null);
                navigator.mediaSession.setActionHandler('pause', null);
                navigator.mediaSession.setActionHandler('nexttrack', null);
                navigator.mediaSession.setActionHandler('previoustrack', null);
                try {
                     navigator.mediaSession.setActionHandler('seekto', null);
                } catch (error) {}
            }
        };
    }, [currentTrack, isPlaying, togglePlay, playNext, playPrev, seek]);

    useEffect(() => {
        if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
             if (currentTrack && duration > 0) {
                navigator.mediaSession.setPositionState({
                    duration: duration,
                    playbackRate: 1,
                    position: progress,
                });
            }
        }
    }, [progress, duration, currentTrack]);
};