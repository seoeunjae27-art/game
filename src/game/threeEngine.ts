import * as THREE from 'three';
import { Player, Enemy, Projectile, Particle, Gem, DamageText, GameState, EnemyType } from './types';
import { sound } from './audio';
import { HUDData } from './engine';

// Reusable math vectors to avoid GC in render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();

export class ThreeGameEngine {
  private container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  public state: GameState = 'TITLE';
  private animFrameId: number = 0;

  // Camera & Shake
  private camTarget = new THREE.Vector3(0, 0, 0);
  private screenShake: number = 0;
  private hitstopTimer: number = 0;

  // Player & 3D Objects
  public player!: Player;
  private playerGroup!: THREE.Group;
  private thrusterFlames: THREE.Mesh[] = [];
  private orbiterMeshes: THREE.Mesh[] = [];

  // Entities & Meshes
  private enemies: { data: Enemy; group: THREE.Group }[] = [];
  private projectiles: { data: Projectile; mesh: THREE.Mesh }[] = [];
  private gems: { data: Gem; mesh: THREE.Mesh }[] = [];
  private particlePoints!: THREE.Points;
  private particlePositions!: Float32Array;
  private particleColors!: Float32Array;
  private particleAlphas!: Float32Array;
  private activeParticles: Particle[] = [];
  private readonly MAX_PARTICLES = 1200;

  // Wave & Scoring
  public wave: number = 1;
  public score: number = 0;
  public highScore: number = 0;
  private waveTimer: number = 0;
  private waveDuration: number = 35;
  private spawnTimer: number = 0;

  // Inputs
  private keys: Record<string, boolean> = {};
  public mouseX: number = 0;
  public mouseY: number = 0;
  public isMouseDown: boolean = false;
  public touchMoveX: number = 0;
  public touchMoveY: number = 0;
  public autoAim: boolean = true;

  // Raycaster for mouse aim on XZ ground plane
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private mouseNDC = new THREE.Vector2();

  // Callbacks
  public onStateChange?: (state: GameState) => void;
  public onHUDUpdate?: (data: HUDData) => void;
  public onLevelUpTrigger?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.highScore = parseInt(localStorage.getItem('cyber_highscore') || '0', 10);
    this.clock = new THREE.Clock();

    // Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05060c);
    this.scene.fog = new THREE.FogExp2(0x05060c, 0.015);

    // Camera: Overhead isometric perspective
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.5, 1000);
    this.camera.position.set(0, 48, 38);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.setupEnvironment();
    this.setupParticleSystem();
    this.resetPlayer();
    this.setupPlayer3D();
    this.bindEvents();
  }

  private setupLighting() {
    // Hemisphere ambient light
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x05060c, 0.9);
    this.scene.add(hemiLight);

    // Warm Key Directional Light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(30, 50, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    const d = 40;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Core point light attached to player
    const playerLight = new THREE.PointLight(0x38bdf8, 2, 25);
    playerLight.position.set(0, 2, 0);
    this.scene.add(playerLight);
  }

  private setupEnvironment() {
    // 1. Neon Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(300, 60, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -0.02;
    this.scene.add(gridHelper);

    // Ground plane for shadows
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x080b14,
      roughness: 0.85,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Cosmic Background Starfield
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 800;
      starPos[i + 1] = Math.random() * 250 + 20;
      starPos[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xc7d2fe,
      size: 1.8,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);
  }

  private setupParticleSystem() {
    const geo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.MAX_PARTICLES * 3);
    this.particleColors = new Float32Array(this.MAX_PARTICLES * 3);
    this.particleAlphas = new Float32Array(this.MAX_PARTICLES);

    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlePoints = new THREE.Points(geo, mat);
    this.scene.add(this.particlePoints);
  }

  public resetPlayer() {
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: 1.6,
      health: 100,
      maxHealth: 100,
      speed: 28,
      dashCooldown: 2.4,
      dashTimer: 0,
      isDashing: false,
      dashDuration: 0.18,
      novaCooldown: 14,
      novaTimer: 0,
      level: 1,
      xp: 0,
      nextXp: 30,
      multishot: 1,
      damage: 24,
      fireRate: 4.8,
      fireTimer: 0,
      projectileSpeed: 65,
      pierce: 1,
      magnetRadius: 14,
      orbitersCount: 0,
      orbitAngle: 0,
    };
  }

  // Composite 6-part procedural 3D Hero Starfighter (THREE.Group)
  private setupPlayer3D() {
    this.playerGroup = new THREE.Group();

    // Part 1: Main Fuselage Hull
    const hullGeo = new THREE.ConeGeometry(1.2, 3.6, 4);
    hullGeo.rotateX(Math.PI / 2);
    hullGeo.scale(1.2, 0.45, 1);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.8,
      roughness: 0.2,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.castShadow = true;
    this.playerGroup.add(hull);

    // Part 2: Dual Delta Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.4, -1.8);
    wingShape.lineTo(-2.4, -1.8);
    wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.12, bevelEnabled: false });
    wingGeo.rotateX(-Math.PI / 2);
    wingGeo.translate(0, 0.05, 0.4);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      metalness: 0.6,
      roughness: 0.35,
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.castShadow = true;
    this.playerGroup.add(wings);

    // Part 3: Glowing Canopy Visor
    const canopyGeo = new THREE.SphereGeometry(0.55, 16, 16);
    canopyGeo.scale(0.8, 0.45, 1.4);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.9,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.35, 0.2);
    this.playerGroup.add(canopy);

    // Part 4: Wingtip Cannon Pods
    const cannonGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8);
    cannonGeo.rotateX(Math.PI / 2);
    const cannonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const cannonL = new THREE.Mesh(cannonGeo, cannonMat);
    cannonL.position.set(-1.8, 0, 0.2);
    const cannonR = new THREE.Mesh(cannonGeo, cannonMat);
    cannonR.position.set(1.8, 0, 0.2);
    this.playerGroup.add(cannonL);
    this.playerGroup.add(cannonR);

    // Part 5: Twin Thruster Exhaust Flames
    const flameGeo = new THREE.ConeGeometry(0.3, 1.4, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });
    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(-0.55, 0, -1.8);
    const flameR = new THREE.Mesh(flameGeo, flameMat);
    flameR.position.set(0.55, 0, -1.8);
    this.playerGroup.add(flameL);
    this.playerGroup.add(flameR);
    this.thrusterFlames = [flameL, flameR];

    // Position player slightly above ground
    this.playerGroup.position.set(0, 1.2, 0);
    this.scene.add(this.playerGroup);
  }

  // Create composite Enemy 3D Group
  private createEnemy3D(type: EnemyType): THREE.Group {
    const group = new THREE.Group();

    if (type === 'scout') {
      // Swarm Interceptor: 3 parts
      const bodyGeo = new THREE.TetrahedronGeometry(1.2);
      bodyGeo.scale(1, 0.4, 1.4);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.7,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      // Neon Eye
      const eyeGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0, 0, 0.6);
      group.add(eye);
    } else if (type === 'brute') {
      // Heavy Battering Ram: 4 parts
      const coreGeo = new THREE.BoxGeometry(2.4, 1.6, 2.4);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xf87171,
        metalness: 0.85,
        roughness: 0.25,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.castShadow = true;
      group.add(core);

      // Piston ram
      const ramGeo = new THREE.ConeGeometry(1.2, 1.8, 4);
      ramGeo.rotateX(Math.PI / 2);
      const ramMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.1 });
      const ram = new THREE.Mesh(ramGeo, ramMat);
      ram.position.set(0, 0, 1.6);
      group.add(ram);
    } else if (type === 'disruptor') {
      // Floating Octahedron Core + Orbiting Ring
      const prismGeo = new THREE.OctahedronGeometry(1.4);
      const prismMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
      });
      const prism = new THREE.Mesh(prismGeo, prismMat);
      group.add(prism);

      const ringGeo = new THREE.TorusGeometry(2.2, 0.1, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      group.add(ring);
    } else if (type === 'boss') {
      // Dreadnought Omega: 8 parts
      const mainHull = new THREE.CylinderGeometry(4.5, 4.5, 1.8, 12);
      const hullMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.2,
      });
      const hull = new THREE.Mesh(mainHull, hullMat);
      hull.castShadow = true;
      group.add(hull);

      const domeGeo = new THREE.SphereGeometry(2.2, 16, 16);
      const domeMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.6,
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.y = 0.8;
      group.add(dome);

      // 4 peripheral gun pods
      for (let i = 0; i < 4; i++) {
        const podGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
        const podMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.9, roughness: 0.3 });
        const pod = new THREE.Mesh(podGeo, podMat);
        const a = (i * Math.PI) / 2;
        pod.position.set(Math.cos(a) * 4.6, 0, Math.sin(a) * 4.6);
        group.add(pod);
      }
    }

    group.position.y = 1.4;
    this.scene.add(group);
    return group;
  }

  // Create 3D Gem Pickup
  private createGem3D(type: 'xp' | 'health'): THREE.Mesh {
    const geo = new THREE.OctahedronGeometry(0.55);
    const mat = new THREE.MeshStandardMaterial({
      color: type === 'health' ? 0x34d399 : 0x38bdf8,
      emissive: type === 'health' ? 0x059669 : 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.8;
    this.scene.add(mesh);
    return mesh;
  }

  // Create 3D Projectile
  private createProjectile3D(color: number, radius = 0.35): THREE.Mesh {
    const geo = new THREE.SphereGeometry(radius, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    return mesh;
  }

  public resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
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
        if (this.state === 'TITLE') this.startGame();
        else if (this.state === 'PLAYING') this.triggerDash();
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
      this.touchMoveX = 0;
      this.touchMoveY = 0;
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.isMouseDown = true;
      else if (e.button === 2 && this.state === 'PLAYING') this.triggerDash();
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMouseDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public setTouchMove(vx: number, vy: number) {
    this.touchMoveX = vx;
    this.touchMoveY = vy;
  }

  public toggleAutoAim(): boolean {
    this.autoAim = !this.autoAim;
    return this.autoAim;
  }

  public startGame() {
    this.cleanupEntities();
    this.resetPlayer();
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
      if (this.onStateChange) this.onStateChange('PLAYING');
    }
  }

  public resumeAfterLevelUp() {
    this.state = 'PLAYING';
    if (this.onStateChange) this.onStateChange('PLAYING');
  }

  public triggerDash() {
    if (this.player.dashTimer <= 0 && !this.player.isDashing) {
      this.player.isDashing = true;
      this.player.dashTimer = this.player.dashCooldown;
      sound.dash();
      this.screenShake = 0.8;

      // Burst particles
      for (let i = 0; i < 15; i++) {
        this.addParticle(
          this.player.x,
          1.2,
          this.player.y,
          (Math.random() - 0.5) * 12,
          Math.random() * 4,
          (Math.random() - 0.5) * 12,
          '#38bdf8',
          1.5
        );
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
      this.screenShake = 1.8;
      this.hitstopTimer = 0.06;

      const novaRadius = 24;

      // Ring shockwave particles
      for (let i = 0; i < 60; i++) {
        const a = (i * Math.PI * 2) / 60;
        this.addParticle(
          this.player.x,
          0.8,
          this.player.y,
          Math.cos(a) * 28,
          0,
          Math.sin(a) * 28,
          '#c084fc',
          1.8
        );
      }

      // Damage all nearby enemies
      this.enemies.forEach(({ data, group }) => {
        const dx = data.x - this.player.x;
        const dz = data.y - this.player.y;
        const dist = Math.hypot(dx, dz);

        if (dist < novaRadius) {
          data.health -= 120;
          data.flashTimer = 0.15;
          const angle = Math.atan2(dz, dx);
          data.vx += Math.cos(angle) * 35;
          data.vy += Math.sin(angle) * 35;
        }
      });
    }
  }

  private addParticle(x: number, y: number, z: number, vx: number, vy: number, vz: number, colorHex: string, decay = 2) {
    if (this.activeParticles.length >= this.MAX_PARTICLES) return;
    this.activeParticles.push({
      x,
      y,
      vx,
      vy,
      size: vz, // using size as vz internally
      color: colorHex,
      alpha: 1.0,
      decay,
      type: 'spark',
    });
  }

  public startLoop() {
    const loop = () => {
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else if (this.state === 'PLAYING') {
        this.update(dt);
      }

      this.render(dt);
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

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 4.5);
    }

    // 2. Player Input & Movement
    let moveX = 0;
    let moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    if (this.touchMoveX !== 0 || this.touchMoveY !== 0) {
      moveX = this.touchMoveX;
      moveZ = this.touchMoveY;
    }

    const len = Math.hypot(moveX, moveZ);
    const speed = this.player.isDashing ? this.player.speed * 2.6 : this.player.speed;
    if (len > 0) {
      this.player.vx = (moveX / len) * speed;
      this.player.vy = (moveZ / len) * speed;
    } else {
      this.player.vx *= Math.pow(0.01, dt);
      this.player.vy *= Math.pow(0.01, dt);
    }

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Bounds (-120 to 120)
    const bounds = 110;
    this.player.x = Math.max(-bounds, Math.min(bounds, this.player.x));
    this.player.y = Math.max(-bounds, Math.min(bounds, this.player.y));

    // Update 3D player position & banking
    this.playerGroup.position.set(this.player.x, 1.2, this.player.y);
    const targetRoll = -this.player.vx * 0.018;
    this.playerGroup.rotation.z = THREE.MathUtils.damp(this.playerGroup.rotation.z, targetRoll, 10, dt);

    // 3. Aiming (Raycast to ground or Auto-Aim)
    let hasAutoTarget = false;
    if (this.autoAim && this.enemies.length > 0) {
      let closestDist = 45;
      let targetEnemy: Enemy | null = null;
      for (const { data } of this.enemies) {
        const d = Math.hypot(data.x - this.player.x, data.y - this.player.y);
        if (d < closestDist) {
          closestDist = d;
          targetEnemy = data;
        }
      }
      if (targetEnemy) {
        this.player.angle = Math.atan2(targetEnemy.y - this.player.y, targetEnemy.x - this.player.x);
        hasAutoTarget = true;
      }
    }

    if (!hasAutoTarget) {
      this.raycaster.setFromCamera(this.mouseNDC, this.camera);
      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint)) {
        this.player.angle = Math.atan2(hitPoint.z - this.player.y, hitPoint.x - this.player.x);
      } else if (len > 0) {
        this.player.angle = Math.atan2(moveZ, moveX);
      }
    }

    // Facing rotation in 3D (Y-axis)
    this.playerGroup.rotation.y = -this.player.angle + Math.PI / 2;

    // Thruster flame flicker
    const flameScale = len > 0 || this.player.isDashing ? 1.4 + Math.random() * 0.4 : 0.6;
    this.thrusterFlames.forEach((flame) => flame.scale.set(1, flameScale, 1));

    // 4. Shooting
    const shouldFire = (this.isMouseDown || (this.autoAim && hasAutoTarget)) && !this.player.isDashing;
    if (shouldFire && this.player.fireTimer >= 1 / this.player.fireRate) {
      this.player.fireTimer = 0;
      sound.laser();

      const baseAngle = this.player.angle;
      const spread = 0.14;
      const count = this.player.multishot;

      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * spread;
        const angle = baseAngle + offset;
        const mesh = this.createProjectile3D(0x38bdf8, 0.28);
        mesh.position.set(this.player.x, 1.2, this.player.y);

        this.projectiles.push({
          data: {
            id: 'p-' + Math.random(),
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * this.player.projectileSpeed,
            vy: Math.sin(angle) * this.player.projectileSpeed,
            radius: 0.8,
            damage: this.player.damage,
            color: '#38bdf8',
            life: 1.6,
            maxLife: 1.6,
            isEnemy: false,
            pierceLeft: this.player.pierce,
          },
          mesh,
        });
      }
    }

    // 5. Projectiles update
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.data.x += p.data.vx * dt;
      p.data.y += p.data.vy * dt;
      p.mesh.position.set(p.data.x, 1.2, p.data.y);
      p.data.life -= dt;

      if (p.data.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with enemies if player projectile
      if (!p.data.isEnemy) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const dist = Math.hypot(p.data.x - e.data.x, p.data.y - e.data.y);
          if (dist < p.data.radius + e.data.radius) {
            e.data.health -= p.data.damage;
            e.data.flashTimer = 0.08;
            sound.hit();

            // Spawn hit sparks
            for (let k = 0; k < 4; k++) {
              this.addParticle(
                p.data.x,
                1.2,
                p.data.y,
                (Math.random() - 0.5) * 8,
                Math.random() * 4,
                (Math.random() - 0.5) * 8,
                '#38bdf8',
                3
              );
            }

            p.data.pierceLeft--;
            if (p.data.pierceLeft <= 0) {
              this.scene.remove(p.mesh);
              p.mesh.geometry.dispose();
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    // 6. Wave & Spawning
    this.waveTimer += dt;
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.6, 2.5 - this.wave * 0.15);
    if (this.spawnTimer >= spawnInterval && this.enemies.length < 40 + this.wave * 6) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    if (this.waveTimer >= this.waveDuration) {
      this.waveTimer = 0;
      this.wave++;
      this.score += 500 * this.wave;
      if (this.wave === 5 || this.wave === 10) {
        this.spawnBoss();
      }
    }

    // 7. Enemies update
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const { data, group } = this.enemies[i];
      if (data.flashTimer > 0) data.flashTimer -= dt;

      // Death check
      if (data.health <= 0) {
        sound.explosion(data.type === 'boss' ? 2.5 : 1);
        this.score += data.xpValue * 10;
        this.screenShake = data.type === 'boss' ? 1.6 : 0.4;

        // Death particle burst
        const count = data.type === 'boss' ? 50 : 16;
        for (let k = 0; k < count; k++) {
          this.addParticle(
            data.x,
            1.2,
            data.y,
            (Math.random() - 0.5) * 16,
            Math.random() * 8,
            (Math.random() - 0.5) * 16,
            data.color,
            1.8
          );
        }

        // Drop Gem
        const gemMesh = this.createGem3D(Math.random() < 0.08 ? 'health' : 'xp');
        gemMesh.position.set(data.x, 0.8, data.y);
        this.gems.push({
          data: {
            id: 'gem-' + Math.random(),
            x: data.x,
            y: data.y,
            vx: 0,
            vy: 0,
            value: data.xpValue,
            type: Math.random() < 0.08 ? 'health' : 'xp',
            radius: 1.2,
          },
          mesh: gemMesh,
        });

        this.scene.remove(group);
        this.enemies.splice(i, 1);
        continue;
      }

      // Movement toward player
      const dx = this.player.x - data.x;
      const dz = this.player.y - data.y;
      const dist = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);

      data.vx = Math.cos(angle) * data.speed;
      data.vy = Math.sin(angle) * data.speed;
      data.x += data.vx * dt;
      data.y += data.vy * dt;

      group.position.set(data.x, 1.2, data.y);
      group.rotation.y = -angle + Math.PI / 2;

      // Player collision damage
      if (dist < data.radius + this.player.radius && !this.player.isDashing) {
        this.playerTakeDamage(data.damage * dt * 2.2);
      }
    }

    // 8. Gems Attraction & Pickups
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      const dx = this.player.x - g.data.x;
      const dz = this.player.y - g.data.y;
      const dist = Math.hypot(dx, dz);

      if (dist < this.player.magnetRadius) {
        const a = Math.atan2(dz, dx);
        g.data.vx += Math.cos(a) * 55 * dt;
        g.data.vy += Math.sin(a) * 55 * dt;
        g.data.x += g.data.vx * dt;
        g.data.y += g.data.vy * dt;
      }

      g.mesh.position.set(g.data.x, 0.8 + Math.sin(this.clock.elapsedTime * 4) * 0.2, g.data.y);
      g.mesh.rotation.y += dt * 3;

      if (dist < this.player.radius + g.data.radius) {
        sound.gemPickup();
        if (g.data.type === 'xp') {
          this.addXp(g.data.value);
        } else {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 30);
        }
        this.scene.remove(g.mesh);
        g.mesh.geometry.dispose();
        this.gems.splice(i, 1);
      }
    }

    // 9. Particle Simulation
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      p.vy -= 9.8 * dt; // gravity

      if (p.alpha <= 0 || p.y < 0) {
        this.activeParticles.splice(i, 1);
      }
    }

    // Update Particle BufferGeometry
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const idx = i * 3;
      if (i < this.activeParticles.length) {
        const p = this.activeParticles[i];
        this.particlePositions[idx] = p.x;
        this.particlePositions[idx + 1] = Math.max(0.1, p.y);
        this.particlePositions[idx + 2] = p.size; // stored z

        this.particleColors[idx] = 0.22;
        this.particleColors[idx + 1] = 0.74;
        this.particleColors[idx + 2] = 0.97;
      } else {
        this.particlePositions[idx + 1] = -999;
      }
    }
    this.particlePoints.geometry.attributes.position.needsUpdate = true;

    // 10. Update HUD Data
    if (this.onHUDUpdate) {
      const radarEnemies = this.enemies.map(({ data }) => ({
        x: data.x,
        y: data.y,
        type: data.type,
      }));

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
        playerPos: {
          x: this.player.x,
          y: this.player.y,
          angle: this.player.angle,
        },
        radarEnemies,
        arenaRadius: 110,
      });
    }
  }

  private spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 55;
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;

    const roll = Math.random();
    let type: EnemyType = 'scout';
    if (this.wave >= 2 && roll < 0.35) type = 'brute';
    else if (this.wave >= 3 && roll < 0.55) type = 'disruptor';

    const group = this.createEnemy3D(type);
    group.position.set(x, 1.2, y);

    const speeds = { scout: 18 + this.wave * 1.2, brute: 12 + this.wave * 0.8, disruptor: 14 + this.wave * 0.9, boss: 8 };
    const hps = { scout: 28 + this.wave * 9, brute: 95 + this.wave * 25, disruptor: 55 + this.wave * 16, boss: 1400 };

    this.enemies.push({
      data: {
        id: 'e-' + Math.random(),
        type,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: type === 'brute' ? 2.2 : 1.4,
        health: hps[type],
        maxHealth: hps[type],
        speed: speeds[type],
        damage: type === 'brute' ? 28 : 14,
        color: type === 'brute' ? '#f87171' : type === 'disruptor' ? '#38bdf8' : '#c084fc',
        xpValue: type === 'brute' ? 24 : 8,
        telegraphTimer: 0,
        telegraphDuration: 0.8,
        isCharging: false,
        chargeTargetX: 0,
        chargeTargetY: 0,
        attackTimer: 0,
        flashTimer: 0,
      },
      group,
    });
  }

  private spawnBoss() {
    const angle = Math.random() * Math.PI * 2;
    const x = this.player.x + Math.cos(angle) * 50;
    const y = this.player.y + Math.sin(angle) * 50;

    const group = this.createEnemy3D('boss');
    group.position.set(x, 1.8, y);

    this.enemies.push({
      data: {
        id: 'boss-' + this.wave,
        type: 'boss',
        x,
        y,
        vx: 0,
        vy: 0,
        radius: 4.8,
        health: 1200 + this.wave * 400,
        maxHealth: 1200 + this.wave * 400,
        speed: 8.5,
        damage: 42,
        color: '#f59e0b',
        xpValue: 300,
        telegraphTimer: 0,
        telegraphDuration: 1,
        isCharging: false,
        chargeTargetX: 0,
        chargeTargetY: 0,
        attackTimer: 2,
        flashTimer: 0,
      },
      group,
    });
  }

  private playerTakeDamage(amount: number) {
    this.player.health -= amount;
    this.screenShake = 0.8;
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

      this.state = 'LEVEL_UP';
      if (this.onStateChange) this.onStateChange('LEVEL_UP');
      if (this.onLevelUpTrigger) this.onLevelUpTrigger();
    }
  }

  private cleanupEntities() {
    this.enemies.forEach((e) => this.scene.remove(e.group));
    this.enemies = [];

    this.projectiles.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    });
    this.projectiles = [];

    this.gems.forEach((g) => {
      this.scene.remove(g.mesh);
      g.mesh.geometry.dispose();
    });
    this.gems = [];
    this.activeParticles = [];
  }

  private render(dt: number) {
    // Smooth camera tracking above player
    const targetCamX = this.player.x;
    const targetCamZ = this.player.y + 30;
    this.camTarget.x = THREE.MathUtils.damp(this.camTarget.x, targetCamX, 6, dt);
    this.camTarget.z = THREE.MathUtils.damp(this.camTarget.z, targetCamZ, 6, dt);

    // Apply Screen Shake
    let shakeX = 0;
    let shakeZ = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake;
      shakeZ = (Math.random() - 0.5) * this.screenShake;
    }

    this.camera.position.set(this.camTarget.x + shakeX, 42, this.camTarget.z + shakeZ);
    this.camera.lookAt(this.camTarget.x, 0, this.camTarget.z - 30);

    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.stopLoop();
    this.cleanupEntities();
    this.renderer.dispose();
  }
}
