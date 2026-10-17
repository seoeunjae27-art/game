import React from 'react';
import { Play, RotateCcw, Home, Pause } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onTitle }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="max-w-xs w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400 mb-3">
          <Pause className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-orbitron font-bold text-white tracking-wider mb-1">
          일시정지
        </h2>
        <p className="text-xs text-neutral-400 font-mono mb-6">
          시뮬레이션 대기 중
        </p>

        <div className="w-full space-y-2">
          <button
            onClick={onResume}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>게임 재개 (ESC / SPACE)</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-orbitron text-xs rounded-xl border border-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>처음부터 재도전</span>
          </button>

          <button
            onClick={onTitle}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-orbitron text-xs rounded-xl border border-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>타이틀로 이동</span>
          </button>
        </div>
      </div>
    </div>
  );
};
