

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useModal } from '../../context/ModalContext';
import { LoaderCircle, Sparkles, Heart, TrendingUp, CalendarDays, Save } from 'lucide-react';


const SettingsSlider = ({ icon: Icon, title, description, value, onChange }) => (
    <>
        <div className="settings-separator"/>
        <div className="settings-item">
            <div className="settings-item__label">
                <Icon size={24} className="settings-item__icon"/>
                <div>
                    <span className="settings-item__title">{title}</span>
                    <p className="settings-item__description">{description}</p>
                </div>
            </div>
        </div>
        <div className="settings-slider-container full-width" style={{ padding: '0 16px 16px' }}>
            <input 
                type="range" min="0" max="100" step="1" 
                value={value} 
                onChange={onChange}
                className="settings-slider"
            />
            <span className="settings-slider-value">{value}%</span>
        </div>
    </>
);


const WaveSettingsModal = () => {
    const { t } = useTranslation('home');
    const { showAlertModal, hideModal } = useModal();
    const [settings, setSettings] = useState(null);
    const [status, setStatus] = useState('loading'); 

    useEffect(() => {
        const fetchSettings = async () => {
            setStatus('loading');
            try {
                const data = await api.wave.getMyWaveSettings();
                setSettings(data);
                setStatus('success');
            } catch (error) {
                console.error("Failed to fetch wave settings:", error);
                setStatus('error');
            }
        };
        fetchSettings();
    }, []);

    const handleSliderChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: parseInt(value, 10) }));
    };

    const handleSave = async () => {
        setStatus('saving');
        try {
            await api.wave.updateMyWaveSettings(settings);
            setStatus('success');
            showAlertModal(t('wave.saveSuccess'), t('wave.settingsUpdated'));
            hideModal(); 
        } catch (error) {
            console.error("Failed to save wave settings:", error);
            setStatus('error');
            showAlertModal(t('wave.saveError'), t('wave.error'));
        }
    };
    
    if (status === 'loading') {
        return <div className="settings-group" style={{textAlign: 'center'}}><LoaderCircle size={28} className="animate-spin" /></div>;
    }

    if (status === 'error' || !settings) {
        return <div className="settings-group danger-zone">{t('wave.loadError')}</div>;
    }

    return (
        
        <div className="settings-group" style={{marginBottom: 0, border: 'none', background: 'transparent'}}>
            <p className="settings-group__description" style={{marginTop: 0}}>{t('wave.description')}</p>
            
            <SettingsSlider 
                icon={Sparkles}
                title={t('wave.exploration.title')}
                description={t('wave.exploration.description')}
                value={settings.exploration_factor}
                onChange={e => handleSliderChange('exploration_factor', e.target.value)}
            />
            <SettingsSlider 
                icon={Heart}
                title={t('wave.favorites.title')}
                description={t('wave.favorites.description')}
                value={settings.favorites_boost}
                onChange={e => handleSliderChange('favorites_boost', e.target.value)}
            />
            <SettingsSlider 
                icon={TrendingUp}
                title={t('wave.popularity.title')}
                description={t('wave.popularity.description')}
                value={settings.popularity_bias}
                onChange={e => handleSliderChange('popularity_bias', e.target.value)}
            />
            <SettingsSlider 
                icon={CalendarDays}
                title={t('wave.era.title')}
                description={t('wave.era.description')}
                value={settings.era_focus}
                onChange={e => handleSliderChange('era_focus', e.target.value)}
            />
            
            <div className="settings-modal__footer">
                <button className="settings-button settings-button--secondary" onClick={hideModal}>
                    {t('cancel', { ns: 'common' })}
                </button>
                <button className="settings-button settings-button--primary" onClick={handleSave} disabled={status === 'saving'}>
                    {status === 'saving' ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
                    {t('save', { ns: 'common' })}
                </button>
            </div>
        </div>
    );
};

export default WaveSettingsModal;