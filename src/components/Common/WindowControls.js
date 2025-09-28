

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useElectronWindow } from '../../hooks/useElectronWindow';
import './WindowControls.css';


import { Minimize2, X } from 'lucide-react';

const MaximizeIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    </svg>
);
const RestoreIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
    </svg>
);

const WindowControls = React.memo(() => {
    const { isElectron, isMaximized, minimize, toggleMaximize, close } = useElectronWindow();
    const { t } = useTranslation();
    
    
    const isWindows = window.navigator.platform.includes('Win32');

    
    if (!isElectron || isWindows) {
        return null;
    }

    
    return (
        <div className="window-controls mac-controls" role="group" aria-label={t('header.windowControls')}>
            <button className="window-control-btn close-btn" onClick={() => close?.()} aria-label={t('header.close')}>
                <X size={12} strokeWidth={2.5} />
            </button>
            <button className="window-control-btn minimize-btn" onClick={() => minimize?.()} aria-label={t('header.minimize')}>
                <Minimize2 size={12} strokeWidth={2.5} />
            </button>
            <button className="window-control-btn maximize-btn" onClick={() => toggleMaximize?.()} aria-label={isMaximized ? t('header.restore') : t('header.maximize')}>
                {isMaximized ? <RestoreIcon size={12} /> : <MaximizeIcon size={12} />}
            </button>
        </div>
    );
});

WindowControls.displayName = 'WindowControls';
export default WindowControls;