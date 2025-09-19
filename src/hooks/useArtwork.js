import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';


const artworkCache = new Map();

export const useArtwork = (trackUuid) => {
    const [artworkSrc, setArtworkSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState(null);
    
    
    const currentRequestRef = useRef(null);

    useEffect(() => {
        if (!trackUuid) {
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
        let objectURL = null;
        const requestId = Symbol('request'); 
        currentRequestRef.current = requestId;

        const fetchArtwork = async () => {
            
            if (currentRequestRef.current !== requestId) return;
            
            setIsLoading(true);
            setErrorStatus(null);
            setArtworkSrc(null);
            
            const token = localStorage.getItem('unisound_token');
            if (!token) {
                if (isMounted && currentRequestRef.current === requestId) {
                    const error = 401;
                    setErrorStatus(error);
                    setIsLoading(false);
                    
                    artworkCache.set(trackUuid, { src: null, error });
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
                    
                    if (!isMounted || currentRequestRef.current !== requestId) {
                        
                        URL.revokeObjectURL(URL.createObjectURL(blob));
                        return;
                    }
                    
                    objectURL = URL.createObjectURL(blob);
                    setArtworkSrc(objectURL);
                    
                    
                    artworkCache.set(trackUuid, { src: objectURL, error: null });
                } else {
                    const error = response.status;
                    setErrorStatus(error);
                    
                    
                    artworkCache.set(trackUuid, { src: null, error });
                }
            } catch (err) {
                if (isMounted && currentRequestRef.current === requestId) {
                    const error = 503;
                    setErrorStatus(error);
                    
                    
                    artworkCache.set(trackUuid, { src: null, error });
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
            currentRequestRef.current = null;
            
            
            if (objectURL && !artworkCache.has(trackUuid)) {
                URL.revokeObjectURL(objectURL);
            }
        };
    }, [trackUuid]);

    return { artworkSrc, isLoading, errorStatus };
};


export const clearArtworkCache = () => {
    
    for (const [, cached] of artworkCache) {
        if (cached.src) {
            URL.revokeObjectURL(cached.src);
        }
    }
    artworkCache.clear();
};