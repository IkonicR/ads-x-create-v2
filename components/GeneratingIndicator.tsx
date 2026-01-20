import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useThemeStyles } from './NeuComponents';

interface GeneratingIndicatorProps {
    total: number;
    aspectRatio?: string;
    styleName?: string;
}

/**
 * Animated indicator for image generation in chat.
 * Cycles through "Creating Image X of Y" with Framer Motion transitions.
 */
export const GeneratingIndicator: React.FC<GeneratingIndicatorProps> = ({
    total,
    aspectRatio,
    styleName
}) => {
    const { styles } = useThemeStyles();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Timer-based cycling through images (every 2.5 seconds)
    useEffect(() => {
        if (total <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % total);
        }, 2500);

        return () => clearInterval(interval);
    }, [total]);

    const displayNumber = currentIndex + 1;

    return (
        <div className={`rounded-2xl overflow-hidden p-4 ${styles.bg} ${styles.shadowIn} max-w-sm`}>
            {/* Main row: Spinner + Text */}
            <div className="flex items-center gap-3">
                <Loader2
                    size={20}
                    className="text-brand animate-spin"
                />

                <div className="flex flex-col">
                    {/* Cycling text with animation */}
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={currentIndex}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className={`text-sm font-medium ${styles.textMain}`}
                        >
                            {total > 1
                                ? `Creating Image ${displayNumber} of ${total}`
                                : 'Creating your image'
                            }
                        </motion.span>
                    </AnimatePresence>

                    {/* Metadata row: Aspect Ratio • Style */}
                    {(aspectRatio || styleName) && (
                        <span className={`text-xs ${styles.textSub} mt-0.5`}>
                            {[aspectRatio, styleName].filter(Boolean).join(' • ')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneratingIndicator;
