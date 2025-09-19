
import React, { createContext, useState, useCallback, useContext } from 'react';
import api from '../services/api';

const StatusContext = createContext(null);

export const useStatus = () => {
    return useContext(StatusContext);
};

export const StatusProvider = ({ children }) => {
    const [status, setStatus] = useState('online'); 
    const [lastError, setLastError] = useState(null);


    const checkStatus = useCallback(async () => {
        try {
            
            const response = await api.system.getStatus();
            
            
            if (response.database_status !== 'connected') {
                setStatus('degraded');
                setLastError('Проблемы с подключением к базе данных.');
                console.warn('[Status Check] API is online, but database connection failed.');
                return true; 
            }

            
            if (status !== 'online') {
                console.log('[Status Check] Connection restored. System is online.');
            }
            setStatus('online');
            setLastError(null);
            return true;
        } catch (error) {
            
            setStatus('offline');
            setLastError(error.message);
            console.error('[Status Check] Backend is offline.', error.message);
            return false;
        }
    }, [status]); 

    const value = {
        status,
        lastError,
        checkStatus
    };

    return (
        <StatusContext.Provider value={value}>
            {children}
        </StatusContext.Provider>
    );
};