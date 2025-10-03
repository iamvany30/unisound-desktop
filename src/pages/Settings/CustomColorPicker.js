import React, { useState, useEffect, useRef, useCallback } from 'react';
import { hslToHex, hexToHsl as utilHexToHsl } from '../../utils/colorUtils';
import './CustomColorPicker.css';
const HEX_REGEX = /^#([0-9A-F]{3}){1,2}$/i;
const CustomColorPicker = ({ value, onChange, presets = [] }) => {
const [isOpen, setIsOpen] = useState(false);
const pickerRef = useRef(null);
const saturationPanelRef = useRef(null);
const debounceTimeout = useRef(null);

const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });
const [hexInput, setHexInput] = useState(value.replace('#', ''));

useEffect(() => {
    const currentHex = hslToHex(hsl.h, hsl.s, hsl.l);
    if (currentHex.toLowerCase() !== value.toLowerCase()) {
        const newHsl = utilHexToHsl(value);
        if(newHsl) setHsl(newHsl);
    }
    if (value.replace('#', '').toLowerCase() !== hexInput.toLowerCase()) {
        setHexInput(value.replace('#', ''));
    }
}, [value]);

const handleHslChange = useCallback((newHsl, debounce = false) => {
    setHsl(newHsl);
    const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    setHexInput(newHex.replace('#', ''));

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    
    const update = () => onChange(newHex);

    if (debounce) {
        debounceTimeout.current = setTimeout(update, 100);
    } else {
        update();
    }
}, [onChange]);

const handleHexInputChange = useCallback((e) => {
    const rawInput = e.target.value.toUpperCase();
    setHexInput(rawInput);

    const fullHex = '#' + rawInput;
    if (HEX_REGEX.test(fullHex)) {
        const newHsl = utilHexToHsl(fullHex);
        if (newHsl) {
            setHsl(newHsl);
            onChange(fullHex);
        }
    }
}, [onChange]);

const handleSaturationChange = useCallback((e) => {
    if (!saturationPanelRef.current) return;
    const { width, height, left, top } = saturationPanelRef.current.getBoundingClientRect();
    
    let x = e.clientX - left;
    let y = e.clientY - top;
    x = Math.max(0, Math.min(x, width));
    y = Math.max(0, Math.min(y, height));

    const s = (x / width) * 100;
    const l = 100 - (y / height) * 100;
    
    handleHslChange({ ...hsl, s: Math.round(s), l: Math.round(l) }, true);
}, [hsl, handleHslChange]);

const stopMouseEvents = useCallback(() => {
    window.removeEventListener('mousemove', handleSaturationChange);
    window.removeEventListener('mouseup', stopMouseEvents);
}, [handleSaturationChange]);

const startSaturationChange = useCallback((e) => {
    handleSaturationChange(e);
    window.addEventListener('mousemove', handleSaturationChange);
    window.addEventListener('mouseup', stopMouseEvents);
}, [handleSaturationChange, stopMouseEvents]);

useEffect(() => {
    const handleClickOutside = (event) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

const saturationStyle = {
    backgroundColor: `hsl(${hsl.h}, 100%, 50%)`,
};
const handleStyle = {
    left: `${hsl.s}%`,
    top: `${100 - hsl.l}%`,
    backgroundColor: hslToHex(hsl.h, hsl.s, hsl.l),
};

return (
    <div className="color-picker-container" ref={pickerRef}>
        <button className="color-picker-trigger" onClick={() => setIsOpen(!isOpen)}>
            <div className="color-picker-trigger__swatch" style={{ backgroundColor: value }} />
        </button>

        {isOpen && (
            <div className="color-picker-popover">
                <div
                    ref={saturationPanelRef}
                    className="saturation-panel"
                    style={saturationStyle}
                    onMouseDown={startSaturationChange}
                >
                    <div className="saturation-handle" style={handleStyle} />
                </div>

                <div className="color-slider-wrapper">
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={hsl.h}
                        onChange={(e) => handleHslChange({ ...hsl, h: parseInt(e.target.value) }, true)}
                        className="hue-slider"
                    />
                </div>
                
                <div className="hex-input-wrapper">
                    <span className="hex-input-prefix">#</span>
                    <input
                        type="text"
                        className="hex-input"
                        value={hexInput}
                        onChange={handleHexInputChange}
                        maxLength="6"
                        onBlur={() => setHexInput(value.replace('#', ''))}
                    />
                </div>
                
                <div className="color-presets" style={{ marginTop: '0' }}>
                    {presets.map(preset => (
                        <button 
                            key={preset.value} 
                            className={`color-swatch ${value === preset.value ? 'active' : ''}`} 
                            title={preset.name} 
                            style={{ backgroundColor: preset.value, width: 28, height: 28, minWidth: 28 }} 
                            onClick={() => onChange(preset.value)}
                        />
                    ))}
                </div>
            </div>
        )}
    </div>
);
};
export default CustomColorPicker;