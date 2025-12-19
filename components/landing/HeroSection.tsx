import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { useMousePosition } from '../../hooks/useMousePosition';
import { NeuButton } from '../NeuComponents';

interface HeroSectionProps {
    onGetStarted: () => void;
    setWarp: (value: number) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, setWarp }) => {
    // Mouse Parallax Logic
    const mousePos = useMousePosition();

    // Smooth out the raw mouse values
    const smoothX = useSpring(0, { damping: 15, stiffness: 100 });
    const smoothY = useSpring(0, { damping: 15, stiffness: 100 });

    // Update springs when mouse moves
    React.useEffect(() => {
        smoothX.set(mousePos.x);
        smoothY.set(mousePos.y);
    }, [mousePos, smoothX, smoothY]);

    // 3D Transform values based on mouse position
    const rotateX = useTransform(smoothY, [-1, 1], [5, -5]); // Inverted for natural feel
    const rotateY = useTransform(smoothX, [-1, 1], [-5, 5]);

    // Parallax layers
    const layer1X = useTransform(smoothX, [-1, 1], [-20, 20]);
    const layer1Y = useTransform(smoothY, [-1, 1], [-20, 20]);

    const layer2X = useTransform(smoothX, [-1, 1], [-40, 40]);
    const layer2Y = useTransform(smoothY, [-1, 1], [-40, 40]);

    return (
        <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden perspective-2000">
            {/* Ambient Fog */}
            {/* Ambient Fog REMOVED */}{/* No overlay */}

            <div className="max-w-5xl mx-auto text-center relative z-10">
                {/* Magnetic Badge */}
                <motion.div
                    style={{ x: layer1X, y: layer1Y }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8 cursor-default hover:bg-white/10 transition-colors"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                    </span>
                    <span className="text-sm text-neu-text-sub-dark tracking-wide font-medium">
                        THE BUSINESS OPERATING SYSTEM
                    </span>
                </motion.div>

                {/* Main Headline with Parallax */}
                <motion.div style={{ x: layer1X, y: layer1Y }}>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.7 }}
                        className="text-5xl md:text-8xl font-black tracking-tight mb-6 leading-tight"
                    >
                        <span className="text-white drop-shadow-xl">Stop Re-Explaining</span>
                        <br />
                        <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                            Your Business to AI.
                        </span>
                    </motion.h1>
                </motion.div>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-lg md:text-2xl text-neu-text-sub-dark max-w-2xl mx-auto mb-12 leading-relaxed font-light"
                >
                    The first creative suite with a persistent{' '}
                    <span className="text-brand font-bold glow-text">Brand Memory</span>.
                </motion.p>

                {/* Kinetic CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    {/* Primary CTA - TACTILE SWITCH */}
                    <motion.button
                        onClick={onGetStarted}
                        onHoverStart={() => setWarp(1)}
                        onHoverEnd={() => setWarp(0)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.95, y: 2 }}
                        className="group relative flex items-center gap-4 px-10 py-5 rounded-full bg-brand font-black text-white text-xl shadow-[0_10px_0_#4c1d95,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0_0_#4c1d95,0_0_0_rgba(0,0,0,0)] active:translate-y-[10px] transition-all"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            INITIALIZE BRAND KIT <ArrowRight className="w-6 h-6" />
                        </span>
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        </div>
                    </motion.button>

                    {/* Secondary CTA - Glass */}
                    <NeuButton
                        className="!rounded-2xl !px-8 !py-4 !bg-white/5 !border-white/10 text-white font-medium hover:!bg-white/10 shadow-lg"
                        forceTheme="dark"
                    >
                        <Play className="w-5 h-5 fill-white" />
                        Watch Demo
                    </NeuButton>
                </motion.div>

                {/* 3D Mockup Container */}
                <motion.div
                    style={{
                        rotateX,
                        rotateY,
                        perspective: 1000
                    }}
                    initial={{ opacity: 0, y: 100, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ delay: 0.8, duration: 1.2, type: "spring", bounce: 0.2 }}
                    className="mt-20 md:mt-32 relative z-20"
                >
                    <div className="relative mx-auto max-w-5xl">
                        {/* Glow Behind */}
                        <div className="absolute -inset-10 bg-brand/20 blur-[100px] rounded-full opacity-50 animate-pulse" />

                        {/* The Card Itself */}
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0F1115]/80 backdrop-blur-xl shadow-2xl shadow-black ring-1 ring-white/5">
                            {/* Window Controls */}
                            <div className="h-8 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>

                            {/* Content Placeholder */}
                            <div className="aspect-[16/10] bg-gradient-to-br from-[#0F1115] to-[#1a1d24] relative overflow-hidden group">
                                {/* Grid Line Overlay */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center transform transition-transform duration-700 group-hover:scale-105">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-brand/10 border border-brand/20 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(109,93,252,0.3)]">
                                            <Sparkles className="w-10 h-10 text-brand" />
                                        </div>
                                        <p className="text-neu-text-sub-dark font-mono text-sm tracking-wider uppercase">
                                            System Ready
                                        </p>
                                        <div className="mt-4 flex items-center justify-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-white font-medium">Waiting for Input...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
