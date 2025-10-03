import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import { useRefresh } from '../../context/RefreshContext';
import SearchComponent from './SearchComponent'; 
import SystemStatusIndicator from './StatusBar';
import './Header.css';


const Header = () => {
    const { token } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { triggerRefresh } = useRefresh();
    const handleBack = () => navigate(-1);
    const handleForward = () => navigate(1);
    const handleRefresh = () => triggerRefresh();
    return (
        <header className="header glass-system-component" role="banner">
            <div className="header-content">
                <div className="header-left">
                    <div className="navigation-controls">
                        <button 
                            onClick={handleBack} 
                            className="nav-button" 
                            aria-label={t('header.goBack', 'Go Back')}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <button 
                            onClick={handleForward} 
                            className="nav-button" 
                            aria-label={t('header.goForward', 'Go Forward')}
                        >
                            <ArrowRight size={20} />
                        </button>
                        <button 
                            onClick={handleRefresh} 
                            className="nav-button" 
                            aria-label={t('header.refreshPage', 'Refresh Page')}
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>

                    <Link to="/" className="logo" aria-label={t('common.goHome', 'Go Home')}>
                        UniSound
                    </Link>
                </div>
                
                <div className="header-center">
                    {token && <SearchComponentToRender />}
                </div>

                <div className="header-right">
                    <SystemStatusIndicator />
                </div>
            </div>
        </header>
    );
};

const SearchComponentFallback = () => {
    const { t } = useTranslation();
    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
            <input 
                type="text" 
                placeholder={t('header.searchPlaceholder', 'Search...')} 
                className="search-input-stub" 
                disabled 
            />
        </div>
    );
};

const SearchComponentToRender = typeof SearchComponent !== 'undefined' 
    ? SearchComponent 
    : SearchComponentFallback;

export default Header;