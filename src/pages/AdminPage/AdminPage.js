import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Music, SlidersHorizontal, HardDrive } from 'lucide-react';

import ManageTracks from './components/ManageTracks';
import ManageUsers from './components/ManageUsers';
import ManageWaveConfig from './components/ManageWaveConfig';
import ManageSystem from './components/ManageSystem';

import './AdminPage.css';

const AdminPage = () => {
    const { t } = useTranslation('admin');
    const [activeSection, setActiveSection] = useState('tracks');

    const sections = [
        { id: 'tracks', label: t('manageTracks'), icon: Music, component: <ManageTracks /> },
        { id: 'users', label: t('manageUsers'), icon: Users, component: <ManageUsers /> },
        { id: 'wave', label: 'Алгоритм Волны', icon: SlidersHorizontal, component: <ManageWaveConfig /> },
        { id: 'system', label: t('system'), icon: HardDrive, component: <ManageSystem /> },
    ];
    
    const ActiveComponent = sections.find(s => s.id === activeSection)?.component;

    return (
        <div className="admin-container">
            <header className="admin-header">
                <Shield size={40} />
                <h1 className="admin-title">{t('title')}</h1>
            </header>
            <div className="admin-layout">
                <nav className="admin-sidebar">
                    {sections.map(section => (
                        <button 
                            key={section.id} 
                            className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <section.icon size={20} />
                            <span>{section.label}</span>
                        </button>
                    ))}
                </nav>
                <main className="admin-content">
                    {ActiveComponent}
                </main>
            </div>
        </div>
    );
};

export default AdminPage;