import React from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { usePlayer } from '../hooks/usePlayer';

import WaveHero from '../components/Home/WaveHero';
import TrackCard from '../components/Track/TrackCard';
import { LoaderCircle } from 'lucide-react';

import './HomePage.css';


const StatCard = ({ icon: Icon, value, label }) => {
    return (
        <div className="stat-card">
            <div className="stat-card-header"><Icon size={24} /></div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
        </div>
    );
};

const HomePage = () => {
    const { t } = useTranslation('home');
    const player = usePlayer();

    const [recommendedTracks, setRecommendedTracks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchHomePageData = async () => {
            try {
                const highlights = await api.highlights.getHome();
                if (highlights?.personal_wave_mix?.tracks) {
                    setRecommendedTracks(highlights.personal_wave_mix.tracks);
                }
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

    return (
        <div className="home-page-content">
            <WaveHero 
                onPlayWave={player.startWave} 
                isPlaying={player.isPlaying && player.isWaveMode}
                title={t('waveHero.myWave')}
            />

            {loading ? (
                <div className="status-message"><LoaderCircle className="animate-spin" /></div>
            ) : error ? (
                <div className="status-message error">{error}</div>
            ) : (
                <>
                    {recommendedTracks.length > 0 && (
                        <section>
                            <h2 className="section-title">{t('recommendations')}</h2>
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
                    )}
                </>
            )}
        </div>
    );
};

export default HomePage;