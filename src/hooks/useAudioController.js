import { useRef, useCallback, useEffect } from 'react';
import Hls from 'hls.js';
import api from '../services/api';
import { useEqualizer } from '../context/EqualizerContext';
import { equalizerBands } from '../utils/equalizerPresets';

export const useAudioController = ({
    onStateChange,
    onProgressUpdate,
    onDurationUpdate,
    onError
}) => {
    const { gains } = useEqualizer();
    
    const audioRef = useRef(new Audio());
    const hlsRef = useRef(null);
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const eqNodesRef = useRef([]);
    const gainNodeRef = useRef(null);
    const analyserRef = useRef(null);
    
    const currentTrackRef = useRef(null);
    const isSeekingRef = useRef(false);
    
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
    
    const cleanupHls = useCallback(() => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);
    
    const loadTrack = useCallback((track, options = {}) => {
        const { startTime = 0, autoplay = false } = options;
        
        const audio = audioRef.current;
        currentTrackRef.current = track;
        
        audio.oncanplay = null;
        audio.onplaying = null;
        audio.onpause = null;
        audio.onended = null;
        audio.ontimeupdate = null;
        audio.onloadedmetadata = null;
        audio.onwaiting = null;
        audio.onerror = null;
        
        cleanupHls();
        
        if (!track) {
            audio.src = "";
            onStateChange('idle');
            onDurationUpdate(0);
            onProgressUpdate(0);
            return;
        }
        
        onStateChange('loading');
        
        if (track.isLocal && track.filePath) {
            audio.src = `file://${track.filePath}`;
        } else if (track.hls_url && Hls.isSupported()) {
            const token = localStorage.getItem('unisound_token');
            const hls = new Hls({
                xhrSetup: (xhr) => {
                    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }
            });
            hlsRef.current = hls;
            
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    onStateChange('error');
                    onError('Ошибка при загрузке потока.');
                }
            });
            
            hls.loadSource(track.hls_url);
            hls.attachMedia(audio);
        } else if (track.filename) {
            audio.src = api.player.getStreamUrl(track.filename);
        } else {
            onStateChange('error');
            onError('Не найден источник для воспроизведения трека.');
            return;
        }
        
        audio.onloadedmetadata = () => {
            onDurationUpdate(audio.duration);
            if (startTime > 0 && startTime < audio.duration) {
                audio.currentTime = startTime;
            }
        };
        
        audio.oncanplay = () => {
            onStateChange('ready');
            if (autoplay) {
                play();
            }
        };
        
        audio.onplaying = () => onStateChange('playing');
        audio.onpause = () => {
            if (audio.readyState >= 3) onStateChange('paused');
        };
        
        audio.ontimeupdate = () => {
            if (!isSeekingRef.current) {
                onProgressUpdate(audio.currentTime);
            }
        };
        
        audio.onwaiting = () => onStateChange('loading');
        
        audio.onerror = (e) => {
            onStateChange('error');
            onError(`Ошибка аудио: ${e.target.error?.message || 'Неизвестная ошибка'}`);
        };
        
        audio.load();
    }, [cleanupHls, onStateChange, onProgressUpdate, onDurationUpdate, onError]);
    
    const play = useCallback(async () => {
        if (!currentTrackRef.current || audioRef.current.readyState < 2) return false;
        
        try {
            if (!audioContextRef.current) initAudioContext();
            
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }
            
            await audioRef.current.play();
            onStateChange('playing');
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                onStateChange('error');
                onError(`Ошибка воспроизведения: ${error.message}`);
            }
            return false;
        }
    }, [initAudioContext, onStateChange, onError]);
    
    const pause = useCallback(() => {
        audioRef.current.pause();
        onStateChange('paused');
    }, [onStateChange]);
    
    const seek = useCallback((time) => {
        const audio = audioRef.current;
        if (isFinite(time) && audio.duration) {
            const newTime = Math.max(0, Math.min(time, audio.duration));
            isSeekingRef.current = true;
            audio.currentTime = newTime;
            onProgressUpdate(newTime);
            
            const onSeeked = () => {
                isSeekingRef.current = false;
                audio.removeEventListener('seeked', onSeeked);
            };
            audio.addEventListener('seeked', onSeeked);
        }
    }, [onProgressUpdate]);
    
    useEffect(() => {
        if (!audioContextRef.current || eqNodesRef.current.length === 0) return;
        
        gains.forEach((gainValue, index) => {
            if (eqNodesRef.current[index]) {
                eqNodesRef.current[index].gain.setTargetAtTime(
                    gainValue, 
                    audioContextRef.current.currentTime, 
                    0.05
                );
            }
        });
    }, [gains]);
    
    const applyVolume = useCallback((volume, isMuted) => {
        if (gainNodeRef.current && audioContextRef.current) {
            const targetVolume = isMuted ? 0 : volume;
            gainNodeRef.current.gain.setTargetAtTime(
                targetVolume, 
                audioContextRef.current.currentTime, 
                0.05
            );
        }
    }, []);
    
    useEffect(() => {
        return () => {
            cleanupHls();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
        };
    }, [cleanupHls]);
    
    return {
        loadTrack,
        play,
        pause,
        seek,
        applyVolume,
        analyser: analyserRef.current,
        audioElement: audioRef.current,
        
        
        addEventListener: (event, handler) => audioRef.current.addEventListener(event, handler),
        removeEventListener: (event, handler) => audioRef.current.removeEventListener(event, handler)
    };
};