import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Notification.css';

const ICONS = {
    success: <CheckCircle />,
    error: <AlertCircle />,
    warning: <AlertTriangle />,
    info: <Info />,
};

const NotificationToast = ({ notification, onDismiss }) => {
    const { id, content, type, duration } = notification;
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(id), 300);
    }, [id, onDismiss]);

    useEffect(() => {
        if (duration === null) return;

        const timer = setTimeout(() => {
            handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, handleDismiss]);


    const Icon = useMemo(() => ICONS[type] || ICONS.info, [type]);

    const renderContent = () => {
        if (typeof content === 'function') {
            return content({ dismiss: handleDismiss });
        }
        if (typeof content === 'string') {
            return <p className="notification-toast__message">{content}</p>;
        }
        return content;
    };

    return (
        <div className={`notification-toast notification-toast--${type} ${isExiting ? 'exiting' : ''}`}>
            <div className="notification-toast__icon">{Icon}</div>
            <div className="notification-toast__content">
                {renderContent()}
            </div>
            <button className="notification-toast__close-button" onClick={handleDismiss} aria-label="Закрыть уведомление">
                <X size={18} />
            </button>
        </div>
    );
};

export default React.memo(NotificationToast);