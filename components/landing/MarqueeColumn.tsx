import React from 'react';

interface MarqueeColumnProps {
    images: string[];
    direction: 'up' | 'down';
    speed?: number; // seconds per loop, default 30s
    className?: string;
}

/**
 * MarqueeColumn - Infinite scrolling image column
 * 
 * Uses CSS animations for GPU-accelerated smooth scrolling.
 * Content is duplicated to create seamless loop.
 */
const MarqueeColumn: React.FC<MarqueeColumnProps> = ({
    images,
    direction,
    speed = 30,
    className = ''
}) => {
    const animationClass = direction === 'down'
        ? 'animate-marquee-down'
        : 'animate-marquee-up';

    return (
        <div
            className={`marquee-container overflow-hidden ${className}`}
            style={{ '--marquee-duration': `${speed}s` } as React.CSSProperties}
        >
            <div className={`flex flex-col gap-2 ${animationClass}`}>
                {/* Original images */}
                {images.map((src, index) => (
                    <div
                        key={`original-${index}`}
                        className="rounded-2xl overflow-hidden flex-shrink-0"
                    >
                        <img
                            src={src}
                            alt=""
                            className="w-full h-auto object-cover"
                            loading="lazy"
                        />
                    </div>
                ))}
                {/* Duplicated images for seamless loop */}
                {images.map((src, index) => (
                    <div
                        key={`duplicate-${index}`}
                        className="rounded-2xl overflow-hidden flex-shrink-0"
                    >
                        <img
                            src={src}
                            alt=""
                            className="w-full h-auto object-cover"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarqueeColumn;
