import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Music } from 'lucide-react';
import { processTrackData } from '../../utils/trackDataProcessor';
import { useArtwork } from '../../hooks/useArtwork';

const TrackCardArtwork = React.memo(({ track }) => {
    const { artworkSrc, isLoading } = useArtwork(track);

    if (isLoading || !artworkSrc) {
        return (
            <div className="track-card-artwork">
                <div className="artwork-fallback">
                    <Music size={48} />
                </div>
            </div>
        );
    }
    
    return (
        <div className="track-card-artwork">
            <img 
                src={artworkSrc} 
                alt={`${track.title || 'Track'} artwork`}
                loading="lazy"
            />
        </div>
    );
});
TrackCardArtwork.displayName = 'TrackCardArtwork';

const PlayButton = React.memo(({ isPlaying, onPlay, disabled = false }) => {
    return (
        <button 
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={onPlay}
            disabled={disabled}
            aria-label={isPlaying ? "Pause track" : "Play track"}
        >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </button>
    );
});
PlayButton.displayName = 'PlayButton';

const TrackCard = ({ track: rawTrack, onPlay, isPlaying = false }) => {
    
    const track = processTrackData(rawTrack);

    const handlePlayClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onPlay) {
            onPlay(track);
        }
    };
    
    if (!track) {
        console.warn('TrackCard получил невалидные данные:', rawTrack);
        return null; 
    }
    
    const cardClasses = `track-card ${isPlaying ? 'playing' : ''}`;

    return (
        <article className={cardClasses}>
            <div className="artwork-container">
                <TrackCardArtwork track={track} />
                <div className="overlay">
                    <PlayButton 
                        isPlaying={isPlaying}
                        onPlay={handlePlayClick}
                    />
                </div>
            </div>
            
            <div className="track-info">
                <Link 
                    to={track.isLocal ? '#' : `/tracks/${track.uuid}`} 
                    className="track-title-link" 
                    onClick={(e) => { if (track.isLocal) e.preventDefault(); e.stopPropagation(); }}
                    title={track.title}
                >
                    <h3>{track.title}</h3>
                </Link>
                <Link 
                    to={track.isLocal ? '#' : `/artists/${encodeURIComponent(track.primaryArtistName)}`} 
                    className="track-artist-link" 
                    onClick={(e) => { if (track.isLocal) e.preventDefault(); e.stopPropagation(); }}
                    title={track.formattedArtists}
                >
                    <p>{track.formattedArtists}</p>
                </Link>
            </div>
        </article>
    );
};

export default React.memo(TrackCard);