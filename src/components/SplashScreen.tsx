import React, { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onChime: (canPlay: () => boolean) => void;
  onComplete: () => void;
}

interface ConvergingParticle {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  orbitRadius: number;
  orbitAngle: number;
  delay: number;
  color: string;
  size: number;
}

interface BurstSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

// 14x15 pixel-art cute bouncing & smiling lantern mascot sprite
// Legend: . = empty, C = copper cap, G = gold rim, B = cyan body, L = bright core, W = highlight, E = eye, K = rosy cheek, M = smile
const MASCOT_FRAME_OPEN = [
  '.....GGGG.....',
  '....G....G....',
  '...CCCCCCCC...',
  '..CGGGGGGGGC..',
  '..BBBBBBBBBB..',
  '.BBLLLLLLLLBB.',
  '.BBLWWLLWWLBB.',
  '.BBLEELLLELBB.',
  '.BBKLLLLLLKBB.',
  '.BBLLMMMMLLBB.',
  '.BBLLLLLLLLBB.',
  '..BBBBBBBBBB..',
  '...GGGGGGGG...',
  '....GG..GG....',
];

const MASCOT_FRAME_HAPPY = [
  '.....GGGG.....',
  '....G....G....',
  '...CCCCCCCC...',
  '..CGGGGGGGGC..',
  '..BBBBBBBBBB..',
  '.BBLLLLLLLLBB.',
  '.BBLWWLLWWLBB.',
  '.BBE.ELLLE.EB.',
  '.BBKLLLLLLKBB.',
  '.BBLLMMMMLLBB.',
  '.BBLLLLLLLLBB.',
  '..BBBBBBBBBB..',
  '...GGGGGGGG...',
  '....GG..GG....',
];

const MASCOT_PALETTE: Record<string, string> = {
  C: '#b45309',
  G: '#fbbf24',
  B: '#0891b2',
  L: '#67e8f9',
  W: '#ecfeff',
  E: '#0f172a',
  K: '#fb7185',
  M: '#164e63',
};

const PARTICLE_COLORS = [
  '#22d3ee',
  '#fde047',
  '#c084fc',
  '#34d399',
  '#fb7185',
  '#67e8f9',
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onChime, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(true);
  const skippingRef = useRef(false);
  const completedRef = useRef(false);
  const chimeFiredRef = useRef(false);
  const onChimeRef = useRef(onChime);
  const onCompleteRef = useRef(onComplete);
  onChimeRef.current = onChime;
  onCompleteRef.current = onComplete;

  const [logoVisible, setLogoVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const finishSoon = (delayMs = 550) => {
    if (skippingRef.current) return;
    skippingRef.current = true;
    activeRef.current = false;
    setFadingOut(true);
    window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
    }, delayMs);
  };

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setLogoVisible(true);
      if (!chimeFiredRef.current) {
        chimeFiredRef.current = true;
        onChimeRef.current(() => activeRef.current);
      }
      const timer = window.setTimeout(() => finishSoon(200), 1400);
      return () => window.clearTimeout(timer);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const LOGICAL_H = 120;
    let logicalW = 214;

    const resize = () => {
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      logicalW = Math.max(150, Math.min(280, Math.round(LOGICAL_H * aspect)));
      canvas.width = logicalW;
      canvas.height = LOGICAL_H;
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    window.addEventListener('resize', resize);

    const mascotAnchorX = Math.floor(logicalW / 2);
    const mascotAnchorY = Math.floor(LOGICAL_H * 0.36);

    // Build converging particles targeting filled pixels of the mascot
    const filledCells: Array<{ x: number; y: number; color: string }> = [];
    for (let r = 0; r < MASCOT_FRAME_OPEN.length; r++) {
      for (let c = 0; c < MASCOT_FRAME_OPEN[r].length; c++) {
        const ch = MASCOT_FRAME_OPEN[r][c];
        if (ch !== '.') {
          filledCells.push({
            x: mascotAnchorX - 14 + c * 2,
            y: mascotAnchorY - 14 + r * 2,
            color: MASCOT_PALETTE[ch] || '#22d3ee',
          });
        }
      }
    }

    const particles: ConvergingParticle[] = [];
    const totalParticles = Math.max(90, filledCells.length);
    for (let i = 0; i < totalParticles; i++) {
      const target = filledCells[i % filledCells.length];
      const angle = (i / totalParticles) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = 62 + Math.random() * 58;
      particles.push({
        startX: mascotAnchorX + Math.cos(angle) * dist,
        startY: mascotAnchorY + Math.sin(angle) * dist * 0.72,
        targetX: target.x,
        targetY: target.y,
        orbitRadius: 16 + Math.random() * 24,
        orbitAngle: angle,
        delay: Math.random() * 0.28,
        color:
          i % 3 === 0
            ? target.color
            : PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        size: i % 5 === 0 ? 2 : 1,
      });
    }

    const sparks: BurstSpark[] = [];
    let burstSpawned = false;
    let rafId = 0;
    const startMs = performance.now();
    let lastMs = startMs;

    const spawnRevealBurst = () => {
      for (let i = 0; i < 34; i++) {
        const angle = (i / 34) * Math.PI * 2 + Math.random() * 0.2;
        const speed = 26 + Math.random() * 44;
        sparks.push({
          x: mascotAnchorX,
          y: mascotAnchorY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 8,
          life: 0.75 + Math.random() * 0.55,
          maxLife: 1.3,
          color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        });
      }
    };

    const drawMascot = (elapsed: number, cx: number, cy: number, alpha: number) => {
      if (alpha <= 0) return;
      // Playful bounce after snap
      const sinceSnap = Math.max(0, elapsed - 1.1);
      const bounce =
        sinceSnap < 0.7
          ? Math.abs(Math.sin(sinceSnap * Math.PI * 2.8)) * Math.exp(-sinceSnap * 2.1) * -7
          : Math.sin((sinceSnap - 0.7) * 4.2) * 1.6;
      const scale = 2;
      const happyBlink = elapsed > 1.75 && elapsed < 2.15;
      const sprite = happyBlink ? MASCOT_FRAME_HAPPY : MASCOT_FRAME_OPEN;
      const originX = Math.round(cx - (sprite[0].length * scale) / 2);
      const originY = Math.round(cy - (sprite.length * scale) / 2 + bounce);

      ctx.save();
      ctx.globalAlpha = alpha;

      // Soft pixel aura behind mascot
      const haloR = 22 + Math.sin(elapsed * 5) * 2.5;
      const grad = ctx.createRadialGradient(cx, cy + bounce, 2, cx, cy + bounce, haloR);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.36)');
      grad.addColorStop(0.55, 'rgba(251, 191, 36, 0.14)');
      grad.addColorStop(1, 'rgba(5, 7, 12, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy + bounce, haloR, 0, Math.PI * 2);
      ctx.fill();

      for (let r = 0; r < sprite.length; r++) {
        for (let c = 0; c < sprite[r].length; c++) {
          const ch = sprite[r][c];
          if (ch === '.') continue;
          ctx.fillStyle = MASCOT_PALETTE[ch];
          ctx.fillRect(originX + c * scale, originY + r * scale, scale, scale);
        }
      }

      // Orbiting twin sparkles around mascot
      for (let k = 0; k < 3; k++) {
        const a = elapsed * 2.8 + (k * Math.PI * 2) / 3;
        const sx = Math.round(cx + Math.cos(a) * 19);
        const sy = Math.round(cy + bounce + Math.sin(a * 1.3) * 11);
        ctx.fillStyle = k === 1 ? '#fde047' : '#67e8f9';
        ctx.fillRect(sx, sy, 2, 2);
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      const elapsed = (now - startMs) / 1000;
      const dt = Math.min(0.05, (now - lastMs) / 1000);
      lastMs = now;

      const cx = Math.floor(logicalW / 2);
      const cy = Math.floor(LOGICAL_H * 0.36);

      // Clear deep abyssal backdrop
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, logicalW, LOGICAL_H);

      // Subtle twilight radial glow
      const bgGrad = ctx.createRadialGradient(cx, cy + 10, 4, cx, cy + 10, logicalW * 0.48);
      bgGrad.addColorStop(0, 'rgba(22, 78, 99, 0.24)');
      bgGrad.addColorStop(0.55, 'rgba(88, 28, 135, 0.08)');
      bgGrad.addColorStop(1, 'rgba(5, 7, 12, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, logicalW, LOGICAL_H);

      // Phase 1: Playful swirling & converging pixel particles (0s -> 1.25s)
      for (const p of particles) {
        const localT = Math.max(0, Math.min(1, (elapsed - p.delay) / 0.92));
        if (localT < 1) {
          // Ease out back-like playful curve
          const ease = 1 - Math.pow(1 - localT, 3);
          const swirl = (1 - ease) * p.orbitRadius;
          const spin = p.orbitAngle + (1 - ease) * 3.8;
          const tx = cx + (p.targetX - mascotAnchorX);
          const ty = cy + (p.targetY - mascotAnchorY);
          const px = p.startX * (1 - ease) + tx * ease + Math.cos(spin) * swirl * 0.45;
          const py = p.startY * (1 - ease) + ty * ease + Math.sin(spin) * swirl * 0.35;

          ctx.fillStyle = p.color;
          ctx.fillRect(Math.round(px), Math.round(py), p.size, p.size);
        }
      }

      // Snap mascot + logo reveal around 1.05s
      if (elapsed >= 1.05 && !burstSpawned) {
        burstSpawned = true;
        spawnRevealBurst();
        setLogoVisible(true);
        if (!chimeFiredRef.current) {
          chimeFiredRef.current = true;
          onChimeRef.current(() => activeRef.current);
        }
      }

      // Phase 2: Mascot appears cleanly as particles coalesce
      if (elapsed >= 0.95) {
        const mascotAlpha = Math.min(1, (elapsed - 0.95) / 0.22);
        drawMascot(elapsed, cx, cy, mascotAlpha);
      }

      // Celebratory burst sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 28 * dt;
        s.life -= dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
        ctx.fillStyle = s.color;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
        ctx.restore();
      }

      // Auto transition at ~2.95s -> +0.55s fade = ~3.5s total
      if (elapsed >= 2.95 && !skippingRef.current) {
        finishSoon(550);
      }

      if (!completedRef.current) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Capture-phase key listener & click skip
  useEffect(() => {
    const onAnyKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      finishSoon(360);
    };

    window.addEventListener('keydown', onAnyKey, true);
    return () => {
      window.removeEventListener('keydown', onAnyKey, true);
    };
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Tela de abertura Nexos — clique ou pressione qualquer tecla para pular"
      onClick={() => finishSoon(360)}
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#05070c] cursor-pointer select-none transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Crisp Pixel-Art Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pixelated pointer-events-none"
      />

      {/* Glowing Logo & Nexos Signature Overlay */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 mt-28 sm:mt-32 transition-all duration-700 ${
          logoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-1.5 h-1.5 bg-[#fbbf24] inline-block" aria-hidden="true" />
          <span className="w-8 h-[1px] bg-[#22d3ee]/50 inline-block" aria-hidden="true" />
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#67e8f9]/90 font-semibold">
            Apresenta
          </span>
          <span className="w-8 h-[1px] bg-[#22d3ee]/50 inline-block" aria-hidden="true" />
          <span className="w-1.5 h-1.5 bg-[#fbbf24] inline-block" aria-hidden="true" />
        </div>

        <h1
          className="font-display font-bold tracking-[0.1em] text-[#f8fafc] leading-none"
          style={{
            fontSize: 'clamp(1.6rem, 5.2vw, 3.35rem)',
            textShadow:
              '0 0 18px rgba(34, 211, 238, 0.52), 0 0 36px rgba(251, 191, 36, 0.24), 0 3px 0 rgba(7, 9, 14, 0.9)',
          }}
        >
          ECOS DO ABISMO
        </h1>

        <div className="mt-3.5 inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#0b101b]/80 border border-[#22d3ee]/30 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
          <span className="w-2 h-2 bg-[#22d3ee] rotate-45 inline-block" aria-hidden="true" />
          <span className="text-xs sm:text-sm tracking-[0.18em] uppercase text-[#e2e8f0] font-medium">
            Feito por{' '}
            <span className="font-display font-bold tracking-[0.2em] text-[#fde047] drop-shadow-[0_0_8px_rgba(253,224,71,0.45)]">
              NEXOS
            </span>
          </span>
          <span className="w-2 h-2 bg-[#fbbf24] rotate-45 inline-block" aria-hidden="true" />
        </div>
      </div>

      {/* Subtle Skip Hint */}
      <div className="absolute bottom-5 inset-x-0 text-center pointer-events-none">
        <span className="text-[11px] tracking-[0.14em] uppercase text-[#64748b]">
          Clique ou pressione qualquer tecla para pular
        </span>
      </div>
    </div>
  );
};
