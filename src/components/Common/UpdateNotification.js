
import React, { useState, useEffect } from 'react';

const UpdateNotification = () => {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('idle'); 

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
                    console.error("Update Error:", error);
                    break;
                default:
                    break;
            }
        });

        
        return () => unsubscribe();
    }, []);

    const handleDownload = () => {
        window.electronAPI.startDownload();
    };

    const handleInstall = () => {
        window.electronAPI.quitAndInstall();
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
                        <div style={{...styles.progressFill, width: `${progress}%`}}></div>
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
                 <p>Ошибка при обновлении. Попробуйте позже.</p>
            )}
        </div>
    );
};


const styles = {};

export default UpdateNotification;