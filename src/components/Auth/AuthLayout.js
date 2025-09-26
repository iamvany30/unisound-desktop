import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { HardDrive } from 'lucide-react';
import './AuthLayout.css';
import DraggableTopBar from '../Common/DraggableTopBar'; 

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

const ImageLoadingIndicator = ({ isLoading }) => {
    if (!isLoading) return null;
    return (
        <div className="image-loading-overlay">
            <div className="loading-content">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
                <p>Подготовка сцены...</p>
            </div>
        </div>
    );
};

const ParticleSystem = React.memo(({ particleCount = 8 }) => {
    const particles = useMemo(() => Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        size: Math.random() * 15 + 5,
        left: `${Math.random() * 100}%`,
        duration: `${Math.random() * 10 + 15}s`,
        delay: `${Math.random() * 5}s`,
        color: Math.random() > 0.5 ? 'var(--color-accent-primary)' : 'var(--color-accent-glow-2)'
    })), [particleCount]);

    return (
        <div className="auth-particles">
            {particles.map(p => <div key={p.id} className="particle" style={{ width: p.size, height: p.size, left: p.left, backgroundColor: p.color, animationDuration: p.duration, animationDelay: p.delay }} />)}
        </div>
    );
});

const BackgroundSlider = React.memo(({ images, interval = 7000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    const shuffledImages = useMemo(() => shuffleArray(images), [images]);

    useEffect(() => {
        if (!shuffledImages.length) {
            setIsLoading(false);
            return;
        }
        Promise.all(shuffledImages.map(imgName => {
            const img = new Image();
            img.src = `./back_auth/${imgName}`;
            return img.decode();
        })).then(() => {
            setTimeout(() => setIsLoading(false), 300);
        }).catch(err => {
            console.warn("Не удалось предзагрузить все фоновые изображения:", err);
            setIsLoading(false);
        });
    }, [shuffledImages]);

    useEffect(() => {
        if (isLoading || shuffledImages.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % shuffledImages.length);
        }, interval);
        return () => clearInterval(timer);
    }, [isLoading, shuffledImages.length, interval]);

    return (
        <>
            <ImageLoadingIndicator isLoading={isLoading} />
            <div className="auth-bg-slider">
                {shuffledImages.map((imageName, index) => (
                    <div
                        key={imageName}
                        className={`auth-bg-image ${index === currentIndex && !isLoading ? 'visible' : ''}`}
                        style={{ backgroundImage: `url(./back_auth/${imageName})` }}
                        role="img"
                        aria-label={`Фоновое изображение ${index + 1}`}
                    />
                ))}
            </div>
        </>
    );
});

const AuthLayout = ({ children }) => {
    const { enterOfflineMode } = useAuth();
    const navigate = useNavigate();

    const handleOfflineClick = useCallback(() => {
        enterOfflineMode();
        navigate('/'); 
    }, [enterOfflineMode, navigate]);

    return (
        <div className="auth-layout" role="main">
            
            <DraggableTopBar />

            <BackgroundSlider images={BACKGROUND_IMAGES} />
            <ParticleSystem />

            <div id="main-content" className="auth-content-wrapper">
                <div className="auth-content-container">
                    {children}
                </div>
            </div>
            
            <div className="offline-access-container">
                 <button onClick={handleOfflineClick} className="offline-access-button">
                     <HardDrive size={18} />
                     <span>Оффлайн-доступ</span>
                 </button>
            </div>

        </div>
    );
};

export default AuthLayout;