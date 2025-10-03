import React, { createContext, useState, useCallback, useMemo, useEffect, useContext, useRef } from 'react';
import { hexToHsl, hslToHex } from '../utils/colorUtils';

const DEFAULT_HSL = { h: 217, s: 91, l: 60 };

export const ThemeContext = createContext(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [themePreference, setThemePreference] = useState(() => localStorage.getItem('unisound_theme_preference') || 'system');
    const [systemTheme, setSystemTheme] = useState('dark');
    const [density, setDensity] = useState(() => localStorage.getItem('unisound_density_mode') || 'comfortable');
    const [glassBlur, setGlassBlur] = useState(() => parseInt(localStorage.getItem('unisound_glass_blur') || '24', 10));
    const [glassAlpha, setGlassAlpha] = useState(() => parseFloat(localStorage.getItem('unisound_glass_alpha') || '0.85'));
    const [themeHsl, setThemeHsl] = useState(() => {
        try {
            const savedHsl = localStorage.getItem('unisound_accent_hsl');
            return savedHsl ? JSON.parse(savedHsl) : DEFAULT_HSL;
        } catch (error) {
            console.warn("Не удалось прочитать HSL из localStorage, используется значение по умолчанию.");
            return DEFAULT_HSL;
        }
    });

    const debounceTimeout = useRef(null);

    useEffect(() => {
        if (window.electronAPI?.getNativeTheme) {
            window.electronAPI.getNativeTheme().then(setSystemTheme);
            const unsubscribe = window.electronAPI.onThemeChanged(setSystemTheme);
            return () => unsubscribe();
        }
    }, []);

    const activeTheme = useMemo(() => {
        if (themePreference === 'system') {
            return systemTheme;
        }
        return themePreference;
    }, [themePreference, systemTheme]);

    useEffect(() => {
        const root = document.documentElement;
        
        root.classList.remove('theme-light', 'theme-dark');
        if (activeTheme === 'light') {
            root.classList.add('theme-light');
        } else {
            root.classList.add('theme-dark');
        }
        root.classList.toggle('compact-mode', density === 'compact');
        root.classList.toggle('comfortable-mode', density !== 'compact');
        
        root.style.setProperty('--glass-blur', `${glassBlur}px`);
        root.style.setProperty('--glass-alpha-main', glassAlpha.toString());
        root.style.setProperty('--accent-h', themeHsl.h.toString());
        root.style.setProperty('--accent-s', `${themeHsl.s}%`);
        root.style.setProperty('--accent-l', `${themeHsl.l}%`);

    }, [activeTheme, density, glassBlur, glassAlpha, themeHsl]);


    const changeThemePreference = useCallback((preference) => {
        setThemePreference(preference);
        localStorage.setItem('unisound_theme_preference', preference);
    }, []);

    const changeDensity = useCallback((newDensity) => {
        setDensity(newDensity);
        localStorage.setItem('unisound_density_mode', newDensity);
    }, []);

    const changeGlassBlur = useCallback((value) => {
        const numValue = parseInt(value, 10);
        setGlassBlur(numValue);
        localStorage.setItem('unisound_glass_blur', numValue.toString());
    }, []);

    const changeGlassAlpha = useCallback((value) => {
        const numValue = parseFloat(value);
        setGlassAlpha(numValue);
        localStorage.setItem('unisound_glass_alpha', numValue.toString());
    }, []);

    const changeAccentColor = useCallback((newHexColor) => {
        const newHsl = hexToHsl(newHexColor);
        setThemeHsl(newHsl);
        localStorage.setItem('unisound_accent_hsl', JSON.stringify(newHsl));
    }, []);
    
    const changeHslPart = useCallback((part, value) => {
        setThemeHsl(prevHsl => {
            const newHsl = { ...prevHsl, [part]: value };
            
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
            debounceTimeout.current = setTimeout(() => {
                localStorage.setItem('unisound_accent_hsl', JSON.stringify(newHsl));
            }, 300);
            
            return newHsl;
        });
    }, []);

    const resetAccentColor = useCallback(() => {
        setThemeHsl(DEFAULT_HSL);
        localStorage.removeItem('unisound_accent_hsl');
    }, []);
    
    const value = useMemo(() => ({
        themePreference,
        activeTheme,
        changeThemePreference,
        density,
        changeDensity,
        glassBlur,
        changeGlassBlur,
        glassAlpha,
        changeGlassAlpha,
        themeHsl,
        accentColorHex: hslToHex(themeHsl.h, themeHsl.s, themeHsl.l),
        changeAccentColor,
        resetAccentColor,
        changeHslPart,
    }), [
        themePreference, activeTheme, changeThemePreference,
        density, changeDensity,
        glassBlur, changeGlassBlur,
        glassAlpha, changeGlassAlpha,
        themeHsl, changeAccentColor, resetAccentColor, changeHslPart
    ]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};