/**
 * CYBER CORE 3D: SURVIVOR
 * 60FPS Sci-Fi 3D Action Arcade Survivor Game powered by Three.js
 */

import React, { useEffect, useRef, useState } from 'react';
import { ThreeGameEngine } from './game/threeEngine';
import { HUDData } from './game/engine';
import { GameState, UpgradeOption } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { LevelUpModal } from './components/LevelUpModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { getRandomUpgrades, applyUpgrade } from './game/upgrades';
import { sound } from './game/audio';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThreeGameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [hudData, setHudData] = useState<HUDData | null>(null);
  const [levelUpOptions, setLevelUpOptions] = useState<UpgradeOption[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [autoAim, setAutoAim] = useState<boolean>(true);

  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new ThreeGameEngine(mountRef.current);
    engineRef.current = engine;

    // Callbacks from simulation engine to React
    engine.onStateChange = (nextState) => {
      setGameState(nextState);
    };

    engine.onHUDUpdate = (data) => {
      setHudData(data);
    };

    engine.onLevelUpTrigger = () => {
      setLevelUpOptions(getRandomUpgrades(3));
    };

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Start 60fps render & simulation loop
    engine.startLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
      sound.stopBgm();
    };
  }, []);

  const handleStartGame = () => {
    engineRef.current?.startGame();
  };

  const handlePause = () => {
    engineRef.current?.pauseGame();
  };

  const handleResume = () => {
    engineRef.current?.resumeGame();
  };

  const handleRestart = () => {
    engineRef.current?.startGame();
  };

  const handleTitle = () => {
    if (engineRef.current) {
      engineRef.current.state = 'TITLE';
      setGameState('TITLE');
      sound.stopBgm();
    }
  };

  const handleSelectUpgrade = (upgradeId: string) => {
    if (engineRef.current) {
      applyUpgrade(engineRef.current.player, upgradeId);
      engineRef.current.resumeAfterLevelUp();
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleTriggerDash = () => {
    engineRef.current?.triggerDash();
  };

  const handleTriggerNova = () => {
    engineRef.current?.triggerNova();
  };

  const handleJoystickMove = (vx: number, vy: number) => {
    engineRef.current?.setTouchMove(vx, vy);
  };

  const handleToggleAutoAim = () => {
    if (engineRef.current) {
      const next = engineRef.current.toggleAutoAim();
      setAutoAim(next);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05060a] select-none font-sans">
      {/* 3D WebGL Three.js Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair z-0"
      />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStart={handleStartGame}
          highScore={hudData?.highScore || 0}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* In-Game Active HUD Overlay */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'LEVEL_UP') && (
        <GameHUD
          hudData={hudData}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onTriggerDash={handleTriggerDash}
          onTriggerNova={handleTriggerNova}
          onJoystickMove={handleJoystickMove}
          autoAim={autoAim}
          onToggleAutoAim={handleToggleAutoAim}
        />
      )}

      {/* Level-Up Modal */}
      {gameState === 'LEVEL_UP' && (
        <LevelUpModal
          options={levelUpOptions}
          onSelect={handleSelectUpgrade}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onTitle={handleTitle}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          score={hudData?.score || 0}
          highScore={hudData?.highScore || 0}
          wave={hudData?.wave || 1}
          onRestart={handleRestart}
          onTitle={handleTitle}
        />
      )}
    </div>
  );
}
