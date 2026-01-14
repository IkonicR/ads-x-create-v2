import React from 'react';
import LandingShell from '../components/landing/LandingShell';
import HeroSection from '../components/landing/HeroSection';

/**
 * LandingPage - Clean shell for the new landing page
 * 
 * Now uses LandingShell for the "Boxed Grid" layout.
 */
const LandingPage: React.FC = () => {
    return (
        <LandingShell>
            <HeroSection />

            {/* 
                Placeholder for "What We Do" Section 
                Just to show the grid line continuity 
            */}
            {/* <div className="h-screen border-b border-gray-200"></div> */}

        </LandingShell>
    );
};

export default LandingPage;
