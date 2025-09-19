
import { useState, useCallback } from 'react';
import api from '../services/api';


export const useWaveManager = (playlistManager) => {
    const [isWaveMode, setIsWaveMode] = useState(false);
    const [isFetchingNextTrack, setIsFetchingNextTrack] = useState(false);

    const fetchNextWaveTrack = useCallback(async () => {
        if (isFetchingNextTrack) return null;
        
        setIsFetchingNextTrack(true);
        try {
            const nextTrack = await api.wave.getNextTrack();
            playlistManager.addTrackToPlaylist(nextTrack);
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
            const initialTracks = await Promise.all([
                api.wave.getNextTrack(), 
                api.wave.getNextTrack()
            ]);
            
            setIsWaveMode(true);
            playlistManager.setTrackList(initialTracks, 0);
            return true;
        } catch (error) {
            console.error("Failed to start wave:", error);
            return false;
        }
    }, [playlistManager]);

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
                payload.artist_name = currentTrack.artist; 
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

    const checkIfShouldFetchNext = useCallback(() => {
        const { playlist, currentTrackIndex } = playlistManager;
        return isWaveMode && currentTrackIndex >= playlist.length - 2;
    }, [isWaveMode, playlistManager]);

    const autoFetchNextIfNeeded = useCallback(async () => {
        if (checkIfShouldFetchNext()) {
            return await fetchNextWaveTrack();
        }
        return null;
    }, [checkIfShouldFetchNext, fetchNextWaveTrack]);

    return {
        isWaveMode,
        isFetchingNextTrack,
        fetchNextWaveTrack,
        startWave,
        stopWave,
        submitWaveFeedback,
        checkIfShouldFetchNext,
        autoFetchNextIfNeeded
    };
};