import React, { useState, useEffect } from 'react';
import { Globe, Gauge, Video, RefreshCw } from 'lucide-react';
import styles from './SettingsSections.module.css';
import { CustomSelect } from '../../components/Common/CustomSelect';

export const GeneralSettings = ({ settings, handleLanguageChange, handleQualityChange, handleVideoPreloadChange, t, supportedLanguages }) => {

    const [appVersion, setAppVersion] = useState('');
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const getVersion = async () => {
            if (window.electronAPI) {
                const version = await window.electronAPI.getAppVersion();
                setAppVersion(version || 'N/A');
            }
        };
        getVersion();
    }, []);

    const handleCheckForUpdates = async () => {
        if (window.electronAPI) {
            setIsChecking(true);
            await window.electronAPI.checkForUpdates();
            setTimeout(() => setIsChecking(false), 2000); 
        }
    };

    const languageOptions = [
        {
            options: supportedLanguages.map(lang => ({
                value: lang.code,
                label: lang.name
            }))
        }
    ];

    const handleSelectChange = (newValue) => {
        handleLanguageChange({ target: { value: newValue } });
    };

    return (
        <div className={styles.settingsGroup}>
            <h2 className={styles.settingsGroupTitle}>{t('common.title')}</h2>

            <div className={styles.settingsItem}>
                <div className={styles.settingsItemLabel}>
                    <Globe size={24} className={styles.settingsItemIcon}/>
                    <div>
                        <span className={styles.settingsItemTitle}>{t('language.title')}</span>
                    </div>
                </div>

                <CustomSelect
                    options={languageOptions}
                    value={settings.language}
                    onChange={handleSelectChange}
                    isSearchable={true}
                    placeholder={t('language.select', 'Выберите язык...')}
                />
            </div>

            <hr className={styles.settingsSeparator}/>

            <div className={styles.settingsItem}>
                <div className={styles.settingsItemLabel}>
                    <Gauge size={24} className={styles.settingsItemIcon}/>
                    <div>
                        <span className={styles.settingsItemTitle}>{t('quality.title')}</span>
                        <p className={styles.settingsItemDescription}>{t('quality.description')}</p>
                    </div>
                </div>
                <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                        <input type="radio" name="quality" value="low" checked={settings.audioQuality === 'low'} onChange={handleQualityChange}/>
                        <span className={styles.radioCustom}></span>
                        <span>{t('quality.low')}</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input type="radio" name="quality" value="standard" checked={settings.audioQuality === 'standard'} onChange={handleQualityChange}/>
                        <span className={styles.radioCustom}></span>
                        <span>{t('quality.standard')}</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input type="radio" name="quality" value="high" checked={settings.audioQuality === 'high'} onChange={handleQualityChange}/>
                        <span className={styles.radioCustom}></span>
                        <span>{t('quality.high')}</span>
                    </label>
                </div>
            </div>

            <hr className={styles.settingsSeparator}/>

            <div className={styles.settingsItem}>
                <div className={styles.settingsItemLabel}>
                    <Video size={24} className={styles.settingsItemIcon}/>
                    <div>
                        <span className={styles.settingsItemTitle}>{t('video.title')}</span>
                        <p className={styles.settingsItemDescription}>{t('video.description')}</p>
                    </div>
                </div>
                <label className={styles.toggleSwitch}>
                    <input type="checkbox" checked={settings.videoPreload} onChange={handleVideoPreloadChange}/>
                    <span className={styles.toggleSlider}/>
                </label>
            </div>
            
            <hr className={styles.settingsSeparator}/>

            <div className={styles.settingsItem}>
                <div className={styles.settingsItemLabel}>
                    <RefreshCw size={24} className={styles.settingsItemIcon} />
                    <div>
                        <span className={styles.settingsItemTitle}>{t('update.title', 'Обновления')}</span>
                        <p className={styles.settingsItemDescription}>
                            {t('update.current_version', 'Текущая версия:')} {appVersion}
                        </p>
                    </div>
                </div>
                <button
                    className={styles.settingsActionButton}
                    onClick={handleCheckForUpdates}
                    disabled={isChecking}
                >
                    {isChecking ? t('update.checking', 'Проверка...') : t('update.check_button', 'Проверить обновления')}
                </button>
            </div>
        </div>
    );
};