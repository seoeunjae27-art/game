import React, { useState, useEffect } from 'react';
import { FocusMode, SoundState } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Flame, 
  Wind, 
  Coffee, 
  Waves,
  Sliders,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { soundSynthesizer } from '../utils/soundSynthesizer';

interface FocusRoomViewProps {
  onSessionComplete: (minutes: number) => void;
}

export const FocusRoomView: React.FC<FocusRoomViewProps> = ({ onSessionComplete }) => {
  const [mode, setMode] = useState<FocusMode>('focus');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [bgStyle, setBgStyle] = useState<'minimal' | 'photo' | 'warm'>('photo');

  // Ambient sound states
  const [sounds, setSounds] = useState<SoundState[]>([
    { id: 'rain', name: '자연 빗소리', icon: 'rain', playing: false, volume: 0.5 },
    { id: 'campfire', name: '모닥불 장작', icon: 'campfire', playing: false, volume: 0.4 },
    { id: 'whitenoise', name: '집중 핑크노이즈', icon: 'whitenoise', playing: false, volume: 0.3 },
    { id: 'cafe', name: '카페 앰비언스', icon: 'cafe', playing: false, volume: 0.4 },
    { id: 'waves', name: '고요한 파도', icon: 'waves', playing: false, volume: 0.5 },
  ]);

  // Mode change handler
  const handleModeChange = (newMode: FocusMode) => {
    setMode(newMode);
    setIsRunning(false);
    let mins = 25;
    if (newMode === 'focus') mins = 25;
    else if (newMode === 'short_break') mins = 5;
    else if (newMode === 'long_break') mins = 15;
    setDurationMinutes(mins);
    setTimeLeft(mins * 60);
  };

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      soundSynthesizer.playChime();
      if (mode === 'focus') {
        onSessionComplete(durationMinutes);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, durationMinutes, onSessionComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
  };

  const handleCustomDuration = (mins: number) => {
    setDurationMinutes(mins);
    setTimeLeft(mins * 60);
    setIsRunning(false);
  };

  // Toggle ambient sound
  const toggleSound = (soundId: 'rain' | 'campfire' | 'whitenoise' | 'cafe' | 'waves') => {
    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === soundId) {
          const nextPlaying = !s.playing;
          soundSynthesizer.setSound(s.id, nextPlaying, s.volume);
          return { ...s, playing: nextPlaying };
        }
        return s;
      })
    );
  };

  // Adjust volume
  const handleVolumeChange = (
    soundId: 'rain' | 'campfire' | 'whitenoise' | 'cafe' | 'waves',
    vol: number
  ) => {
    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === soundId) {
          soundSynthesizer.setVolume(s.id, vol);
          return { ...s, volume: vol };
        }
        return s;
      })
    );
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = durationMinutes * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  const soundIcons: Record<string, React.ElementType> = {
    rain: CloudRain,
    campfire: Flame,
    whitenoise: Wind,
    cafe: Coffee,
    waves: Waves,
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-xl min-h-[640px] flex flex-col justify-between p-6 sm:p-10 transition-all">
      {/* Background Options */}
      {bgStyle === 'photo' && (
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/focus_ambient_cover_1792229302168.jpg"
            alt="집중 배경"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter brightness-[0.25]"
          />
        </div>
      )}
      {bgStyle === 'warm' && (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#1a120c] via-[#0f0e13] to-[#0c0e14]" />
      )}
      {bgStyle === 'minimal' && (
        <div className="absolute inset-0 z-0 bg-[#090b10]" />
      )}

      {/* Top Bar inside Focus Room */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-xl border border-neutral-800">
          <button
            onClick={() => handleModeChange('focus')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'focus' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            집중 (25분)
          </button>
          <button
            onClick={() => handleModeChange('short_break')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'short_break' ? 'bg-sky-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            짧은 휴식 (5분)
          </button>
          <button
            onClick={() => handleModeChange('long_break')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'long_break' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            긴 휴식 (15분)
          </button>
        </div>

        {/* Backdrop Switcher */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800">
          <span>배경 무드:</span>
          <button
            onClick={() => setBgStyle('photo')}
            className={`px-2 py-0.5 rounded ${bgStyle === 'photo' ? 'bg-neutral-800 text-white font-medium' : 'hover:text-white'}`}
          >
            서재 뷰
          </button>
          <button
            onClick={() => setBgStyle('warm')}
            className={`px-2 py-0.5 rounded ${bgStyle === 'warm' ? 'bg-neutral-800 text-white font-medium' : 'hover:text-white'}`}
          >
            웜 앰비언트
          </button>
          <button
            onClick={() => setBgStyle('minimal')}
            className={`px-2 py-0.5 rounded ${bgStyle === 'minimal' ? 'bg-neutral-800 text-white font-medium' : 'hover:text-white'}`}
          >
            다크 미니멀
          </button>
        </div>
      </div>

      {/* Center: Big Modern Timer Circle & Controls */}
      <div className="relative z-10 flex flex-col items-center justify-center my-8 text-center">
        {/* Circular Display */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          {/* SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-neutral-800/80 stroke-current"
              strokeWidth="3.5"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`${
                mode === 'focus'
                  ? 'text-indigo-500'
                  : mode === 'short_break'
                  ? 'text-sky-400'
                  : 'text-emerald-400'
              } stroke-current transition-all duration-500`}
              strokeWidth="4"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-white tabular-nums drop-shadow-md">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs uppercase tracking-widest text-neutral-400 mt-2 font-medium">
              {mode === 'focus' ? 'Deep Work Focus' : 'Refresh Break'}
            </span>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={resetTimer}
            className="p-3 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 rounded-2xl text-neutral-300 hover:text-white transition-all shadow-sm"
            title="타이머 초기화"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className={`px-8 py-3.5 rounded-2xl font-bold text-base flex items-center gap-2 shadow-lg transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-600/20'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            <span>{isRunning ? '일시정지' : '집중 시작'}</span>
          </button>
        </div>

        {/* Custom duration pills */}
        <div className="flex items-center gap-2 mt-5 text-xs text-neutral-400">
          <span>빠른 시간 조절:</span>
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => handleCustomDuration(mins)}
              className={`px-2.5 py-1 rounded-md border transition-colors ${
                durationMinutes === mins
                  ? 'bg-neutral-800 border-indigo-500 text-white font-medium'
                  : 'bg-neutral-950/60 border-neutral-800 hover:text-white'
              }`}
            >
              {mins}분
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Bar: Ambient Sound Mixer */}
      <div className="relative z-10 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span>프로시저럴 앰비언트 사운드 믹서 (Web Audio API 실시간 합성)</span>
          </div>
          <span className="text-[11px] text-neutral-500">
            여러 소리를 조합하여 나만의 몰입 사운드를 만드세요
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {sounds.map((sound) => {
            const Icon = soundIcons[sound.icon] || CloudRain;
            return (
              <div
                key={sound.id}
                className={`p-3 rounded-xl border transition-all ${
                  sound.playing
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSound(sound.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-left truncate hover:text-white"
                  >
                    <Icon className={`w-3.5 h-3.5 ${sound.playing ? 'text-indigo-400' : 'text-neutral-500'}`} />
                    <span className="truncate">{sound.name}</span>
                  </button>
                  <button
                    onClick={() => toggleSound(sound.id)}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      sound.playing ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {sound.playing ? '✓' : ''}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sound.volume}
                    disabled={!sound.playing}
                    onChange={(e) =>
                      handleVolumeChange(sound.id, parseFloat(e.target.value))
                    }
                    className="w-full accent-indigo-500 h-1 bg-neutral-800 rounded cursor-pointer disabled:opacity-30"
                  />
                  <span className="text-[10px] font-mono tabular-nums text-neutral-500 w-6 text-right">
                    {Math.round(sound.volume * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
