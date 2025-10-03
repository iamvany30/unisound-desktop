import React, { createContext, useState, useContext, useCallback } from 'react';

const RefreshContext = createContext(null);

export const RefreshProvider = ({ children }) => {
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
    }, []);

    const value = { refreshKey, triggerRefresh };

    return (
        <RefreshContext.Provider value={value}>
            {children}
        </RefreshContext.Provider>
    );
};

export const useRefresh = () => {
    const context = useContext(RefreshContext);
    if (!context) {
        throw new Error('useRefresh должен использоваться внутри RefreshProvider');
    }
    return context;
};