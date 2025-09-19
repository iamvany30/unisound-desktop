
import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Heart } from 'lucide-react';

const e = React.createElement;


const PlayerControls = ({ player }) => {
    
    
    const { 
        isPlaying, isShuffle, repeatMode, isCurrentTrackLiked,
        togglePlay, playNext, playPrev, toggleShuffle, toggleRepeat, toggleLike 
    } = player;
    
    
    const RepeatIcon = () => {
        if (repeatMode === 'one') return e(Repeat1, { size: 20 });
        return e(Repeat, { size: 20 });
    };

    return e('div', { className: 'player-buttons' },
        e('button', {
            className: `control-btn like-btn ${isCurrentTrackLiked ? 'active' : ''}`,
            onClick: toggleLike,
            'aria-label': 'Like or unlike track'
        }, e(Heart, { size: 20, fill: isCurrentTrackLiked ? 'currentColor' : 'none' })),

        e('button', { 
            className: `control-btn secondary ${isShuffle ? 'active' : ''}`, 
            onClick: toggleShuffle,
            'aria-label': 'Shuffle' 
        }, e(Shuffle, { size: 20 })),

        e('button', { className: 'control-btn secondary', onClick: playPrev, 'aria-label': 'Previous Track' }, e(SkipBack, { size: 20 })),
        
        e('button', { className: 'control-btn play-pause-btn--main', onClick: togglePlay, 'aria-label': isPlaying ? 'Pause' : 'Play' },
            isPlaying ? e(Pause, { size: 24, fill: 'currentColor' }) : e(Play, { size: 24, fill: 'currentColor' })
        ),
        
        e('button', { className: 'control-btn secondary', onClick: playNext, 'aria-label': 'Next Track' }, e(SkipForward, { size: 20 })),

        e('button', { 
            className: `control-btn secondary ${repeatMode !== 'off' ? 'active' : ''}`, 
            onClick: toggleRepeat, 
            'aria-label': 'Repeat' 
        }, e(RepeatIcon))
    );
};

export default PlayerControls;