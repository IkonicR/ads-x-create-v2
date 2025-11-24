import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Design System Constants ---

// REFACTORED: Now uses the Tailwind Config tokens defined in index.html
const THEMES = {
  light: {
    bg: "bg-neu-light",
    bgAccent: "bg-neu-accent-light", // For slight contrast areas
    textMain: "text-neu-text-main-light",
    textSub: "text-neu-text-sub-light",
    textInverse: "text-white",
    shadowOut: "shadow-neu-out-light",
    shadowIn: "shadow-neu-in-light",
    focusRing: "focus:ring-brand/50 focus:ring-offset-neu-light",
    inputPlaceholder: "placeholder-gray-400",
    badgeBg: "bg-neu-light",
    border: "border-gray-200",
  },
  dark: {
    bg: "bg-neu-dark",
    bgAccent: "bg-neu-accent-dark", // For slight contrast areas
    textMain: "text-neu-text-main-dark",
    textSub: "text-neu-text-sub-dark",
    textInverse: "text-gray-900",
    shadowOut: "shadow-neu-out-dark",
    shadowIn: "shadow-neu-in-dark",
    focusRing: "focus:ring-brand/50 focus:ring-offset-neu-dark",
    inputPlaceholder: "placeholder-gray-600",
    badgeBg: "bg-neu-dark",
    border: "border-gray-700",
  }
};

// Hook to expose styles to views
export const useThemeStyles = () => {
  const { theme } = useTheme();
  return { styles: THEMES[theme], theme };
};

// --- Components ---

interface NeuCardProps extends HTMLMotionProps<"div"> {
  inset?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  forceTheme?: 'light' | 'dark';
}

export const NeuCard: React.FC<NeuCardProps> = ({ children, className, inset, forceTheme, ...props }) => {
  const { theme: contextTheme } = useTheme();
  const theme = forceTheme || contextTheme;
  const styles = THEMES[theme];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-3xl p-6 transition-shadow duration-300",
        styles.bg,
        inset ? styles.shadowIn : styles.shadowOut,
        styles.textMain,
        className
      )} 
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'primary' | 'danger' | 'default';
  forceTheme?: 'light' | 'dark';
}

export const NeuButton: React.FC<NeuButtonProps> = ({ children, className, active, variant = 'default', forceTheme, ...props }) => {
  const { theme: contextTheme } = useTheme();
  const theme = forceTheme || contextTheme;
  const styles = THEMES[theme];
  
  const baseStyles = "rounded-xl px-6 py-3 font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 select-none outline-none focus:ring-2 focus:ring-offset-2";
  
  let colorStyles = styles.textMain;
  if (variant === 'primary') colorStyles = "text-brand";
  if (variant === 'danger') colorStyles = "text-red-500";
  if (active) colorStyles = "text-brand";

  return (
    <button
      className={cn(
        baseStyles,
        styles.bg,
        styles.focusRing,
        active ? styles.shadowIn : styles.shadowOut,
        colorStyles,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const NeuInput: React.FC<NeuInputProps> = ({ className, ...props }) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];

  return (
    <input
      className={cn(
        "w-full rounded-xl px-4 py-3 outline-none transition-all",
        styles.bg,
        styles.shadowIn,
        styles.textMain,
        styles.inputPlaceholder,
        "focus:ring-2 focus:ring-brand/20",
        className
      )}
      {...props}
    />
  );
};

interface NeuTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const NeuTextArea: React.FC<NeuTextAreaProps> = ({ className, ...props }) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];

  return (
    <textarea
      className={cn(
        "w-full rounded-xl px-4 py-3 outline-none transition-all min-h-[100px]",
        styles.bg,
        styles.shadowIn,
        styles.textMain,
        styles.inputPlaceholder,
        "focus:ring-2 focus:ring-brand/20",
        className
      )}
      {...props}
    />
  );
};

// FIXED: NeuBadge wasn't exported properly in some versions or was missing
export const NeuBadge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
      styles.badgeBg,
      styles.shadowOut,
      "text-brand",
      className
    )}>
      {children}
    </span>
  );
};

interface NeuSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const NeuSelect: React.FC<NeuSelectProps> = ({ className, children, ...props }) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];

  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "w-full appearance-none rounded-xl px-4 py-3 outline-none transition-all bg-transparent cursor-pointer",
          styles.bg,
          styles.shadowOut,
          styles.textMain,
          "focus:ring-2 focus:ring-brand/20"
        )}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
};