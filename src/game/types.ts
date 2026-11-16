export type GameMode = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ENDING';

export type Direction = 'down' | 'up' | 'left' | 'right';

export type BiomeId = 'vila' | 'bosque' | 'cidadela';

export type TileKind =
  | 'void'
  | 'ash_ground'
  | 'cobble'
  | 'wood_floor'
  | 'wall_stone'
  | 'wall_timber'
  | 'roof_slate'
  | 'roof_copper'
  | 'forest_floor'
  | 'forest_path'
  | 'tree_dark'
  | 'water_abyss'
  | 'bridge_root'
  | 'citadel_floor'
  | 'citadel_gold'
  | 'citadel_wall'
  | 'gate_locked'
  | 'gate_open';

export type InventoryItemId =
  | 'lanterna'
  | 'badalo'
  | 'chave_norte'
  | 'diapasao_cobre'
  | 'lente_quartzo'
  | 'fragmento_melodia';

export interface InventoryItem {
  id: InventoryItemId;
  name: string;
  shortDesc: string;
}

export interface WorldFlags {
  vila_eco_mara_restaurado: boolean | null;
  bosque_eco_guardiao_restaurado: boolean | null;
  cidadela_eco_arquiteto_restaurado: boolean | null;
  bell_clue_heard: boolean;
  forja_badalo_coletado: boolean;
  poco_grade_aberta: boolean;
  portao_norte_aberto: boolean;
  ponte_monolitos_resolvidos: boolean;
  monolith_seq: string[];
  cidadela_digits_found: {
    astro: boolean;
    capsula: boolean;
    pilar: boolean;
  };
  cidadela_codigo_desbloqueado: boolean;
  monolith_plaque_read?: boolean;
  visited_biomes?: BiomeId[];
  bestiary_seen?: string[];
}

export type PortraitId =
  | 'vael'
  | 'mara'
  | 'sineiro'
  | 'guardiao'
  | 'arquiteto'
  | 'oco'
  | 'fauna'
  | 'eco'
  | 'objeto';

export interface DialogueChoice {
  key: '1' | '2';
  label: string;
  tone: 'restore' | 'absorb' | 'neutral';
  actionId: string;
}

export interface DialogueState {
  speaker: string;
  role: string;
  portrait: PortraitId;
  pages: string[];
  pageIndex: number;
  choices?: DialogueChoice[];
}

export interface CodePromptState {
  digits: [number, number, number];
  cursor: number;
  errorMsg: string | null;
}

export type EndingType = 'FINAL_A' | 'FINAL_B';

export interface EndingSummary {
  type: EndingType;
  title: string;
  subtitle: string;
  epilogue: string;
  restoredCount: number;
  absorbedCount: number;
  secretsFound: number;
}

export type EntityKind =
  | 'npc_mara'
  | 'npc_sineiro'
  | 'npc_guardiao'
  | 'npc_arquiteto'
  | 'campfire'
  | 'well'
  | 'anvil'
  | 'gate_north'
  | 'bell_tower_door'
  | 'crystal_dissonance'
  | 'secret_diapasao'
  | 'secret_lente'
  | 'secret_fragmento'
  | 'plaque_monolith'
  | 'monolith_raiz'
  | 'monolith_cristal'
  | 'monolith_oco'
  | 'bridge_barrier'
  | 'astrolabe'
  | 'capsule'
  | 'broken_pillar'
  | 'seal_altar'
  | 'echo_lore';

export interface WorldEntity {
  id: string;
  kind: EntityKind;
  x: number; // tile x
  y: number; // tile y
  w: number; // width in tiles
  h: number; // height in tiles
  solid: boolean;
  label: string;
  loreText?: string;
  requiredEchoReveal?: boolean;
  revealed?: boolean;
}

export interface EnemyEntity {
  id: string;
  kind: 'oco' | 'fauna';
  x: number; // world px
  y: number; // world px
  homeX: number;
  homeY: number;
  patrolX: number;
  patrolY: number;
  patrolTarget: 'home' | 'patrol';
  vx: number;
  vy: number;
  stunTimer: number;
  windupTimer: number;
  attackCooldown: number;
  hp: number;
  dir: Direction;
  animTime: number;
  biome: BiomeId;
  flashTimer?: number;
  flashColor?: string;
}

export interface FloatingPopup {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  kind: 'ash' | 'ember' | 'spore' | 'spark' | 'dust';
}

export interface SonicPulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export interface SaveData {
  version: number;
  savedAt: string;
  player: {
    x: number;
    y: number;
    dir: Direction;
    hp: number;
    maxHp: number;
    lanternCharge: number;
  };
  inventory: InventoryItemId[];
  flags: WorldFlags;
}

export interface SecretRadarInfo {
  active: boolean;
  proximity: number; // 0..1
  distanceTiles: number;
  angleDeg: number; // 0 = north/up
  intensityLabel: string;
}

export interface MinimapMarker {
  dx: number;
  dy: number;
  kind: 'npc' | 'landmark' | 'enemy' | 'secret';
}

export interface MinimapData {
  rows: string[]; // 19x19 local grid: '#' wall, '~' water, '.' path, ',' ground, ' ' void
  markers: MinimapMarker[];
}

export interface SaveSummary {
  biome: BiomeId;
  chapterLabel: string;
  biomeShort: string;
  secretsFound: number;
  savedAt: string;
}

export interface HudSnapshot {
  mode: GameMode;
  biome: BiomeId;
  biomeTitle: string;
  chapterLabel: string;
  hp: number;
  maxHp: number;
  lanternCharge: number;
  maxLanternCharge: number;
  lanternPowerBonus: number;
  absorbedCount: number;
  pulseRangePx: number;
  stunDurationSec: number;
  secretRadar: SecretRadarInfo;
  minimap: MinimapData;
  inventory: InventoryItem[];
  flags: WorldFlags;
  dialogue: DialogueState | null;
  codePrompt: CodePromptState | null;
  nearbyPrompt: string | null;
  toast: string | null;
  muted: boolean;
  hasSaveFile: boolean;
  saveSummary: SaveSummary | null;
  ending: EndingSummary | null;
  objectiveHint: string;
}
