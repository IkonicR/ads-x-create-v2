import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles } from './NeuComponents';
import { Trash2 } from 'lucide-react';
import { LiquidMetal } from '@paper-design/shaders-react';

interface GeneratorCardProps {
  isAdmin?: boolean;
  onKill?: () => void;
  aspectRatio?: string;
  status?: 'queued' | 'generating' | 'complete';
  onReveal?: () => void;
  resultContent?: string;
  // Animation phase persistence
  animationPhase?: 'warmup' | 'cruise' | 'deceleration' | 'revealed';
  onPhaseChange?: (phase: 'warmup' | 'cruise' | 'deceleration' | 'revealed') => void;
  // Progress callback for parent tracking
  onProgressUpdate?: (progress: number) => void;
  initialProgress?: number; // <--- NEW: Persistent progress for tab-switching
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
  onPhaseChange,
  onProgressUpdate,
  initialProgress = 0,
  isAdmin,
  onKill
}) => {
  const { theme, styles } = useThemeStyles();
  const isDark = theme === 'dark';

  // State Management
  const [displayProgress, setDisplayProgress] = useState(initialProgress);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Shader State (Reactive to 60fps loop)
  const [shader, setShader] = useState({
    rep: 1.2,
    speed: 0.2,
    dist: 0.25,
    scale: 1.0,
    shift: 0,
    angle: 0,
    contour: 0.2,
    opacity: 1 // Internal alpha for cross-fade
  });

  // Refs for logic persistence
  const statusRef = useRef(status);
  const isImageLoadedRef = useRef(false);
  const progressRef = useRef(initialProgress);
  const phaseRef = useRef(animationPhase);
  const revealProgressRef = useRef(0); // 0 -> 1 internal cross-fade

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isImageLoadedRef.current = isImageLoaded; }, [isImageLoaded]);
  useEffect(() => { phaseRef.current = animationPhase; }, [animationPhase]);

  // Image Preloader
  useEffect(() => {
    if (resultContent && !isImageLoaded) {
      const img = new Image();
      img.src = resultContent;
      img.onload = () => setIsImageLoaded(true);
      img.onerror = () => {
        console.error("Image load failed, proceeding anyway...");
        setIsImageLoaded(true);
      };
    }
  }, [resultContent, isImageLoaded]);

  // Callback Refs
  const onRevealRef = useRef(onReveal);
  useEffect(() => { onRevealRef.current = onReveal; }, [onReveal]);
  const onPhaseChangeRef = useRef(onPhaseChange);
  useEffect(() => { onPhaseChangeRef.current = onPhaseChange; }, [onPhaseChange]);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  useEffect(() => { onProgressUpdateRef.current = onProgressUpdate; }, [onProgressUpdate]);

  // CORE ENGINE: Single 60fps RAF Loop
  useEffect(() => {
    let isMounted = true;
    let rafId: number;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      if (!isMounted) return;

      // 1. UPDATE PROGRESS LOGIC
      const state = statusRef.current;
      const currentProgress = progressRef.current;

      if (state === 'generating' && currentProgress < 95) {
        // DRIFT: Standard premium slow climb
        const target = 95;
        const diff = target - currentProgress;
        const increment = Math.max(0.001, diff * 0.0008);
        progressRef.current += increment;
      } else if (state === 'complete' || currentProgress >= 95) {
        // SPRINT: API finished OR we reached the wall - smooth continuous slide to 100
        const target = 100;
        const diff = target - currentProgress;
        const increment = Math.max(0.05, diff * 0.02);
        progressRef.current = Math.min(100, progressRef.current + increment);
      }

      // Check for image load buffer at 99.9%
      if (progressRef.current > 99.8 && !isImageLoadedRef.current) {
        progressRef.current = 99.8; // Hold until browser actually has the bits
      }

      // 2. CALCULATE SHADER TARGETS (60FPS Physics Engine)
      const p = progressRef.current / 100;
      const ph = phaseRef.current;

      // Update Reveal Momentum
      if (ph === 'deceleration' && progressRef.current >= 100) {
        // Start the internal reveal ramp (0 -> 1 over ~1s)
        revealProgressRef.current = Math.min(1, revealProgressRef.current + 0.015);
      }
      const rp = revealProgressRef.current;

      // SCALE: Strictly 1.0 (Full Bleed)
      // REP: 1.2 -> 2.5 (Thick Lines)
      // CHROMATIC SURGE: Powerful shift payoff in the final 5%
      const surgeFactor = p > 0.95 ? Math.pow((p - 0.95) / 0.05, 2) : 0;

      const targetScale = 1.05; // v4.1 OVERSCAN: Zoom in slightly to kill edge gaps
      const targetRep = 1.2 + (p * 1.3) + (surgeFactor * 1.5); // RESTORED: Vibrant ending beat

      // PHYSICS PIVOT (v4.0): Kill contour/shift, focus on distortion energy
      const targetAngle = p * 360; // Churning vortex
      const targetContour = 0.0; // PURE ZERO

      // Speed and Dist drop as RevealProgress increases (Crystallization)
      // RESTORED: surgeFactor for the vibrant ending beat
      const targetSpeed = (0.2 + (p * 1.3) + (surgeFactor * 2.5)) * (1 - rp * 0.9);
      const targetDist = (0.1 + (p * 1.4) + (surgeFactor * 0.5)) * (1 - rp * 0.8);
      const targetShift = surgeFactor * 1.5; // RESTORED: Vibrant chromatic surge payoff
      const targetOpacity = 1 - (rp * rp); // Exponential fade out

      // 3. LERP & COMMIT
      setShader(prev => ({
        scale: lerp(prev.scale, targetScale, 0.1),
        rep: lerp(prev.rep, targetRep, 0.1),
        speed: lerp(prev.speed, targetSpeed, 0.1),
        dist: lerp(prev.dist, targetDist, 0.1),
        shift: lerp(prev.shift, targetShift, 0.15),
        angle: lerp(prev.angle ?? 0, targetAngle, 0.05),
        contour: lerp(prev.contour ?? 0.2, targetContour, 0.1),
        opacity: lerp(prev.opacity, targetOpacity, 0.1)
      }));

      // 4. UPDATE UI STATE
      const displayVal = Math.floor(progressRef.current);
      if (displayVal !== displayProgress) {
        setDisplayProgress(displayVal);
        onProgressUpdateRef.current?.(displayVal);
      }

      rafId = requestAnimationFrame(tick);
    };

    // Sequential Phase Logic
    const runPhases = async () => {
      // STAGE 1: Warmup
      await new Promise(r => setTimeout(r, 2000));
      if (!isMounted) return;

      // STAGE 2: Cruising
      onPhaseChangeRef.current?.('cruise');

      // Loop waits for progressRef to hit 100 via the tick loop + status updates
      while (isMounted && progressRef.current < 100) {
        await new Promise(r => setTimeout(r, 100));
      }

      if (!isMounted) return;

      // STAGE 3: Final Victory Beat & Internal Reveal
      // This is where the Chromatic Surge hits its peak and then cross-fades
      onPhaseChangeRef.current?.('deceleration');

      // 1. Peak Energy Hold
      await new Promise(r => setTimeout(r, 600));

      // 2. Internal Reveal Wait (Wait for the tick loop to finish the crossfade)
      while (isMounted && revealProgressRef.current < 0.95) {
        await new Promise(r => setTimeout(r, 50));
      }

      if (!isMounted) return;
      onPhaseChangeRef.current?.('revealed');
      if (onRevealRef.current) onRevealRef.current();
    };

    rafId = requestAnimationFrame(tick);
    runPhases();

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  const tintColor = '#94ca42';
  const currentPaddingBottom = getPaddingBottom(aspectRatio);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative group rounded-3xl mb-6 w-full ${styles.shadowOut} ${styles.bg}`}
      style={{ height: 0, paddingBottom: currentPaddingBottom }}
    >
      <div className={`absolute inset-0 m-6 overflow-hidden rounded-2xl bg-black ${styles.shadowIn}`}>
        {/* IMAGE LAYER (Revealing underneath) */}
        {resultContent && (
          <motion.img
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{
              opacity: revealProgressRef.current > 0.1 ? 1 : 0,
              scale: 1,
              filter: `blur(${(1 - revealProgressRef.current) * 20}px)`
            }}
            transition={{ duration: 0.1 }}
            src={resultContent}
            alt="Generated Result"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* SHADER CORE (Fading out) */}
        <div style={{
          opacity: shader.opacity,
          position: 'absolute',
          inset: '-2px', // v4.1 BLEED: Pull edges past the mask
          transform: 'scale(1.02)', // v4.1 OVERSCAN: Ensure full coverage
          pointerEvents: 'none'
        }}>
          <LiquidMetal
            colorBack={isDark ? '#0a0a0a' : '#050505'}
            colorTint={tintColor}
            shape="none"
            repetition={shader.rep}
            softness={0.6}
            distortion={shader.dist}
            speed={shader.speed}
            scale={shader.scale}
            // @ts-ignore
            shiftRed={shader.shift}
            // @ts-ignore
            shiftBlue={-shader.shift}
            // @ts-ignore
            angle={shader.angle}
            // @ts-ignore
            contour={shader.contour}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
        </div>

        {/* UI OVERLAY */}
        <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
          {displayProgress < 100 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center"
            >
              <span className="font-mono text-2xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] tracking-tight">
                {displayProgress}%
              </span>
            </motion.div>
          )}

          {/* ADMIN KILL SWITCH */}
          {isAdmin && onKill && displayProgress < 100 && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onKill();
                }}
                className="p-2 bg-red-500/20 hover:bg-red-500/80 backdrop-blur-md rounded-lg text-white transition-all hover:scale-105 active:scale-95 shadow-lg pointer-events-auto border border-white/10"
                title="Kill Stuck Job (Admin Only)"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const GeneratorCard = React.memo(GeneratorCardComponent);
