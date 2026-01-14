import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroBadge from './HeroBadge';
import LandingButton from './LandingButton';
import SocialProof from './SocialProof';
import MarqueeColumn from './MarqueeColumn';

// Real generated assets from the x Create library
// Fetched via SQL: SELECT content FROM assets WHERE type = 'image' ORDER BY created_at DESC;
const LIBRARY_ASSETS_LEFT = [
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768404384127_vn0sfd.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768403761870_uq0ri.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768403406934_7kzlb.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768403221434_yi0uu.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768403161876_mzmmsn.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768403085814_shjnrg.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/ag54vxxn0/generated/1768403068220_u9cul.png',
];

const LIBRARY_ASSETS_RIGHT = [
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/yxup0oddz/generated/1768382125482_h0riin.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/yxup0oddz/generated/1768382050296_6ew52j.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/yxup0oddz/generated/1768381887659_wnfm3s.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/yxup0oddz/generated/1768381862830_e8hnw.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/yxup0oddz/generated/1768381488849_uh6u84.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/yxup0oddz/generated/1768380680481_5q6ggn.png',
    'https://afzrfcqidscibmgptkcl.supabase.co/storage/v1/object/public/business-assets/yxup0oddz/generated/1768380677030_efg73l.png',
];

interface HeroSectionProps {
    leftColumnImages?: string[];
    rightColumnImages?: string[];
}

/**
 * HeroSection - Main landing page hero
 * 
 * LATEST FIXES:
 * - Removed center vertical border (`lg:border-r` deleted)
 * - Swapped placeholders for high-quality product photography
 */
const HeroSection: React.FC<HeroSectionProps> = ({
    leftColumnImages = LIBRARY_ASSETS_LEFT,
    rightColumnImages = LIBRARY_ASSETS_RIGHT,
}) => {
    const navigate = useNavigate();

    const handleSignIn = () => {
        navigate('/login');
    };

    const handleRequestAccess = () => {
        navigate('/login');
    };

    return (
        // Border bottom creates the horizontal grid line separator
        <section className="relative border-b border-gray-200 bg-white">

            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[90vh]">

                {/* Left Column: Content */}
                {/* REMOVED lg:border-r to remove the center vertical line */}
                <div className="flex flex-col justify-center px-8 md:px-16 py-20">
                    <div className="flex flex-col gap-10 max-w-xl">

                        <div className="flex flex-col gap-6">
                            {/* Badge */}
                            <div>
                                <HeroBadge>Invite Only</HeroBadge>
                            </div>

                            {/* Headline */}
                            <h1 className="text-5xl md:text-6xl lg:text-[4rem] font-bold text-gray-900 leading-[1.1] tracking-tight">
                                What Agencies Charge Thousands For.{' '}
                                <span className="text-brand block mt-2">You Get Instantly.</span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-xl text-gray-600 leading-relaxed font-medium">
                                Professional ads for growing businesses.
                                <br className="hidden md:block" />
                                AI-powered, brand-aware, and ready to convert.
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <LandingButton
                                variant="primary"
                                onClick={handleSignIn}
                                className="justify-center sm:justify-start"
                            >
                                Sign In
                            </LandingButton>
                            <LandingButton
                                variant="secondary"
                                onClick={handleRequestAccess}
                                className="justify-center sm:justify-start"
                            >
                                Request Access
                            </LandingButton>
                        </div>

                        {/* Social Proof */}
                        <div className="pt-4 border-t border-gray-100">
                            <SocialProof />
                        </div>
                    </div>
                </div>

                {/* Right Column: Marquee Grid - No padding, images go edge-to-edge */}
                <div className="hidden lg:grid grid-cols-2 gap-2 h-full max-h-[90vh] overflow-hidden">
                    <MarqueeColumn
                        images={leftColumnImages}
                        direction="down"
                        speed={35}
                    />
                    <MarqueeColumn
                        images={rightColumnImages}
                        direction="up"
                        speed={40}
                    />
                </div>

            </div>
        </section>
    );
};

export default HeroSection;
