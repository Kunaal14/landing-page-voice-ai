
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  color?: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, color = '#6366f1' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: Provide an initial value to useRef to satisfy the 'Expected 1 arguments, but got 0' error.
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (isActive) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        const centerY = height / 2;
        const amplitude = isActive ? 15 : 2;

        for (let x = 0; x < width; x++) {
          const y = centerY + Math.sin(x * 0.05 + phase) * amplitude * Math.sin(x * 0.01);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
        phase += 0.1;
      } else {
        // Flat line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isActive, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={40} 
      className="w-full max-w-[200px] h-10 opacity-80"
    />
  );
};

export default Visualizer;
