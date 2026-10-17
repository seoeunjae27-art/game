import React from 'react';
import { Volume2, VolumeX, Shield, Play } from 'lucide-react';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  highScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  highScore,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="relative w-screen h-screen flex flex-col justify-between p-6 sm:p-12 overflow-hidden bg-[#05060a]">
      {/* Background Hero Backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/cyber_game_backdrop_1792229878981.jpg"
          alt="게임 배경"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter brightness-[0.4] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060a] via-black/40 to-[#05060a]/90" />
      </div>

      {/* Top Bar: Mute button & High score */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-black/60 backdrop-blur-xs px-3.5 py-1.5 rounded-lg border border-cyan-900/50">
          <Shield className="w-3.5 h-3.5" />
          <span>CYBER CORE ARCHIVE v1.0</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs font-mono tabular-nums text-neutral-400 bg-black/60 px-3.5 py-1.5 rounded-lg border border-neutral-800">
            <span>HIGH SCORE: </span>
            <span className="text-amber-400 font-bold">{highScore.toLocaleString()}</span>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-black/60 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* Centerpiece: Bespoke Inline SVG Title Lockup */}
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center my-auto">
        <div className="w-full max-w-xl mb-4">
          <svg viewBox="0 0 700 120" className="w-full drop-shadow-[0_0_25px_rgba(56,189,248,0.5)]">
            <defs>
              <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <text
              x="50%"
              y="60"
              textAnchor="middle"
              className="font-orbitron font-black tracking-widest text-4xl sm:text-5xl"
              fill="url(#cyberGrad)"
              stroke="#0f172a"
              strokeWidth="2"
            >
              CYBER CORE
            </text>
            <text
              x="50%"
              y="105"
              textAnchor="middle"
              className="font-orbitron font-bold tracking-[0.4em] text-xs sm:text-sm"
              fill="#94a3b8"
            >
              // SURVIVOR PROTOCOL //
            </text>
          </svg>
        </div>

        <p className="text-sm sm:text-base text-neutral-300 max-w-lg mb-8 leading-relaxed font-sans font-medium">
          무한히 몰려드는 사이버네틱 드론 군단에 맞서 코어를 사수하라!
          경험치를 모아 플라즈마 멀티샷과 노바 폭탄으로 진화하세요.
        </p>

        {/* Primary Start CTA Button */}
        <button
          onClick={onStart}
          className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-95 text-white font-orbitron font-bold text-base sm:text-lg rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>게임 시작 (터치 / SPACE)</span>
        </button>
      </div>

      {/* Flat Single-Line Control Hint Line */}
      <footer className="relative z-10 text-center pb-2">
        <p className="text-[11px] sm:text-xs font-mono text-neutral-400 tracking-wide bg-black/60 backdrop-blur-xs py-2 px-4 sm:px-6 rounded-full inline-block border border-neutral-800/80">
          모바일: 화면 좌측 조이스틱 이동 · DASH / NOVA 버튼 터치 · 스마트 자동 조준 (PC: WASD · 마우스 · Space)
        </p>
      </footer>
    </div>
  );
};
