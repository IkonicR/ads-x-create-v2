import React, { useRef, useEffect, useState } from 'react';
import { useThemeStyles } from './NeuComponents';

interface GalaxyHeadingProps {
  text: string;
  className?: string;
  mode?: 'default' | 'light-on-dark';
}

// Default "Hero" styles for the Galaxy Heading system
const DEFAULT_CLASSES = "text-5xl md:text-6xl font-extrabold tracking-tight pb-2 leading-tight";

// Helper to generate a random starfield texture data URL
const generateStarTexture = (
  width: number, 
  height: number, 
  count: number, 
  colors: string[], 
  minSize: number, 
  maxSize: number
): string => {
  const scale = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
  const canvas = document.createElement('canvas');
  // Scale up for Retina
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < count; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    // Scale star size too
    const size = (Math.random() * (maxSize - minSize) + minSize) * scale;
    const color = colors[Math.floor(Math.random() * colors.length)];

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    // Removed shadowBlur for crisp stars
    ctx.fill();
  }

  return canvas.toDataURL();
};

export const GalaxyHeading: React.FC<GalaxyHeadingProps> = ({ text, className, mode = 'default' }) => {
  const { theme } = useThemeStyles();
  const isDark = theme === 'dark';
  const [bgImages, setBgImages] = useState<{ layer1: string; layer2: string; layer3: string } | null>(null);

  // Determine final className: Default if none, or Merge if provided.
  // Simple concatenation allows overrides if user passes 'text-3xl' later in string (Tailwind usually respects last class).
  const finalClass = className ? `${DEFAULT_CLASSES} ${className}` : DEFAULT_CLASSES;

  useEffect(() => {
    // Define Palettes
    
    // For "Light on Dark" (e.g. Login Screen), we force white/bright base.
    // For Default, we respect the theme.
    const forceBright = mode === 'light-on-dark';
    
    // Layer 1 (Background): White/Grey
    const colors1 = (isDark || forceBright) 
      ? ['rgba(255,255,255,0.9)', 'rgba(200,200,200,0.9)'] // Bright/White
      : ['rgba(50,50,50,0.8)', 'rgba(80,80,80,0.8)'];     // Dark/Grey

    // Layer 2 (Mid): Cool colors (Blue, Cyan, Green) - MATCHING GALAXY CANVAS
    const colors2 = ['rgba(100, 200, 255, 0.9)', 'rgba(50, 255, 150, 0.9)'];

    // Layer 3 (Close): Warm/Rich colors (Purple, Red, Gold) - MATCHING GALAXY CANVAS
    const colors3 = ['rgba(200, 100, 255, 0.9)', 'rgba(255, 80, 120, 0.9)', 'rgba(255, 200, 50, 0.9)'];

    // Generate Textures
    // We use large prime-ish sizes to minimize repetition
    // Increased counts significantly for high density
    const layer1 = generateStarTexture(500, 500, 450, colors1, 1, 1.5);
    const layer2 = generateStarTexture(600, 600, 200, colors2, 1.5, 2);
    const layer3 = generateStarTexture(700, 700, 100, colors3, 2, 3);

    setBgImages({ layer1, layer2, layer3 });
  }, [isDark, mode]);

  // Base styles
  const baseStyle: React.CSSProperties = {
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    backgroundAttachment: 'fixed', // Pinned
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    backgroundRepeat: 'repeat',
  };

  // If images aren't ready, render nothing or fallback
  if (!bgImages) return <h2 className={`${finalClass} opacity-0`}>{text}</h2>;

  const forceBright = mode === 'light-on-dark';

  return (
    <div className={`relative inline-block`}>
      {/* Layer 1 (Base) */}
      <h2 
        className={`m-0 p-0 ${(isDark || forceBright) ? 'bg-white' : 'bg-black'} ${finalClass}`} 
        style={{
          ...baseStyle,
          position: 'relative',
          backgroundImage: `url(${bgImages.layer1})`,
          backgroundSize: '500px 500px', // Force Retina Scaling
          animation: 'drift 120s linear infinite', // Slow
        }}
      >
        {text}
        
        {/* Layer 2 Overlay */}
        <span 
          className="absolute inset-0 pointer-events-none" 
          aria-hidden="true" 
          style={{
            ...baseStyle,
            backgroundImage: `url(${bgImages.layer2})`,
            backgroundSize: '600px 600px', // Force Retina Scaling
            animation: 'drift 80s linear infinite', // Mid
          }}
        >
          {text}
        </span>

        {/* Layer 3 Overlay */}
        <span 
          className="absolute inset-0 pointer-events-none" 
          aria-hidden="true" 
          style={{
            ...baseStyle,
            backgroundImage: `url(${bgImages.layer3})`,
            backgroundSize: '700px 700px', // Force Retina Scaling
            animation: 'drift 40s linear infinite', // Fast
          }}
        >
          {text}
        </span>
      </h2>
    </div>
  );
};