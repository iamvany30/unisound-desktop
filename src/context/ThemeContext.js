import React, { createContext, useState, useCallback, useMemo, useEffect, useContext, useRef } from 'react';

const hexToHsl = (hex) => {
    if (!hex || typeof hex !== 'string') return { h: 0, s: 0, l: 0 };
    
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
};


const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
        l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

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