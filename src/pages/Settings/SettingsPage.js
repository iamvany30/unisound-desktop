import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useModal, MODAL_SIZES } from '../../context/ModalContext';
import { useTheme } from '../../context/ThemeContext';
import { useEqualizer } from '../../context/EqualizerContext';
import {
    DatabaseZap, Bell, BellRing, CheckCircle, ShieldOff,
    LoaderCircle, BellOff, Info, Palette, Music, Save, Settings as SettingsIcon, Upload
} from 'lucide-react';

import { GeneralSettings } from './GeneralSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { SoundSettings } from './SoundSettings';
import { DataSettings } from './DataSettings';

import styles from './SettingsSections.module.css';


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

const SavePresetModalBody = ({ onSave, onCancel }) => {
    const { t } = useTranslation(['settings', 'common']);
    const [name, setName] = useState('');
    return (
        <div className="save-preset-modal">
            <h4>{t('sound.savePresetTitle')}</h4>
            <p>{t('sound.presetModalDescription')}</p>
            <input
                type="text"
                className={styles.settings_input}
                placeholder={t('sound.presetModalPlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
            />
            <div className="settings-modal__footer" style={{marginTop: '16px'}}>
                <button className={`${styles.settingsButton} ${styles.settingsButtonSecondary}`} onClick={onCancel}>{t('cancel', { ns: 'common' })}</button>
                <button className={`${styles.settingsButton} ${styles.settingsButtonPrimary}`} onClick={() => onSave(name)} disabled={!name.trim()}>{t('save', { ns: 'common' })}</button>
            </div>
        </div>
    );
};

const convertImageToJpg = (file, quality = 0.9) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#0a0e13';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(img, 0, 0);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};



export const SettingsPage = () => {
    const { t, i18n } = useTranslation(['settings', 'common']);
    const { showModal, showConfirmModal, showAlertModal, hideModal } = useModal();
    const { resetAccentColor } = useTheme();
    const { customPresets, activePreset, saveCustomPreset, deleteCustomPreset } = useEqualizer();

    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('general');
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const [settings, setSettings] = useState({
        language: (i18n.language || 'ru').split('-')[0],
        notifications: { permission: 'default', isSubscribing: false },
        videoPreload: localStorage.getItem('unisound_videoPreload') === 'true',
        audioQuality: localStorage.getItem('unisound_audioQuality') || 'standard',
        backgroundImage: localStorage.getItem('unisound_custom_bg_image') || null,
        backgroundBlur: parseInt(localStorage.getItem('unisound_custom_bg_blur') || 20, 10),
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
    }, [showAlertModal, t]);

    const handleModalConfirm = useCallback(async () => {
        hideModal();
        const newPermission = await Notification.requestPermission();
        if (newPermission === 'granted') {
            await subscribeUserToPush();
        } else {
            setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, permission: newPermission } }));
        }
    }, [hideModal, subscribeUserToPush]);

    const handleEnableNotifications = () => {
        if (settings.notifications.permission === 'default') {
            showModal({
                title: t('notifications.modal.title'),
                body: <NotificationsModalBody />,
                footer: (
                    <div className="settings-modal__footer">
                        <button className={`${styles.settingsButton} ${styles.settingsButtonSecondary}`} onClick={hideModal}>{t('cancel', { ns: 'common' })}</button>
                        <button className={`${styles.settingsButton} ${styles.settingsButtonPrimary}`} onClick={handleModalConfirm}>{t('notifications.enable')}</button>
                    </div>
                ),
                size: MODAL_SIZES.MEDIUM
            });
        }
    };

    const dispatchBackgroundUpdate = () => {
        window.dispatchEvent(new CustomEvent('background-settings-changed'));
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

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showAlertModal(t('appearance.fileErrorMessage'), t('appearance.fileErrorTitle'));
            return;
        }

        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            showAlertModal(t('appearance.fileSizeError', 'Файл слишком большой! Максимальный размер: 5 МБ.'), t('appearance.fileErrorTitle'));
            return;
        }

        setIsProcessingImage(true);
        try {
            const jpgDataUrl = await convertImageToJpg(file);
            
            localStorage.setItem('unisound_custom_bg_image', jpgDataUrl);
            setSettings(prev => ({ ...prev, backgroundImage: jpgDataUrl }));
            dispatchBackgroundUpdate();
        } catch (error) {
            console.error("Error processing or saving image:", error);
            showAlertModal(t('appearance.storageError', 'Не удалось обработать или сохранить фон.'), t('appearance.fileErrorTitle'));
        } finally {
            setIsProcessingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleBlurChange = (event) => {
        const blurValue = event.target.value;
        localStorage.setItem('unisound_custom_bg_blur', blurValue);
        setSettings(prev => ({ ...prev, backgroundBlur: parseInt(blurValue, 10) }));
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
            }
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
            return <button className={`${styles.settingsButton} ${styles.settingsButtonPrimary}`} disabled><LoaderCircle size={18} className="animate-spin" /> {t('notifications.subscribing')}</button>;
        }
        switch (permission) {
            case 'granted': return <button className={`${styles.settingsButton} ${styles.settingsButtonSuccess}`} disabled><CheckCircle size={18} /> {t('notifications.enabled')}</button>;
            case 'denied': return <button className={`${styles.settingsButton}`} disabled><BellOff size={18} /> {t('notifications.blocked')}</button>;
            default: return <button className={`${styles.settingsButton} ${styles.settingsButtonPrimary}`} onClick={handleEnableNotifications}><Bell size={18} /> {t('notifications.enable')}</button>;
        }
    };

    const isCustomPresetActive = activePreset in customPresets;

    const handleSavePreset = () => showModal({
        title: t('sound.savePresetTitle'),
        body: <SavePresetModalBody onSave={(name) => { saveCustomPreset(name); hideModal(); }} onCancel={hideModal} />,
        size: MODAL_SIZES.SMALL,
        preventClose: true
    });

    const handleDeletePreset = () => showConfirmModal(
        t('sound.deleteConfirm', { presetName: activePreset }),
        () => deleteCustomPreset(activePreset)
    );
    
    const supportedLanguages = Object.keys(i18n.options.resources).map(langCode => ({
        code: langCode,
        name: i18n.getResource(langCode, 'common', 'languageName') || langCode
    }));

    const tabs = [
        { id: 'general', label: t('common.title'), icon: SettingsIcon, component: GeneralSettings, props: { settings, handleLanguageChange, handleQualityChange, handleVideoPreloadChange, t, supportedLanguages } },
        { id: 'appearance', label: t('appearance.title'), icon: Palette, component: AppearanceSettings, props: { settings, fileInputRef, handleFileChange, handleResetBackground, handleBlurChange, isProcessingImage, t } },
        { id: 'sound', label: t('sound.title'), icon: Music, component: SoundSettings, props: { handleSavePreset, handleDeletePreset, isCustomPresetActive, t } },
        { id: 'data', label: t('data.title'), icon: DatabaseZap, component: DataSettings, props: { NotificationStatusButton, handleFullReset, t } }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;
    const activeProps = tabs.find(tab => tab.id === activeTab)?.props;

    return (
        <div className="settings-page-container">
            <header className="settings-header">
                <h1 className="settings-title">{t('title')}</h1>
            </header>
            <div className="settings-layout">
                <nav className="settings-nav">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`settings-nav-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <main className="settings-content">
                    {ActiveComponent && <ActiveComponent key={activeTab} {...activeProps} />}
                </main>
            </div>
        </div>
    );
};