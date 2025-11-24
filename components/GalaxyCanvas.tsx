import React, { useRef, useEffect } from 'react';

interface GalaxyCanvasProps {
  className?: string;
  backgroundColor?: string;
  starColors?: string[];
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  color: string;
}

export const GalaxyCanvas: React.FC<GalaxyCanvasProps> = ({ 
  className,
  backgroundColor = '#000000',
  starColors = ['#ffffff', '#60a5fa', '#a855f7', '#22d3ee', '#f87171', '#fbbf24', '#34d399']
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    // Increased density to 1000 to ensure rich starfield in small windows
    const starCount = 1000; 

    // Universe dimensions (screen size)
    let universeWidth = window.innerWidth;
    let universeHeight = window.innerHeight;

    const initStars = () => {
      stars = [];
      // Spread stars across the entire viewport height/width, not just the canvas
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * universeWidth,
          y: Math.random() * universeHeight,
          size: Math.random() * 1.5 + 0.5,
          // Slowed down to match CSS drift speed (~8px/sec) for seamless galaxy feel
          speed: (Math.random() * 0.2 + 0.02), 
          opacity: Math.random(),
          baseOpacity: Math.random() * 0.5 + 0.3,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          color: starColors[Math.floor(Math.random() * starColors.length)]
        });
      }
    };

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        // Update universe bounds
        universeWidth = window.innerWidth;
        universeHeight = window.innerHeight;
        
        // Re-init only if empty (first run) to avoid resetting positions on minor resizes
        if (stars.length === 0) initStars();
      }
    };

    const render = () => {
      if (!ctx) return;
      
      // Get the canvas position relative to the viewport
      const rect = canvas.getBoundingClientRect();
      const scrollOffset = rect.top; 

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        // Move
        star.x -= star.speed; 
        
        // Wrap around Universe dimensions
        if (star.x < 0) {
          star.x = universeWidth;
          star.y = Math.random() * universeHeight;
        }

        // Twinkle
        star.opacity += star.twinkleSpeed;
        if (star.opacity > 1 || star.opacity < star.baseOpacity) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }

        // Calculate "Pinned" position
        // We map the star's absolute universe position to the canvas relative position
        const drawX = star.x - rect.left; // Also fix X if the card moves horizontally (e.g. layout shift)
        const drawY = star.y - scrollOffset; // Counteract scrolling

        // Only draw if visible within the canvas bounds
        if (drawX > -5 && drawX < canvas.width + 5 && drawY > -5 && drawY < canvas.height + 5) {
            ctx.beginPath();
            ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.globalAlpha = star.opacity;
            ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    // Init
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Initial size
    render(); // Start loop

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [backgroundColor, starColors]); // Re-run if theme/colors change

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ background: backgroundColor }}
    />
  );
};
