import { Player, Enemy, Projectile, Particle, Gem, DamageText, GameState, EnemyType } from './types';
import { sound } from './audio';

export interface MiniMapEnemy {
  x: number;
  y: number;
  type: EnemyType;
}

export interface HUDData {
  health: number;
  maxHealth: number;
  level: number;
  xp: number;
  nextXp: number;
  score: number;
  highScore: number;
  wave: number;
  enemiesRemaining: number;
  dashReady: boolean;
  dashCooldownProgress: number; // 0 to 1
  novaReady: boolean;
  novaCooldownProgress: number; // 0 to 1
  multishot: number;
  orbiters: number;
  playerPos?: { x: number; y: number; angle: number };
  radarEnemies?: MiniMapEnemy[];
  arenaRadius?: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  // State
  public state: GameState = 'TITLE';
  private lastTime: number = 0;
  private animFrameId: number = 0;

  // Screen shake & hitstop
  private screenShake: number = 0;
  private hitstopTimer: number = 0;

  // Camera
  private camX: number = 0;
  private camY: number = 0;

  // Player
  public player!: Player;

  // Entities
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private gems: Gem[] = [];
  private damageTexts: DamageText[] = [];

  // Wave system
  public wave: number = 1;
  public score: number = 0;
  public highScore: number = 0;
  private waveTimer: number = 0;
  private waveDuration: number = 35; // 35s per wave
  private spawnTimer: number = 0;
  private isBossWave: boolean = false;

  // Inputs
  private keys: Record<string, boolean> = {};
  public mouseX: number = 0;
  public mouseY: number = 0;
  public isMouseDown: boolean = false;
  public touchMoveX: number = 0;
  public touchMoveY: number = 0;
  public autoAim: boolean = true;

  // React callbacks
  public onStateChange?: (state: GameState) => void;
  public onHUDUpdate?: (data: HUDData) => void;
  public onLevelUpTrigger?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.highScore = parseInt(localStorage.getItem('cyber_highscore') || '0', 10);
    this.resize();
    this.resetPlayer();
    this.bindEvents();
  }

  public resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  public resetPlayer() {
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 18,
      health: 100,
      maxHealth: 100,
      speed: 340,
      dashCooldown: 2.5,
      dashTimer: 0,
      isDashing: false,
      dashDuration: 0.18,
      novaCooldown: 14,
      novaTimer: 0,
      level: 1,
      xp: 0,
      nextXp: 30,
      multishot: 1,
      damage: 22,
      fireRate: 4.8,
      fireTimer: 0,
      projectileSpeed: 750,
      pierce: 1,
      magnetRadius: 130,
      orbitersCount: 0,
      orbitAngle: 0,
    };
  }

  public startGame() {
    this.resetPlayer();
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.gems = [];
    this.damageTexts = [];
    this.wave = 1;
    this.score = 0;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.state = 'PLAYING';
    sound.startBgm();
    if (this.onStateChange) this.onStateChange('PLAYING');
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (this.onStateChange) this.onStateChange('PAUSED');
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      if (this.onStateChange) this.onStateChange('PLAYING');
    }
  }

  public resumeAfterLevelUp() {
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    if (this.onStateChange) this.onStateChange('PLAYING');
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'PLAYING') this.pauseGame();
        else if (this.state === 'PAUSED') this.resumeGame();
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (this.state === 'TITLE') {
          this.startGame();
        } else if (this.state === 'PLAYING') {
          this.triggerDash();
        }
      }

      if (e.code === 'Enter' && this.state === 'TITLE') {
        this.startGame();
      }

      if (e.code === 'KeyQ' && this.state === 'PLAYING') {
        this.triggerNova();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
      } else if (e.button === 2 && this.state === 'PLAYING') {
        this.triggerDash();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMouseDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mobile touch handling
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.mouseX = e.touches[0].clientX;
        this.mouseY = e.touches[0].clientY;
        this.isMouseDown = true;
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouseX = e.touches[0].clientX;
        this.mouseY = e.touches[0].clientY;
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      this.isMouseDown = false;
    });
  }

  public triggerDash() {
    if (this.player.dashTimer <= 0 && !this.player.isDashing) {
      this.player.isDashing = true;
      this.player.dashTimer = this.player.dashCooldown;
      sound.dash();
      this.screenShake = 6;

      // Spawn dash ghost trail
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: this.player.x - this.player.vx * (i * 0.02),
          y: this.player.y - this.player.vy * (i * 0.02),
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80,
          size: 14 - i * 1.5,
          color: '#38bdf8',
          alpha: 0.8,
          decay: 3.5,
          type: 'spark',
        });
      }

      setTimeout(() => {
        this.player.isDashing = false;
      }, this.player.dashDuration * 1000);
    }
  }

  public triggerNova() {
    if (this.player.novaTimer <= 0) {
      this.player.novaTimer = this.player.novaCooldown;
      sound.nova();
      this.screenShake = 18;
      this.hitstopTimer = 0.06;

      const novaRadius = 380;

      // Particle shockwave ring
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: 0,
        vy: 0,
        size: 20,
        color: '#c084fc',
        alpha: 1,
        decay: 1.6,
        type: 'ring',
      });

      // Damage all nearby enemies
      this.enemies.forEach((enemy) => {
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < novaRadius) {
          const dmg = 120;
          enemy.health -= dmg;
          enemy.flashTimer = 0.15;
          // Knockback
          const angle = Math.atan2(dy, dx);
          enemy.vx += Math.cos(angle) * 450;
          enemy.vy += Math.sin(angle) * 450;

          this.addDamageText(dmg, enemy.x, enemy.y, '#e879f9');
        }
      });
    }
  }

  public setTouchMove(vx: number, vy: number) {
    this.touchMoveX = vx;
    this.touchMoveY = vy;
  }

  public toggleAutoAim(): boolean {
    this.autoAim = !this.autoAim;
    return this.autoAim;
  }

  public startLoop() {
    this.lastTime = performance.now();
    const loop = (currentTime: number) => {
      const rawDt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling

      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else if (this.state === 'PLAYING') {
        this.update(dt);
      }

      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopLoop() {
    cancelAnimationFrame(this.animFrameId);
  }

  private update(dt: number) {
    // 1. Timers
    if (this.player.dashTimer > 0) this.player.dashTimer -= dt;
    if (this.player.novaTimer > 0) this.player.novaTimer -= dt;
    this.player.fireTimer += dt;
    this.player.orbitAngle += dt * 3.5;

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // 2. Player Input & Movement
    let moveX = 0;
    let moveY = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    if (this.touchMoveX !== 0 || this.touchMoveY !== 0) {
      moveX = this.touchMoveX;
      moveY = this.touchMoveY;
    }

    const len = Math.hypot(moveX, moveY);
    const currentSpeed = this.player.isDashing ? this.player.speed * 2.8 : this.player.speed;
    if (len > 0) {
      this.player.vx = (moveX / len) * currentSpeed;
      this.player.vy = (moveY / len) * currentSpeed;
    } else {
      this.player.vx *= Math.pow(0.01, dt);
      this.player.vy *= Math.pow(0.01, dt);
    }

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // World boundary clamping (-1800 to 1800)
    const bounds = 1600;
    this.player.x = Math.max(-bounds, Math.min(bounds, this.player.x));
    this.player.y = Math.max(-bounds, Math.min(bounds, this.player.y));

    // Player aiming: Target closest enemy if autoAim is enabled
    let hasAutoTarget = false;
    if (this.autoAim && this.enemies.length > 0) {
      let closestDist = 850;
      let targetEnemy: Enemy | null = null;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < closestDist) {
          closestDist = d;
          targetEnemy = e;
        }
      }
      if (targetEnemy) {
        this.player.angle = Math.atan2(targetEnemy.y - this.player.y, targetEnemy.x - this.player.x);
        hasAutoTarget = true;
      }
    }

    if (!hasAutoTarget) {
      if (this.mouseX !== 0 || this.mouseY !== 0) {
        const targetWorldX = this.mouseX - this.width / 2 + this.camX;
        const targetWorldY = this.mouseY - this.height / 2 + this.camY;
        this.player.angle = Math.atan2(targetWorldY - this.player.y, targetWorldX - this.player.x);
      } else if (len > 0) {
        this.player.angle = Math.atan2(moveY, moveX);
      }
    }

    // Player Shooting (fires when isMouseDown or when autoAim has target)
    const shouldFire = (this.isMouseDown || (this.autoAim && hasAutoTarget)) && !this.player.isDashing;
    if (shouldFire && this.player.fireTimer >= 1 / this.player.fireRate) {
      this.player.fireTimer = 0;
      sound.laser();
      this.screenShake = Math.max(this.screenShake, 2);

      const baseAngle = this.player.angle;
      const spread = 0.14;
      const count = this.player.multishot;

      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * spread;
        const angle = baseAngle + offset;
        this.projectiles.push({
          id: 'p-' + Math.random(),
          x: this.player.x + Math.cos(angle) * 22,
          y: this.player.y + Math.sin(angle) * 22,
          vx: Math.cos(angle) * this.player.projectileSpeed,
          vy: Math.sin(angle) * this.player.projectileSpeed,
          radius: 5,
          damage: this.player.damage,
          color: '#38bdf8',
          life: 1.2,
          maxLife: 1.2,
          isEnemy: false,
          pierceLeft: this.player.pierce,
        });
      }
    }

    // Camera follow with lerp
    this.camX += (this.player.x - this.camX) * 0.1;
    this.camY += (this.player.y - this.camY) * 0.1;

    // 3. Projectiles update
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with enemies if player projectile
      if (!p.isEnemy) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const dist = Math.hypot(p.x - e.x, p.y - e.y);
          if (dist < p.radius + e.radius) {
            e.health -= p.damage;
            e.flashTimer = 0.08;
            sound.hit();
            this.addDamageText(p.damage, e.x, e.y, '#38bdf8');

            // Hit particles
            for (let k = 0; k < 4; k++) {
              this.particles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                size: Math.random() * 3 + 2,
                color: '#38bdf8',
                alpha: 1,
                decay: 4,
                type: 'spark',
              });
            }

            p.pierceLeft--;
            if (p.pierceLeft <= 0) {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    // 4. Orbiters collision
    if (this.player.orbitersCount > 0) {
      const orbRadius = 75;
      for (let i = 0; i < this.player.orbitersCount; i++) {
        const orbAngle = this.player.orbitAngle + (i * (2 * Math.PI)) / this.player.orbitersCount;
        const ox = this.player.x + Math.cos(orbAngle) * orbRadius;
        const oy = this.player.y + Math.sin(orbAngle) * orbRadius;

        for (const e of this.enemies) {
          if (Math.hypot(ox - e.x, oy - e.y) < e.radius + 10) {
            e.health -= 35 * dt;
            e.flashTimer = 0.05;
          }
        }
      }
    }

    // 5. Wave & Enemy Spawning
    this.waveTimer += dt;
    this.spawnTimer += dt;

    const spawnInterval = Math.max(0.6, 2.5 - this.wave * 0.18);
    if (this.spawnTimer >= spawnInterval && this.enemies.length < 50 + this.wave * 8) {
      this.spawnTimer = 0;
      this.spawnRandomEnemy();
    }

    // Wave Progression
    if (this.waveTimer >= this.waveDuration) {
      this.waveTimer = 0;
      this.wave++;
      this.score += 500 * this.wave;

      // Boss encounter at wave 5 and 10
      if (this.wave === 5 || this.wave === 10) {
        this.spawnBoss();
      }
    }

    // 6. Enemies update
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.flashTimer > 0) e.flashTimer -= dt;

      // Enemy death check
      if (e.health <= 0) {
        sound.explosion(e.type === 'boss' ? 3 : 1);
        this.score += e.xpValue * 10;
        this.screenShake = e.type === 'boss' ? 22 : 4;

        // Death explosion particles
        const pCount = e.type === 'boss' ? 45 : 12;
        for (let k = 0; k < pCount; k++) {
          this.particles.push({
            x: e.x,
            y: e.y,
            vx: (Math.random() - 0.5) * (e.type === 'boss' ? 380 : 200),
            vy: (Math.random() - 0.5) * (e.type === 'boss' ? 380 : 200),
            size: Math.random() * 5 + 2,
            color: e.color,
            alpha: 1,
            decay: 2.2,
            type: 'spark',
          });
        }

        // Spawn XP Gem
        this.gems.push({
          id: 'gem-' + Math.random(),
          x: e.x,
          y: e.y,
          vx: (Math.random() - 0.5) * 60,
          vy: (Math.random() - 0.5) * 60,
          value: e.xpValue,
          type: Math.random() < 0.08 ? 'health' : 'xp',
          radius: 8,
        });

        this.enemies.splice(i, 1);
        continue;
      }

      // AI Behaviors per type
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy);

      if (e.type === 'scout') {
        // Swarmer
        const angle = Math.atan2(dy, dx);
        e.vx = Math.cos(angle) * e.speed;
        e.vy = Math.sin(angle) * e.speed;
      } else if (e.type === 'brute') {
        // Charging brute
        if (e.isCharging) {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            e.isCharging = false;
          }
        } else {
          e.attackTimer -= dt;
          if (e.attackTimer <= 0 && dist < 450) {
            // Start windup charge
            e.telegraphTimer = e.telegraphDuration;
            e.attackTimer = 4.5;
            e.chargeTargetX = this.player.x;
            e.chargeTargetY = this.player.y;
            const chargeAngle = Math.atan2(e.chargeTargetY - e.y, e.chargeTargetX - e.x);
            e.vx = Math.cos(chargeAngle) * 520;
            e.vy = Math.sin(chargeAngle) * 520;
            e.isCharging = true;
          } else {
            const angle = Math.atan2(dy, dx);
            e.vx = Math.cos(angle) * e.speed;
            e.vy = Math.sin(angle) * e.speed;
          }
        }
      } else if (e.type === 'disruptor') {
        // Keeps distance and shoots energy orbs
        e.attackTimer -= dt;
        const angle = Math.atan2(dy, dx);
        if (dist < 260) {
          e.vx = -Math.cos(angle) * e.speed;
          e.vy = -Math.sin(angle) * e.speed;
        } else {
          e.vx = Math.cos(angle) * e.speed * 0.7;
          e.vy = Math.sin(angle) * e.speed * 0.7;
        }

        if (e.attackTimer <= 0 && dist < 600) {
          e.attackTimer = 2.4;
          this.projectiles.push({
            id: 'ep-' + Math.random(),
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * 260,
            vy: Math.sin(angle) * 260,
            radius: 7,
            damage: 18,
            color: '#f43f5e',
            life: 3.5,
            maxLife: 3.5,
            isEnemy: true,
            pierceLeft: 1,
          });
        }
      } else if (e.type === 'boss') {
        // Massive Boss
        const angle = Math.atan2(dy, dx);
        e.vx = Math.cos(angle) * e.speed;
        e.vy = Math.sin(angle) * e.speed;

        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = 1.8;
          // 8-way projectile ring
          for (let k = 0; k < 8; k++) {
            const shotAngle = angle + (k * Math.PI) / 4;
            this.projectiles.push({
              id: 'bp-' + Math.random(),
              x: e.x,
              y: e.y,
              vx: Math.cos(shotAngle) * 220,
              vy: Math.sin(shotAngle) * 220,
              radius: 9,
              damage: 22,
              color: '#fbbf24',
              life: 4,
              maxLife: 4,
              isEnemy: true,
              pierceLeft: 1,
            });
          }
        }
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Player collision damage
      if (dist < e.radius + this.player.radius && !this.player.isDashing) {
        this.playerTakeDamage(e.damage * dt * 2.2);
      }
    }

    // 7. Enemy Projectiles hit Player
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (p.isEnemy) {
        const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
        if (dist < p.radius + this.player.radius && !this.player.isDashing) {
          this.playerTakeDamage(p.damage);
          this.projectiles.splice(i, 1);
        }
      }
    }

    // 8. Gems & XP Pickups
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];
      const dx = this.player.x - gem.x;
      const dy = this.player.y - gem.y;
      const dist = Math.hypot(dx, dy);

      if (dist < this.player.magnetRadius) {
        const angle = Math.atan2(dy, dx);
        gem.vx += Math.cos(angle) * 850 * dt;
        gem.vy += Math.sin(angle) * 850 * dt;
        gem.x += gem.vx * dt;
        gem.y += gem.vy * dt;
      }

      if (dist < this.player.radius + gem.radius) {
        sound.gemPickup();
        if (gem.type === 'xp') {
          this.addXp(gem.value);
        } else if (gem.type === 'health') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
          this.addDamageText('+30 HP', this.player.x, this.player.y, '#34d399');
        }
        this.gems.splice(i, 1);
      }
    }

    // 9. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.alpha -= part.decay * dt;
      if (part.type === 'ring') {
        part.size += dt * 320;
      }

      if (part.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 10. Floating Texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dtText = this.damageTexts[i];
      dtText.y += dtText.vy * dt;
      dtText.alpha -= dt * 1.5;
      if (dtText.alpha <= 0) {
        this.damageTexts.splice(i, 1);
      }
    }

    // Notify React HUD
    if (this.onHUDUpdate) {
      this.onHUDUpdate({
        health: Math.round(this.player.health),
        maxHealth: this.player.maxHealth,
        level: this.player.level,
        xp: this.player.xp,
        nextXp: this.player.nextXp,
        score: this.score,
        highScore: this.highScore,
        wave: this.wave,
        enemiesRemaining: this.enemies.length,
        dashReady: this.player.dashTimer <= 0,
        dashCooldownProgress: Math.max(0, 1 - this.player.dashTimer / this.player.dashCooldown),
        novaReady: this.player.novaTimer <= 0,
        novaCooldownProgress: Math.max(0, 1 - this.player.novaTimer / this.player.novaCooldown),
        multishot: this.player.multishot,
        orbiters: this.player.orbitersCount,
      });
    }
  }

  private playerTakeDamage(amount: number) {
    this.player.health -= amount;
    this.screenShake = 10;
    sound.hit();

    if (this.player.health <= 0) {
      this.player.health = 0;
      this.state = 'GAME_OVER';
      sound.explosion(3);
      sound.stopBgm();

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('cyber_highscore', String(this.highScore));
      }

      if (this.onStateChange) this.onStateChange('GAME_OVER');
    }
  }

  private addXp(amount: number) {
    this.player.xp += amount;
    this.score += amount * 5;

    if (this.player.xp >= this.player.nextXp) {
      this.player.xp -= this.player.nextXp;
      this.player.level++;
      this.player.nextXp = Math.round(this.player.nextXp * 1.35 + 20);
      sound.levelUp();

      // Pause and trigger level up card selection
      this.state = 'LEVEL_UP';
      if (this.onStateChange) this.onStateChange('LEVEL_UP');
      if (this.onLevelUpTrigger) this.onLevelUpTrigger();
    }
  }

  private addDamageText(dmg: number | string, x: number, y: number, color = '#f87171') {
    this.damageTexts.push({
      id: 'dt-' + Math.random(),
      text: typeof dmg === 'number' ? Math.round(dmg).toString() : dmg,
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      vy: -60,
      alpha: 1,
      color,
    });
  }

  private spawnRandomEnemy() {
    // Spawn around player at distance
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(this.width, this.height) * 0.65 + 100;
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;

    const roll = Math.random();
    let type: EnemyType = 'scout';

    if (this.wave >= 2 && roll < 0.35) {
      type = 'brute';
    } else if (this.wave >= 3 && roll < 0.55) {
      type = 'disruptor';
    }

    const configs = {
      scout: {
        radius: 14,
        health: 28 + this.wave * 9,
        speed: 210 + this.wave * 12,
        damage: 14,
        color: '#c084fc',
        xpValue: 8,
      },
      brute: {
        radius: 24,
        health: 90 + this.wave * 28,
        speed: 130 + this.wave * 8,
        damage: 32,
        color: '#f87171',
        xpValue: 24,
      },
      disruptor: {
        radius: 17,
        health: 55 + this.wave * 16,
        speed: 160 + this.wave * 9,
        damage: 18,
        color: '#38bdf8',
        xpValue: 18,
      },
      boss: {
        radius: 55,
        health: 1200 + this.wave * 400,
        speed: 95,
        damage: 45,
        color: '#fbbf24',
        xpValue: 250,
      },
    };

    const cfg = configs[type];
    this.enemies.push({
      id: 'e-' + Math.random(),
      type,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: cfg.radius,
      health: cfg.health,
      maxHealth: cfg.health,
      speed: cfg.speed,
      damage: cfg.damage,
      color: cfg.color,
      xpValue: cfg.xpValue,
      telegraphTimer: 0,
      telegraphDuration: 0.8,
      isCharging: false,
      chargeTargetX: 0,
      chargeTargetY: 0,
      attackTimer: Math.random() * 2,
      flashTimer: 0,
    });
  }

  private spawnBoss() {
    const angle = Math.random() * Math.PI * 2;
    const x = this.player.x + Math.cos(angle) * 700;
    const y = this.player.y + Math.sin(angle) * 700;

    this.enemies.push({
      id: 'boss-' + this.wave,
      type: 'boss',
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 56,
      health: 1400 + this.wave * 500,
      maxHealth: 1400 + this.wave * 500,
      speed: 90,
      damage: 45,
      color: '#f59e0b',
      xpValue: 350,
      telegraphTimer: 0,
      telegraphDuration: 1,
      isCharging: false,
      chargeTargetX: 0,
      chargeTargetY: 0,
      attackTimer: 2,
      flashTimer: 0,
    });
  }

  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Clear background
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, this.width, this.height);

    // Apply Screen Shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // World transform relative to camera
    ctx.translate(this.width / 2 - this.camX, this.height / 2 - this.camY);

    // 1. Draw Cyberpunk Grid
    this.renderGrid(ctx);

    // 2. Draw World Boundaries
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 12]);
    ctx.strokeRect(-1600, -1600, 3200, 3200);
    ctx.setLineDash([]);

    // 3. Draw Gems
    this.gems.forEach((gem) => {
      ctx.save();
      ctx.translate(gem.x, gem.y);
      ctx.fillStyle = gem.type === 'health' ? '#34d399' : '#38bdf8';
      ctx.shadowColor = gem.type === 'health' ? '#34d399' : '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, gem.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Draw Projectiles
    this.projectiles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Draw Enemies
    this.enemies.forEach((e) => {
      ctx.save();
      ctx.translate(e.x, e.y);

      // Charge Telegraph Line for Brute
      if (e.type === 'brute' && e.isCharging) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(e.chargeTargetX - e.x, e.chargeTargetY - e.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Hit Flash (white) or normal color
      if (e.flashTimer > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
      } else {
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
      }
      ctx.shadowBlur = 12;

      // Enemy Shape
      ctx.beginPath();
      if (e.type === 'scout') {
        // Fast triangle
        const angle = Math.atan2(e.vy, e.vx);
        ctx.rotate(angle);
        ctx.moveTo(e.radius * 1.3, 0);
        ctx.lineTo(-e.radius, e.radius * 0.8);
        ctx.lineTo(-e.radius * 0.5, 0);
        ctx.lineTo(-e.radius, -e.radius * 0.8);
        ctx.closePath();
      } else if (e.type === 'brute') {
        // Octagon/Square heavy
        ctx.rect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
      } else if (e.type === 'disruptor') {
        // Diamond
        ctx.moveTo(0, -e.radius * 1.2);
        ctx.lineTo(e.radius * 1.2, 0);
        ctx.lineTo(0, e.radius * 1.2);
        ctx.lineTo(-e.radius * 1.2, 0);
        ctx.closePath();
      } else if (e.type === 'boss') {
        // Massive Dreadnought
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      }
      ctx.fill();

      // Mini Health bar over damaged enemy
      if (e.health < e.maxHealth) {
        const barW = e.radius * 2;
        const barH = 4;
        const pct = Math.max(0, e.health / e.maxHealth);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-e.radius, -e.radius - 12, barW, barH);
        ctx.fillStyle = e.type === 'boss' ? '#f59e0b' : '#ef4444';
        ctx.fillRect(-e.radius, -e.radius - 12, barW * pct, barH);
      }

      ctx.restore();
    });

    // 6. Draw Player
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);

    // Dash invulnerability aura
    if (this.player.isDashing) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Hero Core Ship Shape
    ctx.fillStyle = '#0284c7';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(this.player.radius * 1.4, 0); // Nose
    ctx.lineTo(-this.player.radius, this.player.radius * 0.9); // Left wing
    ctx.lineTo(-this.player.radius * 0.4, 0); // Thruster indent
    ctx.lineTo(-this.player.radius, -this.player.radius * 0.9); // Right wing
    ctx.closePath();
    ctx.fill();

    // Cockpit neon dot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 7. Draw Plasma Orbiters
    if (this.player.orbitersCount > 0) {
      const orbRadius = 75;
      for (let i = 0; i < this.player.orbitersCount; i++) {
        const orbAngle = this.player.orbitAngle + (i * (2 * Math.PI)) / this.player.orbitersCount;
        const ox = this.player.x + Math.cos(orbAngle) * orbRadius;
        const oy = this.player.y + Math.sin(orbAngle) * orbRadius;

        ctx.save();
        ctx.fillStyle = '#818cf8';
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ox, oy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 8. Draw Particles
    this.particles.forEach((part) => {
      ctx.save();
      ctx.fillStyle = part.color;
      ctx.strokeStyle = part.color;
      ctx.globalAlpha = Math.max(0, part.alpha);

      if (part.type === 'ring') {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // 9. Draw Floating Damage Texts
    this.damageTexts.forEach((txt) => {
      ctx.save();
      ctx.fillStyle = txt.color;
      ctx.globalAlpha = Math.max(0, txt.alpha);
      ctx.font = 'bold 13px Orbitron, sans-serif';
      ctx.fillText(txt.text, txt.x, txt.y);
      ctx.restore();
    });

    ctx.restore();
  }

  private renderGrid(ctx: CanvasRenderingContext2D) {
    const gridSize = 80;
    const startX = Math.floor((this.camX - this.width) / gridSize) * gridSize;
    const endX = Math.ceil((this.camX + this.width) / gridSize) * gridSize;
    const startY = Math.floor((this.camY - this.height) / gridSize) * gridSize;
    const endY = Math.ceil((this.camY + this.height) / gridSize) * gridSize;

    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Center Origin Cross
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(40, 0);
    ctx.moveTo(0, -40);
    ctx.lineTo(0, 40);
    ctx.stroke();
  }
}
