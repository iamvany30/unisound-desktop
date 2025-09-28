import React from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import { useTranslation } from 'react-i18next';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';

const PlayerControls = () => { 
    const { isPlaying, isShuffle, repeatMode, togglePlay, playNext, playPrev, toggleShuffle, toggleRepeat } = usePlayer();
    const { t } = useTranslation('player');
    const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

    return (
        <div className="player-buttons">
            <button className={`control-btn ${isShuffle ? 'active' : ''}`} onClick={toggleShuffle} aria-label={t('shuffle')}><Shuffle size={20} /></button>
            <button className="control-btn" onClick={playPrev} aria-label={t('previousTrack')}><SkipBack size={20} /></button>
            <button className="control-btn play-pause-btn--main" onClick={togglePlay} aria-label={isPlaying ? t('pause') : t('play')}>{isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}</button>
            <button className="control-btn" onClick={playNext} aria-label={t('nextTrack')}><SkipForward size={20} /></button>
            <button className={`control-btn ${repeatMode !== 'off' ? 'active' : ''}`} onClick={toggleRepeat} aria-label={t('repeat')}><RepeatIcon size={20} /></button>
        </div>
    );
};

export default PlayerControls;