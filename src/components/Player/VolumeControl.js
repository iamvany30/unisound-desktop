import React from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import { useTranslation } from 'react-i18next';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

const VolumeControl = () => {
    const { volume, setVolume, toggleMute } = usePlayer();
    const { t } = useTranslation('player');

    const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    return (
        <div className="volume-control-container">
            <button className="control-btn" onClick={toggleMute} aria-label={t('volume')}>
                <VolumeIcon size={20} />
            </button>
            <input type="range" className="volume-slider responsive-hide" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} aria-label={t('volume')} />
        </div>
    );
};

export default VolumeControl;