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

    const audioRef = useRef(null);
    const hlsRef = useRef(null);
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const eqNodesRef = useRef([]);
    const gainNodeRef = useRef(null);
    const analyserRef = useRef(null);
    
    const isInitializedRef = useRef(false);
    const isLoadingTrackRef = useRef(false);
    const pendingPlayRef = useRef(false);
    const isSeekingRef = useRef(false);
    const currentTrackIdRef = useRef(null);
    
    const [playerState, setPlayerState] = useState(PLAYER_STATES.IDLE);
    const [progress, setProgress] = useState(initialState.progress || 0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(initialState.volume ?? 1);
    const [isMuted, setIsMuted] = useState(initialState.isMuted ?? false);
    const [isCurrentTrackLiked, setIsCurrentTrackLiked] = useState(false);
    const [error, setError] = useState(null);
    
    const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
    const [isLyricsVisible, setIsLyricsVisible] = useState(false);

    const { gains } = useEqualizer();
    const debouncedProgress = useSimpleDebounce(progress, 1000);

    const { currentTrack: rawCurrentTrack, playlist, currentTrackIndex, repeatMode, setRepeatMode } = playlistManager;
    const currentTrack = useMemo(() => processTrackData(rawCurrentTrack), [rawCurrentTrack]);

    const isPlaying = playerState === PLAYER_STATES.PLAYING;
    const isLoading = playerState === PLAYER_STATES.LOADING;

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = 'auto';
        }
    }, []);

    const initAudioContext = useCallback(() => {
        if (audioContextRef.current || isInitializedRef.current) return true;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.error("Web Audio API is not supported");
                return false;
            }
            
            const context = new AudioContextClass();

            if (!sourceNodeRef.current && audioRef.current) {
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
            gainNode.gain.value = isMuted ? 0 : volume;
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
            isInitializedRef.current = true;
            console.log('Web Audio API initialized');
            return true;
        } catch (error) {
            console.error("Failed to initialize Web Audio API:", error);
            return false;
        }
    }, [volume, isMuted]);

    useEffect(() => {
        if (!audioContextRef.current || eqNodesRef.current.length === 0) return;
        gains.forEach((gainValue, index) => {
            if (eqNodesRef.current[index]) {
                eqNodesRef.current[index].gain.setTargetAtTime(
                    gainValue, 
                    audioContextRef.current.currentTime, 
                    0.015
                );
            }
        });
    }, [gains]);
    
    useEffect(() => {
        if (gainNodeRef.current && audioContextRef.current) {
            const targetVolume = isMuted ? 0 : volume;
            gainNodeRef.current.gain.setTargetAtTime(
                targetVolume, 
                audioContextRef.current.currentTime, 
                0.015
            );
        }
    }, [volume, isMuted]);

    const cleanupHls = useCallback(() => {
        if (hlsRef.current) {
            try {
                hlsRef.current.destroy();
            } catch (e) {
                console.warn('HLS cleanup error:', e);
            }
            hlsRef.current = null;
        }
    }, []);

    const play = useCallback(async () => {
        const audio = audioRef.current;
        if (!currentTrack || !audio || audio.readyState < 2) {
            pendingPlayRef.current = true;
            return false;
        }

        try {
            if (!audioContextRef.current) {
                const initialized = initAudioContext();
                if (!initialized) {
                    setPlayerState(PLAYER_STATES.ERROR);
                    setError('Failed to initialize audio');
                    return false;
                }
            }

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            await audio.play();
            setPlayerState(PLAYER_STATES.PLAYING);
            pendingPlayRef.current = false;
            return true;
        } catch (error) {
            if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                console.error("Playback error:", error);
                setPlayerState(PLAYER_STATES.ERROR);
                setError(`Playback error: ${error.message}`);
            }
            return false;
        }
    }, [currentTrack, initAudioContext]);

    const pause = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            setPlayerState(PLAYER_STATES.PAUSED);
            pendingPlayRef.current = false;
        }
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
        if (!audio || !isFinite(time) || !audio.duration) return;

        const newTime = Math.max(0, Math.min(time, audio.duration));
        isSeekingRef.current = true;
        audio.currentTime = newTime;
        setProgress(newTime);
        
        const onSeeked = () => {
            isSeekingRef.current = false;
            audio.removeEventListener('seeked', onSeeked);
        };
        audio.addEventListener('seeked', onSeeked, { once: true });
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const trackLoadId = currentTrack ? `${currentTrack.uuid}-${Date.now()}` : null;
        currentTrackIdRef.current = trackLoadId;
        isLoadingTrackRef.current = true;

        const eventsToClear = ['canplay', 'playing', 'pause', 'ended', 'timeupdate', 'loadedmetadata', 'waiting', 'error', 'loadstart'];
        eventsToClear.forEach(event => {
            audio[`on${event}`] = null;
        });
        
        cleanupHls();

        if (!currentTrack) {
            audio.src = "";
            setPlayerState(PLAYER_STATES.IDLE);
            setDuration(0);
            setProgress(0);
            isLoadingTrackRef.current = false;
            return;
        }

        setPlayerState(PLAYER_STATES.LOADING);
        setError(null);
        setProgress(0);
        setDuration(0);
        
        const shouldRestore = (playlistManager.currentTrackIndex === initialState.currentTrackIndex);
        const startTime = shouldRestore ? initialState.progress : 0;

        if (currentTrack.isLocal && currentTrack.filePath) {
            audio.src = currentTrack.filePath;
        } else if (currentTrack.hls_url && Hls.isSupported()) {
            const token = localStorage.getItem('unisound_token');
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                xhrSetup: (xhr) => {
                    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }
            });
            hlsRef.current = hls;
            
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal && trackLoadId === currentTrackIdRef.current) {
                    setPlayerState(PLAYER_STATES.ERROR);
                    setError('Stream error');
                }
            });
            
            hls.loadSource(currentTrack.hls_url);
            hls.attachMedia(audio);
        } else if (currentTrack.filename) {
            audio.src = api.player.getStreamUrl(currentTrack.filename);
        } else {
            setPlayerState(PLAYER_STATES.ERROR);
            setError('No playable source');
            isLoadingTrackRef.current = false;
            return;
        }

        const handleLoadedMetadata = () => {
            if (trackLoadId !== currentTrackIdRef.current) return;
            setDuration(audio.duration);
            if (startTime > 0 && startTime < audio.duration) {
                audio.currentTime = startTime;
            }
        };

        const handleCanPlay = () => {
            if (trackLoadId !== currentTrackIdRef.current) return;
            setPlayerState(PLAYER_STATES.READY);
            isLoadingTrackRef.current = false;
            
            if (pendingPlayRef.current) {
                play();
            }
        };

        const handlePlaying = () => {
            if (trackLoadId !== currentTrackIdRef.current) return;
            setPlayerState(PLAYER_STATES.PLAYING);
        };

        const handlePause = () => {
            if (trackLoadId !== currentTrackIdRef.current) return;
            if (audio.readyState >= 3 && !audio.ended) {
                setPlayerState(PLAYER_STATES.PAUSED);
            }
        };

        const handleTimeUpdate = () => {
            if (trackLoadId !== currentTrackIdRef.current || isSeekingRef.current) return;
            setProgress(audio.currentTime);
        };

        const handleWaiting = () => {
            if (trackLoadId !== currentTrackIdRef.current) return;
            if (!isLoadingTrackRef.current) {
                setPlayerState(PLAYER_STATES.LOADING);
            }
        };

        const handleError = (e) => {
            if (trackLoadId !== currentTrackIdRef.current) return;
            console.error('Audio error:', e.target.error);
            setPlayerState(PLAYER_STATES.ERROR);
            setError(`Audio error: ${e.target.error?.message || 'Unknown'}`);
            isLoadingTrackRef.current = false;
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('error', handleError);

        audio.load();

        return () => {
            if (trackLoadId === currentTrackIdRef.current) {
                audio.pause();
            }
        };
    }, [currentTrack, cleanupHls, play, initialState, playlistManager.currentTrackIndex]);

    useEffect(() => {
        if (waveManager.isWaveMode) {
            waveManager.autoFetchNextIfNeeded();
        }
    }, [currentTrackIndex, waveManager]);

    const playNext = useCallback(async () => {
        if (waveManager.isWaveMode) {
            const switched = playlistManager.goToNext();
            if (switched) {
                pendingPlayRef.current = true;
            } else {
                setPlayerState(PLAYER_STATES.LOADING);
                const newTrack = await waveManager.fetchAndAppendWaveTrack();
                if (newTrack && playlistManager.goToNext()) {
                    pendingPlayRef.current = true;
                } else {
                    setError("Failed to load next track");
                    setPlayerState(PLAYER_STATES.PAUSED);
                }
            }
        } else {
            if (playlistManager.canGoNext()) {
                pendingPlayRef.current = true;
                playlistManager.goToNext();
            }
        }
    }, [playlistManager, waveManager]);

    const playPrev = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.currentTime > 3) {
            audio.currentTime = 0;
        } else if (playlistManager.canGoPrev()) {
            pendingPlayRef.current = true;
            playlistManager.goToPrev();
        } else {
            audio.currentTime = 0;
        }
    }, [playlistManager]);

    const playTrack = useCallback((track, trackList = []) => {
        pendingPlayRef.current = true;
        if (waveManager.isWaveMode) {
            waveManager.stopWave();
        }
        playlistManager.playTrackFromPlaylist(track, trackList);
    }, [playlistManager, waveManager]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

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

    useEffect(() => {
        if (initialState.repeatMode) {
            setRepeatMode(initialState.repeatMode);
        }
    }, [initialState.repeatMode, setRepeatMode]);

    useEffect(() => {
        if (!currentTrack) {
            localStorage.removeItem(PLAYER_STATE_KEY);
            return;
        }

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
            console.warn("Failed to save state:", e);
        }
    }, [currentTrack, currentTrackIndex, debouncedProgress, volume, isMuted, repeatMode]);

    const handleSetVolume = useCallback((newVolume) => {
        setIsMuted(newVolume === 0);
        setVolume(newVolume);
    }, []);

    const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
    const toggleRepeat = useCallback(() => playlistManager.toggleRepeat(waveManager.isWaveMode), [playlistManager, waveManager.isWaveMode]);
    const toggleNowPlaying = useCallback(() => setIsNowPlayingOpen(prev => !prev), []);
    const toggleLyricsWindow = useCallback(() => {
        setIsLyricsVisible(prev => {
            window.electronAPI?.toggleKaraokeWindow?.(!prev);
            return !prev;
        });
    }, []);

    const toggleLike = useCallback(async () => {
        if (!currentTrack || currentTrack.isLocal) return;
        const wasLiked = isCurrentTrackLiked;
        setIsCurrentTrackLiked(!wasLiked);
        try {
            if (wasLiked) {
                await api.tracks.removeInteraction(currentTrack.uuid);
            } else {
                await api.tracks.like(currentTrack.uuid);
            }
        } catch (error) {
            setIsCurrentTrackLiked(wasLiked);
        }
    }, [isCurrentTrackLiked, currentTrack]);

    useEffect(() => {
        const checkLikeStatus = async () => {
            if (!currentTrack?.uuid || currentTrack?.isLocal) {
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
        const unsubscribe = window.electronAPI?.onKaraokeWindowClosed?.(() => {
            setIsLyricsVisible(false);
        });
        return () => unsubscribe?.();
    }, []);

    useEffect(() => {
        if (window.electronAPI?.updateMediaControls) {
            if (currentTrack) {
                window.electronAPI.updateMediaControls({
                    title: currentTrack.title,
                    artist: currentTrack.primaryArtistName || 'Unknown Artist',
                    isPlaying: isPlaying,
                });
            } else {
                window.electronAPI.updateMediaControls(null);
            }
        }
    }, [currentTrack, isPlaying]);

    useEffect(() => {
        const unsubscribe = window.electronAPI?.onMediaControlEvent?.((action) => {
            switch (action) {
                case 'play-pause':
                    togglePlay();
                    break;
                case 'next':
                    playNext();
                    break;
                case 'prev':
                    playPrev();
                    break;
                default:
                    break;
            }
        });
        return () => unsubscribe?.();
    }, [togglePlay, playNext, playPrev]);

    useEffect(() => {
        return () => {
            cleanupHls();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, [cleanupHls]);

    const playerApi = useMemo(() => ({
        currentTrack,
        isPlaying,
        isLoading,
        playerState,
        progress,
        duration,
        volume,
        isMuted,
        isCurrentTrackLiked,
        error,
        isNowPlayingOpen,
        isLyricsVisible,
        repeatMode,
        playlist,
        currentTrackIndex,
        isShuffle: false,
        isWaveMode: waveManager.isWaveMode,
        analyser: analyserRef.current,
        canGoNext: playlistManager.canGoNext(waveManager.isWaveMode),
        canGoPrev: playlistManager.canGoPrev(),
        
        togglePlay,
        playNext,
        playPrev,
        seek,
        setVolume: handleSetVolume,
        toggleMute,
        toggleLike,
        toggleRepeat,
        playTrack,
        toggleNowPlaying,
        toggleLyricsWindow,
        toggleShuffle: () => {},
        startWave: async () => {
            pendingPlayRef.current = true;
            await waveManager.startWave();
        },
        stopWave: waveManager.stopWave,
        submitWaveFeedback: (type) => waveManager.submitWaveFeedback(type, currentTrack),
        clearPlaylist: playlistManager.clearPlaylist,
        retry: () => {
            if (currentTrack) {
                const track = currentTrack;
                const list = [...playlist];
                playlistManager.setTrackList([]);
                setTimeout(() => playlistManager.playTrackFromPlaylist(track, list), 0);
            }
        },
    }), [
        currentTrack, isPlaying, isLoading, playerState, progress, duration,
        volume, isMuted, isCurrentTrackLiked, error, isNowPlayingOpen, isLyricsVisible,
        playlistManager, waveManager, togglePlay, playNext, playPrev, seek,
        handleSetVolume, toggleMute, toggleLike, toggleNowPlaying, toggleLyricsWindow,
        playTrack, repeatMode, playlist, currentTrackIndex, toggleRepeat
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