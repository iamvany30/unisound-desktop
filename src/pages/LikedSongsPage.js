// Файл: src/pages/LikedSongsPage.js

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { usePlayer } from '../hooks/usePlayer';
import { useArtwork } from '../hooks/useArtwork';
import { LoaderCircle, Music, Play, Heart, Info, RefreshCw } from 'lucide-react';
import './LikedSongsPage.css';

// Вспомогательный компонент для элемента списка, адаптированный из ArtistPage
const TrackListItem = memo(({ track, index, onPlay, isPlaying, isPaused, t }) => {
    const { artworkSrc } = useArtwork(track);
    const isActive = isPlaying || isPaused;

    return (
        <div 
            className={`track-list-item ${isActive ? 'active' : ''}`} 
            onClick={onPlay} 
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onPlay()} 
            role="button" 
            tabIndex="0" 
            aria-label={t('artistPage.playTrack', { track: track.title })}
            style={{ animationDelay: `${index * 30}ms` }}
        >
            <div className="track-list-index-container">
                <span className="track-index-number">{index + 1}</span>
                <Play className="track-index-play" size={16} fill="currentColor" />
                <Music className="track-index-active" size={16} />
            </div>
            <div className="track-list-artwork">
                {artworkSrc ? <img src={artworkSrc} alt={track.title} /> : <div className="artwork-fallback"><Music size={20} /></div>}
            </div>
            <div className="track-list-info">
                <span className="track-list-title">{track.title}</span>
                <span className="track-list-artist">{track.artist}</span>
            </div>
            <div className="track-list-duration">
                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
            </div>
        </div>
    );
});
TrackListItem.displayName = 'TrackListItem';

const LikedSongsPage = () => {
    const { t } = useTranslation(['common', 'artistPage']);
    const player = usePlayer();
    const [tracks, setTracks] = useState([]);
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error', 'empty'

    const fetchLikedTracks = useCallback(async () => {
        setStatus('loading');
        try {
            // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Новый API возвращает массив напрямую ---
            const likedTracks = await api.user.getLikedTracks();
            
            if (Array.isArray(likedTracks)) {
                setTracks(likedTracks);
                setStatus(likedTracks.length > 0 ? 'success' : 'empty');
            } else {
                // На случай, если API вернет что-то неожиданное
                console.error("API response for liked tracks is not an array:", likedTracks);
                setTracks([]);
                setStatus('empty');
            }
        } catch (err) {
            console.error("Failed to fetch liked tracks:", err);
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        fetchLikedTracks();
    }, [fetchLikedTracks]);

    const handlePlayAll = useCallback(() => {
        if (tracks.length > 0) {
            player.playTrack(tracks[0], tracks);
        }
    }, [tracks, player]);
    
    const handlePlayTrack = useCallback((track) => {
        player.playTrack(track, tracks);
    }, [tracks, player]);

    const renderContent = () => {
        if (status === 'loading') {
            return <div className="page-status-message"><LoaderCircle size={48} className="animate-spin" /></div>;
        }
        if (status === 'error') {
            return (
                <div className="page-status-message error">
                    <p>{t('likedSongs.error')}</p>
                    <button onClick={fetchLikedTracks} className="retry-button"><RefreshCw size={16} /> {t('likedSongs.retry')}</button>
                </div>
            );
        }
        if (status === 'empty') {
            return <div className="page-status-message"><Info size={48} /><p>{t('likedSongs.empty')}</p></div>;
        }
        if (status === 'success') {
            return (
                <div className="track-list-container">
                    {tracks.map((track, index) => (
                        <TrackListItem
                            key={track.uuid}
                            track={track}
                            index={index}
                            onPlay={() => handlePlayTrack(track)}
                            isPlaying={player.isPlaying && player.currentTrack?.uuid === track.uuid}
                            isPaused={!player.isPlaying && player.currentTrack?.uuid === track.uuid}
                            t={t}
                        />
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="liked-songs-page">
            <header className="liked-songs-header">
                <div className="header-icon-container">
                    <Heart size={48} fill="currentColor" />
                </div>
                <div className="header-info">
                    <h1 className="header-title">{t('header.likedSongs')}</h1>
                    <p className="header-subtitle">
                        {t('likedSongs.trackCount', { count: tracks.length })}
                    </p>
                    <button 
                        className="play-button-primary" 
                        onClick={handlePlayAll} 
                        disabled={tracks.length === 0}
                    >
                        <Play size={22} fill="currentColor" />
                        <span>{t('artistPage:artistPage.play')}</span>
                    </button>
                </div>
            </header>
            <main className="liked-songs-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default LikedSongsPage;