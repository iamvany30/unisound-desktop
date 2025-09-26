import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../../hooks/usePlayer';
import { useArtwork } from '../../hooks/useArtwork';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import { Music, Heart, ListMusic } from 'lucide-react';
import './Player.css';

const PlayerArtwork = memo(({ track, toggleNowPlaying }) => {
    const { artworkSrc, isLoading, errorStatus } = useArtwork(track);

    return (
        <button className='player-artwork-button' onClick={toggleNowPlaying}>
            <div className='player-artwork'>
                {isLoading || errorStatus || !artworkSrc ? (
                    <div className='artwork-fallback-container'>
                        <Music size={24} color='var(--color-text-muted)' />
                    </div>
                ) : (
                    <img src={artworkSrc} alt={`Cover art for ${track?.title}`} />
                )}
            </div>
        </button>
    );
});
PlayerArtwork.displayName = 'PlayerArtwork';

const TrackInfo = memo(({ track }) => (
    <div className='track-details'>
        <Link to={`/tracks/${track.uuid}`} className="track-title-link player-title">
            {track.title}
        </Link>
        <Link to={`/artists/${encodeURIComponent(track.primaryArtistName)}`} className="track-artist-link player-artist">
            {track.formattedArtists}
        </Link>
    </div>
));
TrackInfo.displayName = 'TrackInfo';

const Player = () => {
    const { currentTrack, isCurrentTrackLiked, toggleLike, toggleNowPlaying, progress, duration, seek, isLoading } = usePlayer();

    if (!currentTrack) {
        return null;
    }

    return (
        <div className="player-bar">
            <div className="player-background-container">

            </div>
            
            <ProgressBar progress={progress} duration={duration} onSeek={seek} isLoading={isLoading} />

            <div className="player-content-grid">
                <div className="player-left-controls">
                    <PlayerArtwork track={currentTrack} toggleNowPlaying={toggleNowPlaying} />
                    <TrackInfo track={currentTrack} />
                    <button className={`control-btn like-btn ${isCurrentTrackLiked ? 'active' : ''}`} onClick={toggleLike}>
                        <Heart size={18} fill={isCurrentTrackLiked ? 'currentColor' : 'none'} />
                    </button>
                </div>
                
                <div className='player-center-controls'>
                    <PlayerControls />
                </div>

                <div className='player-right-controls'>
                    <button className="control-btn queue-btn">
                        <ListMusic size={20} />
                    </button>
                    <VolumeControl />
                </div>
            </div>
        </div>
    );
};

export default Player;