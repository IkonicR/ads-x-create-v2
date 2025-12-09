import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStyles } from './NeuComponents';
import { GalaxyHeading } from './GalaxyHeading';

/**
 * GlobalLoader - Premium loading screen using proper Neumorphic design system.
 * Matches "Celestial Neumorphism" exactly via NeuComponents tokens.
 */
const GlobalLoader: React.FC = () => {
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center gap-12 ${styles.bg} transition-colors duration-300`}>

            {/* Orbiting Orbs Container */}
            <div className="relative w-48 h-48">
                {/* Center Orb - Static, raised neumorphic */}
                <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full ${styles.bg} ${styles.shadowOut}`}
                >
                    {/* Inner accent glow */}
                    <motion.div
                        className="absolute inset-2 rounded-full bg-gradient-to-br from-brand/40 to-purple-500/30"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                {/* Orbiting Orbs - Using proper neumorphic shadows */}
                {[0, 1, 2].map((index) => (
                    <div
                        key={index}
                        className="absolute top-1/2 left-1/2 w-8 h-8"
                        style={{
                            animation: `orbit 4s linear infinite`,
                            animationDelay: `${index * -1.33}s`,
                            transformOrigin: '0 0',
                        }}
                    >
                        <div
                            className={`w-8 h-8 rounded-full ${styles.bg} ${styles.shadowIn}`}
                            style={{
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Branding */}
            <div className="flex flex-col items-center gap-4">
                <GalaxyHeading text="ADS X CREATE" className="text-3xl md:text-5xl tracking-tight" />

                {/* Loading bar - proper container */}
                <div className="flex flex-col items-center gap-3">
                    <div className={`w-24 h-1 rounded-full overflow-hidden ${styles.bg} ${styles.shadowIn}`}>
                        <motion.div
                            className="h-full w-full bg-gradient-to-r from-blue-500 via-brand to-purple-500"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                    <motion.div
                        className={`text-xs font-bold tracking-[0.3em] uppercase ${styles.textSub}`}
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        Loading Studio
                    </motion.div>
                </div>
            </div>

            {/* Version tag */}
            <div className={`absolute bottom-8 text-xs font-mono ${styles.textSub} opacity-50`}>
                v2.0.0 • Celestial Neumorphism
            </div>

            {/* Keyframe animation for orbit */}
            <style>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(72px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(72px) rotate(-360deg);
          }
        }
      `}</style>
        </div>
    );
};

export default GlobalLoader;
