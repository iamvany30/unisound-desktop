
import React from 'react';
import { Link } from 'react-router-dom';
import { useArtwork } from '../../hooks/useArtwork';
import { processTrackData } from '../../utils/trackDataProcessor';


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


const TrackCardArtwork = React.memo(({ track, variant = 'default', className = "" }) => {
    const { artworkSrc, isLoading, errorStatus } = useArtwork(track.uuid);
    
    const artworkClasses = [
        'track-artwork',
        `track-artwork--${variant}`,
        className
    ].filter(Boolean).join(' ');
    
    if (isLoading) {
        return (
            <div className={artworkClasses}>
                <div className="artwork-fallback">
                    <LoaderCircle 
                        size={variant === 'row' ? 20 : 32} 
                        className="glass--shimmer" 
                        style={{ 
                            color: 'var(--color-accent-primary)',
                            animation: 'spin 1s linear infinite'
                        }}
                    />
                </div>
            </div>
        );
    }
    
    if (errorStatus || !artworkSrc) {
        return (
            <div className={artworkClasses}>
                <div className="artwork-fallback">
                    <Music 
                        size={variant === 'row' ? 24 : 48}
                        style={{ 
                            color: 'var(--color-accent-primary)',
                            filter: 'drop-shadow(0 0 8px rgba(var(--tc-accent-rgb), 0.3))'
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
                alt={`${track.title} artwork`}
                loading="lazy"
            />
        </div>
    );
});

TrackCardArtwork.displayName = 'TrackCardArtwork';


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

    return (
        <button 
            className={buttonClasses}
            onClick={onPlay}
            disabled={disabled}
            aria-label={isPlaying ? "Приостановить трек" : "Воспроизвести трек"}
            type="button"
        >
            {isPlaying ? (
                <Pause size={20} fill="currentColor" />
            ) : (
                <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
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
    state = null 
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
        console.warn('TrackCard получил неверные данные трека:', rawTrack);
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
    
    return (
        <article className={cardClasses}>

            <TrackCardArtwork 
                track={track} 
                variant={variant}
            />
            

            <div className="track-info">
                <Link 
                    to={`/tracks/${track.uuid}`} 
                    className="track-title-link"
                    title={track.title || 'Трек без названия'}
                >
                    <h3>{track.title || 'Трек без названия'}</h3>
                </Link>
                
                <Link 
                    to={`/artists/${encodeURIComponent(track.primaryArtistName)}`} 
                    className="track-artist-link"
                    title={track.formattedArtists}
                >
                    <p>{track.formattedArtists}</p>
                </Link>
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
                        <ActionButton
                            icon={Heart}
                            onClick={handleLike}
                            ariaLabel={isLiked ? "Убрать из избранного" : "Добавить в избранное"}
                            isActive={isLiked}
                            variant={variant}
                        />
                        
                        <ActionButton
                            icon={Share2}
                            onClick={handleShare}
                            ariaLabel="Поделиться треком"
                            variant={variant}
                        />
                        
                        <ActionButton
                            icon={Download}
                            onClick={handleDownload}
                            ariaLabel="Скачать трек"
                            variant={variant}
                        />
                        
                        {onMore && (
                            <ActionButton
                                icon={MoreHorizontal}
                                onClick={handleMore}
                                ariaLabel="Дополнительные действия"
                                variant={variant}
                            />
                        )}
                    </div>
                )}
            </div>
        </article>
    );
};




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

export default TrackCard;