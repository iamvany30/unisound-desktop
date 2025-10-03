import React, { useRef, useState, useLayoutEffect, memo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { 
    Sun, Moon, Monitor, Rows, ImageIcon, Trash2, Check, Play, Palette, 
    Image, LoaderCircle, Upload 
} from 'lucide-react';
import styles from './SettingsSections.module.css';
import CustomColorPicker from './CustomColorPicker';

const PRESET_COLORS = [
    { name: 'UniSound Blue', value: '#3b82f6' }, { name: 'Emerald Green', value: '#10b981' },
    { name: 'Rose Pink', value: '#f43f5e' }, { name: 'Vibrant Purple', value: '#8b5cf6' },
    { name: 'Warm Orange', value: '#f97316' }, { name: 'Electric Cyan', value: '#06b6d4' },
];

const ThemePreview = memo(({ accentColorHex }) => {
    const { t } = useTranslation('settings');
    const dynamicGradient = `linear-gradient(45deg, ${accentColorHex}, hsl(var(--accent-h), calc(var(--accent-s) + 5%), calc(var(--accent-l) + 10%)))`;
    return (
        <div className="theme-preview-card">
            <div className="preview-header">
                <span className="preview-dot" style={{ background: '#ED6A5E' }}></span>
                <span className="preview-dot" style={{ background: '#F4BF4F' }}></span>
                <span className="preview-dot" style={{ background: '#61C554' }}></span>
            </div>
            <div className="preview-content">
                <h3 className="preview-title" style={{ backgroundImage: dynamicGradient }}>
                    {t('appearance.preview.title')}
                </h3>
                <div className="preview-button-group">
                    <button className="preview-button secondary">{t('appearance.preview.button')}</button>
                    <button className="preview-button primary" style={{ backgroundColor: accentColorHex }}>
                        <Play size={14} fill="currentColor" />
                        <span>{t('appearance.preview.button')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
});
ThemePreview.displayName = 'ThemePreview';

const ColorSlider = memo(({ label, value, max, onChange, trackStyle }) => (
    <div className={styles.settingsSliderContainer}>
        <label className="slider-label">{label}</label>
        <input 
            type="range" 
            min="0" 
            max={max} 
            value={value} 
            onChange={e => onChange(parseInt(e.target.value, 10))} 
            className={`${styles.settingsSlider} color-slider`}
            style={trackStyle}
        />
        <span className={styles.settingsSliderValue}>{value}</span>
    </div>
));
ColorSlider.displayName = 'ColorSlider';

const useGlider = (dependency) => {
    const containerRef = useRef(null);
    const [gliderStyle, setGliderStyle] = useState({});
    useLayoutEffect(() => {
        const container = containerRef.current;
        const activeButton = container?.querySelector(`.${styles.segmentButton}.active`);
        if (activeButton) {
            const { offsetLeft, offsetWidth } = activeButton;
            setGliderStyle({ left: `${offsetLeft}px`, width: `${offsetWidth}px` });
        }
    }, [dependency, containerRef]);
    return { containerRef, gliderStyle };
};

export const AppearanceSettings = ({ 
    settings, 
    fileInputRef, 
    handleFileChange, 
    handleResetBackground, 
    handleBlurChange, 
    isProcessingImage, 
    t 
}) => {
    const { 
        themePreference, changeThemePreference, 
        density, changeDensity, 
        themeHsl, accentColorHex, 
        changeAccentColor, resetAccentColor, changeHslPart 
    } = useTheme();

    const themeGlider = useGlider(themePreference);
    const densityGlider = useGlider(density);

    return (
        <div className={styles.settingsGroup}>
            <h2 className={styles.settingsGroupTitle}>{t('appearance.title')}</h2>
            <div className={styles.settingsItem}>
                <div className={styles.settingsItemLabel}><Sun size={20} className={styles.settingsItemIcon}/><span>{t('appearance.theme')}</span></div>
                <div className={styles.segmentedControl} ref={themeGlider.containerRef}>
                    <button className={`${styles.segmentButton} ${themePreference === 'light' ? 'active' : ''}`} onClick={() => changeThemePreference('light')}><Sun size={16}/> {t('appearance.themeLight')}</button>
                    <button className={`${styles.segmentButton} ${themePreference === 'dark' ? 'active' : ''}`} onClick={() => changeThemePreference('dark')}><Moon size={16}/> {t('appearance.themeDark')}</button>
                    <button className={`${styles.segmentButton} ${themePreference === 'system' ? 'active' : ''}`} onClick={() => changeThemePreference('system')}><Monitor size={16}/> {t('appearance.themeSystem')}</button>
                    <div className={styles.glider} style={themeGlider.gliderStyle} />
                </div>
            </div>
            <div className={styles.settingsItem}>
                <div className={styles.settingsItemLabel}><Rows size={20} className={styles.settingsItemIcon}/><span>{t('appearance.density')}</span></div>
                <div className={styles.segmentedControl} ref={densityGlider.containerRef}>
                    <button className={`${styles.segmentButton} ${density === 'comfortable' ? 'active' : ''}`} onClick={() => changeDensity('comfortable')}> {t('appearance.densityComfortable')} </button>
                    <button className={`${styles.segmentButton} ${density === 'compact' ? 'active' : ''}`} onClick={() => changeDensity('compact')}> {t('appearance.densityCompact')} </button>
                    <div className={styles.glider} style={densityGlider.gliderStyle} />
                </div>
            </div>

            <hr className={styles.settingsSeparator}/>

            <div className="settings-subsection">
                <div className="settings-subsection-header">
                    <Palette size={20} className={styles.settingsItemIcon}/>
                    <h3 className={styles.settingsItemTitle}>{t('appearance.colorTitle')}</h3>
                </div>
                <p className={styles.settingsItemDescription}>{t('appearance.colorDescription')}</p>
                <div className="theme-editor">
                    <ThemePreview accentColorHex={accentColorHex} />
                    <div className="theme-controls">
                        <div className="color-picker-wrapper">
                            <CustomColorPicker 
                                value={accentColorHex}
                                onChange={changeAccentColor}
                                presets={PRESET_COLORS}
                            />
                            <div style={{flex: 1, minWidth: 0}}></div>
                        </div>
                        <div className="sliders-group">
                          <ColorSlider label={t('appearance.hue')} max={360} value={themeHsl.h} onChange={v => changeHslPart('h', v)} trackStyle={{ '--track-bg': 'linear-gradient(90deg, red, yellow, green, cyan, blue, magenta, red)'}}/>
                          <ColorSlider label={t('appearance.saturation')} max={100} value={themeHsl.s} onChange={v => changeHslPart('s', v)} trackStyle={{ '--track-bg': `linear-gradient(90deg, hsl(${themeHsl.h}, 0%, ${themeHsl.l}%), hsl(${themeHsl.h}, 100%, ${themeHsl.l}%))`}}/>
                          <ColorSlider label={t('appearance.lightness')} max={100} value={themeHsl.l} onChange={v => changeHslPart('l', v)} trackStyle={{ '--track-bg': `linear-gradient(90deg, #000, hsl(${themeHsl.h}, ${themeHsl.s}%, 50%), #fff)`}}/>
                        </div>
                        <button className={`${styles.settingsButton} ${styles.settingsButtonDangerSecondary}`} onClick={resetAccentColor} style={{alignSelf: 'flex-start'}}>{t('appearance.resetColorButton')}</button>
                    </div>
                </div>
            </div>
            
            <hr className={styles.settingsSeparator}/>

            <div className="settings-subsection">
                 <div className="settings-subsection-header">
                    <Image size={20} className={styles.settingsItemIcon}/>
                    <div>
                        <h3 className={styles.settingsItemTitle}>{t('appearance.background')}</h3>
                        <p className={styles.settingsItemDescription} style={{margin: 0}}>{t('appearance.backgroundDescription')}</p>
                    </div>
                </div>
                <div className="appearance-controls">
                    <div className="background-preview" style={{ backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none' }}>
                        {!settings.backgroundImage && <ImageIcon size={32}/>}
                    </div>
                    <div className="background-controls-wrapper">
                        <div className="appearance-buttons">
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/png, image/jpeg, image/webp" onChange={handleFileChange}/>
                            <button 
                                className={`${styles.settingsButton} ${styles.settingsButtonSecondary}`} 
                                onClick={() => fileInputRef.current.click()}
                                disabled={isProcessingImage}
                            >
                                {isProcessingImage ? (
                                    <LoaderCircle size={16} className="animate-spin"/>
                                ) : (
                                    <Upload size={16}/>
                                )}
                                {isProcessingImage ? t('appearance.processingButton', 'Обработка...') : t('appearance.uploadButton')}
                            </button>
                            <button 
                                className={`${styles.settingsButton} ${styles.settingsButtonDangerSecondary}`} 
                                onClick={handleResetBackground} 
                                disabled={!settings.backgroundImage || isProcessingImage}
                            >
                                <Trash2 size={16}/> {t('appearance.resetButton')}
                            </button>
                        </div>
                        <div className={styles.settingsSliderContainer}>
                            <label htmlFor="blur-slider" className="slider-label">{t('appearance.blur')}</label>
                            <input id="blur-slider" type="range" min="0" max="100" step="1" value={settings.backgroundBlur} onChange={handleBlurChange} className={styles.settingsSlider} />
                            <span className={styles.settingsSliderValue}>{settings.backgroundBlur}px</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};