import React from 'react';
import { UpgradeOption } from '../game/types';
import { Sparkles, Zap, Crosshair, Shield, FastForward, Magnet, Heart, Bomb } from 'lucide-react';

interface LevelUpModalProps {
  options: UpgradeOption[];
  onSelect: (optionId: string) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ options, onSelect }) => {
  const iconMap: Record<string, React.ElementType> = {
    Sparkles,
    Zap,
    Crosshair,
    Shield,
    FastForward,
    Magnet,
    Heart,
    Bomb,
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 select-none overflow-y-auto">
      <div className="max-w-2xl w-full flex flex-col items-center my-auto py-2">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CORE OVERCLOCK READY</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-orbitron font-bold text-white tracking-wide">
            시스템 업그레이드 선택
          </h2>
          <p className="text-[11px] sm:text-xs text-neutral-400 mt-1 font-sans">
            강화 모듈 1개를 터치하여 코어 성능을 극대화하세요.
          </p>
        </div>

        {/* 3 Upgrade Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
          {options.map((opt) => {
            const Icon = iconMap[opt.icon] || Sparkles;
            const isLegendary = opt.rarity === 'legendary';
            const isRare = opt.rarity === 'rare';

            return (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className={`group text-left p-4 sm:p-5 rounded-2xl border transition-all active:scale-95 cursor-pointer flex flex-col justify-between min-h-[120px] sm:h-56 ${
                  isLegendary
                    ? 'bg-gradient-to-b from-purple-950/70 to-black/90 border-purple-500/60 shadow-[0_0_20px_rgba(192,132,252,0.25)]'
                    : isRare
                    ? 'bg-gradient-to-b from-cyan-950/70 to-black/90 border-cyan-500/60 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                    : 'bg-gradient-to-b from-neutral-900/80 to-black/90 border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isLegendary
                          ? 'bg-purple-900/40 border-purple-500/40 text-purple-300'
                          : isRare
                          ? 'bg-cyan-900/40 border-cyan-500/40 text-cyan-300'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        isLegendary
                          ? 'text-purple-300 bg-purple-950/60 border border-purple-800'
                          : isRare
                          ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800'
                          : 'text-neutral-400 bg-neutral-900 border border-neutral-800'
                      }`}
                    >
                      {opt.rarity}
                    </span>
                  </div>

                  <h3 className="text-base font-orbitron font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {opt.title}
                  </h3>

                  <p className="text-xs text-neutral-300 mt-2 leading-relaxed font-sans font-medium">
                    {opt.desc}
                  </p>
                </div>

                <div className="text-[11px] font-mono text-cyan-400/80 group-hover:text-cyan-300 transition-colors flex items-center justify-end">
                  선택하기 →
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
