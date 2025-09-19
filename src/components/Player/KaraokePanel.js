
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { LoaderCircle, Mic2 } from 'lucide-react';
import './KaraokePanel.css';

const KaraokePanel = React.memo(({ track, progress, isPlaying, isVisible, onLineClick, isStandaloneWindow = false }) => {
    
    const [lyricsData, setLyricsData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    
    
    const panelRef = useRef(null);
    const lyricLinesRef = useRef(new Map());
    const scrollTimeoutRef = useRef(null);
    const lastProgressRef = useRef(0);

    
    const isClickable = useMemo(() => typeof onLineClick === 'function', [onLineClick]);
    
    
    const debouncedProgress = useMemo(() => {
        const threshold = 0.5; 
        if (Math.abs(progress - lastProgressRef.current) >= threshold) {
            lastProgressRef.current = progress;
            return progress;
        }
        return lastProgressRef.current;
    }, [progress]);


    
    useEffect(() => {
        let isCancelled = false;
        
        const fetchLyrics = async () => {
            if (!track?.uuid || !isVisible) return;
            
            setIsLoading(true);
            setError(null);
            
            try {
                const lrc = await api.karaoke.getLrc(track.uuid);
                if (!isCancelled) {
                    if (lrc && lrc.length > 0) {
                        setLyricsData(lrc);
                    } else {
                        setError("Текст для этого трека не найден.");
                    }
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error("Failed to fetch lyrics:", err);
                    setError("Не удалось загрузить текст песни.");
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        if (isVisible) {
            
            setLyricsData(null);
            fetchLyrics();
        }
        
        return () => {
            isCancelled = true;
        };
    }, [isVisible, track?.uuid]); 

    
    useEffect(() => {
        if (!isVisible) {
            setLyricsData(null);
            setError(null);
            setActiveLineIndex(-1);
            lyricLinesRef.current.clear();
        }
    }, [isVisible]);

    
    useEffect(() => {
        if (!lyricsData || !isPlaying) return;
        
        
        let newActiveIndex = -1;
        for (let i = lyricsData.length - 1; i >= 0; i--) {
            if (lyricsData[i].time <= debouncedProgress) {
                newActiveIndex = i;
                break;
            }
        }
        
        if (newActiveIndex !== activeLineIndex) {
            setActiveLineIndex(newActiveIndex);
        }
    }, [debouncedProgress, lyricsData, isPlaying, activeLineIndex]);

    
    useEffect(() => {
        if (activeLineIndex < 0) return;
        
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
            const lineRef = lyricLinesRef.current.get(activeLineIndex);
            if (lineRef) {
                lineRef.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }, 100); 
        
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [activeLineIndex]);

    
    const renderLyricsLines = useMemo(() => {
        if (!lyricsData) return null;
        
        return lyricsData.map((line, index) => (
            <p
                key={`${line.time}-${index}`}
                ref={el => {
                    if (el) lyricLinesRef.current.set(index, el);
                    else lyricLinesRef.current.delete(index);
                }}
                className={`lyrics-line ${index === activeLineIndex ? 'active' : ''} ${isClickable ? 'clickable' : ''}`}
                onClick={isClickable ? () => onLineClick(line.time) : undefined}
                title={isClickable ? "Перейти к этому моменту" : ""}
                role={isClickable ? "button" : "paragraph"}
                tabIndex={isClickable ? 0 : -1}
                onKeyDown={isClickable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onLineClick(line.time);
                    }
                } : undefined}
            >
                {line.text || '♪'}
            </p>
        ));
    }, [lyricsData, activeLineIndex, isClickable, onLineClick]);

    
    const panelClasses = [
        'karaoke-display-area',
        (isVisible || isStandaloneWindow) && 'visible',
        isStandaloneWindow && 'standalone' 
    ].filter(Boolean).join(' ');

    return (
        <div 
            ref={panelRef}
            className={panelClasses}
        >
            <div className="lyrics-header" style={{ WebkitAppRegion: 'drag' }}>
                <Mic2 size={18} />
                <h3>Текст песни</h3>
            </div>
            
            <div className="lyrics-content-area">
                {isLoading && (
                    <div className="lyrics-status">
                        <LoaderCircle size={28} className="animate-spin" />
                        <span>Загрузка...</span>
                    </div>
                )}
                
                {error && (
                    <div className="lyrics-status error">
                        {error}
                    </div>
                )}
                
                {lyricsData && (
                    <div className="lyrics-lines">
                        {renderLyricsLines}
                    </div>
                )}
            </div>
        </div>
    );
});

KaraokePanel.displayName = 'KaraokePanel';
export default KaraokePanel;