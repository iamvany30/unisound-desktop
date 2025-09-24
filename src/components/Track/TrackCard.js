import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Play, 
    Pause, 
    Heart, 
    Share2, 
    Download, 
    Music, 
    LoaderCircle,
    MoreHorizontal
} from 'lucide-react';

// Simple artwork component without external hooks
const TrackCardArtwork = React.memo(({ track, variant = 'default', className = "" }) => {
    const artworkClasses = [
        'track-artwork',
        `track-artwork--${variant}`,
        className
    ].filter(Boolean).join(' ');
    
    // Check if track has artwork
    const artworkSrc = track?.artwork || track?.cover || track?.image || track?.thumbnail;
    
    if (!artworkSrc) {
        return (
            <div className={artworkClasses}>
                <div className="artwork-fallback">
                    <Music 
                        size={variant === 'row' ? 24 : 48}
                        style={{ 
                            color: 'var(--color-accent-primary, #3b82f6)',
                            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))'
                        }}
                    />
                </div>
            </div>
        );
    }
    
    return (
        <div className={artworkClasses}>
            <img 
                src={artworkSrc} 
                alt={`${track.title || 'Track'} artwork`}
                loading="lazy"
                onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `
                        <div class="artwork-fallback">
                            <div style="width: ${variant === 'row' ? 24 : 48}px; height: ${variant === 'row' ? 24 : 48}px; display: flex; align-items: center; justify-content: center;">
                                <svg width="${variant === 'row' ? 24 : 48}" height="${variant === 'row' ? 24 : 48}" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary, #3b82f6)" stroke-width="2">
                                    <path d="M9 18V5l12-2v13"/>
                                    <circle cx="6" cy="18" r="3"/>
                                    <circle cx="18" cy="16" r="3"/>
                                </svg>
                            </div>
                        </div>
                    `;
                }}
            />
        </div>
    );
});

TrackCardArtwork.displayName = 'TrackCardArtwork';

// Simple track data processor
const processTrackData = (rawTrack) => {
    if (!rawTrack) return null;
    
    // Handle different track data formats
    const track = {
        uuid: rawTrack.uuid || rawTrack.id || Math.random().toString(36),
        title: rawTrack.title || rawTrack.name || 'Untitled Track',
        artist: rawTrack.artist || rawTrack.artists?.[0] || 'Unknown Artist',
        artists: rawTrack.artists || [rawTrack.artist] || ['Unknown Artist'],
        artwork: rawTrack.artwork || rawTrack.cover || rawTrack.image || rawTrack.thumbnail,
        isLocal: rawTrack.isLocal || false,
        isLiked: rawTrack.isLiked || false,
        duration: rawTrack.duration || 0,
        url: rawTrack.url || rawTrack.src || '',
        ...rawTrack
    };
    
    // Format artists string
    track.formattedArtists = Array.isArray(track.artists) 
        ? track.artists.join(', ') 
        : track.artist || 'Unknown Artist';
    
    track.primaryArtistName = Array.isArray(track.artists) 
        ? track.artists[0] 
        : track.artist || 'Unknown Artist';
    
    return track;
};

const ActionButton = React.memo(({ 
    icon: Icon, 
    onClick, 
    ariaLabel, 
    isActive = false,
    variant = 'default',
    className = ""
}) => {
    const buttonClasses = [
        'action-btn',
        isActive && 'action-btn--active',
        className
    ].filter(Boolean).join(' ');

    return (
        <button 
            className={buttonClasses}
            onClick={onClick}
            aria-label={ariaLabel}
            type="button"
        >
            <Icon size={16} />
        </button>
    );
});

ActionButton.displayName = 'ActionButton';

const PlayButton = React.memo(({ 
    isPlaying, 
    onPlay, 
    disabled = false,
    variant = 'default',
    className = ""
}) => {
    const buttonClasses = [
        'play-btn',
        isPlaying && 'play-btn--playing',
        disabled && 'glass--disabled',
        className
    ].filter(Boolean).join(' ');

    // Inline styles for the button to ensure visibility
    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '40px',
        minHeight: '40px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        color: 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        ...(variant === 'row' && {
            minWidth: '32px',
            minHeight: '32px'
        })
    };

    const iconSize = variant === 'row' ? 16 : 20;

    return (
        <button 
            className={buttonClasses}
            onClick={onPlay}
            disabled={disabled}
            aria-label={isPlaying ? "Pause track" : "Play track"}
            type="button"
            style={buttonStyle}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.target.style.backgroundColor = 'rgba(59, 130, 246, 1)';
                    e.target.style.transform = 'scale(1.05)';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
                    e.target.style.transform = 'scale(1)';
                }
            }}
        >
            {isPlaying ? (
                <Pause 
                    size={iconSize} 
                    fill="currentColor"
                    style={{ 
                        display: 'block',
                        flexShrink: 0
                    }}
                />
            ) : (
                <Play 
                    size={iconSize} 
                    fill="currentColor" 
                    style={{ 
                        marginLeft: '2px',
                        display: 'block',
                        flexShrink: 0
                    }}
                />
            )}
        </button>
    );
});

PlayButton.displayName = 'PlayButton';

const TrackCard = ({ 
    track: rawTrack, 
    onPlay, 
    isPlaying = false,
    variant = 'default', 
    size = 'default', 
    theme = null, 
    effect = null, 
    gradient = null, 
    filter = null, 
    rounded = 'xl', 
    transition = 'normal', 
    easing = null, 
    showActions = true,
    className = "",
    onLike,
    onShare,
    onDownload,
    onMore,
    isLiked = false,
    isLoading = false,
    disabled = false,
    state = null,
    useOverlay = false
}) => {
    const track = processTrackData(rawTrack);
    
    const handleLike = React.useCallback(() => {
        if (track && onLike && !disabled) {
            onLike(track);
        }
    }, [onLike, track, disabled]);
    
    const handleShare = React.useCallback(() => {
        if (track && onShare && !disabled) {
            onShare(track);
        }
    }, [onShare, track, disabled]);
    
    const handleDownload = React.useCallback(() => {
        if (track && onDownload && !disabled) {
            onDownload(track);
        }
    }, [onDownload, track, disabled]);
    
    const handleMore = React.useCallback(() => {
        if (track && onMore && !disabled) {
            onMore(track);
        }
    }, [onMore, track, disabled]);
    
    const handlePlay = React.useCallback(() => {
        if (track && onPlay && !disabled) {
            onPlay(track);
        }
    }, [onPlay, track, disabled]);
    
    if (!track) {
        console.warn('TrackCard received invalid track data:', rawTrack);
        return null;
    }
    
    const cardClasses = [
        'track-card',
        `track-card--${variant}`,
        size !== 'default' && `track-card--${size}`,
        theme && `track-card--theme-${theme}`,
        effect && `track-card--${effect}`,
        gradient && `track-card--gradient-${gradient}`,
        filter && `track-card--filter-${filter}`,
        rounded !== 'xl' && `track-card--rounded-${rounded}`,
        transition !== 'normal' && `track-card--transition-${transition}`,
        easing && `track-card--easing-${easing}`,
        isPlaying && 'track-card--playing',
        isLoading && 'track-card--loading',
        disabled && 'track-card--disabled',
        state && `track-card--${state}`,
        className
    ].filter(Boolean).join(' ');
    
    // Render with overlay style (simplified version)
    if (useOverlay) {
        return (
            <article className={cardClasses}>
                <div className="artwork-container" onClick={handlePlay}>
                    <TrackCardArtwork track={track} variant={variant} />
                    <div className="artwork-overlay">
                        <PlayButton 
                            isPlaying={isPlaying}
                            onPlay={handlePlay}
                            disabled={disabled || isLoading}
                            variant={variant}
                        />
                    </div>
                </div>
                
                <div className="track-info">
                    {track.isLocal ? (
                        <h3 className="track-title-link" title={track.title}>
                            {track.title || 'Untitled Track'}
                        </h3>
                    ) : (
                        <Link to={`/tracks/${track.uuid}`} className="track-title-link" title={track.title}>
                            <h3>{track.title || 'Untitled Track'}</h3>
                        </Link>
                    )}
                    
                    {track.isLocal ? (
                        <p className="track-artist-link" title={track.formattedArtists}>
                            {track.formattedArtists}
                        </p>
                    ) : (
                        <Link to={`/artists/${encodeURIComponent(track.primaryArtistName)}`} className="track-artist-link" title={track.formattedArtists}>
                            <p>{track.formattedArtists}</p>
                        </Link>
                    )}
                </div>
                
                <div className="track-actions-container">
                    {!track.isLocal && (
                        <ActionButton
                            icon={Heart}
                            onClick={handleLike}
                            ariaLabel={track.isLiked || isLiked ? "Remove from favorites" : "Add to favorites"}
                            isActive={track.isLiked || isLiked}
                            variant={variant}
                            className="like-btn"
                        />
                    )}
                </div>
            </article>
        );
    }

    // Default render style (full-featured version)
    return (
        <article className={cardClasses}>
            <TrackCardArtwork 
                track={track} 
                variant={variant}
            />
            
            <div className="track-info">
                {track.isLocal ? (
                    <h3 className="track-title-link" title={track.title}>
                        {track.title || 'Untitled Track'}
                    </h3>
                ) : (
                    <Link 
                        to={`/tracks/${track.uuid}`} 
                        className="track-title-link"
                        title={track.title || 'Untitled Track'}
                    >
                        <h3>{track.title || 'Untitled Track'}</h3>
                    </Link>
                )}
                
                {track.isLocal ? (
                    <p className="track-artist-link" title={track.formattedArtists}>
                        {track.formattedArtists}
                    </p>
                ) : (
                    <Link 
                        to={`/artists/${encodeURIComponent(track.primaryArtistName)}`} 
                        className="track-artist-link"
                        title={track.formattedArtists}
                    >
                        <p>{track.formattedArtists}</p>
                    </Link>
                )}
            </div>
            
            <div className="track-controls">
                <PlayButton 
                    isPlaying={isPlaying}
                    onPlay={handlePlay}
                    disabled={disabled || isLoading}
                    variant={variant}
                />
                
                {showActions && (
                    <div className="track-actions">
                        {!track.isLocal && (
                            <ActionButton
                                icon={Heart}
                                onClick={handleLike}
                                ariaLabel={track.isLiked || isLiked ? "Remove from favorites" : "Add to favorites"}
                                isActive={track.isLiked || isLiked}
                                variant={variant}
                            />
                        )}
                        
                        {onShare && (
                            <ActionButton
                                icon={Share2}
                                onClick={handleShare}
                                ariaLabel="Share track"
                                variant={variant}
                            />
                        )}
                        
                        {onDownload && (
                            <ActionButton
                                icon={Download}
                                onClick={handleDownload}
                                ariaLabel="Download track"
                                variant={variant}
                            />
                        )}
                        
                        {onMore && (
                            <ActionButton
                                icon={MoreHorizontal}
                                onClick={handleMore}
                                ariaLabel="More actions"
                                variant={variant}
                            />
                        )}
                    </div>
                )}
            </div>
        </article>
    );
};

// Preset component variants
export const TrackCardCompact = React.memo(({ ...props }) => (
    <TrackCard 
        variant="row"
        size="sm"
        rounded="lg"
        transition="fast"
        showActions={false}
        {...props}
    />
));
TrackCardCompact.displayName = 'TrackCardCompact';

export const TrackCardFeatured = React.memo(({ ...props }) => (
    <TrackCard 
        variant="featured"
        size="lg"
        effect="holographic"
        rounded="2xl"
        transition="slow"
        {...props}
    />
));
TrackCardFeatured.displayName = 'TrackCardFeatured';

export const TrackCardMini = React.memo(({ ...props }) => (
    <TrackCard 
        variant="default"
        size="xs"
        rounded="md"
        transition="fast"
        showActions={false}
        {...props}
    />
));
TrackCardMini.displayName = 'TrackCardMini';

export const TrackCardAnimated = React.memo(({ effect = 'breathing', ...props }) => (
    <TrackCard 
        variant="default"
        effect={effect}
        rounded="xl"
        transition="normal"
        easing="elastic"
        {...props}
    />
));
TrackCardAnimated.displayName = 'TrackCardAnimated';

export const TrackCardOcean = React.memo(({ ...props }) => (
    <TrackCard 
        theme="ocean"
        gradient="ocean"
        effect="shimmer"
        rounded="2xl"
        {...props}
    />
));
TrackCardOcean.displayName = 'TrackCardOcean';

export const TrackCardSunset = React.memo(({ ...props }) => (
    <TrackCard 
        theme="sunset"
        gradient="sunset"
        effect="iridescent"
        rounded="organic"
        {...props}
    />
));
TrackCardSunset.displayName = 'TrackCardSunset';

export const TrackCardCyberpunk = React.memo(({ ...props }) => (
    <TrackCard 
        theme="midnight"
        filter="cyberpunk"
        effect="quantum"
        rounded="lg"
        {...props}
    />
));
TrackCardCyberpunk.displayName = 'TrackCardCyberpunk';

// Simplified overlay version
export const TrackCardSimple = React.memo(({ ...props }) => (
    <TrackCard 
        useOverlay={true}
        showActions={false}
        {...props}
    />
));
TrackCardSimple.displayName = 'TrackCardSimple';

export default TrackCard;