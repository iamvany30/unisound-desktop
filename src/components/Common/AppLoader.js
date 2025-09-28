import React from 'react';
import { useTranslation } from 'react-i18next';
import './AppLoader.css'; 

const AppLoader = ({ progress, statusText }) => {
    
    const { t } = useTranslation('common');

    return (
        <div className="app-loader-container">
            <div className="app-loader-card">
                
                <div className="app-loader-visualizer">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                </div>
                
                <h1 className="app-loader-title">{t('app.appName')}</h1>
                
                <div className="app-loader-progress-bar">
                    <div 
                        className="app-loader-progress-fill" 
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p key={statusText} className="app-loader-status">
                    {statusText}
                </p>

            </div>
        </div>
    );
};

export default React.memo(AppLoader);