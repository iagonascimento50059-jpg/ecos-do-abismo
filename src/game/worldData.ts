import {
  BiomeId,
  EnemyEntity,
  InventoryItem,
  InventoryItemId,
  TileKind,
  WorldEntity,
  WorldFlags,
} from './types';

export const MAP_WIDTH = 44;
export const MAP_HEIGHT = 84;
export const TILE_SIZE = 16;

export const ITEM_CATALOG: Record<InventoryItemId, InventoryItem> = {
  lanterna: {
    id: 'lanterna',
    name: 'Lanterna de Diapasão',
    shortDesc: 'Emite luz ciano e ondas sonoras [Q] para revelar Ecos e atordoar Ocos.',
  },
  badalo: {
    id: 'badalo',
    name: 'Badalo Ressonante',
    shortDesc: 'Recuperado na bigorna da Forja. Abre a grade selada do Poço Seco.',
  },
  chave_norte: {
    id: 'chave_norte',
    name: 'Chave do Portão Norte',
    shortDesc: 'Forjada em ferro antigo. Destranca a passagem ao norte da vila.',
  },
  diapasao_cobre: {
    id: 'diapasao_cobre',
    name: 'Diapasão de Cobre',
    shortDesc: 'Relíquia oculta do Campanário. Amplia o alcance das ondas sonoras.',
  },
  lente_quartzo: {
    id: 'lente_quartzo',
    name: 'Lente de Quartzo',
    shortDesc: 'Cristal puro do Bosque. Intensifica o clarão ciano da Lanterna.',
  },
  fragmento_melodia: {
    id: 'fragmento_melodia',
    name: 'Fragmento da 1ª Melodia',
    shortDesc: 'Partitura dourada da Cidadela. Preserva a harmonia primordial.',
  },
};

export function createInitialFlags(): WorldFlags {
  return {
    vila_eco_mara_restaurado: null,
    bosque_eco_guardiao_restaurado: null,
    cidadela_eco_arquiteto_restaurado: null,
    bell_clue_heard: false,
    forja_badalo_coletado: false,
    poco_grade_aberta: false,
    portao_norte_aberto: false,
    ponte_monolitos_resolvidos: false,
    monolith_seq: [],
    cidadela_digits_found: {
      astro: false,
      capsula: false,
      pilar: false,
    },
    cidadela_codigo_desbloqueado: false,
    monolith_plaque_read: false,
    visited_biomes: ['vila'],
    bestiary_seen: [],
  };
}

export function getBiomeAtTileY(ty: number): BiomeId {
  if (ty >= 56) return 'vila';
  if (ty >= 28) return 'bosque';
  return 'cidadela';
}

export function getBiomeMeta(biome: BiomeId): { chapter: string; title: string } {
  switch (biome) {
    case 'vila':
      return { chapter: 'Capítulo I', title: 'Vila de Cinza-Branca' };
    case 'bosque':
      return { chapter: 'Capítulo II', title: 'Bosque dos Sussurros Cristalinos' };
    case 'cidadela':
      return { chapter: 'Capítulo III', title: 'Cidadela Submersa' };
  }
}

export function isTileSolid(kind: TileKind): boolean {
  return (
    kind === 'void' ||
    kind === 'wall_stone' ||
    kind === 'wall_timber' ||
    kind === 'roof_slate' ||
    kind === 'roof_copper' ||
    kind === 'tree_dark' ||
    kind === 'water_abyss' ||
    kind === 'citadel_wall' ||
    kind === 'gate_locked'
  );
}

export function buildWorldTiles(): TileKind[][] {
  const grid: TileKind[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => 'void' as TileKind)
  );

  const fillRect = (x1: number, y1: number, x2: number, y2: number, kind: TileKind) => {
    for (let y = Math.max(0, y1); y <= Math.min(MAP_HEIGHT - 1, y2); y++) {
      for (let x = Math.max(0, x1); x <= Math.min(MAP_WIDTH - 1, x2); x++) {
        grid[y][x] = kind;
      }
    }
  };

  // =========================================================
  // CAPÍTULO 1: VILA DE CINZA-BRANCA (y: 56..83)
  // =========================================================
  fillRect(2, 57, 41, 81, 'ash_ground');
  // Perimeter walls
  fillRect(1, 56, 42, 56, 'wall_stone');
  fillRect(1, 82, 42, 82, 'wall_stone');
  fillRect(1, 56, 1, 82, 'wall_stone');
  fillRect(42, 56, 42, 82, 'wall_stone');

  // Main cobblestone plaza & north-south avenue
  fillRect(17, 67, 27, 77, 'cobble');
  fillRect(20, 57, 23, 67, 'cobble');
  // Branching cobble paths to Forja (west), Poço (southwest), Campanário (east)
  fillRect(9, 70, 17, 72, 'cobble');
  fillRect(12, 72, 16, 76, 'cobble');
  fillRect(27, 70, 35, 72, 'cobble');

  // Forja Silenciosa (West building, open south courtyard)
  fillRect(5, 62, 13, 64, 'roof_slate');
  fillRect(5, 65, 13, 65, 'wall_stone');
  fillRect(5, 66, 5, 69, 'wall_stone');
  fillRect(13, 66, 13, 68, 'wall_stone');
  fillRect(6, 66, 12, 69, 'cobble');

  // Campanário (East building with copper roof & secret alcove behind)
  fillRect(30, 62, 37, 64, 'roof_copper');
  fillRect(30, 65, 37, 65, 'wall_stone');
  fillRect(30, 66, 30, 69, 'wall_stone');
  fillRect(37, 66, 37, 69, 'wall_stone');
  fillRect(31, 66, 36, 69, 'wood_floor');
  // Path behind Campanário to secret Diapasão de Cobre
  fillRect(38, 61, 40, 70, 'ash_ground');

  // Ruined cottage south-east for atmosphere
  fillRect(30, 76, 36, 77, 'roof_slate');
  fillRect(30, 78, 36, 78, 'wall_timber');
  fillRect(30, 79, 30, 80, 'wall_timber');
  fillRect(36, 79, 36, 80, 'wall_timber');
  fillRect(31, 79, 35, 80, 'wood_floor');

  // Portão Norte (x=20..23, y=56)
  fillRect(20, 56, 23, 56, 'gate_locked');

  // =========================================================
  // CAPÍTULO 2: BOSQUE DOS SUSSURROS CRISTALINOS (y: 28..55)
  // =========================================================
  fillRect(2, 32, 41, 55, 'forest_floor');
  fillRect(1, 28, 1, 55, 'tree_dark');
  fillRect(42, 28, 42, 55, 'tree_dark');

  // Main winding forest path
  fillRect(20, 48, 23, 55, 'forest_path');
  fillRect(11, 44, 33, 47, 'forest_path');
  fillRect(10, 38, 13, 44, 'forest_path');
  fillRect(31, 38, 34, 44, 'forest_path');
  fillRect(12, 36, 32, 38, 'forest_path');
  fillRect(20, 32, 23, 36, 'forest_path');

  // Decorative dark tree clusters framing glades (carefully leaving paths clear)
  fillRect(4, 49, 15, 53, 'tree_dark');
  fillRect(28, 49, 39, 53, 'tree_dark');
  fillRect(16, 40, 19, 42, 'tree_dark');
  fillRect(25, 40, 28, 42, 'tree_dark');
  fillRect(4, 33, 6, 42, 'tree_dark');
  fillRect(37, 33, 40, 43, 'tree_dark');

  // Western secret alcove for Lente de Quartzo (x=7..9, y=35..38)
  fillRect(7, 35, 10, 38, 'forest_floor');

  // Abyssal river & Ponte das Raízes (y=29..31)
  fillRect(2, 29, 41, 31, 'water_abyss');
  fillRect(20, 29, 23, 31, 'bridge_root');

  // =========================================================
  // CAPÍTULO 3: CIDADELA SUBMERSA (y: 0..27)
  // =========================================================
  fillRect(2, 2, 41, 28, 'citadel_floor');
  fillRect(1, 1, 42, 2, 'citadel_wall');
  fillRect(1, 1, 1, 28, 'citadel_wall');
  fillRect(42, 1, 42, 28, 'citadel_wall');
  fillRect(2, 28, 19, 28, 'citadel_wall');
  fillRect(24, 28, 41, 28, 'citadel_wall');

  // Bronze/Gold ceremonial avenue & wing corridors
  fillRect(20, 6, 23, 28, 'citadel_gold');
  fillRect(8, 19, 35, 22, 'citadel_gold');
  fillRect(16, 6, 27, 11, 'citadel_floor');

  // Structural obsidian pillars / inner chamber walls
  fillRect(15, 14, 17, 17, 'citadel_wall');
  fillRect(26, 14, 28, 17, 'citadel_wall');
  fillRect(4, 10, 6, 16, 'citadel_wall');
  fillRect(37, 14, 39, 17, 'citadel_wall');

  return grid;
}

export function buildWorldEntities(): WorldEntity[] {
  return [
    // CAPÍTULO 1 — VILA DE CINZA-BRANCA
    {
      id: 'campfire_vila',
      kind: 'campfire',
      x: 22,
      y: 71,
      w: 1,
      h: 1,
      solid: true,
      label: 'Fogueira da Praça',
    },
    {
      id: 'npc_mara',
      kind: 'npc_mara',
      x: 24,
      y: 70,
      w: 1,
      h: 1,
      solid: true,
      label: 'Anciã Mara',
    },
    {
      id: 'npc_sineiro',
      kind: 'npc_sineiro',
      x: 33,
      y: 69,
      w: 1,
      h: 1,
      solid: true,
      label: 'Sineiro Eamon',
    },
    {
      id: 'well_poco_seco',
      kind: 'well',
      x: 13,
      y: 73,
      w: 2,
      h: 2,
      solid: true,
      label: 'Poço Seco',
    },
    {
      id: 'anvil_forja',
      kind: 'anvil',
      x: 9,
      y: 67,
      w: 1,
      h: 1,
      solid: true,
      label: 'Bigorna da Forja Silenciosa',
    },
    {
      id: 'gate_norte',
      kind: 'gate_north',
      x: 20,
      y: 56,
      w: 4,
      h: 1,
      solid: false,
      label: 'Portão Norte',
    },
    {
      id: 'secret_diapasao',
      kind: 'secret_diapasao',
      x: 39,
      y: 62,
      w: 1,
      h: 1,
      solid: false,
      label: 'Diapasão de Cobre',
    },
    {
      id: 'crystal_vila_1',
      kind: 'crystal_dissonance',
      x: 16,
      y: 61,
      w: 1,
      h: 1,
      solid: true,
      label: 'Cristal da Dissonância',
      loreText: 'Um fragmento púrpura do selo partido vibra em silêncio, devorando os nomes antigos desta vila.',
    },
    {
      id: 'crystal_vila_2',
      kind: 'crystal_dissonance',
      x: 28,
      y: 60,
      w: 1,
      h: 1,
      solid: true,
      label: 'Cristal da Dissonância',
      loreText: 'Ao redor do cristal, as cinzas flutuam paradas no ar como memória congelada.',
    },
    {
      id: 'echo_vila_praca',
      kind: 'echo_lore',
      x: 19,
      y: 68,
      w: 1,
      h: 1,
      solid: false,
      requiredEchoReveal: true,
      revealed: false,
      label: 'Eco da Última Vigília',
      loreText: 'Um murmúrio ciano ecoa na pedra: "Quando o sino calou, Mara escondeu a chave do norte no fundo do Poço Seco..."',
    },

    // CAPÍTULO 2 — BOSQUE DOS SUSSURROS CRISTALINOS
    {
      id: 'plaque_monolith',
      kind: 'plaque_monolith',
      x: 21,
      y: 47,
      w: 1,
      h: 1,
      solid: true,
      label: 'Placa da Ponte das Raízes',
    },
    {
      id: 'monolith_raiz',
      kind: 'monolith_raiz',
      x: 11,
      y: 43,
      w: 1,
      h: 1,
      solid: true,
      label: 'Monólito da Raiz',
    },
    {
      id: 'monolith_cristal',
      kind: 'monolith_cristal',
      x: 32,
      y: 43,
      w: 1,
      h: 1,
      solid: true,
      label: 'Monólito do Cristal',
    },
    {
      id: 'monolith_oco',
      kind: 'monolith_oco',
      x: 22,
      y: 35,
      w: 1,
      h: 1,
      solid: true,
      label: 'Monólito do Oco',
    },
    {
      id: 'npc_guardiao',
      kind: 'npc_guardiao',
      x: 23,
      y: 33,
      w: 1,
      h: 1,
      solid: true,
      label: 'Guardião Silvano',
    },
    {
      id: 'bridge_barrier',
      kind: 'bridge_barrier',
      x: 20,
      y: 31,
      w: 4,
      h: 1,
      solid: true,
      label: 'Barreira da Ponte das Raízes',
    },
    {
      id: 'secret_lente',
      kind: 'secret_lente',
      x: 8,
      y: 36,
      w: 1,
      h: 1,
      solid: false,
      label: 'Lente de Quartzo',
    },
    {
      id: 'crystal_bosque_1',
      kind: 'crystal_dissonance',
      x: 18,
      y: 51,
      w: 1,
      h: 1,
      solid: true,
      label: 'Cristal do Bosque',
      loreText: 'Raízes antigas tentam sufocar a névoa violeta que sobe do solo.',
    },

    // CAPÍTULO 3 — CIDADELA SUBMERSA
    {
      id: 'astrolabe',
      kind: 'astrolabe',
      x: 9,
      y: 20,
      w: 1,
      h: 1,
      solid: true,
      label: 'Astrolábio Submerso',
    },
    {
      id: 'capsule',
      kind: 'capsule',
      x: 34,
      y: 20,
      w: 1,
      h: 1,
      solid: true,
      label: 'Cápsula Intacta da Galeria',
    },
    {
      id: 'broken_pillar',
      kind: 'broken_pillar',
      x: 17,
      y: 11,
      w: 1,
      h: 1,
      solid: true,
      label: 'Pilar Partido do Altar',
    },
    {
      id: 'npc_arquiteto',
      kind: 'npc_arquiteto',
      x: 24,
      y: 9,
      w: 1,
      h: 1,
      solid: true,
      label: 'Eco do Arquiteto',
    },
    {
      id: 'seal_altar',
      kind: 'seal_altar',
      x: 21,
      y: 5,
      w: 2,
      h: 2,
      solid: true,
      label: 'Altar do Primeiro Selo',
    },
    {
      id: 'secret_fragmento',
      kind: 'secret_fragmento',
      x: 38,
      y: 9,
      w: 1,
      h: 1,
      solid: false,
      label: 'Fragmento da 1ª Melodia',
    },
  ];
}

export function buildInitialEnemies(): EnemyEntity[] {
  return [
    // BOSQUE DOS SUSSURROS CRISTALINOS — Patrulhas de Ocos e Fauna Mutada
    {
      id: 'enemy_bosque_oco_west',
      kind: 'oco',
      x: 13 * TILE_SIZE + 8,
      y: 45 * TILE_SIZE + 8,
      homeX: 13 * TILE_SIZE + 8,
      homeY: 45 * TILE_SIZE + 8,
      patrolX: 19 * TILE_SIZE + 8,
      patrolY: 45 * TILE_SIZE + 8,
      patrolTarget: 'patrol',
      vx: 0,
      vy: 0,
      stunTimer: 0,
      windupTimer: 0,
      attackCooldown: 0,
      hp: 2,
      dir: 'right',
      animTime: 0,
      biome: 'bosque',
    },
    {
      id: 'enemy_bosque_fauna',
      kind: 'fauna',
      x: 12 * TILE_SIZE + 8,
      y: 39 * TILE_SIZE + 8,
      homeX: 12 * TILE_SIZE + 8,
      homeY: 39 * TILE_SIZE + 8,
      patrolX: 12 * TILE_SIZE + 8,
      patrolY: 42 * TILE_SIZE + 8,
      patrolTarget: 'patrol',
      vx: 0,
      vy: 0,
      stunTimer: 0,
      windupTimer: 0,
      attackCooldown: 0,
      hp: 2,
      dir: 'down',
      animTime: 0.25,
      biome: 'bosque',
    },
    {
      id: 'enemy_bosque_oco_east',
      kind: 'oco',
      x: 32 * TILE_SIZE + 8,
      y: 39 * TILE_SIZE + 8,
      homeX: 32 * TILE_SIZE + 8,
      homeY: 39 * TILE_SIZE + 8,
      patrolX: 32 * TILE_SIZE + 8,
      patrolY: 45 * TILE_SIZE + 8,
      patrolTarget: 'patrol',
      vx: 0,
      vy: 0,
      stunTimer: 0,
      windupTimer: 0,
      attackCooldown: 0,
      hp: 2,
      dir: 'down',
      animTime: 0.4,
      biome: 'bosque',
    },
    {
      id: 'enemy_bosque_oco_north',
      kind: 'oco',
      x: 15 * TILE_SIZE + 8,
      y: 37 * TILE_SIZE + 8,
      homeX: 15 * TILE_SIZE + 8,
      homeY: 37 * TILE_SIZE + 8,
      patrolX: 28 * TILE_SIZE + 8,
      patrolY: 37 * TILE_SIZE + 8,
      patrolTarget: 'patrol',
      vx: 0,
      vy: 0,
      stunTimer: 0,
      windupTimer: 0,
      attackCooldown: 0,
      hp: 2,
      dir: 'right',
      animTime: 0.6,
      biome: 'bosque',
    },

    // CIDADELA SUBMERSA — Sentinelas Ocos
    {
      id: 'enemy_cidadela_oco_west',
      kind: 'oco',
      x: 11 * TILE_SIZE + 8,
      y: 21 * TILE_SIZE + 8,
      homeX: 11 * TILE_SIZE + 8,
      homeY: 21 * TILE_SIZE + 8,
      patrolX: 19 * TILE_SIZE + 8,
      patrolY: 21 * TILE_SIZE + 8,
      patrolTarget: 'patrol',
      vx: 0,
      vy: 0,
      stunTimer: 0,
      windupTimer: 0,
      attackCooldown: 0,
      hp: 3,
      dir: 'right',
      animTime: 0.2,
      biome: 'cidadela',
    },
    {
      id: 'enemy_cidadela_oco_east',
      kind: 'oco',
      x: 32 * TILE_SIZE + 8,
      y: 21 * TILE_SIZE + 8,
      homeX: 32 * TILE_SIZE + 8,
      homeY: 21 * TILE_SIZE + 8,
      patrolX: 24 * TILE_SIZE + 8,
      patrolY: 21 * TILE_SIZE + 8,
      patrolTarget: 'patrol',
      vx: 0,
      vy: 0,
      stunTimer: 0,
      windupTimer: 0,
      attackCooldown: 0,
      hp: 3,
      dir: 'left',
      animTime: 0.7,
      biome: 'cidadela',
    },
    {
      id: 'enemy_cidadela_oco_ave',
      kind: 'oco',
      x: 21 * TILE_SIZE + 8,
      y: 13 * TILE_SIZE + 8,
      homeX: 21 * TILE_SIZE + 8,
      homeY: 13 * TILE_SIZE + 8,
      patrolX: 21 * TILE_SIZE + 8,
      patrolY: 18 * TILE_SIZE + 8,
      patrolTarget: 'patrol',
      vx: 0,
      vy: 0,
      stunTimer: 0,
      windupTimer: 0,
      attackCooldown: 0,
      hp: 3,
      dir: 'down',
      animTime: 0.5,
      biome: 'cidadela',
    },
  ];
}
