
import React from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';

const PlayerControls = () => { 
    
    const { 
        isPlaying,
        isShuffle,
        repeatMode,
        togglePlay,
        playNext,
        playPrev,
        toggleShuffle,
        toggleRepeat
    } = usePlayer();
    
    const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

    return (
        <div className="player-buttons">
            <button 
                className={`control-btn secondary ${isShuffle ? 'active' : ''}`} 
                onClick={toggleShuffle}
                aria-label="Перемешать"
            >
                <Shuffle size={20} />
            </button>

            <button className="control-btn secondary" onClick={playPrev} aria-label="Предыдущий трек">
                <SkipBack size={20} />
            </button>
            
            <button className="control-btn play-pause-btn--main" onClick={togglePlay} aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}>
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <button className="control-btn secondary" onClick={playNext} aria-label="Следующий трек">
                <SkipForward size={20} />
            </button>

            <button 
                className={`control-btn secondary ${repeatMode !== 'off' ? 'active' : ''}`} 
                onClick={toggleRepeat} 
                aria-label="Повтор"
            >
                <RepeatIcon size={20} />
            </button>
        </div>
    );
};

export default PlayerControls;