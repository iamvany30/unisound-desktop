

import { useState, useCallback } from 'react';
import api from '../services/api';

export const useWaveManager = (playlistManager) => {
    const [isWaveMode, setIsWaveMode] = useState(false);
    const [isFetchingNextTrack, setIsFetchingNextTrack] = useState(false);

    const fetchAndAppendWaveTrack = useCallback(async () => {
        if (isFetchingNextTrack) return null;
        
        setIsFetchingNextTrack(true);
        try {
            const nextTrack = await api.wave.getNextTrack();
            if (nextTrack) {
                playlistManager.addTrackToPlaylist(nextTrack);
            }
            return nextTrack;
        } catch (error) {
            console.error("Failed to load next wave track:", error);
            return null;
        } finally {
            setIsFetchingNextTrack(false);
        }
    }, [isFetchingNextTrack, playlistManager]);

    const startWave = useCallback(async () => {
        
        try {
            await api.wave.clearWaveSession();
            console.log('[WaveManager] Server wave session cleared successfully.');
        } catch (error) {
            console.warn('[WaveManager] Could not clear server wave session. Recommendations might repeat.', error);
        }
        

        setIsWaveMode(true);
        
        
        const initialTrack = await api.wave.getNextTrack();

        if (initialTrack) {
            
            playlistManager.setTrackList([initialTrack], 0);
            
            
            
            fetchAndAppendWaveTrack();
            
            return true;
        } else {
            console.error("Failed to start wave: could not fetch initial track.");
            setIsWaveMode(false);
            return false;
        }
    }, [playlistManager, fetchAndAppendWaveTrack]);

    const stopWave = useCallback(() => {
        setIsWaveMode(false);
    }, []);

    const submitWaveFeedback = useCallback(async (feedbackType, currentTrack) => {
        if (!currentTrack || !isWaveMode) return false;
        
        let payload = { feedback_type: feedbackType };
        switch (feedbackType) {
            case 'do_not_recommend_track': 
                payload.track_uuid = currentTrack.uuid; 
                break;
            case 'do_not_recommend_artist': 
                payload.artist_name = currentTrack.primaryArtistName;
                break;
            case 'do_not_recommend_genre': 
                if (!currentTrack.genre) return false;
                payload.genre_name = currentTrack.genre; 
                break;
            default: 
                return false;
        }
        
        try {
            await api.wave.submitFeedback(payload);
            return true;
        } catch (error) { 
            console.error("Error submitting wave feedback:", error); 
            return false;
        }
    }, [isWaveMode]);
    
    const autoFetchNextIfNeeded = useCallback(async () => {
        const { playlist, currentTrackIndex } = playlistManager;
        if (isWaveMode && currentTrackIndex >= playlist.length - 2) {
            await fetchAndAppendWaveTrack();
        }
    }, [isWaveMode, playlistManager, fetchAndAppendWaveTrack]);

    return {
        isWaveMode,
        isFetchingNextTrack,
        startWave,
        stopWave,
        submitWaveFeedback,
        autoFetchNextIfNeeded,
        fetchAndAppendWaveTrack,
    };
};