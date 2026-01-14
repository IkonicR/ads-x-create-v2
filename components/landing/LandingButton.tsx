import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingButtonProps {
    variant: 'primary' | 'secondary';
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

/**
 * LandingButton - CTA buttons for landing page
 * 
 * Primary: Brand green fill, dark text
 * Secondary: Dark fill, light text
 */
const LandingButton: React.FC<LandingButtonProps> = ({
    variant,
    children,
    onClick,
    className = '',
    disabled = false
}) => {
    const baseStyles = `
        inline-flex items-center gap-2
        px-6 py-3 rounded-full
        font-medium text-base
        transition-all duration-200
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantStyles = variant === 'primary'
        ? 'bg-brand text-neu-dark hover:bg-brand-hover active:scale-[0.98]'
        : 'bg-neu-dark text-neu-light hover:bg-neu-accent-dark active:scale-[0.98]';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles} ${className}`}
        >
            {children}
            <ArrowRight className="w-4 h-4" />
        </button>
    );
};

export default LandingButton;
