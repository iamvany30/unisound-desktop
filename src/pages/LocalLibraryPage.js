import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import TrackCard from '../components/Track/TrackCard';
import { HardDrive, LoaderCircle, Music, Frown, Search, Filter, ArrowDownUp, X } from 'lucide-react';
import { useSimpleDebounce } from '../hooks/useDebounce';
import './LocalLibraryPage.css';

const INITIAL_LOAD_COUNT = 50;
const LOAD_MORE_COUNT = 25;


const LibraryFilters = ({ filters, setFilters, disabled }) => {
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const resetFilters = () => {
        setFilters({ searchQuery: '', durationFilter: 0, sortBy: 'title-asc' });
    };
    const hasActiveFilters = filters.searchQuery || filters.durationFilter > 0;
    return (
        <div className="library-filters glass glass--soft">
            <div className="filter-item search-filter">
                <Search size={20} className="filter-icon" />
                <input type="text" placeholder="Поиск по названию, исполнителю, альбому..." value={filters.searchQuery} onChange={(e) => handleFilterChange('searchQuery', e.target.value)} className="filter-input" disabled={disabled}/>
            </div>
            <div className="filter-item duration-filter">
                <Filter size={20} className="filter-icon" />
                <input type="number" min="0" placeholder="Длительность от (сек)" value={filters.durationFilter || ''} onChange={(e) => handleFilterChange('durationFilter', Number(e.target.value))} className="filter-input duration-input" disabled={disabled}/>
            </div>
            <div className="filter-item sort-filter">
                <ArrowDownUp size={20} className="filter-icon" />
                <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} className="filter-input sort-select" disabled={disabled}>
                    <option value="title-asc">По названию (А-Я)</option>
                    <option value="artist-asc">По исполнителю (А-Я)</option>
                    <option value="duration-desc">По длительности (сначала долгие)</option>
                    <option value="duration-asc">По длительности (сначала короткие)</option>
                </select>
            </div>
            {hasActiveFilters && (<button onClick={resetFilters} className="clear-filters-btn" title="Сбросить фильтры"><X size={16} /></button>)}
        </div>
    );
};


const LibraryStatus = ({ status, error, tracksCount, filteredTracksCount }) => {
    if (status === 'searching' && tracksCount === 0) {
        return (
            <div className="library-status-indicator">
                <LoaderCircle size={48} className="animate-spin" />
                <h3 className="status-title">Идет сканирование...</h3>
                <p className="status-subtitle">Ищем вашу музыку. Это может занять некоторое время при первом запуске.</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="library-status-indicator">
                <Frown size={48} />
                <h3 className="status-title">Ошибка сканирования</h3>
                <p className="status-subtitle">{error}</p>
            </div>
        );
    }
    if (tracksCount > 0 && filteredTracksCount === 0) {
        return (
             <div className="library-status-indicator">
                <Search size={48} />
                <h3 className="status-title">Ничего не найдено</h3>
                <p className="status-subtitle">Попробуйте изменить фильтры или сбросить их.</p>
            </div>
        )
    }
    if (tracksCount === 0 && status === 'done') {
        return (
            <div className="library-status-indicator">
                <Music size={48} />
                <h3 className="status-title">Медиатека пуста</h3>
                <p className="status-subtitle">Нажмите "Пересканировать", чтобы найти музыку на вашем компьютере.</p>
            </div>
        );
    }
    return null;
};


const LocalLibraryPage = () => {
    const player = usePlayer();
    
    
    const [allTracks, setAllTracks] = useState([]);
    const [scanStatus, setScanStatus] = useState('idle'); 
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ searchQuery: '', durationFilter: 0, sortBy: 'title-asc' });

    const debouncedQuery = useSimpleDebounce(filters.searchQuery, 350); 
    const debouncedDuration = useSimpleDebounce(filters.durationFilter, 350); 

    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);
    
    const observer = useRef();
    const isLoading = scanStatus === 'searching' || scanStatus === 'processing';
    
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


    
    useEffect(() => {
        setError(null);
        setScanStatus('searching');

        
        window.electronAPI.getInitialTracks()
            .then(cachedTracks => {
                setAllTracks(cachedTracks);
                
                window.electronAPI.startSmartScan();
            })
            .catch(err => {
                console.error("Ошибка при загрузке треков из БД:", err);
                setError('Не удалось загрузить медиатеку из кэша.');
                setScanStatus('done'); 
            });

        
        const unsubStatus = window.electronAPI.onScanStatus(status => setScanStatus(status));
        
        const unsubAdded = window.electronAPI.onTracksAdded(newTracks => {
            setAllTracks(current => {
                const updatedTracks = new Map(current.map(t => [t.uuid, t]));
                newTracks.forEach(t => updatedTracks.set(t.uuid, t));
                return Array.from(updatedTracks.values());
            });
        });

        const unsubRemoved = window.electronAPI.onTracksRemoved(removedPaths => {
            setAllTracks(current => current.filter(t => !removedPaths.includes(t.originalPath)));
        });

        
        return () => {
            unsubStatus();
            unsubAdded();
            unsubRemoved();
        };
    }, []); 

    
    const handleForceRescan = useCallback(() => {
        if (isLoading) return;
        setError(null);
        setScanStatus('searching');
        window.electronAPI.forceRescan();
    }, [isLoading]);

    
    const filteredAndSortedTracks = useMemo(() => {
        let filtered = allTracks.filter(track => {
            const lowercasedQuery = debouncedQuery.toLowerCase();
            const matchesSearch = lowercasedQuery
                ? track.title.toLowerCase().includes(lowercasedQuery) ||
                  track.artist.toLowerCase().includes(lowercasedQuery) ||
                  track.album.toLowerCase().includes(lowercasedQuery)
                : true;
            const matchesDuration = debouncedDuration > 0 ? track.duration >= debouncedDuration : true;
            return matchesSearch && matchesDuration;
        });

        switch (filters.sortBy) {
             case 'title-asc': filtered.sort((a, b) => a.title.localeCompare(b.title)); break;
             case 'artist-asc': filtered.sort((a, b) => a.artist.localeCompare(b.artist)); break;
             case 'duration-desc': filtered.sort((a, b) => b.duration - a.duration); break;
             case 'duration-asc': filtered.sort((a, b) => a.duration - b.duration); break;
             default: break;
        }
        return filtered;
    }, [allTracks, debouncedQuery, debouncedDuration, filters.sortBy]);
    
    useEffect(() => {
        setVisibleCount(INITIAL_LOAD_COUNT);
    }, [filteredAndSortedTracks]);

    const handlePlayTrack = (track) => {
        player.playTrack(track, filteredAndSortedTracks);
    };

    const tracksToRender = filteredAndSortedTracks.slice(0, visibleCount);
    const hasMore = visibleCount < filteredAndSortedTracks.length;

    return (
        <div className="home-page-content library-page fully-rounded">
            <section>
                <header className="library-header">
                    <div>
                        <h2 className="section-title">Ваша оффлайн-медиатека</h2>
                        <p className="section-subtitle">
                            Найдено {filteredAndSortedTracks.length.toLocaleString()} треков
                        </p>
                    </div>
                    <button onClick={handleForceRescan} className="rescan-button" disabled={isLoading}>
                        {isLoading ? ( <LoaderCircle size={18} className="animate-spin" /> ) : ( <HardDrive size={18} /> )}
                        <span>{isLoading ? 'Сканирование...' : 'Пересканировать'}</span>
                    </button>
                </header>
                
                <LibraryFilters filters={filters} setFilters={setFilters} disabled={isLoading || allTracks.length === 0} />
                
                <div className="library-content">
                    <LibraryStatus 
                        status={scanStatus}
                        error={error}
                        tracksCount={allTracks.length}
                        filteredTracksCount={filteredAndSortedTracks.length}
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