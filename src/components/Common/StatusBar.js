import React from 'react';
import { useStatus } from '../../context/StatusContext';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle, AlertTriangle, WifiOff, Bell } from 'lucide-react';
import NotificationPopover from './NotificationPopover';
import './StatusBar.css';

const statusConfig = {
    online: { Icon: CheckCircle, className: 'status-bar--online' },
    degraded: { Icon: AlertTriangle, className: 'status-bar--degraded' },
    offline: { Icon: WifiOff, className: 'status-bar--offline' }
};

const StatusBar = () => {
    const { status } = useStatus();
    const { notifications, isPopoverOpen, togglePopover } = useNotification();
    const { Icon, className } = statusConfig[status];

    const persistentCount = notifications.filter(n => n.persistent).length;

    return (
        <div className="status-bar-container">
            <button className={`status-bar-trigger ${className}`} onClick={togglePopover}>
                <Icon size={14} className="status-icon" />
                <div className={`notification-bell ${persistentCount > 0 ? 'active' : ''}`}>
                    <Bell size={16} />
                    {persistentCount > 0 && (
                        <span className="notification-badge">{persistentCount}</span>
                    )}
                </div>
            </button>
            {isPopoverOpen && <NotificationPopover />}
        </div>
    );
};

export default StatusBar;