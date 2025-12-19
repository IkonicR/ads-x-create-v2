import React from 'react';
import { motion } from 'framer-motion';
import { FileImage, Type, Palette, Zap, Sparkles, Box, Layout, Smartphone } from 'lucide-react';
import { NeuCard } from '../NeuComponents';

const PrismSection: React.FC = () => {
    return (
        <section className="relative py-24 md:py-40 px-6 overflow-hidden">


            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 mb-6 backdrop-blur-md">
                        <Zap className="w-4 h-4 text-brand" />
                        <span className="text-sm text-brand font-medium tracking-wide">THE CORE ENGINE</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        One Upload. <span className="text-brand">Infinite Context.</span>
                    </h2>
                    <p className="text-xl text-neu-text-sub-dark max-w-2xl mx-auto">
                        You teach the Brain once. It acts as your always-on Art Director, ensuring every pixel is on-brand, forever.
                    </p>
                </motion.div>

                {/* THE KINETIC PRISM */}
                <div className="relative grid md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-16 items-center">

                    {/* LEFT COLUMN: RAW INPUTS */}
                    <div className="flex flex-col gap-6 items-end relative z-10">
                        <div className="text-xs font-bold text-neu-text-sub-dark uppercase tracking-widest mb-2 mr-4">
                            Raw Ingestion
                        </div>

                        {[
                            { icon: FileImage, label: "Logo.svg", color: "text-blue-400" },
                            { icon: Palette, label: "Brand_Colors.json", color: "text-purple-400" },
                            { icon: Type, label: "Voice_Guidelines.pdf", color: "text-yellow-400" },
                        ].map((item, i) => (
                            <NeuCard
                                key={item.label}
                                initial={{ x: -30, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                className="group relative flex items-center gap-4 w-64 md:w-72 cursor-alias !p-4 !rounded-xl"
                                forceTheme="dark"
                            >
                                <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="font-mono text-sm text-neu-text-sub-dark group-hover:text-white transition-colors">
                                    {item.label}
                                </span>
                                {/* Connection Dot */}
                                <div className="absolute top-1/2 -right-1.5 w-3 h-3 rounded-full bg-neu-dark border border-white/20 group-hover:border-brand group-hover:bg-brand transition-colors z-20" />
                            </NeuCard>
                        ))}
                    </div>

                    {/* CENTER COLUMN: THE BRAIN NODE */}
                    <div className="relative flex items-center justify-center py-12 md:py-0">
                        {/* Connecting Lines (SVG Animation) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50 visible md:visible invisible" style={{ overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6D5DFC" stopOpacity="0" />
                                    <stop offset="50%" stopColor="#6D5DFC" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#6D5DFC" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Input Lines */}
                            <motion.path
                                d="M -100 50 C -50 50, -50 150, 0 150"
                                fill="none"
                                stroke="url(#flowGradient)"
                                strokeWidth="2"
                                animate={{ strokeDasharray: ["0, 200", "200, 0", "0, 200"], strokeDashoffset: [0, -400] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />
                            {/* Output Lines */}
                            <motion.path
                                d="M 200 150 C 250 150, 250 50, 300 50"
                                fill="none"
                                stroke="url(#flowGradient)"
                                strokeWidth="2"
                                animate={{ strokeDasharray: ["0, 200", "200, 0", "0, 200"], strokeDashoffset: [0, -400] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }}
                            />
                        </svg>

                        {/* The Brain Core */}
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative w-40 h-40 md:w-56 md:h-56 z-20"
                        >
                            <div className="absolute inset-0 rounded-full bg-brand/20 blur-3xl animate-pulse" />
                            <div className="absolute inset-0 rounded-full border border-brand/30 animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-4 rounded-full border border-brand/50 border-dashed animate-[spin_15s_linear_infinite_reverse]" />

                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neu-dark rounded-full border border-white/10 shadow-2xl shadow-brand/20">
                                <Sparkles className="w-12 h-12 text-brand mb-2 animate-pulse" />
                                <div className="text-xs font-bold text-white tracking-widest uppercase">
                                    ConfigWeaver
                                </div>
                                <div className="text-[10px] text-brand/80 font-mono mt-1">
                                    PROCESSING...
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: POLISHED OUTPUTS */}
                    <div className="flex flex-col gap-6 items-start relative z-10">
                        <div className="text-xs font-bold text-neu-text-sub-dark uppercase tracking-widest mb-2 ml-4 self-end md:self-start">
                            Deployed Assets
                        </div>

                        {[
                            { icon: Smartphone, label: "IG_Story_V4.jpg", type: "Social" },
                            { icon: Layout, label: "Landing_Hero_BG.png", type: "Web" },
                            { icon: Box, label: "Package_Design_Mock.pdf", type: "Print" },
                        ].map((item, i) => (
                            <NeuCard
                                key={item.label}
                                initial={{ x: 50, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                                className={`group relative flex items-center gap-4 w-64 md:w-72 backdrop-blur-sm cursor-pointer !p-4 !rounded-xl border-t border-white/5 hover:border-brand/50 transition-colors`}
                                forceTheme="dark"
                            >
                                <div className="absolute top-1/2 -left-1.5 w-3 h-3 rounded-full bg-neu-dark border border-brand bg-brand shadow-[0_0_10px_rgba(109,93,252,0.5)] z-20" />

                                <div className="p-2 rounded-lg bg-brand/20 text-brand">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-white text-sm group-hover:text-brand transition-colors">
                                        {item.label}
                                    </div>
                                    <div className="text-[10px] text-neu-text-sub-dark uppercase tracking-wider">
                                        {item.type} • 100% On-Brand
                                    </div>
                                </div>
                            </NeuCard>
                        ))}
                    </div>
                </div>

                {/* Bottom Stats */}
                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-12">
                    {[
                        { label: "Design Time", val: "< 60s" },
                        { label: "Brand Match", val: "100%" },
                        { label: "Revisions", val: "0" },
                        { label: "Cost", val: "$0.02" },
                    ].map(stat => (
                        <div key={stat.label} className="text-center">
                            <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.val}</div>
                            <div className="text-xs text-neu-text-sub-dark uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PrismSection;
