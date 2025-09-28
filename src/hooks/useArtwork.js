import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const artworkCache = new Map();

export const useArtwork = (track) => {
    const [artworkSrc, setArtworkSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const trackUuid = track?.uuid;

    useEffect(() => {
        
        if (!trackUuid) {
            setIsLoading(false);
            setArtworkSrc(null);
            setError(null);
            return;
        }

        
        if (track.isLocal) {
            setArtworkSrc(track.artwork);
            setIsLoading(false);
            setError(null);
            return;
        }
        
        
        if (artworkCache.has(trackUuid)) {
            const cached = artworkCache.get(trackUuid);
            setArtworkSrc(cached.src);
            setError(cached.error);
            setIsLoading(false);
            return;
        }

        
        const abortController = new AbortController();
        const { signal } = abortController;

        const fetchArtwork = async () => {
            setIsLoading(true);
            setError(null);
            setArtworkSrc(null);

            const token = localStorage.getItem('unisound_token');
            if (!token) {
                setError(401); 
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/media/artwork/${trackUuid}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal, 
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);

                if (!signal.aborted) {
                    setArtworkSrc(objectURL);
                    artworkCache.set(trackUuid, { src: objectURL, error: null });
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Failed to fetch artwork:', err);
                    const status = err.message.includes('status:') ? parseInt(err.message.split('status: ')[1]) : 503;
                    setError(status);
                    artworkCache.set(trackUuid, { src: null, error: status });
                }
            } finally {
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchArtwork();

        
        return () => {
            abortController.abort();
        };
    }, [trackUuid, track?.isLocal, track?.artwork]); 

    return { artworkSrc, isLoading, error };
};

export const clearArtworkCache = () => {
    for (const [, cached] of artworkCache) {
        if (cached.src && cached.src.startsWith('blob:')) {
            URL.revokeObjectURL(cached.src);
        }
    }
    artworkCache.clear();
};