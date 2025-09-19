import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { usePlayer } from '../hooks/usePlayer';
import { useArtwork } from '../hooks/useArtwork';
import { Music, Play, LoaderCircle, UserPlus, Check, Info, TrendingUp, Library } from 'lucide-react';
import './ArtistPage.css';

const SpotifyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.183 14.223a.498.498 0 01-.62.092c-2.06-1.263-4.663-1.54-7.792-.84a.5.5 0 01-.578-.398.5.5 0 01.398-.578c3.428-.758 6.29- .43 8.615.97a.499.499 0 01.092.62zm.893-2.316a.624.624 0 01-.774.115c-2.338-1.428-5.833-1.84-8.99-1.003a.625.625 0 01-.697-.497.625.625 0 01.497-.697c3.54-.91 7.422-.443 10.09 1.15a.624.624 0 01.115.774zM18.21 9.5a.75.75 0 01-.93.137c-2.7-1.65-6.84-2.14-10.11-1.176a.75.75 0 01-.825-.595.75.75 0 01.595-.825c3.7-1.07 8.35-.51 11.45 1.41a.75.75 0 01.137.93z"/>
    </svg>
);
const GeniusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.233 7.822l-1.932 4.885 3.528-.813-1.596-4.072zm3.32.96l-4.22 10.704 6.012-1.386 1.74-4.412-3.532-4.906zm-6.082 13.295L0 22.138l.06-1.52 4.41-10.457 4.063 1.096L4.47 22.077zM9.53 0L.014 2.14l.302 1.18 6.91 1.57L17.448.32 9.53 0z"/>
    </svg>
);



const ArtistBiography = React.memo(({ biography }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!biography) return null;

    const isLong = biography.length > 300;
    const textToShow = isLong && !isExpanded ? `${biography.substring(0, 300)}...` : biography;

    return (
        <div className="artist-sidebar-card">
            <h3 className="sidebar-card-title">{t('artistPage.about', 'Об исполнителе')}</h3>
            <div className="artist-bio">
                <p>{textToShow}</p>
                {isLong && (
                    <button onClick={() => setIsExpanded(!isExpanded)} className="bio-toggle-button">
                        {isExpanded ? t('artistPage.showLess', 'Свернуть') : t('artistPage.readMore', 'Читать дальше')}
                    </button>
                )}
            </div>
        </div>
    );
});
ArtistBiography.displayName = 'ArtistBiography';

const ArtistStats = React.memo(({ popularity, trackCount }) => {
    return (
        <div className="artist-sidebar-card">
            <div className="artist-stats-grid">
                <div className="stat-item">
                    <TrendingUp size={24} className="stat-icon" />
                    <div>
                        <div className="stat-value">{popularity || 0} / 100</div>
                        <div className="stat-label">Популярность</div>
                    </div>
                    {popularity > 0 && (
                        <div className="popularity-bar">
                            <div className="popularity-fill" style={{ width: `${popularity}%` }}></div>
                        </div>
                    )}
                </div>
                <div className="stat-item">
                    <Library size={24} className="stat-icon" />
                    <div>
                        <div className="stat-value">{trackCount}</div>
                        <div className="stat-label">Треков в медиатеке</div>
                    </div>
                </div>
            </div>
        </div>
    );
});
ArtistStats.displayName = 'ArtistStats';

const ArtistLinks = React.memo(({ spotifyId, geniusId }) => {
    if (!spotifyId && !geniusId) return null;

    return (
        <div className="artist-sidebar-card">
            <h3 className="sidebar-card-title">Внешние ссылки</h3>
            <ul className="artist-links">
                {spotifyId && (
                    <li>
                        <a href={`https://open.spotify.com/artist/${spotifyId}`} target="_blank" rel="noopener noreferrer">
                            <SpotifyIcon /> Spotify
                        </a>
                    </li>
                )}
                {geniusId && (
                     <li>
                        <a href={`https://genius.com/artists/${geniusId}`} target="_blank" rel="noopener noreferrer">
                            <GeniusIcon /> Genius
                        </a>
                    </li>
                )}
            </ul>
        </div>
    );
});
ArtistLinks.displayName = 'ArtistLinks';



const ArtistHeader = React.memo(({ artistInfo, onPlay, hasTracks }) => {
    const { t } = useTranslation();
    const [isFollowed, setIsFollowed] = useState(false);
    const [loadedImageUrl, setLoadedImageUrl] = useState(null);

    useEffect(() => {
        const imageUrl = artistInfo?.image_url || artistInfo?.local_image_url;
        if (imageUrl) {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => setLoadedImageUrl(imageUrl);
        } else {
            setLoadedImageUrl(null);
        }
    }, [artistInfo?.image_url, artistInfo?.local_image_url]);

    return (
        <header className="artist-header" style={{ backgroundImage: `url(${loadedImageUrl || ''})` }}>
            <div className="artist-header-overlay">
                <div className="artist-header-content">
                    <h1 className="artist-name-large">{artistInfo.name}</h1>
                    <div className="artist-genres">
                        {artistInfo.genres?.slice(0, 3).map(g => <span key={g} className="genre-tag">{g}</span>)}
                    </div>
                    <div className="artist-actions">
                        <button className="play-button-primary" onClick={onPlay} disabled={!hasTracks}>
                            <Play size={22} fill="currentColor" />
                            <span>{t('artistPage.play', 'Слушать')}</span>
                        </button>
                        <button className={`follow-button ${isFollowed ? 'followed' : ''}`} onClick={() => setIsFollowed(!isFollowed)}>
                            {isFollowed ? <Check size={20} /> : <UserPlus size={20} />}
                            <span>{isFollowed ? t('artistPage.following', 'В подписках') : t('artistPage.follow', 'Подписаться')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
});
ArtistHeader.displayName = 'ArtistHeader';

const TrackListItem = React.memo(({ track, index, onPlay }) => {
    const { artworkSrc } = useArtwork(track.uuid);
    return (
        <div className="track-list-item" onClick={onPlay}>
            <div className="track-list-index">{index + 1}</div>
            <div className="track-list-artwork">
                {artworkSrc ? <img src={artworkSrc} alt={track.title} /> : <div className="artwork-fallback"><Music size={20} /></div>}
            </div>
            <div className="track-list-info">
                <span className="track-list-title">{track.title}</span>
            </div>
            <div className="track-list-duration">
                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
            </div>
        </div>
    );
});
TrackListItem.displayName = 'TrackListItem';

const AlbumCard = React.memo(({ album, onPlay }) => {
    const { artworkSrc } = useArtwork(album.tracks[0]?.uuid);
    return (
        <div className="album-card" onClick={onPlay}>
            <div className="album-card-artwork">
                {artworkSrc ? <img src={artworkSrc} alt={album.name} /> : <div className="artwork-fallback"><Music size={40} /></div>}
                <div className="album-card-play-overlay"><Play size={32} fill="currentColor" /></div>
            </div>
            <div className="album-card-info">
                <span className="album-card-title">{album.name}</span>
                <span className="album-card-year">{album.year}</span>
            </div>
        </div>
    );
});
AlbumCard.displayName = 'AlbumCard';


const ArtistPage = () => {
    const { artistName } = useParams();
    const { t } = useTranslation();
    const player = usePlayer();

    const [artistInfo, setArtistInfo] = useState(null);
    const [artistTracks, setArtistTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArtistData = async () => {
             setLoading(true);
             setError(null);
             try {
                const artistData = await api.artists.getDetails(artistName);
                setArtistTracks(artistData.local_tracks || []); 
                setArtistInfo(artistData);
             } catch (err) {
                 console.error("Fatal Error fetching artist data:", err);
                 setError(err.message || t('artistPage.error', 'Не удалось загрузить данные об исполнителе.'));
             } finally {
                 setLoading(false);
             }
         };
        fetchArtistData();
    }, [artistName, t]);

    const { albums, singles } = useMemo(() => {
        const discography = artistTracks.reduce((acc, track) => {
            const albumIdentifier = track.album || 'Unknown Album';
            if (!acc[albumIdentifier]) {
                acc[albumIdentifier] = { name: albumIdentifier, year: track.year, tracks: [] };
            }
            acc[albumIdentifier].tracks.push(track);
            return acc;
        }, {});
        const allReleases = Object.values(discography);
        const albums = allReleases.filter(r => r.tracks.length >= 4);
        const singles = allReleases.filter(r => r.tracks.length < 4);
        return { albums, singles };
    }, [artistTracks]);

    if (loading) {
        return <div className="page-status-message"><LoaderCircle size={48} className="animate-spin" /></div>;
    }
    if (error) {
        return <div className="page-status-message error">{error}</div>;
    }
    if (!artistInfo) {
        return null;
    }

    const topTracks = artistTracks.slice(0, 5);
    const hasTracksInLibrary = artistTracks.length > 0;

    return (
        <div className="artist-page-container">
            <ArtistHeader 
                artistInfo={artistInfo} 
                onPlay={() => hasTracksInLibrary && player.playTrack(artistTracks[0], artistTracks)}
                hasTracks={hasTracksInLibrary}
            />
            
            <div className="artist-page-grid">
                <main className="main-artist-content">
                    {hasTracksInLibrary ? (
                        <>
                            <section>
                                <h2 className="section-title">{t('artistPage.popular', 'Популярное')}</h2>
                                <div className="popular-tracks-list">
                                    {topTracks.map((track, i) => (
                                        <TrackListItem 
                                            key={track.uuid} 
                                            track={track} 
                                            index={i} 
                                            onPlay={() => player.playTrack(track, artistTracks)} 
                                        />
                                    ))}
                                </div>
                            </section>
                            
                            {albums.length > 0 && (
                                <section>
                                    <h2 className="section-title">{t('artistPage.albums', 'Альбомы')}</h2>
                                    <div className="album-grid">
                                        {albums.map(album => (
                                            <AlbumCard 
                                                key={album.name} 
                                                album={album}
                                                onPlay={() => player.playTrack(album.tracks[0], album.tracks)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {singles.length > 0 && (
                                <section>
                                    <h2 className="section-title">{t('artistPage.singles', 'Синглы и EP')}</h2>
                                    <div className="album-grid">
                                        {singles.map(single => (
                                            <AlbumCard 
                                                key={single.name} 
                                                album={single}
                                                onPlay={() => player.playTrack(single.tracks[0], single.tracks)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    ) : (
                        <div className="artist-no-tracks-message">
                            <Info size={28} />
                            <p>{t('artistPage.errorNotFound', 'Треки этого исполнителя не найдены в вашей медиатеке.')}</p>
                        </div>
                    )}
                </main>
                <aside className="artist-sidebar">
                    <ArtistStats popularity={artistInfo.popularity} trackCount={artistTracks.length} />
                    <ArtistBiography biography={artistInfo.biography} />
                    <ArtistLinks spotifyId={artistInfo.spotify_id} geniusId={artistInfo.genius_id} />
                </aside>
            </div>
        </div>
    );
};

export default ArtistPage;