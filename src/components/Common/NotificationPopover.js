import React, { useRef, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Check, X } from 'lucide-react';
import './StatusBar.css';

const NotificationPopover = () => {
    const { notifications, closePopover, clearPersistent } = useNotification();
    const popoverRef = useRef(null);
    
    const persistentNotifications = notifications.filter(n => n.persistent);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                closePopover();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closePopover]);

    return (
        <div className="notification-popover" ref={popoverRef}>
            <header className="notification-popover__header">
                <h3 className="notification-popover__title">Уведомления</h3>
                {persistentNotifications.length > 0 && (
                     <button className="settings-button settings-button--secondary" style={{padding: '4px 8px', fontSize: '12px'}} onClick={clearPersistent}>
                        <X size={14} /> Очистить все
                    </button>
                )}
            </header>
            <div className="notification-popover__content">
                {persistentNotifications.length === 0 ? (
                    <div className="notification-popover__empty">
                        <Check size={32} />
                        <p>Новых уведомлений нет</p>
                    </div>
                ) : (
                    persistentNotifications.map(n => (
                         <div key={n.id} className="notification-popover-item">
                            {typeof n.content === 'function' ? n.content({ dismiss: () => {} }) : n.content}
                            {n.progress !== undefined && (
                                <div className="notification-progress-bar">
                                    <div className="notification-progress-bar__fill" style={{width: `${n.progress}%`}} />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationPopover;