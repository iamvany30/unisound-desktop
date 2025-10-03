import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('unisound_token'));
    const [user, setUser] = useState(null);
    const [history, setHistory] = useState([]);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const validateToken = async () => {
            if (token) {
                setIsOfflineMode(false);
                try {
                    const [profileData, historyData] = await Promise.all([
                        api.user.getProfile(),
                        api.user.getHistory()
                    ]);
                    setUser(profileData);
                    setHistory(historyData);
                } catch (error) {
                    console.error("Token validation failed, logging out:", error);
                    localStorage.removeItem('unisound_token');
                    setToken(null);
                    setUser(null);
                    setHistory([]);
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
        setHistory([]);
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
    
    const updateUser = useCallback((newUserData) => {
        setUser(currentUser => ({...currentUser, ...newUserData}));
    }, []);

    const authContextValue = {
        token,
        user,
        history,
        loading,
        isOfflineMode,
        login,
        logout,
        loginWithTelegram,
        enterOfflineMode,
        updateUser,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};