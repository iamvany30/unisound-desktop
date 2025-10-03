import React from 'react';
import { Bell, DatabaseZap } from 'lucide-react';
import styles from './SettingsSections.module.css';

export const DataSettings = ({ NotificationStatusButton, handleFullReset, t }) => (
    <>
        <div className={styles.settingsGroup}>
            <h2 className={styles.settingsGroupTitle}>{t('notifications.groupTitle')}</h2>
            <div className={styles.settingsItem}>
                <div className={styles.settingsItemLabel}>
                    <Bell size={24} className={styles.settingsItemIcon}/>
                    <div>
                        <span className={styles.settingsItemTitle}>{t('notifications.title')}</span>
                    </div>
                </div>
                <NotificationStatusButton/>
            </div>
        </div>

        <div className={`${styles.settingsGroup} ${styles.dangerZone}`}>
            <h2 className={`${styles.settingsGroupTitle} ${styles.dangerZoneTitle}`}>{t('fullReset.title')}</h2>
            <p className={styles.settingsGroupDescription}>{t('fullReset.description')}</p>
            <div style={{width: '100%', display: 'flex', justifyContent: 'flex-end'}}>
                <button className={`${styles.settingsButton} ${styles.settingsButtonDanger}`} onClick={handleFullReset}>
                    <DatabaseZap size={18}/> {t('fullReset.button')}
                </button>
            </div>
        </div>
    </>
);