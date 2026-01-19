
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Pencil, Palette, Maximize2, Download, X } from 'lucide-react';
import { NeuIconButton, useThemeStyles } from './NeuComponents';

interface QuickActionPillsProps {
    onVariations: () => void;
    onEdit: () => void;
    onDifferentStyle: () => void;
    onResize: () => void;
    onSave: () => void;
    isEditMode?: boolean;
}

export const QuickActionPills: React.FC<QuickActionPillsProps> = ({
    onVariations, onEdit, onDifferentStyle, onResize, onSave, isEditMode
}) => {
    const { styles } = useThemeStyles();

    const pills = [
        { icon: Sparkles, label: 'Variations', onClick: onVariations, variant: 'brand' as const },
        { icon: Pencil, label: 'Edit', onClick: onEdit, variant: 'brand' as const },
        { icon: Palette, label: 'Style', onClick: onDifferentStyle, variant: 'brand' as const },
        { icon: Maximize2, label: 'Resize', onClick: onResize, variant: 'default' as const },
        { icon: Download, label: 'Save', onClick: onSave, variant: 'default' as const },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-2"
        >
            {pills.map(pill => (
                <NeuIconButton
                    key={pill.label}
                    onClick={pill.onClick}
                    variant={pill.variant}
                    size="sm"
                    active={pill.label === 'Edit' && isEditMode}
                    className="gap-1.5 px-3"
                    title={pill.label}
                >
                    <pill.icon size={14} />
                    <span className="text-xs font-medium">{pill.label}</span>
                </NeuIconButton>
            ))}
        </motion.div>
    );
};

// Inline Edit Input - Separate component for cleaner code
interface EditInputProps {
    onSubmit: (value: string) => void;
    onCancel: () => void;
}

export const QuickEditInput: React.FC<EditInputProps> = ({ onSubmit, onCancel }) => {
    const { styles } = useThemeStyles();
    const [value, setValue] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Focus on mount
    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Handle Escape to cancel
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onCancel]);

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex gap-2 mt-3"
        >
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Describe change (e.g. 'Make it blue')..."
                className={`flex-1 px-3 py-2 rounded-xl text-sm ${styles.bg} ${styles.shadowIn} outline-none focus:ring-2 focus:ring-brand/30`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && value.trim()) {
                        onSubmit(value.trim());
                    }
                }}
            />
            <NeuIconButton
                onClick={onCancel}
                variant="danger"
                size="sm"
                title="Cancel (Esc)"
            >
                <X size={16} />
            </NeuIconButton>
        </motion.div>
    );
};
