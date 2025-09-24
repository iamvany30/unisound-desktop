
import React, { useState, useEffect } from 'react';

const UpdateNotification = () => {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState(''); 

    useEffect(() => {
        const unsubscribe = window.electronAPI.onUpdateMessage(({ msg, info, error, progress }) => {
            switch (msg) {
                case 'checking':
                    setStatus('checking');
                    break;
                case 'available':
                    setStatus('available');
                    setUpdateInfo(info);
                    break;
                case 'not-available':
                    setStatus('idle');
                    break;
                case 'progress':
                    setStatus('downloading');
                    setProgress(progress.percent);
                    break;
                case 'downloaded':
                    setStatus('downloaded');
                    break;
                case 'error':
                    setStatus('error');
                    setErrorMessage(error || 'Произошла неизвестная ошибка.'); 
                    break;
                default:
                    break;
            }
        });

        return () => unsubscribe();
    }, []);

    const handleDownload = () => window.electronAPI.startDownload();
    const handleInstall = () => window.electronAPI.quitAndInstall();

    const dismissError = () => {
        setStatus('idle');
        setErrorMessage('');
    };

    if (status === 'idle' || status === 'checking') return null;

    return (
        <div style={styles.container}>
            {status === 'available' && (
                <>
                    <p>Доступна новая версия {updateInfo?.version}!</p>
                    <button onClick={handleDownload} style={styles.button}>Скачать</button>
                    <button onClick={() => setStatus('idle')} style={styles.buttonSecondary}>Позже</button>
                </>
            )}
            {status === 'downloading' && (
                <div style={styles.progressContainer}>
                    <p>Загрузка... {Math.round(progress)}%</p>
                    <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
            {status === 'downloaded' && (
                <>
                    <p>Обновление готово к установке.</p>
                    <button onClick={handleInstall} style={styles.button}>Перезапустить и установить</button>
                </>
            )}
            {status === 'error' && (
                 <div style={styles.errorContainer}>
                    <p style={{ fontWeight: 'bold' }}>Ошибка при обновлении.</p>
                    <p style={styles.errorMessage}>{errorMessage}</p>
                    <button onClick={dismissError} style={styles.buttonSecondary}>Закрыть</button>
                 </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#2d333b',
        color: '#e6edf3',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 10000,
        maxWidth: '350px',
    },
    button: {
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '5px',
        cursor: 'pointer',
        marginRight: '10px'
    },
    buttonSecondary: {
        backgroundColor: '#484f58',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    progressContainer: { width: '100%' },
    progressBar: { height: '8px', backgroundColor: '#484f58', borderRadius: '4px', overflow: 'hidden', marginTop: '5px' },
    progressFill: { height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.2s' },
    errorContainer: { display: 'flex', flexDirection: 'column', gap: '5px' },
    errorMessage: { fontSize: '0.9em', color: '#ff7b72', margin: '5px 0' }
};

export default UpdateNotification;