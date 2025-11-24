
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles, NeuButton } from './NeuComponents';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface NeuModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'danger';
}

export const NeuModal: React.FC<NeuModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  actionLabel, 
  onAction,
  variant = 'default' 
}) => {
  const { styles } = useThemeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()} // Prevent close on click inside
              className={`w-full max-w-md rounded-3xl p-8 ${styles.bg} ${styles.shadowOut} border ${styles.border}`}
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className={`text-2xl font-bold ${styles.textMain}`}>{title}</h3>
                <button 
                  onClick={onClose}
                  className={`p-2 rounded-full ${styles.bg} ${styles.shadowOut} hover:${styles.shadowIn} transition-all ${styles.textSub}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={`mb-8 ${styles.textSub} text-sm leading-relaxed`}>
                {children}
              </div>

              <div className="flex justify-end gap-4">
                <NeuButton onClick={onClose}>Cancel</NeuButton>
                {actionLabel && onAction && (
                  <NeuButton variant={variant} onClick={onAction}>
                    {actionLabel}
                  </NeuButton>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- TOAST SYSTEM ---

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface NeuToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const NeuToast: React.FC<NeuToastProps> = ({ toast, onClose }) => {
  const { styles } = useThemeStyles();
  
  let icon = <Info size={20} className="text-blue-500" />;
  if (toast.type === 'success') icon = <CheckCircle size={20} className="text-green-500" />;
  if (toast.type === 'error') icon = <AlertCircle size={20} className="text-red-500" />;
  if (toast.type === 'warning') icon = <AlertTriangle size={20} className="text-yellow-500" />;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`w-80 p-4 rounded-2xl ${styles.bg} ${styles.shadowOut} border ${styles.border} flex items-start gap-3 relative overflow-hidden`}
    >
      <div className={`mt-1 p-2 rounded-full ${styles.bg} ${styles.shadowIn}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className={`font-bold text-sm ${styles.textMain}`}>{toast.title}</h4>
        {toast.message && <p className={`text-xs ${styles.textSub} mt-1`}>{toast.message}</p>}
      </div>
      <button 
        onClick={() => onClose(toast.id)}
        className={`text-gray-400 hover:text-gray-600 transition-colors`}
      >
        <X size={16} />
      </button>
      
      {/* Progress Bar (Optional visual flair) */}
      <motion.div 
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 5, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-brand/20 to-transparent`}
      />
    </motion.div>
  );
};
