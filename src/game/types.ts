export type GameState = 'TITLE' | 'PLAYING' | 'LEVEL_UP' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  // Abilities
  dashCooldown: number;
  dashTimer: number;
  isDashing: boolean;
  dashDuration: number;
  novaCooldown: number;
  novaTimer: number;
  // Progression
  level: number;
  xp: number;
  nextXp: number;
  // Weapon stats
  multishot: number;
  damage: number;
  fireRate: number; // shots per sec
  fireTimer: number;
  projectileSpeed: number;
  pierce: number;
  magnetRadius: number;
  orbitersCount: number;
  orbitAngle: number;
}

export type EnemyType = 'scout' | 'brute' | 'disruptor' | 'boss';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  color: string;
  xpValue: number;
  // Telegraphing & attack states
  telegraphTimer: number;
  telegraphDuration: number;
  isCharging: boolean;
  chargeTargetX: number;
  chargeTargetY: number;
  attackTimer: number;
  flashTimer: number; // white hit flash
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  isEnemy: boolean;
  pierceLeft: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'spark' | 'ring' | 'smoke' | 'debris';
}

export interface Gem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  type: 'xp' | 'health' | 'nova';
  radius: number;
}

export interface DamageText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  color: string;
}

export interface UpgradeOption {
  id: string;
  title: string;
  desc: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
}
