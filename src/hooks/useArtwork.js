import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

const artworkCache = new Map();


export const useArtwork = (track) => {
    const [artworkSrc, setArtworkSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState(null);
    
    const currentRequestRef = useRef(null);
    const trackUuid = track?.uuid;

    useEffect(() => {
        setIsLoading(true);
        setErrorStatus(null);
        setArtworkSrc(null);

        if (!trackUuid) {
            setIsLoading(false);
            return;
        }

        if (track.isLocal) {
            setArtworkSrc(track.artwork);
            setIsLoading(false);
            return;
        }

        if (artworkCache.has(trackUuid)) {
            const cached = artworkCache.get(trackUuid);
            setArtworkSrc(cached.src);
            setErrorStatus(cached.error);
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        const requestId = Symbol('request');
        currentRequestRef.current = requestId;

        const fetchArtwork = async () => {
            const token = localStorage.getItem('unisound_token');
            if (!token) {
                if (isMounted && currentRequestRef.current === requestId) {
                    setErrorStatus(401);
                    setIsLoading(false);
                }
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/media/artwork/${trackUuid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!isMounted || currentRequestRef.current !== requestId) return;

                if (response.ok) {
                    const blob = await response.blob();
                    const objectURL = URL.createObjectURL(blob);
                    setArtworkSrc(objectURL);
                    artworkCache.set(trackUuid, { src: objectURL, error: null });
                } else {
                    setErrorStatus(response.status);
                    artworkCache.set(trackUuid, { src: null, error: response.status });
                }
            } catch (err) {
                if (isMounted && currentRequestRef.current === requestId) {
                    setErrorStatus(503); 
                    artworkCache.set(trackUuid, { src: null, error: 503 });
                }
            } finally {
                if (isMounted && currentRequestRef.current === requestId) {
                    setIsLoading(false);
                }
            }
        };

        fetchArtwork();

        return () => {
            isMounted = false;
        };
    }, [trackUuid, track]); 

    return { artworkSrc, isLoading, errorStatus };
};


export const clearArtworkCache = () => {
    for (const [, cached] of artworkCache) {
        if (cached.src && cached.src.startsWith('blob:')) {
            URL.revokeObjectURL(cached.src);
        }
    }
    artworkCache.clear();
};