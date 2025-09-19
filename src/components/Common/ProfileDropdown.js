import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings, User, LogOut } from 'lucide-react';

const ProfileDropdown = ({ onLogout }) => {
    const { t } = useTranslation();

    return (
        <div className="profile-dropdown-menu">
            <ul>
                <li>
                    <Link to="/settings" className="dropdown-item">
                        <Settings size={16} />
                        <span>{t('header.settings')}</span>
                    </Link>
                </li>
                <li>
                    <Link to="/profile" className="dropdown-item">
                        <User size={16} />
                        <span>{t('header.profile')}</span>
                    </Link>
                </li>
                <li>
                    <button onClick={onLogout} className="dropdown-item dropdown-item--logout">
                        <LogOut size={16} />
                        <span>{t('header.logout')}</span>
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default ProfileDropdown;