import React from 'react';
import { Star } from 'lucide-react';

interface SocialProofProps {
    avatars?: string[];
    rating?: number;
    text?: string;
    subtext?: string;
    className?: string;
}

/**
 * SocialProof - Avatar stack + stars + trust text
 * UPDATED: Uses real photography instead of cartoons
 */
const SocialProof: React.FC<SocialProofProps> = ({
    avatars = [],
    rating = 5,
    text = 'Trusted by 100+ businesses',
    subtext = 'THEY HIT THEIR TARGETS — YOU\'RE NEXT.',
    className = ''
}) => {
    // Real photography avatars (Unsplash source)
    const displayAvatars = avatars.length > 0 ? avatars : [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80',
    ];

    return (
        <div className={`flex items-center gap-5 ${className}`}>
            {/* Avatar Stack - Slightly tighter negative margin for premium feel */}
            <div className="flex -space-x-4">
                {displayAvatars.slice(0, 4).map((src, index) => (
                    <img
                        key={index}
                        src={src}
                        alt="User"
                        className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm bg-gray-100"
                        style={{ zIndex: displayAvatars.length - index }}
                    />
                ))}
            </div>

            {/* Text Block */}
            <div className="flex flex-col gap-1">
                {/* Stars + Main Text */}
                <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                        {Array.from({ length: rating }).map((_, i) => (
                            <Star
                                key={i}
                                className="w-4 h-4 fill-brand text-brand"
                            />
                        ))}
                    </div>
                    {/* Darker, bolder text for "Trusted by..." */}
                    <span className="text-sm font-semibold text-neu-dark">
                        {text}
                    </span>
                </div>

                {/* Subtext - Slightly darker grey for readability */}
                <span className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                    {subtext}
                </span>
            </div>
        </div>
    );
};

export default SocialProof;
