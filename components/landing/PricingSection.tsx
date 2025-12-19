import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import { NeuCard, NeuButton } from '../NeuComponents';

interface PricingSectionProps {
    onGetStarted: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onGetStarted }) => {
    const tiers = [
        {
            name: 'Explorer',
            tagline: 'Initiate.',
            price: '$0',
            period: 'forever',
            icon: Zap,
            features: [
                '10 credits/mo',
                '1 Business Identity',
                'Standard Presets',
                'Community Coms',
            ],
            cta: 'Begin Mission',
            highlighted: false,
        },
        {
            name: 'Commander',
            tagline: 'Control.',
            price: '$29',
            period: '/mo',
            icon: Shield,
            features: [
                '150 credits/mo',
                'Unlimited Identities',
                'God-Tier Presets',
                'Social Autopilot',
                'Priority Coms',
                'CMYK Print Export',
            ],
            cta: 'Take Command',
            highlighted: true,
        },
        {
            name: 'Galactic',
            tagline: 'Dominate.',
            price: '$99',
            period: '/mo',
            icon: Globe,
            features: [
                '600 credits/mo',
                'Team Access (5)',
                'API Keys',
                'White-Labeling',
                'Dedicated Officer',
                'Custom Presets',
            ],
            cta: 'Contact HQ',
            highlighted: false,
        },
    ];

    return (
        <section className="relative py-32 px-6 overflow-hidden perspective-2000">
            {/* Background Grid - Floor Perspective */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-200px)_scale(2)] opacity-10 pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Hire a Creative Team <br /> for <span className="text-brand">$0.</span>
                    </h2>
                    <p className="text-xl text-neu-text-sub-dark max-w-2xl mx-auto">
                        Operational costs are minimal. Scale your credits as you conquer more territory.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 items-end">
                    {tiers.map((tier, index) => (
                        <NeuCard
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.08, duration: 0.5, type: 'spring', stiffness: 100 }}
                            className={`relative group !p-0 !rounded-2xl overflow-hidden transition-all duration-300 ${tier.highlighted
                                ? 'border-brand/40 shadow-[0_0_40px_-10px_rgba(109,93,252,0.25)] md:-translate-y-6 z-20'
                                : 'z-10'
                                }`}
                            forceTheme="dark"
                        >
                            {/* Holographic Scanline (Commander Only) */}
                            {tier.highlighted && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50 blur-sm"
                                    />
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-20 bg-gradient-to-b from-brand/0 via-brand/10 to-brand/0"
                                    />
                                </div>
                            )}

                            {/* Header */}
                            <div className="p-8 border-b border-white/5 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${tier.highlighted ? 'bg-brand text-white' : 'bg-white/5 text-neu-text-sub-dark'}`}>
                                        <tier.icon className="w-6 h-6" />
                                    </div>
                                    {tier.highlighted && (
                                        <div className="px-3 py-1 rounded-full bg-brand/20 text-brand text-xs font-bold border border-brand/20 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> POPULAR
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">{tier.name}</h3>
                                <p className="text-sm text-neu-text-sub-dark font-mono uppercase tracking-wider">{tier.tagline}</p>
                            </div>

                            {/* Price */}
                            <div className="p-8 pb-0">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-bold text-white tracking-tight">{tier.price}</span>
                                    <span className="text-neu-text-sub-dark">{tier.period}</span>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="p-8 space-y-4">
                                {tier.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3 group/item">
                                        <Check className={`w-5 h-5 flex-shrink-0 ${tier.highlighted ? 'text-brand' : 'text-neu-text-sub-dark group-hover/item:text-white transition-colors'}`} />
                                        <span className={`text-sm ${tier.highlighted ? 'text-white' : 'text-neu-text-sub-dark'}`}>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className="p-8 pt-0">
                                <NeuButton
                                    onClick={onGetStarted}
                                    variant={tier.highlighted ? 'primary' : 'default'}
                                    className={`w-full !rounded-xl !py-4 font-bold flex items-center justify-center gap-2 ${!tier.highlighted && 'bg-white/10 hover:bg-white/20 border border-white/5 text-white'}`}
                                    forceTheme="dark"
                                >
                                    {tier.cta} <ArrowRight className="w-4 h-4" />
                                </NeuButton>
                                <p className="text-center text-xs text-neu-text-sub-dark/40 mt-4 font-mono">
                                    NO CREDIT CARD REQ.
                                </p>
                            </div>
                        </NeuCard>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
