import React, {
    createContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useContext
} from 'react';
import Hls from 'hls.js';
import api from '../services/api';
import { usePlaylistManager } from '../hooks/usePlaylistManager';
import { useWaveManager } from '../hooks/useWaveManager';
import { useMediaSessionManager } from '../hooks/useMediaSessionManager';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useSimpleDebounce } from '../hooks/useDebounce';
import { processTrackData } from '../utils/trackDataProcessor';

export const PlayerContext = createContext(null);

const PLAYER_STATE_KEY = 'unisound_player_state';
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
        if (!item) return {};
        const parsed = JSON.parse(item);
        return {
            playlist: parsed.playlist || [],
            currentTrackIndex: parsed.currentTrackIndex || -1,
            progress: parsed.progress || 0,
            volume: parsed.volume ?? 1,
            isMuted: parsed.isMuted ?? false,
            repeatMode: parsed.repeatMode || 'off'
        };
    } catch (error) {
        return {};
    }
};

export const PlayerProvider = ({ children }) => {
    const [initialState] = useState(getInitialState);

    const playlistManager = usePlaylistManager({
        playlist: initialState.playlist,
        currentTrackIndex: initialState.currentTrackIndex,
    });
    const waveManager = useWaveManager(playlistManager);

    const [playerState, setPlayerState] = useState(PLAYER_STATES.IDLE);
    const [progress, setProgress] = useState(initialState.progress || 0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(initialState.volume ?? 1);
    const [isMuted, setIsMuted] = useState(initialState.isMuted ?? false);
    const [isCurrentTrackLiked, setIsCurrentTrackLiked] = useState(false);
    const [error, setError] = useState(null);
    const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
    const [isLyricsVisible, setIsLyricsVisible] = useState(false);
    const [shouldAutoplay, setShouldAutoplay] = useState(false);
    const debouncedProgress = useSimpleDebounce(progress, 1000);

    const audioRef = useRef(new Audio());
    const hlsRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const progressUpdateIntervalRef = useRef(null);
    const isSeekingRef = useRef(false);

    const { currentTrack: rawCurrentTrack, playlist, currentTrackIndex, repeatMode, setRepeatMode } = playlistManager;
    const currentTrack = useMemo(() => processTrackData(rawCurrentTrack), [rawCurrentTrack]);
    
    useEffect(() => {
        if(initialState.repeatMode) {
            setRepeatMode(initialState.repeatMode);
        }
    }, [initialState.repeatMode, setRepeatMode]);

    useEffect(() => {
        const sanitizedPlaylist = playlist.map(track => {
            const { artwork, ...rest } = track; 
            return rest;
        });

        const stateToSave = {
            playlist: sanitizedPlaylist,
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
    }, [playlist, currentTrackIndex, debouncedProgress, volume, isMuted, repeatMode]);

    const isPlaying = playerState === PLAYER_STATES.PLAYING;
    const isLoading = playerState === PLAYER_STATES.LOADING;

    const toggleNowPlaying = useCallback(() => setIsNowPlayingOpen(prev => !prev), []);

    const initAudioContext = useCallback(() => {
        if (audioContextRef.current) return true;
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            if (!sourceNodeRef.current) {
                sourceNodeRef.current = context.createMediaElementSource(audioRef.current);
            }
            sourceNodeRef.current.connect(analyser);
            analyser.connect(context.destination);
            audioContextRef.current = context;
            analyserRef.current = analyser;
            return true;
        } catch (error) { return false; }
    }, []);

    const cleanupHls = useCallback(() => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    const loadTrack = useCallback((track, startTime = 0) => {
        setError(null);
        setDuration(0);
        isSeekingRef.current = false;
        if (progressUpdateIntervalRef.current) clearInterval(progressUpdateIntervalRef.current);
        cleanupHls();
        
        const audio = audioRef.current;
        if (!track) {
            audio.src = "";
            setProgress(0);
            setPlayerState(PLAYER_STATES.IDLE);
            return;
        }

        setPlayerState(PLAYER_STATES.LOADING);
        
        const onLoaded = () => {
            if (startTime > 0 && startTime < audio.duration) {
                audio.currentTime = startTime;
            }
            setProgress(audio.currentTime);
        };
        audio.addEventListener('loadedmetadata', onLoaded, { once: true });
        
        if (track.isLocal && track.filePath) {
            const objectURL = `file://${track.filePath}`;
            audio.src = objectURL;
        } else if (track.hls_url && Hls.isSupported()) {
            const token = localStorage.getItem('unisound_token');
            const hls = new Hls({ xhrSetup: (xhr) => { if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`); } });
            hlsRef.current = hls;
            hls.on(Hls.Events.ERROR, (event, data) => { if (data.fatal) {
                setPlayerState(PLAYER_STATES.ERROR);
                setError('Ошибка при загрузке потока.');
            }});
            hls.loadSource(track.hls_url);
            hls.attachMedia(audio);
        } else if (track.filename) {
            audio.src = api.player.getStreamUrl(track.filename);
        } else {
            setPlayerState(PLAYER_STATES.ERROR);
            setError('Не найден источник для воспроизведения трека.');
            return;
        }
        audio.load();
        
        return () => audio.removeEventListener('loadedmetadata', onLoaded);
    }, [cleanupHls]);

    useEffect(() => {
        const startTime = (playlistManager.currentTrackIndex === initialState.currentTrackIndex) ? initialState.progress : 0;
        loadTrack(currentTrack, startTime);
    }, [currentTrack]);

    const playNext = useCallback(() => {
        if (playlistManager.canGoNext()) {
            setShouldAutoplay(true);
            playlistManager.goToNext();
            waveManager.autoFetchNextIfNeeded();
        }
    }, [playlistManager, waveManager]);

    const playPrev = useCallback(() => {
        const audio = audioRef.current;
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            setProgress(0);
        } else if (playlistManager.canGoPrev()) {
            setShouldAutoplay(true);
            playlistManager.goToPrev();
        } else {
            audio.currentTime = 0;
            setProgress(0);
        }
    }, [playlistManager]);

    const playTrack = useCallback((track, trackList = []) => {
        setShouldAutoplay(true);
        if(waveManager.isWaveMode) waveManager.stopWave();
        playlistManager.playTrackFromPlaylist(track, trackList);
    }, [playlistManager, waveManager]);

    const play = useCallback(async () => {
         if (!currentTrack) return;
         try {
             if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
             }
             if (!audioContextRef.current) initAudioContext();
             await audioRef.current.play();
         } catch (error) {
             setPlayerState(PLAYER_STATES.ERROR);
             setError(`Ошибка воспроизведения: ${error.message}`);
         }
    }, [currentTrack, initAudioContext]);

    const pause = useCallback(() => {
        audioRef.current.pause();
    }, []);

    const togglePlay = useCallback(() => {
        isPlaying ? pause() : play();
    }, [isPlaying, pause, play]);
    
    const seek = useCallback((time) => {
        const audio = audioRef.current;
        if (isFinite(time) && audio.duration) {
            const newTime = Math.max(0, Math.min(time, audio.duration));
            isSeekingRef.current = true;
            setProgress(newTime);
            audio.currentTime = newTime;
        }
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => {
            if (repeatMode === 'one') {
                audio.currentTime = 0;
                play();
            } else {
                playNext();
            }
        };
        const handleCanPlay = () => {
            setPlayerState(PLAYER_STATES.READY);
            if (shouldAutoplay) {
                play();
                setShouldAutoplay(false);
            }
        };
        const handlePlaying = () => {
            setPlayerState(PLAYER_STATES.PLAYING);
            if (progressUpdateIntervalRef.current) clearInterval(progressUpdateIntervalRef.current);
            progressUpdateIntervalRef.current = setInterval(() => {
                if (!isSeekingRef.current) {
                    setProgress(audio.currentTime);
                }
            }, 250);
        };
        const handlePause = () => {
            if (isPlaying) setPlayerState(PLAYER_STATES.PAUSED);
            if (progressUpdateIntervalRef.current) clearInterval(progressUpdateIntervalRef.current);
        };
        const handleWaiting = () => setPlayerState(PLAYER_STATES.LOADING);
        const handleError = (e) => {
            setPlayerState(PLAYER_STATES.ERROR);
            setError(`Ошибка аудио: ${e.target.error?.message || 'Неизвестная ошибка'}`);
        };
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleSeeked = () => isSeekingRef.current = false;
        
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('error', handleError);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('seeked', handleSeeked);

        return () => {
            if (progressUpdateIntervalRef.current) clearInterval(progressUpdateIntervalRef.current);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('playing', handlePlaying);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('seeked', handleSeeked);
        };
    }, [play, playNext, repeatMode, shouldAutoplay, isPlaying]);

    const handleSetVolume = useCallback((newVolume) => {
        setIsMuted(newVolume === 0);
        setVolume(newVolume);
    }, []);

    const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
    const toggleRepeat = useCallback(() => playlistManager.toggleRepeat(waveManager.isWaveMode), [playlistManager, waveManager.isWaveMode]);

    const toggleLike = useCallback(async () => {
        if (!currentTrack || currentTrack.isLocal) return;
        const wasLiked = isCurrentTrackLiked;
        setIsCurrentTrackLiked(!wasLiked);
        try {
            wasLiked ? await api.tracks.removeInteraction(currentTrack.uuid) : await api.tracks.like(currentTrack.uuid);
        } catch (error) {
            setIsCurrentTrackLiked(wasLiked);
        }
    }, [isCurrentTrackLiked, currentTrack]);

    const toggleLyricsWindow = useCallback(() => {
        setIsLyricsVisible(prev => {
            window.electronAPI?.toggleKaraokeWindow?.(!prev);
            return !prev;
        });
    }, []);

    useEffect(() => { audioRef.current.volume = isMuted ? 0 : volume; }, [volume, isMuted]);

    useEffect(() => {
        const checkLikeStatus = async () => {
            if (!currentTrack?.uuid || currentTrack.isLocal) {
                setIsCurrentTrackLiked(false);
                return;
            }
            try {
                const { is_liked } = await api.tracks.getInteractionStatus(currentTrack.uuid);
                setIsCurrentTrackLiked(is_liked);
            } catch (error) {
                setIsCurrentTrackLiked(false);
            }
        };
        checkLikeStatus();
    }, [currentTrack?.uuid, currentTrack?.isLocal]);

    useEffect(() => {
        const token = localStorage.getItem('unisound_token');
        window.electronAPI?.updateKaraokeData?.({ track: currentTrack, progress, isPlaying, token });
    }, [currentTrack, progress, isPlaying]);

    useEffect(() => {
        const unsubscribe = window.electronAPI?.onKaraokeWindowClosed?.(() => setIsLyricsVisible(false));
        return () => unsubscribe?.();
    }, []);

     useEffect(() => {
        if (window.electronAPI?.updateMediaControls) {
            if (currentTrack) {
                window.electronAPI.updateMediaControls({
                    title: currentTrack.title,
                    artist: currentTrack.primaryArtistName || 'Unknown Artist',
                    isPlaying: isPlaying
                });
            } else {
                window.electronAPI.updateMediaControls(null);
            }
        }
    }, [currentTrack, isPlaying]);

    useEffect(() => {
        const unsubscribe = window.electronAPI?.onMediaControlEvent?.((action) => {
            switch (action) {
                case 'play-pause': togglePlay(); break;
                case 'next': playNext(); break;
                case 'prev': playPrev(); break;
                default: break;
            }
        });
        return () => unsubscribe?.();
    }, [togglePlay, playNext, playPrev]);

    useEffect(() => {
        return () => {
            if (progressUpdateIntervalRef.current) clearInterval(progressUpdateIntervalRef.current);
            cleanupHls();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
        };
    }, [cleanupHls]);

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
        startWave: waveManager.startWave,
        stopWave: waveManager.stopWave,
        submitWaveFeedback: (type) => waveManager.submitWaveFeedback(type, currentTrack),
        analyser: analyserRef.current,
        canGoNext: playlistManager.canGoNext(),
        canGoPrev: playlistManager.canGoPrev(),
        clearPlaylist: playlistManager.clearPlaylist,
        retry: () => loadTrack(currentTrack),
    }), [
        currentTrack, isPlaying, isLoading, playerState, progress, duration,
        volume, isMuted, isCurrentTrackLiked, error, isNowPlayingOpen, isLyricsVisible,
        playlistManager, waveManager, togglePlay, playNext, playPrev, seek, handleSetVolume, toggleMute,
        toggleLike, loadTrack, toggleNowPlaying, toggleLyricsWindow, playTrack, repeatMode, playlist, currentTrackIndex, toggleRepeat
    ]);

    useMediaSessionManager(
        currentTrack, 
        isPlaying, 
        { togglePlay, playNext, playPrev, seek },
        { progress, duration }
    );
    useKeyboardControls(playerApi);

    return (
        <PlayerContext.Provider value={playerApi}>
            {children}
        </PlayerContext.Provider>
    );
};