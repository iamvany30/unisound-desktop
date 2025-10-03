import React from 'react';
import { useEqualizer } from '../../context/EqualizerContext';
import { Save, Trash2, RotateCcw } from 'lucide-react';
import styles from './SettingsSections.module.css';
import './SoundSettings.css'; 
import { CustomSelect } from '../../components/Common/CustomSelect';

export const SoundSettings = ({ handleSavePreset, handleDeletePreset, isCustomPresetActive, t }) => {
    const { bands, presets, customPresets, gains, activePreset, updateGain, applyPreset, resetGains } = useEqualizer();

    const getGainPercent = (gain) => `${((gain + 12) / 24) * 100}%`;

    const selectOptions = [
        { options: [
            { value: 'flat', label: t('sound.default') },
        ]},
        { label: t('sound.builtIn'), options: Object.keys(presets).map(name => ({ value: name, label: name })) }
    ];
    if (Object.keys(customPresets).length > 0) {
        selectOptions.push({
            label: t('sound.myPresets'),
            options: Object.keys(customPresets).map(name => ({ value: name, label: name }))
        });
    }
    
    const handleSelectChange = (selectedValue) => {
        if (!selectedValue || selectedValue === 'flat') {
            resetGains();
        } else {
            applyPreset(selectedValue);
        }
    };

    return (
        <div className={styles.settingsGroup}>
            <h2 className={styles.settingsGroupTitle}>{t('sound.title')}</h2>
            <p className={styles.settingsGroupDescription}>{t('sound.description')}</p>

            <div className="presetControls">
                <CustomSelect
                    options={selectOptions}
                    value={activePreset}
                    onChange={handleSelectChange}
                    placeholder={t('sound.selectPreset', 'Выберите пресет...')}
                    isSearchable={true}
                    isClearable={false}
                    noOptionsMessage={() => t('sound.noResults', 'Совпадений не найдено')}
                />
                
                <div className="presetActionsGroup">
                    <button className={`${styles.settingsButton} ${styles.settingsButtonSecondary}`} onClick={handleSavePreset}>
                        <Save size={16}/> {t('save', { ns: 'common' })}
                    </button>
                    {isCustomPresetActive && (
                        <button className={`${styles.settingsButton} ${styles.settingsButtonDangerSecondary}`} onClick={handleDeletePreset}>
                            <Trash2 size={16}/> {t('delete', { ns: 'common' })}
                        </button>
                    )}
                </div>
            </div>

            <div className="equalizerBandsWrapper">
                {bands.map((band, index) => (
                    <div key={band.freq} className="eqBand">
                        <div className="eqSliderWrapper">
                            <input
                                type="range"
                                min="-12" max="12" step="0.1"
                                value={gains[index]}
                                onChange={(e) => updateGain(index, parseFloat(e.target.value))}
                                className="eqSlider"
                                aria-label={`Frequency ${band.label}`}
                                style={{ '--gain-percent': getGainPercent(gains[index]) }}
                            />
                        </div>
                        <span className="eqLabel">{band.label}</span>
                    </div>
                ))}
                <div className="eqBand">
                     <button className="resetButton" onClick={resetGains} title={t('reset', { ns: 'common' })}>
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};