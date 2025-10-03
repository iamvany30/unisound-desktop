import React, { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

const UpdateNotificationActions = ({ onDownload, onDismiss }) => (
    <div className="notification-toast__actions">
        <button className="notification-toast__action-button notification-toast__action-button--secondary" onClick={onDismiss}>Позже</button>
        <button className="notification-toast__action-button notification-toast__action-button--primary" onClick={onDownload}>Скачать</button>
    </div>
);

const InstallNotificationActions = ({ onInstall, onDismiss }) => (
    <div className="notification-toast__actions">
        <button className="notification-toast__action-button notification-toast__action-button--secondary" onClick={onDismiss}>Позже</button>
        <button className="notification-toast__action-button notification-toast__action-button--primary" onClick={onInstall}>Перезапустить</button>
    </div>
);

export const useUpdateNotifier = () => {
    const { addNotification, updateNotification, removeNotification } = useNotification();

    useEffect(() => {
        const isElectron = !!window.electronAPI;
        if (!isElectron) return;

        const handleUpdateMessage = ({ msg, info, error, progress: progressData }) => {
            switch (msg) {
                case 'available':
                    addNotification({
                        id: 'update-available',
                        type: 'info',
                        persistent: true,
                        duration: null,
                        content: ({ dismiss }) => (
                            <div>
                                <p className="notification-toast__message">Доступна новая версия: <strong>{info?.version}</strong></p>
                                <UpdateNotificationActions
                                    onDismiss={dismiss}
                                    onDownload={() => {
                                        window.electronAPI.startDownload();
                                        dismiss();
                                    }}
                                />
                            </div>
                        ),
                    });
                    break;
                
                case 'download-progress':
                    addNotification({
                        id: 'update-downloading',
                        type: 'info',
                        persistent: true,
                        duration: null,
                        content: `Загрузка обновления... ${Math.round(progressData.percent)}%`,
                        progress: progressData.percent,
                    });
                    break;

                case 'downloaded':
                    removeNotification('update-downloading');
                    addNotification({
                        id: 'update-downloaded',
                        type: 'success',
                        persistent: true,
                        duration: null,
                        content: ({ dismiss }) => (
                           <div>
                                <p className="notification-toast__message">Обновление готово к установке!</p>
                                <InstallNotificationActions
                                    onDismiss={dismiss}
                                    onInstall={() => window.electronAPI.quitAndInstall()}
                               />
                           </div>
                        ),
                    });
                    break;
                
                case 'error':
                    addNotification({
                        content: `Ошибка обновления: ${error || 'Неизвестная ошибка.'}`,
                        type: 'error',
                        persistent: false
                    });
                    break;

                default:
                    break;
            }
        };

        const unsubscribe = window.electronAPI.onUpdateMessage(handleUpdateMessage);

        return () => unsubscribe();
    }, [addNotification, updateNotification, removeNotification]);
};