import React, { Suspense, memo, useEffect, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoaderCircle, Shield, AlertCircle } from 'lucide-react';

import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { ModalProvider } from './context/ModalContext';
import { StatusProvider, useStatus } from './context/StatusContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { useElectronWindow } from './hooks/useElectronWindow';
import api from './services/api';

import Header from './components/Common/Header';
import Footer from './components/Common/Footer';
import WindowControls from './components/Common/WindowControls';
import KaraokePanel from './components/Player/KaraokePanel';
import AppLoader from './components/Common/AppLoader';
import UpdateNotification from './components/Common/UpdateNotification';

import './index.css';

const loadPage = (importFunc) => React.lazy(importFunc);

const pageImportFactories = [
  () => import('./pages/HomePage'),
  () => import('./pages/LoginPage'),
  () => import('./pages/RegisterPage'),
  () => import('./pages/ProfilePage'),
  () => import('./pages/SettingsPage'),
  () => import('./pages/TrackDetailPage'),
  () => import('./pages/ArtistPage'),
  () => import('./pages/AdminPage/AdminPage'),
  () => import('./pages/LocalLibraryPage'),
];

const HomePage = loadPage(pageImportFactories[0]);
const LoginPage = loadPage(pageImportFactories[1]);
const RegisterPage = loadPage(pageImportFactories[2]);
const ProfilePage = loadPage(pageImportFactories[3]);
const SettingsPage = React.lazy(() => 
    import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage }))
);
const TrackDetailPage = loadPage(pageImportFactories[5]);
const ArtistPage = loadPage(pageImportFactories[6]);
const AdminPage = loadPage(pageImportFactories[7]);
const LocalLibraryPage = loadPage(pageImportFactories[8]); 
const SilentLoader = memo(() => null);
SilentLoader.displayName = "SilentLoader";

const AppPreparationGate = memo(({ children }) => {
    const [isReady, setIsReady] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Инициализация...');
    const { token } = useAuth();

    useEffect(() => {
        const prepareApp = async () => {
            console.log('%c[AppLoader] Подготовка приложения...', 'color: green; font-weight: bold;');
            
            setProgress(10);
            setStatusText('Загрузка компонентов...');
            
            await Promise.all(pageImportFactories.map(factory => factory()));
            console.log('[AppLoader] Все бандлы страниц загружены.');
            
            setProgress(40);
            if (token) {
                setStatusText('Синхронизация данных...');
                try {
                    await Promise.all([api.user.getProfile(), api.highlights.getHome()]);
                    console.log('[AppLoader] Критические данные загружены.');
                } catch (error) {
                    console.warn('[AppLoader] Не удалось предзагрузить данные:', error);
                }
            }
            
            setProgress(90);
            setStatusText('Завершение...');
            await new Promise(resolve => setTimeout(resolve, 500));
            setProgress(100);
            
            setTimeout(() => setIsReady(true), 400); 
        };

        prepareApp();
    }, [token]);

    if (!isReady) {
        return <AppLoader progress={progress} statusText={statusText} />;
    }

    return children;
});
AppPreparationGate.displayName = "AppPreparationGate";

const AppLayout = memo(() => {
    return (
        <div className="app-wrapper">
            <div className="app-background-mica" />
            <div className="app-container">
                <Header />
                <main className="main-content">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div>
    );
});
AppLayout.displayName = "AppLayout";


const MainContentSelector = () => {
    const { isOfflineMode } = useAuth();
    return isOfflineMode ? <LocalLibraryPage /> : <HomePage />;
};

const ProtectedRoutesLayout = memo(() => {
    const { token, loading, user, isOfflineMode } = useAuth();
    useRouteChange();

    if (loading) return <PageLoader message="Проверка авторизации..." />;

    if (!token && !isOfflineMode) {
        return <Navigate to="/login" replace state={{ from: window.location.hash }} />;
    }

    if (user?.is_blocked) {
        return (
            <div className="fullscreen-message error">
                <Shield size={48} />
                <h2>Аккаунт заблокирован</h2>
                <p>Вам был ограничен доступ в целях безопасности (ну или вы чёт нарушили)</p>
            </div>
        );
    }
    return <Outlet />;
});
ProtectedRoutesLayout.displayName = "ProtectedRoutesLayout";

const AdminRoutesLayout = memo(() => {
    const { user, loading, isOfflineMode } = useAuth();
    if (loading) return <PageLoader message="Проверка прав доступа..." />;
    
    if (isOfflineMode || !user?.is_superuser) {
        return (
            <div className="fullscreen-message error">
                <Shield size={48} />
                <h2>Доступ запрещен</h2>
                <p>У вас нет прав для просмотра этой страницы или вы находитесь в оффлайн-режиме.</p>
            </div>
        );
    }
    return <Outlet />;
});
AdminRoutesLayout.displayName = "AdminRoutesLayout";

const PublicRoutesLayout = memo(() => {
    const { token, loading } = useAuth();
    useRouteChange();
    if (loading) return <PageLoader message="Инициализация..." />;
    if (token) return <Navigate to="/" replace />; 
    return <Outlet />;
});
PublicRoutesLayout.displayName = "PublicRoutesLayout";


const AppRoutes = memo(() => {
    const { checkStatus } = useStatus();
    useEffect(() => { checkStatus().catch(console.warn); }, [checkStatus]);

    return (
        <Routes>
            <Route path="/karaoke" element={<KaraokeApp />} />
            
            <Route element={<PublicRoutesLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route path="/" element={<AppLayout />}>
                <Route element={<ProtectedRoutesLayout />}>
                    <Route index element={<MainContentSelector />} /> 
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="tracks/:trackUuid" element={<TrackDetailPage />} />
                    <Route path="artists/:artistName" element={<ArtistPage />} />
                    <Route element={<AdminRoutesLayout />}>
                        <Route path="admin/*" element={<AdminPage />} />
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
});
AppRoutes.displayName = "AppRoutes";


const AppProviders = memo(({ children }) => (
    <ThemeProvider> 
        <StatusProvider>
            <AuthProvider>
                <PlayerProvider>
                    <ModalProvider>{children}</ModalProvider>
                </PlayerProvider>
            </AuthProvider>
        </StatusProvider>
    </ThemeProvider>
));
AppProviders.displayName = "AppProviders";

const App = memo(() => (
    <HashRouter>
        <Suspense fallback={<SilentLoader />}>
            <AppRoutes />
        </Suspense>
    </HashRouter>
));
App.displayName = "App";

const AppWrapper = memo(() => {
    const { isElectron } = useElectronWindow();
    
    useEffect(() => {
        const applyCustomBackground = () => {
            const bgImage = localStorage.getItem('unisound_custom_bg_image');
            const bgBlur = localStorage.getItem('unisound_custom_bg_blur');
            const rootStyle = document.documentElement.style;

            if (bgImage) {
                rootStyle.setProperty('--custom-background-image', `url(${bgImage})`);
            } else {
                rootStyle.removeProperty('--custom-background-image');
            }

            rootStyle.setProperty(
                '--custom-background-blur', 
                bgBlur ? `${bgBlur}px` : '20px'
            );
        };

        applyCustomBackground();
        
        window.addEventListener('background-settings-changed', applyCustomBackground);
        window.addEventListener('storage', applyCustomBackground);

        return () => {
            window.removeEventListener('background-settings-changed', applyCustomBackground);
            window.removeEventListener('storage', applyCustomBackground);
        };
    }, []);
    
    return (
        <AppProviders>
            {isElectron && <WindowControls />}
            <div className="custom-background-layer" />
            <AppPreparationGate>
                <App />
            </AppPreparationGate>
            <UpdateNotification />
        </AppProviders>
    );
});
AppWrapper.displayName = "AppWrapper";

export default AppWrapper;

const useRouteChange = () => {
    const location = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
};

const PageLoader = memo(({ message = "Загрузка..." }) => (
    <div className="page-loader">
        <LoaderCircle size={48} className="animate-spin" />
        {message && <p>{message}</p>}
    </div>
));
PageLoader.displayName = "PageLoader";

const ErrorPage = memo(({ error, onRetry }) => (
     <div className="fullscreen-message error">
        <AlertCircle size={48} />
        <h2>Ошибка загрузки страницы</h2>
        <p>{error?.message || 'Произошла неизвестная ошибка.'}</p>
        {onRetry && <button onClick={onRetry} className="retry-button">Повторить попытку</button>}
    </div>
));
ErrorPage.displayName = "ErrorPage";

const KaraokeApp = memo(() => {
    const [playerState, setPlayerState] = useState({ track: null, progress: 0, isPlaying: false, token: null });
    useEffect(() => {
        const unsubscribe = window.electronAPI?.onPlayerStateUpdate?.((data) => {
            setPlayerState(prev => ({ ...prev, ...data }));
            if (data.token) localStorage.setItem('unisound_token', data.token);
        });
        return () => unsubscribe?.();
    }, []);
    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <KaraokePanel track={playerState.track} progress={playerState.progress} isPlaying={playerState.isPlaying} isVisible={true} isStandaloneWindow={true} />
        </div>
    );
});
KaraokeApp.displayName = "KaraokeApp";