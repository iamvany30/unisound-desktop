import React, { createContext, useState, useContext, useCallback } from 'react';

const NotificationContext = createContext(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const addNotification = useCallback((config) => {
        const id = config.id || Date.now() + Math.random();
        
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        const newNotification = {
            duration: 5000,
            type: 'info',
            persistent: false,
            ...config,
            id,
        };
        setNotifications(prev => [newNotification, ...prev]);

        if (newNotification.persistent) {
            setIsPopoverOpen(true);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);
    
    const updateNotification = useCallback((id, updates) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    }, []);

    const clearPersistent = useCallback(() => {
        setNotifications(prev => prev.filter(n => !n.persistent));
        setIsPopoverOpen(false);
    }, []);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        updateNotification,
        clearPersistent,
        isPopoverOpen,
        togglePopover: () => setIsPopoverOpen(prev => !prev),
        closePopover: () => setIsPopoverOpen(false),
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};