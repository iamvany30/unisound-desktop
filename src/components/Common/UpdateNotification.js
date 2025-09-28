import React, { useState, useEffect } from 'react';


const DownloadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--spacing-sm)' }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--spacing-sm)' }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
const AlertTriangleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--spacing-sm)' }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);
const RestartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v6h6"></path><path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
        <path d="M21 22v-6h-6"></path><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
    </svg>
);



const UpdateNotification = () => {
    
    const isElectron = !!window.electronAPI;

    const [status, setStatus] = useState('idle');
    const [updateInfo, setUpdateInfo] = useState(null);
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const [isHovered, setIsHovered] = useState({ primary: false, secondary: false });

    useEffect(() => {
        if (!isElectron) return;

        const unsubscribe = window.electronAPI.onUpdateMessage(({ msg, info, error, progress: progressData }) => {
            switch (msg) {
                case 'available': setStatus('available'); setUpdateInfo(info); break;
                case 'download-progress': setStatus('downloading'); setProgress(progressData.percent); break;
                case 'downloaded': setStatus('downloaded'); break;
                case 'error': setStatus('error'); setErrorMessage(error || 'Произошла неизвестная ошибка.'); break;
                case 'checking': setStatus('checking'); break;
                case 'not-available': setStatus('idle'); break;
                default: break;
            }
        });

        return () => unsubscribe();
    }, [isElectron]);

    useEffect(() => {
        
        setVisible(status !== 'idle' && status !== 'checking');
    }, [status]);


    const handleDownload = () => window.electronAPI.startDownload();
    const handleInstall = () => window.electronAPI.quitAndInstall();
    const dismissNotification = () => setStatus('idle');

    if (!isElectron) return null;

    
    const styles = getStyles(isHovered);
    const containerStyle = {
        ...styles.container,
        transform: visible ? 'translateY(0)' : 'translateY(var(--spacing-xl))',
        opacity: visible ? 1 : 0,
    };

    const renderContent = () => {
        switch (status) {
            case 'available': return (
                <>
                    <div style={styles.header}>
                        <DownloadIcon />
                        <span style={styles.title}>Доступно обновление</span>
                    </div>
                    <p style={styles.body}>Новая версия <strong>{updateInfo?.version}</strong> готова к загрузке.</p>
                    <div style={styles.buttonGroup}>
                        <button style={styles.buttonSecondary} onClick={dismissNotification} onMouseEnter={() => setIsHovered({...isHovered, secondary: true})} onMouseLeave={() => setIsHovered({...isHovered, secondary: false})}>Позже</button>
                        <button style={styles.buttonPrimary} onClick={handleDownload} onMouseEnter={() => setIsHovered({...isHovered, primary: true})} onMouseLeave={() => setIsHovered({...isHovered, primary: false})}>Скачать</button>
                    </div>
                </>
            );
            case 'downloading': return (
                <>
                    <div style={styles.header}>
                        <span style={styles.title}>Загрузка обновления...</span>
                        <span style={styles.progressText}>{Math.round(progress)}%</span>
                    </div>
                    <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${progress}%` }}></div>
                    </div>
                </>
            );
            case 'downloaded': return (
                <>
                    <div style={styles.header}>
                        <CheckCircleIcon />
                        <span style={styles.title}>Обновление готово!</span>
                    </div>
                    <p style={styles.body}>Перезапустите UniSound, чтобы применить изменения.</p>
                    <div style={styles.buttonGroup}>
                        <button style={styles.buttonPrimary} onClick={handleInstall} onMouseEnter={() => setIsHovered({...isHovered, primary: true})} onMouseLeave={() => setIsHovered({...isHovered, primary: false})}>
                            <RestartIcon />
                            <span>Перезапустить</span>
                        </button>
                    </div>
                </>
            );
            case 'error': return (
                <>
                     <div style={styles.header}>
                        <AlertTriangleIcon />
                        <span style={styles.title}>Ошибка обновления</span>
                    </div>
                    <p style={styles.errorMessage}>{errorMessage}</p>
                    <div style={styles.buttonGroup}>
                        <button style={styles.buttonSecondary} onClick={dismissNotification} onMouseEnter={() => setIsHovered({...isHovered, secondary: true})} onMouseLeave={() => setIsHovered({...isHovered, secondary: false})}>Закрыть</button>
                    </div>
                </>
            );
            default: return null;
        }
    };
    
    return <div style={containerStyle}>{renderContent()}</div>;
};


const getStyles = (isHovered) => ({
    container: {
        position: 'fixed',
        bottom: 'var(--spacing-lg)',
        right: 'var(--spacing-lg)',
        width: '360px',
        fontFamily: 'var(--font-family-sans)',
        zIndex: 'var(--z-index-toast)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        
        
        backgroundColor: 'var(--color-glass-background-subtle)',
        backdropFilter: 'var(--backdrop-filter-glass-strong)',
        WebkitBackdropFilter: 'var(--backdrop-filter-glass-strong)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--player-border)',
        boxShadow: 'var(--shadow-modal)',
        
        
        transition: 'transform var(--transition-slow), opacity var(--transition-slow)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        color: 'var(--color-text-primary)',
    },
    title: {
        fontSize: 'var(--font-size-base)',
        fontWeight: 'var(--font-weight-semibold)',
    },
    body: {
        margin: '0',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        lineHeight: 1.5,
    },
    errorMessage: {
        margin: '0',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-error)',
        lineHeight: 1.5,
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--spacing-sm)',
        marginTop: 'var(--spacing-sm)',
    },
    buttonPrimary: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: isHovered.primary ? 'var(--color-accent-primary-hover)' : 'var(--color-accent-primary)',
        color: 'var(--color-text-on-accent)',
        border: 'none',
        borderRadius: 'var(--border-radius-md)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-semibold)',
        transition: 'background-color var(--transition-fast)',
    },
    buttonSecondary: {
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: isHovered.secondary ? 'var(--color-background-interactive-hover)' : 'var(--color-background-interactive)',
        color: 'var(--color-text-secondary)',
        border: 'none',
        borderRadius: 'var(--border-radius-md)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-medium)',
        transition: 'background-color var(--transition-fast)',
    },
    progressText: {
        marginLeft: 'auto',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-tertiary)',
        fontWeight: 'var(--font-weight-medium)',
    },
    progressBar: {
        height: '6px',
        width: '100%',
        backgroundColor: 'var(--player-progress-bar-inactive)',
        borderRadius: 'var(--border-radius-full)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'var(--color-accent-primary)',
        borderRadius: 'var(--border-radius-full)',
        transition: 'width var(--transition-medium)',
    },
});

export default UpdateNotification;