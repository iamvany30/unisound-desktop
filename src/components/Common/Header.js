import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
    Settings,
    User,
    LogOut,
    Search,
    LoaderCircle,
    Shield,
    X,
    ChevronDown
} from 'lucide-react';
import api from '../../services/api';


import SearchResultsDropdown from './SearchResultsDropdown';
import StatusBar from './StatusBar';
import { useElectronWindow } from '../../hooks/useElectronWindow';
import PrefetchLink from './PrefetchLink'; 


import './Header.css';


const useClickOutside = (ref, handler) => {
    const savedHandler = useRef(handler);
    
    useEffect(() => {
        savedHandler.current = handler;
    });

    useEffect(() => {
        const listener = (event) => {
            if (!ref.current?.contains(event.target)) {
                savedHandler.current(event);
            }
        };
        
        const keyListener = (event) => {
            if (event.key === 'Escape') {
                savedHandler.current(event);
            }
        };

        
        document.addEventListener('mousedown', listener, true);
        document.addEventListener('touchstart', listener, true);
        document.addEventListener('keydown', keyListener);
        
        return () => {
            document.removeEventListener('mousedown', listener, true);
            document.removeEventListener('touchstart', listener, true);
            document.removeEventListener('keydown', keyListener);
        };
    }, [ref]);
};


const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const handlerRef = useRef();

    useEffect(() => {
        handlerRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handlerRef.current);
    }, [value, delay]);

    const cancel = useCallback(() => {
        clearTimeout(handlerRef.current);
        setDebouncedValue(value);
    }, [value]);

    return [debouncedValue, cancel];
};


const useScrollDirection = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const ticking = useRef(false);

    useEffect(() => {
        const updateScroll = () => {
            if (!ticking.current) {
                requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > 10);
                    ticking.current = false;
                });
                ticking.current = true;
            }
        };

        window.addEventListener('scroll', updateScroll, { passive: true });
        return () => window.removeEventListener('scroll', updateScroll);
    }, []);

    return { isScrolled };
};


const prefetchFactories = {
    home: () => import('../../pages/HomePage'),
    profile: () => import('../../pages/ProfilePage'),
    settings: () => import('../../pages/SettingsPage'),
    login: () => import('../../pages/LoginPage'),
    admin: () => import('../../pages/AdminPage/AdminPage')
};



const ProfileDropdown = React.memo(({ user, onLogout, onClose, isOpen }) => {
    const { t } = useTranslation();
    
    const prefetchProfileData = useCallback(() => {
        
        return api.user.prefetchProfileAndHistory?.();
    }, []);

    
    const dropdownClass = `profile-dropdown ${isOpen ? 'dropdown-entering' : ''}`;

    return (
        <div className={dropdownClass} role="menu">
            <PrefetchLink 
                to="/profile" 
                className="dropdown-item" 
                onClick={onClose}
                prefetch={prefetchFactories.profile}
                prefetchData={prefetchProfileData}
                role="menuitem"
                onMouseEnter={prefetchProfileData}
            >
                <User size={16} aria-hidden="true" />
                <span>{t('header.profile')}</span>
            </PrefetchLink>
            
            <PrefetchLink 
                to="/settings" 
                className="dropdown-item" 
                onClick={onClose}
                prefetch={prefetchFactories.settings}
                role="menuitem"
            >
                <Settings size={16} aria-hidden="true" />
                <span>{t('header.settings')}</span>
            </PrefetchLink>
            
            {user?.is_superuser && (
                <PrefetchLink 
                    to="/admin" 
                    className="dropdown-item" 
                    onClick={onClose}
                    prefetch={prefetchFactories.admin}
                    role="menuitem"
                >
                    <Shield size={16} aria-hidden="true" />
                    <span>{t('header.adminPanel')}</span>
                </PrefetchLink>
            )}
            
            <div className="dropdown-separator" role="separator" />
            
            <button 
                onClick={onLogout} 
                className="dropdown-item logout-btn"
                role="menuitem"
                type="button"
            >
                <LogOut size={16} aria-hidden="true" />
                <span>{t('header.logout')}</span>
            </button>
        </div>
    );
});
ProfileDropdown.displayName = 'ProfileDropdown';

const SearchComponent = React.memo(() => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [error, setError] = useState(null);
    
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const controllerRef = useRef(null);
    
    const [debouncedQuery, cancelDebounce] = useDebounce(query, 300);

    
    useClickOutside(searchRef, useCallback(() => {
        setIsFocused(false);
        setError(null);
    }, []));

    
    const clearSearch = useCallback(() => {
        setQuery('');
        setResults(null);
        setError(null);
        cancelDebounce();
        inputRef.current?.focus();
    }, [cancelDebounce]);

    
    useEffect(() => {
        if (debouncedQuery.length < 2) { 
            setResults(null);
            setError(null);
            return; 
        }

        
        if (controllerRef.current) {
            controllerRef.current.abort();
        }
        
        controllerRef.current = new AbortController();
        
        const performSearch = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const data = await api.search.global({ 
                    q: debouncedQuery, 
                    signal: controllerRef.current.signal 
                });
                
                if (!controllerRef.current.signal.aborted) {
                    setResults(data);
                }
            } catch (error) {
                if (error.name !== 'AbortError' && !controllerRef.current.signal.aborted) {
                    console.error('Search error:', error);
                    setError(t('search.errorMessage'));
                    setResults(null);
                }
            } finally {
                if (!controllerRef.current.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        performSearch();
        
        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
        };
    }, [debouncedQuery, t]);

    
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            clearSearch();
            inputRef.current?.blur();
        }
    }, [clearSearch]);

    const searchInputProps = useMemo(() => ({
        ref: inputRef,
        type: "text",
        value: query,
        onChange: (e) => setQuery(e.target.value),
        onFocus: () => setIsFocused(true),
        onKeyDown: handleKeyDown,
        placeholder: t('header.searchPlaceholder'),
        className: "search-input",
        'aria-label': t('header.searchPlaceholder'),
        'aria-expanded': isFocused && (results || error),
        'aria-autocomplete': 'list',
        'aria-describedby': error ? 'search-error' : undefined
    }), [query, handleKeyDown, t, isFocused, results, error]);

    return (
        <div className="search-container" ref={searchRef} role="combobox" aria-expanded={isFocused}>
            <div className="search-bar">
                <Search size={20} className="search-icon-left" aria-hidden="true" />
                <input {...searchInputProps} />
                
                <div className="search-icon-right">
                    {isLoading && (
                        <LoaderCircle 
                            size={20} 
                            className="spinning" 
                            aria-label={t('common.loading')}
                        />
                    )}
                    {query && !isLoading && (
                        <button 
                            type="button" 
                            className="clear-search-btn" 
                            onClick={clearSearch}
                            aria-label={t('search.clearSearch')}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
            
            {isFocused && (
                <>
                    {error && (
                        <div className="search-error" id="search-error" role="alert">
                            {error}
                        </div>
                    )}
                    {results && (
                        <SearchResultsDropdown 
                            results={results} 
                            onClose={clearSearch}
                            query={debouncedQuery}
                        />
                    )}
                </>
            )}
        </div>
    );
});
SearchComponent.displayName = 'SearchComponent';


const Header = () => {
    const { token, user, logout } = useAuth();
    const { t } = useTranslation();
    const { isElectron } = useElectronWindow();
    const { isScrolled } = useScrollDirection();
    
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const profileDropdownRef = useRef(null);

    
    useClickOutside(profileDropdownRef, useCallback(() => {
        setDropdownOpen(false);
    }, []));

    
    const handleLogout = useCallback(async () => {
        if (isLoading) return; 
        
        setIsLoading(true);
        setDropdownOpen(false);
        
        try { 
            await logout(); 
        } catch (error) { 
            console.error('Logout failed:', error);
            
            
        } finally { 
            setIsLoading(false); 
        }
    }, [logout, isLoading]);

    
    const toggleDropdown = useCallback((e) => {
        if (e.type === 'keydown' && !['Enter', ' '].includes(e.key)) return;
        e.preventDefault();
        setDropdownOpen(prev => !prev);
    }, []);

    
    const headerClasses = useMemo(() => {
        return [
            'header',
            isScrolled && 'scrolled',
            isElectron && 'electron-header'
        ].filter(Boolean).join(' ');
    }, [isScrolled, isElectron]);

    
    const prefetchHome = useCallback(() => prefetchFactories.home(), []);

    return (
        <header className={headerClasses} role="banner">
            <div className="header-content">
                <div className="header-left">
                    <PrefetchLink 
                        to="/" 
                        className="logo" 
                        prefetch={prefetchHome}
                        aria-label={t('common.goHome')}
                    >
                        <span>UniSound</span>
                    </PrefetchLink>
                </div>

                <div className="header-center">
                    {token && <SearchComponent />}
                </div>

                <div className="header-right">
                    <nav className="nav" role="navigation" aria-label={t('header.mainNavigation')}>
                        <StatusBar />
                        
                        {token ? (
                            <div className="profile-section" ref={profileDropdownRef}>
                                <button
                                    type="button"
                                    className={`avatar-btn ${isDropdownOpen ? 'active' : ''}`}
                                    onClick={toggleDropdown}
                                    onKeyDown={toggleDropdown}
                                    disabled={isLoading}
                                    aria-expanded={isDropdownOpen}
                                    aria-haspopup="menu"
                                    aria-label={t('header.userMenu')}
                                >
                                    {user?.profile_picture_url ? (
                                        <img 
                                            src={user.profile_picture_url} 
                                            alt="" 
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : (
                                        <User size={20} />
                                    )}
                                    <ChevronDown 
                                        size={12} 
                                        className={`dropdown-arrow ${isDropdownOpen ? 'rotated' : ''}`}
                                        aria-hidden="true"
                                    />
                                </button>
                                
                                {isDropdownOpen && (
                                    <ProfileDropdown 
                                        user={user} 
                                        onLogout={handleLogout} 
                                        onClose={() => setDropdownOpen(false)}
                                        isOpen={isDropdownOpen}
                                    />
                                )}
                            </div>
                        ) : (
                            <PrefetchLink 
                                to="/login" 
                                className="nav-btn login-btn" 
                                prefetch={prefetchFactories.login}
                                aria-label={t('header.login')}
                            >
                                <User size={16} aria-hidden="true" />
                                <span>{t('header.login')}</span>
                            </PrefetchLink>
                        )}
                    </nav>
                </div>
            </div>
            
            {isLoading && (
                <div 
                    className="header-loading-overlay"
                    role="status" 
                    aria-label={t('common.loading')}
                >
                    <LoaderCircle size={24} className="spinning" />
                    <span className="sr-only">{t('common.loading')}</span>
                </div>
            )}
        </header>
    );
};

export default Header;