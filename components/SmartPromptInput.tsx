import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { useThemeStyles } from './NeuComponents';

interface SmartPromptInputProps {
    prompt: string;
    setPrompt: (value: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    activeCount: number;
    modelTier: 'flash' | 'pro' | 'ultra';
    disabled?: boolean;
}

export const SmartPromptInput: React.FC<SmartPromptInputProps> = ({
    prompt,
    setPrompt,
    onSubmit,
    placeholder,
    activeCount,
    modelTier,
    disabled
}) => {
    const { styles: themeStyles, theme } = useThemeStyles();
    const isDark = theme === 'dark';
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Auto-resize logic
    useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset to recalculate
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [prompt]);

    // Submit handler (Cmd+Enter)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    const insetShadowClass = isDark ? 'shadow-neu-in-dark' : 'shadow-neu-in-light';

    return (
        <motion.div
            layout
            className={`relative flex items-end gap-2 transition-all duration-200`}
        >
            <div className={`flex-1 relative rounded-2xl ${insetShadowClass} overflow-hidden min-h-[60px] flex items-center`}>
                <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className={`w-full pl-5 pr-4 py-4 bg-transparent outline-none text-base font-medium resize-none ${themeStyles.textMain} placeholder-gray-400 custom-scrollbar`}
                    style={{ maxHeight: '150px' }}
                />
            </div>

            <div className="relative pb-1">
                {/* Techy Glowing Border (Only when active) */}
                <AnimatePresence>
                    {activeCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute -inset-[3px] rounded-2xl overflow-hidden z-0"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,#3b82f6_180deg,transparent_360deg)] opacity-80 blur-sm"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={onSubmit}
                    disabled={disabled}
                    className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all text-white overflow-hidden ${disabled
                        ? 'bg-gray-400 cursor-not-allowed opacity-50'
                        : modelTier === 'ultra'
                            ? 'bg-gradient-to-tr from-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95'
                            : 'bg-[#1a1a1a] border border-white/10 shadow-lg active:scale-95'
                        }`}
                >
                    <AnimatePresence mode="wait">
                        {activeCount > 0 ? (
                            <motion.div
                                key="count"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="flex flex-col items-center justify-center relative"
                            >
                                {/* HUD Ring */}
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[-8px] border border-blue-400/30 rounded-full border-t-transparent border-l-transparent"
                                />
                                <span className="text-[9px] font-bold leading-none text-blue-400 mb-0.5">GEN</span>
                                <span className="text-sm font-bold leading-none text-white">{activeCount}</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="icon"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                            >
                                <Send size={24} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    );
};
