
import { useState, useCallback, useMemo } from 'react';
import api from '../services/api';


export const usePlaylistManager = () => {
    const [playlist, setPlaylist] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [repeatMode, setRepeatMode] = useState('off');

    const currentTrack = useMemo(() => 
        playlist[currentTrackIndex] || null, 
        [playlist, currentTrackIndex]
    );

    const currentTrackUuid = currentTrack?.uuid;

    const nextTrackInfo = useMemo(() => {
        const nextTrackIndex = (currentTrackIndex + 1) % playlist.length;
        const hasNext = playlist.length > 1 && (repeatMode !== 'off' || nextTrackIndex > currentTrackIndex);
        const nextTrack = hasNext ? playlist[nextTrackIndex] : null;
        return { nextTrackIndex, hasNext, nextTrack };
    }, [currentTrackIndex, playlist, repeatMode]);

    const canGoNext = useCallback(() => {
        if (playlist.length === 0) return false;
        const isLastTrack = currentTrackIndex === playlist.length - 1;
        return !isLastTrack || repeatMode !== 'off';
    }, [playlist.length, currentTrackIndex, repeatMode]);

    const canGoPrev = useCallback(() => {
        return currentTrackIndex > 0;
    }, [currentTrackIndex]);

    const goToNext = useCallback(() => {
        if (!canGoNext()) return false;
        
        const nextTrackIndex = (currentTrackIndex + 1) % playlist.length;
        setCurrentTrackIndex(nextTrackIndex);
        return true;
    }, [canGoNext, currentTrackIndex, playlist.length]);

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
        setPlaylist(prev => {
            const exists = prev.find(t => t.uuid === track.uuid);
            return exists ? prev : [...prev, track];
        });
    }, []);

    const playTrackFromPlaylist = useCallback(async (track, trackList = []) => {
        console.log(`[PlaylistManager] playTrack called for "${track.title}".`);
        
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
            console.error("Failed to get fresh track data, playing with stale data.", error);
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
        currentTrackUuid,
        currentTrackIndex,
        repeatMode,
        nextTrackInfo,
        canGoNext,
        canGoPrev,
        goToNext,
        goToPrev,
        setTrackList,
        addTrackToPlaylist,
        playTrackFromPlaylist,
        toggleRepeat,
        clearPlaylist
    };
};