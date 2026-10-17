import React, { useRef, useEffect, useState } from 'react';
import { MiniMapEnemy } from '../game/engine';
import { Radio, Maximize2, Minimize2 } from 'lucide-react';

interface MiniMapProps {
  playerPos?: { x: number; y: number; angle: number };
  radarEnemies?: MiniMapEnemy[];
  arenaRadius?: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  playerPos,
  radarEnemies = [],
  arenaRadius = 110,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const sweepAngleRef = useRef(0);

  // Radar detection range in world units
  const radarRange = isExpanded ? 90 : 65;
  const size = isExpanded ? 160 : 116;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderRadar = () => {
      sweepAngleRef.current = (sweepAngleRef.current + 0.04) % (Math.PI * 2);
      const sweepAngle = sweepAngleRef.current;

      const center = size / 2;
      const radius = center - 6;

      ctx.clearRect(0, 0, size, size);

      // 1. Radar Background Circle
      ctx.fillStyle = 'rgba(5, 7, 14, 0.85)';
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Concentric Range Rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1;
      [0.33, 0.66, 1].forEach((fraction) => {
        ctx.beginPath();
        ctx.arc(center, center, radius * fraction, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 3. Crosshair Axes
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.moveTo(center, center - radius);
      ctx.lineTo(center, center + radius);
      ctx.moveTo(center - radius, center);
      ctx.lineTo(center + radius, center);
      ctx.stroke();

      // 4. Rotating Radar Sweep Beam
      const sweepGrad = ctx.createRadialGradient(center, center, 0, center, center, radius);
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, sweepAngle - 0.55, sweepAngle);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Leading beam edge line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + Math.cos(sweepAngle) * radius, center + Math.sin(sweepAngle) * radius);
      ctx.stroke();
      ctx.restore();

      // 5. Arena Boundary relative to Player
      if (playerPos) {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;

        // Draw arena boundary box relative to player
        const scale = radius / radarRange;
        const arenaBoxMinX = center + (-arenaRadius - playerPos.x) * scale;
        const arenaBoxMaxX = center + (arenaRadius - playerPos.x) * scale;
        const arenaBoxMinY = center + (-arenaRadius - playerPos.y) * scale;
        const arenaBoxMaxY = center + (arenaRadius - playerPos.y) * scale;

        ctx.beginPath();
        ctx.rect(
          arenaBoxMinX,
          arenaBoxMinY,
          arenaBoxMaxX - arenaBoxMinX,
          arenaBoxMaxY - arenaBoxMinY
        );
        ctx.stroke();
        ctx.restore();
      }

      // 6. Draw Enemies
      if (playerPos && radarEnemies.length > 0) {
        radarEnemies.forEach((enemy) => {
          const dx = enemy.x - playerPos.x;
          const dy = enemy.y - playerPos.y;
          const dist = Math.hypot(dx, dy);

          // Calculate normalized radar position
          const scale = radius / radarRange;
          const ex = center + dx * scale;
          const ey = center + dy * scale;

          // Clamp to radar circle
          const radarDist = Math.hypot(ex - center, ey - center);
          if (radarDist <= radius - 2) {
            ctx.save();
            if (enemy.type === 'boss') {
              // Boss Marker: Big Pulsing Amber Circle + Core
              ctx.fillStyle = '#fbbf24';
              ctx.shadowColor = '#fbbf24';
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.arc(ex, ey, 5, 0, Math.PI * 2);
              ctx.fill();

              // Ring
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(ex, ey, 7.5, 0, Math.PI * 2);
              ctx.stroke();
            } else if (enemy.type === 'brute') {
              // Brute: Red Square
              ctx.fillStyle = '#f87171';
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 6;
              ctx.fillRect(ex - 3, ey - 3, 6, 6);
            } else if (enemy.type === 'disruptor') {
              // Disruptor: Cyan Diamond
              ctx.fillStyle = '#38bdf8';
              ctx.shadowColor = '#0284c7';
              ctx.shadowBlur = 5;
              ctx.beginPath();
              ctx.moveTo(ex, ey - 3.5);
              ctx.lineTo(ex + 3.5, ey);
              ctx.lineTo(ex, ey + 3.5);
              ctx.lineTo(ex - 3.5, ey);
              ctx.closePath();
              ctx.fill();
            } else {
              // Scout: Purple Dot
              ctx.fillStyle = '#c084fc';
              ctx.shadowColor = '#a855f7';
              ctx.shadowBlur = 4;
              ctx.beginPath();
              ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          } else {
            // Out of range perimeter blip on the ring edge
            const angle = Math.atan2(ey - center, ex - center);
            const edgeX = center + Math.cos(angle) * (radius - 3);
            const edgeY = center + Math.sin(angle) * (radius - 3);

            ctx.save();
            ctx.fillStyle = enemy.type === 'boss' ? '#fbbf24' : '#ef4444';
            ctx.beginPath();
            ctx.arc(edgeX, edgeY, enemy.type === 'boss' ? 3.5 : 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
      }

      // 7. Player Center Indicator (Cyan Arrow)
      ctx.save();
      ctx.translate(center, center);
      if (playerPos) {
        ctx.rotate(playerPos.angle);
      }

      // Arrow ship icon
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(5, 0); // nose pointing in direction of angle
      ctx.lineTo(-4, -3.5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 8. Outer Border Ring
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [playerPos, radarEnemies, arenaRadius, isExpanded, size, radarRange]);

  return (
    <div className="relative flex flex-col items-center bg-black/70 border border-neutral-800/90 rounded-2xl p-2 shadow-lg pointer-events-auto">
      {/* Mini-map Header */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1 px-1">
        <span className="flex items-center gap-1 text-cyan-400 font-bold">
          <Radio className="w-3 h-3 text-cyan-400" />
          <span>RADAR</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-rose-400 font-semibold tabular-nums">
            {radarEnemies.length} HOSTILES
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neutral-500 hover:text-white transition-colors p-0.5 cursor-pointer"
            title={isExpanded ? '레이더 축소' : '레이더 확대'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Radar Canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      />

      {/* Legend / Range Indicator */}
      <div className="w-full flex items-center justify-between text-[9px] font-mono text-neutral-500 mt-1 px-1">
        <span>R: {radarRange}m</span>
        <span className="text-cyan-400/80">CENTER: CORE</span>
      </div>
    </div>
  );
};
