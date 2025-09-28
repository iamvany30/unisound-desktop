import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import SearchComponent from './SearchComponent'; 
import StatusBar from './StatusBar';
import './Header.css';

const Header = () => {
    const { token } = useAuth();
    const { t } = useTranslation();

    return (
        <header className="header glass-system-component" role="banner">
            <div className="header-content">
                <div className="header-left">
                    <Link to="/" className="logo" aria-label={t('common.goHome')}>
                        UniSound
                    </Link>
                </div>
                
                <div className="header-center">
                    {token && <SearchComponent />}
                </div>

                <div className="header-right">
                    <StatusBar />
                </div>
            </div>
        </header>
    );
};


const SearchComponentFallback = () => {
    const { t } = useTranslation();
    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
            <input type="text" placeholder={t('header.searchPlaceholder')} className="search-input-stub" />
        </div>
    );
}


const SearchComponentToRender = typeof SearchComponent !== 'undefined' ? SearchComponent : SearchComponentFallback;


export default Header;