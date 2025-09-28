import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { HardDrive, Music } from 'lucide-react';
import './Auth.css'; 

const BACKGROUND_IMAGES = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.jpg"];

const shuffleArray = (array) => Array.from(array).sort(() => Math.random() - 0.5);

const ImageLoadingIndicator = ({ isLoading }) => {
    if (!isLoading) return null;
    return (
        <div className="image-loading-overlay">
            <div className="loading-content">
                <div className="spinner"></div>
                <p>Подготовка сцены...</p>
            </div>
        </div>
    );
};

const ParticleSystem = React.memo(({ count = 8 }) => {
    const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
        id: i,
        size: Math.random() * 15 + 5,
        left: `${Math.random() * 100}%`,
        color: Math.random() > 0.5 ? 'var(--color-accent-primary)' : 'var(--color-accent-glow-2)'
    })), [count]);
    return <div className="auth-particles">{particles.map(p => <div key={p.id} className="particle" style={{ width: p.size, height: p.size, left: p.left, backgroundColor: p.color }} />)}</div>;
});

const BackgroundSlider = React.memo(({ images, interval = 8000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const shuffledImages = useMemo(() => shuffleArray(images), [images]);

    useEffect(() => {
        if (!shuffledImages.length) return setIsLoading(false);
        const imagePromises = shuffledImages.map(imgName => new Promise((resolve, reject) => {
            const img = new Image();
            img.src = `./back_auth/${imgName}`;
            img.onload = resolve;
            img.onerror = reject;
        }));
        Promise.all(imagePromises).finally(() => setTimeout(() => setIsLoading(false), 300));
    }, [shuffledImages]);

    useEffect(() => {
        if (isLoading || shuffledImages.length <= 1) return;
        const timer = setInterval(() => setCurrentIndex(prev => (prev + 1) % shuffledImages.length), interval);
        return () => clearInterval(timer);
    }, [isLoading, shuffledImages.length, interval]);

    return (
        <>
            <ImageLoadingIndicator isLoading={isLoading} />
            <div className="auth-bg-slider">
                {shuffledImages.map((imageName, index) => (
                    <div key={imageName} className={`auth-bg-image ${index === currentIndex && !isLoading ? 'visible' : ''}`} style={{ backgroundImage: `url(./back_auth/${imageName})` }} />
                ))}
            </div>
        </>
    );
});

const AuthLayout = ({ children }) => {
    const { enterOfflineMode } = useAuth();
    const navigate = useNavigate();
    const handleOfflineClick = useCallback(() => { enterOfflineMode(); navigate('/'); }, [enterOfflineMode, navigate]);

    return (
        <div className="auth-layout" role="main">
            <header className="auth-layout-header">
                <div className="auth-layout-logo"><Music size={24} /> UniSound</div>
            </header>
            <BackgroundSlider images={BACKGROUND_IMAGES} />
            <ParticleSystem />
            <div className="auth-content-wrapper">{children}</div>
            <div className="offline-access-container">
                 <button onClick={handleOfflineClick} className="offline-access-button"><HardDrive size={18} /><span>Оффлайн-доступ</span></button>
            </div>
        </div>
    );
};

export default AuthLayout;