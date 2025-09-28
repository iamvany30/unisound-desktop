import React from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import { useTranslation } from 'react-i18next';

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const ProgressBar = () => {
    const { progress, duration, seek } = usePlayer();
    const { t } = useTranslation('player');

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    return (
        <div className="progress-bar-wrapper">
            <span className="time-display-outside current">{formatTime(progress)}</span>
            <input
                type="range"
                className="progress-slider"
                min={0}
                max={duration || 0}
                value={progress || 0}
                onChange={(e) => seek(parseFloat(e.target.value))}
                
                aria-label={t('trackProgress')}
                style={{ '--progress-percent': `${progressPercent}%` }}
            />
            <span className="time-display-outside duration">{formatTime(duration)}</span>
        </div>
    );
};

export default ProgressBar;