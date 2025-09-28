import React, { createContext, useState, useCallback, useMemo, useEffect, useContext } from 'react';
import { equalizerBands, equalizerPresets as builtInPresets } from '../utils/equalizerPresets';

const EqualizerContext = createContext(null);

export const useEqualizer = () => {
    const context = useContext(EqualizerContext);
    if (!context) throw new Error('useEqualizer must be used within an EqualizerProvider');
    return context;
};

const getInitialState = () => {
    try {
        const saved = localStorage.getItem('unisound_eq_state_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.gains && parsed.gains.length === equalizerBands.length) {
                return {
                    gains: parsed.gains,
                    activePreset: parsed.activePreset || 'custom',
                    customPresets: parsed.customPresets || {}
                };
            }
        }
    } catch (error) {
        console.warn("Failed to parse EQ state from localStorage", error);
    }
    return { gains: equalizerBands.map(() => 0), activePreset: 'flat', customPresets: {} };
};

export const EqualizerProvider = ({ children }) => {
    const [state, setState] = useState(getInitialState);

    useEffect(() => {
        try {
            localStorage.setItem('unisound_eq_state_v2', JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save EQ state to localStorage", error);
        }
    }, [state]);

    const updateGain = useCallback((bandIndex, value) => {
        setState(prevState => {
            const newGains = [...prevState.gains];
            newGains[bandIndex] = parseFloat(value);
            return { ...prevState, gains: newGains, activePreset: 'custom' };
        });
    }, []);

    const applyPreset = useCallback((presetName) => {
        const presetGains = builtInPresets[presetName] || state.customPresets[presetName];
        if (presetGains) {
            setState(prevState => ({ ...prevState, gains: presetGains, activePreset: presetName }));
        }
    }, [state.customPresets]);

    const resetGains = useCallback(() => {
        setState(prevState => ({ ...prevState, gains: equalizerBands.map(() => 0), activePreset: 'flat' }));
    }, []);

    const saveCustomPreset = useCallback((name) => {
        if (!name || builtInPresets[name]) {
            console.error("Invalid or reserved preset name");
            return false;
        }
        setState(prevState => ({
            ...prevState,
            activePreset: name,
            customPresets: { ...prevState.customPresets, [name]: prevState.gains }
        }));
        return true;
    }, []);

    const deleteCustomPreset = useCallback((name) => {
        setState(prevState => {
            const newCustomPresets = { ...prevState.customPresets };
            delete newCustomPresets[name];
            return {
                ...prevState,
                customPresets: newCustomPresets,
                
                activePreset: prevState.activePreset === name ? 'flat' : prevState.activePreset,
                gains: prevState.activePreset === name ? equalizerBands.map(() => 0) : prevState.gains,
            };
        });
    }, []);

    const value = useMemo(() => ({
        bands: equalizerBands,
        presets: builtInPresets,
        customPresets: state.customPresets,
        gains: state.gains,
        activePreset: state.activePreset,
        updateGain,
        applyPreset,
        resetGains,
        saveCustomPreset,
        deleteCustomPreset,
    }), [state, updateGain, applyPreset, resetGains, saveCustomPreset, deleteCustomPreset]);

    return (
        <EqualizerContext.Provider value={value}>
            {children}
        </EqualizerContext.Provider>
    );
};