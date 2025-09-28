import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../../hooks/usePlayer';
import { useArtwork } from '../../hooks/useArtwork';
import { useTranslation } from 'react-i18next';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import { Music, Heart, ListMusic } from 'lucide-react';
import './Player.css';


const PlayerBackground = memo(({ artworkSrc }) => {
    return (
        <div className="player-background-container">
            <div 
                className="player-background-image" 
                style={{backgroundImage: artworkSrc ? `url(${artworkSrc})` : 'none'}}
                aria-hidden="true" 
            />
        </div>
    );
});
PlayerBackground.displayName = 'PlayerBackground';

const PlayerArtwork = memo(({ track, toggleNowPlaying }) => {
    const { artworkSrc, isLoading, errorStatus } = useArtwork(track);
    const { t } = useTranslation('player');

    return (
        <button className='player-artwork-button' onClick={toggleNowPlaying} aria-label={t('coverArtFor', { title: track?.title })}>
            <div className={`player-artwork ${isLoading ? 'loading' : ''}`}>
                {errorStatus || !artworkSrc ? (
                    <div className='artwork-fallback-container'>
                        <Music size={24} />
                    </div>
                ) : (
                    <img src={artworkSrc} alt="" /> 
                )}
            </div>
        </button>
    );
});
PlayerArtwork.displayName = 'PlayerArtwork';

const TrackInfo = memo(({ track }) => (
    <div className='track-details'>
        <Link to={`/tracks/${track.uuid}`} className="player-title">
            {track.title}
        </Link>
        <Link to={`/artists/${encodeURIComponent(track.primaryArtistName)}`} className="player-artist">
            {track.formattedArtists}
        </Link>
    </div>
));
TrackInfo.displayName = 'TrackInfo';

const Player = () => {
    const { currentTrack, isCurrentTrackLiked, toggleLike, toggleNowPlaying } = usePlayer();
    const { t } = useTranslation('player');
    
    
    const { artworkSrc } = useArtwork(currentTrack);

    if (!currentTrack) {
        return null; 
    }

    return (
        <div className="player-bar">
            <PlayerBackground artworkSrc={artworkSrc} />
            
            <ProgressBar />

            <div className="player-content-grid">
                <div className="player-left-controls">
                    <PlayerArtwork track={currentTrack} toggleNowPlaying={toggleNowPlaying} />
                    <TrackInfo track={currentTrack} />
                    <button className={`control-btn like-btn ${isCurrentTrackLiked ? 'active' : ''}`} onClick={toggleLike} aria-label={t('like')}>
                        <Heart size={18} />
                    </button>
                </div>
                
                <div className='player-center-controls'>
                    <PlayerControls />
                </div>

                <div className='player-right-controls'>
                    <button className="control-btn queue-btn" aria-label={t('queue')}>
                        <ListMusic size={20} />
                    </button>
                    <VolumeControl />
                </div>
            </div>
        </div>
    );
};

export default Player;