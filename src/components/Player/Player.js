import React, { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../../hooks/usePlayer';
import { useArtwork } from '../../hooks/useArtwork';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import { Music, Heart, LoaderCircle, ListMusic } from 'lucide-react';
import './Player.css';

const PlayerArtwork = memo(({ track }) => {
    const { artworkSrc, isLoading, errorStatus } = useArtwork(track);
    
    if (isLoading) {
        return (
            <div className='artwork-fallback-container'>
                <LoaderCircle size={24} className="animate-spin" color='var(--color-text-muted)' />
            </div>
        );
    }
    
    if (errorStatus || !artworkSrc) {
        return (
            <div className='artwork-fallback-container'>
                <Music size={24} color='var(--color-text-muted)' />
            </div>
        );
    }
    
    return (
        <img 
            src={artworkSrc} 
            alt={`Cover art for ${track?.title || 'Unknown track'}`}
            loading="lazy"
        />
    );
});
PlayerArtwork.displayName = 'PlayerArtwork';

const PlayerBackground = memo(({ track }) => {
    const { artworkSrc } = useArtwork(track);
    
    return (
        <div className="player-background-container">
            {artworkSrc && (
                <img 
                    key={artworkSrc} 
                    src={artworkSrc} 
                    className="player-background-image" 
                    alt=""
                    style={{ opacity: 1 }}
                />
            )}
        </div>
    );
});
PlayerBackground.displayName = 'PlayerBackground';

const TrackInfo = memo(({ track, toggleNowPlaying }) => {
    if (!track) return null;
    
    return (
        <div className='player-track-info'>
            <button 
                className='player-artwork-button' 
                onClick={toggleNowPlaying} 
                aria-label="Открыть полноэкранный плеер"
            >
                <div className='player-artwork'>
                    <PlayerArtwork track={track} />
                </div>
            </button>
            <div className='track-details'>
                {track.isLocal ? (
                    <span className="track-title-link player-title" title={track.title}>
                        {track.title}
                    </span>
                ) : (
                    <Link 
                        to={`/tracks/${track.uuid}`} 
                        className="track-title-link player-title"
                        title={track.title}
                    >
                        {track.title}
                    </Link>
                )}
                
                {track.isLocal ? (
                     <span className="track-artist-link player-artist" title={track.formattedArtists}>
                        {track.formattedArtists}
                    </span>
                ) : (
                    <Link 
                        to={`/artists/${encodeURIComponent(track.primaryArtistName)}`} 
                        className="track-artist-link player-artist"
                        title={track.formattedArtists}
                    >
                        {track.formattedArtists}
                    </Link>
                )}
            </div>
        </div>
    );
});
TrackInfo.displayName = 'TrackInfo';

const RightControls = memo(() => {
    return (
        <div className='player-right-controls'>
            <button className="control-btn queue-btn" aria-label="Показать очередь">
                <ListMusic size={20} />
            </button>
            <VolumeControl />
        </div>
    );
});
RightControls.displayName = 'RightControls';

const Player = () => {
    const player = usePlayer();
    const { currentTrack, isCurrentTrackLiked, toggleLike, toggleNowPlaying } = player;

    const handleToggleLike = useCallback(() => {
        if (!currentTrack || currentTrack.isLocal) return;
        toggleLike();
    }, [currentTrack, toggleLike]);

    if (!currentTrack) {
        return null;
    }
    
    return (
        <div className="player-bar">
            <PlayerBackground track={currentTrack} />
            
            <ProgressBar 
                progress={player.progress} 
                duration={player.duration} 
                onSeek={player.seek}
                isLoading={player.isLoading}
            />

            <div className="player-content-grid">
                <div className="player-left-controls">
                    <TrackInfo 
                        track={currentTrack} 
                        toggleNowPlaying={toggleNowPlaying} 
                    />
                    {!currentTrack.isLocal && (
                         <button 
                            className={`control-btn like-btn ${isCurrentTrackLiked ? 'active' : ''}`}
                            onClick={handleToggleLike}
                            aria-label={isCurrentTrackLiked ? 'Убрать из избранного' : 'Добавить в избранное'}
                        >
                            <Heart 
                                size={18} 
                                fill={isCurrentTrackLiked ? 'currentColor' : 'none'}
                            />
                        </button>
                    )}
                </div>
                
                <div className='player-center-controls'>
                    <PlayerControls player={player} />
                </div>

                <RightControls />
            </div>
        </div>
    );
};

export default Player;