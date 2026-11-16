import { Direction, PortraitId, TileKind } from './types';

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function getCtx(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function hash2d(x: number, y: number, seed = 1337): number {
  let n = x * 374761393 + y * 668265263 + seed * 1442695041;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Draw from string grid where '.' is transparent
function drawPixelMap(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  ox = 0,
  oy = 0,
  flipX = false
): void {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      if (ch === '.' || !palette[ch]) continue;
      const drawX = flipX ? ox + (width - 1 - x) : ox + x;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(drawX, oy + y, 1, 1);
    }
  }
}

export class PixelAtlas {
  private tileCache = new Map<string, HTMLCanvasElement>();
  private vaelSprites = new Map<string, HTMLCanvasElement>();
  private npcSprites = new Map<string, HTMLCanvasElement>();
  private enemySprites = new Map<string, HTMLCanvasElement>();
  private objectSprites = new Map<string, HTMLCanvasElement>();
  private portraits = new Map<PortraitId, string>();

  constructor() {
    this.buildTiles();
    this.buildVaelSprites();
    this.buildNpcSprites();
    this.buildEnemySprites();
    this.buildObjectSprites();
    this.buildPortraits();
  }

  public getTile(kind: TileKind, variant: number): HTMLCanvasElement {
    const v = Math.abs(variant) % 8;
    return this.tileCache.get(`${kind}_${v}`) ?? this.tileCache.get(`${kind}_0`)!;
  }

  public getVael(dir: Direction, frame: number, alignment = 0): HTMLCanvasElement {
    const clamped = Math.max(-3, Math.min(3, Math.round(alignment)));
    const key = `${clamped}_${dir}_${frame % 4}`;
    if (!this.vaelSprites.has(key)) {
      this.buildVaelSpritesForAlignment(clamped);
    }
    return this.vaelSprites.get(key)!;
  }

  public getNpc(
    id: string,
    restored = false,
    dir: Direction = 'down',
    frame = 0
  ): HTMLCanvasElement {
    const f = frame % 2;
    return (
      this.npcSprites.get(`${id}_${restored ? '1' : '0'}_${dir}_${f}`) ??
      this.npcSprites.get(`${id}_0_down_0`)!
    );
  }

  public getEnemy(kind: 'oco' | 'fauna', frame: number, stunned: boolean): HTMLCanvasElement {
    const key = `${kind}_${frame % 2}_${stunned ? 's' : 'n'}`;
    return this.enemySprites.get(key)!;
  }

  public getObject(key: string): HTMLCanvasElement | undefined {
    return this.objectSprites.get(key);
  }

  public getPortraitDataUrl(id: PortraitId): string {
    return this.portraits.get(id) ?? this.portraits.get('objeto')!;
  }

  private buildTiles(): void {
    const kinds: TileKind[] = [
      'void',
      'ash_ground',
      'cobble',
      'wood_floor',
      'wall_stone',
      'wall_timber',
      'roof_slate',
      'roof_copper',
      'forest_floor',
      'forest_path',
      'tree_dark',
      'water_abyss',
      'bridge_root',
      'citadel_floor',
      'citadel_gold',
      'citadel_wall',
      'gate_locked',
      'gate_open',
    ];

    for (const kind of kinds) {
      for (let v = 0; v < 8; v++) {
        const c = makeCanvas(16, 16);
        const ctx = getCtx(c);
        this.renderTile(ctx, kind, v);
        this.tileCache.set(`${kind}_${v}`, c);
      }
    }
  }

  private renderTile(ctx: CanvasRenderingContext2D, kind: TileKind, v: number): void {
    const seed = v * 131 + 17;
    switch (kind) {
      case 'void': {
        px(ctx, 0, 0, '#06080d', 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = hash2d(x, y, seed);
            if (r > 0.94) px(ctx, x, y, '#0d121d');
            else if (r < 0.04) px(ctx, x, y, '#040509');
          }
        }
        break;
      }
      case 'ash_ground': {
        // Vila de Cinza-Branca: muted ash-ochre earth with 16-bit dithering, mossy stones & wildflowers
        px(ctx, 0, 0, '#292624', 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = hash2d(x, y, seed);
            const checker = (x + y) % 2 === 0;
            if (r > 0.86) px(ctx, x, y, '#38332f');
            else if (r > 0.72 && checker) px(ctx, x, y, '#474037');
            else if (r < 0.14) px(ctx, x, y, '#1e1c1a');
            else if (r > 0.965) px(ctx, x, y, '#736d65'); // pale ash fleck
          }
        }
        if (v === 1 || v === 4 || v === 7) {
          // Pedras musgosas (shaded pebble cluster with rim light & sage moss)
          const ox = v === 1 ? 3 : v === 4 ? 8 : 5;
          const oy = v === 1 ? 9 : v === 4 ? 4 : 10;
          px(ctx, ox, oy + 2, '#17181c', 5, 2); // shadow
          px(ctx, ox, oy, '#4b4e57', 5, 3);
          px(ctx, ox + 1, oy, '#6e727d', 3, 1); // rim highlight
          px(ctx, ox + 3, oy + 1, '#4c5c3b', 2, 2); // moss patch
          px(ctx, ox + 3, oy + 1, '#6f8255', 1, 1);
          if (v === 4) {
            px(ctx, ox - 4, oy + 6, '#43464f', 3, 2);
            px(ctx, ox - 4, oy + 6, '#5e626d', 2, 1);
          }
        } else if (v === 2 || v === 5) {
          // Flores silvestres (tiny wild blossoms in muted amber/ivory/sky)
          const fx = v === 2 ? 4 : 9;
          const fy = v === 2 ? 4 : 9;
          px(ctx, fx, fy + 2, '#3a462f', 3, 2);
          px(ctx, fx + 1, fy + 1, '#526342', 1, 2);
          px(ctx, fx, fy, v === 2 ? '#e5e1d8' : '#eab308', 1, 1);
          px(ctx, fx + 2, fy + 1, v === 2 ? '#7dd3fc' : '#f59e0b', 1, 1);
          px(ctx, fx - 2, fy + 3, '#526342', 1, 1);
          px(ctx, fx - 2, fy + 2, '#fde68a', 1, 1);
        } else if (v === 3 || v === 6) {
          // Scattered dried ember leaves / pebble dust
          px(ctx, 10, 4, '#5a4c3d', 2, 1);
          px(ctx, 11, 5, '#3b332b', 1, 1);
          px(ctx, 3, 11, '#5f5b55', 2, 1);
        }
        break;
      }
      case 'cobble': {
        // Worn cobblestone path with varied stone bonds, bevel highlights, moss & ash crevices
        px(ctx, 0, 0, '#17181d', 16, 16);
        const stones =
          v % 2 === 0
            ? [
                [1, 1, 6, 6],
                [8, 1, 7, 5],
                [1, 8, 7, 7],
                [9, 7, 6, 8],
              ]
            : [
                [1, 1, 8, 5],
                [10, 1, 5, 7],
                [1, 7, 5, 8],
                [7, 9, 8, 6],
              ];
        stones.forEach(([sx, sy, sw, sh], i) => {
          const shade = (i + v) % 3 === 0 ? '#3e4048' : (i + v) % 2 === 0 ? '#34363e' : '#2d2f36';
          px(ctx, sx, sy, shade, sw, sh);
          // Rim highlight & subtle dithering
          px(ctx, sx + 1, sy, '#545763', sw - 2, 1);
          px(ctx, sx, sy + 1, '#474954', 1, sh - 2);
          px(ctx, sx, sy + sh - 1, '#202127', sw, 1);
          px(ctx, sx + sw - 1, sy + sh - 1, '#17181d', 1, 1);
          if ((i + v) % 2 === 0 && sw > 4) {
            px(ctx, sx + 2, sy + 2, '#43454f', 1, 1);
            px(ctx, sx + 4, sy + 3, '#272930', 1, 1);
          }
          if ((i + v) % 3 === 0) {
            // Sunken surface crack
            px(ctx, sx + 2, sy + 2, '#212228', 2, 1);
            px(ctx, sx + 3, sy + 3, '#212228', 1, 1);
          }
          // Ash dust or moss speck in crevices
          const h = hash2d(sx + v, sy, seed);
          if (h > 0.65) {
            px(ctx, sx + 1, sy + sh - 2, '#5e5950', 1, 1);
          } else if (h < 0.22) {
            px(ctx, sx, sy + sh - 1, '#3f4f35', 2, 1);
          }
        });
        break;
      }
      case 'wood_floor': {
        px(ctx, 0, 0, '#281f18', 16, 16);
        for (let y = 0; y < 16; y += 4) {
          const tone = ((y / 4 + v) % 2 === 0) ? '#3c2e23' : '#35281f';
          px(ctx, 0, y, tone, 16, 3);
          px(ctx, 0, y, '#4e3c2e', 16, 1);
          const seam = ((y * 3 + v * 5) % 12) + 2;
          px(ctx, seam, y, '#1e1611', 1, 3);
          px(ctx, seam - 1, y + 1, '#2a2019', 1, 1); // wood nail
        }
        break;
      }
      case 'wall_stone': {
        px(ctx, 0, 0, '#18191f', 16, 16);
        px(ctx, 0, 0, '#5a5d69', 16, 1); // crisp top rim light
        px(ctx, 0, 1, '#474954', 16, 1);
        px(ctx, 0, 2, '#3a3b44', 16, 6);
        px(ctx, 0, 8, '#2b2c34', 16, 7);
        px(ctx, 0, 15, '#121318', 16, 1);
        // Mortar seams + bevel dithering
        px(ctx, 0, 7, '#1b1c22', 16, 1);
        const s1 = 5 + (v % 5);
        const s2 = 2 + ((v * 3) % 5);
        px(ctx, s1, 2, '#1b1c22', 1, 5);
        px(ctx, s1 + 1, 2, '#494b56', 1, 4);
        px(ctx, s2, 8, '#1b1c22', 1, 7);
        px(ctx, 12 - (v % 3), 8, '#1b1c22', 1, 7);
        if (v % 2 === 0) {
          px(ctx, 2 + (v % 4), 10, '#4f5a3e', 3, 2);
          px(ctx, 2 + (v % 4), 10, '#6a7852', 1, 1);
        }
        break;
      }
      case 'wall_timber': {
        px(ctx, 0, 0, '#221913', 16, 16);
        px(ctx, 0, 0, '#594230', 16, 1);
        px(ctx, 0, 1, '#483527', 16, 1);
        px(ctx, 2, 3, '#57483c', 12, 10);
        // Plaster dithering
        for (let y = 4; y < 12; y += 2) {
          px(ctx, 3 + ((y + v) % 3), y, '#4a3d33', 2, 1);
        }
        px(ctx, 0, 2, '#35261c', 2, 13);
        px(ctx, 14, 2, '#35261c', 2, 13);
        px(ctx, 0, 14, '#16100b', 16, 2);
        px(ctx, 2, 7, '#35261c', 12, 2);
        px(ctx, 2, 7, '#4c3829', 12, 1);
        break;
      }
      case 'roof_slate': {
        px(ctx, 0, 0, '#191d25', 16, 16);
        for (let y = 0; y < 16; y += 4) {
          const offset = (y / 4) % 2 === 0 ? 0 : 4;
          px(ctx, 0, y, '#2b3240', 16, 3);
          px(ctx, 0, y, '#384052', 16, 1);
          px(ctx, 0, y + 3, '#13161d', 16, 1);
          for (let x = offset; x < 16; x += 8) {
            px(ctx, x, y, '#171b23', 1, 3);
          }
        }
        if (v % 3 === 1) px(ctx, 5 + v, 5, '#59554e', 2, 1);
        break;
      }
      case 'roof_copper': {
        px(ctx, 0, 0, '#1c2927', 16, 16);
        for (let y = 0; y < 16; y += 4) {
          px(ctx, 0, y, '#2f4b46', 16, 3);
          px(ctx, 0, y, '#446b64', 16, 1);
          px(ctx, 0, y + 3, '#15211f', 16, 1);
        }
        px(ctx, 7, 0, '#8f6c3f', 2, 16);
        px(ctx, 7, 0, '#b58d55', 1, 16);
        if (v % 2 === 0) px(ctx, 3, 6, '#38bdf8', 1, 1); // patina glint
        break;
      }
      case 'forest_floor': {
        // Bosque dos Sussurros Cristalinos: lush moss dithering, intertwined roots, varied mushrooms & reflective puddles
        px(ctx, 0, 0, '#0e1914', 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = hash2d(x, y, seed);
            const checker = (x + y) % 2 === 0;
            if (r > 0.82) px(ctx, x, y, '#172921');
            else if (r > 0.92 && checker) px(ctx, x, y, '#213c30');
            else if (r < 0.14) px(ctx, x, y, '#09110d');
          }
        }
        if (v === 1 || v === 4) {
          // Raízes entrelaçadas (intertwined mossy bark roots)
          px(ctx, 1, 10, '#2a1f18', 7, 2);
          px(ctx, 2, 10, '#453326', 4, 1);
          px(ctx, 6, 9, '#36271d', 5, 2);
          px(ctx, 7, 9, '#543e2f', 3, 1);
          px(ctx, 10, 10, '#2a1f18', 5, 2);
          px(ctx, 4, 11, '#1b362a', 3, 1); // moss over root
          if (v === 4) {
            px(ctx, 3, 4, '#2a1f18', 6, 2);
            px(ctx, 4, 4, '#453326', 3, 1);
          }
        } else if (v === 2) {
          // Cogumelos bioluminescentes ciano (cyan cluster)
          px(ctx, 4, 9, '#cbd5e1', 1, 3);
          px(ctx, 3, 7, '#0e7490', 3, 2);
          px(ctx, 3, 7, '#22d3ee', 2, 1);
          px(ctx, 4, 7, '#cffafe', 1, 1);
          px(ctx, 9, 11, '#94a3b8', 1, 2);
          px(ctx, 8, 10, '#0891b2', 3, 1);
          px(ctx, 9, 9, '#67e8f9', 1, 1);
        } else if (v === 5) {
          // Cogumelos bioluminescentes violeta (twin amethyst caps)
          px(ctx, 10, 8, '#d8b4fe', 1, 3);
          px(ctx, 9, 6, '#6b21a8', 4, 2);
          px(ctx, 10, 6, '#c084fc', 2, 1);
          px(ctx, 10, 6, '#f3e8ff', 1, 1);
          px(ctx, 5, 11, '#a78bfa', 1, 2);
          px(ctx, 4, 10, '#7e22ce', 3, 1);
        } else if (v === 7) {
          // Cogumelos âmbar (warm amber forest caps)
          px(ctx, 6, 9, '#d6d3d1', 1, 2);
          px(ctx, 5, 7, '#b45309', 3, 2);
          px(ctx, 5, 7, '#fbbf24', 2, 1);
          px(ctx, 6, 7, '#fef3c7', 1, 1);
        } else if (v === 3 || v === 6) {
          // Poças refletivas (reflective forest puddles with cyan/sky shimmer)
          const px0 = v === 3 ? 3 : 2;
          const py0 = v === 3 ? 5 : 4;
          px(ctx, px0, py0 + 1, '#1a3328', 10, 6); // damp moss rim
          px(ctx, px0 + 1, py0 + 1, '#091622', 8, 5);
          px(ctx, px0 + 2, py0 + 2, '#0f283d', 6, 3);
          px(ctx, px0 + 3, py0 + 2, '#164261', 4, 1);
          px(ctx, px0 + 3, py0 + 3, '#38bdf8', 2, 1); // reflected light
          px(ctx, px0 + 6, py0 + 2, '#a5f3fc', 1, 1); // star glint
        }
        break;
      }
      case 'forest_path': {
        px(ctx, 0, 0, '#19201c', 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = hash2d(x, y, seed);
            if (r > 0.78) px(ctx, x, y, '#26302b');
            else if (r < 0.16) px(ctx, x, y, '#121714');
          }
        }
        if (v === 1 || v === 5) {
          px(ctx, 3, 11, '#342920', 4, 1); // tiny rootlet across trail
          px(ctx, 9, 4, '#2f3d35', 2, 1);
        } else if (v === 3) {
          px(ctx, 11, 10, '#0891b2', 1, 1);
          px(ctx, 5, 5, '#3b4a42', 2, 2);
        }
        break;
      }
      case 'tree_dark': {
        // Twisted trunk, exposed splayed roots, layered 16-bit canopy & rim-lit leaves
        px(ctx, 0, 0, '#09100d', 16, 16);
        px(ctx, 1, 13, '#11221b', 14, 3);
        // Exposed twisted roots with bark highlight
        px(ctx, 2, 13, '#29201a', 4, 2);
        px(ctx, 3, 13, '#403127', 2, 1);
        px(ctx, 10, 13, '#29201a', 4, 2);
        px(ctx, 10, 13, '#382b22', 2, 1);
        // Gnarled trunk
        px(ctx, 5, 9, '#1f1814', 6, 6);
        px(ctx, 6 + (v % 2), 9, '#3b2d24', 2, 5);
        px(ctx, 8, 11, '#2b211b', 2, 4);
        // Layered dark foliage canopy with dithering & top-left rim light
        px(ctx, 2, 3, '#0c1b15', 12, 8);
        px(ctx, 1, 5, '#12271e', 14, 5);
        px(ctx, 3, 1, '#193629', 10, 6);
        px(ctx, 4, 1, '#2a5743', 6, 3); // rim highlight
        px(ctx, 5, 1, '#397358', 3, 1);
        px(ctx, 9, 4, '#1e4031', 4, 3);
        // Glowing spores clinging to bark/leaves
        if (v % 3 === 0) {
          px(ctx, 11, 6, '#0891b2', 1, 1);
          px(ctx, 4, 7, '#22d3ee', 1, 1);
        } else if (v % 3 === 1) {
          px(ctx, 5, 3, '#67e8f9', 1, 1);
          px(ctx, 11, 12, '#a855f7', 1, 1);
        } else {
          px(ctx, 3, 5, '#34d399', 1, 1);
          px(ctx, 12, 8, '#22d3ee', 1, 1);
        }
        break;
      }
      case 'water_abyss': {
        px(ctx, 0, 0, '#060b12', 16, 16);
        const wy = (v * 3 + 2) % 12;
        px(ctx, 2, wy, '#102133', 5, 1);
        px(ctx, 9, (wy + 6) % 14, '#163348', 4, 1);
        if (v % 3 === 1) px(ctx, 6, (wy + 3) % 14, '#0e7490', 2, 1);
        if (v === 5) px(ctx, 11, 4, '#22d3ee', 1, 1);
        break;
      }
      case 'bridge_root': {
        px(ctx, 0, 0, '#060b12', 16, 16);
        px(ctx, 1, 0, '#2a1f18', 14, 16);
        px(ctx, 2, 0, '#3e2e23', 12, 16);
        for (let y = 1; y < 16; y += 4) {
          px(ctx, 1, y, '#523e2f', 14, 1);
          px(ctx, 1, y + 2, '#1a130e', 14, 1);
        }
        px(ctx, 3, 1, '#155e75', 1, 14);
        px(ctx, 12, 1, '#155e75', 1, 14);
        if (v % 2 === 0) {
          px(ctx, 3, 6, '#22d3ee', 1, 2);
          px(ctx, 12, 10, '#22d3ee', 1, 2);
        }
        break;
      }
      case 'citadel_floor': {
        // Cidadela Submersa: cracked obsidian slabs, abyssal moss & worn golden mosaics
        px(ctx, 0, 0, '#0c0e15', 16, 16);
        px(ctx, 1, 1, '#151822', 14, 14);
        px(ctx, 0, 0, '#23293b', 16, 1); // rim light bevel
        px(ctx, 0, 0, '#23293b', 1, 16);
        for (let y = 2; y < 14; y += 3) {
          px(ctx, 2 + ((y + v) % 4), y, '#1a1e2b', 2, 1);
        }
        if (v === 0 || v === 2 || v === 5) {
          // Diagonal stone fracture + creeping moss
          px(ctx, 4, 3, '#090b10', 2, 1);
          px(ctx, 6, 4, '#090b10', 2, 1);
          px(ctx, 8, 5, '#090b10', 1, 2);
          px(ctx, 5, 4, '#164037', 1, 1);
          px(ctx, 7, 5, '#20574b', 1, 1);
        }
        if (v === 1 || v === 4 || v === 6) {
          // Mosaicos dourados desgastados (worn ancient golden mosaic inlays)
          px(ctx, 3, 3, '#544120', 10, 1);
          px(ctx, 3, 12, '#544120', 10, 1);
          px(ctx, 3, 4, '#544120', 1, 8);
          px(ctx, 12, 4, '#544120', 1, 8);
          px(ctx, 6, 6, '#8f6d31', 4, 4);
          px(ctx, 7, 7, '#c29b48', 2, 2);
          if (v === 4) {
            // Chipped mosaic gap
            px(ctx, 5, 3, '#151822', 3, 1);
            px(ctx, 8, 8, '#0c0e15', 2, 2);
          }
        } else if (v === 3 || v === 7) {
          px(ctx, 3, 12, '#272d40', 5, 1);
          px(ctx, 10, 2, '#18443b', 2, 2);
          px(ctx, 11, 3, '#286b5c', 1, 1);
        }
        break;
      }
      case 'citadel_gold': {
        px(ctx, 0, 0, '#161924', 16, 16);
        px(ctx, 1, 1, '#684f24', 14, 14);
        px(ctx, 2, 2, '#9c7836', 12, 12);
        px(ctx, 2, 2, '#be9547', 11, 1); // rim
        px(ctx, 4, 4, '#1e2230', 8, 8);
        px(ctx, 6, 6, '#d4af37', 4, 4);
        px(ctx, 6, 6, '#fde68a', 1, 1);
        if (v % 3 === 1) {
          px(ctx, 3, 11, '#2e2618', 2, 1); // weathered wear
        }
        break;
      }
      case 'citadel_wall': {
        // Sculpted obsidian wall with fluted pilasters, bronze capital & carved reliefs
        px(ctx, 0, 0, '#090a0f', 16, 16);
        px(ctx, 0, 0, '#4f402a', 16, 1); // bronze cap rim
        px(ctx, 0, 1, '#382e21', 16, 1);
        px(ctx, 0, 2, '#1a1e2a', 16, 12);
        // Sculpted pilaster grooves
        px(ctx, 2, 3, '#252a3b', 12, 10);
        px(ctx, 4, 3, '#141722', 1, 10);
        px(ctx, 11, 3, '#141722', 1, 10);
        // Bronze relief motif
        px(ctx, 7, 4, '#8c6b32', 2, 8);
        px(ctx, 6, 6, '#b88f44', 4, 2);
        if (v % 2 === 0) {
          px(ctx, 7, 6, '#38bdf8', 2, 1); // faint abyssal inlay glint
        }
        px(ctx, 0, 14, '#06070b', 16, 2);
        break;
      }
      case 'gate_locked': {
        px(ctx, 0, 0, '#1a1c22', 16, 16);
        for (let x = 2; x < 16; x += 4) {
          px(ctx, x, 0, '#4a4d57', 2, 16);
          px(ctx, x, 0, '#747887', 1, 16);
        }
        px(ctx, 0, 5, '#3b3d45', 16, 2);
        px(ctx, 0, 11, '#3b3d45', 16, 2);
        px(ctx, 6, 6, '#a855f7', 4, 4);
        px(ctx, 7, 7, '#f3e8ff', 2, 2);
        break;
      }
      case 'gate_open': {
        px(ctx, 0, 0, '#2a2b33', 16, 16);
        px(ctx, 0, 0, '#4e505c', 2, 16);
        px(ctx, 14, 0, '#4e505c', 2, 16);
        px(ctx, 6, 4, '#22d3ee', 1, 1);
        px(ctx, 9, 11, '#22d3ee', 1, 1);
        break;
      }
    }
  }

  private getVaelPalette(alignment: number): Record<string, string> {
    // Base slate-blue cloak & amber eye, shifting luminescent markings (C) and lantern (B/W)
    let C = '#22d3ee'; // luminescent cloak markings
    let W = '#cffafe'; // lantern core
    let B = '#38bdf8'; // lantern glow/body
    let D = '#16202e'; // deep cloak shadow
    let H = '#223145'; // dithered shadow-mid
    let M = '#2e4259'; // cloak mid
    let L = '#466282'; // cloak highlight
    let R = '#6785a8'; // crisp top-left rim light
    let E = '#f59e0b'; // amber eye
    let G = '#fde68a'; // eye bright core

    if (alignment === 1) {
      C = '#67e8f9';
      B = '#fbbf24';
      W = '#fef3c7';
      L = '#4e6c90';
      R = '#7898bd';
    } else if (alignment === 2) {
      C = '#fde047';
      B = '#f59e0b';
      W = '#fef9c3';
      M = '#344963';
      L = '#56769c';
      R = '#85a4c7';
    } else if (alignment >= 3) {
      C = '#fef08a';
      B = '#fde047';
      W = '#ffffff';
      D = '#1d2b3d';
      H = '#2b3f59';
      M = '#3a5473';
      L = '#6285ad';
      R = '#94b6db';
      G = '#ffffff';
    } else if (alignment === -1) {
      C = '#a855f7';
      B = '#c084fc';
      W = '#f3e8ff';
      D = '#151c29';
      H = '#1e2738';
      M = '#29354a';
      R = '#576887';
    } else if (alignment === -2) {
      C = '#d946ef';
      B = '#e11d48';
      W = '#fecdd3';
      D = '#141321';
      H = '#1e1b30';
      M = '#29253f';
      L = '#40385e';
      R = '#605387';
      E = '#fb7185';
    } else if (alignment <= -3) {
      C = '#f43f5e';
      B = '#be123c';
      W = '#ffe4e6';
      D = '#120d1a';
      H = '#1c1429';
      M = '#261b36';
      L = '#402a4f';
      R = '#694078';
      E = '#f43f5e';
      G = '#fda4af';
    }

    return {
      O: '#090c12',
      D,
      H,
      M,
      L,
      R,
      F: '#121620',
      E,
      G,
      C,
      W,
      B,
      K: '#785738',
      J: '#d4af37',
      T: '#334155',
      S: '#1c222e',
    };
  }

  private buildVaelSprites(): void {
    this.buildVaelSpritesForAlignment(0);
  }

  private buildVaelSpritesForAlignment(alignment: number): void {
    // Vael: 18x22 16-bit pixel art sprite in 4 directions x 4 frames per alignment level
    const pal = this.getVaelPalette(alignment);
    const dirs: Direction[] = ['down', 'up', 'left', 'right'];

    for (const dir of dirs) {
      for (let f = 0; f < 4; f++) {
        const c = makeCanvas(18, 22);
        const ctx = getCtx(c);
        const bob = f === 1 || f === 3 ? -1 : 0;
        const leftLegY = f === 1 ? 18 : 19;
        const rightLegY = f === 3 ? 18 : 19;
        const swayLeft = f === 1;
        const swayRight = f === 3;

        if (dir === 'down') {
          const hemA = swayLeft
            ? '..ODHMCC..CCMHDO..'
            : swayRight
            ? '..ODHMCC..CCMMDO..'
            : '...ODHMCC..CMDO...';
          const hemB = swayLeft
            ? '.ODDHMM....MMHDO..'
            : swayRight
            ? '..ODHMM....MMHDDO.'
            : '..ODDHM....MHDO...';
          const hemC = swayLeft
            ? '.ODDDD......DDDO..'
            : swayRight
            ? '..ODDD......DDDDO.'
            : '..ODDD......DDDO..';
          const base: string[] = [
            '......OOOOOO......',
            '.....ORLLLLLO.....',
            '....ORLMMMMMHO....',
            '....OLFFFFFFMO....',
            '....OMFFEFGFMO....',
            '....ODFFFFFFDO....',
            '.....ODDDDDDO.....',
            '....OORMCCMMHOO...',
            '...ORLMCCCCMMHDO..',
            '...OLMMHMHMHMMDO..',
            '...OMMDKKJKKDMDO..',
            '...ODDHDDDDDHDD...',
            hemA,
            hemB,
            hemC,
            '....OOD....DOO....',
          ];
          drawPixelMap(ctx, base, pal, 0, 2 + bob);
          px(ctx, 6, leftLegY, pal.S, 2, 2);
          px(ctx, 10, rightLegY, pal.S, 2, 2);

          // Expressive swinging Lanterna de Diapasão in hand (screen-left)
          const lSwingX = f === 1 ? 0 : f === 3 ? 2 : 1;
          const lSwingY = f === 1 || f === 3 ? -1 : 0;
          // Forearm sleeve reaching out
          px(ctx, 2, 10 + bob, pal.M, 2, 2);
          px(ctx, lSwingX + 1, 11 + bob + lSwingY, pal.K, 1, 1); // copper ring
          px(ctx, lSwingX, 12 + bob + lSwingY, pal.T, 3, 1); // iron cap
          px(ctx, lSwingX, 13 + bob + lSwingY, pal.B, 3, 3); // prism body
          px(ctx, lSwingX + 1, 14 + bob + lSwingY, pal.W, 1, 2); // radiant core
          px(ctx, lSwingX, 16 + bob + lSwingY, pal.T, 3, 1); // bottom plate
        } else if (dir === 'up') {
          const hemA = swayLeft
            ? '..ODHMHMHMHMHMDO..'
            : swayRight
            ? '..ODHMHMHMHMHMDO..'
            : '...ODHMHMHMHMDO...';
          const hemB = swayLeft
            ? '.ODDHMHM..HMHMDO..'
            : swayRight
            ? '..ODHMHM..HMHMDDO.'
            : '..ODDHMHMHMHMDO...';
          const base: string[] = [
            '......OOOOOO......',
            '.....ORLLLLLO.....',
            '....ORLMMMMMHO....',
            '....OLMMMMMMMO....',
            '....OMMMCCMMHO....',
            '....ODMMMMMMDO....',
            '.....ODDDDDDO.....',
            '....OORMCCMMHOO...',
            '...ORLMCCCCMMHDO..',
            '...OLMMHMHMHMMDO..',
            '...OMMDMMMMMDMDO..',
            '...ODDHDDDDDHDDO..',
            hemA,
            hemB,
            '...OODDDDDDDDOO...',
            '.....O......O.....',
          ];
          drawPixelMap(ctx, base, pal, 0, 2 + bob);
          px(ctx, 6, leftLegY, pal.S, 2, 2);
          px(ctx, 10, rightLegY, pal.S, 2, 2);

          // Swinging lantern visible on right hand from behind
          const lSwingX = f === 1 ? 15 : f === 3 ? 13 : 14;
          const lSwingY = f === 1 || f === 3 ? -1 : 0;
          px(ctx, lSwingX, 12 + bob + lSwingY, pal.T, 3, 1);
          px(ctx, lSwingX, 13 + bob + lSwingY, pal.B, 3, 2);
          px(ctx, lSwingX + 1, 13 + bob + lSwingY, pal.W, 1, 1);
          px(ctx, lSwingX, 15 + bob + lSwingY, pal.T, 3, 1);
        } else {
          const flip = dir === 'right';
          const hemA = swayLeft
            ? '....ODMMCCHMDOO...'
            : swayRight
            ? '.....ODMMCCHMDDO..'
            : '....ODMMCCMMDO....';
          const hemB = swayLeft
            ? '....ODMMMHMHDOO...'
            : swayRight
            ? '.....ODMMMHMHDDO..'
            : '.....ODMMMHMDO....';
          const base: string[] = [
            '......OOOOOO......',
            '.....ORLLLLLO.....',
            '....ORLMMMMMHO....',
            '....OFFFFFFMMO....',
            '....OFEGFFFHMO....',
            '....OFFFFFFDDO....',
            '.....ODDDDDDO.....',
            '.....ORMCCMMO.....',
            '....ORLMCCMMHO....',
            '....OLMMHMHMHO....',
            '....OMMDKKJMMO....',
            '....ODDHDDDDDO....',
            hemA,
            hemB,
            '.....ODDDDDDO.....',
            '......O....O......',
          ];
          drawPixelMap(ctx, base, pal, 0, 2 + bob, flip);
          px(ctx, 7, leftLegY, pal.S, 2, 2);
          px(ctx, 9, rightLegY, pal.S, 2, 2);

          // Side-swinging lantern held forward
          const swingOffset = f === 1 ? -1 : f === 3 ? 1 : 0;
          const lx = flip ? 13 + swingOffset : 2 - swingOffset;
          const ly = 12 + bob + (f === 1 || f === 3 ? -1 : 0);
          px(ctx, flip ? 12 : 4, 10 + bob, pal.M, 2, 2);
          px(ctx, lx + 1, ly - 1, pal.K, 1, 1);
          px(ctx, lx, ly, pal.T, 3, 1);
          px(ctx, lx, ly + 1, pal.B, 3, 3);
          px(ctx, lx + 1, ly + 2, pal.W, 1, 1);
          px(ctx, lx, ly + 4, pal.T, 3, 1);
        }

        this.vaelSprites.set(`${alignment}_${dir}_${f}`, c);
      }
    }
  }

  private buildNpcSprites(): void {
    const dirs: Direction[] = ['down', 'up', 'left', 'right'];

    // 1. Anciã Mara (20x24): cajado com cristal luminoso, xale franjado detalhado e dobras com dithering
    for (const restored of [false, true]) {
      const pal: Record<string, string> = {
        O: '#090b10',
        H: '#9ca3af',
        R: '#e5e7eb', // hair/shawl rim highlight
        S: '#d6c7b2',
        E: restored ? '#fbbf24' : '#64748b',
        W: restored ? '#a88358' : '#736152', // detailed shawl weave
        V: restored ? '#d4b483' : '#9c8875', // shawl fringe/pattern
        A: restored ? '#7c5836' : '#4a3d33', // cloak mid
        D: '#2a221d', // cloak deep shadow
        K: '#5c4632', // gnarled staff
        P: '#856447', // staff highlight
        C: restored ? '#22d3ee' : '#9333ea', // staff crystal
        G: restored ? '#ecfeff' : '#e9d5ff', // crystal specular glint
      };
      for (const dir of dirs) {
        for (let f = 0; f < 2; f++) {
          const c = makeCanvas(20, 24);
          const ctx = getCtx(c);
          const breath = f === 1 ? -1 : 0;

          // Crystal staff position (held proudly to the side)
          const staffX = dir === 'right' ? 2 : 16;
          px(ctx, staffX, 7 + breath, pal.K, 2, 16 - breath);
          px(ctx, staffX, 8 + breath, pal.P, 1, 13 - breath);
          // Ornate crystal head
          px(ctx, staffX - 1, 4 + breath, pal.O, 4, 4);
          px(ctx, staffX, 3 + breath, pal.C, 2, 4);
          px(ctx, staffX - 1, 5 + breath, pal.C, 4, 2);
          px(ctx, staffX, 4 + breath, pal.G, 1, 2);

          if (dir === 'up') {
            const map = [
              '.......OOOOOO.......',
              '......ORHHHHHO......',
              '.....ORHHHHHHHO.....',
              '.....OHHHHHHHHO.....',
              '......OHHHHHHO......',
              '....OOWVVVVVVWOO....',
              '...OWWWAAAAAAWWWO...',
              '...OWVWWAAAAWWVWO...',
              '...OAAWDDDDDDWAAO...',
              '...ODADDDDDDDDADO...',
              '...ODDDDDDDDDDDDO...',
              '....ODDADDDDADDO....',
              '....ODDDDDDDDDDO....',
              '.....OO......OO.....',
            ];
            drawPixelMap(ctx, map, pal, 0, 7 + breath);
          } else if (dir === 'left' || dir === 'right') {
            const flip = dir === 'right';
            const map = [
              '.......OOOOOO.......',
              '......ORHHHHHO......',
              '.....ORSSSSHHHO.....',
              '.....OHEESSHHHO.....',
              '......OSSSSSHO......',
              '....OOWVVVVVWOO.....',
              '...OWWWAAAAWWWO.....',
              '...OWVWAACAAWWO.....',
              '...ODDWDDDDDDDO.....',
              '...ODADDDDDDDDO.....',
              '...ODDDDDDDDDDO.....',
              '....ODDADDDDDO......',
              '....ODDDDDDDDO......',
              '.....OO.....OO......',
            ];
            drawPixelMap(ctx, map, pal, 0, 7 + breath, flip);
          } else {
            const map = [
              '.......OOOOOO.......',
              '......ORHHHHHO......',
              '.....ORSSSSSSHO.....',
              '.....OHSESSEHSO.....',
              '......OSSSSSSO......',
              '....OOWVVVVVVWOO....',
              '...OWWWAAAAAAWWWO...',
              '...OWVWAACCAAWVWO...',
              '...OAAWDDDDDDWAAO...',
              '...ODADDDDDDDDADO...',
              '...ODDDDDDDDDDDDO...',
              '....ODDADDDDADDO....',
              '....ODDDDDDDDDDO....',
              '.....OO......OO.....',
            ];
            drawPixelMap(ctx, map, pal, 0, 7 + breath);
          }
          this.npcSprites.set(`npc_mara_${restored ? '1' : '0'}_${dir}_${f}`, c);
        }
      }
    }

    // 2. Sineiro Eamon (20x24): ombros largos, túnica com sinos dourados pendurados e sino de mão
    {
      const pal: Record<string, string> = {
        O: '#090b10',
        H: '#64748b', // beard / cowl edge
        S: '#cbb8a3',
        E: '#e2e8f0',
        R: '#54463a', // mantle mid
        L: '#6e5c4c', // rim light
        B: '#92703a', // bronze trim
        Y: '#eab308', // golden bells
        G: '#fef08a', // gold glint
        D: '#26211e', // shadow robe
      };
      for (const dir of dirs) {
        for (let f = 0; f < 2; f++) {
          const c = makeCanvas(20, 24);
          const ctx = getCtx(c);
          const breath = f === 1 ? -1 : 0;
          if (dir === 'up') {
            const map = [
              '.......OOOOOO.......',
              '......OLLLLLLO......',
              '.....OLRRRRRRRO.....',
              '.....ORRRRRRRRO.....',
              '......ORRRRRRO......',
              '...OOORBBBBBBROOO...',
              '..OLRRRRRRRRRRRRLO..',
              '..ORRRRRBYBRRRRRRO..',
              '..ODDDDDDDDDDDDDDO..',
              '..ODDRDDDDDDDRDDDO..',
              '..ODDDDDDDDDDDDDDO..',
              '...ODDDDDDDDDDDDO...',
              '...ODDDDDDDDDDDDO...',
              '.....OOO....OOO.....',
            ];
            drawPixelMap(ctx, map, pal, 0, 7 + breath);
          } else if (dir === 'left' || dir === 'right') {
            const flip = dir === 'right';
            const map = [
              '.......OOOOOO.......',
              '......OLLLLLLO......',
              '.....OLSSSSRRRO.....',
              '.....OREESSRRRO.....',
              '......OHHHHHHO......',
              '...OOORBBBBBBROO....',
              '..OLRRYGYBGYBRRRO...',
              '..ORDDBBYBBYYBDDO...',
              '..ODDDDDDDDDDDDO....',
              '..ODDRDDDDDRDDDO....',
              '..ODDDDDDDDDDDDO....',
              '...ODDDDDDDDDDO.....',
              '...ODDDDDDDDDDO.....',
              '.....OOO....OOO.....',
            ];
            drawPixelMap(ctx, map, pal, 0, 7 + breath, flip);
            // Hand bell held at side
            const bx = flip ? 16 : 2;
            px(ctx, bx, 15 + breath, pal.Y, 2, 2);
            px(ctx, bx, 15 + breath, pal.G, 1, 1);
          } else {
            const map = [
              '.......OOOOOO.......',
              '......OLLLLLLO......',
              '.....OLSSSSSSRO.....',
              '.....ORSEESESRO.....',
              '......OHHHHHHO......',
              '...OOORBBBBBBROOO...',
              '..OLRRYGYBBYGYRRLO..',
              '..ORRDYBYBBYBYDRRO..',
              '..ODDDDDYBBYDDDDDO..',
              '..ODDRDDDDDDDRDDDO..',
              '..ODDDDDDDDDDDDDDO..',
              '...ODDDDDDDDDDDDO...',
              '...ODDDDDDDDDDDDO...',
              '.....OOO....OOO.....',
            ];
            drawPixelMap(ctx, map, pal, 0, 7 + breath);
            px(ctx, 2, 15 + breath, pal.Y, 2, 2);
            px(ctx, 2, 15 + breath, pal.G, 1, 1);
          }
          this.npcSprites.set(`npc_sineiro_0_${dir}_${f}`, c);
        }
      }
    }

    // 3. Guardião Silvano (20x24): chifres de galhos ramificados com folhas brilhantes e armadura de musgo
    for (const restored of [false, true]) {
      const pal: Record<string, string> = {
        O: '#060c09',
        A: '#5c4430', // antler bark
        B: '#826246', // antler rim
        N: restored ? '#10b981' : '#6b21a8', // glowing leaves
        C: restored ? '#67e8f9' : '#c084fc', // luminous leaf/eye tips
        W: restored ? '#ecfeff' : '#f3e8ff', // bright core
        M: '#1b352a', // moss shadow
        L: '#2f5c49', // moss mid
        R: '#478268', // moss rim highlight
        F: '#0c1712', // carved mask shadow
      };
      for (const dir of dirs) {
        for (let f = 0; f < 2; f++) {
          const c = makeCanvas(20, 24);
          const ctx = getCtx(c);
          const breath = f === 1 ? -1 : 0;
          if (dir === 'left' || dir === 'right') {
            const flip = dir === 'right';
            const map = [
              '.CN............NC...',
              '..BA..........AB....',
              '..OBA..OOOO..ABO....',
              '...OBAORRRROABO.....',
              '....OAORLLROAO......',
              '...ORLLLLLLLLOO.....',
              '..ORFFFFFFLLLLO.....',
              '..OLFCWCCLLLLLO.....',
              '..OMLMMMMMMMMLO.....',
              '..OMMMCCCMMMMMO.....',
              '..OMLMMLMMMLMMO.....',
              '...OMMMMMMMMMO......',
              '...OMMMMMMMMMO......',
              '....OOO....OOO......',
            ];
            drawPixelMap(ctx, map, pal, 0, 6 + breath, flip);
          } else {
            const map = [
              '.CN..............NC.',
              '.NBA............ABN.',
              '..OBA...OOOO...ABO..',
              '...OBA.ORRRRO.ABO...',
              '....OAOLLLLLLOAO....',
              '...ORLLLLLLLLLLRO...',
              '..OLFFFFFFFFFFFFLO..',
              dir === 'up' ? '..OLLMLMMMMMMLMLLO..' : '..OLFCCWFFFFWCCFLO..',
              '..OMLMMMMMMMMMMLMO..',
              '..OMMMMCCCCCCMMMMO..',
              '..OMLMMLMMMMMLMMMO..',
              '...OMMMMMMMMMMMO....',
              '...OMMMMMMMMMMMO....',
              '.....OOO....OOO.....',
            ];
            drawPixelMap(ctx, map, pal, 0, 6 + breath);
          }
          this.npcSprites.set(`npc_guardiao_${restored ? '1' : '0'}_${dir}_${f}`, c);
        }
      }
    }

    // 4. Eco do Arquiteto (20x24): forma etérea espectral com halo dourado e geometria flutuante
    for (const restored of [false, true]) {
      const pal: Record<string, string> = {
        O: '#0b0e18',
        G: '#eab308', // floating gold geometry
        Y: '#fef08a', // gold rim glint
        B: '#85682a', // weathered bronze sash
        R: restored ? '#17374a' : '#261e3d', // ethereal outer mantle
        T: restored ? '#1e5873' : '#402c66', // translucent inner energy
        C: restored ? '#38bdf8' : '#c084fc', // luminous core/eyes
        W: '#f0f9ff', // bright diamond core
      };
      for (const dir of dirs) {
        for (let f = 0; f < 2; f++) {
          const c = makeCanvas(20, 24);
          const ctx = getCtx(c);
          const floatY = f === 1 ? -1 : 0;
          const map = [
            '......GYGGGGYG......',
            '.....G........G.....',
            '.......OOOOOO.......',
            '......OTRRRRTO......',
            dir === 'up'
              ? '.....OTRRRRRRTO.....'
              : dir === 'left'
              ? '.....OCCORRRRTO.....'
              : dir === 'right'
              ? '.....OTRRRROCCO.....'
              : '.....OTROCCORTO.....',
            '......OTRRRRTO......',
            '....OOBBBBBBBBOO....',
            '...OTRRCCWWCCRRTO...',
            '...OTRTTTTTTTTTRO...',
            '...OTRRTGGGGTRRTO...',
            '....ORRRTTTTTRRO....',
            '....OTRR....RRTO....',
            '.....OT......TO.....',
            '......C......C......',
          ];
          drawPixelMap(ctx, map, pal, 0, 6 + floatY);

          // Orbiting floating geometric shards (left & right octagons/diamonds)
          const shardY1 = f === 0 ? 9 : 11;
          const shardY2 = f === 0 ? 12 : 10;
          px(ctx, 1, shardY1, pal.G, 1, 3);
          px(ctx, 0, shardY1 + 1, pal.C, 3, 1);
          px(ctx, 1, shardY1 + 1, pal.W, 1, 1);

          px(ctx, 18, shardY2, pal.G, 1, 3);
          px(ctx, 17, shardY2 + 1, pal.C, 3, 1);
          px(ctx, 18, shardY2 + 1, pal.W, 1, 1);

          this.npcSprites.set(`npc_arquiteto_${restored ? '1' : '0'}_${dir}_${f}`, c);
        }
      }
    }
  }

  private buildEnemySprites(): void {
    for (const stunned of [false, true]) {
      for (let f = 0; f < 2; f++) {
        // Oco (Hollow) with rim shading & dithering
        const c1 = makeCanvas(16, 20);
        const ctx1 = getCtx(c1);
        const p1: Record<string, string> = {
          O: '#09070f',
          B: stunned ? '#1e3a4c' : '#261a38',
          M: stunned ? '#2a5670' : '#402660',
          R: stunned ? '#67e8f9' : '#6d44a3',
          E: stunned ? '#22d3ee' : '#e9d5ff',
        };
        const map1 = [
          '.....OOOOOO.....',
          '....ORMMMMRO....',
          '...OMBBBBBBMO...',
          '...OBEBEBEBBO...',
          '...OBBBBBBBBO...',
          '..OOMMMMMMMMOO..',
          '..ORBBBBBBBBR0..'.replace('0', 'O'),
          '..OBBMBBBBMBBO..',
          '...OBBBBBBBBO...',
          f === 0 ? '..OBB.OBBO.BBO..' : '...OBO.BB.OBO...',
        ];
        drawPixelMap(ctx1, map1, p1, 0, 5 + f);
        this.enemySprites.set(`oco_${f}_${stunned ? 's' : 'n'}`, c1);

        // Mutated Fauna (Crystalline Stalker)
        const c2 = makeCanvas(16, 20);
        const ctx2 = getCtx(c2);
        const p2: Record<string, string> = {
          O: '#09070f',
          P: stunned ? '#38bdf8' : '#a855f7',
          W: stunned ? '#cffafe' : '#f3e8ff',
          D: '#1e1b26',
          B: '#332d40',
          R: '#4f4663',
        };
        const map2 = [
          '..P..........P..',
          '..WP...OO...PW..',
          '...OP.OBBO.PO...',
          '....OORBBRRO....',
          '...ORBWWWWBRO...',
          '..OBBBBBBBBBBO..',
          '..OBBPPPPPPBBO..',
          '...OBBBBBBBBO...',
          f === 0 ? '..OO..OOOO..OO..' : '...OO..OO..OO...',
        ];
        drawPixelMap(ctx2, map2, p2, 0, 6 + f);
        this.enemySprites.set(`fauna_${f}_${stunned ? 's' : 'n'}`, c2);
      }
    }
  }

  private buildObjectSprites(): void {
    // Campfire 16x16 (4 frames)
    for (let f = 0; f < 4; f++) {
      const c = makeCanvas(16, 16);
      const ctx = getCtx(c);
      px(ctx, 3, 10, '#4b4c54', 10, 4);
      px(ctx, 2, 11, '#3a3b42', 12, 2);
      px(ctx, 4, 10, '#6c707d', 2, 1);
      px(ctx, 10, 10, '#6c707d', 2, 1);
      px(ctx, 4, 11, '#4c3222', 8, 2);
      px(ctx, 6, 10, '#6b442a', 4, 2);
      const sway = f % 2 === 0 ? 0 : 1;
      px(ctx, 5, 7, '#ea580c', 6, 4);
      px(ctx, 6 + sway, 4, '#f97316', 4, 4);
      px(ctx, 7, 2 + (f === 1 ? 1 : 0), '#facc15', 2, 3);
      px(ctx, 6, 8, '#fde047', 4, 2);
      px(ctx, 7, 9, '#fef9c3', 2, 2);
      this.objectSprites.set(`campfire_${f}`, c);
    }

    // Poço Seco (32x32) locked & open
    for (const open of [false, true]) {
      const c = makeCanvas(32, 32);
      const ctx = getCtx(c);
      px(ctx, 4, 4, '#3e2f24', 3, 18);
      px(ctx, 25, 4, '#3e2f24', 3, 18);
      px(ctx, 2, 2, '#292f3b', 28, 5);
      px(ctx, 4, 1, '#465063', 24, 2);
      px(ctx, 5, 16, '#4b4c54', 22, 12);
      px(ctx, 7, 15, '#686c7a', 18, 13);
      px(ctx, 9, 17, '#090b10', 14, 7);
      if (!open) {
        for (let gx = 10; gx < 22; gx += 3) {
          px(ctx, gx, 17, '#64748b', 1, 7);
        }
        px(ctx, 9, 20, '#475569', 14, 1);
        px(ctx, 15, 19, '#a855f7', 2, 2);
      } else {
        px(ctx, 14, 20, '#22d3ee', 2, 1);
      }
      this.objectSprites.set(`well_${open ? 'open' : 'locked'}`, c);
    }

    // Anvil (Forja Silenciosa) 16x16
    for (const lit of [false, true]) {
      const c = makeCanvas(16, 16);
      const ctx = getCtx(c);
      px(ctx, 4, 9, '#4c3222', 8, 6);
      px(ctx, 5, 9, '#63432e', 6, 2);
      px(ctx, 2, 4, '#4b5563', 12, 3);
      px(ctx, 1, 5, '#7c8594', 13, 2);
      px(ctx, 5, 7, '#374151', 6, 3);
      if (lit) {
        px(ctx, 7, 4, '#22d3ee', 3, 1);
        px(ctx, 8, 3, '#a5f3fc', 1, 1);
      }
      this.objectSprites.set(`anvil_${lit ? 'lit' : 'dim'}`, c);
    }

    // Purple Dissonance Crystal (16x22)
    for (let f = 0; f < 2; f++) {
      const c = makeCanvas(16, 22);
      const ctx = getCtx(c);
      px(ctx, 4, 16, '#2e1065', 8, 4);
      px(ctx, 6, 4, '#7e22ce', 4, 14);
      px(ctx, 7, 2, '#a855f7', 2, 14);
      px(ctx, 3, 9, '#6b21a8', 3, 8);
      px(ctx, 10, 10, '#9333ea', 3, 7);
      px(ctx, 7, 5 + f, '#f3e8ff', 1, 3);
      this.objectSprites.set(`crystal_${f}`, c);
    }

    // Secret items on ground (16x16)
    const buildGlowItem = (key: string, core: string, rim: string) => {
      const c = makeCanvas(16, 16);
      const ctx = getCtx(c);
      px(ctx, 6, 5, rim, 4, 6);
      px(ctx, 5, 6, rim, 6, 4);
      px(ctx, 7, 6, core, 2, 4);
      px(ctx, 7, 7, '#ffffff', 2, 1);
      this.objectSprites.set(key, c);
    };
    buildGlowItem('secret_diapasao', '#f59e0b', '#b45309');
    buildGlowItem('secret_lente', '#22d3ee', '#0e7490');
    buildGlowItem('secret_fragmento', '#facc15', '#a16207');

    // Monoliths (16x28) x 2 pulse frames
    const monoTypes: Array<{ key: string; glyph: string }> = [
      { key: 'raiz', glyph: '#10b981' },
      { key: 'cristal', glyph: '#22d3ee' },
      { key: 'oco', glyph: '#c084fc' },
    ];
    for (const m of monoTypes) {
      for (const active of [false, true]) {
        for (let f = 0; f < 2; f++) {
          const c = makeCanvas(16, 28);
          const ctx = getCtx(c);
          px(ctx, 3, 3, '#11151c', 10, 23);
          px(ctx, 4, 2, '#1f2633', 8, 23);
          px(ctx, 4, 2, '#3b475e', 8, 1);
          px(ctx, 5, 4, '#2d3748', 6, 20);
          const col = active ? (f === 0 ? '#22d3ee' : '#a5f3fc') : m.glyph;
          if (m.key === 'raiz') {
            px(ctx, 7, 8, col, 2, 10);
            px(ctx, 5, 14, col, 6, 2);
            px(ctx, 5, 16, col, 1, 3);
            px(ctx, 10, 16, col, 1, 3);
          } else if (m.key === 'cristal') {
            px(ctx, 7, 7, col, 2, 10);
            px(ctx, 6, 9, col, 4, 6);
          } else {
            px(ctx, 6, 8, col, 4, 1);
            px(ctx, 5, 9, col, 1, 6);
            px(ctx, 10, 9, col, 1, 6);
            px(ctx, 6, 15, col, 4, 1);
          }
          if (active) {
            px(ctx, 7, 1 - f, '#a5f3fc', 2, 1);
          } else if (f === 1) {
            px(ctx, 7, 2, col, 2, 1);
          }
          this.objectSprites.set(`monolith_${m.key}_${active ? '1' : '0'}_${f}`, c);
        }
      }
    }

    // Astrolabe (24x28)
    {
      const c = makeCanvas(24, 28);
      const ctx = getCtx(c);
      px(ctx, 6, 18, '#292e3d', 12, 8);
      px(ctx, 8, 16, '#8c6b32', 8, 3);
      px(ctx, 6, 5, '#b88b3a', 12, 11);
      px(ctx, 6, 5, '#e6be6a', 12, 1);
      px(ctx, 8, 7, '#111520', 8, 7);
      px(ctx, 10, 8, '#d4af37', 4, 5);
      px(ctx, 11, 10, '#38bdf8', 2, 2);
      this.objectSprites.set('astrolabe', c);
    }

    // Capsule (20x28)
    {
      const c = makeCanvas(20, 28);
      const ctx = getCtx(c);
      px(ctx, 4, 21, '#3a3228', 12, 5);
      px(ctx, 5, 4, '#7c5d38', 10, 3);
      px(ctx, 6, 7, '#164e63', 8, 14);
      px(ctx, 7, 8, '#22d3ee', 1, 12);
      px(ctx, 9, 10, '#0f172a', 3, 9);
      this.objectSprites.set('capsule', c);
    }

    // Broken Pillar (20x24)
    {
      const c = makeCanvas(20, 24);
      const ctx = getCtx(c);
      px(ctx, 4, 17, '#343846', 12, 5);
      px(ctx, 5, 8, '#282c38', 10, 10);
      px(ctx, 6, 6, '#484f63', 5, 3);
      px(ctx, 8, 11, '#d4af37', 1, 4);
      px(ctx, 11, 11, '#d4af37', 1, 4);
      this.objectSprites.set('broken_pillar', c);
    }

    // Seal Altar (32x32)
    {
      const c = makeCanvas(32, 32);
      const ctx = getCtx(c);
      px(ctx, 3, 14, '#1b1e29', 26, 15);
      px(ctx, 5, 12, '#3a3228', 22, 14);
      px(ctx, 7, 13, '#8c6b32', 18, 10);
      px(ctx, 7, 13, '#d4af37', 18, 1);
      px(ctx, 10, 15, '#11141d', 12, 6);
      px(ctx, 14, 4, '#22d3ee', 4, 10);
      px(ctx, 15, 2, '#cffafe', 2, 12);
      this.objectSprites.set('seal_altar', c);
    }

    // Animated grass tuft (8x8 x 2 frames) for Vila de Cinza-Branca
    for (let f = 0; f < 2; f++) {
      const c = makeCanvas(8, 8);
      const ctx = getCtx(c);
      const sway = f === 1 ? 1 : 0;
      px(ctx, 2, 5, '#4b4c3b', 1, 2);
      px(ctx, 2 + sway, 3, '#676952', 1, 2);
      px(ctx, 4, 4, '#4b4c3b', 1, 3);
      px(ctx, 4 + sway, 2, '#787a5f', 1, 2);
      px(ctx, 6, 5, '#4b4c3b', 1, 2);
      this.objectSprites.set(`grass_tuft_${f}`, c);
    }

    // Forge Chimney (16x16)
    {
      const c = makeCanvas(16, 16);
      const ctx = getCtx(c);
      px(ctx, 4, 4, '#272930', 8, 10);
      px(ctx, 3, 2, '#3f424d', 10, 3);
      px(ctx, 5, 3, '#111318', 6, 2);
      px(ctx, 6, 3, '#ea580c', 2, 1);
      this.objectSprites.set('forge_chimney', c);
    }

    // Translucent Ground Crystal Cluster (12x12) dim & lantern-lit
    for (const lit of [false, true]) {
      const c = makeCanvas(12, 12);
      const ctx = getCtx(c);
      px(ctx, 3, 7, lit ? '#0e7490' : '#164e63', 6, 3);
      px(ctx, 5, 3, lit ? '#22d3ee' : '#0891b2', 2, 6);
      px(ctx, 2, 5, lit ? '#a855f7' : '#581c87', 2, 4);
      px(ctx, 8, 6, lit ? '#67e8f9' : '#155e75', 2, 3);
      if (lit) {
        px(ctx, 5, 3, '#ecfeff', 1, 2);
        px(ctx, 2, 5, '#f3e8ff', 1, 1);
      }
      this.objectSprites.set(`ground_crystal_${lit ? 'lit' : 'dim'}`, c);
    }

    // Cidadela Sculpted Fluted Column (18x26)
    {
      const c = makeCanvas(18, 26);
      const ctx = getCtx(c);
      // Stepped mossy plinth
      px(ctx, 2, 20, '#161a24', 14, 5);
      px(ctx, 3, 19, '#2b3245', 12, 4);
      px(ctx, 3, 19, '#414b66', 10, 1);
      // Fluted carved shaft
      px(ctx, 4, 8, '#1f2433', 10, 12);
      px(ctx, 5, 8, '#323a4f', 2, 11); // flute highlight
      px(ctx, 8, 8, '#282f40', 2, 11);
      px(ctx, 11, 8, '#171b26', 2, 11); // deep flute shadow
      // Broken top & carved bronze capital band
      px(ctx, 4, 5, '#3b445c', 5, 4);
      px(ctx, 9, 7, '#282f40', 5, 2);
      px(ctx, 5, 13, '#9c7836', 8, 1); // bronze trim
      px(ctx, 5, 13, '#d4af37', 3, 1);
      px(ctx, 3, 22, '#1a473e', 4, 2); // moss at plinth
      px(ctx, 4, 22, '#286b5c', 2, 1);
      this.objectSprites.set('citadel_column', c);
    }

    // Cidadela Broken Guardian Statue (24x28)
    {
      const c = makeCanvas(24, 28);
      const ctx = getCtx(c);
      // Stepped stone pedestal with gold filigree
      px(ctx, 3, 21, '#131721', 18, 6);
      px(ctx, 4, 19, '#272d3d', 16, 5);
      px(ctx, 5, 19, '#424b66', 14, 1);
      px(ctx, 7, 21, '#8c6b32', 10, 1);
      // Draped headless stone torso & shattered left shoulder
      px(ctx, 6, 8, '#222736', 12, 12);
      px(ctx, 7, 7, '#363e54', 7, 11);
      px(ctx, 8, 6, '#4c5775', 4, 3); // jagged neck fracture
      px(ctx, 10, 10, '#a8843b', 4, 5); // gilded chest seal
      px(ctx, 11, 11, '#d4af37', 2, 3);
      // Folded stone cloak & fallen rubble + abyssal moss
      px(ctx, 14, 12, '#181c26', 3, 7);
      px(ctx, 18, 23, '#333a4d', 3, 2); // fallen stone fragment
      px(ctx, 4, 23, '#1a473e', 4, 3); // moss on plinth
      px(ctx, 5, 23, '#286b5c', 2, 1);
      this.objectSprites.set('broken_statue', c);
    }

    // Cidadela Carved Floor Rune (12x12) dim & electric-blue lit
    for (const lit of [false, true]) {
      const c = makeCanvas(12, 12);
      const ctx = getCtx(c);
      const col = lit ? '#38bdf8' : '#1e293b';
      const core = lit ? '#e0f2fe' : '#334155';
      px(ctx, 5, 1, col, 2, 10);
      px(ctx, 1, 5, col, 10, 2);
      px(ctx, 3, 3, col, 6, 1);
      px(ctx, 3, 8, col, 6, 1);
      px(ctx, 5, 5, core, 2, 2);
      this.objectSprites.set(`floor_rune_${lit ? 'lit' : 'dim'}`, c);
    }
  }

  private buildPortraits(): void {
    const createPortrait = (id: PortraitId, bg: string, drawFn: (ctx: CanvasRenderingContext2D) => void) => {
      const c = makeCanvas(32, 32);
      const ctx = getCtx(c);
      px(ctx, 0, 0, bg, 32, 32);
      px(ctx, 0, 0, '#2e3545', 32, 1);
      px(ctx, 0, 31, '#2e3545', 32, 1);
      drawFn(ctx);
      this.portraits.set(id, c.toDataURL());
    };

    createPortrait('vael', '#0c121c', (ctx) => {
      px(ctx, 6, 5, '#1c2736', 20, 23);
      px(ctx, 7, 5, '#2e4259', 18, 22);
      px(ctx, 9, 4, '#6785a8', 12, 2); // rim highlight
      px(ctx, 9, 6, '#466282', 14, 4);
      px(ctx, 10, 10, '#10151e', 12, 11);
      px(ctx, 18, 14, '#f59e0b', 3, 2); // amber eye
      px(ctx, 19, 14, '#fde68a', 1, 1);
      px(ctx, 10, 23, '#22d3ee', 12, 2);
      px(ctx, 12, 24, '#cffafe', 8, 1);
    });

    createPortrait('mara', '#161310', (ctx) => {
      px(ctx, 8, 5, '#9ca3af', 16, 11);
      px(ctx, 9, 5, '#e5e7eb', 12, 2); // hair rim
      px(ctx, 10, 10, '#d6c7b2', 12, 11);
      px(ctx, 12, 14, '#64748b', 2, 2);
      px(ctx, 18, 14, '#64748b', 2, 2);
      px(ctx, 6, 21, '#736152', 20, 10); // woven shawl
      px(ctx, 9, 21, '#d4b483', 14, 2);
      // Crystal staff tip beside Mara
      px(ctx, 26, 10, '#5c4632', 2, 20);
      px(ctx, 25, 6, '#38bdf8', 4, 4);
      px(ctx, 26, 7, '#ecfeff', 2, 2);
    });

    createPortrait('sineiro', '#15120f', (ctx) => {
      px(ctx, 8, 5, '#54463a', 16, 9);
      px(ctx, 9, 5, '#6e5c4c', 12, 2);
      px(ctx, 10, 10, '#cbb8a3', 12, 10);
      px(ctx, 12, 14, '#e2e8f0', 2, 2);
      px(ctx, 18, 14, '#e2e8f0', 2, 2);
      px(ctx, 10, 18, '#64748b', 12, 4); // beard
      px(ctx, 6, 22, '#4d4136', 20, 9);
      // Golden bells on tunic
      px(ctx, 9, 24, '#eab308', 3, 3);
      px(ctx, 14, 25, '#eab308', 4, 3);
      px(ctx, 20, 24, '#eab308', 3, 3);
      px(ctx, 15, 25, '#fef08a', 1, 1);
    });

    createPortrait('guardiao', '#0a1410', (ctx) => {
      // Branching antlers with glowing leaves
      px(ctx, 5, 2, '#5c4430', 3, 8);
      px(ctx, 24, 2, '#5c4430', 3, 8);
      px(ctx, 3, 3, '#10b981', 2, 2);
      px(ctx, 27, 3, '#10b981', 2, 2);
      px(ctx, 4, 2, '#67e8f9', 1, 1);
      px(ctx, 27, 2, '#67e8f9', 1, 1);
      px(ctx, 8, 8, '#1b352a', 16, 21);
      px(ctx, 10, 8, '#478268', 12, 2);
      px(ctx, 11, 13, '#22d3ee', 2, 2);
      px(ctx, 19, 13, '#22d3ee', 2, 2);
      px(ctx, 13, 22, '#67e8f9', 6, 2);
    });

    createPortrait('arquiteto', '#0d0f18', (ctx) => {
      // Floating golden halo & orbiting diamond shards
      px(ctx, 8, 3, '#eab308', 16, 2);
      px(ctx, 11, 2, '#fef08a', 10, 1);
      px(ctx, 3, 14, '#eab308', 3, 3);
      px(ctx, 26, 14, '#eab308', 3, 3);
      px(ctx, 4, 15, '#38bdf8', 1, 1);
      px(ctx, 27, 15, '#38bdf8', 1, 1);
      // Ethereal form
      px(ctx, 9, 8, '#17374a', 14, 19);
      px(ctx, 11, 9, '#1e5873', 10, 15);
      px(ctx, 12, 13, '#38bdf8', 3, 2);
      px(ctx, 17, 13, '#38bdf8', 3, 2);
      px(ctx, 14, 22, '#f0f9ff', 4, 3);
    });

    createPortrait('oco', '#0d0814', (ctx) => {
      px(ctx, 9, 6, '#402660', 14, 6);
      px(ctx, 7, 10, '#261a38', 18, 17);
      px(ctx, 10, 12, '#170f24', 12, 8);
      px(ctx, 11, 14, '#d8b4fe', 3, 2);
      px(ctx, 18, 14, '#d8b4fe', 3, 2);
      px(ctx, 14, 21, '#581c87', 4, 4);
    });

    createPortrait('fauna', '#0c0912', (ctx) => {
      px(ctx, 6, 4, '#a855f7', 3, 7);
      px(ctx, 23, 4, '#a855f7', 3, 7);
      px(ctx, 7, 6, '#f3e8ff', 1, 3);
      px(ctx, 24, 6, '#f3e8ff', 1, 3);
      px(ctx, 8, 11, '#332d40', 16, 15);
      px(ctx, 10, 14, '#e9d5ff', 4, 2);
      px(ctx, 18, 14, '#e9d5ff', 4, 2);
      px(ctx, 12, 20, '#a855f7', 8, 3);
    });

    createPortrait('eco', '#08161d', (ctx) => {
      px(ctx, 10, 8, '#164e63', 12, 16);
      px(ctx, 12, 10, '#22d3ee', 8, 10);
      px(ctx, 14, 13, '#cffafe', 4, 4);
    });

    createPortrait('objeto', '#111319', (ctx) => {
      px(ctx, 12, 8, '#8c6b32', 8, 14);
      px(ctx, 14, 10, '#f59e0b', 4, 8);
      px(ctx, 15, 12, '#fef3c7', 2, 4);
    });
  }
}
