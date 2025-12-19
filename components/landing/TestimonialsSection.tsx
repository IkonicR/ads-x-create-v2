import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, Users } from 'lucide-react';
import { NeuCard } from '../NeuComponents';

const TestimonialsSection: React.FC = () => {
    const readouts = [
        {
            icon: Zap,
            label: 'Efficiency Status',
            value: '94%',
            description: 'Time to Launch reduced',
        },
        {
            icon: Shield,
            label: 'Brand Integrity',
            value: '100%',
            description: 'Color and voice match',
        },
        {
            icon: Activity,
            label: 'Output Quality',
            value: '8K',
            description: 'Max resolution supported',
        },
    ];

    return (
        <section className="relative py-24 md:py-32 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        System Status: Operational
                    </h2>
                    <p className="text-lg text-neu-text-sub-dark max-w-2xl mx-auto">
                        Real metrics from businesses running on the Brand Brain.
                    </p>
                </motion.div>

                {/* Readout Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {readouts.map((readout, index) => (
                        <NeuCard
                            key={readout.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            className="relative overflow-hidden !p-6 !rounded-2xl"
                            forceTheme="dark"
                        >
                            {/* Glow effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
                                        <readout.icon className="w-5 h-5 text-brand" />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-neu-text-sub-dark font-mono">
                                        {readout.label}
                                    </span>
                                </div>
                                <div className="text-5xl font-bold text-white mb-2">
                                    {readout.value}
                                </div>
                                <p className="text-sm text-neu-text-sub-dark">
                                    {readout.description}
                                </p>
                            </div>
                        </NeuCard>
                    ))}
                </div>

                {/* Authority Anchor */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                        <Users className="w-5 h-5 text-brand" />
                        <span className="text-sm text-neu-text-sub-dark">
                            Trusted by <span className="text-white font-bold">500+</span> businesses and agencies
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
