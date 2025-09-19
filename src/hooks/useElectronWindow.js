import { useState, useEffect, useCallback, useRef } from 'react';


export const WINDOW_STATES = {
    NORMAL: 'normal',
    MAXIMIZED: 'maximized',
    MINIMIZED: 'minimized',
    FULLSCREEN: 'fullscreen'
};


const ELECTRON_EVENTS = {
    WINDOW_STATE_CHANGED: 'window-state-changed',
    WINDOW_FOCUS_CHANGED: 'window-focus-changed',
    THEME_CHANGED: 'theme-changed'
};


export const useElectronWindow = (options = {}) => {
    const { 
        autoInit = true, 
        trackFocus = false, 
        trackTheme = false 
    } = options;

    
    const electronAPI = window.electronAPI;
    const isElectron = Boolean(electronAPI);

    
    const [windowState, setWindowState] = useState({
        isMaximized: false,
        isMinimized: false,
        isFullscreen: false,
        isFocused: true,
        bounds: null
    });
    
    const [systemTheme, setSystemTheme] = useState('light');
    const [isInitialized, setIsInitialized] = useState(false);
    
    
    const unsubscribersRef = useRef([]);
    const initPromiseRef = useRef(null);

    
    const initializeWindowState = useCallback(async () => {
        if (!isElectron || !autoInit) return;

        
        if (initPromiseRef.current) {
            return initPromiseRef.current;
        }

        initPromiseRef.current = (async () => {
            try {
                const [windowData, themeData] = await Promise.all([
                    electronAPI.getWindowState?.(),
                    trackTheme ? electronAPI.getSystemTheme?.() : Promise.resolve('light')
                ]);

                if (windowData) {
                    setWindowState(prevState => ({
                        ...prevState,
                        isMaximized: windowData.isMaximized || false,
                        isMinimized: windowData.isMinimized || false,
                        isFullscreen: windowData.isFullscreen || false,
                        isFocused: windowData.isFocused ?? true,
                        bounds: windowData.bounds || null
                    }));
                }

                if (trackTheme && themeData) {
                    setSystemTheme(themeData);
                }

                setIsInitialized(true);
            } catch (error) {
                console.warn('Failed to initialize window state:', error);
                setIsInitialized(true); 
            }
        })();

        return initPromiseRef.current;
    }, [isElectron, autoInit, trackTheme, electronAPI]);

    
    const minimize = useCallback(async () => {
        if (!electronAPI?.minimizeWindow) return false;
        try {
            await electronAPI.minimizeWindow();
            return true;
        } catch (error) {
            console.error('Failed to minimize window:', error);
            return false;
        }
    }, [electronAPI]);

    const maximize = useCallback(async () => {
        if (!electronAPI?.maximizeWindow) return false;
        try {
            await electronAPI.maximizeWindow();
            return true;
        } catch (error) {
            console.error('Failed to maximize window:', error);
            return false;
        }
    }, [electronAPI]);

    const restore = useCallback(async () => {
        if (!electronAPI?.restoreWindow) return false;
        try {
            await electronAPI.restoreWindow();
            return true;
        } catch (error) {
            console.error('Failed to restore window:', error);
            return false;
        }
    }, [electronAPI]);

    const close = useCallback(async () => {
        if (!electronAPI?.closeWindow) return false;
        try {
            await electronAPI.closeWindow();
            return true;
        } catch (error) {
            console.error('Failed to close window:', error);
            return false;
        }
    }, [electronAPI]);

    const toggleMaximize = useCallback(async () => {
        return windowState.isMaximized ? restore() : maximize();
    }, [windowState.isMaximized, restore, maximize]);

    const setWindowBounds = useCallback(async (bounds) => {
        if (!electronAPI?.setWindowBounds) return false;
        try {
            await electronAPI.setWindowBounds(bounds);
            return true;
        } catch (error) {
            console.error('Failed to set window bounds:', error);
            return false;
        }
    }, [electronAPI]);

    const centerWindow = useCallback(async () => {
        if (!electronAPI?.centerWindow) return false;
        try {
            await electronAPI.centerWindow();
            return true;
        } catch (error) {
            console.error('Failed to center window:', error);
            return false;
        }
    }, [electronAPI]);

    
    useEffect(() => {
        if (isElectron && autoInit) {
            initializeWindowState();
        }
    }, [isElectron, autoInit, initializeWindowState]);

    
    useEffect(() => {
        if (!isElectron) return;

        const subscriptions = [];

        
        if (electronAPI.onWindowStateChanged) {
            const unsubscribeWindowState = electronAPI.onWindowStateChanged((newState) => {
                setWindowState(prevState => ({
                    ...prevState,
                    ...newState
                }));
            });
            subscriptions.push(unsubscribeWindowState);
        }

        
        if (trackFocus && electronAPI.onWindowFocusChanged) {
            const unsubscribeFocus = electronAPI.onWindowFocusChanged((focused) => {
                setWindowState(prevState => ({
                    ...prevState,
                    isFocused: focused
                }));
            });
            subscriptions.push(unsubscribeFocus);
        }

        
        if (trackTheme && electronAPI.onThemeChanged) {
            const unsubscribeTheme = electronAPI.onThemeChanged((theme) => {
                setSystemTheme(theme);
            });
            subscriptions.push(unsubscribeTheme);
        }

        unsubscribersRef.current = subscriptions;

        
        return () => {
            subscriptions.forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    try {
                        unsubscribe();
                    } catch (error) {
                        console.warn('Failed to unsubscribe from Electron event:', error);
                    }
                }
            });
            unsubscribersRef.current = [];
        };
    }, [isElectron, trackFocus, trackTheme, electronAPI]);

    
    const canRestore = windowState.isMaximized || windowState.isMinimized || windowState.isFullscreen;
    const windowStateType = windowState.isFullscreen ? WINDOW_STATES.FULLSCREEN :
                           windowState.isMaximized ? WINDOW_STATES.MAXIMIZED :
                           windowState.isMinimized ? WINDOW_STATES.MINIMIZED :
                           WINDOW_STATES.NORMAL;

    return {
        
        isElectron,
        isInitialized,
        
        
        ...windowState,
        windowStateType,
        canRestore,
        
        
        systemTheme: trackTheme ? systemTheme : undefined,
        
        
        minimize,
        maximize,
        restore,
        close,
        toggleMaximize,
        setWindowBounds,
        centerWindow,
        
        
        initializeWindowState,
        
        
        WINDOW_STATES
    };
};