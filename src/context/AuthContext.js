
import React from 'react';
import api from '../services/api';

const { createContext, useState, useEffect } = React;

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('unisound_token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const validateToken = async () => {
            if (token) {
                try {
                    
                    const profile = await api.user.getProfile();
                    setUser(profile);
                } catch (error) {
                    console.error("Token validation failed", error);
                    setToken(null);
                    localStorage.removeItem('unisound_token');
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
    };

    
    const loginWithTelegram = async (telegramUserData) => {
        const data = await api.auth.telegramWidgetLogin(telegramUserData);
        localStorage.setItem('unisound_token', data.access_token);
        setToken(data.access_token); 
    };

    const logout = () => {
        localStorage.removeItem('unisound_token');
        setToken(null);
        setUser(null);
    };

    const authContextValue = {
        token,
        user,
        loading,
        login,
        logout,
        loginWithTelegram, 
    };

    return React.createElement(AuthContext.Provider, { value: authContextValue }, children);
};