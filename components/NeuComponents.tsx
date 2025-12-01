import React, { useState, useRef, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { X, Plus, ChevronDown } from 'lucide-react';

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Design System Constants ---
export const BRAND_COLOR = '#6D5DFC';

// REFACTORED: Now uses the Tailwind Config tokens defined in index.html
const THEMES = {
  light: {
    bg: "bg-neu-light",
    bgAccent: "bg-neu-accent-light", // For slight contrast areas
    textMain: "text-neu-text-main-light",
    textSub: "text-neu-text-sub-light",
    textInverse: "text-white",
    textHover: "hover:text-gray-900", // Darker on hover for visibility
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
    textHover: "hover:text-white", // White on hover for visibility
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

// --- ANIMATION HOOK ---
export const useNeuAnimations = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // --- THE PREMIUM ENGINE ---
  // Exact System Match + Dual-Shadow Interpolation + Premium Anticipation
  const variants = {
    initial: {
      y: 0,
      scale: 1,
      boxShadow: isDark
        ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5), inset 4px 4px 8px rgba(0, 0, 0, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)"
        : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3), inset 4px 4px 8px rgba(136, 158, 177, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)"
    },
    hover: {
      y: 0,
      scale: 0.975, // HEAVY: Deep Anticipation
      boxShadow: isDark
        ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5), inset 4px 4px 8px rgba(0, 0, 0, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)" // Very Tight
        : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3), inset 4px 4px 8px rgba(136, 158, 177, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)" // Very Tight
    },
    pressed: {
      y: 1,
      scale: 0.95, // Deepest Press
      boxShadow: isDark
        ? "4px 4px 8px rgba(6, 7, 9, 0), -3px -3px 6px rgba(24, 27, 33, 0), inset 1px 1px 1px rgba(255, 255, 255, 0), inset -1px -1px 2px rgba(0, 0, 0, 0), inset 4px 4px 8px rgba(0, 0, 0, 0.9), inset -4px -4px 8px rgba(255, 255, 255, 0.05)"
        : "3px 3px 4px rgba(136, 158, 177, 0), -2px -2px 4px rgba(255, 255, 255, 0), 6px 6px 12px rgba(136, 158, 177, 0), inset 1px 1px 2px rgba(255, 255, 255, 0), inset -1px -1px 2px rgba(136, 158, 177, 0), inset 4px 4px 8px rgba(136, 158, 177, 0.9), inset -4px -4px 8px rgba(255, 255, 255, 1)"
    }
  };

  return variants;
};

export const NeuButton: React.FC<NeuButtonProps> = ({ children, className, active, variant = 'default', forceTheme, ...props }) => {
  const { theme: contextTheme } = useTheme();
  const theme = forceTheme || contextTheme;
  const styles = THEMES[theme];
  const variants = useNeuAnimations(); // Use the hook

  const baseStyles = "rounded-xl px-6 py-3 font-bold flex items-center justify-center gap-2 select-none outline-none focus:ring-2 focus:ring-offset-2";

  let colorStyles = styles.textMain;
  if (variant === 'primary') colorStyles = "text-brand";
  if (variant === 'danger') colorStyles = "text-red-500";
  if (active) colorStyles = "text-brand";

  return (
    <motion.button
      initial="initial"
      whileHover="hover"
      whileTap="pressed"
      animate={active ? "pressed" : "initial"}
      variants={variants}
      transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
      className={cn(
        baseStyles,
        styles.bg,
        styles.focusRing,
        colorStyles,
        className
      )}
      {...props as any} // Cast to any to avoid motion/HTML prop conflicts
    >
      {children}
    </motion.button>
  );
};

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

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

interface NeuTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

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

interface NeuSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { }

export const NeuSelect: React.FC<NeuSelectProps> = ({ className, children, ...props }) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];

  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "w-full appearance-none rounded-xl px-4 py-3 outline-none transition-all bg-transparent cursor-pointer",
          styles.bg,
          styles.shadowIn,
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

// --- NeuDropdown (Push-Down Style) ---

interface NeuDropdownOption {
  label: string;
  value: string;
}

interface NeuDropdownProps {
  options: NeuDropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export const NeuDropdown: React.FC<NeuDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className,
  label
}) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  // Animation Variants
  const containerVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
        when: "afterChildren"
      }
    },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        type: "spring",
        bounce: 0,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && (
        <label className={`block text-xs font-bold ${styles.textSub} uppercase tracking-wider`}>
          {label}
        </label>
      )}

      <motion.div
        layout
        className={cn(
          "relative overflow-hidden rounded-xl transition-all duration-300",
          styles.bg,
          isOpen ? styles.shadowIn : styles.shadowOut // Inset when open (tray effect)
        )}
      >
        {/* Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 outline-none text-left",
            styles.textMain
          )}
        >
          <span className={!selectedOption ? "opacity-50" : ""}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} className="opacity-50" />
          </motion.div>
        </button>

        {/* Dropdown Content (Push Down + Staggered) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="border-t border-black/5 dark:border-white/5"
            >
              <div className="p-2 space-y-1">
                {options.map((option) => (
                  <motion.button
                    key={option.value}
                    variants={itemVariants}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    whileTap={{ scale: 0.98, x: 5 }} // "Selection Physics"
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      option.value === value
                        ? "bg-brand/10 text-brand font-bold"
                        : `hover:bg-black/5 dark:hover:bg-white/5 ${styles.textMain}`
                    )}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

interface NeuListBuilderProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  title?: string;
  maxItems?: number;
}

export const NeuListBuilder: React.FC<NeuListBuilderProps> = ({
  items = [],
  onItemsChange,
  placeholder = "Add an item...",
  title,
  maxItems
}) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];
  const [inputValue, setInputValue] = React.useState('');

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    if (maxItems && items.length >= maxItems) return;

    onItemsChange([...items, inputValue.trim()]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {title && <label className={`block text-xs font-bold ${styles.textSub} uppercase tracking-wider`}>{title}</label>}

      <div className="relative flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={maxItems && items.length >= maxItems ? "Limit reached" : placeholder}
          disabled={!!maxItems && items.length >= maxItems}
          className={cn(
            "flex-1 rounded-xl px-4 py-3 outline-none transition-all",
            styles.bg,
            styles.shadowIn,
            styles.textMain,
            styles.inputPlaceholder,
            "focus:ring-2 focus:ring-brand/20 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim() || (!!maxItems && items.length >= maxItems)}
          className={cn(
            "w-12 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95",
            styles.bg,
            !inputValue.trim() ? styles.shadowOut : "shadow-neu-in text-brand",
            (!!maxItems && items.length >= maxItems) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Plus size={20} className={inputValue.trim() ? "text-brand" : "text-gray-400"} />
        </button>
      </div>

      <motion.div
        layout
        className={cn(
          "min-h-[60px] p-3 rounded-xl flex flex-wrap gap-2 content-start",
          // Recessed tray look
          styles.bg,
          "border border-black/5 dark:border-white/5"
        )}
      >
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={`${item}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
              className={cn(
                "group flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-lg text-sm font-medium cursor-default",
                styles.bg,
                styles.shadowOut,
                styles.textMain
              )}
            >
              <span>{item}</span>
              <button
                onClick={() => handleRemove(index)}
                className="p-1 rounded-md hover:bg-red-500/10 hover:text-red-500 text-gray-400 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className={`w-full h-full flex items-center justify-center py-2 ${styles.textSub} text-xs italic opacity-50`}>
            No items yet. Add one above!
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- NeuTabs (Segmented Control) ---

export interface NeuTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface NeuTabsProps {
  tabs: NeuTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const NeuTabs: React.FC<NeuTabsProps> = ({ tabs, activeTab, onChange, className }) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];

  return (
    <div
      className={cn(
        "flex p-1.5 rounded-2xl relative",
        styles.bg,
        styles.shadowIn, // Inset track
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors z-10 outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
              isActive ? "text-brand" : cn(styles.textSub, styles.textHover)
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={cn(
                  "absolute inset-0 rounded-xl",
                  styles.bg,
                  styles.shadowOut // Outset pill
                )}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// --- NeuCombobox (Smart Search + Create) ---

interface NeuComboboxProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const NeuCombobox: React.FC<NeuComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select or type...",
  label,
  className
}) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync query with external value changes
  useEffect(() => {
    if (value) {
      const match = options.find(o => o.value === value);
      // Only update query if it doesn't match the current query (to avoid cursor jumps if we were typing)
      // But actually, for this "select or type" pattern, if value changes externally, we should update.
      setQuery(match ? match.label : value);
    }
  }, [value, options]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = query === ''
    ? options
    : options.filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase())
    );

  const isExactMatch = filteredOptions.some(o => o.label.toLowerCase() === query.toLowerCase());
  const showCreate = query !== '' && !isExactMatch;

  // Animation Variants (Same as NeuDropdown)
  const containerVariants = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
        when: "afterChildren"
      }
    },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        type: "spring",
        bounce: 0,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {label && (
        <label className={`block text-xs font-bold ${styles.textSub} uppercase tracking-wider`}>
          {label}
        </label>
      )}

      <motion.div
        layout
        className={cn(
          "relative overflow-hidden rounded-xl transition-all duration-300",
          styles.bg,
          isOpen ? styles.shadowIn : styles.shadowOut // Inset when open (tray effect)
        )}
      >
        {/* Input Trigger */}
        <div className="relative">
          <input
            ref={inputRef}
            className={cn(
              "w-full px-4 py-3 outline-none bg-transparent transition-all",
              styles.textMain,
              styles.inputPlaceholder
            )}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none opacity-50">
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} />
            </motion.div>
          </div>
        </div>

        {/* Dropdown Content (Push Down + Staggered) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="border-t border-black/5 dark:border-white/5"
            >
              <div className="p-2 space-y-1">
                {filteredOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    variants={itemVariants}
                    onClick={() => {
                      onChange(option.value);
                      setQuery(option.label);
                      setIsOpen(false);
                    }}
                    whileTap={{ scale: 0.98, x: 5 }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center",
                      option.value === value
                        ? "bg-brand/10 text-brand font-bold"
                        : `hover:bg-black/5 dark:hover:bg-white/5 ${styles.textMain}`
                    )}
                  >
                    <span>{option.label}</span>
                    {option.value === value && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </motion.button>
                ))}

                {showCreate && (
                  <motion.button
                    variants={itemVariants}
                    onClick={() => {
                      onChange(query); // Set custom value
                      setIsOpen(false);
                    }}
                    whileTap={{ scale: 0.98, x: 5 }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-brand font-bold hover:bg-brand/5 flex items-center gap-2"
                    )}
                  >
                    <Plus size={14} />
                    Create "{query}"
                  </motion.button>
                )}

                {filteredOptions.length === 0 && !showCreate && (
                  <div className={`px-3 py-2 text-xs ${styles.textSub} italic`}>
                    No options found.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};