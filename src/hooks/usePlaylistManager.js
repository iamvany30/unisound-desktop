import { useState, useCallback, useMemo } from 'react';
import api from '../services/api';

export const usePlaylistManager = (initialState = {}) => {
    const [playlist, setPlaylist] = useState(initialState.playlist || []);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(initialState.currentTrackIndex || -1);
    const [repeatMode, setRepeatMode] = useState('off');

    const currentTrack = useMemo(() => 
        playlist[currentTrackIndex] || null, 
        [playlist, currentTrackIndex]
    );

    const canGoNext = useCallback(() => {
        if (playlist.length === 0) return false;
        const isWaveMode = playlist.some(track => track.isFromWave);
        if (isWaveMode) return true;

        const isLastTrack = currentTrackIndex === playlist.length - 1;
        return !isLastTrack || repeatMode !== 'off';
    }, [playlist, currentTrackIndex, repeatMode]);

    const canGoPrev = useCallback(() => {
        return currentTrackIndex > 0;
    }, [currentTrackIndex]);

    const goToNext = useCallback(() => {
        if (currentTrackIndex < playlist.length - 1) {
            setCurrentTrackIndex(prevIndex => prevIndex + 1);
            return true;
        }
        if (repeatMode === 'all' && playlist.length > 0) {
            setCurrentTrackIndex(0);
            return true;
        }
        return false;
    }, [currentTrackIndex, playlist.length, repeatMode]);

    const goToPrev = useCallback(() => {
        if (!canGoPrev()) return false;
        setCurrentTrackIndex(prevIndex => prevIndex - 1);
        return true;
    }, [canGoPrev]);

    const setTrackList = useCallback((tracks, startIndex = 0) => {
        setPlaylist(tracks);
        setCurrentTrackIndex(startIndex);
    }, []);
    
    const addTrackToPlaylist = useCallback((track) => {
        setPlaylist(prevPlaylist => {
            if (prevPlaylist.some(t => t.uuid === track.uuid)) {
                return prevPlaylist;
            }
            return [...prevPlaylist, track];
        });
    }, []);

    const playTrackFromPlaylist = useCallback(async (track, trackList = []) => {
        if (track.isLocal) {
            const newPlaylist = trackList.length > 0 ? trackList : [track];
            setPlaylist(newPlaylist);
            const trackIndex = newPlaylist.findIndex(t => t.uuid === track.uuid);
            setCurrentTrackIndex(trackIndex !== -1 ? trackIndex : 0);
            return true;
        }

        try {
            const freshTrackData = await api.tracks.getDetails(track.uuid);
            const newPlaylist = (trackList.length > 0 ? trackList : [track]).map(t => 
                t.uuid === freshTrackData.uuid ? freshTrackData : t
            );
            setPlaylist(newPlaylist);
            const trackIndex = newPlaylist.findIndex(t => t.uuid === freshTrackData.uuid);
            setCurrentTrackIndex(trackIndex !== -1 ? trackIndex : 0);
            return true;
        } catch (error) {
            const newPlaylist = trackList.length > 0 ? trackList : [track];
            setPlaylist(newPlaylist);
            const trackIndex = newPlaylist.findIndex(t => t.uuid === track.uuid);
            setCurrentTrackIndex(trackIndex !== -1 ? trackIndex : 0);
            return true;
        }
    }, []);

    const toggleRepeat = useCallback((isWaveMode = false) => {
        const modes = isWaveMode ? ['off', 'one'] : ['off', 'all', 'one'];
        setRepeatMode(prev => modes[(modes.indexOf(prev) + 1) % modes.length]);
    }, []);

    const clearPlaylist = useCallback(() => {
        setPlaylist([]);
        setCurrentTrackIndex(-1);
    }, []);

    return {
        playlist,
        currentTrack,
        currentTrackIndex,
        repeatMode,
        setRepeatMode,
        canGoNext,
        canGoPrev,
        goToNext,
        goToPrev,
        setTrackList,
        playTrackFromPlaylist,
        toggleRepeat,
        clearPlaylist,
        addTrackToPlaylist,
    };
};