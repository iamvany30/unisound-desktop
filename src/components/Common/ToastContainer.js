import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import NotificationToast from './NotificationToast';
import './Notification.css';

const ToastContainer = () => {
    const { notifications, removeNotification } = useNotification();
    const toasts = notifications.filter(n => !n.persistent);

    return (
        <div className="notification-container">
            {toasts.map(notification => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onDismiss={removeNotification}
                />
            ))}
        </div>
    );
};

export default ToastContainer;