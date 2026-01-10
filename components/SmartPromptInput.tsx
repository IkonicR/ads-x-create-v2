import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { useThemeStyles } from './NeuComponents';
import { PremiumGenerateButton } from './PremiumGenerateButton';

interface SmartPromptInputProps {
    prompt: string;
    setPrompt: (value: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    activeCount: number;
    firstJobProgress?: number;
    modelTier: 'flash' | 'pro' | 'ultra';
    disabled?: boolean;
}

export const SmartPromptInput: React.FC<SmartPromptInputProps> = ({
    prompt,
    setPrompt,
    onSubmit,
    placeholder,
    activeCount,
    firstJobProgress,
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
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [prompt]);

    // Submit handler (Enter)
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
            className="relative flex items-center gap-2 transition-all duration-200"
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

            <PremiumGenerateButton
                onClick={onSubmit}
                disabled={disabled}
                activeCount={activeCount}
                externalProgress={firstJobProgress}
                modelTier={modelTier}
            />
        </motion.div>
    );
};
