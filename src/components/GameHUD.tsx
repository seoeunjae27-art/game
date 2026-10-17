import React from 'react';
import { HUDData } from '../game/engine';
import { Volume2, VolumeX, Shield, Zap, Flame, Pause, Target, Crosshair } from 'lucide-react';
import { VirtualJoystick } from './VirtualJoystick';
import { MiniMap } from './MiniMap';

interface GameHUDProps {
  hudData: HUDData | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerDash: () => void;
  onTriggerNova: () => void;
  onJoystickMove: (vx: number, vy: number) => void;
  autoAim: boolean;
  onToggleAutoAim: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hudData,
  isMuted,
  onToggleMute,
  onPause,
  onTriggerDash,
  onTriggerNova,
  onJoystickMove,
  autoAim,
  onToggleAutoAim,
}) => {
  if (!hudData) return null;

  const hpPct = Math.max(0, Math.min(100, (hudData.health / hudData.maxHealth) * 100));
  const xpPct = Math.max(0, Math.min(100, (hudData.xp / hudData.nextXp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none p-3 sm:p-6 flex flex-col justify-between z-20 overflow-hidden">
      {/* Top Perimeter Bar */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left: Health Cluster */}
        <div className="flex flex-col gap-1 bg-black/60 p-2 sm:p-3 rounded-xl border border-neutral-800/90 shadow-md min-w-[140px] sm:min-w-[200px]">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-neutral-300">
            <span className="flex items-center gap-1 font-bold text-rose-400">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>CORE HP</span>
            </span>
            <span className="tabular-nums font-semibold">
              {hudData.health}/{hudData.maxHealth}
            </span>
          </div>

          <div className="w-full h-2 sm:h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <div
              className={`h-full transition-all duration-150 ${
                hpPct > 50 ? 'bg-cyan-500' : hpPct > 25 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>

        {/* Top-Center: Level & XP Bar */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-2 flex flex-col items-center gap-0.5 sm:gap-1">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono text-cyan-300 font-bold">
            <span>LV. {hudData.level}</span>
            <span className="text-neutral-500">·</span>
            <span className="tabular-nums text-neutral-400">
              EXP {hudData.xp}/{hudData.nextXp}
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-900/90 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-150"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Top-Right: Wave, Score, Controls, and MiniMap */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="bg-black/60 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-neutral-800/90 text-right">
              <div className="text-[10px] sm:text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                WAVE <span className="text-cyan-400 font-bold tabular-nums">{hudData.wave}</span>
              </div>
              <div className="text-xs sm:text-base font-orbitron font-bold text-amber-400 tabular-nums">
                {hudData.score.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-1 pointer-events-auto">
              {/* Auto Aim Toggle */}
              <button
                onClick={onToggleAutoAim}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  autoAim
                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
                    : 'bg-black/60 border-neutral-800 text-neutral-500 hover:text-white'
                }`}
                title={autoAim ? '자동 조준 켜짐' : '수동 조준'}
              >
                <Crosshair className="w-4 h-4" />
              </button>

              <button
                onClick={onPause}
                className="p-2 rounded-xl bg-black/60 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="일시정지 (Esc)"
              >
                <Pause className="w-4 h-4" />
              </button>
              <button
                onClick={onToggleMute}
                className="p-2 rounded-xl bg-black/60 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? '음소거 해제' : '음소거'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Real-time MiniMap Radar */}
          <MiniMap
            playerPos={hudData.playerPos}
            radarEnemies={hudData.radarEnemies}
            arenaRadius={hudData.arenaRadius}
          />
        </div>
      </div>

      {/* Bottom Perimeter Bar: Virtual Joystick & Touch Action Buttons */}
      <div className="flex items-end justify-between gap-4 pb-2 sm:pb-0">
        {/* Bottom-Left: Virtual Joystick for Movement */}
        <div className="pointer-events-auto">
          <VirtualJoystick onMove={onJoystickMove} />
        </div>

        {/* Bottom-Right: Big Mobile Thumb Action Buttons */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 pointer-events-auto">
          {/* Nova Button (Q) */}
          <button
            onClick={onTriggerNova}
            className={`w-14 h-14 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-2xl sm:rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all active:scale-95 cursor-pointer ${
              hudData.novaReady
                ? 'bg-purple-950/70 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(192,132,252,0.4)]'
                : 'bg-black/60 border-neutral-800 text-neutral-600'
            }`}
          >
            <Flame className={`w-5 h-5 sm:w-4 sm:h-4 ${hudData.novaReady ? 'text-purple-400' : 'text-neutral-600'}`} />
            <div className="text-center sm:text-left font-mono">
              <div className="text-[9px] sm:text-[10px] text-neutral-400">NOVA</div>
              <div className="text-[10px] sm:text-xs font-bold tabular-nums">
                {hudData.novaReady ? 'READY' : `${Math.round(hudData.novaCooldownProgress * 100)}%`}
              </div>
            </div>
          </button>

          {/* Dash Button (Space) */}
          <button
            onClick={onTriggerDash}
            className={`w-16 h-16 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-2xl sm:rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all active:scale-95 cursor-pointer ${
              hudData.dashReady
                ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(56,189,248,0.5)]'
                : 'bg-black/60 border-neutral-800 text-neutral-600'
            }`}
          >
            <Zap className={`w-6 h-6 sm:w-4 sm:h-4 ${hudData.dashReady ? 'text-cyan-400' : 'text-neutral-600'}`} />
            <div className="text-center sm:text-left font-mono">
              <div className="text-[9px] sm:text-[10px] text-neutral-400">DASH</div>
              <div className="text-[10px] sm:text-xs font-bold tabular-nums">
                {hudData.dashReady ? 'READY' : `${Math.round(hudData.dashCooldownProgress * 100)}%`}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
