
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../../hooks/usePlayer';
import { useArtwork } from '../../hooks/useArtwork';


import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';


import { 
    Music, Heart, MoreHorizontal, XCircle, UserX, Music2, LoaderCircle, ListMusic,
    ExternalLink
} from 'lucide-react';


import './Player.css';


const PlayerArtwork = React.memo(({ track }) => {
    const { artworkSrc, isLoading, errorStatus } = useArtwork(track?.uuid);
    
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
            onError={(e) => {
                console.warn('Failed to load artwork:', artworkSrc);
                e.target.style.display = 'none';
            }}
        />
    );
});
PlayerArtwork.displayName = 'PlayerArtwork';


const PlayerBackground = React.memo(({ track }) => {
    const { artworkSrc } = useArtwork(track?.uuid);
    const [backgrounds, setBackgrounds] = useState([]);
    
    useEffect(() => {
        if (artworkSrc) {
            setBackgrounds(prev => {
                const newBg = { src: artworkSrc, key: Date.now() };
                return [...prev, newBg].slice(-2); 
            });
        }
    }, [artworkSrc]);
    
    useEffect(() => {
        if (backgrounds.length > 1) {
            const timer = setTimeout(() => {
                setBackgrounds(prev => prev.slice(1));
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [backgrounds]);
    
    return (
        <div className="player-background-container">
            {backgrounds.map((bg, index) => (
                <img 
                    key={bg.key} 
                    src={bg.src} 
                    className="player-background-image" 
                    alt=""
                    loading="lazy"
                    style={{ 
                        opacity: index === backgrounds.length - 1 ? 1 : 0,
                        transition: 'opacity 0.8s ease-in-out'
                    }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            ))}
        </div>
    );
});
PlayerBackground.displayName = 'PlayerBackground';


const WaveFeedbackMenu = React.memo(({ player, onClose }) => {
    const menuRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscapeKey);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, [onClose]);
    
    const handleFeedback = useCallback(async (feedbackType) => {
        try {
            await player.submitWaveFeedback(feedbackType);
            console.log(`Wave feedback submitted: ${feedbackType}`);
        } catch (error) {
            console.error('Failed to submit wave feedback:', error);
        }
        onClose();
    }, [player, onClose]);
    
    const { currentTrack } = player;
    
    return (
        <div className="feedback-menu" ref={menuRef} role="menu">
            {currentTrack.explanation && (
                <div className="feedback-explanation">
                    <Music2 size={16} />
                    <span>{currentTrack.explanation}</span>
                </div>
            )}
            <button 
                onClick={() => handleFeedback('do_not_recommend_track')}
                role="menuitem"
                className="feedback-option"
            >
                <XCircle size={18} />
                <span>Не рекомендовать этот трек</span>
            </button>
            <button 
                onClick={() => handleFeedback('do_not_recommend_artist')}
                role="menuitem"
                className="feedback-option"
            >
                <UserX size={18} />
                <span>Не рекомендовать исполнителя</span>
            </button>
            {currentTrack.genre && (
                <button 
                    onClick={() => handleFeedback('do_not_recommend_genre')}
                    role="menuitem"
                    className="feedback-option"
                >
                    <Music size={18} />
                    <span>Не в настроении для жанра</span>
                </button>
            )}
        </div>
    );
});
WaveFeedbackMenu.displayName = 'WaveFeedbackMenu';


const TrackInfo = React.memo(({ track, toggleNowPlaying }) => {
    if (!track) return null;
    
    return (
        <div className='player-track-info'>
            <button 
                className='player-artwork-button' 
                onClick={toggleNowPlaying} 
                aria-label="Open Now Playing view"
                type="button"
            >
                <div className='player-artwork'>
                    <PlayerArtwork track={track} />
                </div>
            </button>
            <div className='track-details'>
                <Link 
                    to={`/tracks/${track.uuid}`} 
                    className="track-title-link player-title"
                    title={track.title}
                >
                    {track.title}
                </Link>
                <Link 
                    to={`/artists/${encodeURIComponent(track.primaryArtistName)}`} 
                    className="track-artist-link player-artist"
                    title={track.formattedArtists}
                >
                    {track.formattedArtists}
                </Link>
            </div>
        </div>
    );
});
TrackInfo.displayName = 'TrackInfo';


const AdditionalControls = React.memo(({ player }) => {
    const [showWaveFeedback, setShowWaveFeedback] = useState(false);
    
    const handleToggleLike = useCallback(async () => {
        try {
            await player.toggleLike();
        } catch (error) {
            console.error('Failed to toggle like:', error);
        }
    }, [player]);
    
    const toggleWaveFeedback = useCallback(() => {
        setShowWaveFeedback(prev => !prev);
    }, []);
    
    return (
        <div className="player-additional-controls">
            <button 
                className={`control-btn like-btn ${player.isCurrentTrackLiked ? 'liked' : ''}`}
                onClick={handleToggleLike}
                aria-label={player.isCurrentTrackLiked ? 'Unlike track' : 'Like track'}
                disabled={!player.currentTrack}
                type="button"
            >
                <Heart 
                    size={18} 
                    fill={player.isCurrentTrackLiked ? 'currentColor' : 'none'}
                />
            </button>
            
            {player.isWaveMode && (
                <div className="wave-feedback-container">
                    <button 
                        className="control-btn wave-feedback-btn"
                        onClick={toggleWaveFeedback}
                        aria-label="Wave feedback options"
                        type="button"
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    {showWaveFeedback && (
                        <WaveFeedbackMenu 
                            player={player} 
                            onClose={() => setShowWaveFeedback(false)} 
                        />
                    )}
                </div>
            )}
        </div>
    );
});
AdditionalControls.displayName = 'AdditionalControls';


const RightControls = React.memo(() => {
    const handleShowQueue = useCallback(() => {
        console.log('Show queue functionality not implemented yet');
    }, []);
    
    return (
        <div className='player-right-controls'>
            <button 
                className="control-btn queue-btn" 
                aria-label="Show queue"
                onClick={handleShowQueue}
                type="button"
            >
                <ListMusic size={20} />
            </button>
            <VolumeControl />
        </div>
    );
});
RightControls.displayName = 'RightControls';


const PlayerStateIndicator = React.memo(({ playerState, error }) => {
    if (error) {
        return (
            <div className="player-state-indicator error" title={`Error: ${error}`}>
                <XCircle size={16} />
            </div>
        );
    }
    
    if (playerState === 'loading') {
        return (
            <div className="player-state-indicator loading" title="Loading...">
                <LoaderCircle size={16} className="animate-spin" />
            </div>
        );
    }
    
    return null;
});
PlayerStateIndicator.displayName = 'PlayerStateIndicator';


const Player = () => {
    
    const player = usePlayer();
    const { toggleNowPlaying } = player;

    
    
    
    const handleRetry = useCallback(() => {
        if (player.retry) {
            player.retry();
        }
    }, [player]);
    
    
    if (!player.currentTrack) {
        return null;
    }
    
    const { currentTrack, playerState, error } = player;
    
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
                <TrackInfo 
                    track={currentTrack} 
                    toggleNowPlaying={toggleNowPlaying} 
                />
                
                <div className='player-center-controls'>
                    <PlayerControls player={player} />
                    <PlayerStateIndicator 
                        playerState={playerState} 
                        error={error} 
                    />
                </div>

                <RightControls />
            </div>
            
            <AdditionalControls player={player} />
            
            {error && (
                <div className="player-error-message">
                    <span>{error}</span>
                    <button 
                        onClick={handleRetry}
                        className="retry-button"
                        type="button"
                    >
                        Повторить
                    </button>
                </div>
            )}
        </div>
    );
};

export default Player;