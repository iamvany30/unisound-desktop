
import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('unisound_token'));
    
    const [user, setUser] = useState(null);
    
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const validateToken = async () => {
            if (token) {
                setIsOfflineMode(false);
                try {
                    const profile = await api.user.getProfile();
                    setUser(profile);
                } catch (error) {
                    console.error("Token validation failed, logging out:", error);
                    localStorage.removeItem('unisound_token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        validateToken();
    }, [token]);

    const login = async (username, password) => {
        const data = await api.auth.login(username, password);
        localStorage.setItem('unisound_token', data.access_token);
        setToken(data.access_token);
        setIsOfflineMode(false);
    };

    const loginWithTelegram = async (telegramUserData) => {
        const data = await api.auth.telegramWidgetLogin(telegramUserData);
        localStorage.setItem('unisound_token', data.access_token);
        setToken(data.access_token);
        setIsOfflineMode(false); 
    };

    const logout = useCallback(() => {
        localStorage.removeItem('unisound_token');
        setToken(null);
        setUser(null);
        setIsOfflineMode(false); 
        window.location.hash = '/login';
    }, []);

    const enterOfflineMode = useCallback(() => {
        if (token) {
            localStorage.removeItem('unisound_token');
            setToken(null);
            setUser(null);
        }
        setIsOfflineMode(true);
        setLoading(false);
    }, [token]);

    const authContextValue = {
        token,
        user,
        loading,
        isOfflineMode,
        login,
        logout,
        loginWithTelegram,
        enterOfflineMode,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};