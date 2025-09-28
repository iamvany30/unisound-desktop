import React from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import Player from '../Player/Player'; 
import NowPlayingPage from '../../pages/NowPlayingPage'; 
import './PlayerBar.css';

const PlayerBar = () => {
    const { isNowPlayingOpen, currentTrack } = usePlayer();

    if (!currentTrack) {
        return null;
    }

    const containerClasses = [
        'unified-player-container',
        'glass-system-component',
        isNowPlayingOpen && 'open'
    ].filter(Boolean).join(' ');

    
    return (
        <div className="player-bar-container">
            <div 
                className={containerClasses}
                role="region"
                aria-label="Music Player"
                aria-expanded={isNowPlayingOpen}
            >
                <div 
                    className="now-playing-wrapper"
                    aria-hidden={!isNowPlayingOpen}
                    style={{ pointerEvents: isNowPlayingOpen ? 'auto' : 'none' }}
                >
                    <NowPlayingPage />
                </div>
                <div 
                    className="player-wrapper"
                    aria-hidden={isNowPlayingOpen}
                    style={{ pointerEvents: !isNowPlayingOpen ? 'auto' : 'none' }}
                >
                    <Player />
                </div>
            </div>
        </div>
    );
};

export default PlayerBar;