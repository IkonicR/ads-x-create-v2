import React, { useRef, useEffect } from 'react';
import { MotionValue } from 'framer-motion';

interface GalaxyCanvasProps {
  className?: string;
  backgroundColor?: string;
  starColors?: string[];
  warpFactor?: number | MotionValue<number>; // 0 to 1
}

interface Star {
  x: number;
  y: number;
  z: number; // Depth for 3D feel
  size: number;
  baseSpeed: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  color: string; // Original Hex
  r: number;
  g: number;
  b: number;
  visibilityThreshold: number; // 0 to 1, determines when star appears
}

export const GalaxyCanvasComponent: React.FC<GalaxyCanvasProps> = ({
  className,
  backgroundColor = '#000000',
  starColors = ['#ffffff', '#60a5fa', '#a855f7', '#22d3ee', '#f87171', '#fbbf24', '#34d399'],
  warpFactor = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper to get current warp value regardless of type
  const getWarp = () => {
    if (typeof warpFactor === 'number') return warpFactor;
    return (warpFactor as MotionValue<number>).get();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    const starCount = 1000;

    let universeWidth = window.innerWidth;
    let universeHeight = window.innerHeight;

    // Helper to hex to rgb
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 255, b: 255 };
    };

    const initStars = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const color = starColors[Math.floor(Math.random() * starColors.length)];
        const rgb = hexToRgb(color);
        stars.push({
          x: Math.random() * universeWidth,
          y: Math.random() * universeHeight,
          z: Math.random() * 2 + 0.5, // Depth factor
          size: Math.random() * 1.5 + 0.5,
          baseSpeed: (Math.random() * 0.2 + 0.05),
          opacity: Math.random(),
          baseOpacity: Math.random() * 0.5 + 0.3,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          color: color,
          r: rgb.r,
          g: rgb.g,
          b: rgb.b,
          visibilityThreshold: Math.random() // Random threshold
        });
      }
    };

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        universeWidth = window.innerWidth;
        universeHeight = window.innerHeight;
        if (stars.length === 0) initStars();
      }
    };

    const render = () => {
      if (!ctx) return;

      const currentWarp = getWarp();

      // DYNAMIC DENSITY
      // Idle (Warp 0): 30% visible
      // Warp 1: 100% visible
      const currentDensity = 0.3 + (currentWarp * 0.7);

      // Clear
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const rect = canvas.getBoundingClientRect();
      const scrollOffset = rect.top;

      // Target Color (Cyan/White Mix for Hyperspace)
      // Let's aim for a bright Cyan-White: rgb(200, 255, 255)
      const targetR = 200;
      const targetG = 255;
      const targetB = 255;

      stars.forEach(star => {
        // VISIBILITY CHECK
        if (star.visibilityThreshold > currentDensity) return;

        // Calculate Speed
        const speedMultiplier = 1 + (currentWarp * 150);
        const currentSpeed = star.baseSpeed * speedMultiplier;

        // Move
        star.x -= currentSpeed;

        // Wrap
        if (star.x < 0) {
          star.x = universeWidth;
          star.y = Math.random() * universeHeight;
        }

        // Twinkle (suppressed at high speed)
        if (currentWarp < 0.1) {
          star.opacity += star.twinkleSpeed;
          if (star.opacity > 1 || star.opacity < star.baseOpacity) {
            star.twinkleSpeed = -star.twinkleSpeed;
          }
        } else {
          star.opacity = 1; // Full brightness in warp
        }

        // Draw
        const drawX = star.x - rect.left;
        const drawY = star.y - scrollOffset;

        if (drawX > -100 && drawX < canvas.width + 100 && drawY > -100 && drawY < canvas.height + 100) {
          ctx.beginPath();

          // PRESERVE ORIGINAL COLORS
          // No shifting, no phases. Just the diverse galaxy colors.
          ctx.fillStyle = star.color;

          if (currentWarp > 0.1) {
            // STREAK MODE
            const streakLength = currentSpeed * (currentWarp * 6); // Increased from 2 to 6 for dramatic stretch
            ctx.ellipse(drawX + streakLength / 2, drawY, streakLength / 2, star.size / 2, 0, 0, 2 * Math.PI);
          } else {
            // DOT MODE
            ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
          }

          ctx.globalAlpha = star.opacity;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [backgroundColor, starColors]); // Intentionally omitting warpFactor to avoid restart

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ background: backgroundColor }}
    />
  );
};

export const GalaxyCanvas = React.memo(GalaxyCanvasComponent);
