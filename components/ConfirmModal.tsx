/**
 * ConfirmModal - Premium Confirmation Dialog
 * 
 * Replaces native window.confirm with app-styled modal
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { NeuButton, NeuCard, NeuCloseButton, useThemeStyles } from './NeuComponents';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
}) => {
    const { styles } = useThemeStyles();

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <NeuCard className="w-full max-w-md relative">
                            {/* Close button */}
                            <NeuCloseButton onClick={onCancel} className="absolute top-4 right-4" />

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger'
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-brand/10 text-brand'
                                }`}>
                                <AlertTriangle size={24} />
                            </div>

                            {/* Content */}
                            <h3 className={`text-xl font-bold ${styles.textMain} mb-2`}>
                                {title}
                            </h3>
                            <p className={`${styles.textSub} mb-6`}>
                                {message}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <NeuButton
                                    onClick={onCancel}
                                    className="flex-1"
                                >
                                    {cancelText}
                                </NeuButton>
                                <NeuButton
                                    onClick={onConfirm}
                                    variant={variant === 'danger' ? 'danger' : 'primary'}
                                    className="flex-1"
                                >
                                    {confirmText}
                                </NeuButton>
                            </div>
                        </NeuCard>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ConfirmModal;
