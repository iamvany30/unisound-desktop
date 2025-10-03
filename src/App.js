import React, { memo, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoaderCircle, Shield, AlertCircle } from 'lucide-react';

import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { ModalProvider } from './context/ModalContext';
import { StatusProvider } from './context/StatusContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { EqualizerProvider } from './context/EqualizerContext';
import { RefreshProvider, useRefresh } from './context/RefreshContext';
import { useAuth } from './hooks/useAuth';
import { useElectronWindow } from './hooks/useElectronWindow';
import { useUpdateNotifier } from './hooks/useUpdateNotifier';

import Sidebar from './components/Common/Sidebar';
import Header from './components/Common/Header';
import PlayerBar from './components/Common/PlayerBar';
import WindowControls from './components/Common/WindowControls';
import DraggableTopBar from './components/Common/DraggableTopBar';
import KaraokePanel from './components/Player/KaraokePanel';
import ToastContainer from './components/Common/ToastContainer';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import TrackDetailPage from './pages/TrackDetailPage';
import ArtistPage from './pages/ArtistPage';
import AdminPage from './pages/AdminPage/AdminPage';
import LocalLibraryPage from './pages/LocalLibraryPage';
import LikedSongsPage from './pages/LikedSongsPage';
import ErrorBoundary from './components/Common/ErrorBoundary';

import './index.css';



const PAGE_VARIANTS = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};

const PAGE_TRANSITION = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4,
};



const PageLoader = memo(({ message = "Загрузка..." }) => (
    <div className="page-loader">
        <LoaderCircle size={48} className="animate-spin" />
        {message && <p>{message}</p>}
    </div>
));
PageLoader.displayName = "PageLoader";

const ErrorPage = memo(({ icon: Icon = AlertCircle, title, message, onRetry }) => (
    <div className="fullscreen-message error">
        <Icon size={48} />
        <h2>{title}</h2>
        <p>{message}</p>
        {onRetry && (
            <button onClick={onRetry} className="retry-button">
                Повторить попытку
            </button>
        )}
    </div>
));
ErrorPage.displayName = "ErrorPage";



const useScrollToTop = () => {
    const location = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname]);
};

const usePlatformDetection = () => {
    useEffect(() => {
        const platform = window.navigator.platform.toLowerCase();
        const rootElement = document.getElementById('root');
        if (!rootElement) return;

        const platformClass = platform.includes('win') 
            ? 'platform-win32'
            : platform.includes('mac')
            ? 'platform-darwin'
            : 'platform-linux';
        
        rootElement.classList.add(platformClass);
    }, []);
};

const useWindowMaximizedState = (isElectron, isMaximized) => {
    useEffect(() => {
        const rootElement = document.getElementById('root');
        if (!rootElement || !isElectron) return;

        rootElement.classList.toggle('maximized', isMaximized);
    }, [isElectron, isMaximized]);
};

const useCustomBackground = () => {
    useEffect(() => {
        const applyCustomBackground = () => {
            const root = document.documentElement;
            const bgImage = localStorage.getItem('unisound_custom_bg_image');
            const bgBlur = localStorage.getItem('unisound_custom_bg_blur') || '20';

            if (bgImage) {
                root.style.setProperty('--custom-background-image-url', `url(${bgImage})`);
                root.classList.add('has-custom-background');
            } else {
                root.style.removeProperty('--custom-background-image-url');
                root.classList.remove('has-custom-background');
            }
            
            root.style.setProperty('--custom-background-blur', `${bgBlur}px`);
        };

        applyCustomBackground();
        
        const events = ['background-settings-changed', 'storage'];
        events.forEach(event => window.addEventListener(event, applyCustomBackground));

        return () => {
            events.forEach(event => window.removeEventListener(event, applyCustomBackground));
            const root = document.documentElement;
            root.style.removeProperty('--custom-background-image-url');
            root.style.removeProperty('--custom-background-blur');
            root.classList.remove('has-custom-background');
        };
    }, []);
};



const AppLayout = memo(() => {
    const { token } = useAuth();
    const location = useLocation();
    const { refreshKey } = useRefresh();

    if (!token) return <Navigate to="/login" replace />;

    return (
        <div className="app-grid-layout">
            <Sidebar />
            <Header />
            <main className="main-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${location.pathname}-${refreshKey}`}
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={PAGE_VARIANTS}
                        transition={PAGE_TRANSITION}
                        className="content-wrapper glass-system-component"
                    >
                        <ErrorBoundary>
                            <Outlet />
                        </ErrorBoundary>
                    </motion.div>
                </AnimatePresence>
            </main>
            <PlayerBar />
        </div>
    );
});
AppLayout.displayName = "AppLayout";

const MainContentSelector = memo(() => {
    const { isOfflineMode } = useAuth();
    return isOfflineMode ? <LocalLibraryPage /> : <HomePage />;
});
MainContentSelector.displayName = "MainContentSelector";



const ProtectedRoutesLayout = memo(() => {
    const { token, loading, user, isOfflineMode } = useAuth();
    useScrollToTop();

    if (loading) {
        return <PageLoader message="Проверка авторизации..." />;
    }

    if (!token && !isOfflineMode) {
        return (
            <Navigate 
                to="/login" 
                replace 
                state={{ from: window.location.hash }} 
            />
        );
    }

    if (user?.is_blocked) {
        return (
            <ErrorPage
                icon={Shield}
                title="Аккаунт заблокирован"
                message="Вам был ограничен доступ в целях безопасности (ну или вы чёт нарушили)"
            />
        );
    }

    return <Outlet />;
});
ProtectedRoutesLayout.displayName = "ProtectedRoutesLayout";

const AdminRoutesLayout = memo(() => {
    const { user, loading, isOfflineMode } = useAuth();

    if (loading) {
        return <PageLoader message="Проверка прав доступа..." />;
    }

    if (isOfflineMode || !user?.is_superuser) {
        return (
            <ErrorPage
                icon={Shield}
                title="Доступ запрещён"
                message="У вас нет прав для просмотра этой страницы или вы находитесь в оффлайн-режиме."
            />
        );
    }

    return <Outlet />;
});
AdminRoutesLayout.displayName = "AdminRoutesLayout";

const PublicRoutesLayout = memo(() => {
    const { token, loading } = useAuth();
    useScrollToTop();

    if (loading) {
        return <PageLoader message="Инициализация..." />;
    }

    if (token) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
});
PublicRoutesLayout.displayName = "PublicRoutesLayout";



const AppRoutes = memo(() => {
    return (
        <Routes>
            <Route path="/karaoke" element={<KaraokeApp />} />

            <Route element={<PublicRoutesLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoutesLayout />}>
                <Route path="/" element={<AppLayout />}>
                    <Route index element={<MainContentSelector />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="likes" element={<LikedSongsPage />} />
                    <Route path="tracks/:trackUuid" element={<TrackDetailPage />} />
                    <Route path="artists/:artistName" element={<ArtistPage />} />
                    <Route path="library" element={<LocalLibraryPage />} />

                    <Route element={<AdminRoutesLayout />}>
                        <Route path="admin/*" element={<AdminPage />} />
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
});
AppRoutes.displayName = "AppRoutes";


const KaraokeApp = memo(() => {
    const [playerState, setPlayerState] = React.useState({
        track: null,
        progress: 0,
        isPlaying: false,
        token: null,
    });

    useEffect(() => {
        const handleStateUpdate = (data) => {
            setPlayerState(prev => ({ ...prev, ...data }));
            if (data.token) {
                localStorage.setItem('unisound_token', data.token);
            }
        };

        const unsubscribe = window.electronAPI?.onPlayerStateUpdate?.(handleStateUpdate);
        return () => unsubscribe?.();
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <KaraokePanel
                track={playerState.track}
                progress={playerState.progress}
                isPlaying={playerState.isPlaying}
                isVisible={true}
                isStandaloneWindow={true}
            />
        </div>
    );
});
KaraokeApp.displayName = "KaraokeApp";


const AppContent = memo(() => {
    const { isElectron, isMaximized } = useElectronWindow();
    usePlatformDetection();
    useWindowMaximizedState(isElectron, isMaximized);
    useCustomBackground();

    useUpdateNotifier();

    return (
        <>
            {isElectron && <DraggableTopBar />}
            {isElectron && <WindowControls />}
            <div className="custom-background-layer" />
            <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppRoutes />
            </HashRouter>
            <ToastContainer />
        </>
    );
});
AppContent.displayName = "AppContent";



const AppWrapper = memo(() => {
    return (
        <RefreshProvider>
            <ThemeProvider>
                <StatusProvider>
                    <NotificationProvider>
                        <AuthProvider>
                            <EqualizerProvider>
                                <PlayerProvider>
                                    <ModalProvider>
                                        <AppContent />
                                    </ModalProvider>
                                </PlayerProvider>
                            </EqualizerProvider>
                        </AuthProvider>
                    </NotificationProvider>
                </StatusProvider>
            </ThemeProvider>
        </RefreshProvider>
    );
});
AppWrapper.displayName = "AppWrapper";

export default AppWrapper;