import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GalaxyCanvas } from '../components/GalaxyCanvas';
import { useMotionValue, animate } from 'framer-motion';

// Section Components (to be created)
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import DiagnosisSection from '../components/landing/DiagnosisSection';
import PrismSection from '../components/landing/PrismSection';
import FeatureEngineSection from '../components/landing/FeatureEngineSection';
import LikenessProofSection from '../components/landing/LikenessProofSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import PricingSection from '../components/landing/PricingSection';
import LandingFooter from '../components/landing/LandingFooter';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/login');
    };

    // Warp State for Hero Interaction
    const warpFactor = useMotionValue(0);

    const setWarp = (value: number) => {
        animate(warpFactor, value, { duration: 0.8, ease: "easeInOut" });
    };

    return (
        <div className="min-h-screen bg-neu-dark text-neu-text-main-dark overflow-x-hidden">
            {/* Fixed Galaxy Background */}
            <div className="fixed inset-0 z-0">
                <GalaxyCanvas warpFactor={warpFactor} />
            </div>

            {/* Content Layer */}
            <div className="relative z-10">
                <LandingNav onGetStarted={handleGetStarted} />

                <main>
                    <HeroSection onGetStarted={handleGetStarted} setWarp={setWarp} />
                    <DiagnosisSection />
                    <PrismSection />
                    <FeatureEngineSection />
                    <LikenessProofSection />
                    <TestimonialsSection />
                    <PricingSection onGetStarted={handleGetStarted} />
                </main>

                <LandingFooter />
            </div>
        </div>
    );
};

export default LandingPage;
