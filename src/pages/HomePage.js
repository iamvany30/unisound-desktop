import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { usePlayer } from '../hooks/usePlayer';

import WaveHero from '../components/Home/WaveHero';
import TrackCard from '../components/Track/TrackCard';
import { LoaderCircle, Music, WifiOff } from 'lucide-react';

import './HomePage.css';


const TrackCardSkeleton = () => (
    <div className="track-card-skeleton">
        <div className="skeleton-block artwork"></div>
        <div className="skeleton-block line" style={{ width: '80%' }}></div>
        <div className="skeleton-block line" style={{ width: '50%' }}></div>
    </div>
);

const HomePage = () => {
    const { t } = useTranslation('home');
    const player = usePlayer();

    const [recommendedTracks, setRecommendedTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHomePageData = async () => {
            setLoading(true);
            setError(null);
            try {
                const highlights = await api.highlights.getHome();
                setRecommendedTracks(highlights?.personal_wave_mix?.tracks || []);
            } catch (err) {
                console.error("Failed to load home page data:", err);
                setError(t('loadError'));
            } finally {
                setLoading(false);
            }
        };

        fetchHomePageData();
    }, [t]);

    const handlePlayRecommendation = (track) => {
        player.playTrack(track, recommendedTracks);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <section>
                    <div className="section-title skeleton-title skeleton-block"></div>
                    <div className="track-grid">
                        {[...Array(6)].map((_, i) => <TrackCardSkeleton key={i} />)}
                    </div>
                </section>
            );
        }

        if (error) {
            return <div className="status-message error"><WifiOff size={32} />{error}</div>;
        }

        if (recommendedTracks.length > 0) {
            return (
                <section>
                    <h2 className="section-title"><Music size={28} />{t('recommendations')}</h2>
                    <div className="track-grid">
                        {recommendedTracks.map(track => (
                            <TrackCard
                                key={track.uuid}
                                track={track}
                                isPlaying={player.currentTrack?.uuid === track.uuid && player.isPlaying}
                                onPlay={() => handlePlayRecommendation(track)}
                            />
                        ))}
                    </div>
                </section>
            );
        }

        return null; 
    };

    return (
        <div className="home-page-content">
            <WaveHero 
                onPlayWave={player.startWave} 
                isPlaying={player.isPlaying && player.isWaveMode}
                title={t('waveHero.myWave')}
            />
            {renderContent()}
        </div>
    );
};

export default HomePage;