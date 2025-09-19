import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music, User, ListMusic, Search, TrendingUp } from 'lucide-react';



const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
        regex.test(part) ? (
            <mark key={index} className="search-highlight">
                {part}
            </mark>
        ) : part
    );
};


const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};



const ResultItem = React.memo(({ 
    to, 
    icon: Icon, 
    primaryText, 
    secondaryText, 
    onClick, 
    query,
    type,
    metadata 
}) => {
    const handleClick = useCallback((e) => {
        
        if (window.gtag) {
            window.gtag('event', 'search_result_click', {
                search_term: query,
                result_type: type,
                result_position: metadata?.position
            });
        }
        
        onClick?.(e);
    }, [onClick, query, type, metadata]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e);
        }
    }, [handleClick]);

    return (
        <li className="search-result-item-wrapper">
            <Link 
                to={to} 
                className="search-result-item" 
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                aria-label={`${type}: ${primaryText}${secondaryText ? ` by ${secondaryText}` : ''}`}
            >
                <div className="result-icon" aria-hidden="true">
                    <Icon size={20} />
                </div>
                <div className="result-text">
                    <span className="primary">
                        {highlightText(truncateText(primaryText), query)}
                    </span>
                    {secondaryText && (
                        <span className="secondary">
                            {highlightText(truncateText(secondaryText, 30), query)}
                        </span>
                    )}
                    {metadata?.duration && (
                        <span className="metadata">
                            {metadata.duration}
                        </span>
                    )}
                </div>
                {metadata?.isPopular && (
                    <div className="popularity-badge" aria-label="Popular">
                        <TrendingUp size={14} />
                    </div>
                )}
            </Link>
        </li>
    );
});
ResultItem.displayName = 'ResultItem';

const ResultsSection = React.memo(({ title, items, children, isLoading = false }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="search-results-section" role="group" aria-labelledby={`section-${title.toLowerCase()}`}>
            <h3 id={`section-${title.toLowerCase()}`} className="section-title">
                {title}
                <span className="results-count" aria-label={`${items.length} results`}>
                    {items.length}
                </span>
            </h3>
            <ul className="results-list" role="list">
                {children}
            </ul>
            {items.length >= 5 && (
                <div className="view-all-link">
                    <Link to={`/search?q=${encodeURIComponent(title.toLowerCase())}`}>
                        View all {title.toLowerCase()}
                    </Link>
                </div>
            )}
        </div>
    );
});
ResultsSection.displayName = 'ResultsSection';

const EmptyState = React.memo(({ query }) => {
    const { t } = useTranslation();
    
    return (
        <div className="search-empty-state" role="status">
            <div className="empty-icon">
                <Search size={32} />
            </div>
            <p className="empty-text">
                {t('search.noResults')}
            </p>
            {query && (
                <p className="empty-query">
                    {t('search.tryDifferentKeywords')}
                </p>
            )}
        </div>
    );
});
EmptyState.displayName = 'EmptyState';


const SearchResultsDropdown = ({ results, onClose, query, isLoading = false }) => {
    const { t } = useTranslation();
    const dropdownRef = useRef(null);
    const [selectedIndex, setSelectedIndex] = React.useState(-1);

    
    const totalResults = useMemo(() => {
        if (!results) return 0;
        return (results.tracks?.length || 0) + 
               (results.users?.length || 0) + 
               (results.playlists?.length || 0);
    }, [results]);

    
    const hasResults = useMemo(() => {
        return results && totalResults > 0;
    }, [results, totalResults]);

    
    const allItems = useMemo(() => {
        if (!results) return [];
        
        const items = [];
        
        results.tracks?.forEach((track, index) => 
            items.push({ type: 'track', data: track, index })
        );
        results.users?.forEach((user, index) => 
            items.push({ type: 'user', data: user, index })
        );
        results.playlists?.forEach((playlist, index) => 
            items.push({ type: 'playlist', data: playlist, index })
        );
        
        return items;
    }, [results]);

    
    const handleKeyDown = useCallback((e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < allItems.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
                break;
            case 'Enter':
                if (selectedIndex >= 0 && allItems[selectedIndex]) {
                    e.preventDefault();
                    const item = allItems[selectedIndex];
                    
                    const linkElement = dropdownRef.current?.querySelector(
                        `[data-index="${selectedIndex}"] a`
                    );
                    linkElement?.click();
                }
                break;
            case 'Escape':
                onClose?.();
                break;
        }
    }, [selectedIndex, allItems, onClose]);

    
    useEffect(() => {
        if (hasResults || isLoading) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleKeyDown, hasResults, isLoading]);

    
    useEffect(() => {
        if (selectedIndex >= 0) {
            const selectedElement = dropdownRef.current?.querySelector(
                `[data-index="${selectedIndex}"]`
            );
            selectedElement?.scrollIntoView({ 
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

    if (isLoading) {
        return (
            <div className="search-results-dropdown loading" role="status" aria-live="polite">
                <div className="loading-indicator">
                    <div className="loading-spinner" />
                    <span>{t('search.searching')}</span>
                </div>
            </div>
        );
    }

    if (!hasResults) {
        return (
            <div className="search-results-dropdown empty" role="status" aria-live="polite">
                <EmptyState query={query} />
            </div>
        );
    }

    return (
        <div 
            className="search-results-dropdown"
            ref={dropdownRef}
            role="listbox"
            aria-live="polite"
            aria-label={t('search.resultsFor', { query })}
        >
            <div className="search-results-header">
                <span className="results-summary">
                    {t('search.foundResults', { count: totalResults, query })}
                </span>
            </div>

            <div className="search-results-content">
                {results.tracks && results.tracks.length > 0 && (
                    <ResultsSection title={t('search.tracks')} items={results.tracks}>
                        {results.tracks.slice(0, 5).map((track, index) => (
                            <div key={`track-${track.uuid}`} data-index={index}>
                                <ResultItem
                                    to={`/tracks/${track.uuid}`}
                                    icon={Music}
                                    primaryText={track.title}
                                    secondaryText={track.artist}
                                    onClick={onClose}
                                    query={query}
                                    type="track"
                                    metadata={{
                                        position: index,
                                        duration: track.duration_formatted,
                                        isPopular: track.play_count > 10000
                                    }}
                                />
                            </div>
                        ))}
                    </ResultsSection>
                )}

                {results.users && results.users.length > 0 && (
                    <ResultsSection title={t('search.users')} items={results.users}>
                        {results.users.slice(0, 5).map((user, index) => {
                            const globalIndex = (results.tracks?.length || 0) + index;
                            return (
                                <div key={`user-${user.id}`} data-index={globalIndex}>
                                    <ResultItem
                                        to={`/users/${user.username}`}
                                        icon={User}
                                        primaryText={user.username}
                                        secondaryText={user.display_name}
                                        onClick={onClose}
                                        query={query}
                                        type="user"
                                        metadata={{
                                            position: globalIndex,
                                            isPopular: user.followers_count > 1000
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </ResultsSection>
                )}

                {results.playlists && results.playlists.length > 0 && (
                    <ResultsSection title={t('search.playlists')} items={results.playlists}>
                        {results.playlists.slice(0, 5).map((playlist, index) => {
                            const globalIndex = (results.tracks?.length || 0) + 
                                               (results.users?.length || 0) + index;
                            return (
                                <div key={`playlist-${playlist.id}`} data-index={globalIndex}>
                                    <ResultItem
                                        to={`/playlists/${playlist.id}`}
                                        icon={ListMusic}
                                        primaryText={playlist.name}
                                        secondaryText={t('search.by', { user: playlist.owner_username })}
                                        onClick={onClose}
                                        query={query}
                                        type="playlist"
                                        metadata={{
                                            position: globalIndex,
                                            isPopular: playlist.tracks_count > 50
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </ResultsSection>
                )}
            </div>

            {totalResults > 15 && (
                <div className="search-results-footer">
                    <Link 
                        to={`/search?q=${encodeURIComponent(query)}`} 
                        className="view-all-results"
                        onClick={onClose}
                    >
                        {t('search.viewAllResults', { count: totalResults })}
                    </Link>
                </div>
            )}
        </div>
    );
};

export default SearchResultsDropdown;