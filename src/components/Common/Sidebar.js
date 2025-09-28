import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

import { Home, User, Settings, LogOut, Library, Shield, Heart } from 'lucide-react';
import './Sidebar.css';

const AvatarFallback = () => (
    <div className="profile-avatar-fallback">
        <User size={32} />
    </div>
);

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation('common');

    return (
        <aside className="sidebar glass-system-component">
            <div className="sidebar-block">
                <nav className="sidebar-nav">
                    <NavLink to="/" className="nav-item" end>
                        <Home size={20} />
                        <span>{t('header.home')}</span>
                    </NavLink>
                    <NavLink to="/likes" className="nav-item">
                        <Heart size={20} />
                        <span>{t('header.likedSongs')}</span>
                    </NavLink>
                    <NavLink to="/library" className="nav-item">
                        <Library size={20} />
                        <span>{t('header.library')}</span>
                    </NavLink>
                </nav>
            </div>
            
            <div className="sidebar-block profile-block">
                {user ? (
                    <>
                        <div className="profile-info">
                            <div className="profile-avatar-container">
                                {user.profile_picture_url ? (
                                    <img 
                                        src={user.profile_picture_url} 
                                        alt={t('header.profile')} 
                                        className="profile-avatar"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                ) : (
                                    <AvatarFallback />
                                )}
                            </div>
                            <div className="profile-details">
                                <span className="profile-name">{user.username}</span>
                                <span className="profile-status">
                                    {user.is_superuser ? t('userStatus.admin') : t('userStatus.user')}
                                </span>
                            </div>
                        </div>
                        <nav className="profile-nav">
                            {user.is_superuser && (
                                <NavLink to="/admin" className="nav-item">
                                    <Shield size={20} />
                                    <span>{t('header.adminPanel')}</span>
                                </NavLink>
                            )}
                            <NavLink to="/profile" className="nav-item">
                                <User size={20} />
                                <span>{t('header.profile')}</span>
                            </NavLink>
                            <NavLink to="/settings" className="nav-item">
                                <Settings size={20} />
                                <span>{t('header.settings')}</span>
                            </NavLink>
                            <button onClick={logout} className="nav-item">
                                <LogOut size={20} />
                                <span>{t('header.logout')}</span>
                            </button>
                        </nav>
                    </>
                ) : (
                    <nav className="profile-nav">
                        <NavLink to="/login" className="nav-item">
                            <User size={20} />
                            <span>{t('header.login')}</span>
                        </NavLink>
                    </nav>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;