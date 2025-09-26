import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import TrackCard from '../components/Track/TrackCard';
import { HardDrive, LoaderCircle, Music, Frown, Search, Filter, ArrowDownUp } from 'lucide-react';
import { useSimpleDebounce } from '../hooks/useDebounce';
import './LocalLibraryPage.css';

const INITIAL_LOAD_COUNT = 50;
const LOAD_MORE_COUNT = 25;

const LibraryStatus = ({ isLoading, error, tracks, filteredTracks, query, duration }) => {
    if (isLoading) {
        return (
            <div className="status-message loading-state">
                <LoaderCircle className="animate-spin" size={48} />
                <h2>Сканируем вашу медиатеку...</h2>
                <p>Это может занять некоторое время при первом запуске.</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="status-message error-state">
                <Frown size={48} />
                <h2>Ошибка сканирования</h2>
                <p>{error}</p>
            </div>
        );
    }
    if (tracks.length === 0) {
        return (
            <div className="status-message empty-state">
                <Music size={64} />
                <h2>Ваша медиатека пуста</h2>
                <p>В стандартной папке "Музыка" не найдено поддерживаемых аудиофайлов.</p>
                <p>Нажмите "Пересканировать", чтобы повторить попытку.</p>
            </div>
        );
    }
    if (filteredTracks.length === 0) {
        return (
            <div className="status-message empty-state">
                <Search size={64} />
                <h2>Ничего не найдено</h2>
                <p>Треки, соответствующие вашему запросу, отсутствуют.</p>
            </div>
        );
    }
    return null;
};


const LocalLibraryPage = () => {
    const player = usePlayer();
    
    const [allTracks, setAllTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [durationFilter, setDurationFilter] = useState(0);
    const [sortBy, setSortBy] = useState('title-asc');

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

    const filteredAndSortedTracks = useMemo(() => {
        const lowercasedQuery = debouncedSearchQuery.toLowerCase();
        
        let filtered = allTracks.filter(track => {
            const matchesSearch = lowercasedQuery
                ? track.title.toLowerCase().includes(lowercasedQuery) ||
                  track.artist.toLowerCase().includes(lowercasedQuery) ||
                  track.album.toLowerCase().includes(lowercasedQuery)
                : true;
            
            const matchesDuration = debouncedDurationFilter > 0
                ? track.duration >= debouncedDurationFilter
                : true;

            return matchesSearch && matchesDuration;
        });

        switch (sortBy) {
            case 'title-asc':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'artist-asc':
                filtered.sort((a, b) => a.artist.localeCompare(b.artist));
                break;
            case 'duration-desc':
                filtered.sort((a, b) => b.duration - a.duration);
                break;
            case 'duration-asc':
                filtered.sort((a, b) => a.duration - a.duration);
                break;
            default:
                break;
        }

        return filtered;
    }, [allTracks, debouncedSearchQuery, debouncedDurationFilter, sortBy]);
    
    useEffect(() => {
        setVisibleCount(INITIAL_LOAD_COUNT);
    }, [filteredAndSortedTracks]);

    const handlePlayTrack = (track) => {
        player.playTrack(track, filteredAndSortedTracks);
    };

    const tracksToRender = filteredAndSortedTracks.slice(0, visibleCount);
    const hasMore = visibleCount < filteredAndSortedTracks.length;

    return (
        <div className="home-page-content library-page">
            <section>
                <header className="library-header">
                    <div>
                        <h2 className="section-title">Ваша оффлайн-медиатека</h2>
                        <p className="section-subtitle">
                            Найдено {filteredAndSortedTracks.length} треков из {allTracks.length}
                        </p>
                    </div>
                    <button onClick={handleScanLibrary} className="rescan-button" disabled={isLoading}>
                        <HardDrive size={18} />
                        <span>{isLoading ? 'Сканирование...' : 'Пересканировать'}</span>
                    </button>
                </header>
                
                <div className="library-filters">
                    <div className="filter-item search-filter">
                        <Search size={20} className="filter-icon" />
                        <input
                            type="text"
                            placeholder="Поиск по названию, исполнителю, альбому..."
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
                     <div className="filter-item sort-filter">
                        <ArrowDownUp size={20} className="filter-icon" />
                        <label htmlFor="sort">Сортировка:</label>
                        <select 
                            id="sort"
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)} 
                            className="filter-input sort-select"
                        >
                            <option value="title-asc">По названию (А-Я)</option>
                            <option value="artist-asc">По исполнителю (А-Я)</option>
                            <option value="duration-desc">По длительности (сначала долгие)</option>
                            <option value="duration-asc">По длительности (сначала короткие)</option>
                        </select>
                    </div>
                </div>
                
                <div className="library-content">
                    <LibraryStatus 
                        isLoading={isLoading} 
                        error={error}
                        tracks={allTracks}
                        filteredTracks={filteredAndSortedTracks}
                    />
                    
                    {tracksToRender.length > 0 && (
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
                    )}
                </div>
            </section>
        </div>
    );
};

export default LocalLibraryPage;