import React from 'react';
import { motion, useMotionValue, animate, useSpring } from 'framer-motion';
import { useThemeStyles } from './NeuComponents';
import { GalaxyCanvas } from './GalaxyCanvas';
import { NumberTicker } from './NumberTicker'; // Assuming this exists or we use simple text

interface GeneratorCardProps {
  aspectRatio?: string;
  status?: 'queued' | 'generating' | 'complete';
  onReveal?: () => void;
  resultContent?: string;
  // Animation phase persistence
  animationPhase?: 'warmup' | 'cruise' | 'deceleration' | 'revealed';
  onPhaseChange?: (phase: 'warmup' | 'cruise' | 'deceleration' | 'revealed') => void;
}

const getPaddingBottom = (ratio: string = '1:1') => {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return '100%';
  return `${(h / w) * 100}%`;
};

const GeneratorCardComponent: React.FC<GeneratorCardProps> = ({
  aspectRatio = '1:1',
  status = 'generating',
  onReveal,
  resultContent,
  animationPhase = 'warmup',
  onPhaseChange
}) => {
  const { theme, styles } = useThemeStyles();
  const isDark = theme === 'dark';

  // Animation State
  const warpFactor = useMotionValue(0);
  const [progress, setProgress] = React.useState(0);
  const [stageText, setStageText] = React.useState('Initializing...');

  // Simulation Logic
  const statusRef = React.useRef(status);
  React.useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Fix for Stale Closure: Keep track of the latest onReveal callback
  const onRevealRef = React.useRef(onReveal);
  React.useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);

  // Keep onPhaseChange ref fresh
  const onPhaseChangeRef = React.useRef(onPhaseChange);
  React.useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
  }, [onPhaseChange]);

  React.useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      // PHASE-AWARE: Skip to the correct phase based on prop
      const startPhase = animationPhase;

      // STAGE 1: Warmup (only if starting from warmup)
      if (startPhase === 'warmup') {
        setStageText('Initializing Engines...');
        warpFactor.set(0);

        const startTime = Date.now();
        while (Date.now() - startTime < 1500) {
          if (!isMounted) return;
          if (statusRef.current === 'complete') break;

          const elapsed = Date.now() - startTime;
          setProgress(Math.floor((elapsed / 1500) * 10));
          await new Promise(r => setTimeout(r, 50));
        }
      }

      // STAGE 2 & 3: Acceleration + Cruise
      if (!isMounted) return;

      if (startPhase === 'warmup' || startPhase === 'cruise') {
        // If resuming cruise, set warp immediately
        if (startPhase === 'cruise') {
          warpFactor.set(1);
          setProgress(50); // Resume mid-progress
        }

        // Report phase change to parent
        if (startPhase === 'warmup') {
          onPhaseChangeRef.current?.('cruise');
        }

        if (statusRef.current === 'generating') {
          setStageText('Engaging Hyperdrive...');
          if (startPhase === 'warmup') {
            animate(warpFactor, 1, { duration: 0.8, ease: "circIn" });
          }

          setStageText('Synthesizing...');
          let currentProgress = startPhase === 'cruise' ? 50 : 10;

          while (isMounted && statusRef.current === 'generating') {
            if (currentProgress < 90) {
              currentProgress += 0.5;
            }
            setProgress(Math.floor(currentProgress));
            await new Promise(r => setTimeout(r, 50));
          }
        }
      }

      if (!isMounted) return;

      // STAGE 4: Deceleration
      onPhaseChangeRef.current?.('deceleration');
      setStageText('Finalizing...');
      setProgress(100);

      warpFactor.stop();

      if (warpFactor.get() < 0.5) {
        await new Promise<void>(resolve => {
          animate(warpFactor, 1, { duration: 0.5, ease: "circIn", onComplete: () => resolve() });
        });
      }

      await new Promise<void>(resolve => {
        animate(warpFactor, 0, {
          type: "spring",
          stiffness: 30,
          damping: 20,
          onComplete: () => resolve()
        });
      });

      // STAGE 5: Pause
      await new Promise(r => setTimeout(r, 800));

      // STAGE 6: Reveal
      onPhaseChangeRef.current?.('revealed');
      if (onRevealRef.current) onRevealRef.current();
    };

    // Start animation based on animationPhase, not just status
    // This ensures debug mode (which sets status to 'complete' instantly) still shows animation
    if (animationPhase !== 'revealed') {
      runSequence();
    } else {
      // Already revealed, nothing to animate
      onPhaseChangeRef.current?.('revealed');
      if (onRevealRef.current) onRevealRef.current();
    }

    return () => {
      isMounted = false;
      warpFactor.stop();
    };
  }, []); // Run once on mount
  // Liquid Mode Removed
  //   ? '6px 6px 12px #000000, -6px -6px 12px #2b2e33'
  //   : '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff';

  // const bgStyle = isDark ? '#0F1115' : '#E0E5EC';
  const paddingBottom = getPaddingBottom(aspectRatio);

  // Border Cheat
  // const borderColor = isDark
  //   ? {
  //     borderTopColor: 'rgba(255,255,255,0.05)',
  //     borderLeftColor: 'rgba(255,255,255,0.05)',
  //     borderRightColor: 'rgba(0,0,0,0.2)',
  //     borderBottomColor: 'rgba(0,0,0,0.2)'
  //   }
  //   : {
  //     borderTopColor: 'rgba(255,255,255,0.8)',
  //     borderLeftColor: 'rgba(255,255,255,0.8)',
  //     borderRightColor: 'rgba(163,177,198,0.1)',
  //     borderBottomColor: 'rgba(163,177,198,0.1)'
  //   };

  // Galaxy Theme Logic
  const galaxyBgColor = isDark ? '#FFFFFF' : '#000000';
  const galaxyStarColors = React.useMemo(() => isDark
    ? ['#000000', '#1f2937', '#374151', '#4b5563', '#1e1b4b', '#312e81'] // Dark stars for white bg
    : ['#ffffff', '#60a5fa', '#a855f7', '#22d3ee', '#f87171', '#fbbf24', '#34d399'], [isDark]); // Vibrant stars for black bg

  const loaderColor = isDark ? 'border-black' : 'border-white';
  const loaderBaseColor = isDark ? 'border-black/20' : 'border-white/20';
  const textColor = isDark ? 'text-black/80' : 'text-white/80';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }} // Popped State
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        relative group rounded-3xl mb-6 w-full
        ${styles.shadowOut}
        ${styles.bg}
      `}
      style={{
        // Move Aspect Ratio Hack to the Container to force layout height
        height: 0,
        paddingBottom: paddingBottom,

        // In Shape Mode: Solid Color. In Content Mode: Shadow (handled by class).
        // SYNCED COLOR: Using #0F1115 (Theme BG) to match LiquidSelector.
        // backgroundColor: isShape ? (isDark ? '#0F1115' : '#E0E5EC') : undefined, // Removed liquid mode
        // boxShadow: isShape ? 'none' : undefined // Removed liquid mode
      }}
    >
      {/* Inner Galaxy Container */}
      <div
        className={`absolute inset-0 m-6 overflow-hidden rounded-2xl bg-black ${styles.shadowIn}`}
        // DEBUG: Visual Flash
        style={{
          // Manual shadow removed in favor of styles.shadowIn
        }}
      >
        {/* Canvas Starfield */}
        <GalaxyCanvas
          backgroundColor={galaxyBgColor}
          starColors={galaxyStarColors}
          warpFactor={warpFactor}
        />

        {/* Content Wrapper - Absolute to fill the padded area */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {/* UI Removed for Pure Galaxy Experience */}
        </div>

      </div>
    </motion.div>
  );
};

export const GeneratorCard = React.memo(GeneratorCardComponent);
