import React from 'react';
import { RotateCcw, Home, Trophy, Skull } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  wave: number;
  onRestart: () => void;
  onTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  wave,
  onRestart,
  onTitle,
}) => {
  const isNewRecord = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="max-w-md w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <Skull className="w-7 h-7" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white tracking-wider">
          코어 시스템 파괴됨
        </h2>
        <p className="text-xs text-neutral-400 mt-1 font-mono">
          // SYSTEM OVERLOAD DETECTED //
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-6">
          <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl text-left">
            <span className="text-[11px] font-mono text-neutral-400 block">최종 점수</span>
            <span className="text-xl font-orbitron font-bold text-white tabular-nums">
              {score.toLocaleString()}
            </span>
            {isNewRecord && (
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 mt-0.5">
                <Trophy className="w-3 h-3" /> 최고 기록 갱신!
              </span>
            )}
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 p-3 rounded-xl text-left">
            <span className="text-[11px] font-mono text-neutral-400 block">도달한 웨이브</span>
            <span className="text-xl font-orbitron font-bold text-cyan-400 tabular-nums">
              WAVE {wave}
            </span>
            <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">
              적 드론 격파
            </span>
          </div>
        </div>

        {/* Single-line Play Again CTA */}
        <div className="w-full flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-orbitron font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 도전 (SPACE)</span>
          </button>

          <button
            onClick={onTitle}
            className="py-3.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-orbitron font-medium text-xs rounded-xl border border-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>타이틀</span>
          </button>
        </div>
      </div>
    </div>
  );
};
