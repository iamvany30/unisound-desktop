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
import { processTrackData } from '../utils/trackDataProcessor';

export const PlayerContext = createContext(null);

const PLAYER_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ERROR: 'error'
};

const getInitialState = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        return defaultValue;
    }
};

const saveToLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Error saving to localStorage key "${key}":`, error);
    }
};

export const PlayerProvider = ({ children }) => {
    const playlistManager = usePlaylistManager();
    const waveManager = useWaveManager(playlistManager);

    const [playerState, setPlayerState] = useState(PLAYER_STATES.IDLE);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(() => getInitialState('player_volume', 1));
    const [isMuted, setIsMuted] = useState(false);
    const [isCurrentTrackLiked, setIsCurrentTrackLiked] = useState(false);
    const [error, setError] = useState(null);
    const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
    const [isLyricsVisible, setIsLyricsVisible] = useState(false);
    const [shouldAutoplay, setShouldAutoplay] = useState(false);

    const audioRef = useRef(new Audio());
    const hlsRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const progressUpdateIntervalRef = useRef(null);
    const isSeekingRef = useRef(false);

    const { currentTrack: rawCurrentTrack } = playlistManager;
    const currentTrack = useMemo(() => processTrackData(rawCurrentTrack), [rawCurrentTrack]);

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

    const loadTrack = useCallback((track) => {
        setError(null);
        setProgress(0);
        setDuration(0);
        isSeekingRef.current = false;
        if (progressUpdateIntervalRef.current) clearInterval(progressUpdateIntervalRef.current);
        cleanupHls();
        
        const audio = audioRef.current;
        if (!track) {
            audio.src = "";
            setPlayerState(PLAYER_STATES.IDLE);
            return;
        }

        setPlayerState(PLAYER_STATES.LOADING);

        if (track.isLocal && track.filePath) {
            const encodedPath = encodeURI(track.filePath.replace(/\\/g, '/'));
            audio.src = `file://${encodedPath}`;
        } else if (track.hls_url && Hls.isSupported()) {
            const token = localStorage.getItem('unisound_token');
            const hls = new Hls({ xhrSetup: (xhr) => { if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`); } });
            hlsRef.current = hls;
            hls.on(Hls.Events.ERROR, (event, data) => { if (data.fatal) {
                console.error('HLS Fatal Error:', data);
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
    }, [cleanupHls]);

    useEffect(() => {
        loadTrack(currentTrack);
    }, [currentTrack, loadTrack]);

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
            setShouldAutoplay(true);
        } else if (playlistManager.canGoPrev()) {
            setShouldAutoplay(true);
            playlistManager.goToPrev();
        } else {
            audio.currentTime = 0;
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
             if (!audioContextRef.current) initAudioContext();
             await audioRef.current.play();
         } catch (error) {
             console.error("Playback Error:", error);
             setPlayerState(PLAYER_STATES.ERROR);
             setError(`Ошибка воспроизведения: ${error.message}`);
         }
    }, [currentTrack, initAudioContext]);

    const pause = useCallback(() => {
        audioRef.current.pause();
    }, []);

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
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
            if (playlistManager.repeatMode === 'one') {
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
            setPlayerState(PLAYER_STATES.PAUSED);
            if (progressUpdateIntervalRef.current) {
                clearInterval(progressUpdateIntervalRef.current);
                progressUpdateIntervalRef.current = null;
            }
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
    }, [play, playNext, playlistManager.repeatMode, shouldAutoplay]);

    const handleSetVolume = useCallback((newVolume) => {
        setIsMuted(newVolume === 0);
        setVolume(newVolume);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const toggleLike = useCallback(async () => {
        if (!currentTrack || currentTrack.isLocal) return;
        const wasLiked = isCurrentTrackLiked;
        setIsCurrentTrackLiked(!wasLiked);
        try {
            if (wasLiked) await api.tracks.removeInteraction(currentTrack.uuid);
            else await api.tracks.like(currentTrack.uuid);
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
    useEffect(() => { if (!isMuted) saveToLocalStorage('player_volume', volume); }, [volume, isMuted]);

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
        window.electronAPI?.updateKaraokeData?.({
            track: currentTrack,
            progress,
            isPlaying,
            token
        });
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
        repeatMode: playlistManager.repeatMode,
        playlist: playlistManager.playlist,
        currentTrackIndex: playlistManager.currentTrackIndex,
        isShuffle: false,
        togglePlay, playNext, playPrev, seek,
        setVolume: handleSetVolume, toggleMute, toggleLike,
        toggleRepeat: (isWaveMode) => playlistManager.toggleRepeat(isWaveMode),
        playTrack,
        toggleNowPlaying, toggleLyricsWindow,
        toggleShuffle: () => { console.warn('Shuffle not implemented yet'); },
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
        playlistManager, waveManager,
        togglePlay, playNext, playPrev, seek, handleSetVolume, toggleMute,
        toggleLike, loadTrack, toggleNowPlaying, toggleLyricsWindow, playTrack
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

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};