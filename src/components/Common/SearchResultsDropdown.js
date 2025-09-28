import React from 'react';
import { Link } from 'react-router-dom';
import { Music, User, ListMusic } from 'lucide-react';
import './SearchComponent.css'; 

const ResultItem = ({ to, icon: Icon, title, subtitle, onClick }) => (
    <li>
        <Link to={to} className="result-item" onClick={onClick}>
            <div className="result-icon"><Icon size={20} /></div>
            <div className="result-info">
                <span className="result-title">{title}</span>
                <span className="result-subtitle">{subtitle}</span>
            </div>
        </Link>
    </li>
);

const SearchResultsDropdown = ({ results, isLoading, error, onClose }) => {
    if (isLoading) return null; 

    const hasResults = results && (results.tracks?.length > 0 || results.artists?.length > 0 || results.playlists?.length > 0);

    return (
        <div className="search-results-dropdown glass glass--soft">
            {error && <div className="results-status error">{error}</div>}
            
            {!error && !hasResults && (
                 <div className="results-status">Ничего не найдено.</div>
            )}

            {hasResults && (
                <>
                    {results.tracks?.length > 0 && (
                        <div className="results-section">
                            <h4 className="section-title">Треки</h4>
                            <ul className="results-list">
                                {results.tracks.map(track => (
                                    <ResultItem key={track.uuid} to={`/tracks/${track.uuid}`} icon={Music} title={track.title} subtitle={track.artist} onClick={onClose} />
                                ))}
                            </ul>
                        </div>
                    )}
                    {results.artists?.length > 0 && (
                        <div className="results-section">
                            <h4 className="section-title">Исполнители</h4>
                            <ul className="results-list">
                                {results.artists.map(artist => (
                                     <ResultItem key={artist.id || artist.name} to={`/artists/${encodeURIComponent(artist.name)}`} icon={User} title={artist.name} subtitle="Исполнитель" onClick={onClose} />
                                ))}
                            </ul>
                        </div>
                    )}
                    {results.playlists?.length > 0 && (
                        <div className="results-section">
                            <h4 className="section-title">Плейлисты</h4>
                            <ul className="results-list">
                                {results.playlists.map(playlist => (
                                    <ResultItem key={playlist.id} to={`/playlists/${playlist.id}`} icon={ListMusic} title={playlist.name} subtitle={`от ${playlist.owner_username}`} onClick={onClose} />
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SearchResultsDropdown;