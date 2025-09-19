
import React from 'react';

const e = React.createElement;

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const ProgressBar = ({ progress, duration, onSeek }) => {
    const handleSeek = (e) => {
        onSeek(parseFloat(e.target.value));
    };

    const progressPercent = (duration > 0) ? (progress / duration) * 100 : 0;

    
    return e('div', { className: 'progress-bar-wrapper' },
        e('span', { className: 'time-display-outside current' }, formatTime(progress)),
        e('input', {
            type: 'range',
            className: 'progress-slider-new',
            min: 0,
            max: duration || 0,
            value: progress || 0,
            onChange: handleSeek,
            'aria-label': 'Track Progress',
            
            style: { '--progress-percent': `${progressPercent}%` }
        }),
        e('span', { className: 'time-display-outside duration' }, formatTime(duration))
    );
};

export default ProgressBar;