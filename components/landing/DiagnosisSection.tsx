import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, RefreshCw, Lock } from 'lucide-react';
import { NeuCard, NeuInput, NeuButton, NeuBadge } from '../NeuComponents';

const DiagnosisSection: React.FC = () => {
    return (
        <section className="relative py-32 px-6 overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                        When your tools<br />
                        <span className="text-brand relative inline-block">
                            fight your brand.
                        </span>
                    </h2>
                    <p className="text-xl text-neu-text-sub-dark max-w-2xl mx-auto leading-relaxed">
                        Generic AI ignores your guidelines. It drifts. It hallucinations. It fails.
                    </p>
                </motion.div>

                {/* THE SYSTEM DRIFT GRID */}
                <div className="grid md:grid-cols-3 gap-8">

                    {/* CARD 1: THE GHOST INPUT (Voice Drift) */}
                    <VoiceDriftCard />

                    {/* CARD 2: THE REBELLIOUS TOGGLE (Control Loss) */}
                    <ControlLossCard />

                    {/* CARD 3: THE CORRUPTED ASSET (Brand Integrity) */}
                    <AssetCorruptionCard />

                </div>
            </div>
        </section>
    );
};

// --- SUB-COMPONENTS FOR ISOLATED LOGIC ---

const VoiceDriftCard = () => {
    // Animation State
    const [fontState, setFontState] = useState(0);
    const fonts = ['font-sans', 'font-serif', 'font-mono', 'font-sans'];

    useEffect(() => {
        const interval = setInterval(() => {
            setFontState(prev => (prev + 1) % fonts.length);
        }, 1200); // Switch font every 1.2s
        return () => clearInterval(interval);
    }, []);

    return (
        <NeuCard className="h-[420px] flex flex-col justify-between overflow-hidden relative group" forceTheme="dark">
            <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neu-text-sub-dark uppercase tracking-wider">Voice Engine</span>
                    <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <NeuBadge className="bg-red-500/10 text-red-500 border border-red-500/20">
                            DRIFTING
                        </NeuBadge>
                    </motion.div>
                </div>

                <div className="relative">
                    <label className="text-xs text-neu-text-sub-dark mb-2 block">Generated Slogan</label>
                    <motion.div
                        animate={{ x: [-1, 1, -1, 0] }}
                        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
                    >
                        <NeuInput
                            value="Unlock the tapestry of synergy..."
                            readOnly
                            className={`text-lg ${fonts[fontState]} transition-all duration-300 border-red-500/30 text-red-100 bg-red-500/5`}
                            forceTheme="dark"
                        />
                    </motion.div>

                    {/* Ghost Overlay */}
                    <motion.div
                        className="absolute top-8 left-0 w-full h-full pointer-events-none text-lg px-4 py-3 text-red-500/20 blur-sm"
                        animate={{ x: [2, -2], opacity: [0, 0.5, 0] }}
                        transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 3 }}
                    >
                        Unlock the tapestry...
                    </motion.div>
                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center text-neu-text-sub-dark text-sm font-light opacity-50">
                Error: Voice Model Unstable
            </div>
        </NeuCard>
    );
};

const ControlLossCard = () => {
    const [tone, setTone] = useState<'Professional' | 'Generic'>('Professional');
    const [isFighting, setIsFighting] = useState(false);

    const handleToggle = () => {
        // User clicks "Professional"
        setTone('Professional');
        setIsFighting(false);

        // System fights back after 600ms
        setTimeout(() => {
            setIsFighting(true);
            setTone('Generic');
        }, 800);
    };

    return (
        <NeuCard className="h-[420px] flex flex-col relative overflow-hidden" forceTheme="dark">
            <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-bold text-neu-text-sub-dark uppercase tracking-wider">Brand Settings</span>
                <Lock className="w-4 h-4 text-neu-text-sub-dark" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="text-center space-y-2">
                    <div className="text-sm text-neu-text-sub-dark">Selected Tone</div>
                    <motion.div
                        className="text-2xl font-black text-white"
                        animate={{ scale: isFighting ? [1, 1.1, 1] : 1, color: tone === 'Generic' ? '#EF4444' : '#FFFFFF' }}
                    >
                        {tone}
                    </motion.div>
                </div>

                <div className="relative">
                    {/* The Toggle Buttons */}
                    <div className="flex gap-2">
                        <NeuButton
                            active={tone === 'Generic'}
                            onClick={() => setTone('Generic')}
                            className={tone === 'Generic' ? "bg-red-500/20 text-red-500 ring-1 ring-red-500" : ""}
                            forceTheme="dark"
                        >
                            Generic
                        </NeuButton>
                        <NeuButton
                            active={tone === 'Professional'}
                            onClick={handleToggle}
                            className="relative overflow-hidden"
                            forceTheme="dark"
                        >
                            Professional
                            {isFighting && (
                                <motion.div
                                    className="absolute inset-0 bg-red-500/20"
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                />
                            )}
                        </NeuButton>
                    </div>

                    {/* Override Badge */}
                    <AnimatePresence>
                        {isFighting && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -bottom-12 left-0 right-0 flex justify-center"
                            >
                                <div className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-bold uppercase tracking-wide shadow-lg">
                                    System Override
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center text-neu-text-sub-dark text-sm font-light opacity-50">
                Warning: User Preference Ignored
            </div>
        </NeuCard>
    );
};

const AssetCorruptionCard = () => {
    const [isCorrupted, setIsCorrupted] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsCorrupted(prev => !prev);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <NeuCard className="h-[420px] relative overflow-hidden flex flex-col" forceTheme="dark">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-neu-text-sub-dark uppercase tracking-wider">Asset Preview</span>
                {isCorrupted ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
            </div>

            {/* The Image Area */}
            <div className="flex-1 bg-black/20 rounded-xl mb-6 relative overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 mx-auto mb-4" />
                        <div className="w-24 h-3 bg-white/10 rounded-full mx-auto" />
                    </div>
                </div>

                {/* Corruption Overlay */}
                <motion.div
                    animate={{
                        opacity: isCorrupted ? [0, 0.8, 0.4] : 0,
                        backgroundColor: isCorrupted ? '#FFFF00' : 'transparent',
                        mixBlendMode: 'color-dodge'
                    }}
                    transition={{ duration: 0.2, repeat: isCorrupted ? Infinity : 0, repeatDelay: 0.1 }}
                    className="absolute inset-0 pointer-events-none"
                />
            </div>

            {/* The Failing Button */}
            <div className="relative">
                <NeuButton
                    className={`w-full transition-colors duration-300 ${isCorrupted ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-brand text-white'}`}
                    forceTheme="dark"
                >
                    {isCorrupted ? 'License Invalid' : 'Download Asset'}
                </NeuButton>

                {isCorrupted && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute -top-12 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-lg"
                    >
                        HEX #FFFF00 Mismatch
                    </motion.div>
                )}
            </div>
        </NeuCard>
    );
};

export default DiagnosisSection;
