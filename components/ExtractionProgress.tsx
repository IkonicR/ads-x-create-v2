/**
 * ExtractionProgress Component
 * Shows a loading state with Galaxy animation during website extraction
 */

import React from 'react';
import { motion } from 'framer-motion';
import { NeuCard, useThemeStyles } from './NeuComponents';
import { GalaxyCanvas } from './GalaxyCanvas';
import { Globe, Sparkles, Palette, FileText, CheckCircle, XCircle } from 'lucide-react';
import { ExtractionProgress as ExtractionProgressType } from '../services/extractionService';

interface ExtractionProgressProps {
    progress: ExtractionProgressType;
    message: string;
    url: string;
}

const PROGRESS_STEPS: { key: ExtractionProgressType; label: string; icon: React.ReactNode }[] = [
    { key: 'validating', label: 'Validating URL', icon: <Globe size={20} /> },
    { key: 'crawling', label: 'Reading website', icon: <FileText size={20} /> },
    { key: 'analyzing', label: 'Extracting brand', icon: <Palette size={20} /> },
    { key: 'complete', label: 'Complete', icon: <CheckCircle size={20} /> },
];

export const ExtractionProgressComponent: React.FC<ExtractionProgressProps> = ({
    progress,
    message,
    url,
}) => {
    const { styles } = useThemeStyles();
    const currentStepIndex = PROGRESS_STEPS.findIndex(s => s.key === progress);
    const isError = progress === 'error';

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            {/* Galaxy Background */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-30">
                <GalaxyCanvas />
            </div>

            <NeuCard className="relative z-10 p-8 md:p-12 flex flex-col items-center text-center">
                {/* Animated Icon */}
                <motion.div
                    className={`w-24 h-24 rounded-full mb-8 flex items-center justify-center ${isError
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-brand'
                        }`}
                    animate={isError ? {} : {
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {isError ? (
                        <XCircle size={48} />
                    ) : progress === 'complete' ? (
                        <CheckCircle size={48} />
                    ) : (
                        <Sparkles size={48} className="animate-pulse" />
                    )}
                </motion.div>

                {/* Current Status */}
                <motion.h2
                    key={message}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-bold mb-2"
                >
                    {message}
                </motion.h2>

                <p className={`${styles.textSub} mb-8 max-w-md`}>
                    {isError
                        ? 'Something went wrong. You can try again or enter details manually.'
                        : `Analyzing ${(() => { try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname; } catch { return url; } })()}...`
                    }
                </p>

                {/* Progress Steps */}
                {!isError && (
                    <div className="flex items-center gap-2 md:gap-4">
                        {PROGRESS_STEPS.map((step, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const isPending = index > currentStepIndex;

                            return (
                                <React.Fragment key={step.key}>
                                    <motion.div
                                        className={`flex flex-col items-center gap-2 ${isCompleted ? 'text-green-500' :
                                            isCurrent ? 'text-brand' :
                                                'text-gray-400 opacity-50'
                                            }`}
                                        animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 1, repeat: isCurrent ? Infinity : 0 }}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500/20' :
                                            isCurrent ? 'bg-brand/20' :
                                                styles.bg
                                            }`}>
                                            {isCompleted ? <CheckCircle size={20} /> : step.icon}
                                        </div>
                                        <span className="text-xs font-medium hidden md:block">
                                            {step.label}
                                        </span>
                                    </motion.div>

                                    {index < PROGRESS_STEPS.length - 1 && (
                                        <div className={`w-8 md:w-12 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                            }`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}

                {/* Estimated Time */}
                {!isError && progress !== 'complete' && (
                    <p className={`${styles.textSub} text-xs mt-6 opacity-60`}>
                        This usually takes 10-30 seconds
                    </p>
                )}
            </NeuCard>
        </div>
    );
};

export default ExtractionProgressComponent;
