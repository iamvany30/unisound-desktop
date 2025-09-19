import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { usePlayer } from '../hooks/usePlayer';
import { Music, Play, Pause, Heart, PlusSquare, Headphones, ThumbsUp, ChevronDown, ChevronUp, LoaderCircle } from 'lucide-react';

import './TrackDetailPage.css';

const TrackDetailPage = () => {
    const { trackUuid } = useParams();
    const { t } = useTranslation('track');
    const player = usePlayer();

    const [track, setTrack] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [lyrics, setLyrics] = useState(null);
    const [showLyrics, setShowLyrics] = useState(false);
    const [lyricsLoading, setLyricsLoading] = useState(false);

    const isCurrentTrackPlaying = player.currentTrack?.uuid === track?.uuid && player.isPlaying;

    useEffect(() => {
        const fetchTrackData = async () => {
            setLoading(true);
            setError(null);
            try {
                const trackData = await api.tracks.getDetails(trackUuid);
                setTrack(trackData);
            } catch (err) {
                setError(err.message || t('error'));
            } finally {
                setLoading(false);
            }
        };
        fetchTrackData();
    }, [trackUuid, t]);

    const handleToggleLyrics = async () => {
        if (showLyrics) {
            setShowLyrics(false);
            return;
        }
        setShowLyrics(true);
        if (lyrics !== null) return;

        setLyricsLoading(true);
        try {
            const response = await api.tracks.getLyrics(trackUuid);
            setLyrics(response.lyrics || t('lyricsNotFound'));
        } catch (err) {
            setLyrics(t('lyricsNotFound'));
        } finally {
            setLyricsLoading(false);
        }
    };
    
    if (loading) {
        return <div className="status-message"><LoaderCircle className="animate-spin" /> {t('loading')}</div>;
    }
    if (error) {
        return <div className="status-message error">{error}</div>;
    }
    if (!track) {
        return <div className="status-message">{t('error')}</div>;
    }
    
    const artworkSrc = api.player.getArtworkUrl(track.uuid);

    return (
        <div className="track-detail-page">
            <header className="track-header">
                <div className="artwork-large">
                    {artworkSrc ? (
                        <img src={artworkSrc} alt={track.title} className="artwork-image" />
                    ) : (
                        <div className="artwork-fallback"><Music size={80} /></div>
                    )}
                </div>
                <div className="track-info-main">
                    <h1 className="title">{track.title}</h1>
                    <h2 className="subtitle">
                        <Link to={`/artists/${encodeURIComponent(track.artist)}`} className="track-artist-link">{track.artist}</Link> • {track.album} • {track.year}
                    </h2>
                    
                    <div className="actions">
                        <button className="action-btn play-btn" onClick={() => player.playTrack(track, [track])}>
                            {isCurrentTrackPlaying ? <Pause size={24} /> : <Play size={24} />}
                            <span>{isCurrentTrackPlaying ? "Pause" : "Play"}</span>
                        </button>
                        <button className="action-btn">
                            <Heart size={20} fill={track.user_interaction?.liked ? 'currentColor' : 'none'} />
                        </button>
                         <button className="action-btn">
                            <PlusSquare size={20} />
                        </button>
                    </div>
                    
                    <div className="stats">
                        <div className="stat-item">
                            <Headphones size={18} />
                            <span>{track.stats?.plays.toLocaleString() || 0} {t('plays')}</span>
                        </div>
                         <div className="stat-item">
                            <ThumbsUp size={18} />
                            <span>{track.stats?.likes.toLocaleString() || 0} {t('likes')}</span>
                        </div>
                    </div>
                </div>
            </header>

            <section className="lyrics-section">
                <button onClick={handleToggleLyrics} className="lyrics-toggle-btn">
                    <span>{t('lyrics')}</span>
                    {showLyrics ? <ChevronUp /> : <ChevronDown />}
                </button>
                {showLyrics && (
                    <div className="lyrics-content">
                        {lyricsLoading ? (
                            <p>{t('lyricsLoading')}</p>
                        ) : (
                            <pre className="lyrics-pre">{lyrics}</pre>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default TrackDetailPage;