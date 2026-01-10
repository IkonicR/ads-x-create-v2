import React from 'react';
import { motion } from 'framer-motion';


interface LandingNavProps {
    onGetStarted: () => void;
}

const LandingNav: React.FC<LandingNavProps> = ({ onGetStarted }) => {
    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                {/* Logo */}
                <div className="flex items-center">
                    <img
                        src="/xcreate-wordmark-logo-dark-mode.png"
                        alt="Ads x Create"
                        className="h-10 w-auto object-contain"
                    />
                </div>

                {/* Nav Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onGetStarted}
                        className="px-4 py-2 text-sm font-medium text-neu-text-sub-dark hover:text-white transition-colors"
                    >
                        Sign In
                    </button>
                    <motion.button
                        onClick={onGetStarted}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-bold shadow-lg shadow-brand/25 hover:shadow-brand/40 transition-shadow"
                    >
                        Get Started
                    </motion.button>
                </div>
            </div>
        </motion.nav>
    );
};

export default LandingNav;
