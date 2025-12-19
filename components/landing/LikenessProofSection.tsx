import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Camera, RefreshCw, Sparkles } from 'lucide-react';

const LikenessProofSection: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Motion Values for Physics
    const x = useMotionValue(0);
    const xSmooth = useSpring(x, { damping: 30, stiffness: 200, mass: 0.5 }); // Heavy-ish spring for "Oiled" feel

    // Convert x position to percentage for clip-path
    const progress = useTransform(xSmooth, [0, containerWidth], [0, 100]);
    const clipPath = useTransform(progress, (p) => `inset(0 ${100 - p}% 0 0)`);

    // Auto-center on mount
    useEffect(() => {
        if (containerRef.current) {
            const width = containerRef.current.offsetWidth;
            setContainerWidth(width);
            x.set(width / 2);
        }

        const handleResize = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setContainerWidth(width);
                // Keep relative position
                const currentP = x.get() / containerWidth;
                x.set(width * (isNaN(currentP) ? 0.5 : currentP));
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [containerWidth, x]);


    return (
        <section className="relative py-32 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 mb-6">
                            <RefreshCw className="w-4 h-4 text-brand animate-spin-slow" />
                            <span className="text-sm text-brand font-medium">PRESERVE LIKENESS v2.1</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Your Product. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neu-text-sub-dark">Uncontaminated.</span>
                        </h2>
                        <p className="text-lg text-neu-text-sub-dark leading-relaxed">
                            Most AI tools hallucinate details (wrong logo, morphed shape).
                            Our <span className="text-white font-medium">Likeness Engine</span> locks your product pixels in a protective layer while rendering the world around it.
                        </p>
                    </div>
                </div>

                {/* THE KINETIC SLIDER */}
                <div
                    ref={containerRef}
                    className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 select-none cursor-ew-resize group"
                    onPointerMove={(e) => {
                        if (!containerRef.current) return;
                        const rect = containerRef.current.getBoundingClientRect();
                        const newX = e.clientX - rect.left;
                        // Clamp
                        if (newX >= 0 && newX <= rect.width) {
                            x.set(newX);
                        }
                    }}
                    // Touch support for mobile dragging
                    onTouchMove={(e) => {
                        if (!containerRef.current) return;
                        const rect = containerRef.current.getBoundingClientRect();
                        const newX = e.touches[0].clientX - rect.left;
                        if (newX >= 0 && newX <= rect.width) x.set(newX);
                    }}
                >
                    {/* 1. BOTTOM LAYER (BEFORE / RAW) */}
                    <div className="absolute inset-0 bg-neu-dark flex items-center justify-center">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-50 grayscale" />
                        <div className="relative z-10 p-6 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <Camera className="w-5 h-5 text-neu-text-sub-dark" />
                                <span className="text-white font-mono text-sm">RAW_INPUT.CR2</span>
                            </div>
                            <div className="text-xs text-neu-text-sub-dark">
                                Studio lighting, white background.
                            </div>
                        </div>
                    </div>

                    {/* 2. TOP LAYER (AFTER / STYLED) - CLIPPED */}
                    <motion.div
                        className="absolute inset-0 bg-brand/5 overflow-hidden"
                        style={{ clipPath }}
                    >
                        {/* Image */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center filter contrast-125 saturate-150">
                            {/* Overlay Style: Neon City (Example) */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 to-cyan-900/40 mix-blend-overlay" />
                            {/* Simulated Reflections */}
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-30" />
                        </div>

                        <div className="absolute bottom-8 left-8 z-10 p-6 bg-brand/90 backdrop-blur-md rounded-xl border border-white/20 shadow-xl shadow-brand/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="w-5 h-5 text-white" />
                                <span className="text-white font-mono text-sm font-bold">PRESET: CYBERPUNK</span>
                            </div>
                            <div className="text-xs text-white/80">
                                Context injected. Likeness 100%.
                            </div>
                        </div>
                    </motion.div>

                    {/* 3. THE SCANNER BEAM (Divider) */}
                    <motion.div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_2px_rgba(255,255,255,0.5)] z-20 pointer-events-none"
                        style={{ x: xSmooth }}
                    >
                        {/* The Handle/Lens */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-white bg-white/10 backdrop-blur-sm shadow-xl flex items-center justify-center">
                            <div className="w-1.5 h-6 bg-white rounded-full" />
                        </div>
                    </motion.div>
                </div>

                {/* Interaction Hint */}
                <div className="text-center mt-6 text-sm text-neu-text-sub-dark/50 animate-pulse font-mono">
                    {'< DRAG TO COMPARE >'}
                </div>
            </div>
        </section>
    );
};

export default LikenessProofSection;
