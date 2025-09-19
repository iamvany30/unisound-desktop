
import { useState, useRef, useCallback, useEffect } from 'react';
import Hls from 'hls.js';
import api from '../services/api';

export const useAudioManager = () => {
    const [isPrimaryPlayerActive, setIsPrimaryPlayerActive] = useState(true);
    const [isCrossfading, setIsCrossfading] = useState(false);
    
    const primaryAudioRef = useRef(new Audio());
    const secondaryAudioRef = useRef(new Audio());
    const primaryHlsRef = useRef(null);
    const secondaryHlsRef = useRef(null);
    const crossfadeTimeoutRef = useRef(null);

    const getActiveAudio = useCallback(() => {
        return isPrimaryPlayerActive ? primaryAudioRef.current : secondaryAudioRef.current;
    }, [isPrimaryPlayerActive]);

    const getInactiveAudio = useCallback(() => {
        return isPrimaryPlayerActive ? secondaryAudioRef.current : primaryAudioRef.current;
    }, [isPrimaryPlayerActive]);

    const getActiveHlsRef = useCallback(() => {
        return isPrimaryPlayerActive ? primaryHlsRef : secondaryHlsRef;
    }, [isPrimaryPlayerActive]);

    const getInactiveHlsRef = useCallback(() => {
        return isPrimaryPlayerActive ? secondaryHlsRef : primaryHlsRef;
    }, [isPrimaryPlayerActive]);

    const getActiveAudioRef = useCallback(() => {
        return isPrimaryPlayerActive ? primaryAudioRef : secondaryAudioRef;
    }, [isPrimaryPlayerActive]);

    const getInactiveAudioRef = useCallback(() => {
        return isPrimaryPlayerActive ? secondaryAudioRef : primaryAudioRef;
    }, [isPrimaryPlayerActive]);

    
    const cleanupHls = useCallback((hlsRef) => {
        if (hlsRef.current) {
            try {
                hlsRef.current.destroy();
            } catch (error) {
                console.warn("Error destroying HLS instance:", error);
            }
            hlsRef.current = null;
        }
    }, []);

    
    const loadTrack = useCallback((track, audioRef, hlsRef, options = {}) => {
        return new Promise((resolve, reject) => {
            const { 
                autoplay = false, 
                volume = 1, 
                onLoadStart = () => {}, 
                onCanPlay = () => {}, 
                onError = () => {} 
            } = options;

            
            cleanupHls(hlsRef);
            
            const audio = audioRef.current;
            
            if (!track || (!track.hls_url && !track.filename)) {
                audio.src = "";
                resolve(false);
                return;
            }

            
            audio.volume = volume;
            audio.preload = 'metadata';

            const handleLoadedMetadata = () => {
                console.log(`[AudioManager] Track "${track.title}" metadata loaded`);
                onCanPlay();
                resolve(true);
            };

            const handleError = (event) => {
                const errorMsg = `Failed to load track "${track.title}": ${audio.error?.message || 'Unknown error'}`;
                console.error('[AudioManager]', errorMsg, event);
                onError(errorMsg);
                reject(new Error(errorMsg));
            };

            const handleLoadStart = () => {
                console.log(`[AudioManager] Started loading track "${track.title}"`);
                onLoadStart();
            };

            
            audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            audio.addEventListener('error', handleError, { once: true });
            audio.addEventListener('loadstart', handleLoadStart, { once: true });

            const { hls_url, filename } = track;
            
            
            if (hls_url && Hls.isSupported()) {
                const token = localStorage.getItem('unisound_token');
                const hls = new Hls({
                    debug: false,
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 30,
                    maxBufferLength: 20,
                    maxMaxBufferLength: 40,
                    xhrSetup: (xhr) => { 
                        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`); 
                    }
                });
                
                hlsRef.current = hls;
                
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('[HLS Error]', data);
                    
                    if (data.fatal) {
                        const errorMsg = `HLS error for "${track.title}": ${data.details}`;
                        switch(data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log('[HLS] Attempting to recover from network error');
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log('[HLS] Attempting to recover from media error');
                                hls.recoverMediaError();
                                break;
                            default:
                                onError(errorMsg);
                                reject(new Error(errorMsg));
                                break;
                        }
                    }
                });
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log(`[HLS] Manifest parsed for "${track.title}"`);
                });
                
                hls.loadSource(hls_url);
                hls.attachMedia(audio);
            } else if (filename) {
                
                audio.src = api.player.getStreamUrl(filename);
            } else {
                const errorMsg = `Track "${track.title}" has no playable source`;
                onError(errorMsg);
                reject(new Error(errorMsg));
                return;
            }
            
            
            audio.load();
        });
    }, [cleanupHls]);

    
    const switchActivePlayer = useCallback((crossfadeDuration = 1000) => {
        if (isCrossfading) return false;
        
        setIsCrossfading(true);
        
        const currentActive = getActiveAudio();
        const currentInactive = getInactiveAudio();
        
        
        const startVolume = currentActive.volume;
        const steps = 20;
        const stepDuration = crossfadeDuration / steps;
        let step = 0;
        
        const fadeInterval = setInterval(() => {
            step++;
            const progress = step / steps;
            
            
            currentActive.volume = startVolume * (1 - progress);
            
            
            currentInactive.volume = startVolume * progress;
            
            if (step >= steps) {
                clearInterval(fadeInterval);
                
                
                setIsPrimaryPlayerActive(prev => !prev);
                
                
                currentActive.pause();
                currentActive.volume = startVolume; 
                
                setIsCrossfading(false);
            }
        }, stepDuration);
        
        return true;
    }, [isCrossfading, getActiveAudio, getInactiveAudio]);

    
    const preloadNextTrack = useCallback(async (track) => {
        if (!track) return false;
        
        const inactiveAudioRef = getInactiveAudioRef();
        const inactiveHlsRef = getInactiveHlsRef();
        
        try {
            await loadTrack(track, inactiveAudioRef, inactiveHlsRef, {
                autoplay: false,
                volume: 0,
                onLoadStart: () => console.log(`[AudioManager] Preloading "${track.title}"`),
                onCanPlay: () => console.log(`[AudioManager] Preloaded "${track.title}" successfully`),
                onError: (error) => console.warn(`[AudioManager] Failed to preload "${track.title}":`, error)
            });
            return true;
        } catch (error) {
            console.error(`[AudioManager] Preload failed for "${track.title}":`, error);
            return false;
        }
    }, [loadTrack, getInactiveAudioRef, getInactiveHlsRef]);

    
    const switchToPreloadedTrack = useCallback(async (crossfadeDuration = 500) => {
        const inactiveAudio = getInactiveAudio();
        
        
        if (inactiveAudio.readyState < inactiveAudio.HAVE_ENOUGH_DATA) {
            console.warn('[AudioManager] Preloaded track is not ready for playback');
            return false;
        }
        
        
        try {
            await inactiveAudio.play();
            
            
            const success = switchActivePlayer(crossfadeDuration);
            
            if (success) {
                console.log('[AudioManager] Successfully switched to preloaded track');
            }
            
            return success;
        } catch (error) {
            console.error('[AudioManager] Failed to play preloaded track:', error);
            return false;
        }
    }, [getInactiveAudio, switchActivePlayer]);

    
    const stopAll = useCallback(() => {
        if (crossfadeTimeoutRef.current) {
            clearTimeout(crossfadeTimeoutRef.current);
            crossfadeTimeoutRef.current = null;
        }
        
        primaryAudioRef.current.pause();
        secondaryAudioRef.current.pause();
        primaryAudioRef.current.currentTime = 0;
        secondaryAudioRef.current.currentTime = 0;
        
        setIsCrossfading(false);
    }, []);

    
    const cleanup = useCallback(() => {
        stopAll();
        
        cleanupHls(primaryHlsRef);
        cleanupHls(secondaryHlsRef);
        
        
        primaryAudioRef.current.src = "";
        secondaryAudioRef.current.src = "";
        
        console.log('[AudioManager] All resources cleaned up');
    }, [stopAll, cleanupHls]);

    
    const syncVolume = useCallback((volume) => {
        if (!isCrossfading) {
            const activeAudio = getActiveAudio();
            activeAudio.volume = volume;
        }
    }, [isCrossfading, getActiveAudio]);

    
    const getPlayerInfo = useCallback(() => {
        const activeAudio = getActiveAudio();
        const inactiveAudio = getInactiveAudio();
        
        return {
            isPrimaryActive: isPrimaryPlayerActive,
            isCrossfading,
            active: {
                currentTime: activeAudio.currentTime,
                duration: activeAudio.duration,
                readyState: activeAudio.readyState,
                paused: activeAudio.paused,
                volume: activeAudio.volume,
                src: activeAudio.src
            },
            inactive: {
                currentTime: inactiveAudio.currentTime,
                duration: inactiveAudio.duration,
                readyState: inactiveAudio.readyState,
                paused: inactiveAudio.paused,
                volume: inactiveAudio.volume,
                src: inactiveAudio.src
            }
        };
    }, [isPrimaryPlayerActive, isCrossfading, getActiveAudio, getInactiveAudio]);

    
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        
        isPrimaryPlayerActive,
        isCrossfading,
        getActiveAudio,
        getInactiveAudio,
        getActiveAudioRef,
        getInactiveAudioRef,
        getActiveHlsRef,
        getInactiveHlsRef,
        
        
        loadTrack,
        switchActivePlayer,
        preloadNextTrack,
        switchToPreloadedTrack,
        stopAll,
        cleanup,
        syncVolume,
        
        
        getPlayerInfo,
        
        
        playerInfo: getPlayerInfo()
    };
};