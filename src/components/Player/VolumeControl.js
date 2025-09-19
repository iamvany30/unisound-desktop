
import React from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

const e = React.createElement;

const VolumeControl = () => {
    const { volume, setVolume } = usePlayer();

    const getVolumeIcon = () => {
        if (volume === 0) return e(VolumeX, { size: 20 });
        if (volume < 0.5) return e(Volume1, { size: 20 });
        return e(Volume2, { size: 20 });
    };

    return e('div', { className: 'volume-control-container' },
        getVolumeIcon(),
        e('input', {
            type: 'range',
            className: 'volume-slider',
            min: 0,
            max: 1,
            step: 0.01,
            value: volume,
            onChange: (e) => setVolume(parseFloat(e.target.value)),
            'aria-label': 'Volume Control'
        })
    );
};

export default VolumeControl;