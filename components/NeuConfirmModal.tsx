import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles, NeuButton } from './NeuComponents';
import { AlertTriangle } from 'lucide-react';

interface NeuConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'primary' | 'danger' | 'default';
}

export const NeuConfirmModal: React.FC<NeuConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary'
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className={`w-full max-w-md rounded-3xl p-8 pointer-events-auto ${styles.bg} ${styles.shadowOut} border border-white/10`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${styles.shadowIn} text-brand bg-brand/10`}>
                  <AlertTriangle size={24} />
                </div>
                <h3 className={`text-xl font-bold ${styles.textMain}`}>{title}</h3>
              </div>

              <div className={`text-sm ${styles.textSub} leading-relaxed mb-8`}>
                {message}
              </div>

              <div className="flex gap-4 justify-end">
                <NeuButton onClick={onCancel} className="flex-1">
                  {cancelText}
                </NeuButton>
                <NeuButton variant={confirmVariant} onClick={onConfirm} className="flex-1">
                  {confirmText}
                </NeuButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
