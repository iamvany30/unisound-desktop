import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useModal, MODAL_SIZES } from '../context/ModalContext';
import {
    Globe, DatabaseZap, Bell, BellRing, CheckCircle, ShieldOff,
    LoaderCircle, BellOff, Info, Video, Gauge
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

const SettingsPage = () => {
    const { t, i18n } = useTranslation(['settings', 'common']);
    const { showModal, showConfirmModal, showAlertModal, hideModal } = useModal();

    const [settings, setSettings] = useState({
        language: (i18n.language || 'ru').split('-')[0],
        notifications: {
            permission: 'default',
            isSubscribing: false,
        },
        videoPreload: localStorage.getItem('unisound_videoPreload') === 'true',
        audioQuality: localStorage.getItem('unisound_audioQuality') || 'standard',
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
        setSettings(prev => ({...prev, audioQuality: newQuality}));
        localStorage.setItem('unisound_audioQuality', newQuality);
    };

    const handleFullReset = () => {
        showConfirmModal(
            t('fullReset.confirm'),
            () => {
                localStorage.clear();
                sessionStorage.clear();
                showAlertModal(t('fullReset.success'), t('fullReset.successTitle'));
                setTimeout(() => window.location.assign('/login'), 2000);
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
                    <div className="settings-item__label">
                        <Globe size={24} className="settings-item__icon" />
                        <div>
                            <span className="settings-item__title">{t('language.title')}</span>
                        </div>
                    </div>
                    <div className="select-wrapper">
                        <select className="settings-select" value={settings.language} onChange={handleLanguageChange}>
                            <option value="ru">Русский</option>
                        </select>
                    </div>
                </div>

                <div className="settings-separator" />

                <div className="settings-item">
                     <div className="settings-item__label">
                        <Gauge size={24} className="settings-item__icon" />
                        <div>
                            <span className="settings-item__title">{t('quality.title')}</span>
                            <p className="settings-item__description">{t('quality.description')}</p>
                        </div>
                    </div>
                     <div className="radio-group">
                         <label className="radio-label">
                            <input type="radio" name="quality" value="low" checked={settings.audioQuality === 'low'} onChange={handleQualityChange} />
                            <span className="radio-custom"></span>{t('quality.low')}
                         </label>
                         <label className="radio-label">
                            <input type="radio" name="quality" value="standard" checked={settings.audioQuality === 'standard'} onChange={handleQualityChange} />
                            <span className="radio-custom"></span>{t('quality.standard')}
                         </label>
                         <label className="radio-label">
                            <input type="radio" name="quality" value="high" checked={settings.audioQuality === 'high'} onChange={handleQualityChange} />
                            <span className="radio-custom"></span>{t('quality.high')}
                        </label>
                     </div>
                </div>

                <div className="settings-separator" />

                <div className="settings-item">
                    <div className="settings-item__label">
                        <Video size={24} className="settings-item__icon" />
                        <div>
                            <span className="settings-item__title">{t('video.title')}</span>
                            <p className="settings-item__description">{t('video.description')}</p>
                        </div>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={settings.videoPreload} onChange={handleVideoPreloadChange} />
                        <span className="toggle-slider" />
                    </label>
                </div>

                <div className="settings-separator" />
                
                <div className="settings-item">
                    <div className="settings-item__label">
                        <Bell size={24} className="settings-item__icon" />
                        <div>
                            <span className="settings-item__title">{t('notifications.title')}</span>
                        </div>
                    </div>
                    <NotificationStatusButton />
                </div>
                
                <div className="settings-separator" />

                <div className="danger-zone">
                    <h3 className="danger-zone__title">{t('fullReset.title')}</h3>
                    <p className="danger-zone__description">{t('fullReset.description')}</p>
                    <button className="settings-button settings-button--danger" onClick={handleFullReset}>
                        <DatabaseZap size={18} /> {t('fullReset.button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;