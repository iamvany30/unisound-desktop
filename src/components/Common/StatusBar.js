
import React from 'react';
import { useStatus } from '../../context/StatusContext';
import { CheckCircle, AlertTriangle, WifiOff } from 'lucide-react';
import './StatusBar.css';

const statusConfig = {
    online: {
        Icon: CheckCircle,
        text: 'Система в норме',
        className: 'status-online'
    },
    degraded: {
        Icon: AlertTriangle,
        text: 'Ограниченная функциональность',
        className: 'status-degraded'
    },
    offline: {
        Icon: WifiOff,
        text: 'Нет подключения к серверу',
        className: 'status-offline'
    }
};

const StatusBar = () => {
    const { status, lastError } = useStatus();
    const { Icon, text, className } = statusConfig[status];

    const title = lastError ? `Подробности: ${lastError}` : text;

    return (
        <div className={`status-bar ${className}`} title={title}>
            <Icon size={14} className="status-icon" />
            <span className="status-text">{text}</span>
        </div>
    );
};

export default StatusBar;