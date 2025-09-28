import React, { useState, useEffect, useMemo, useReducer, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { usePlayer } from '../hooks/usePlayer';
import { useArtwork } from '../hooks/useArtwork';
import { Music, Play, LoaderCircle, UserPlus, Check, Info, Library, RefreshCw, BarChart2 } from 'lucide-react';
import './ArtistPage.css';


const SpotifyIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.183 14.223a.498.498 0 01-.62.092c-2.06-1.263-4.663-1.54-7.792-.84a.5.5 0 01-.578-.398.5.5 0 01.398-.578c3.428-.758 6.29-.43 8.615.97a.499.499 0 01.092.62zm.893-2.316a.624.624 0 01-.774.115c-2.338-1.428-5.833-1.84-8.99-1.003a.625.625 0 01-.697-.497.625.625 0 01.497-.697c3.54-.91 7.422-.443 10.09 1.15a.624.624 0 01.115.774zM18.21 9.5a.75.75 0 01-.93.137c-2.7-1.65-6.84-2.14-10.11-1.176a.75.75 0 01-.825-.595.75.75 0 01.595-.825c3.7-1.07 8.35-.51 11.45 1.41a.75.75 0 01.137.93z"/></svg> );
const GeniusIcon = () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.233 7.822l-1.932 4.885 3.528-.813-1.596-4.072zm3.32.96l-4.22 10.704 6.012-1.386 1.74-4.412-3.532-4.906zm-6.082 13.295L0 22.138l.06-1.52 4.41-10.457 4.063 1.096L4.47 22.077zM9.53 0L.014 2.14l.302 1.18 6.91 1.57L17.448.32 9.53 0z"/></svg> );


const FadeIn = ({ children, delay = 0 }) => <div className="fade-in-item" style={{ animationDelay: `${delay}ms` }}>{children}</div>;

const ArtistBiography = React.memo(({ biography, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!biography) return null;
    const isLong = biography.length > 250;
    const textToShow = isLong && !isExpanded ? `${biography.substring(0, 250)}...` : biography;
    return (
        <div className="artist-sidebar-card">
            <h3 className="sidebar-card-title">{t('artistPage.about')}</h3>
            <div className="artist-bio"><p>{textToShow}</p>
                {isLong && <button onClick={() => setIsExpanded(!isExpanded)} className="bio-toggle-button">{isExpanded ? t('artistPage.showLess') : t('artistPage.readMore')}</button>}
            </div>
        </div>
    );
});
ArtistBiography.displayName = 'ArtistBiography';

const ArtistStats = React.memo(({ popularity, trackCount, t }) => (
    <div className="artist-sidebar-card">
        <div className="artist-stats-grid">
            <div className="stat-item"><BarChart2 size={24} className="stat-icon"/><div><div className="stat-value">{popularity || 0} / 100</div><div className="stat-label">{t('artistPage.popularity')}</div></div>{popularity > 0 && <div className="popularity-bar"><div className="popularity-fill" style={{ width: `${popularity}%` }}></div></div>}</div>
            <div className="stat-item"><Library size={24} className="stat-icon"/><div><div className="stat-value">{trackCount}</div><div className="stat-label">{t('artistPage.tracksInLibrary')}</div></div></div>
        </div>
    </div>
));
ArtistStats.displayName = 'ArtistStats';

const ArtistLinks = React.memo(({ spotifyId, geniusId, t }) => {
    if (!spotifyId && !geniusId) return null;
    return (
        <div className="artist-sidebar-card">
            <h3 className="sidebar-card-title">{t('artistPage.externalLinks')}</h3>
            <ul className="artist-links">
                {spotifyId && <li><a href={`https://open.spotify.com/artist/${spotifyId}`} target="_blank" rel="noopener noreferrer"><SpotifyIcon /> Spotify</a></li>}
                {geniusId && <li><a href={`https://genius.com/artists/${geniusId}`} target="_blank" rel="noopener noreferrer"><GeniusIcon /> Genius</a></li>}
            </ul>
        </div>
    );
});
ArtistLinks.displayName = 'ArtistLinks';

const ArtistHeader = React.memo(({ artistInfo, onPlay, hasTracks, t }) => {
    const [isFollowed, setIsFollowed] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [loadedImageUrl, setLoadedImageUrl] = useState(null);

    const handleFollowToggle = useCallback(() => {
        setIsFollowLoading(true);
        setTimeout(() => { setIsFollowed(prev => !prev); setIsFollowLoading(false); }, 500);
    }, []);

    useEffect(() => {
        const imageUrl = artistInfo?.image_url;
        if (imageUrl) {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => setLoadedImageUrl(imageUrl);
        } else {
            setLoadedImageUrl(null);
        }
    }, [artistInfo?.image_url]);

    return (
        <header className={`artist-header ${loadedImageUrl ? 'image-loaded' : ''}`} style={{ backgroundImage: `url(${loadedImageUrl || ''})` }}>
            <div className="artist-header-overlay" />
            <div className="artist-header-content">
                <h1 className="artist-name-large">{artistInfo.name}</h1>
                <div className="artist-actions">
                    <button className="play-button-primary" onClick={onPlay} disabled={!hasTracks} aria-label={t('artistPage.playArtist', { artist: artistInfo.name })}>
                        <Play size={22} fill="currentColor" /><span>{t('artistPage.play')}</span>
                    </button>
                    <button className={`follow-button ${isFollowed ? 'followed' : ''}`} onClick={handleFollowToggle} disabled={isFollowLoading} aria-pressed={isFollowed}>
                        {isFollowLoading ? <LoaderCircle size={20} className="animate-spin" /> : isFollowed ? <Check size={20} /> : <UserPlus size={20} />}
                        <span>{isFollowed ? t('artistPage.following') : t('artistPage.follow')}</span>
                    </button>
                </div>
            </div>
        </header>
    );
});
ArtistHeader.displayName = 'ArtistHeader';

const TrackListItem = React.memo(({ track, index, onPlay, isPlaying, isPaused, t }) => {
    const { artworkSrc } = useArtwork(track);
    const isActive = isPlaying || isPaused;

    return (
        <div className={`track-list-item ${isActive ? 'active' : ''}`} onClick={onPlay} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onPlay()} role="button" tabIndex="0" aria-label={t('artistPage.playTrack', { track: track.title })}>
            <div className="track-list-index-container">
                <span className="track-index-number">{index + 1}</span>
                <Play className="track-index-play" size={16} fill="currentColor" />
                <Music className="track-index-active" size={16} />
            </div>
            <div className="track-list-artwork">{artworkSrc ? <img src={artworkSrc} alt={track.title} /> : <div className="artwork-fallback"><Music size={20} /></div>}</div>
            <div className="track-list-info"><span className="track-list-title">{track.title}</span></div>
            <div className="track-list-duration">{Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}</div>
        </div>
    );
});
TrackListItem.displayName = 'TrackListItem';

const AlbumCard = React.memo(({ album, onPlay, t }) => {
    const { artworkSrc } = useArtwork(album.tracks[0]);
    return (
        <div className="album-card" onClick={onPlay} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onPlay()} role="button" tabIndex="0" aria-label={t('artistPage.playAlbum', { album: album.name })}>
            <div className="album-card-artwork">{artworkSrc ? <img src={artworkSrc} alt={album.name} /> : <div className="artwork-fallback"><Music size={40} /></div>}
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

const PageStatusMessage = ({ status, error, onRetry, t }) => {
    if (status === 'loading') return <div className="page-status-message"><LoaderCircle size={48} className="animate-spin" /></div>;
    if (status === 'error') return <div className="page-status-message error">{error || t('artistPage.error')}<button onClick={onRetry} className="retry-button"><RefreshCw size={16} /> {t('artistPage.retry')}</button></div>;
    return null;
};


const initialState = { status: 'loading', artistInfo: null, artistTracks: [], error: null };
const artistPageReducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_START': return { ...state, status: 'loading' };
        case 'FETCH_SUCCESS': return { status: 'success', artistInfo: action.payload.info, artistTracks: action.payload.tracks, error: null };
        case 'FETCH_ERROR': return { ...initialState, status: 'error', error: action.payload };
        default: return state;
    }
}


const ArtistPage = () => {
    const { artistName } = useParams();
    const { t } = useTranslation();
    const player = usePlayer();
    const [state, dispatch] = useReducer(artistPageReducer, initialState);
    const { status, artistInfo, artistTracks, error } = state;

    const fetchArtistData = useCallback(async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            const artistData = await api.artists.getDetails(artistName);
            dispatch({ type: 'FETCH_SUCCESS', payload: { info: artistData, tracks: artistData.local_tracks || [] } });
        } catch (err) {
            dispatch({ type: 'FETCH_ERROR', payload: err.message });
        }
    }, [artistName]);

    useEffect(() => { fetchArtistData(); }, [fetchArtistData]);
    
    const handlePlayArtist = useCallback(() => artistTracks.length > 0 && player.playTrack(artistTracks[0], artistTracks), [artistTracks, player]);
    const handlePlayTrack = useCallback((track) => player.playTrack(track, artistTracks), [artistTracks, player]);
    const handlePlayAlbum = useCallback((album) => player.playTrack(album.tracks[0], album.tracks), [player]);

    const { albums, singles } = useMemo(() => {
        const discography = artistTracks.reduce((acc, track) => {
            const id = track.album || 'Unknown Album';
            if (!acc[id]) acc[id] = { name: id, year: track.year, tracks: [] };
            acc[id].tracks.push(track);
            return acc;
        }, {});
        const all = Object.values(discography).sort((a, b) => (b.year || 0) - (a.year || 0));
        return { albums: all.filter(r => r.tracks.length >= 4), singles: all.filter(r => r.tracks.length < 4) };
    }, [artistTracks]);
    
    if (status !== 'success') return <PageStatusMessage status={status} error={error} onRetry={fetchArtistData} t={t} />;

    const topTracks = artistTracks.slice(0, 5);

    return (
        <div className="artist-page-container">
            <ArtistHeader artistInfo={artistInfo} onPlay={handlePlayArtist} hasTracks={artistTracks.length > 0} t={t} />
            <div className="artist-page-grid">
                <main className="main-artist-content">
                    {artistTracks.length > 0 ? (
                        <>
                            <section>
                                <h2 className="section-title">{t('artistPage.popular')}</h2>
                                <div className="popular-tracks-list">
                                    {topTracks.map((track, i) => (
                                        <FadeIn key={track.uuid} delay={i * 50}>
                                            <TrackListItem 
                                                track={track} 
                                                index={i} 
                                                onPlay={() => handlePlayTrack(track)} 
                                                isPlaying={player.isPlaying && player.currentTrack?.uuid === track.uuid} 
                                                isPaused={!player.isPlaying && player.currentTrack?.uuid === track.uuid} 
                                                t={t}
                                            />
                                        </FadeIn>
                                    ))}
                                </div>
                            </section>
                            
                            {albums.length > 0 && <section>
                                <h2 className="section-title">{t('artistPage.albums')}</h2>
                                <div className="album-grid">{albums.map((album, i) => <FadeIn key={album.name} delay={i*70}><AlbumCard album={album} onPlay={() => handlePlayAlbum(album)} t={t}/></FadeIn>)}</div>
                            </section>}

                            {singles.length > 0 && <section>
                                <h2 className="section-title">{t('artistPage.singles')}</h2>
                                <div className="album-grid">{singles.map((single, i) => <FadeIn key={single.name} delay={i*70}><AlbumCard album={single} onPlay={() => handlePlayAlbum(single)} t={t}/></FadeIn>)}</div>
                            </section>}
                        </>
                    ) : (
                        <div className="artist-no-tracks-message"><Info size={28} /><p>{t('artistPage.errorNotFound')}</p></div>
                    )}
                </main>
                <aside className="artist-sidebar">
                    <ArtistStats popularity={artistInfo.popularity} trackCount={artistTracks.length} t={t} />
                    <ArtistBiography biography={artistInfo.biography} t={t} />
                    <ArtistLinks spotifyId={artistInfo.spotify_id} geniusId={artistInfo.genius_id} t={t} />
                </aside>
            </div>
        </div>
    );
};

export default ArtistPage;