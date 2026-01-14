import React, { useState, useEffect, useRef } from 'react';
import { LiquidMetal } from '@paper-design/shaders-react';

interface LiquidMetalHeadingProps {
    /** The text to display */
    text: string;
    /** Tailwind classes for font sizing (e.g., "text-4xl md:text-5xl") */
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG: Finalized values from Design Lab tuning session
// ═══════════════════════════════════════════════════════════════════════════

const IDLE_CONFIG = {
    colorTint: '#94ca42',
    colorBack: '#000000',
    repetition: 1.55,
    softness: 0.45,
    shiftRed: 0.57,
    shiftBlue: 0.47,
    distortion: 0.97,
    contour: 0.0,
    angle: 90,
    speed: 0.36,
    scale: 0.6,
};

const HOVER_BOOST = {
    repetition: 0.5,
    shiftRed: 0.2,
    shiftBlue: 0.2,
    speed: 0.4,
    scale: 0.3,
};

// ═══════════════════════════════════════════════════════════════════════════

const lerp = (current: number, target: number, factor: number) => {
    const diff = target - current;
    return Math.abs(diff) < 0.001 ? target : current + diff * factor;
};

export const LiquidMetalHeading: React.FC<LiquidMetalHeadingProps> = ({ text, className = '' }) => {
    const hoverRef = useRef(false);

    const [shader, setShader] = useState({
        repetition: IDLE_CONFIG.repetition,
        shiftRed: IDLE_CONFIG.shiftRed,
        shiftBlue: IDLE_CONFIG.shiftBlue,
        speed: IDLE_CONFIG.speed,
        scale: IDLE_CONFIG.scale,
    });

    // 60fps animation loop
    useEffect(() => {
        let rafId: number;

        const tick = () => {
            const hovFactor = hoverRef.current ? 1 : 0;

            setShader(prev => ({
                repetition: lerp(prev.repetition, IDLE_CONFIG.repetition + (hovFactor * HOVER_BOOST.repetition), 0.08),
                shiftRed: lerp(prev.shiftRed, IDLE_CONFIG.shiftRed + (hovFactor * HOVER_BOOST.shiftRed), 0.08),
                shiftBlue: lerp(prev.shiftBlue, IDLE_CONFIG.shiftBlue + (hovFactor * HOVER_BOOST.shiftBlue), 0.08),
                speed: lerp(prev.speed, IDLE_CONFIG.speed + (hovFactor * HOVER_BOOST.speed), 0.08),
                scale: lerp(prev.scale, IDLE_CONFIG.scale + (hovFactor * HOVER_BOOST.scale), 0.08),
            }));

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, []);

    return (
        // EXACT same structure as the slider-controlled version
        <div
            className="rounded-3xl bg-black border border-white/10 relative overflow-hidden h-48 isolated cursor-pointer"
            onMouseEnter={() => { hoverRef.current = true; }}
            onMouseLeave={() => { hoverRef.current = false; }}
        >
            <LiquidMetal
                colorBack={IDLE_CONFIG.colorBack}
                colorTint={IDLE_CONFIG.colorTint}
                shape="none"
                repetition={shader.repetition}
                softness={IDLE_CONFIG.softness}
                shiftRed={shader.shiftRed}
                shiftBlue={shader.shiftBlue}
                distortion={IDLE_CONFIG.distortion}
                contour={IDLE_CONFIG.contour}
                angle={IDLE_CONFIG.angle}
                speed={shader.speed}
                scale={shader.scale}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black mix-blend-multiply z-10">
                <h2 className={`font-extrabold tracking-tight leading-tight text-white m-0 p-0 ${className}`}>
                    {text}
                </h2>
            </div>
        </div>
    );
};

export default LiquidMetalHeading;
