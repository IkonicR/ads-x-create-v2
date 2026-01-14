import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { GalaxyHeading } from '../../components/GalaxyHeading';
import { useTheme } from '../../context/ThemeContext';
import {
    NeuCard,
    NeuButton,
    NeuInput,
    NeuTextArea,
    NeuBadge,
    NeuListBuilder,
    NeuDropdown,
    BRAND_COLOR,
    useThemeStyles,
    useNeuAnimations
} from '../../components/NeuComponents';
import { Zap, Check, X, RefreshCw } from 'lucide-react';
import { Dithering, LiquidMetal } from '@paper-design/shaders-react';
import { GalaxyCanvas } from '../../components/GalaxyCanvas';
import { LiquidMetalHeading } from '../../components/LiquidMetalHeading';

// --- LAZY LOADING INFRASTRUCTURE ---
// Only mount shaders when they scroll into view to avoid WebGL context overload
const useInView = (options: IntersectionObserverInit = {}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.disconnect(); // Once visible, stay mounted
            }
        }, { threshold: 0.1, rootMargin: '100px', ...options });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return { ref, isInView };
};

// Wrapper for shader sections - shows placeholder until in view
const LazyShader: React.FC<{ children: React.ReactNode; height?: string }> = ({ children, height = 'h-40' }) => {
    const { ref, isInView } = useInView();
    return (
        <div ref={ref}>
            {isInView ? children : (
                <div className={`${height} animate-pulse bg-gradient-to-br from-gray-800/20 to-gray-900/30 rounded-2xl flex items-center justify-center`}>
                    <span className="text-xs opacity-30 font-mono">Loading shader...</span>
                </div>
            )}
        </div>
    );
};

const ColorSwatch = ({ color, name, hex }: { color: string, name: string, hex?: string }) => (
    <div className="flex flex-col gap-2">
        <div className={`w-full h-24 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 ${color}`}></div>
        <div className="flex flex-col">
            <span className="font-bold text-sm">{name}</span>
            {hex && <span className="text-xs opacity-50 font-mono">{hex}</span>}
        </div>
    </div>
);

// Google Sans Flex Variable Font Showcase
const GoogleSansFlexShowcase: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const [weight, setWeight] = useState(400);
    const [width, setWidth] = useState(100);
    const [slant, setSlant] = useState(0);

    const fontStyle = {
        fontFamily: "'Google Sans Flex', sans-serif",
        fontWeight: weight,
        fontStretch: `${width}%`,
        fontStyle: slant !== 0 ? 'oblique' : 'normal',
        fontVariationSettings: `'wght' ${weight}, 'wdth' ${width}, 'slnt' ${slant}`
    };

    return (
        <section className="space-y-8">
            <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">
                07. Google Sans Flex (Variable Font)
            </h2>
            <p className="opacity-70">
                A flexible variable font from Google with multiple axes. Perfect for dynamic, expressive typography.
            </p>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-mono opacity-50">Weight: {weight}</label>
                    <input
                        type="range"
                        min="100"
                        max="900"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full accent-brand"
                    />
                    <div className="flex justify-between text-xs opacity-40 font-mono">
                        <span>Thin (100)</span>
                        <span>Black (900)</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-mono opacity-50">Width: {width}%</label>
                    <input
                        type="range"
                        min="75"
                        max="125"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-full accent-brand"
                    />
                    <div className="flex justify-between text-xs opacity-40 font-mono">
                        <span>Condensed (75)</span>
                        <span>Extended (125)</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-mono opacity-50">Slant: {slant}°</label>
                    <input
                        type="range"
                        min="-12"
                        max="0"
                        value={slant}
                        onChange={(e) => setSlant(Number(e.target.value))}
                        className="w-full accent-brand"
                    />
                    <div className="flex justify-between text-xs opacity-40 font-mono">
                        <span>Italic (-12)</span>
                        <span>Upright (0)</span>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className={`p-8 rounded-3xl ${isDark ? 'bg-neu-dark shadow-neu-in-dark' : 'bg-neu-light shadow-neu-in-light'}`}>
                <div className="space-y-6">
                    <h1 style={{ ...fontStyle, fontSize: '3rem' }} className="tracking-tight">
                        The Quick Brown Fox
                    </h1>
                    <h2 style={{ ...fontStyle, fontSize: '2rem' }}>
                        Jumps Over The Lazy Dog
                    </h2>
                    <p style={{ ...fontStyle, fontSize: '1.25rem' }} className="leading-relaxed max-w-2xl">
                        Google Sans Flex is a variable font with support for weight, width, and slant axes.
                        It's designed for flexible, modern interfaces that need typographic expression.
                    </p>
                    <p style={{ ...fontStyle, fontSize: '1rem' }} className="opacity-70">
                        ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
                    </p>
                </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Headlines', weight: 700, width: 100, slant: 0 },
                    { label: 'Body Text', weight: 400, width: 100, slant: 0 },
                    { label: 'Captions', weight: 300, width: 90, slant: 0 },
                    { label: 'Emphasis', weight: 600, width: 105, slant: -8 },
                ].map((preset) => (
                    <button
                        key={preset.label}
                        onClick={() => { setWeight(preset.weight); setWidth(preset.width); setSlant(preset.slant); }}
                        className={`p-4 rounded-xl text-left transition-all hover:scale-[0.98] ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                            }`}
                    >
                        <span
                            style={{
                                fontFamily: "'Google Sans Flex', sans-serif",
                                fontWeight: preset.weight,
                                fontStretch: `${preset.width}%`,
                                fontVariationSettings: `'wght' ${preset.weight}, 'wdth' ${preset.width}, 'slnt' ${preset.slant}`
                            }}
                            className="text-lg"
                        >
                            {preset.label}
                        </span>
                        <div className="text-xs opacity-40 font-mono mt-1">
                            wght:{preset.weight} wdth:{preset.width}
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
};

interface DesignLabTabProps {
    styles: ReturnType<typeof useThemeStyles>['styles'];
}

// --- ISOLATED BUTTON COMPONENTS (Performance Optimization) ---
const MoltenCoreButton = React.memo(() => {
    const [state, setState] = React.useState<'idle' | 'generating' | 'complete' | 'deflating'>('idle');
    const [progress, setProgress] = React.useState(0);
    const [isHovered, setIsHovered] = React.useState(false);
    const [hoverFactor, setHoverFactor] = React.useState(0);

    // Physics-based lerp for buttery smooth hover
    React.useEffect(() => {
        let raf: number;
        const update = () => {
            setHoverFactor(prev => {
                const target = isHovered && state === 'idle' ? 1 : 0;
                const diff = target - prev;
                if (Math.abs(diff) < 0.001) return target;
                return prev + (diff * 0.1); // Smooth ease
            });
            raf = requestAnimationFrame(update);
        };
        raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    }, [isHovered, state]);

    const getProgressColor = (p: number) => {
        if (p < 25) return '#94ca42';
        if (p < 50) return '#fbbf24';
        if (p < 75) return '#f97316';
        return '#ff6b35';
    };

    const handleClick = () => {
        if (state !== 'idle') return;
        setState('generating');

        // Phase 1: Animate UP (0 → 100)
        animate(0, 100, {
            duration: 3.5,
            ease: "easeInOut",
            onUpdate: (latest) => setProgress(latest),
            onComplete: () => {
                setState('complete');
                // Brief pause at peak, then deflate
                setTimeout(() => {
                    setState('deflating');
                    // Phase 2: Animate DOWN (100 → 0)
                    animate(100, 0, {
                        duration: 1.2,
                        ease: "easeOut",
                        onUpdate: (latest) => setProgress(latest),
                        onComplete: () => setState('idle')
                    });
                }, 1000);
            }
        });
    };

    // Shader uses mixed progress + smooth hover
    // NOTE: Math.floor removed for infinite smoothness
    const shader = {
        tint: getProgressColor(progress),
        rep: 4 + (progress / 20) + (hoverFactor * 2),     // Seamless float scailing
        dist: 0.3 + (progress * 0.007) + (hoverFactor * 0.2),
        spd: 0.8 + (progress * 0.02) + (hoverFactor * 1.5), // Big speed boost on hover
        scl: 1.2 + (progress * 0.01) + (hoverFactor * 0.15)
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">2. Molten Core</h4>
            {/* Outer Neumorphic Container */}
            <div className="w-20 h-20 rounded-full shadow-neu-out-light dark:shadow-neu-out-dark p-1.5 bg-neu-light dark:bg-neu-dark flex items-center justify-center transition-all duration-300"
                style={{
                    boxShadow: (state === 'generating' || state === 'deflating') // Glows during both active phases
                        ? `0 0 30px ${getProgressColor(progress)}50, 4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.05)`
                        : state === 'complete'
                            ? '0 0 40px #94ca4260, 4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.05)'
                            : undefined
                }}
            >
                {/* Inner Button with press animation + hover detection */}
                <motion.button
                    onClick={handleClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 0.97 }}
                    whileTap={{ scale: 0.92 }}
                    animate={{
                        rotate: state === 'generating' ? 360 : 0,
                        scale: state === 'complete' ? [1, 1.05, 1] : 1
                    }}
                    transition={{
                        rotate: { duration: 4, ease: 'linear', repeat: state === 'generating' ? Infinity : 0 },
                        scale: { duration: 0.15, ease: 'easeOut' }
                    }}
                    className="w-full h-full rounded-full shadow-neu-in-light dark:shadow-neu-in-dark overflow-hidden relative cursor-pointer"
                >
                    <LiquidMetal
                        colorBack="#0a0a0a"
                        colorTint={shader.tint}
                        shape="circle"
                        repetition={shader.rep}
                        softness={0.5}
                        distortion={shader.dist}
                        speed={shader.spd}
                        scale={shader.scl}
                        style={{
                            width: '100%',
                            height: '100%'
                        }}
                    />
                    <AnimatePresence mode="wait">
                        {state === 'idle' ? (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <Zap className="w-8 h-8 text-white/90 drop-shadow-md" />
                            </motion.div>
                        ) : (state === 'generating' || state === 'deflating') ? (
                            <motion.div
                                key="progress"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <span className="font-mono text-xs font-bold text-white/90">{Math.round(progress)}%</span>
                            </motion.div>
                        ) : state === 'complete' ? (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 1.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <Check className="w-10 h-10 text-white drop-shadow-lg" strokeWidth={3} />
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );
});

const PlasmaConduitButton = React.memo(() => {
    const [state, setState] = React.useState<'idle' | 'generating' | 'complete' | 'deflating'>('idle');
    const [progress, setProgress] = React.useState(0);
    const [isHovered, setIsHovered] = React.useState(false);
    const [hoverFactor, setHoverFactor] = React.useState(0);

    // Physics-based lerp for buttery smooth hover
    React.useEffect(() => {
        let raf: number;
        const update = () => {
            setHoverFactor(prev => {
                const target = isHovered && state === 'idle' ? 1 : 0;
                const diff = target - prev;
                if (Math.abs(diff) < 0.001) return target;
                return prev + (diff * 0.1); // Smooth ease
            });
            raf = requestAnimationFrame(update);
        };
        raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    }, [isHovered, state]);

    const getProgressColor = (p: number) => {
        if (p < 25) return '#a78bfa'; // purple
        if (p < 50) return '#c084fc'; // lighter purple
        if (p < 75) return '#fbbf24'; // yellow
        return '#f97316'; // orange
    };

    const handleClick = () => {
        if (state !== 'idle') return;
        setState('generating');

        // Phase 1: Animate UP (0 → 100)
        animate(0, 100, {
            duration: 3.5,
            ease: "easeInOut",
            onUpdate: (latest) => setProgress(latest),
            onComplete: () => {
                setState('complete');
                // Brief pause at peak, then deflate
                setTimeout(() => {
                    setState('deflating');
                    // Phase 2: Animate DOWN (100 → 0)
                    animate(100, 0, {
                        duration: 1.2,
                        ease: "easeOut",
                        onUpdate: (latest) => setProgress(latest),
                        onComplete: () => setState('idle')
                    });
                }, 1000);
            }
        });
    };

    // Shader uses mixed progress + smooth hover
    const shader = {
        tint: getProgressColor(progress),
        rep: 4 + (progress / 20) + (hoverFactor * 2),
        dist: 0.3 + (progress * 0.007) + (hoverFactor * 0.2),
        spd: 0.8 + (progress * 0.02) + (hoverFactor * 1.5),
        scl: 1.2 + (progress * 0.01) + (hoverFactor * 0.15)
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">4. Plasma Conduit</h4>
            {/* Outer Neumorphic Container */}
            <div className="w-20 h-20 rounded-full shadow-neu-out-light dark:shadow-neu-out-dark p-1.5 bg-neu-light dark:bg-neu-dark flex items-center justify-center transition-all duration-300"
                style={{
                    boxShadow: (state === 'generating' || state === 'deflating') // Glows during both active phases
                        ? `0 0 30px ${getProgressColor(progress)}50, 4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.05)`
                        : state === 'complete'
                            ? '0 0 40px #22c55e60, 4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.05)'
                            : undefined
                }}
            >
                {/* Inner Button with design system animations + hover detection */}
                <motion.button
                    onClick={handleClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 0.97 }}
                    whileTap={{ scale: 0.92 }}
                    animate={{
                        scale: state === 'generating' ? [1, 0.96, 1] : state === 'complete' ? [1, 1.05, 1] : 1
                    }}
                    transition={{
                        scale: state === 'generating'
                            ? { duration: 0.5, repeat: Infinity }
                            : { duration: 0.15, ease: 'easeOut' }
                    }}
                    className="w-full h-full rounded-full shadow-neu-in-light dark:shadow-neu-in-dark overflow-hidden relative cursor-pointer"
                >
                    <LiquidMetal
                        colorBack="#0a0a0a"
                        colorTint={shader.tint}
                        shape="circle"
                        repetition={shader.rep}
                        softness={0.7}
                        distortion={shader.dist}
                        speed={shader.spd}
                        scale={shader.scl}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {state === 'idle' && (
                                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                    <Zap size={20} fill="#94ca42" className="text-brand drop-shadow-lg" />
                                </motion.div>
                            )}
                            {(state === 'generating' || state === 'deflating') && (
                                <motion.div
                                    key="progress"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="font-mono text-xs font-black"
                                    style={{ color: getProgressColor(progress), textShadow: `0 0 10px ${getProgressColor(progress)}` }}
                                >
                                    {Math.round(progress)}%
                                </motion.div>
                            )}
                            {state === 'complete' && (
                                <motion.div key="done" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
                                    <Check size={22} className="text-green-400" strokeWidth={3} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.button>
            </div>
        </div>
    );
});

const MoltenCoreProButton = React.memo(() => {
    const [state, setState] = React.useState<'idle' | 'generating' | 'complete' | 'deflating'>('idle');
    const [progress, setProgress] = React.useState(0);
    const [isHovered, setIsHovered] = React.useState(false);
    const [hoverFactor, setHoverFactor] = React.useState(0);

    // Physics-based lerp for buttery smooth hover
    React.useEffect(() => {
        let raf: number;
        const update = () => {
            setHoverFactor(prev => {
                const target = isHovered && state === 'idle' ? 1 : 0;
                const diff = target - prev;
                if (Math.abs(diff) < 0.001) return target;
                return prev + (diff * 0.1); // Smooth ease
            });
            raf = requestAnimationFrame(update);
        };
        raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    }, [isHovered, state]);

    // Stage-based colors matching brand system
    const getProgressColor = (p: number) => {
        if (p < 25) return '#94ca42'; // brand green
        if (p < 50) return '#fbbf24'; // yellow
        if (p < 75) return '#f97316'; // orange
        return '#ef4444'; // red hot
    };

    const getStatusText = (p: number) => {
        if (p < 20) return 'IGNITING...';
        if (p < 40) return 'HEATING...';
        if (p < 60) return 'MELTING...';
        if (p < 80) return 'FORGING...';
        if (p < 100) return 'SEALING...';
        return 'COMPLETE';
    };

    const handleClick = () => {
        if (state !== 'idle') return;
        setState('generating');

        // Phase 1: Animate UP (0 → 100)
        animate(0, 100, {
            duration: 3.5,
            ease: "easeInOut",
            onUpdate: (latest) => setProgress(latest),
            onComplete: () => {
                setState('complete');
                // Brief pause at peak, then deflate
                setTimeout(() => {
                    setState('deflating');
                    // Phase 2: Animate DOWN (100 → 0)
                    animate(100, 0, {
                        duration: 1.2,
                        ease: "easeOut",
                        onUpdate: (latest) => setProgress(latest),
                        onComplete: () => setState('idle')
                    });
                }, 1000);
            }
        });
    };

    // Shader uses mixed progress + smooth hover
    const shader = {
        tint: getProgressColor(progress),
        rep: 4 + (progress / 20) + (hoverFactor * 2),
        dist: 0.3 + (progress * 0.007) + (hoverFactor * 0.2),
        spd: 0.8 + (progress * 0.02) + (hoverFactor * 1.5),
        scl: 1.2 + (progress * 0.01) + (hoverFactor * 0.15)
    };

    // Calculate circular progress
    const circumference = 2 * Math.PI * 54; // radius 54
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">5. Molten Core Pro</h4>

            {/* Outer Neumorphic Container */}
            <div
                className="w-20 h-20 rounded-full shadow-neu-out-light dark:shadow-neu-out-dark p-1.5 bg-neu-light dark:bg-neu-dark flex items-center justify-center transition-all duration-300"
                style={{
                    boxShadow: (state === 'generating' || state === 'deflating') // Glows during both active phases
                        ? `0 0 35px ${getProgressColor(progress)}50, 4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.05)`
                        : state === 'complete'
                            ? '0 0 45px #22c55e60, 4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.05)'
                            : undefined
                }}
            >
                {/* Inner Button with Design System */}
                <motion.button
                    onClick={handleClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 0.97 }}
                    whileTap={{ scale: 0.92 }}
                    animate={{
                        rotate: state === 'generating' ? 360 : 0,
                        scale: state === 'complete' ? [1, 1.05, 1] : 1
                    }}
                    transition={{
                        rotate: { duration: 5, ease: 'linear', repeat: state === 'generating' ? Infinity : 0 },
                        scale: { duration: 0.15, ease: 'easeOut' }
                    }}
                    className="w-full h-full rounded-full shadow-neu-in-light dark:shadow-neu-in-dark overflow-hidden relative cursor-pointer"
                >
                    {/* Liquid Metal Core - full at complete */}
                    <LiquidMetal
                        colorBack="#0a0a0a"
                        colorTint={shader.tint}
                        shape="circle"
                        repetition={shader.rep}
                        softness={0.5}
                        distortion={shader.dist}
                        speed={shader.spd}
                        scale={shader.scl}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    />

                    {/* Circular Progress Ring */}
                    {(state === 'generating' || state === 'deflating') && (
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                            <motion.circle
                                cx="60" cy="60" r="54" fill="none"
                                stroke={getProgressColor(progress)}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                className="transition-all duration-75"
                            />
                        </svg>
                    )}

                    {/* Overlay Content (Counter-rotated) */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ rotate: state === 'generating' ? -360 : 0 }}
                        transition={{ duration: 5, ease: 'linear', repeat: state === 'generating' ? Infinity : 0 }}
                    >
                        <AnimatePresence mode="wait">
                            {state === 'idle' && (
                                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col items-center">
                                    <Zap size={20} fill="currentColor" className="text-white drop-shadow-md" />
                                    <span className="text-[8px] font-black tracking-widest text-white/80 mt-1">PRO</span>
                                </motion.div>
                            )}
                            {(state === 'generating' || state === 'deflating') && (
                                <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-0.5">
                                    <span className="font-mono text-[8px] text-white/70">{getStatusText(progress)}</span>
                                    <span className="font-mono text-xs font-black text-white drop-shadow-md">{Math.round(progress)}%</span>
                                </motion.div>
                            )}
                            {state === 'complete' && (
                                <motion.div key="done" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 400 }}>
                                    <Check size={26} className="text-green-400" strokeWidth={3} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.button>
            </div>
            <p className="text-[10px] opacity-40">Design System: hover/press + full shader at complete.</p>
        </div>
    );
});

export const DesignLabTab: React.FC<DesignLabTabProps> = ({ styles }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const [listItems, setListItems] = useState<string[]>(['Design', 'System', 'Rocks']);

    // Toggle state for Tactile Key experiments
    const [btn1Active, setBtn1Active] = useState(false);
    const [btn2Active, setBtn2Active] = useState(false);
    const [btn3Active, setBtn3Active] = useState(false);
    const [btn4Active, setBtn4Active] = useState(false);
    const [btn5Active, setBtn5Active] = useState(false);
    const [btn6Active, setBtn6Active] = useState(false);

    // Holding state (for deep press feedback)
    const [btn1Holding, setBtn1Holding] = useState(false);
    const [btn2Holding, setBtn2Holding] = useState(false);
    const [btn3Holding, setBtn3Holding] = useState(false);
    const [btn4Holding, setBtn4Holding] = useState(false);
    const [btn5Holding, setBtn5Holding] = useState(false);
    const [btn6Holding, setBtn6Holding] = useState(false);

    // --- DITHERING SHADER STATE ---
    const [shaderConfig, setShaderConfig] = useState({
        shape: 'ripple',
        type: 'dots',
        size: 5,
        speed: 1,
        scale: 4,
        rotation: 0
    });

    const randomizeShader = () => {
        const shapes = ['sphere', 'ripple', 'cylinder'];
        const types = ['dots', 'lines', 'noise'];
        setShaderConfig({
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            type: types[Math.floor(Math.random() * types.length)],
            size: Math.floor(Math.random() * 20) + 1,
            speed: Math.random() * 2,
            scale: Math.floor(Math.random() * 10) + 1,
            rotation: Math.random() * 360
        });
    };

    const loadPreset = (preset: 'ripple' | 'sphere') => {
        if (preset === 'ripple') {
            setShaderConfig({
                shape: 'ripple',
                type: 'dots',
                size: 3,
                speed: 0.5,
                scale: 6,
                rotation: 45
            });
        } else {
            setShaderConfig({
                shape: 'sphere',
                type: 'dots',
                size: 8,
                speed: 1.2,
                scale: 3,
                rotation: 0
            });
        }
    };

    // --- LIQUIDMETAL TEXT MASK STATE ---
    const LIQUID_METAL_DEFAULTS = {
        colorTint: '#94ca42',
        shape: 'none' as 'none' | 'circle' | 'daisy' | 'diamond' | 'metaballs',
        image: '' as string, // URL or empty for shape mode
        repetition: 1.55,
        softness: 0.45,
        shiftRed: 0.57,
        shiftBlue: 0.47,
        distortion: 0.97,
        contour: 0.0,
        angle: 90,
        speed: 0.36,
        scale: 0.6,
    };

    // Hover boost for slider preview
    const HOVER_BOOST = {
        repetition: 0.5,
        shiftRed: 0.2,
        shiftBlue: 0.2,
        speed: 0.4,
        scale: 0.3,
    };

    const [liquidMetalConfig, setLiquidMetalConfig] = useState(LIQUID_METAL_DEFAULTS);
    const sliderPreviewHoverRef = useRef(false);

    // Animated shader values (lerped)
    const [animatedShader, setAnimatedShader] = useState({
        repetition: LIQUID_METAL_DEFAULTS.repetition,
        shiftRed: LIQUID_METAL_DEFAULTS.shiftRed,
        shiftBlue: LIQUID_METAL_DEFAULTS.shiftBlue,
        speed: LIQUID_METAL_DEFAULTS.speed,
        scale: LIQUID_METAL_DEFAULTS.scale,
    });

    const updateLiquidMetal = (key: keyof typeof liquidMetalConfig, value: number | string) => {
        setLiquidMetalConfig(prev => ({ ...prev, [key]: value }));
    };

    const resetLiquidMetal = () => setLiquidMetalConfig(LIQUID_METAL_DEFAULTS);

    // Lerp helper
    const lerp = (current: number, target: number, factor: number) => {
        const diff = target - current;
        return Math.abs(diff) < 0.001 ? target : current + diff * factor;
    };

    // 60fps animation loop for smooth hover transitions
    useEffect(() => {
        let rafId: number;

        const tick = () => {
            const isHover = sliderPreviewHoverRef.current;
            const hovFactor = isHover ? 1 : 0;

            setAnimatedShader(prev => ({
                repetition: lerp(prev.repetition, liquidMetalConfig.repetition + (hovFactor * HOVER_BOOST.repetition), 0.08),
                shiftRed: lerp(prev.shiftRed, liquidMetalConfig.shiftRed + (hovFactor * HOVER_BOOST.shiftRed), 0.08),
                shiftBlue: lerp(prev.shiftBlue, liquidMetalConfig.shiftBlue + (hovFactor * HOVER_BOOST.shiftBlue), 0.08),
                speed: lerp(prev.speed, liquidMetalConfig.speed + (hovFactor * HOVER_BOOST.speed), 0.08),
                scale: lerp(prev.scale, liquidMetalConfig.scale + (hovFactor * HOVER_BOOST.scale), 0.08),
            }));

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [liquidMetalConfig]);

    return (
        <div className="space-y-12">
            {/* --- HEADER --- */}
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <NeuBadge>Internal Tool</NeuBadge>
                    </div>
                    <GalaxyHeading text="DESIGN SYSTEM" className="text-3xl md:text-5xl" />
                    <p className={`mt-4 text-base max-w-2xl ${styles.textSub}`}>
                        The "Celestial Neumorphism" design language. Soft shadows, physical feel, and vibrant accents.
                    </p>
                </div>

                <button
                    onClick={toggleTheme}
                    className={`p-4 rounded-2xl transition-all hover:text-brand ${theme === 'dark' ? 'bg-neu-dark shadow-neu-out-dark' : 'bg-neu-light shadow-neu-out-light'}`}
                >
                    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
            </header>

            {/* --- COLORS --- */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2">01. Colors</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <ColorSwatch color="bg-brand" name="Brand Primary" hex={BRAND_COLOR} />
                    <ColorSwatch color="bg-[#84b53b]" name="Brand Hover" hex="#84b53b" />
                    <ColorSwatch color="bg-red-500" name="Danger" hex="#EF4444" />
                    <ColorSwatch color="bg-green-500" name="Success" hex="#22C55E" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
                    <ColorSwatch color="bg-neu-light" name="Light Bg" hex="#F9FAFB" />
                    <ColorSwatch color="bg-[#0F1115]" name="Dark Bg" hex="#0F1115" />
                    <ColorSwatch color="bg-white" name="Pure White" hex="#FFFFFF" />
                    <ColorSwatch color="bg-black" name="Pure Black" hex="#000000" />
                </div>
            </section>

            {/* --- TYPOGRAPHY --- */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2">02. Typography</h2>

                <div className={`space-y-8 p-8 rounded-3xl ${theme === 'dark' ? 'bg-neu-dark shadow-neu-in-dark' : 'bg-neu-light shadow-neu-in-light'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">H1 / GalaxyHeading</span>
                        <div className="md:col-span-2">
                            <GalaxyHeading text="The Quick Brown Fox" className="text-4xl" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">H2 / Bold</span>
                        <h2 className="text-3xl font-bold md:col-span-2">Jumps Over The Lazy Dog</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">H3 / Bold</span>
                        <h3 className="text-2xl font-bold md:col-span-2">Celestial UI Design</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">Body / Regular</span>
                        <p className={`md:col-span-2 leading-relaxed ${styles.textMain}`}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-baseline">
                        <span className="text-xs font-mono opacity-50">Small / Medium</span>
                        <p className={`text-sm font-medium md:col-span-2 ${styles.textSub}`}>
                            Metadata, captions, and secondary information.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- COMPONENTS --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2">03. Components</h2>

                {/* Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold opacity-70">Buttons</h3>
                        <div className="flex flex-wrap gap-4">
                            <NeuButton variant="primary">Primary Action</NeuButton>
                            <NeuButton>Default</NeuButton>
                            <NeuButton variant="danger">Danger</NeuButton>
                            <NeuButton active>Active State</NeuButton>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4">
                            <NeuButton variant="primary" className="w-12 h-12 !p-0 rounded-full">
                                <Zap size={20} />
                            </NeuButton>
                            <NeuButton className="w-12 h-12 !p-0 rounded-full">
                                <Check size={20} />
                            </NeuButton>
                            <NeuButton variant="danger" className="w-12 h-12 !p-0 rounded-full">
                                <X size={20} />
                            </NeuButton>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold opacity-70">Badges</h3>
                        <div className="flex flex-wrap gap-3">
                            <NeuBadge>Default Badge</NeuBadge>
                            <NeuBadge className="text-green-500">Success</NeuBadge>
                            <NeuBadge className="text-red-500">Warning</NeuBadge>
                            <NeuBadge className="text-purple-500">Pro Feature</NeuBadge>
                        </div>
                    </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold opacity-70">Inputs</h3>
                        <NeuInput placeholder="Standard Input..." />
                        <NeuInput placeholder="With Icon..." />
                        <NeuDropdown
                            options={[
                                { label: 'Select Option 1', value: '1' },
                                { label: 'Select Option 2', value: '2' },
                                { label: 'Select Option 3', value: '3' },
                            ]}
                            onChange={(val) => console.log(val)}
                            placeholder="Choose an option..."
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold opacity-70">Text Area & Lists</h3>
                        <NeuTextArea placeholder="Multi-line text area..." rows={3} />
                        <NeuListBuilder
                            items={listItems}
                            onItemsChange={setListItems}
                            placeholder="Add a tag..."
                        />
                    </div>
                </div>

                {/* Cards */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold opacity-70">Cards</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <NeuCard>
                            <h4 className="font-bold text-xl mb-2">Outset Card (Default)</h4>
                            <p className="opacity-70">
                                This is the standard card style used for content containers. It appears raised from the background.
                            </p>
                        </NeuCard>

                        <NeuCard inset>
                            <h4 className="font-bold text-xl mb-2">Inset Card</h4>
                            <p className="opacity-70">
                                This style is used for "wells", active states, or areas that should feel recessed or pressed in.
                            </p>
                        </NeuCard>
                    </div>
                </div>
            </section>

            {/* --- EXPERIMENTAL ROUND 4 (Dynamic Theme) --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">04. Experimental Shadows (Round 4)</h2>
                <p className="opacity-70">Testing "Old School Key" concepts. Toggle the Theme Switcher to see the difference.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* Option 1: The Plateau + Rim */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 1: "The Plateau" (With Rim)</h3>
                        <p className="text-xs opacity-50 font-mono">Sharp Outset + Sharp Inset Rim</p>
                        <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)`
                                    : `3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)`
                            }}>
                            Plateau
                        </div>
                    </div>

                    {/* Option 2: The Bezel + Rim */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 2: "The Bezel" (With Rim)</h3>
                        <p className="text-xs opacity-50 font-mono">Border + Inner Shadow Definition</p>
                        <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.5)',
                                boxShadow: isDark
                                    ? `6px 6px 12px #050608, -6px -6px 12px #16191e, inset 2px 2px 4px rgba(0, 0, 0, 0.5)`
                                    : `6px 6px 12px rgba(136, 158, 177, 0.3), -6px -6px 12px rgba(255, 255, 255, 1), inset 2px 2px 4px rgba(136, 158, 177, 0.1)`
                            }}>
                            Bezel
                        </div>
                    </div>

                    {/* Option 3: The Deep Plateau */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 3: "The Deep Plateau"</h3>
                        <p className="text-xs opacity-50 font-mono">Outer Plateau + Deep 10px Blur Dish</p>
                        <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300 p-3"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)`
                                    : `3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)`
                            }}>
                            <div className="w-full h-full rounded-xl flex items-center justify-center text-sm font-bold"
                                style={{
                                    color: isDark ? '#E5E7EB' : '#4B5563',
                                    boxShadow: isDark
                                        ? `inset 5px 5px 10px rgba(0, 0, 0, 0.7), inset -5px -5px 10px rgba(255, 255, 255, 0.03)`
                                        : `inset 5px 5px 10px rgba(136, 158, 177, 0.3), inset -5px -5px 10px rgba(255, 255, 255, 0.8)`
                                }}>
                                Deep 10px
                            </div>
                        </div>
                    </div>

                    {/* Option 4: The Dish + Rim */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 4: "The Dish" (With Rim)</h3>
                        <p className="text-xs opacity-50 font-mono">Gradient + Deep Inner Shadow</p>
                        <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-300"
                            style={{
                                background: isDark ? 'linear-gradient(145deg, #13161b, #0c0e11)' : 'linear-gradient(145deg, #ffffff, #eff1f5)',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `5px 5px 10px #050608, -5px -5px 10px #16191e, inset 0px 0px 0px 1px rgba(255,255,255,0.03), inset 2px 2px 5px rgba(0,0,0,0.5)`
                                    : `5px 5px 10px rgba(136, 158, 177, 0.35), -5px -5px 10px rgba(255, 255, 255, 1), inset 0px 0px 0px 1px rgba(255,255,255,0.5), inset 2px 2px 5px rgba(136, 158, 177, 0.1)`
                            }}>
                            Curved
                        </div>
                    </div>
                </div>
            </section>

            {/* --- EXPERIMENTAL ROUND 5 (Pure Inset) --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">05. Pure Inset Experiments</h2>
                <p className="opacity-70">Testing "Rotated Outset" concept — flipping the Plateau shadow 180° to create an inset illusion.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* The Canyon - Current Global Style */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-brand">Option 1: "The Canyon" ✓</h3>
                        <p className="text-xs opacity-50 font-mono">Current Global Inset Style</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `inset 6px 6px 4px rgba(0, 0, 0, 0.8), inset -6px -6px 4px rgba(255, 255, 255, 0.05)`
                                    : `inset 6px 6px 4px rgba(136, 158, 177, 0.6), inset -6px -6px 4px rgba(255, 255, 255, 1)`
                            }}>
                            Canyon
                        </div>
                    </div>

                    {/* The Rotated Plateau (180°) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 2: "Rotated Plateau" (180°)</h3>
                        <p className="text-xs opacity-50 font-mono">Outset shadow with flipped coordinates</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)`
                                    : `-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)`
                            }}>
                            Rotated 180°
                        </div>
                    </div>

                    {/* The Rotated Plateau (Deeper) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 3: "Rotated Plateau" (Deep)</h3>
                        <p className="text-xs opacity-50 font-mono">Deeper blur, more dramatic flip</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)`
                                    : `-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.25), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)`
                            }}>
                            Deep Rotated
                        </div>
                    </div>

                    {/* The Rotated Plateau (Soft) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 4: "Rotated Plateau" (Soft)</h3>
                        <p className="text-xs opacity-50 font-mono">More diffuse, gentler edges</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-3px -3px 6px #060709, 2px 2px 4px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.3)`
                                    : `-2px -2px 6px rgba(136, 158, 177, 0.3), 2px 2px 6px rgba(255, 255, 255, 1), -4px -4px 10px rgba(136, 158, 177, 0.15), inset -1px -1px 2px rgba(255, 255, 255, 0.8), inset 1px 1px 2px rgba(136, 158, 177, 0.2)`
                            }}>
                            Soft Rotated
                        </div>
                    </div>

                    {/* The Rotated Plateau (Sharp) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 5: "Rotated Plateau" (Sharp)</h3>
                        <p className="text-xs opacity-50 font-mono">Tighter blur, crisp definition</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-2px -2px 3px #060709, 2px 2px 3px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 1px rgba(0, 0, 0, 0.6)`
                                    : `-2px -2px 2px rgba(136, 158, 177, 0.5), 2px 2px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.4)`
                            }}>
                            Sharp Rotated
                        </div>
                    </div>

                    {/* The Rotated Plateau (No Rim) */}
                    <div className="space-y-4">
                        <h3 className="font-bold">Option 6: "Rotated Plateau" (No Rim)</h3>
                        <p className="text-xs opacity-50 font-mono">Pure outer shadow, no inset rim</p>
                        <div className="w-full h-32 rounded-2xl flex items-center justify-center text-sm font-bold"
                            style={{
                                backgroundColor: isDark ? '#0F1115' : '#F9FAFB',
                                color: isDark ? '#E5E7EB' : '#4B5563',
                                boxShadow: isDark
                                    ? `-4px -4px 8px #060709, 3px 3px 6px #181b21`
                                    : `-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2)`
                            }}>
                            No Rim
                        </div>
                    </div>
                </div>
            </section>

            {/* --- EXPERIMENTAL ROUND 6 (Tactile Key) --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">06. The Perfect Tactile Key</h2>
                <p className="opacity-70">Click to toggle pressed state. Click again to release. Test the feel!</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Option 1: Current (Fixed Toggle) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm text-brand">1. Current ✓</h4>
                        <motion.button
                            animate={btn1Active ? "pressed" : "initial"}
                            whileHover={!btn1Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn1Active(!btn1Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.975,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 1,
                                    scale: 0.95,
                                    boxShadow: isDark
                                        ? "-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 2,
                                    scale: 0.92,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.3), inset -2px -2px 3px rgba(255, 255, 255, 1), inset 2px 2px 3px rgba(136, 158, 177, 0.4)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeInOut", duration: 0.1 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn1Active ? 'Pressed' : 'Released'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            3-tier: hover → pressed → deep
                        </p>
                    </div>

                    {/* Option 2: Faster Response */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">2. Faster Response</h4>
                        <motion.button
                            animate={btn2Active ? "pressed" : "initial"}
                            whileHover={!btn2Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn2Active(!btn2Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.98,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 1,
                                    scale: 0.96,
                                    boxShadow: isDark
                                        ? "-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 2,
                                    scale: 0.92,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.3), inset -2px -2px 3px rgba(255, 255, 255, 1), inset 2px 2px 3px rgba(136, 158, 177, 0.4)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeOut", duration: 0.08 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn2Active ? 'Pressed' : 'Faster 0.08s'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            tween 0.08s | snappier feel
                        </p>
                    </div>

                    {/* Option 3: Deeper Press */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">3. Deeper Press</h4>
                        <motion.button
                            animate={btn3Active ? "pressed" : "initial"}
                            whileHover={!btn3Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn3Active(!btn3Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.97,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 2,
                                    scale: 0.92,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.25), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 3,
                                    scale: 0.88,
                                    boxShadow: isDark
                                        ? "-8px -8px 16px #060709, 5px 5px 10px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.03), inset 1px 1px 3px rgba(0, 0, 0, 0.7)"
                                        : "-7px -7px 12px rgba(136, 158, 177, 0.6), 4px 4px 8px rgba(255, 255, 255, 1), -10px -10px 20px rgba(136, 158, 177, 0.35), inset -2px -2px 4px rgba(255, 255, 255, 1), inset 2px 2px 4px rgba(136, 158, 177, 0.5)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeInOut", duration: 0.15 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn3Active ? 'Pressed' : 'Deeper Press'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            y+2, scale 0.92 | heavy sink
                        </p>
                    </div>

                    {/* Option 4: Subtle Anticipation */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">4. Subtle Anticipation</h4>
                        <motion.button
                            animate={btn4Active ? "pressed" : "initial"}
                            whileHover={!btn4Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn4Active(!btn4Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.99,
                                    boxShadow: isDark
                                        ? "3px 3px 6px #060709, -2px -2px 5px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "2px 2px 3px rgba(136, 158, 177, 0.4), -2px -2px 3px rgba(255, 255, 255, 1), 4px 4px 8px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 1,
                                    scale: 0.97,
                                    boxShadow: isDark
                                        ? "-3px -3px 6px #060709, 2px 2px 4px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-2px -2px 3px rgba(136, 158, 177, 0.4), 2px 2px 3px rgba(255, 255, 255, 1), -4px -4px 8px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 2,
                                    scale: 0.94,
                                    boxShadow: isDark
                                        ? "-5px -5px 10px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                                        : "-4px -4px 6px rgba(136, 158, 177, 0.5), 3px 3px 5px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.25), inset -2px -2px 3px rgba(255, 255, 255, 1), inset 2px 2px 3px rgba(136, 158, 177, 0.4)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeOut", duration: 0.12 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn4Active ? 'Pressed' : 'Subtle'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            scale 0.99→0.97 | minimal
                        </p>
                    </div>

                    {/* Option 5: Spring Sink */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">5. Spring Sink</h4>
                        <motion.button
                            animate={btn5Active ? "pressed" : "initial"}
                            whileHover={!btn5Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn5Active(!btn5Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 0.975,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                pressed: {
                                    y: 1,
                                    scale: 0.95,
                                    boxShadow: isDark
                                        ? "-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 2,
                                    scale: 0.92,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.05), inset 1px 1px 2px rgba(0, 0, 0, 0.6)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.3), inset -2px -2px 3px rgba(255, 255, 255, 1), inset 2px 2px 3px rgba(136, 158, 177, 0.4)"
                                }
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn5Active ? 'Pressed' : 'Spring Sink'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            spring 500/25 | bouncy return
                        </p>
                    </div>

                    {/* Option 6: No Scale (Shadow Only) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">6. Shadow Only</h4>
                        <motion.button
                            animate={btn6Active ? "pressed" : "initial"}
                            whileHover={!btn6Active ? "hover" : undefined}
                            whileTap="deepPressed"
                            onMouseDown={() => setBtn6Active(!btn6Active)}
                            variants={{
                                initial: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5)"
                                        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                hover: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.03)"
                                        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), inset 2px 2px 4px rgba(136, 158, 177, 0.2), inset -2px -2px 4px rgba(255, 255, 255, 0.5)"
                                },
                                pressed: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)"
                                        : "-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)"
                                },
                                deepPressed: {
                                    y: 0,
                                    scale: 1,
                                    boxShadow: isDark
                                        ? "-6px -6px 12px #060709, 4px 4px 8px #181b21, inset -2px -2px 2px rgba(255, 255, 255, 0.1), inset 2px 2px 4px rgba(0, 0, 0, 0.6)"
                                        : "-5px -5px 8px rgba(136, 158, 177, 0.5), 3px 3px 6px rgba(255, 255, 255, 1), -8px -8px 16px rgba(136, 158, 177, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 1), inset 2px 2px 4px rgba(136, 158, 177, 0.5)"
                                }
                            }}
                            transition={{ type: "tween", ease: "easeInOut", duration: 0.15 }}
                            className={`rounded-xl px-6 py-3 font-bold select-none outline-none cursor-pointer ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}
                        >
                            {btn6Active ? 'Pressed' : 'Shadow Only'}
                        </motion.button>
                        <p className="text-xs font-mono opacity-40 text-center">
                            no scale | pure shadow morph
                        </p>
                    </div>

                </div>
            </section>

            {/* --- EXPERIMENTAL SECTION 08: Active Toggle States --- */}
            <section className="space-y-8">
                <h2 className="text-2xl font-bold border-b border-black/10 dark:border-white/10 pb-2 text-brand">08. Active Toggle States (Brand Color)</h2>
                <p className="opacity-70">Testing how to make selected/active toggles feel "pressed in" while maintaining the brand purple color.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Option A: Current (Flat Purple - The Problem) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm text-red-500">A. Current ❌ (Flat)</h4>
                        <div className="flex gap-2">
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white`}>
                                Active
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            bg-brand text-white (no shadow)
                        </p>
                    </div>

                    {/* Option B: Brand + ShadowIn */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">B. Brand + ShadowIn</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold bg-brand text-white`}
                                style={{
                                    boxShadow: isDark
                                        ? `-4px -4px 8px #060709, 3px 3px 6px #181b21, inset -1px -1px 1px rgba(255, 255, 255, 0.1), inset 1px 1px 2px rgba(0, 0, 0, 0.5)`
                                        : `-3px -3px 4px rgba(136, 158, 177, 0.4), 2px 2px 4px rgba(255, 255, 255, 1), -6px -6px 12px rgba(136, 158, 177, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 1), inset 1px 1px 2px rgba(136, 158, 177, 0.3)`
                                }}>
                                Active
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            bg-brand + rotated plateau shadow
                        </p>
                    </div>

                    {/* Option C: Neon Trench (Cyberpunk) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">C. Neon Trench</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-white relative overflow-hidden`}
                                style={{
                                    backgroundColor: '#2D00B3', // Deep purple base
                                    boxShadow: `inset 0 0 10px #00FFFF, inset 0 0 5px #FF00FF, 0 0 15px rgba(109, 93, 252, 0.5)`
                                }}>
                                <span className="relative z-10 mix-blend-overlay">ACTIVE</span>
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            chromatic inner glow + halo
                        </p>
                    </div>

                    {/* Option D: Galaxy Window (Infinite Depth) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">D. Galaxy Window</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-transparent bg-clip-text relative group`}
                                style={{
                                    backgroundImage: isDark
                                        ? 'radial-gradient(circle at center, #FFFFFF 0%, #94ca42 100%)' // Text gradient
                                        : 'radial-gradient(circle at center, #FFFFFF 0%, #E0E7FF 100%)',
                                    backgroundColor: '#000', // Void back
                                    boxShadow: `inset 0px 4px 10px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.2)`
                                }}>
                                <div className="absolute inset-0 opacity-80"
                                    style={{
                                        backgroundImage: 'radial-gradient(white 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
                                        backgroundSize: '10px 10px, 20px 20px',
                                        backgroundPosition: '0 0, 5px 5px'
                                    }}
                                />
                                <span className="relative z-10">ACTIVE</span>
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            recessed starfield + void
                        </p>
                    </div>

                    {/* Option E: Gummy Gloss (Lickable) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">E. Gummy Gloss</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-white`}
                                style={{
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%), #94ca42',
                                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 5px rgba(148, 202, 66, 0.4), inset 0 -2px 5px rgba(0,0,0,0.2)`
                                }}>
                                Active
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            high gloss + top highlight
                        </p>
                    </div>

                    {/* Option F: Scanline Data (Tech) */}
                    <div className="flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded-3xl space-y-4">
                        <h4 className="font-bold text-sm opacity-50">F. Scanline Data</h4>
                        <div className="flex gap-2">
                            <button
                                className={`px-4 py-2 rounded-xl text-xs font-bold text-[#94ca42] relative overflow-hidden`}
                                style={{
                                    backgroundColor: isDark ? '#0a1a0a' : '#f0fdf4',
                                    border: '1px solid #94ca42',
                                    boxShadow: `inset 0 0 10px rgba(148, 202, 66, 0.2)`
                                }}>
                                <div className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: 'linear-gradient(0deg, transparent 24%, #94ca42 25%, #94ca42 26%, transparent 27%, transparent 74%, #94ca42 75%, #94ca42 76%, transparent 77%, transparent)',
                                        backgroundSize: '50px 50px'
                                    }}
                                />
                                <span className="relative z-10 drop-shadow-[0_0_5px_rgba(148,202,66,0.8)]">ACTIVE</span>
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-neu-text-sub-dark' : 'bg-neu-light shadow-neu-out-light text-neu-text-sub-light'}`}>
                                Inactive
                            </button>
                        </div>
                        <p className="text-xs font-mono opacity-40 text-center">
                            digital retro grid + border
                        </p>
                    </div>

                </div>
            </section>

            {/* --- GOOGLE SANS FLEX SHOWCASE --- */}
            <GoogleSansFlexShowcase isDark={isDark} />


            {/* --- 10. CELESTIAL NEUMORPHISM: DITHERING BUTTONS --- */}
            <section className="space-y-8 pt-12 border-t border-black/10 dark:border-white/10">
                <div>
                    <h2 className="text-2xl font-bold text-brand">10. Celestial Neumorphism: Dithering Buttons</h2>
                    <p className="opacity-70 mt-1">Tactile buttons with animated Dithering shader cores.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {/* Dithering 1: The Ripple Pool */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">1. Ripple Pool</h4>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96, y: 2 }}
                            className="relative w-56 h-16 rounded-2xl overflow-hidden shadow-neu-out-light dark:shadow-neu-out-dark"
                        >
                            <Dithering colorBack="#000000" colorFront="#94ca42" shape="ripple" type="noise" size={4} speed={0.5} scale={8} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg tracking-widest drop-shadow-lg">
                                GENERATE
                            </div>
                        </motion.button>
                        <p className="text-[10px] opacity-40">Outward radial pulse. Calm energy.</p>
                    </div>

                    {/* Dithering 2: The Cylinder Press */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">2. Cylinder Press</h4>
                        <motion.button
                            whileTap={{ scale: 0.94, y: 3 }}
                            className="relative w-56 h-16 rounded-2xl overflow-hidden shadow-neu-out-light dark:shadow-neu-out-dark"
                        >
                            <Dithering colorBack="#94ca42" colorFront="#ffffff" shape="cylinder" type="dots" size={3} speed={1} scale={6} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 text-white font-bold">
                                <Zap size={18} fill="currentColor" />
                                ACTIVATE
                            </div>
                        </motion.button>
                        <p className="text-[10px] opacity-40">Mechanical rotation. High tension.</p>
                    </div>

                    {/* Dithering 3: The Noise Orb */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">3. Noise Orb</h4>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9, rotate: -5 }}
                            className="relative w-20 h-20 rounded-full overflow-hidden shadow-neu-out-light dark:shadow-neu-out-dark"
                        >
                            <Dithering colorBack="#0a0a0a" colorFront="#94ca42" shape="sphere" type="8x8" size={5} speed={1.2} scale={12} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <Zap size={28} fill="currentColor" />
                            </div>
                        </motion.button>
                        <p className="text-[10px] opacity-40">Spherical distortion. FAB style.</p>
                    </div>

                    {/* Dithering 4: The Scanline Trigger */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">4. Scanline Trigger</h4>
                        <motion.button
                            whileTap={{ y: 2 }}
                            className="relative w-48 h-14 rounded-xl overflow-hidden shadow-neu-out-light dark:shadow-neu-out-dark border border-brand/20"
                        >
                            <Dithering colorBack="#000000" colorFront="#94ca42" shape="cylinder" type="lines" size={2} speed={2} scale={20} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }} />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 text-brand font-bold text-sm tracking-tight uppercase">
                                <Zap size={16} fill="#94ca42" />
                                PRECISION
                            </div>
                        </motion.button>
                        <p className="text-[10px] opacity-40">Retro CRT lines. Industrial.</p>
                    </div>

                    {/* Dithering 5: The Frosted Lens */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">5. Frosted Lens</h4>
                        <div className="relative w-56 h-16 rounded-xl overflow-hidden shadow-neu-out-light dark:shadow-neu-out-dark bg-neu-light dark:bg-neu-dark">
                            <div className="absolute inset-0 z-0">
                                <Dithering colorBack="#000000" colorFront="#94ca42" shape="sphere" type="dots" size={8} speed={1} scale={4} />
                            </div>
                            <motion.button
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                className="absolute inset-0 z-10 backdrop-blur-md bg-white/5 dark:bg-black/30 flex items-center justify-center text-brand font-bold tracking-widest"
                            >
                                ENGAGED
                            </motion.button>
                        </div>
                        <p className="text-[10px] opacity-40">Shader behind frosted glass.</p>
                    </div>

                    {/* Dithering 6: The Underglow */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">6. Underglow</h4>
                        <div className="relative w-48 h-14">
                            <div className="absolute top-3 left-0 w-full h-full rounded-xl overflow-hidden opacity-60 blur-md scale-95">
                                <Dithering colorBack="#000000" colorFront="#94ca42" shape="ripple" type="noise" size={6} speed={0.5} scale={4} style={{ width: '100%', height: '100%' }} />
                            </div>
                            <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ y: 2 }}
                                className="relative w-full h-full bg-neu-light dark:bg-[#1a1a1a] rounded-xl border border-brand/30 flex items-center justify-center gap-2 font-bold text-brand"
                            >
                                START ENGINE
                            </motion.button>
                        </div>
                        <p className="text-[10px] opacity-40">Floating plate. Ambient glow.</p>
                    </div>
                </div>
            </section>

            {/* --- 11. CELESTIAL NEUMORPHISM: LIQUID METAL BUTTONS (PREMIUM) --- */}
            <section className="space-y-8 pt-12 border-t border-black/10 dark:border-white/10">
                <div>
                    <h2 className="text-2xl font-bold text-brand">11. Premium: Liquid Metal Generate Buttons</h2>
                    <p className="opacity-70 mt-1">Click to trigger a 5-second simulated generation. Stage-based color transitions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">

                    {/* --- 1. THE GENESIS FORGE --- */}
                    {(() => {
                        const [state, setState] = React.useState<'idle' | 'generating' | 'complete'>('idle');
                        const [progress, setProgress] = React.useState(0);

                        // Stage-based color: white → yellow → orange → green
                        const getProgressColor = (p: number) => {
                            if (p < 33) return '#ffffff';
                            if (p < 66) return '#fbbf24'; // yellow
                            if (p < 100) return '#f97316'; // orange
                            return '#22c55e'; // green
                        };

                        const handleClick = () => {
                            if (state !== 'idle') return;
                            setState('generating');
                            setProgress(0);
                            const interval = setInterval(() => {
                                setProgress(p => {
                                    if (p >= 100) {
                                        clearInterval(interval);
                                        setState('complete');
                                        setTimeout(() => setState('idle'), 2500);
                                        return 100;
                                    }
                                    return p + 2;
                                });
                            }, 100);
                        };

                        return (
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">1. Genesis Forge</h4>
                                <motion.button
                                    onClick={handleClick}
                                    animate={{
                                        scale: state === 'generating' ? [1, 1.02, 1] : 1,
                                        boxShadow: state === 'generating'
                                            ? [`0 0 15px ${getProgressColor(progress)}40`, `0 0 30px ${getProgressColor(progress)}60`, `0 0 15px ${getProgressColor(progress)}40`]
                                            : '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                    transition={{ duration: 0.6, repeat: state === 'generating' ? Infinity : 0 }}
                                    className="relative w-40 h-11 rounded-xl overflow-hidden cursor-pointer"
                                >
                                    {/* Liquid Metal - always visible, intensifies on generate */}
                                    <LiquidMetal
                                        colorBack="#0a0a0a"
                                        colorTint={state === 'complete' ? '#22c55e' : state === 'generating' ? getProgressColor(progress) : '#94ca42'}
                                        shape="metaballs"
                                        repetition={state === 'generating' ? 6 + Math.floor(progress / 20) : 4}
                                        softness={0.7}
                                        distortion={state === 'generating' ? 0.4 + (progress * 0.006) : 0.3}
                                        speed={state === 'generating' ? 1.5 + (progress * 0.025) : 0.8}
                                        scale={state === 'generating' ? 1.2 + (progress * 0.008) : 1.0}
                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <AnimatePresence mode="wait">
                                            {state === 'idle' ? (
                                                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-white font-bold text-sm tracking-widest drop-shadow-lg">
                                                    GENERATE
                                                </motion.span>
                                            ) : state === 'generating' ? (
                                                <motion.span
                                                    key="gen"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="font-mono text-base font-black"
                                                    style={{ color: getProgressColor(progress), textShadow: `0 0 12px ${getProgressColor(progress)}` }}
                                                >
                                                    {progress}%
                                                </motion.span>
                                            ) : state === 'complete' ? (
                                                <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-400">
                                                    <Check size={20} strokeWidth={3} />
                                                </motion.div>
                                            ) : null}
                                        </AnimatePresence>
                                    </div>
                                </motion.button>
                                <p className="text-[10px] opacity-40">Shader expands and intensifies during generation.</p>
                            </div>
                        );
                    })()}

                    {/* --- 2. THE MOLTEN CORE --- */}
                    <MoltenCoreButton />

                    {/* --- 3. THE CHROME REACTOR --- */}
                    {(() => {
                        const [state, setState] = React.useState<'idle' | 'generating' | 'complete'>('idle');
                        const [progress, setProgress] = React.useState(0);

                        const getStatusText = (p: number) => {
                            if (p < 20) return 'INITIALIZING...';
                            if (p < 40) return 'COMPILING...';
                            if (p < 60) return 'RENDERING...';
                            if (p < 80) return 'OPTIMIZING...';
                            if (p < 100) return 'FINALIZING...';
                            return 'DEPLOYED';
                        };

                        const getProgressColor = (p: number) => {
                            if (p < 33) return '#c0c0c0'; // silver
                            if (p < 66) return '#fbbf24'; // gold
                            if (p < 100) return '#f97316';
                            return '#22c55e';
                        };

                        const handleClick = () => {
                            if (state !== 'idle') return;
                            setState('generating');
                            setProgress(0);
                            const interval = setInterval(() => {
                                setProgress(p => {
                                    if (p >= 100) { clearInterval(interval); setState('complete'); setTimeout(() => setState('idle'), 2500); return 100; }
                                    return p + 2;
                                });
                            }, 100);
                        };

                        return (
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">3. Chrome Reactor</h4>
                                <div className="relative">
                                    <motion.div
                                        animate={{
                                            scale: state === 'generating' ? [1, 1.2, 1] : 1,
                                            opacity: state === 'generating' ? [0.2, 0.5, 0.2] : 0
                                        }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                        className="absolute inset-0 rounded-2xl blur-xl"
                                        style={{ background: getProgressColor(progress) }}
                                    />
                                    <motion.button
                                        onClick={handleClick}
                                        whileTap={{ scale: 0.96 }}
                                        className="relative w-44 h-11 rounded-xl overflow-hidden cursor-pointer shadow-lg border border-white/10"
                                    >
                                        <LiquidMetal
                                            colorBack="#0a0a0a"
                                            colorTint={state === 'complete' ? '#22c55e' : getProgressColor(progress)}
                                            shape="none"
                                            repetition={6}
                                            softness={0.8}
                                            shiftRed={0.5}
                                            shiftBlue={-0.5}
                                            distortion={state === 'generating' ? 0.3 + (progress * 0.004) : 0.2}
                                            speed={state === 'generating' ? 1.5 + (progress * 0.02) : 0.5}
                                            scale={0.7}
                                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                                        />
                                        {/* Bottom progress line */}
                                        {state === 'generating' && (
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className="absolute bottom-0 left-0 h-1"
                                                style={{ background: getProgressColor(progress) }}
                                            />
                                        )}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <AnimatePresence mode="wait">
                                                {state === 'idle' ? (
                                                    <motion.span key="idle" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-white font-bold tracking-widest">
                                                        INITIALIZE
                                                    </motion.span>
                                                ) : state === 'generating' ? (
                                                    <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-1">
                                                        <span className="font-mono text-xs" style={{ color: getProgressColor(progress) }}>{getStatusText(progress)}</span>
                                                        <span className="font-mono text-lg font-black" style={{ color: getProgressColor(progress), textShadow: `0 0 10px ${getProgressColor(progress)}` }}>{progress}%</span>
                                                    </motion.div>
                                                ) : state === 'complete' ? (
                                                    <motion.span key="done" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-green-400 font-bold flex items-center gap-2">
                                                        <Check size={20} strokeWidth={3} /> DEPLOYED
                                                    </motion.span>
                                                ) : null}
                                            </AnimatePresence>
                                        </div>
                                    </motion.button>
                                </div>
                                <p className="text-[10px] opacity-40">Multi-stage status text. Dynamic glow color.</p>
                            </div>
                        );
                    })()}

                    {/* --- 4. THE PLASMA CONDUIT --- */}
                    <PlasmaConduitButton />

                    {/* --- 5. MOLTEN CORE PRO --- */}
                    <MoltenCoreProButton />

                    {/* --- 6. THE SPLIT COMMANDER --- */}
                    {(() => {
                        const [state, setState] = React.useState<'idle' | 'generating' | 'complete'>('idle');
                        const [progress, setProgress] = React.useState(0);

                        const getProgressColor = (p: number) => {
                            if (p < 33) return '#94ca42';
                            if (p < 66) return '#fbbf24';
                            if (p < 100) return '#f97316';
                            return '#22c55e';
                        };

                        const handleClick = () => {
                            if (state !== 'idle') return;
                            setState('generating');
                            setProgress(0);
                            const interval = setInterval(() => {
                                setProgress(p => {
                                    if (p >= 100) { clearInterval(interval); setState('complete'); setTimeout(() => setState('idle'), 2500); return 100; }
                                    return p + 2;
                                });
                            }, 100);
                        };

                        return (
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <h4 className="font-bold text-xs uppercase tracking-widest opacity-50">6. Split Commander</h4>
                                <div className="flex rounded-xl overflow-hidden shadow-lg h-11 w-48 bg-neu-light dark:bg-neu-dark">
                                    <motion.div
                                        animate={{ width: state === 'generating' ? '30%' : '40%' }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className="flex items-center justify-center font-bold text-xs border-r border-black/10 dark:border-white/10 px-2"
                                    >
                                        <AnimatePresence mode="wait">
                                            {state === 'idle' ? (
                                                <motion.span key="cfg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>CFG</motion.span>
                                            ) : state === 'generating' ? (
                                                <motion.span key="pct" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-mono text-xs font-black" style={{ color: getProgressColor(progress) }}>
                                                    {progress}%
                                                </motion.span>
                                            ) : state === 'complete' ? (
                                                <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500 font-bold">✓</motion.span>
                                            ) : null}
                                        </AnimatePresence>
                                    </motion.div>
                                    <motion.button
                                        onClick={handleClick}
                                        animate={{ width: state === 'generating' ? '70%' : '60%' }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className="relative overflow-hidden cursor-pointer"
                                    >
                                        {/* Liquid Metal - always visible, intensifies on generate */}
                                        <LiquidMetal
                                            colorBack="#0a0a0a"
                                            colorTint={state === 'complete' ? '#22c55e' : state === 'generating' ? getProgressColor(progress) : '#94ca42'}
                                            shape="metaballs"
                                            repetition={state === 'generating' ? 5 + Math.floor(progress / 25) : 3}
                                            softness={0.7}
                                            distortion={state === 'generating' ? 0.3 + (progress * 0.005) : 0.25}
                                            speed={state === 'generating' ? 1.2 + (progress * 0.02) : 0.6}
                                            scale={state === 'generating' ? 1.0 + (progress * 0.006) : 0.9}
                                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center text-white">
                                            <AnimatePresence mode="wait">
                                                {state === 'complete' ? (
                                                    <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                        <Check size={18} strokeWidth={3} />
                                                    </motion.div>
                                                ) : (
                                                    <Zap size={18} fill="currentColor" />
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.button>
                                </div>
                                <p className="text-[10px] opacity-40">Shader expands and intensifies during generation.</p>
                            </div>
                        );
                    })()}

                </div>
            </section>

            {/* --- 12. BRAND LOGO SHADERS --- */}
            <section className="space-y-8 pt-12 border-t border-black/10 dark:border-white/10">
                <div>
                    <h2 className="text-2xl font-bold text-brand">12. Brand Logo Shaders</h2>
                    <p className="opacity-70 mt-1">LiquidMetal applied to actual brand logo images.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Icon (Dark Mode) */}
                    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-black rounded-3xl overflow-hidden shadow-2xl">
                        <h4 className="text-brand/60 text-xs font-mono uppercase tracking-widest">BRAND ICON (LiquidMetal)</h4>
                        <div className="w-64 h-64 relative">
                            <LiquidMetal
                                colorBack="#000000"
                                colorTint="#94ca42"
                                shape="circle"
                                image="/header-icon-dark-mode (1).svg"
                                repetition={6}
                                softness={0.8}
                                shiftRed={0.8}
                                shiftBlue={-0.8}
                                distortion={0.4}
                                contour={0.4}
                                speed={1}
                                scale={0.8}
                                fit="contain"
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <p className="text-[10px] text-white/40 text-center">Main brand icon with LiquidMetal overlay.</p>
                    </div>

                    {/* Wordmark (Dark Mode) */}
                    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-black rounded-3xl overflow-hidden shadow-2xl">
                        <h4 className="text-brand/60 text-xs font-mono uppercase tracking-widest">WORDMARK (LiquidMetal)</h4>
                        <div className="w-full h-32 relative">
                            <LiquidMetal
                                colorBack="#000000"
                                colorTint="#94ca42"
                                shape="none"
                                image="/xcreate-wordmark-logo-dark-mode.png"
                                repetition={8}
                                softness={0.6}
                                shiftRed={0.5}
                                shiftBlue={-0.5}
                                distortion={0.3}
                                contour={0.2}
                                speed={0.6}
                                scale={0.5}
                                fit="contain"
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <p className="text-[10px] text-white/40 text-center">Wordmark with flowing metal texture.</p>
                    </div>
                </div>
            </section>

            {/* --- 13. LIQUIDMETAL SHADER LAB --- */}
            <section className="space-y-8 pt-12 border-t border-black/10 dark:border-white/10">
                <div>
                    <h2 className="text-2xl font-bold text-brand">13. LiquidMetal Shader Lab</h2>
                    <p className="opacity-70 mt-1">Experiment with shader parameters. Text masks render directly on the page canvas.</p>
                </div>

                {/* TEXT MASK PREVIEWS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Preview 1: Main Text */}
                    <div
                        className="relative h-28 cursor-pointer flex items-center justify-center rounded-2xl border border-black/5 dark:border-white/5"
                        onMouseEnter={() => { sliderPreviewHoverRef.current = true; }}
                        onMouseLeave={() => { sliderPreviewHoverRef.current = false; }}
                    >
                        <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="xMidYMid meet">
                            <defs>
                                <clipPath id="liquid-text-mask-1">
                                    <text
                                        x="50%"
                                        y="50%"
                                        dominantBaseline="middle"
                                        textAnchor="middle"
                                        fontSize="56"
                                        fontWeight="800"
                                        fontFamily="system-ui, -apple-system, sans-serif"
                                    >
                                        DESIGN SYSTEM
                                    </text>
                                </clipPath>
                            </defs>
                            <foreignObject x="0" y="0" width="100%" height="100%" clipPath="url(#liquid-text-mask-1)">
                                <div style={{ width: '100%', height: '100%' }}>
                                    <LiquidMetal
                                        colorBack={isDark ? '#0F1115' : '#F9FAFB'}
                                        colorTint={liquidMetalConfig.colorTint}
                                        shape="none"
                                        repetition={animatedShader.repetition}
                                        softness={liquidMetalConfig.softness}
                                        shiftRed={animatedShader.shiftRed}
                                        shiftBlue={animatedShader.shiftBlue}
                                        distortion={liquidMetalConfig.distortion}
                                        contour={liquidMetalConfig.contour}
                                        angle={liquidMetalConfig.angle}
                                        speed={animatedShader.speed}
                                        scale={animatedShader.scale}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            </foreignObject>
                        </svg>
                    </div>

                    {/* Preview 2: Secondary Text */}
                    <div className="relative h-28 cursor-pointer flex items-center justify-center rounded-2xl border border-black/5 dark:border-white/5">
                        <svg className="w-full h-full" viewBox="0 0 400 80" preserveAspectRatio="xMidYMid meet">
                            <defs>
                                <clipPath id="liquid-text-mask-2">
                                    <text
                                        x="50%"
                                        y="50%"
                                        dominantBaseline="middle"
                                        textAnchor="middle"
                                        fontSize="52"
                                        fontWeight="800"
                                        fontFamily="system-ui, -apple-system, sans-serif"
                                    >
                                        OFFERINGS
                                    </text>
                                </clipPath>
                            </defs>
                            <foreignObject x="0" y="0" width="100%" height="100%" clipPath="url(#liquid-text-mask-2)">
                                <div style={{ width: '100%', height: '100%' }}>
                                    <LiquidMetal
                                        colorBack={isDark ? '#0F1115' : '#F9FAFB'}
                                        colorTint={liquidMetalConfig.colorTint}
                                        shape="none"
                                        repetition={animatedShader.repetition}
                                        softness={liquidMetalConfig.softness}
                                        shiftRed={animatedShader.shiftRed}
                                        shiftBlue={animatedShader.shiftBlue}
                                        distortion={liquidMetalConfig.distortion}
                                        contour={liquidMetalConfig.contour}
                                        angle={liquidMetalConfig.angle}
                                        speed={animatedShader.speed}
                                        scale={animatedShader.scale}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            </foreignObject>
                        </svg>
                    </div>
                </div>

                {/* SHAPE/IMAGE PREVIEW (Separate from Text Mask Demos) */}
                <div className="mt-8 p-6 rounded-3xl bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <NeuBadge>Preview</NeuBadge>
                        <h4 className="font-bold text-sm">Shape / Image Mode</h4>
                    </div>
                    <div className="relative h-64 rounded-2xl overflow-hidden">
                        <LiquidMetal
                            colorBack={isDark ? '#0F1115' : '#F9FAFB'}
                            colorTint={liquidMetalConfig.colorTint}
                            shape={liquidMetalConfig.image ? 'none' : liquidMetalConfig.shape}
                            image={liquidMetalConfig.image || undefined}
                            repetition={animatedShader.repetition}
                            softness={liquidMetalConfig.softness}
                            shiftRed={animatedShader.shiftRed}
                            shiftBlue={animatedShader.shiftBlue}
                            distortion={liquidMetalConfig.distortion}
                            contour={liquidMetalConfig.contour}
                            angle={liquidMetalConfig.angle}
                            speed={animatedShader.speed}
                            scale={animatedShader.scale}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                    <p className="text-xs text-center opacity-50 mt-2">
                        {liquidMetalConfig.image ? 'Image mode — shader applied to custom image' : `Shape: ${liquidMetalConfig.shape}`}
                    </p>
                </div>

                {/* SHADER CONTROLS (Full Width, Below Grid) */}
                <div className="mt-8 p-6 rounded-3xl bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-brand">LiquidMetal Shader Controls</h3>
                            <p className="text-xs opacity-60">Tweak these values to find your ideal configuration.</p>
                        </div>
                        <button
                            onClick={resetLiquidMetal}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                        >
                            Reset to Defaults
                        </button>
                    </div>

                    {/* SOURCE CONTROLS */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Source</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Shape Selector */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs opacity-60">shape</label>
                                <select
                                    value={liquidMetalConfig.shape}
                                    onChange={(e) => updateLiquidMetal('shape', e.target.value)}
                                    className="w-full h-9 rounded-lg px-2 text-sm bg-white/10 dark:bg-black/30 border border-white/10 cursor-pointer"
                                >
                                    <option value="none">none (full fill)</option>
                                    <option value="circle">circle</option>
                                    <option value="daisy">daisy</option>
                                    <option value="diamond">diamond</option>
                                    <option value="metaballs">metaballs</option>
                                </select>
                            </div>

                            {/* Color Tint */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs opacity-60">colorTint</label>
                                <input
                                    type="color"
                                    value={liquidMetalConfig.colorTint}
                                    onChange={(e) => updateLiquidMetal('colorTint', e.target.value)}
                                    className="w-full h-9 rounded-lg cursor-pointer"
                                />
                            </div>

                            {/* Image URL */}
                            <div className="flex flex-col gap-1 col-span-2">
                                <label className="text-xs opacity-60">image URL <span className="opacity-40">(overrides shape)</span></label>
                                <input
                                    type="text"
                                    value={liquidMetalConfig.image}
                                    onChange={(e) => updateLiquidMetal('image', e.target.value)}
                                    placeholder="https://... or leave empty"
                                    className="w-full h-9 rounded-lg px-3 text-sm bg-white/10 dark:bg-black/30 border border-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* PATTERN CONTROLS */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Pattern</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Repetition */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <label className="text-xs opacity-60">repetition</label>
                                    <span className="text-xs font-mono opacity-40">{liquidMetalConfig.repetition.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range" min="1" max="10" step="0.01"
                                    value={liquidMetalConfig.repetition}
                                    onChange={(e) => updateLiquidMetal('repetition', parseFloat(e.target.value))}
                                    className="w-full accent-brand"
                                />
                                <div className="flex justify-between text-[10px] opacity-30"><span>1</span><span>10</span></div>
                            </div>

                            {/* Softness */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <label className="text-xs opacity-60">softness</label>
                                    <span className="text-xs font-mono opacity-40">{liquidMetalConfig.softness.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.01"
                                    value={liquidMetalConfig.softness}
                                    onChange={(e) => updateLiquidMetal('softness', parseFloat(e.target.value))}
                                    className="w-full accent-brand"
                                />
                                <div className="flex justify-between text-[10px] opacity-30"><span>0</span><span>1</span></div>
                            </div>

                            {/* Distortion */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <label className="text-xs opacity-60">distortion</label>
                                    <span className="text-xs font-mono opacity-40">{liquidMetalConfig.distortion.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.01"
                                    value={liquidMetalConfig.distortion}
                                    onChange={(e) => updateLiquidMetal('distortion', parseFloat(e.target.value))}
                                    className="w-full accent-brand"
                                />
                                <div className="flex justify-between text-[10px] opacity-30"><span>0</span><span>1</span></div>
                            </div>

                            {/* Contour */}
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <label className="text-xs opacity-60">contour</label>
                                    <span className="text-xs font-mono opacity-40">{liquidMetalConfig.contour.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.01"
                                    value={liquidMetalConfig.contour}
                                    onChange={(e) => updateLiquidMetal('contour', parseFloat(e.target.value))}
                                    className="w-full accent-brand"
                                />
                                <div className="flex justify-between text-[10px] opacity-30"><span>0</span><span>1</span></div>
                            </div>
                        </div>
                    </div>

                    {/* COLOR SHIFT & MOTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        {/* Color Shift */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Color Shift</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Shift Red */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <label className="text-xs opacity-60">shiftRed</label>
                                        <span className="text-xs font-mono opacity-40">{liquidMetalConfig.shiftRed.toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range" min="-1" max="1" step="0.01"
                                        value={liquidMetalConfig.shiftRed}
                                        onChange={(e) => updateLiquidMetal('shiftRed', parseFloat(e.target.value))}
                                        className="w-full accent-red-500"
                                    />
                                    <div className="flex justify-between text-[10px] opacity-30"><span>-1</span><span>1</span></div>
                                </div>

                                {/* Shift Blue */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <label className="text-xs opacity-60">shiftBlue</label>
                                        <span className="text-xs font-mono opacity-40">{liquidMetalConfig.shiftBlue.toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range" min="-1" max="1" step="0.01"
                                        value={liquidMetalConfig.shiftBlue}
                                        onChange={(e) => updateLiquidMetal('shiftBlue', parseFloat(e.target.value))}
                                        className="w-full accent-blue-500"
                                    />
                                    <div className="flex justify-between text-[10px] opacity-30"><span>-1</span><span>1</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Motion / Transform */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Motion & Transform</h4>
                            <div className="grid grid-cols-3 gap-4">
                                {/* Angle */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <label className="text-xs opacity-60">angle</label>
                                        <span className="text-xs font-mono opacity-40">{liquidMetalConfig.angle.toFixed(0)}°</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="360" step="1"
                                        value={liquidMetalConfig.angle}
                                        onChange={(e) => updateLiquidMetal('angle', parseFloat(e.target.value))}
                                        className="w-full accent-brand"
                                    />
                                </div>

                                {/* Speed */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <label className="text-xs opacity-60">speed</label>
                                        <span className="text-xs font-mono opacity-40">{liquidMetalConfig.speed.toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="3" step="0.01"
                                        value={liquidMetalConfig.speed}
                                        onChange={(e) => updateLiquidMetal('speed', parseFloat(e.target.value))}
                                        className="w-full accent-brand"
                                    />
                                </div>

                                {/* Scale */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <label className="text-xs opacity-60">scale</label>
                                        <span className="text-xs font-mono opacity-40">{liquidMetalConfig.scale.toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range" min="0.1" max="4" step="0.01"
                                        value={liquidMetalConfig.scale}
                                        onChange={(e) => updateLiquidMetal('scale', parseFloat(e.target.value))}
                                        className="w-full accent-brand"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Config Display */}
                    <pre className="text-[10px] p-3 rounded-lg bg-black/30 border border-white/5 overflow-x-auto font-mono">
                        {`<LiquidMetal
  shape="${liquidMetalConfig.shape}"${liquidMetalConfig.image ? `\n  image="${liquidMetalConfig.image}"` : ''}
  colorTint="${liquidMetalConfig.colorTint}"
  repetition={${liquidMetalConfig.repetition.toFixed(2)}}
  softness={${liquidMetalConfig.softness.toFixed(2)}}
  shiftRed={${liquidMetalConfig.shiftRed.toFixed(2)}}
  shiftBlue={${liquidMetalConfig.shiftBlue.toFixed(2)}}
  distortion={${liquidMetalConfig.distortion.toFixed(2)}}
  contour={${liquidMetalConfig.contour.toFixed(2)}}
  angle={${liquidMetalConfig.angle.toFixed(0)}}
  speed={${liquidMetalConfig.speed.toFixed(2)}}
  scale={${liquidMetalConfig.scale.toFixed(2)}}
/>`}
                    </pre>
                </div>
            </section>
        </div >
    );
};
