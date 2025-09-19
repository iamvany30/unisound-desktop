
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useElectronWindow } from '../../hooks/useElectronWindow';
import { 
    Minimize2, 
    Square, 
    Maximize2, 
    X,
    MoreHorizontal 
} from 'lucide-react';
import './WindowControls.css';

const WindowControls = React.memo(() => {
    const { isElectron, isMaximized, minimize, maximize, close } = useElectronWindow();
    const { t } = useTranslation();
    
    
    const [isVisible, setIsVisible] = useState(true);
    const [isCompact, setIsCompact] = useState(false);
    const [showTooltips, setShowTooltips] = useState(false);
    
    
    useEffect(() => {
        let hideTimer;
        
        const handleMouseMove = () => {
            setIsVisible(true);
            clearTimeout(hideTimer);
            
            
            hideTimer = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        };
        
        
        
        
        return () => {
            clearTimeout(hideTimer);
            
        };
    }, []);
    
    
    useEffect(() => {
        const handleResize = () => {
            setIsCompact(window.innerWidth < 768);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    
    const handleMinimize = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        minimize?.();
    }, [minimize]);
    
    const handleMaximize = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        maximize?.();
    }, [maximize]);
    
    const handleClose = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        
        if (window.confirm?.(t('header.confirmClose', 'Вы уверены, что хотите закрыть приложение?'))) {
            close?.();
        } else {
            close?.();
        }
    }, [close, t]);
    
    
    const handleKeyDown = useCallback((e, action) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action(e);
        }
    }, []);
    
    
    if (!isElectron) {
        return null;
    }
    
    
    const containerClasses = [
        'window-controls',
        !isVisible && 'window-controls--hidden',
        isCompact && 'window-controls--compact'
    ].filter(Boolean).join(' ');
    
    return (
        <div 
            className={containerClasses}
            role="group" 
            aria-label={t('header.windowControls', 'Управление окном')}
            onMouseEnter={() => setShowTooltips(true)}
            onMouseLeave={() => setShowTooltips(false)}
        >
            <button
                className="window-control-btn minimize-btn"
                onClick={handleMinimize}
                onKeyDown={(e) => handleKeyDown(e, handleMinimize)}
                aria-label={t('header.minimize', 'Свернуть окно')}
                title={showTooltips ? t('header.minimize', 'Свернуть окно') : ''}
                type="button"
                tabIndex={0}
            >
                <Minimize2 
                    size={isCompact ? 12 : 14} 
                    strokeWidth={2}
                    aria-hidden="true"
                />
            </button>
            
            <button
                className="window-control-btn maximize-btn"
                onClick={handleMaximize}
                onKeyDown={(e) => handleKeyDown(e, handleMaximize)}
                aria-label={
                    isMaximized 
                        ? t('header.restore', 'Восстановить размер окна') 
                        : t('header.maximize', 'Развернуть окно')
                }
                title={
                    showTooltips 
                        ? (isMaximized 
                            ? t('header.restore', 'Восстановить размер окна')
                            : t('header.maximize', 'Развернуть окно'))
                        : ''
                }
                type="button"
                tabIndex={0}
            >
                {isMaximized ? (
                    <Square 
                        size={isCompact ? 12 : 14} 
                        strokeWidth={2}
                        aria-hidden="true"
                    />
                ) : (
                    <Maximize2 
                        size={isCompact ? 12 : 14} 
                        strokeWidth={2}
                        aria-hidden="true"
                    />
                )}
            </button>
            
            <button
                className="window-control-btn close-btn"
                onClick={handleClose}
                onKeyDown={(e) => handleKeyDown(e, handleClose)}
                aria-label={t('header.close', 'Закрыть приложение')}
                title={showTooltips ? t('header.close', 'Закрыть приложение') : ''}
                type="button"
                tabIndex={0}
            >
                <X 
                    size={isCompact ? 12 : 14} 
                    strokeWidth={2.5}
                    aria-hidden="true"
                />
            </button>
        </div>
    );
});

WindowControls.displayName = 'WindowControls';

export default WindowControls;