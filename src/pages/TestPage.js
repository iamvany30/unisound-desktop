import React, { useState, useContext, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';

const CrossfadeSettings = ({ isOpen, onClose }) => {
    const { 
        crossfadeDuration, 
        crossfadeCurve, 
        setCrossfadeDuration, 
        setCrossfadeCurve,
        availableCrossfadeCurves,
        testCrossfadeSettings,
        isCrossfading,
        currentTrack
    } = useContext(PlayerContext);
    
    const [tempDuration, setTempDuration] = useState(crossfadeDuration);
    const [tempCurve, setTempCurve] = useState(crossfadeCurve);
    const [isTestingCrossfade, setIsTestingCrossfade] = useState(false);
    
    useEffect(() => {
        setTempDuration(crossfadeDuration);
    }, [crossfadeDuration]);
    
    useEffect(() => {
        setTempCurve(crossfadeCurve);
    }, [crossfadeCurve]);
    
    const handleDurationChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setTempDuration(value);
        setCrossfadeDuration(value);
    };
    
    const handleCurveChange = (e) => {
        const value = e.target.value;
        setTempCurve(value);
        setCrossfadeCurve(value);
    };
    
    const handleTestCrossfade = async () => {
        if (!currentTrack || isTestingCrossfade || isCrossfading) return;
        
        setIsTestingCrossfade(true);
        const success = testCrossfadeSettings();
        
        if (success) {
            setTimeout(() => {
                setIsTestingCrossfade(false);
            }, Math.min(3000, crossfadeDuration * 1000));
        } else {
            setIsTestingCrossfade(false);
        }
    };
    
    const getCurveDescription = (curveType) => {
        switch (curveType) {
            case 'equalPower':
                return 'Natural sounding crossfade with consistent perceived volume. Best for most music.';
            case 'linear':
                return 'Simple linear fade. May have slight volume dip in the middle.';
            case 'constantPower':
                return 'Maintains constant power using square root curves. Good for speech.';
            case 'exponential':
                return 'More dramatic fade with exponential curves. Creates distinct transitions.';
            case 'sCurve':
                return 'Smooth start and end with S-shaped curve. Very gentle transitions.';
            default:
                return '';
        }
    };
    
    const CrossfadeCurveVisualizer = ({ curve, progress = 0.5 }) => {
        const calculateGains = (progress, curve) => {
            const x = Math.max(0, Math.min(1, progress));
            
            switch (curve) {
                case 'equalPower':
                    return {
                        outGain: Math.cos(x * 0.5 * Math.PI),
                        inGain: Math.cos((1.0 - x) * 0.5 * Math.PI)
                    };
                case 'linear':
                    return { outGain: 1 - x, inGain: x };
                case 'constantPower':
                    return { outGain: Math.sqrt(1 - x), inGain: Math.sqrt(x) };
                case 'exponential':
                    return { outGain: Math.pow(1 - x, 2), inGain: Math.pow(x, 2) };
                case 'sCurve':
                    const smoothX = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
                    return { outGain: 1 - smoothX, inGain: smoothX };
                default:
                    return { outGain: 1 - x, inGain: x };
            }
        };
        
        const points = [];
        const inPoints = [];
        
        for (let i = 0; i <= 100; i++) {
            const x = i / 100;
            const { outGain, inGain } = calculateGains(x, curve);
            points.push(`${i * 2},${100 - (outGain * 80)}`);
            inPoints.push(`${i * 2},${100 - (inGain * 80)}`);
        }
        
        const currentGains = calculateGains(progress, curve);
        const currentX = progress * 200;
        
        return (
            <div className="mt-4 mb-4">
                <div className="text-sm text-gray-600 mb-2">Crossfade Curve Preview</div>
                <svg width="240" height="120" className="border border-gray-200 rounded bg-white">
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    <line x1="20" y1="100" x2="220" y2="100" stroke="#ccc" strokeWidth="1" />
                    <line x1="20" y1="20" x2="20" y2="100" stroke="#ccc" strokeWidth="1" />
                    
                    <polyline 
                        points={points.map(p => {
                            const [x, y] = p.split(',').map(Number);
                            return `${x + 20},${y + 20}`;
                        }).join(' ')}
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="2"
                    />
                    <polyline 
                        points={inPoints.map(p => {
                            const [x, y] = p.split(',').map(Number);
                            return `${x + 20},${y + 20}`;
                        }).join(' ')}
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="2"
                    />
                    
                    <line 
                        x1={currentX + 20} 
                        y1="20" 
                        x2={currentX + 20} 
                        y2="100" 
                        stroke="#6b7280" 
                        strokeWidth="1" 
                        strokeDasharray="2,2"
                    />
                    
                    <text x="10" y="25" fontSize="10" fill="#6b7280">1.0</text>
                    <text x="10" y="55" fontSize="10" fill="#6b7280">0.5</text>
                    <text x="10" y="105" fontSize="10" fill="#6b7280">0.0</text>
                    <text x="20" y="115" fontSize="10" fill="#6b7280">0%</text>
                    <text x="115" y="115" fontSize="10" fill="#6b7280">50%</text>
                    <text x="210" y="115" fontSize="10" fill="#6b7280">100%</text>
                    
                    <rect x="140" y="25" width="95" height="45" fill="white" stroke="#e5e7eb" strokeWidth="1" rx="2"/>
                    <line x1="145" y1="35" x2="160" y2="35" stroke="#ef4444" strokeWidth="2"/>
                    <text x="165" y="38" fontSize="9" fill="#374151">Track Out</text>
                    <line x1="145" y1="50" x2="160" y2="50" stroke="#3b82f6" strokeWidth="2"/>
                    <text x="165" y="53" fontSize="9" fill="#374151">Track In</text>
                    
                    <text x="145" y="68" fontSize="8" fill="#6b7280">
                        Out: {currentGains.outGain.toFixed(2)} | In: {currentGains.inGain.toFixed(2)}
                    </text>
                </svg>
            </div>
        );
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Crossfade Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Crossfade Duration
                        </label>
                        <div className="flex items-center space-x-4">
                            <input
                                type="range"
                                min="0"
                                max="15"
                                step="1"
                                value={tempDuration}
                                onChange={handleDurationChange}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="w-20 text-center">
                                <span className="text-sm font-medium text-gray-900">
                                    {tempDuration === 0 ? 'Off' : `${tempDuration}s`}
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {tempDuration === 0 
                                ? 'Crossfading is disabled. Tracks will switch instantly.'
                                : `Tracks will start fading ${tempDuration} seconds before the current track ends.`
                            }
                        </p>
                    </div>
                    
                    {tempDuration > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Crossfade Curve
                            </label>
                            <select
                                value={tempCurve}
                                onChange={handleCurveChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                {availableCrossfadeCurves.map(curve => (
                                    <option key={curve.value} value={curve.value}>
                                        {curve.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {getCurveDescription(tempCurve)}
                            </p>
                            
                            <CrossfadeCurveVisualizer curve={tempCurve} />
                        </div>
                    )}
                    
                    {tempDuration > 0 && currentTrack && (
                        <div>
                            <button
                                onClick={handleTestCrossfade}
                                disabled={isTestingCrossfade || isCrossfading}
                                className={`w-full py-2 px-4 rounded-md font-medium ${
                                    isTestingCrossfade || isCrossfading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                {isTestingCrossfade ? 'Testing Crossfade...' : 
                                 isCrossfading ? 'Crossfade Active' : 
                                 'Test Crossfade'}
                            </button>
                            <p className="text-xs text-gray-500 mt-1 text-center">
                                {isTestingCrossfade 
                                    ? 'Playing short crossfade preview with current settings'
                                    : 'Preview how the crossfade will sound with current settings'
                                }
                            </p>
                        </div>
                    )}
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">About Crossfading</h3>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Crossfading creates smooth transitions between tracks</li>
                            <li>• The next track starts playing while the current track fades out</li>
                            <li>• Works best with tracks that have similar tempo and key</li>
                            <li>• Adaptive mode automatically adjusts duration for short tracks</li>
                            <li>• Equal power curve is recommended for most music</li>
                        </ul>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrossfadeSettings;