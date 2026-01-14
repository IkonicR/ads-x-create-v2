import React from 'react';

interface HeroBadgeProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * HeroBadge - Small pill with slashes: // TEXT //
 * Uses brand colors from design system.
 */
const HeroBadge: React.FC<HeroBadgeProps> = ({ children, className = '' }) => {
    return (
        <span
            className={`
                inline-flex items-center gap-2
                px-4 py-2 rounded-full
                bg-brand/10 text-brand
                text-sm font-medium tracking-wide
                ${className}
            `}
        >
            <span className="opacity-60">//</span>
            <span className="uppercase">{children}</span>
            <span className="opacity-60">//</span>
        </span>
    );
};

export default HeroBadge;
