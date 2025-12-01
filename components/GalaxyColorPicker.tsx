import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles } from './NeuComponents';
import { Check, X, Hash, ChevronDown } from 'lucide-react';

interface GalaxyColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
    onClear?: () => void;
}

const PRESETS = [
    '#000000', '#FFFFFF', '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#9E9E9E', '#607D8B'
];

// --- Color Helpers ---
const hexToHsv = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt('0x' + hex[1] + hex[1]);
        g = parseInt('0x' + hex[2] + hex[2]);
        b = parseInt('0x' + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt('0x' + hex[1] + hex[2]);
        g = parseInt('0x' + hex[3] + hex[4]);
        b = parseInt('0x' + hex[5] + hex[6]);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = (h: number, s: number, v: number) => {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s / 100);
    const q = v * (1 - f * s / 100);
    const t = v * (1 - (1 - f) * s / 100);
    v = v / 100; // Normalize v back for calculation if needed, but here v is 0-100 passed in. Wait, standard algo uses 0-1.
    // Let's adjust: s and v are 0-100.
    const s1 = s / 100;
    const v1 = v / 100;

    const i2 = Math.floor(h / 60);
    const f2 = h / 60 - i2;
    const p2 = v1 * (1 - s1);
    const q2 = v1 * (1 - f2 * s1);
    const t2 = v1 * (1 - (1 - f2) * s1);

    switch (i2 % 6) {
        case 0: r = v1; g = t2; b = p2; break;
        case 1: r = q2; g = v1; b = p2; break;
        case 2: r = p2; g = v1; b = t2; break;
        case 3: r = p2; g = q2; b = v1; break;
        case 4: r = t2; g = p2; b = v1; break;
        case 5: r = v1; g = p2; b = q2; break;
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

// --- Standalone Panel Component ---
export const GalaxyColorPanel: React.FC<{
    color: string;
    onChange: (color: string) => void;
    onClear?: () => void;
    className?: string;
}> = ({ color, onChange, onClear, className }) => {
    const { styles } = useThemeStyles();
    const [hsv, setHsv] = useState({ h: 0, s: 0, v: 0 });
    const satRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const [isDraggingSat, setIsDraggingSat] = useState(false);
    const [isDraggingHue, setIsDraggingHue] = useState(false);

    // Sync internal HSV when external color changes
    useEffect(() => {
        if (color && /^#[0-9A-F]{6}$/i.test(color)) {
            setHsv(hexToHsv(color));
        }
    }, [color]);

    // --- Interaction Handlers ---
    const handleSatChange = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!satRef.current) return;
        const rect = satRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

        const newS = x * 100;
        const newV = (1 - y) * 100;

        setHsv(prev => {
            const next = { ...prev, s: newS, v: newV };
            onChange(hsvToHex(next.h, next.s, next.v));
            return next;
        });
    }, [onChange]);

    const handleHueChange = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!hueRef.current) return;
        const rect = hueRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        const newH = x * 360;

        setHsv(prev => {
            const next = { ...prev, h: newH };
            onChange(hsvToHex(next.h, next.s, next.v));
            return next;
        });
    }, [onChange]);

    // Global mouseup/move for dragging
    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (isDraggingSat) handleSatChange(e);
            if (isDraggingHue) handleHueChange(e);
        };
        const handleUp = () => {
            setIsDraggingSat(false);
            setIsDraggingHue(false);
        };

        if (isDraggingSat || isDraggingHue) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isDraggingSat, isDraggingHue, handleSatChange, handleHueChange]);

    return (
        <div className={`w-full p-4 rounded-2xl ${styles.bgAccent} border ${styles.border} ${className}`}>
            {/* Saturation/Brightness Area */}
            <div
                ref={satRef}
                onMouseDown={(e) => { setIsDraggingSat(true); handleSatChange(e); }}
                className="w-full h-40 rounded-xl mb-4 relative cursor-crosshair overflow-hidden shadow-inner"
                style={{
                    backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                    backgroundImage: `
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #fff, transparent)
          `
                }}
            >
                <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: color }}
                />
            </div>

            {/* Hue Slider */}
            <div
                ref={hueRef}
                onMouseDown={(e) => { setIsDraggingHue(true); handleHueChange(e); }}
                className="w-full h-4 rounded-full mb-4 relative cursor-pointer shadow-inner"
                style={{
                    background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
                }}
            >
                <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none bg-white"
                    style={{ left: `${(hsv.h / 360) * 100}%` }}
                />
            </div>

            {/* Hex Input & Clear */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                    <Hash size={14} className="text-gray-400" />
                    <input
                        type="text"
                        value={color}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-F]*$/i.test(val)) onChange(val);
                        }}
                        className={`bg-transparent outline-none w-full font-mono text-sm ${styles.textMain}`}
                        placeholder="#000000"
                        maxLength={7}
                    />
                </div>
                {onClear && (
                    <button
                        onClick={() => onClear()}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        title="Clear Color"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Presets */}
            <div className="grid grid-cols-7 gap-2">
                {PRESETS.map((c) => (
                    <button
                        key={c}
                        onClick={() => { onChange(c); setHsv(hexToHsv(c)); }}
                        className="w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform relative"
                        style={{ backgroundColor: c }}
                    >
                        {color.toUpperCase() === c && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Check size={10} className="text-white drop-shadow-md" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const GalaxyColorPicker: React.FC<GalaxyColorPickerProps> = ({ color, onChange, label, onClear }) => {
    const { styles } = useThemeStyles();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className={`text-xs font-bold ${styles.textSub} uppercase tracking-wider mb-2 block`}>{label}</label>}

            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all duration-300 group
          ${isOpen ? 'border-brand bg-brand/5' : `${styles.border} ${styles.bgAccent} hover:border-brand/50`}
        `}
            >
                <div
                    className="w-10 h-10 rounded-lg shadow-inner border border-white/10 relative overflow-hidden"
                    style={{ backgroundColor: color || 'transparent' }}
                >
                    {!color && <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">?</div>}
                </div>
                <div className="flex-1 text-left">
                    <div className={`font-mono text-sm font-bold ${styles.textMain}`}>{color || 'No Color'}</div>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} opacity-50`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute top-full left-0 mt-2 w-72 z-50`}
                    >
                        <GalaxyColorPanel
                            color={color}
                            onChange={onChange}
                            onClear={() => { onClear?.(); setIsOpen(false); }}
                            className={`shadow-2xl ${styles.bg}`}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
