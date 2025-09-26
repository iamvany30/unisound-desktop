import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useModal, MODAL_SIZES } from '../context/ModalContext';
import { useTheme } from '../context/ThemeContext';
import {
    Globe, DatabaseZap, Bell, BellRing, CheckCircle, ShieldOff,
    LoaderCircle, BellOff, Info, Video, Gauge, Image as ImageIcon, Trash2,
    Palette, Check, Play, Sun, Moon, Monitor, Rows, Columns, Droplet, Wind
} from 'lucide-react';

import './SettingsPage.css';


function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const VAPID_PUBLIC_KEY = 'BHt2jS5wBYF-y2v4oNq9-gXz4E0jzq_CqxlptqUaE1n9hfn5A5A4iW_nAsj5S-d2A7v1x7iJz5q1X9sE3cK4lY0';

const PRESET_COLORS = [
    { name: 'UniSound Blue', value: '#3b82f6' },
    { name: 'Emerald Green', value: '#10b981' },
    { name: 'Rose Pink', value: '#f43f5e' },
    { name: 'Vibrant Purple', value: '#8b5cf6' },
    { name: 'Warm Orange', value: '#f97316' },
    { name: 'Electric Cyan', value: '#06b6d4' },
];

const NotificationsModalBody = () => {
    const { t } = useTranslation('settings');
    return (
        <div className="settings-modal-body">
            <div className="settings-modal__icon-container"><BellRing size={32} /></div>
            <h3 className="settings-modal__subtitle">{t('notifications.modal.title')}</h3>
            <p className="settings-modal__description">{t('notifications.modal.description')}</p>
            <div className="settings-modal__feature-list">
                <div className="settings-modal__feature-item"><CheckCircle size={20} className="icon-success" /><span>{t('notifications.modal.feature1')}</span></div>
                <div className="settings-modal__feature-item"><CheckCircle size={20} className="icon-success" /><span>{t('notifications.modal.feature2')}</span></div>
                <div className="settings-modal__feature-item"><ShieldOff size={20} className="icon-danger" /><span>{t('notifications.modal.feature3')}</span></div>
            </div>
            <div className="settings-modal__info-box"><Info size={16} /><span className="settings-modal__info-text">{t('notifications.modal.info')}</span></div>
        </div>
    );
};

const ThemePreview = () => {
    return (
        <div className="theme-preview-card">
            <div className="preview-header">
                <span className="preview-dot" style={{ background: '#ED6A5E' }}></span>
                <span className="preview-dot" style={{ background: '#F4BF4F' }}></span>
                <span className="preview-dot" style={{ background: '#61C554' }}></span>
            </div>
            <div className="preview-content">
                <div className="preview-title-bar">
                    <h3 className="preview-title" style={{ background: 'var(--text-gradient-hero)' }}>Заголовок</h3>
                    <div className="preview-text-line short"></div>
                </div>
                <div className="preview-button-group">
                    <button className="preview-button secondary">Кнопка</button>
                    <button className="preview-button primary" style={{ background: 'var(--color-accent-primary)' }}>
                        <Play size={14} fill="currentColor" />
                        <span>Нажать</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


export const SettingsPage = () => {
    const { t, i18n } = useTranslation(['settings', 'common']);
    const { showModal, showConfirmModal, showAlertModal, hideModal } = useModal();
    const {
        themePreference,
        changeThemePreference,
        density,
        changeDensity,
        toggleDensity,
        glassBlur,
        changeGlassBlur,
        glassAlpha,
        changeGlassAlpha,
        themeHsl,
        accentColorHex,
        changeAccentColor,
        resetAccentColor,
        changeHslPart
    } = useTheme();
    
    const fileInputRef = useRef(null);

    const [settings, setSettings] = useState({
        language: (i18n.language || 'ru').split('-')[0],
        notifications: { permission: 'default', isSubscribing: false },
        videoPreload: localStorage.getItem('unisound_videoPreload') === 'true',
        audioQuality: localStorage.getItem('unisound_audioQuality') || 'standard',
        backgroundImage: localStorage.getItem('unisound_custom_bg_image') || null,
        backgroundBlur: localStorage.getItem('unisound_custom_bg_blur') || 20,
    });

    useEffect(() => {
        if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
            setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, permission: Notification.permission } }));
        } else {
            setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, permission: 'denied' } }));
        }
    }, []);

    const subscribeUserToPush = useCallback(async () => {
        setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, isSubscribing: true } }));
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            await api.user.savePushSubscription(subscription);
            showAlertModal(t('notifications.success'), t('notifications.successTitle'));
            setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, permission: 'granted' } }));
        } catch (error) {
            console.error('Push subscription error:', error);
            showAlertModal(t('notifications.error'), t('notifications.errorTitle'));
            setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, permission: 'denied' } }));
        } finally {
            setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, isSubscribing: false } }));
        }
    }, [t, showAlertModal]);

    const handleModalConfirm = async () => {
        hideModal();
        const newPermission = await Notification.requestPermission();
        if (newPermission === 'granted') {
            await subscribeUserToPush();
        } else {
            setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, permission: newPermission } }));
        }
    };

    const handleEnableNotifications = () => {
        if (settings.notifications.permission === 'default') {
            showModal({
                title: t('notifications.modal.title'),
                body: <NotificationsModalBody />,
                footer: (
                    <div className="settings-modal__footer">
                        <button className="settings-button settings-button--secondary" onClick={hideModal}>{t('cancel', { ns: 'common' })}</button>
                        <button className="settings-button settings-button--primary" onClick={handleModalConfirm}>{t('notifications.enable')}</button>
                    </div>
                ),
                size: MODAL_SIZES.MEDIUM
            });
        }
    };

    const handleLanguageChange = (event) => {
        const newLanguage = event.target.value;
        i18n.changeLanguage(newLanguage);
        setSettings(prev => ({ ...prev, language: newLanguage }));
    };

    const handleVideoPreloadChange = (event) => {
        const isEnabled = event.target.checked;
        setSettings(prev => ({ ...prev, videoPreload: isEnabled }));
        localStorage.setItem('unisound_videoPreload', String(isEnabled));
    };

    const handleQualityChange = (event) => {
        const newQuality = event.target.value;
        setSettings(prev => ({ ...prev, audioQuality: newQuality }));
        localStorage.setItem('unisound_audioQuality', newQuality);
        showAlertModal(t('quality.changed'));
    };

    const dispatchBackgroundUpdate = () => {
        window.dispatchEvent(new CustomEvent('background-settings-changed'));
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showAlertModal(t('appearance.fileErrorMessage'), t('appearance.fileErrorTitle'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Image = e.target.result;
            localStorage.setItem('unisound_custom_bg_image', base64Image);
            setSettings(prev => ({ ...prev, backgroundImage: base64Image }));
            dispatchBackgroundUpdate();
        };
        reader.readAsDataURL(file);
    };

    const handleBlurChange = (event) => {
        const blurValue = event.target.value;
        localStorage.setItem('unisound_custom_bg_blur', blurValue);
        setSettings(prev => ({ ...prev, backgroundBlur: blurValue }));
        dispatchBackgroundUpdate();
    };

    const handleResetBackground = () => {
        showConfirmModal(
            t('appearance.resetConfirmMessage'),
            () => {
                localStorage.removeItem('unisound_custom_bg_image');
                localStorage.removeItem('unisound_custom_bg_blur');
                setSettings(prev => ({ ...prev, backgroundImage: null, backgroundBlur: 20 }));
                dispatchBackgroundUpdate();
                showAlertModal(t('appearance.resetSuccessMessage'));
            },
            null,
            t('appearance.resetConfirmTitle')
        );
    };

    const handleFullReset = () => {
        showConfirmModal(
            t('fullReset.confirm'),
            () => {
                localStorage.clear();
                sessionStorage.clear();
                resetAccentColor();
                dispatchBackgroundUpdate();
                showAlertModal(t('fullReset.success'), t('fullReset.successTitle'));
                setTimeout(() => window.location.reload(), 2000);
            }
        );
    };

    const NotificationStatusButton = () => {
        const { permission, isSubscribing } = settings.notifications;
        if (isSubscribing) {
            return <button className="settings-button settings-button--primary" disabled><LoaderCircle size={18} className="animate-spin" /> {t('notifications.subscribing')}</button>;
        }
        switch (permission) {
            case 'granted': return <button className="settings-button settings-button--success" disabled><CheckCircle size={18} /> {t('notifications.enabled')}</button>;
            case 'denied': return <button className="settings-button settings-button--disabled" disabled><BellOff size={18} /> {t('notifications.blocked')}</button>;
            default: return <button className="settings-button settings-button--primary" onClick={handleEnableNotifications}><Bell size={18} /> {t('notifications.enable')}</button>;
        }
    };

    return (
        <div className="settings-page-container">
            <header className="settings-header">
                <h1 className="settings-title">{t('title')}</h1>
            </header>
            
            <div className="settings-card">
                <div className="settings-item">
                    <div className="settings-item__label"><Globe size={24} className="settings-item__icon"/><div><span className="settings-item__title">{t('language.title')}</span></div></div>
                    <div className="select-wrapper"><select className="settings-select" value={settings.language} onChange={handleLanguageChange}><option value="ru">Русский</option></select></div>
                </div>
                <div className="settings-separator"/>

                <div className="settings-item">
                     <div className="settings-item__label"><Gauge size={24} className="settings-item__icon"/><div><span className="settings-item__title">{t('quality.title')}</span><p className="settings-item__description">{t('quality.description')}</p></div></div>
                     <div className="radio-group">
                         <label className="radio-label"><input type="radio" name="quality" value="low" checked={settings.audioQuality === 'low'} onChange={handleQualityChange}/><span className="radio-custom"></span>{t('quality.low')}</label>
                         <label className="radio-label"><input type="radio" name="quality" value="standard" checked={settings.audioQuality === 'standard'} onChange={handleQualityChange}/><span className="radio-custom"></span>{t('quality.standard')}</label>
                         <label className="radio-label"><input type="radio" name="quality" value="high" checked={settings.audioQuality === 'high'} onChange={handleQualityChange}/><span className="radio-custom"></span>{t('quality.high')}</label>
                     </div>
                </div>
                <div className="settings-separator"/>

                <div className="settings-item">
                    <div className="settings-item__label"><Video size={24} className="settings-item__icon"/><div><span className="settings-item__title">{t('video.title')}</span><p className="settings-item__description">{t('video.description')}</p></div></div>
                    <label className="toggle-switch"><input type="checkbox" checked={settings.videoPreload} onChange={handleVideoPreloadChange}/><span className="toggle-slider"/></label>
                </div>
                <div className="settings-separator"/>
                
                <div className="settings-item-group">
                    <div className="settings-item__label full-width"><Palette size={24} className="settings-item__icon"/><div><span className="settings-item__title">{t('appearance.title')}</span></div></div>
                    
                    <div className="settings-item">
                        <div className="settings-item__label"><Sun size={20}/><span>{t('appearance.theme')}</span></div>
                        <div className="segmented-control">
                            <button className={`segment-button ${themePreference === 'light' ? 'active' : ''}`} onClick={() => changeThemePreference('light')}><Sun size={16}/> {t('appearance.themeLight')}</button>
                            <button className={`segment-button ${themePreference === 'dark' ? 'active' : ''}`} onClick={() => changeThemePreference('dark')}><Moon size={16}/> {t('appearance.themeDark')}</button>
                            <button className={`segment-button ${themePreference === 'system' ? 'active' : ''}`} onClick={() => changeThemePreference('system')}><Monitor size={16}/> {t('appearance.themeSystem')}</button>
                        </div>
                    </div>
                    <div className="settings-item">
                        <div className="settings-item__label">
                            {density === 'compact' ? <Rows size={20}/> : <Columns size={20}/>}
                            <span>{t('appearance.density')}</span>
                        </div>
                        <div className="segmented-control">
                            <button
                                className={`segment-button ${density === 'comfortable' ? 'active' : ''}`}
                                onClick={() => changeDensity('comfortable')}
                            >
                                {t('appearance.densityComfortable')}
                            </button>
                            <button
                                className={`segment-button ${density === 'compact' ? 'active' : ''}`}
                                onClick={() => changeDensity('compact')}
                            >
                                {t('appearance.densityCompact')}
                            </button>
                        </div>
                    </div>

                    <div className="theme-editor">
                        <ThemePreview />
                        <div className="theme-controls">
                            <p className="settings-item__description">{t('appearance.colorDescription')}</p>
                            <div className="color-picker-wrapper">
                               <input type="color" value={accentColorHex} onChange={(e) => changeAccentColor(e.target.value)} className="color-picker-input"/>
                               <div className="color-presets">
                                   {PRESET_COLORS.map(preset => (
                                       <button key={preset.value} className="color-swatch" title={preset.name} style={{ backgroundColor: preset.value }} onClick={() => changeAccentColor(preset.value)} aria-label={`Выбрать цвет: ${preset.name}`}>
                                           {accentColorHex === preset.value && <Check size={16}/>}
                                       </button>
                                   ))}
                               </div>
                            </div>
                            <div className="settings-slider-container full-width column"><label>Оттенок (H)</label><input type="range" min="0" max="360" value={themeHsl.h} onChange={e => changeHslPart('h', parseInt(e.target.value, 10))} className="settings-slider hue-slider"/></div>
                            <div className="settings-slider-container full-width column"><label>Насыщенность (S)</label><input type="range" min="0" max="100" value={themeHsl.s} onChange={e => changeHslPart('s', parseInt(e.target.value, 10))} className="settings-slider" style={{'--track-bg': `linear-gradient(90deg, hsl(${themeHsl.h}, 0%, ${themeHsl.l}%), hsl(${themeHsl.h}, 100%, ${themeHsl.l}%))`}}/></div>
                            <div className="settings-slider-container full-width column"><label>Яркость (L)</label><input type="range" min="0" max="100" value={themeHsl.l} onChange={e => changeHslPart('l', parseInt(e.target.value, 10))} className="settings-slider" style={{'--track-bg': `linear-gradient(90deg, #000, hsl(${themeHsl.h}, ${themeHsl.s}%, 50%), #fff)`}}/></div>
                            <button className="settings-button settings-button--danger-secondary" onClick={resetAccentColor} style={{alignSelf: 'flex-start'}}>{t('appearance.resetColorButton')}</button>
                        </div>
                    </div>
                </div>
                <div className="settings-separator"/>

                <div className="settings-item-group">
                    <div className="settings-item__label full-width"><ImageIcon size={24} className="settings-item__icon"/><div><span className="settings-item__title">{t('appearance.background')}</span><p className="settings-item__description">{t('appearance.backgroundDescription')}</p></div></div>
                    <div className="appearance-controls">
                        <div className="background-preview" style={{ backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none' }}>{!settings.backgroundImage && <ImageIcon size={32}/>}</div>
                        <div className="appearance-buttons">
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg, image/webp" onChange={handleFileChange}/>
                            <button className="settings-button settings-button--secondary" onClick={() => fileInputRef.current.click()}>{t('appearance.uploadButton')}</button>
                            <button className="settings-button settings-button--danger-secondary" onClick={handleResetBackground} disabled={!settings.backgroundImage}><Trash2 size={16}/> {t('appearance.resetButton')}</button>
                        </div>
                    </div>
                    <div className="settings-slider-container full-width"><label htmlFor="blur-slider" className="slider-label">{t('appearance.blur')}</label><input id="blur-slider" type="range" min="0" max="100" step="1" value={settings.backgroundBlur} onChange={handleBlurChange} className="settings-slider"/><span className="settings-slider-value">{settings.backgroundBlur}px</span></div>
                </div>
                <div className="settings-separator"/>
                
                <div className="settings-item">
                    <div className="settings-item__label"><Bell size={24} className="settings-item__icon"/><div><span className="settings-item__title">{t('notifications.title')}</span></div></div>
                    <NotificationStatusButton/>
                </div>
                <div className="settings-separator"/>

                <div className="danger-zone">
                    <h3 className="danger-zone__title">{t('fullReset.title')}</h3>
                    <p className="danger-zone__description">{t('fullReset.description')}</p>
                    <button className="settings-button settings-button--danger" onClick={handleFullReset}><DatabaseZap size={18}/> {t('fullReset.button')}</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;