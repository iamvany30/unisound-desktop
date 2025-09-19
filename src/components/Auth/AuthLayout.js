import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, ArrowLeft } from 'lucide-react';
import './AuthLayout.css';

const BACKGROUND_IMAGES = [
    "1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "12.jpg", "13.jpg",
    "14.jpg", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.jpg"
];

const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const ImageLoadingIndicator = ({ isLoading, progress }) => {
    if (!isLoading) return null;
    
    return (
        <div className="image-loading-overlay">
            <div className="loading-content">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
                <p>Загрузка фона... {Math.round(progress)}%</p>
            </div>
        </div>
    );
};

const ParticleSystem = ({ particleCount = 8 }) => {
    const particles = useMemo(() => {
        return Array.from({ length: particleCount }, (_, index) => ({
            id: index,
            size: Math.random() * 15 + 5,
            initialX: Math.random() * 100,
            initialY: Math.random() * 100,
            duration: Math.random() * 10 + 15,
            delay: Math.random() * 5,
            color: Math.random() > 0.5 ? 'var(--color-accent-primary)' : 'var(--color-accent-glow-2)'
        }));
    }, [particleCount]);

    return (
        <div className="auth-particles">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="particle"
                    style={{
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        left: `${particle.initialX}%`,
                        top: `${particle.initialY}%`,
                        backgroundColor: particle.color,
                        animationDuration: `${particle.duration}s`,
                        animationDelay: `${particle.delay}s`
                    }}
                />
            ))}
        </div>
    );
};

const BackgroundSlider = ({ images, interval = 6000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const shuffledImages = useMemo(() => shuffleArray(images), [images]);

    useEffect(() => {
        if (!shuffledImages.length) {
            setIsLoading(false);
            return;
        }

        let loadedCount = 0;
        const totalImages = shuffledImages.length;

        shuffledImages.forEach((imageName) => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                setLoadingProgress((loadedCount / totalImages) * 100);
                if (loadedCount === totalImages) {
                    setTimeout(() => setIsLoading(false), 300); 
                }
            };
            img.onerror = () => {
                loadedCount++;
                console.warn(`Не удалось загрузить фоновое изображение: ${imageName}`);
                if (loadedCount === totalImages) {
                    setTimeout(() => setIsLoading(false), 300);
                }
            };
            img.src = `./back_auth/${imageName}`;
        });
    }, [shuffledImages]);

    useEffect(() => {
        if (isLoading || shuffledImages.length <= 1) return;

        const intervalId = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % shuffledImages.length);
        }, interval);

        return () => clearInterval(intervalId);
    }, [isLoading, shuffledImages.length, interval]);

    return (
        <>
            <ImageLoadingIndicator isLoading={isLoading} progress={loadingProgress} />
            <div className="auth-bg-slider">
                {shuffledImages.map((imageName, index) => (
                    <div
                        key={`${imageName}-${index}`}
                        className={`auth-bg-image ${index === currentIndex && !isLoading ? 'visible' : ''}`}
                        style={{ backgroundImage: `url(./back_auth/${imageName})` }}
                        role="img"
                        aria-label={`Фоновое изображение ${index + 1}`}
                    />
                ))}
            </div>
        </>
    );
};

const AuthLayout = ({ children }) => {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    return (
        <div className="auth-layout" role="main">
            <header className="auth-layout-header">
                <Link to="/" className="auth-layout-logo" aria-label="На главную">
                    <Music size={28} />
                    <span>UniSound</span>
                </Link>
            </header>
            
            <BackgroundSlider images={BACKGROUND_IMAGES} />
            <ParticleSystem />

            <div id="main-content" className="auth-content-wrapper">
                <div className="auth-content-container">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;