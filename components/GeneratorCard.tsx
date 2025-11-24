import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStyles } from './NeuComponents';
import { GalaxyCanvas } from './GalaxyCanvas';

interface GeneratorCardProps {
  aspectRatio?: string;
  // primaryColor prop removed
  status?: 'queued' | 'generating' | 'complete';
}

const getPaddingBottom = (ratio: string = '1:1') => {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return '100%';
  return `${(h / w) * 100}%`;
};

const GeneratorCardComponent: React.FC<GeneratorCardProps> = ({
  aspectRatio = '1:1',
  status = 'generating'
}) => {
  const { theme } = useThemeStyles();
  const isDark = theme === 'dark';
  
  // The Mold (Pressed In) - Applied to the inner screen
  const screenShadow = isDark 
    ? 'inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.1)' // Dark mode rim light
    : 'inset 3px 3px 6px rgba(163,177,198,0.4), inset -3px -3px 6px rgba(255,255,255,0.8)'; // Light mode deep hole

  // The Finished Product (Popped Out) - Applied to the OUTER frame
  const frameShadow = isDark
    ? '6px 6px 12px #000000, -6px -6px 12px #2b2e33'
    : '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff';

  const bgStyle = isDark ? '#0F1115' : '#E0E5EC';
  const paddingBottom = getPaddingBottom(aspectRatio);

  // Border Cheat
  const borderColor = isDark
     ? {
         borderTopColor: 'rgba(255,255,255,0.05)',
         borderLeftColor: 'rgba(255,255,255,0.05)',
         borderRightColor: 'rgba(0,0,0,0.2)',
         borderBottomColor: 'rgba(0,0,0,0.2)'
       }
     : {
         borderTopColor: 'rgba(255,255,255,0.8)',
         borderLeftColor: 'rgba(255,255,255,0.8)',
         borderRightColor: 'rgba(163,177,198,0.1)', 
         borderBottomColor: 'rgba(163,177,198,0.1)'
       };

  // Galaxy Theme Logic
  const galaxyBgColor = isDark ? '#FFFFFF' : '#000000';
  const galaxyStarColors = isDark 
    ? ['#000000', '#1f2937', '#374151', '#4b5563', '#1e1b4b', '#312e81'] // Dark stars for white bg
    : ['#ffffff', '#60a5fa', '#a855f7', '#22d3ee', '#f87171', '#fbbf24', '#34d399']; // Vibrant stars for black bg

  const loaderColor = isDark ? 'border-black' : 'border-white';
  const loaderBaseColor = isDark ? 'border-black/20' : 'border-white/20';
  const textColor = isDark ? 'text-black/80' : 'text-white/80';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }} // Popped State
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group rounded-3xl mb-6 w-full`} 
      style={{
        // Move Aspect Ratio Hack to the Container to force layout height
        height: 0,
        paddingBottom: paddingBottom,
        
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'transparent', 
        ...borderColor,
        boxShadow: frameShadow, // Frame is always popped now
        background: bgStyle
      }}
    >
      {/* Inner Galaxy Container */}
      <div 
        className={`absolute inset-0 m-4 overflow-hidden rounded-2xl bg-black`}
        style={{ 
            boxShadow: screenShadow // Screen is inset (sunken)
        }}
      >
         {/* Canvas Starfield */}
         <GalaxyCanvas 
            backgroundColor={galaxyBgColor}
            starColors={galaxyStarColors}
         />
         
         {/* Content Wrapper - Absolute to fill the padded area */}
         <div className="absolute inset-0 w-full h-full pointer-events-none">
             
             {/* Status Spinner */}
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4">
                <div className="relative w-12 h-12">
                  {/* Thinner border to reduce 'glow' bloom */}
                  <div className={`absolute inset-0 rounded-full border-2 ${loaderBaseColor}`} />
                  <div className={`absolute inset-0 rounded-full border-2 ${loaderColor} border-t-transparent animate-spin`} />
                </div>
                
                <div className="text-center">
                   {/* Removed animate-pulse to stop the flashing/glowing effect */}
                   <p className={`text-xs font-bold uppercase tracking-widest ${textColor}`}>
                      {status === 'generating' ? 'Synthesizing...' : 'Developing...'}
                   </p>
                </div>
             </div>
         </div>

      </div>
    </motion.div>
  );
};

export const GeneratorCard = React.memo(GeneratorCardComponent);
