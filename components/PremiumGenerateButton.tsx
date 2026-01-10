import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Zap, Check } from 'lucide-react';
import { LiquidMetal } from '@paper-design/shaders-react';
import { useTheme } from '../context/ThemeContext';
import { useThemeStyles, useNeuButtonProps } from './NeuComponents';

interface PremiumGenerateButtonProps {
    onClick: () => void;
    disabled?: boolean;
    activeCount: number;
    modelTier: 'flash' | 'pro' | 'ultra';
}

// Convert hex to RGB for smooth interpolation
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

// Brand-Aligned Color Logic (v3.6)
const getProgressColor = (p: number, isVictory: boolean = false) => {
    const BRAND_COLOR = '#94ca42';

    if (isVictory) {
        // High-Intensity Success Pulse (Stays on brand green)
        const time = Date.now() / 150;
        const pulse = Math.sin(time) * 20 + 20; // Subtle brightness oscillation
        return `rgb(${148 + pulse}, ${202 + pulse}, ${66 + pulse})`; // Boosted BRAND_COLOR base
    }

    // Steady Brand Green (94ca42) with slight intensity buildup
    const intensity = Math.round(p / 5); // 0 -> 20 additive brightness
    return `rgb(${148 + intensity}, ${202 + intensity}, ${66 + intensity})`;
};

// Lerp helper
const lerp = (current: number, target: number, factor: number) => {
    const diff = target - current;
    return Math.abs(diff) < 0.001 ? target : current + diff * factor;
};

export const PremiumGenerateButton = React.memo<PremiumGenerateButtonProps>(({
    onClick,
    disabled = false,
    activeCount,
    externalProgress = 0,
    modelTier
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Internal state tracking
    const [isHovered, setIsHovered] = useState(false);
    const [localProgress, setLocalProgress] = useState(0);
    const [visualState, setVisualState] = useState<'idle' | 'generating' | 'success'>('idle');

    // Refs for engine access
    const stateRef = useRef(visualState);
    const progressRef = useRef(localProgress);
    const hoverRef = useRef(isHovered);
    const startTimeRef = useRef<number | null>(null);
    const prevActiveCountRef = useRef(activeCount);
    const externalProgressRef = useRef(externalProgress);

    // Shader values for lerping (Stripes preset base)
    const [shader, setShader] = useState({
        scale: 1.2,
        speed: 1,
        dist: 0.4,
        hover: 0,
        rep: 4.7,
        tint: '#94ca42',
        shift: 1, // Chromatic shift IS BACK
        angle: 0,
        glowSpread: 10,
        breathe: 1,
        opacity: 1
    });

    // Mirror state to refs
    useEffect(() => { stateRef.current = visualState; }, [visualState]);
    useEffect(() => { progressRef.current = localProgress; }, [localProgress]);
    useEffect(() => { hoverRef.current = isHovered; }, [isHovered]);
    useEffect(() => { externalProgressRef.current = externalProgress; }, [externalProgress]);

    // === THE CORE ENGINE (60fps Single Loop) ===
    useEffect(() => {
        let rafId: number;
        interface ShaderTarget {
            scale: number;
            speed: number;
            dist: number;
            rep: number;
            shift: number;
            angle: number;
            glowSpread: number;
            breathe: number;
            opacity: number;
        }

        const tick = () => {
            const state = stateRef.current;
            const currentProgress = progressRef.current;
            const isHover = hoverRef.current;
            const startTime = startTimeRef.current;
            const extP = externalProgressRef.current;

            // 1. UPDATING PROGRESS
            if (state === 'generating' && startTime) {
                // Hybrid Progress: Use simulated exponential curve but floor it with real-world data
                // RELAXED CURVE: Constant 16 (was 8) for a more gradual approach to the 92% asymptote
                const elapsed = (Date.now() - startTime) / 1000;
                const simulated = 92 * (1 - Math.exp(-elapsed / 16));

                // MONOTONIC LOCK: Never go backwards
                const newProgress = Math.max(currentProgress, Math.max(simulated, extP));
                if (newProgress !== currentProgress) {
                    setLocalProgress(newProgress);
                }
            }

            // 2. CALCULATING TARGETS
            const intensityBase = currentProgress / 100;
            // Calibrated curves: Exponent 2.5 for general intensity, 3.5 for Zoom buildup
            const intensityGen = Math.pow(intensityBase, 2.5);
            const intensityZoom = Math.pow(intensityBase, 3.5);

            const hovFactor = (isHover && state === 'idle') ? 1 : 0;

            let target: ShaderTarget = {
                scale: 0.9,
                speed: 0.35,
                dist: 0.3,
                rep: 4,
                shift: 0,
                angle: 0,
                glowSpread: 10,
                breathe: 1,
                opacity: 1
            };

            if (state === 'idle') {
                target = {
                    scale: 1.5 + (hovFactor * 0.8), // 1.5 -> 2.3 on hover (FILLS BUTTON at rest)
                    speed: 1 + (hovFactor * 1.0),
                    dist: 0.4 + (hovFactor * 0.3),
                    rep: 4.7 + (hovFactor * 1.5),
                    shift: hovFactor * 0.8, // RESTORED & GATED: Only shifts on hover to avoid blue border at rest
                    angle: hovFactor * 45,
                    glowSpread: 10 + (hovFactor * 10),
                    breathe: 1.0,
                    opacity: 1.0
                };
            } else if (state === 'generating') {
                // PREMIUM SWAY: Add a slow oscillate to simulate 'searching'
                const sway = Math.sin(Date.now() / 2000) * 15;
                target = {
                    scale: 2.0 + (intensityGen * 0.5), // FILLS BUTTON during generation
                    speed: 1 + (intensityGen * 2.0),
                    dist: 0.4 + (intensityGen * 0.6),
                    rep: 4.7 + (intensityZoom * 3),
                    shift: 1 + (intensityZoom * 0.5), // Building chromatic
                    angle: (intensityGen * 90) + sway,
                    glowSpread: 15 + (intensityGen * 15),
                    breathe: 1.0,
                    opacity: 1.0
                };
            } else if (state === 'success') {
                // VICTORY BURST: Chaotic celebration, strong chromatic, high energy
                const fastPulse = Math.sin(Date.now() / 80) * 0.15;  // Faster oscillation
                const slowBreath = Math.sin(Date.now() / 300) * 0.03;
                const chaosAngle = (Date.now() / 10) % 360; // Continuous rotation
                target = {
                    scale: 3.0 + fastPulse,   // BIG expansion with pulse
                    speed: 3.5,               // FAST motion
                    dist: 0.8 + fastPulse,    // High distortion, pulsing
                    rep: 7.0,                 // Dense stripes
                    shift: 1.2,               // STRONG chromatic (rainbow prism)
                    angle: chaosAngle,        // Continuous spinning
                    glowSpread: 40,           // Big glow
                    breathe: 1.05 + slowBreath,
                    opacity: 1.0
                };
            }

            // 3. LERPING VALUES
            setShader(prev => ({
                scale: lerp(prev.scale, target.scale, 0.1),
                speed: lerp(prev.speed, target.speed, 0.1),
                dist: lerp(prev.dist, target.dist, 0.1),
                rep: lerp(prev.rep, target.rep, 0.06), // Precise zoom lerp
                shift: lerp(prev.shift, target.shift, 0.1),
                angle: lerp(prev.angle, target.angle, 0.05),
                hover: lerp(prev.hover, hovFactor, 0.1),
                glowSpread: lerp(prev.glowSpread, target.glowSpread, 0.1),
                breathe: lerp(prev.breathe, target.breathe, 0.1),
                opacity: lerp(prev.opacity, target.opacity, 0.1),
                tint: state === 'success' ? '#a4da52' : (state === 'idle' ? '#94ca42' : getProgressColor(currentProgress, false))
            }));

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, []);

    // === JOB DETECTION & VICTORY TRIGGER ===
    useEffect(() => {
        const prevCount = prevActiveCountRef.current;

        // Job Started: JAM REFS IMMEDIATELY to prevent 100% flash
        if (prevCount === 0 && activeCount > 0) {
            stateRef.current = 'generating';
            progressRef.current = 0;
            setVisualState('generating');
            setLocalProgress(0);
            startTimeRef.current = Date.now();
        }

        // Victory Logic: Triggered by real-world progress hitting 100
        // (Which our GeneratorCard only reports once the image is fully loaded)
        if (stateRef.current === 'generating' && externalProgress >= 100) {
            finishGeneration();
        }

        // Fallback: If count drops to 0 but we didn't hit 100 (e.g. error or skip)
        if (prevCount > 0 && activeCount === 0 && stateRef.current === 'generating') {
            finishGeneration();
        }

        prevActiveCountRef.current = activeCount;
    }, [activeCount, externalProgress]);

    const finishGeneration = () => {
        if (stateRef.current === 'idle') return;

        startTimeRef.current = null;

        // Snap to 100% then immediately go to idle
        animate(progressRef.current, 100, {
            duration: 0.2,
            ease: "easeOut",
            onUpdate: (v) => {
                progressRef.current = v;
                setLocalProgress(v);
            },
            onComplete: () => {
                // Enter SUCCESS state (shows checkmark, shader stays active)
                stateRef.current = 'success';
                setVisualState('success');

                // Hold success for 2s then fade to idle
                setTimeout(() => {
                    stateRef.current = 'idle';
                    progressRef.current = 0;
                    setVisualState('idle');
                    setLocalProgress(0);
                }, 2000);
            }
        });
    };

    const isIdle = visualState === 'idle' && activeCount === 0;
    const isGenerating = visualState === 'generating';
    const isSuccess = visualState === 'success';
    const isMultiJob = activeCount >= 2;

    const generateMotion = useNeuButtonProps(isGenerating || isSuccess);

    const outerShadow = isDark ? 'shadow-neu-out-dark' : 'shadow-neu-out-light';
    const innerShadow = isDark ? 'shadow-neu-in-dark' : 'shadow-neu-in-light';
    const bgColor = isDark ? 'bg-neu-dark' : 'bg-neu-light';

    const glowStyle = (!isIdle || isSuccess) ? {
        boxShadow: `0 0 ${shader.glowSpread}px ${shader.tint}66, 0 0 ${shader.glowSpread / 3}px ${shader.tint}33`,
        transform: `scale(${shader.breathe})`
    } : undefined;

    return (
        <div
            className={`relative w-14 h-14 rounded-2xl ${outerShadow} p-1 ${bgColor} flex items-center justify-center transition-all duration-300`}
            style={glowStyle}
        >
            <motion.button
                onClick={onClick}
                disabled={disabled}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                {...generateMotion}
                className={`w-full h-full rounded-xl ${innerShadow} overflow-hidden relative ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
                <LiquidMetal
                    // STATIC colorBack - NEVER change dynamically!
                    // Changing colorBack at runtime causes the shader to flash black.
                    // The green success effect comes from colorTint + high scale/repetition.
                    colorBack={isDark ? '#0F1115' : '#F9FAFB'}
                    colorTint={shader.tint}
                    shape="circle"
                    repetition={shader.rep}
                    softness={0.8}
                    distortion={shader.dist}
                    speed={shader.speed}
                    scale={shader.scale}
                    contour={0.4}
                    // @ts-ignore - Chromatic dispersion
                    shiftRed={shader.shift}
                    // @ts-ignore
                    shiftBlue={-shader.shift}
                    // @ts-ignore
                    angle={shader.angle}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: shader.opacity
                    }}
                />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <AnimatePresence mode="wait">
                        {isIdle && (
                            <motion.div
                                key="idle"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Zap size={22} fill="white" className="text-white drop-shadow-md" />
                            </motion.div>
                        )}

                        {isGenerating && !isMultiJob && localProgress > 0 && (
                            <motion.div
                                key="progress"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <span className="font-mono text-xs font-black text-white drop-shadow-md">
                                    {Math.floor(localProgress)}%
                                </span>
                            </motion.div>
                        )}

                        {isSuccess && (
                            <motion.div
                                key="success"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <Check size={24} className="text-white" strokeWidth={3} />
                            </motion.div>
                        )}

                        {isMultiJob && (
                            <motion.div
                                key="queue"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col items-center justify-center"
                            >
                                <span className="text-[8px] font-bold leading-none text-white/80">GEN</span>
                                <span className="text-sm font-black leading-none text-white">{activeCount}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>
        </div>
    );
});
