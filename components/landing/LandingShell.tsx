import React from 'react';

interface LandingShellProps {
    children: React.ReactNode;
}

/**
 * LandingShell - Boxed layout wrapper
 * 
 * Creates the "Grid Lines" effect:
 * - Central container with max-width
 * - Vertical borders on Left and Right
 * - Content sits inside
 */
const LandingShell: React.FC<LandingShellProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-white text-neu-dark font-sans selection:bg-brand/20">
            {/* 
                Main Grid Container 
                - border-x: Adds the vertical lines on far left/right
                - max-w-[1400px]: Gives it that "Boxed" premium feel usually seen in high-end design portfolios
                - border-color: subtle grey
            */}
            <div className="mx-auto max-w-[1440px] border-x border-gray-200 min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.02)]">
                {children}
            </div>
        </div>
    );
};

export default LandingShell;
