import React from 'react';

/**
 * Platform logos for the trust bar
 * Wordmark logos from /public/icons subfolders
 * 
 * ORDER: Spread out for visual variety
 * NOTE: grayscale only (no brightness) - preserves transparency
 */
const PLATFORM_LOGOS = [
    { name: 'Instagram', src: '/icons/Instagram/Instagram_Logo_0.svg', height: 'h-8', offsetY: '2px' },
    { name: 'Google', src: '/icons/Google/Google_Logo_0.svg', height: 'h-8', offsetY: '1px' },
    { name: 'Pinterest', src: '/icons/Pinterest/Pinterest_Logo_0.svg', height: 'h-8' },
    { name: 'Facebook', src: '/icons/Facebook_logo_(2023).svg', height: 'h-7' },
    { name: 'LinkedIn', src: '/icons/LinkedIn/LinkedIn_Logo_0.svg', height: 'h-7' },
    { name: 'Threads', src: '/icons/Threads_wordmark.svg', height: 'h-6' },
];

/**
 * TrustBar - Social proof section with infinite marquee
 * 
 * Design:
 * - White background (matches page)
 * - Left: "Works seamlessly with" text (larger)
 * - Right: Infinite horizontal marquee of platform wordmarks
 * - Both left AND right edge fades
 * - Logos grayscale (no brightness filter to avoid filling white areas)
 * 
 * Marquee Logic:
 * - Content duplicated 2x (original + clone)
 * - translateX(-50%) moves exactly one full set
 * - Seamless loop with no jump
 */
const TrustBar: React.FC = () => {
    return (
        <section className="relative bg-white border-b border-gray-200 py-8 mt-8 overflow-hidden">
            <div className="flex items-center gap-8 px-8 md:px-16">

                {/* Left: Text - Larger */}
                <p className="text-base md:text-lg text-gray-500 font-medium whitespace-nowrap shrink-0">
                    Works seamlessly with
                </p>

                {/* Right: Marquee Container - py-2 for vertical offset room */}
                <div className="relative flex-1 overflow-hidden py-2">
                    {/* Left fade */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                        style={{
                            background: 'linear-gradient(to right, white 0%, transparent 100%)'
                        }}
                    />

                    {/* Right fade */}
                    <div
                        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                        style={{
                            background: 'linear-gradient(to left, white 0%, transparent 100%)'
                        }}
                    />

                    {/* Infinite Marquee Track - 2x duplication for seamless loop */}
                    {/* gap-16 here ensures spacing between Set A and Set B matches internal spacing */}
                    <div className="marquee-track flex items-center gap-16">
                        {/* First set */}
                        <div className="flex items-center gap-16 shrink-0 marquee-content">
                            {PLATFORM_LOGOS.map((logo, index) => (
                                <img
                                    key={`set1-${logo.name}-${index}`}
                                    src={logo.src}
                                    alt={logo.name}
                                    className={`${logo.height} w-auto shrink-0`}
                                    style={{
                                        filter: 'grayscale(100%)',
                                        transform: logo.offsetY ? `translateY(${logo.offsetY})` : undefined,
                                    }}
                                />
                            ))}
                        </div>
                        {/* Second set (clone) - NO ml-16, parent gap handles spacing */}
                        <div className="flex items-center gap-16 shrink-0 marquee-content">
                            {PLATFORM_LOGOS.map((logo, index) => (
                                <img
                                    key={`set2-${logo.name}-${index}`}
                                    src={logo.src}
                                    alt={logo.name}
                                    className={`${logo.height} w-auto shrink-0`}
                                    style={{
                                        filter: 'grayscale(100%)',
                                        transform: logo.offsetY ? `translateY(${logo.offsetY})` : undefined,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Keyframes for infinite marquee */}
            <style>{`
                .marquee-track {
                    animation: marquee-scroll 15s linear infinite;
                }
                @keyframes marquee-scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
        </section>
    );
};

export default TrustBar;
