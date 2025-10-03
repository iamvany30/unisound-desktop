import { useState, useCallback, useMemo } from 'react';

export const usePlaylistManager = (initialState = {}) => {
    const [playlist, setPlaylist] = useState(initialState.playlist || []);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(initialState.currentTrackIndex || -1);
    const [repeatMode, setRepeatMode] = useState('off');

    const currentTrack = useMemo(() => 
        playlist[currentTrackIndex] || null, 
        [playlist, currentTrackIndex]
    );

    const canGoNext = useCallback((isWaveMode = false) => {
        if (playlist.length === 0) return false;
        if (isWaveMode) return true;
        const isLastTrack = currentTrackIndex === playlist.length - 1;
        return !isLastTrack || repeatMode !== 'off';
    }, [playlist.length, currentTrackIndex, repeatMode]);

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

    const updateTrackInPlaylist = useCallback((updatedTrack) => {
        setPlaylist(prevPlaylist => {
            const newPlaylist = [...prevPlaylist];
            const index = newPlaylist.findIndex(t => t.uuid === updatedTrack.uuid);
            if (index !== -1) {
                newPlaylist[index] = updatedTrack;
            }
            return newPlaylist;
        });
    }, []);


    const playTrackFromPlaylist = useCallback((track, trackList = []) => {
        const newPlaylist = trackList.length > 0 ? trackList : [track];
        const trackIndex = newPlaylist.findIndex(t => t.uuid === track.uuid);
        
        setPlaylist(newPlaylist);
        setCurrentTrackIndex(trackIndex !== -1 ? trackIndex : 0);
        return true;
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
        updateTrackInPlaylist, 
    };
};