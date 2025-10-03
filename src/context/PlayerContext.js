

import React, {
    createContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo
} from 'react';
import Hls from 'hls.js';
import api from '../services/api';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import { useWaveManager } from '../hooks/useWaveManager';
import { useMediaSessionManager } from '../hooks/useMediaSessionManager';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useSimpleDebounce } from '../hooks/useDebounce';
import { processTrackData } from '../utils/trackDataProcessor';
import { useEqualizer } from './EqualizerContext';
import { equalizerBands } from '../utils/equalizerPresets';

export const PlayerContext = createContext(null);

const PLAYER_STATE_KEY = 'unisound_player_state_v2';

const PLAYER_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ERROR: 'error'
};

const getInitialState = () => {
    try {
        const item = localStorage.getItem(PLAYER_STATE_KEY);
        if (!item) return { playlist: [], currentTrackIndex: -1 };
        
        const parsed = JSON.parse(item);

        
        if (parsed.currentTrack && typeof parsed.currentTrackIndex === 'number') {
            return {
                playlist: [parsed.currentTrack],
                currentTrackIndex: 0,
                progress: parsed.progress || 0,
                volume: parsed.volume ?? 1,
                isMuted: parsed.isMuted ?? false,
                repeatMode: parsed.repeatMode || 'off'
            };
        }
    } catch (error) {
        console.warn("Failed to parse player state from localStorage", error);
    }
    return { playlist: [], currentTrackIndex: -1 };
};

export const PlayerProvider = ({ children }) => {
    const [initialState] = useState(getInitialState);

    const playlistManager = usePlaylistManager({
        playlist: initialState.playlist,
        currentTrackIndex: initialState.currentTrackIndex,
    });
    const waveManager = useWaveManager(playlistManager);

    const { gains } = useEqualizer();

    const [playerState, setPlayerState] = useState(PLAYER_STATES.IDLE);
    const [progress, setProgress] = useState(initialState.progress || 0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(initialState.volume ?? 1);
    const [isMuted, setIsMuted] = useState(initialState.isMuted ?? false);
    const [isCurrentTrackLiked, setIsCurrentTrackLiked] = useState(false);
    const [error, setError] = useState(null);
    const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
    const [isLyricsVisible, setIsLyricsVisible] = useState(false);
    
    const autoplayRef = useRef(false);
    const debouncedProgress = useSimpleDebounce(progress, 1000);

    const audioRef = useRef(new Audio());
    const hlsRef = useRef(null);
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const eqNodesRef = useRef([]);
    const gainNodeRef = useRef(null);
    const isSeekingRef = useRef(false);
    const analyserRef = useRef(null);

    const { currentTrack: rawCurrentTrack, playlist, currentTrackIndex, repeatMode, setRepeatMode } = playlistManager;
    const currentTrack = useMemo(() => processTrackData(rawCurrentTrack), [rawCurrentTrack]);
    
    useEffect(() => {
        if (initialState.repeatMode) {
            setRepeatMode(initialState.repeatMode);
        }
    }, [initialState.repeatMode, setRepeatMode]);

    useEffect(() => {
        if (!currentTrack) {
            localStorage.removeItem(PLAYER_STATE_KEY);
            return;
        };

        const stateToSave = {
            currentTrack,
            currentTrackIndex, 
            progress: debouncedProgress,
            volume,
            isMuted,
            repeatMode
        };
        try {
            localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.warn("Failed to save player state:", e);
        }
    }, [currentTrack, currentTrackIndex, debouncedProgress, volume, isMuted, repeatMode]);

    const isPlaying = playerState === PLAYER_STATES.PLAYING;
    const isLoading = playerState === PLAYER_STATES.LOADING;

    const toggleNowPlaying = useCallback(() => setIsNowPlayingOpen(prev => !prev), []);

    const initAudioContext = useCallback(() => {
        if (audioContextRef.current) return true;
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            if (!sourceNodeRef.current) {
                sourceNodeRef.current = context.createMediaElementSource(audioRef.current);
            }
            const filters = equalizerBands.map(band => {
                const filter = context.createBiquadFilter();
                filter.type = band.type;
                filter.frequency.value = band.freq;
                filter.Q.value = 1;
                filter.gain.value = 0;
                return filter;
            });
            eqNodesRef.current = filters;
            const gainNode = context.createGain();
            gainNodeRef.current = gainNode;
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;
            const audioChain = [sourceNodeRef.current, ...filters, gainNode, analyser, context.destination];
            for (let i = 0; i < audioChain.length - 1; i++) {
                audioChain[i].connect(audioChain[i + 1]);
            }
            audioContextRef.current = context;
            return true;
        } catch (error) {
            console.error("Failed to initialize Web Audio API:", error);
            return false;
        }
    }, []);

    useEffect(() => {
        if (!audioContextRef.current || eqNodesRef.current.length === 0) return;
        gains.forEach((gainValue, index) => {
            if (eqNodesRef.current[index]) {
                eqNodesRef.current[index].gain.setTargetAtTime(gainValue, audioContextRef.current.currentTime, 0.05);
            }
        });
    }, [gains]);
    
    useEffect(() => {
        if (gainNodeRef.current && audioContextRef.current) {
            const targetVolume = isMuted ? 0 : volume;
            gainNodeRef.current.gain.setTargetAtTime(targetVolume, audioContextRef.current.currentTime, 0.05);
        }
    }, [volume, isMuted]);

    const cleanupHls = useCallback(() => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    const play = useCallback(async () => {
         if (!currentTrack || audioRef.current.readyState < 2) return;
         try {
             if (!audioContextRef.current) initAudioContext();
             if (audioContextRef.current && audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
             await audioRef.current.play();
             setPlayerState(PLAYER_STATES.PLAYING);
         } catch (error) {
            if (error.name !== 'AbortError') {
                setPlayerState(PLAYER_STATES.ERROR);
                setError(`Ошибка воспроизведения: ${error.message}`);
                console.error("Playback error:", error);
            }
         }
    }, [currentTrack, initAudioContext]);

    const pause = useCallback(() => {
        audioRef.current.pause();
        setPlayerState(PLAYER_STATES.PAUSED);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        
        audio.oncanplay = null; audio.onplaying = null; audio.onpause = null; audio.onended = null; audio.ontimeupdate = null; audio.onloadedmetadata = null; audio.onwaiting = null; audio.onerror = null;
        
        cleanupHls();

        if (!currentTrack) {
            audio.src = "";
            setPlayerState(PLAYER_STATES.IDLE);
            setDuration(0);
            setProgress(0);
            return;
        }

        setPlayerState(PLAYER_STATES.LOADING);
        setError(null);
        
        
        const startTime = (playlistManager.currentTrackIndex === initialState.currentTrackIndex) ? initialState.progress : 0;

        
        
        if (currentTrack.isLocal && currentTrack.filePath) {
            
            
            audio.src = currentTrack.filePath;
        } else if (currentTrack.hls_url && Hls.isSupported()) {
            const token = localStorage.getItem('unisound_token');
            const hls = new Hls({ xhrSetup: (xhr) => { if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`); } });
            hlsRef.current = hls;
            hls.on(Hls.Events.ERROR, (event, data) => { if (data.fatal) { setPlayerState(PLAYER_STATES.ERROR); setError('Ошибка при загрузке потока.'); }});
            hls.loadSource(currentTrack.hls_url);
            hls.attachMedia(audio);
        } else if (currentTrack.filename) {
            audio.src = api.player.getStreamUrl(currentTrack.filename);
        } else { 
            setPlayerState(PLAYER_STATES.ERROR); 
            setError('Не найден источник для воспроизведения трека.'); 
            return; 
        }

        audio.onloadedmetadata = () => {
            setDuration(audio.duration);
            if (startTime > 0 && startTime < audio.duration) {
                audio.currentTime = startTime;
            }
        };
        audio.oncanplay = () => { setPlayerState(PLAYER_STATES.READY); if (autoplayRef.current) { play(); autoplayRef.current = false; } };
        audio.onplaying = () => setPlayerState(PLAYER_STATES.PLAYING);
        audio.onpause = () => { if (audio.readyState >= 3 && !audio.ended) setPlayerState(PLAYER_STATES.PAUSED); };
        audio.ontimeupdate = () => { if (!isSeekingRef.current) setProgress(audio.currentTime); };
        audio.onwaiting = () => setPlayerState(PLAYER_STATES.LOADING);
        audio.onerror = (e) => { setPlayerState(PLAYER_STATES.ERROR); setError(`Ошибка аудио: ${e.target.error?.message || 'Неизвестная ошибка'}`); };

        audio.load();

        return () => { audio.pause(); };
    }, [currentTrack, cleanupHls, play, initialState]); 

    useEffect(() => { if (waveManager.isWaveMode) waveManager.autoFetchNextIfNeeded(); }, [currentTrackIndex, waveManager]);

    const playNext = useCallback(async () => {
        if (waveManager.isWaveMode) {
            const switched = playlistManager.goToNext();
            if (switched) autoplayRef.current = true;
            else {
                setPlayerState(PLAYER_STATES.LOADING);
                const newTrack = await waveManager.fetchAndAppendWaveTrack();
                if (newTrack) {
                    if (playlistManager.goToNext()) autoplayRef.current = true;
                } else {
                    setError("Не удалось загрузить следующий трек.");
                    setPlayerState(PLAYER_STATES.PAUSED);
                }
            }
        } else {
            if (playlistManager.canGoNext()) {
                autoplayRef.current = true;
                playlistManager.goToNext();
            }
        }
    }, [playlistManager, waveManager]);

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => {
            if (repeatMode === 'one' && currentTrack) {
                audio.currentTime = 0;
                play();
            } else {
                playNext();
            }
        };
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, [repeatMode, currentTrack, play, playNext]);
    
    const playPrev = useCallback(() => {
        const audio = audioRef.current;
        if (audio.currentTime > 3) audio.currentTime = 0;
        else if (playlistManager.canGoPrev()) {
            autoplayRef.current = true;
            playlistManager.goToPrev();
        } else audio.currentTime = 0;
    }, [playlistManager]);

    const playTrack = useCallback((track, trackList = []) => {
        autoplayRef.current = true;
        if (waveManager.isWaveMode) waveManager.stopWave();
        playlistManager.playTrackFromPlaylist(track, trackList);
    }, [playlistManager, waveManager]);

    const togglePlay = useCallback(() => { isPlaying ? pause() : play(); }, [isPlaying, pause, play]);
    
    const seek = useCallback((time) => {
        const audio = audioRef.current;
        if (isFinite(time) && audio.duration) {
            const newTime = Math.max(0, Math.min(time, audio.duration));
            isSeekingRef.current = true;
            audio.currentTime = newTime;
            setProgress(newTime);
            const onSeeked = () => { isSeekingRef.current = false; audio.removeEventListener('seeked', onSeeked); };
            audio.addEventListener('seeked', onSeeked);
        }
    }, []);
    
    const handleSetVolume = useCallback((newVolume) => { setIsMuted(newVolume === 0); setVolume(newVolume); }, []);
    const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
    const toggleRepeat = useCallback(() => playlistManager.toggleRepeat(waveManager.isWaveMode), [playlistManager, waveManager.isWaveMode]);
    const toggleLike = useCallback(async () => {
        if (!currentTrack || currentTrack.isLocal) return;
        const wasLiked = isCurrentTrackLiked;
        setIsCurrentTrackLiked(!wasLiked);
        try { wasLiked ? await api.tracks.removeInteraction(currentTrack.uuid) : await api.tracks.like(currentTrack.uuid); } catch (error) { setIsCurrentTrackLiked(wasLiked); }
    }, [isCurrentTrackLiked, currentTrack]);
    const toggleLyricsWindow = useCallback(() => { setIsLyricsVisible(prev => { window.electronAPI?.toggleKaraokeWindow?.(!prev); return !prev; }); }, []);
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (!currentTrack?.uuid || currentTrack?.isLocal) { setIsCurrentTrackLiked(false); return; }
            try { const { is_liked } = await api.tracks.getInteractionStatus(currentTrack.uuid); setIsCurrentTrackLiked(is_liked); } catch (error) { setIsCurrentTrackLiked(false); }
        };
        checkLikeStatus();
    }, [currentTrack?.uuid, currentTrack?.isLocal]);
    useEffect(() => { const token = localStorage.getItem('unisound_token'); window.electronAPI?.updateKaraokeData?.({ track: currentTrack, progress, isPlaying, token }); }, [currentTrack, progress, isPlaying]);
    useEffect(() => { const unsubscribe = window.electronAPI?.onKaraokeWindowClosed?.(() => setIsLyricsVisible(false)); return () => unsubscribe?.(); }, []);
    useEffect(() => { if (window.electronAPI?.updateMediaControls) { if (currentTrack) { window.electronAPI.updateMediaControls({ title: currentTrack.title, artist: currentTrack.primaryArtistName || 'Unknown Artist', isPlaying: isPlaying }); } else { window.electronAPI.updateMediaControls(null); } } }, [currentTrack, isPlaying]);
    useEffect(() => { const unsubscribe = window.electronAPI?.onMediaControlEvent?.((action) => { switch (action) { case 'play-pause': togglePlay(); break; case 'next': playNext(); break; case 'prev': playPrev(); break; default: break; } }); return () => unsubscribe?.(); }, [togglePlay, playNext, playPrev]);
    useEffect(() => { return () => { cleanupHls(); if (audioContextRef.current && audioContextRef.current.state !== 'closed') { audioContextRef.current.close().catch(console.error); } }; }, [cleanupHls]);

    const playerApi = useMemo(() => ({
        currentTrack, isPlaying, isLoading, playerState, progress, duration,
        volume, isMuted, isCurrentTrackLiked, error, isNowPlayingOpen, isLyricsVisible,
        repeatMode, playlist, currentTrackIndex,
        isShuffle: false,
        togglePlay, playNext, playPrev, seek,
        setVolume: handleSetVolume, toggleMute, toggleLike,
        toggleRepeat, playTrack,
        toggleNowPlaying, toggleLyricsWindow,
        toggleShuffle: () => {},
        isWaveMode: waveManager.isWaveMode,
        startWave: async () => { autoplayRef.current = true; await waveManager.startWave(); },
        stopWave: waveManager.stopWave,
        submitWaveFeedback: (type) => waveManager.submitWaveFeedback(type, currentTrack),
        analyser: analyserRef.current,
        canGoNext: playlistManager.canGoNext(waveManager.isWaveMode),
        canGoPrev: playlistManager.canGoPrev(),
        clearPlaylist: playlistManager.clearPlaylist,
        retry: () => { if (currentTrack) { const track = currentTrack; const list = [...playlist]; playlistManager.setTrackList([]); setTimeout(() => playlistManager.playTrackFromPlaylist(track, list), 0); } },
    }), [ currentTrack, isPlaying, isLoading, playerState, progress, duration, volume, isMuted, isCurrentTrackLiked, error, isNowPlayingOpen, isLyricsVisible, playlistManager, waveManager, togglePlay, playNext, playPrev, seek, handleSetVolume, toggleMute, toggleLike, toggleNowPlaying, toggleLyricsWindow, playTrack, repeatMode, playlist, currentTrackIndex, toggleRepeat ]);
    
    useMediaSessionManager(currentTrack, isPlaying, { togglePlay, playNext, playPrev, seek }, { progress, duration });
    useKeyboardControls(playerApi);

    return ( <PlayerContext.Provider value={playerApi}> {children} </PlayerContext.Provider> );
};