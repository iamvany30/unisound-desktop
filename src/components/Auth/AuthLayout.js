
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, ArrowLeft } from 'lucide-react';
import './AuthLayout.css';


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



const ParticleSystem = ({ particleCount = 8, isActive = true }) => {
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

    if (!isActive) return null;

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


const BackgroundSlider = ({ images, interval = 6000, enableTransitions = true }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    
    useEffect(() => {
        if (!images.length) return;

        const preloadImages = async () => {
            setIsLoading(true);
            const promises = images.map((imageName, index) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        setLoadedImages(prev => new Set([...prev, imageName]));
                        setLoadingProgress((index + 1) / images.length * 100);
                        resolve(imageName);
                    };
                    img.onerror = reject;
                    img.src = `./back_auth/${imageName}`; 
                });
            });

            try {
                await Promise.all(promises);
                setTimeout(() => setIsLoading(false), 500); 
            } catch (error) {
                console.error('Ошибка загрузки изображений:', error);
                setIsLoading(false);
            }
        };

        preloadImages();
    }, [images]);

    
    useEffect(() => {
        if (!enableTransitions || images.length <= 1 || isLoading) return;

        const intervalId = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
        }, interval);

        return () => clearInterval(intervalId);
    }, [images.length, interval, enableTransitions, isLoading]);

    if (!images.length) {
        return <div className="auth-bg-slider fallback-bg" />;
    }

    return (
        <>
            <ImageLoadingIndicator isLoading={isLoading} progress={loadingProgress} />
            <div className="auth-bg-slider">
                {images.map((imageName, index) => (
                    <div
                        key={`${imageName}-${index}`}
                        className={`auth-bg-image ${
                            index === currentIndex && !isLoading ? 'visible' : ''
                        }`}
                        style={{ 
                            backgroundImage: `url(./back_auth/${imageName})`,
                            zIndex: index === currentIndex ? 1 : 0
                        }}
                        role="img"
                        aria-label={`Фоновое изображение ${index + 1}`}
                    />
                ))}
            </div>
        </>
    );
};


const AuthLayout = ({ 
    children, 
    showParticles = true,
    particleCount = 8,
    backgroundInterval = 6000,
    enableBackgroundTransitions = true 
}) => {
    const [backgroundImages, setBackgroundImages] = useState([]);
    const [error, setError] = useState(null);

    
    const fetchBackgroundImages = useCallback(async () => {
        try {
            const response = await fetch('/back_auth/manifest.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                setBackgroundImages(shuffleArray(data.images));
            } else {
                
                setBackgroundImages(['1.jpg', '2.jpg', '3.jpg']);
            }
        } catch (error) {
            console.error('Не удалось загрузить манифест фоновых изображений:', error);
            setError(error.message);
            
            setBackgroundImages(['1.jpg']);
        }
    }, []);

    useEffect(() => {
        fetchBackgroundImages();
    }, [fetchBackgroundImages]);

    return (
        <div className="auth-layout" role="main">



            <BackgroundSlider 
                images={backgroundImages}
                interval={backgroundInterval}
                enableTransitions={enableBackgroundTransitions}
            />

            <ParticleSystem 
                particleCount={particleCount} 
                isActive={showParticles} 
            />

            <div id="main-content" className="auth-content-wrapper">
                <div className="auth-content-container">
                    {children}
                </div>
            </div>

            {error && (
                <div className="error-toast" role="alert">
                    <p>Проблема с загрузкой фона: {error}</p>
                </div>
            )}
        </div>
    );
};

export default AuthLayout;