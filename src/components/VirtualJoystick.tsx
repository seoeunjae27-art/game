import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (vx: number, vy: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const baseCenterRef = useRef<{ x: number; y: number } | null>(null);

  const radius = 50; // max knob travel distance

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      setActive(true);

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      baseCenterRef.current = { x: centerX, y: centerY };

      updateKnob(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          updateKnob(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setActive(false);
          setKnobPos({ x: 0, y: 0 });
          onMove(0, 0);
          break;
        }
      }
    };

    const updateKnob = (clientX: number, clientY: number) => {
      if (!baseCenterRef.current) return;
      const dx = clientX - baseCenterRef.current.x;
      const dy = clientY - baseCenterRef.current.y;
      const dist = Math.hypot(dx, dy);

      const deadzone = 6;
      if (dist < deadzone) {
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
        return;
      }

      const clampedDist = Math.min(radius, dist);
      const angle = Math.atan2(dy, dx);
      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;

      setKnobPos({ x: knobX, y: knobY });

      // Normalized vector (-1 to 1)
      const normX = knobX / radius;
      const normY = knobY / radius;
      onMove(normX, normY);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-32 h-32 flex items-center justify-center rounded-full pointer-events-auto touch-none select-none"
    >
      {/* Outer Glow Ring */}
      <div
        className={`w-28 h-28 rounded-full border-2 transition-all flex items-center justify-center ${
          active
            ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
            : 'bg-black/40 border-neutral-700/60'
        }`}
      >
        {/* Crosshair guide lines */}
        <div className="absolute w-full h-[1px] bg-neutral-700/40" />
        <div className="absolute h-full w-[1px] bg-neutral-700/40" />

        {/* Joystick Thumb Knob */}
        <div
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-transform ${
            active
              ? 'bg-gradient-to-tr from-cyan-500 to-indigo-500 border-white shadow-[0_0_15px_rgba(56,189,248,0.6)]'
              : 'bg-neutral-800 border-neutral-600'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          <div className="w-4 h-4 rounded-full bg-white/60" />
        </div>
      </div>
    </div>
  );
};
