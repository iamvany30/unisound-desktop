
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import TrackCard from '../components/Track/TrackCard';
import { HardDrive, LoaderCircle, Music, Frown, Search, Filter } from 'lucide-react';
import { useSimpleDebounce } from '../hooks/useDebounce';
import './LocalLibraryPage.css';

const INITIAL_LOAD_COUNT = 50;
const LOAD_MORE_COUNT = 25;

const LocalLibraryPage = () => {
    const player = usePlayer();
    
    const [allTracks, setAllTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [durationFilter, setDurationFilter] = useState(0);
    const debouncedSearchQuery = useSimpleDebounce(searchQuery, 350); 
    const debouncedDurationFilter = useSimpleDebounce(durationFilter, 350); 

    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);
    
    const observer = useRef();
    const loaderRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setVisibleCount(prev => prev + LOAD_MORE_COUNT);
            }
        });
        
        if (node) observer.current.observe(node);
    }, [isLoading]);


    const handleScanLibrary = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const tracks = await window.electronAPI.scanMusicLibrary();
            setAllTracks(tracks);
            if (tracks.length === 0) {
                setError('В стандартной папке "Музыка" не найдено поддерживаемых аудиофайлов.');
            }
        } catch (err) {
            console.error("Ошибка сканирования медиатеки:", err);
            setError('Произошла ошибка при сканировании файлов.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        handleScanLibrary();
    }, [handleScanLibrary]);


    const filteredTracks = useMemo(() => {
        const lowercasedQuery = debouncedSearchQuery.toLowerCase();
        
        return allTracks.filter(track => {
            const matchesSearch = lowercasedQuery.length > 0
                ? track.title.toLowerCase().includes(lowercasedQuery) ||
                  track.artist.toLowerCase().includes(lowercasedQuery)
                : true;
            
            const matchesDuration = debouncedDurationFilter > 0
                ? track.duration >= debouncedDurationFilter
                : true;

            return matchesSearch && matchesDuration;
        });
    }, [allTracks, debouncedSearchQuery, debouncedDurationFilter]);
    
    useEffect(() => {
        setVisibleCount(INITIAL_LOAD_COUNT);
    }, [filteredTracks]);


    const handlePlayTrack = (track) => {
        player.playTrack(track, filteredTracks);
    };


    const renderContent = () => {
        if (isLoading) {
            return <div className="status-message"><LoaderCircle className="animate-spin" /> <span>Сканируем вашу папку "Музыка"...</span></div>;
        }
        if (error) {
            return <div className="status-message error" style={{ flexDirection: 'column', gap: 'var(--spacing-md)' }}><Frown size={48} /><p>{error}</p></div>;
        }
        if (filteredTracks.length === 0) {
            return (
                <div className="status-message">
                    <Music size={48} />
                    <p>{searchQuery || durationFilter > 0 ? "Треки не найдены по вашему запросу" : "Ваша медиатека пуста"}</p>
                </div>
            );
        }
        
        const tracksToRender = filteredTracks.slice(0, visibleCount);
        const hasMore = visibleCount < filteredTracks.length;

        return (
            <>
                <div className="track-grid">
                    {tracksToRender.map(track => (
                        <TrackCard
                            key={track.uuid}
                            track={track}
                            isPlaying={player.currentTrack?.uuid === track.uuid && player.isPlaying}
                            onPlay={() => handlePlayTrack(track)}
                        />
                    ))}
                </div>
                <div ref={hasMore ? loaderRef : null} className="library-loader">
                    {hasMore && <LoaderCircle className="animate-spin" />}
                </div>
            </>
        );
    };

    return (
        <div className="home-page-content">
            <section>
                <div className="library-header">
                    <h2 className="section-title">Локальная медиатека ({filteredTracks.length} / {allTracks.length})</h2>
                    <button onClick={handleScanLibrary} className="rescan-button" disabled={isLoading}>
                        <HardDrive size={18} />
                        <span>{isLoading ? 'Сканирование...' : 'Пересканировать'}</span>
                    </button>
                </div>
                
                <div className="library-filters">
                    <div className="filter-item search-filter">
                        <Search size={20} className="filter-icon" />
                        <input
                            type="text"
                            placeholder="Поиск по названию или исполнителю..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="filter-input"
                        />
                    </div>
                    <div className="filter-item duration-filter">
                        <Filter size={20} className="filter-icon" />
                        <label htmlFor="duration">Длительность от (сек):</label>
                        <input
                            id="duration"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={durationFilter || ''}
                            onChange={(e) => setDurationFilter(Number(e.target.value))}
                            className="filter-input duration-input"
                        />
                    </div>
                </div>
                
                {renderContent()}
            </section>
        </div>
    );
};

export default LocalLibraryPage;