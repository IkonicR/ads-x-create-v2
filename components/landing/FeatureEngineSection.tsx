import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { NeuCard } from '../NeuComponents';

const FeatureEngineSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState('flash_sale');

    const tabs = [
        { id: 'flash_sale', label: 'Flash Sale', icon: Zap },
        { id: 'awareness', label: 'Brand Awareness', icon: TrendingUp },
        { id: 'cinematic', label: 'Cinematic Noir', icon: Layers },
        { id: 'minimal', label: 'Minimalist', icon: Sparkles },
    ];

    // Placeholder generated images - to be replaced with real AI-generated examples
    const placeholderImages = {
        flash_sale: [
            { id: 1, label: '50% OFF Campaign' },
            { id: 2, label: 'Limited Time Offer' },
            { id: 3, label: 'Black Friday Special' },
        ],
        awareness: [
            { id: 1, label: 'Brand Story' },
            { id: 2, label: 'Values Campaign' },
            { id: 3, label: 'Meet the Team' },
        ],
        cinematic: [
            { id: 1, label: 'Noir Product Shot' },
            { id: 2, label: 'Dramatic Lighting' },
            { id: 3, label: 'Film Grain Aesthetic' },
        ],
        minimal: [
            { id: 1, label: 'Clean Lines' },
            { id: 2, label: 'White Space Hero' },
            { id: 3, label: 'Typography Focus' },
        ],
    };

    const currentImages = placeholderImages[activeTab as keyof typeof placeholderImages];

    return (
        <section className="relative py-24 md:py-32 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        One Click. Any Campaign.
                    </h2>
                    <p className="text-lg text-neu-text-sub-dark max-w-2xl mx-auto">
                        Pre-built strategy modes automatically adjust the AI's intent, CTAs, and visual framing.
                    </p>
                </motion.div>

                {/* Tab Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex flex-wrap justify-center gap-3 mb-12"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all ${activeTab === tab.id
                                ? 'bg-brand text-white shadow-lg shadow-brand/30'
                                : 'bg-white/5 text-neu-text-sub-dark hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* Image Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        {currentImages.map((image, index) => (
                            <NeuCard
                                key={image.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                className="group relative aspect-square !p-0 !rounded-2xl overflow-hidden cursor-pointer"
                                forceTheme="dark"
                            >
                                {/* Placeholder - replace with actual generated images */}
                                <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-brand/10 flex items-center justify-center">
                                    <div className="text-center p-4">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/10 flex items-center justify-center">
                                            <span className="text-2xl">🎨</span>
                                        </div>
                                        <p className="text-white font-medium">{image.label}</p>
                                        <p className="text-xs text-neu-text-sub-dark/50 mt-1">
                                            (AI-generated image placeholder)
                                        </p>
                                    </div>
                                </div>

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/10 transition-colors pointer-events-none" />
                            </NeuCard>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Bottom Feature Highlight */}
                <NeuCard
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-16 !p-6 md:!p-8 !rounded-2xl border-t border-white/10"
                    forceTheme="dark"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-6 h-6 text-brand" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">
                                God-Tier Prompting (Invisible)
                            </h3>
                            <p className="text-neu-text-sub-dark text-sm">
                                Powered by <span className="text-brand font-mono">ConfigWeaver™</span>.
                                We built the prompt engineering architecture so you don't have to.
                                Lighting, camera angles, and shot composition are handled by the machine.
                            </p>
                        </div>
                    </div>
                </NeuCard>
            </div>
        </section>
    );
};

export default FeatureEngineSection;
