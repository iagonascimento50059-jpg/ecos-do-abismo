import React, { useState } from 'react';
import { BookOpen, Compass, PauseCircle } from 'lucide-react';
import { BiomeId, EndingSummary, InventoryItem, PortraitId, WorldFlags } from '../game/types';

type PauseTab = 'pausa' | 'diario' | 'bestiario';

interface PauseModalProps {
  muted: boolean;
  biome: BiomeId;
  flags: WorldFlags;
  inventory: InventoryItem[];
  getPortraitUrl: (id: PortraitId) => string;
  onResume: () => void;
  onSave: () => void;
  onToggleMute: () => void;
  onReturnTitle: () => void;
}

interface BestiaryEntry {
  id: string;
  portrait: PortraitId;
  name: string;
  category: string;
  biomeLabel: string;
  description: string;
}

const BESTIARY_CATALOG: BestiaryEntry[] = [
  {
    id: 'oco',
    portrait: 'oco',
    name: 'Oco Errante',
    category: 'Ameaça da Dissonância',
    biomeLabel: 'Bosque & Cidadela',
    description:
      'Sobrevivente que teve suas memórias apagadas pela névoa. Drena vitalidade ao contato; atordoado pelo pulso da Lanterna [Q].',
  },
  {
    id: 'fauna',
    portrait: 'fauna',
    name: 'Fauna Mutada',
    category: 'Ameaça Cristalina',
    biomeLabel: 'Bosque & Cidadela',
    description:
      'Criatura silvestre corrompida por cristais roxos. Persegue intrusos rapidamente e desfere investidas curtas.',
  },
  {
    id: 'mara',
    portrait: 'mara',
    name: 'Anciã Mara',
    category: 'Sobrevivente',
    biomeLabel: 'Vila de Cinza-Branca',
    description:
      'Anciã que resiste junto à fogueira da praça, guardando no peito o último Eco desperto da vila.',
  },
  {
    id: 'sineiro',
    portrait: 'sineiro',
    name: 'Sineiro Eamon',
    category: 'Guardião do Campanário',
    biomeLabel: 'Vila de Cinza-Branca',
    description:
      'Zelador do sino emudecido. Conhece o paradeiro do Badalo Ressonante perdido na Forja Silenciosa.',
  },
  {
    id: 'guardiao',
    portrait: 'guardiao',
    name: 'Guardião Silvano',
    category: 'Guardião Ancestral',
    biomeLabel: 'Bosque dos Sussurros',
    description:
      'Espírito das raízes antigas que vigia a Ponte das Raízes enquanto enfrenta a fragmentação cristalina.',
  },
  {
    id: 'arquiteto',
    portrait: 'arquiteto',
    name: 'Eco do Arquiteto',
    category: 'Guardião do Selo',
    biomeLabel: 'Cidadela Submersa',
    description:
      'Memória viva do criador dos receptáculos, aguardando diante do Altar do Primeiro Selo.',
  },
];

export const PauseModal: React.FC<PauseModalProps> = ({
  muted,
  biome,
  flags,
  inventory,
  getPortraitUrl,
  onResume,
  onSave,
  onToggleMute,
  onReturnTitle,
}) => {
  const [activeTab, setActiveTab] = useState<PauseTab>('pausa');

  const moralList = [
    flags.vila_eco_mara_restaurado,
    flags.bosque_eco_guardiao_restaurado,
    flags.cidadela_eco_arquiteto_restaurado,
  ];
  const restoredCount = moralList.filter((f) => f === true).length;
  const absorbedCount = moralList.filter((f) => f === false).length;
  const score = restoredCount - absorbedCount;

  const alignmentMeta =
    score >= 2
      ? {
          title: 'Alvorada Luminosa (Restauração)',
          color: 'text-[#fde047]',
          border: 'border-[#fde047]/40',
          desc: 'Suas escolhas devolvem lucidez aos ecos. O manto e a Lanterna irradiam ouro e ciano.',
        }
      : score === 1
      ? {
          title: 'Inclinação à Restauração',
          color: 'text-[#67e8f9]',
          border: 'border-[#22d3ee]/40',
          desc: 'A luz ciano ganha calor dourado enquanto memórias perdidas despertam.',
        }
      : score === -1
      ? {
          title: 'Inclinação à Absorção',
          color: 'text-[#c084fc]',
          border: 'border-[#a855f7]/40',
          desc: 'Os ecos colhidos tingem suas runas em violeta e ampliam o pulso sonoro.',
        }
      : score <= -2
      ? {
          title: 'Abismo Silencioso (Absorção)',
          color: 'text-[#fb7185]',
          border: 'border-[#e11d48]/45',
          desc: 'A carga absorvida pulsa em violeta e carmesim sombrio ao redor do receptáculo.',
        }
      : {
          title: 'Equilíbrio Neutro',
          color: 'text-[#e2e8f0]',
          border: 'border-[#334155]',
          desc:
            restoredCount > 0 && absorbedCount > 0
              ? 'Luz restaurada e carga absorvida coexistem em tensão dentro da Lanterna.'
              : 'A Lanterna de Diapasão mantém sua frequência ciano original.',
        };

  const visited = flags.visited_biomes ?? ['vila'];
  const seen = flags.bestiary_seen ?? [];

  const formatChoice = (val: boolean | null) => {
    if (val === true) return { text: 'Restaurado', cls: 'text-[#67e8f9]' };
    if (val === false) return { text: 'Absorvido', cls: 'text-[#d8b4fe]' };
    return { text: 'Pendente', cls: 'text-[#94a3b8]' };
  };

  const cap1Done = flags.portao_norte_aberto;
  const cap2Visited = visited.includes('bosque') || biome === 'bosque' || biome === 'cidadela';
  const cap2Done = flags.ponte_monolitos_resolvidos && flags.bosque_eco_guardiao_restaurado !== null;
  const cap3Visited = visited.includes('cidadela') || biome === 'cidadela';
  const cap3Done = flags.cidadela_codigo_desbloqueado;

  const secretsCount = ['diapasao_cobre', 'lente_quartzo', 'fragmento_melodia'].filter((id) =>
    inventory.some((item) => item.id === id)
  ).length;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#05070b]/82 p-4 sm:p-6">
      <div className="w-full max-w-xl max-h-[88vh] flex flex-col bg-[#0b0e14] border border-[#334155] p-5 sm:p-6 space-y-4">
        {/* Header + Tabs */}
        <div className="space-y-3 border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#f3efe6]">
              Menu da Jornada
            </h2>
            <span className="text-[11px] text-[#94a3b8]">[Esc] Retomar</span>
          </div>

          <div role="tablist" aria-label="Abas do menu de pausa" className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pausa'}
              onClick={() => setActiveTab('pausa')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium border transition-colors cursor-pointer ${
                activeTab === 'pausa'
                  ? 'bg-[#164e63]/65 border-[#22d3ee]/70 text-[#cffafe]'
                  : 'bg-[#10141d] border-[#263042] text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Pausa</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'diario'}
              onClick={() => setActiveTab('diario')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium border transition-colors cursor-pointer ${
                activeTab === 'diario'
                  ? 'bg-[#164e63]/65 border-[#22d3ee]/70 text-[#cffafe]'
                  : 'bg-[#10141d] border-[#263042] text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Diário de Ecos</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'bestiario'}
              onClick={() => setActiveTab('bestiario')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium border transition-colors cursor-pointer ${
                activeTab === 'bestiario'
                  ? 'bg-[#164e63]/65 border-[#22d3ee]/70 text-[#cffafe]'
                  : 'bg-[#10141d] border-[#263042] text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>Bestiário ({seen.length}/{BESTIARY_CATALOG.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'pausa' && (
            <>
              <div className="text-xs text-[#cbd5e1] space-y-1.5 bg-[#10141d] border border-[#1e2636] p-3.5">
                <div><span className="text-[#fde68a]">WASD / Setas:</span> Mover Vael em 4 direções</div>
                <div><span className="text-[#fde68a]">E / Espaço:</span> Interagir com NPCs e objetos</div>
                <div><span className="text-[#fde68a]">Q / F:</span> Pulso da Lanterna (revela Ecos e atordoa Ocos)</div>
                <div><span className="text-[#fde68a]">1 / 2:</span> Escolher Restaurar ou Absorver</div>
                <div><span className="text-[#fde68a]">S:</span> Salvar progresso localmente · <span className="text-[#fde68a]">M:</span> Áudio</div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onResume}
                  className="w-full py-2.5 px-4 bg-[#164e63] hover:bg-[#0e7490] border border-[#22d3ee]/60 text-sm font-medium text-[#f0fdfa] cursor-pointer"
                >
                  Retomar Jornada [Esc]
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  className="w-full py-2.5 px-4 bg-[#151a24] hover:bg-[#1e2533] border border-[#334155] text-sm text-[#fde68a] cursor-pointer"
                >
                  Salvar Progresso
                </button>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="w-full py-2.5 px-4 bg-[#151a24] hover:bg-[#1e2533] border border-[#334155] text-sm text-[#cbd5e1] cursor-pointer"
                >
                  {muted ? 'Ativar Áudio' : 'Silenciar Áudio'}
                </button>
                <button
                  type="button"
                  onClick={onReturnTitle}
                  className="w-full py-2.5 px-4 bg-transparent hover:bg-[#1a1518] border border-[#3f2a30] text-sm text-[#fca5a5] cursor-pointer"
                >
                  Voltar ao Título
                </button>
              </div>
            </>
          )}

          {activeTab === 'diario' && (
            <div className="space-y-3.5 text-xs">
              {/* Alignment Summary */}
              <div className={`bg-[#10141d] border ${alignmentMeta.border} p-3.5 space-y-2`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#94a3b8]">Alinhamento de Vael</span>
                  <span className="font-mono-num text-[11px] text-[#cbd5e1]">
                    {restoredCount} Restauração · {absorbedCount} Absorção
                  </span>
                </div>
                <div className={`font-display font-bold text-sm ${alignmentMeta.color}`}>
                  {alignmentMeta.title}
                </div>
                <p className="text-[#cbd5e1] leading-relaxed">{alignmentMeta.desc}</p>
              </div>

              {/* Chapters Summary */}
              <div className="bg-[#10141d] border border-[#1e2636] p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <span className="font-display font-bold text-[#e6e1d6]">Capítulos</span>
                  <span className="font-mono-num text-[11px] text-[#fde68a]">
                    Relíquias: {secretsCount}/3
                  </span>
                </div>

                {[
                  {
                    cap: 'Cap. I · Vila de Cinza-Branca',
                    status: cap1Done ? 'Concluído' : 'Em curso',
                    statusCls: cap1Done ? 'text-[#67e8f9]' : 'text-[#fde68a]',
                    choiceLabel: 'Anciã Mara',
                    choice: formatChoice(flags.vila_eco_mara_restaurado),
                  },
                  {
                    cap: 'Cap. II · Bosque dos Sussurros',
                    status: cap2Done ? 'Concluído' : cap2Visited ? 'Em curso' : 'Não alcançado',
                    statusCls: cap2Done
                      ? 'text-[#67e8f9]'
                      : cap2Visited
                      ? 'text-[#fde68a]'
                      : 'text-[#64748b]',
                    choiceLabel: 'Guardião Silvano',
                    choice: formatChoice(flags.bosque_eco_guardiao_restaurado),
                  },
                  {
                    cap: 'Cap. III · Cidadela Submersa',
                    status: cap3Done ? 'Concluído' : cap3Visited ? 'Em curso' : 'Não alcançado',
                    statusCls: cap3Done
                      ? 'text-[#67e8f9]'
                      : cap3Visited
                      ? 'text-[#fde68a]'
                      : 'text-[#64748b]',
                    choiceLabel: 'Eco do Arquiteto',
                    choice: formatChoice(flags.cidadela_eco_arquiteto_restaurado),
                  },
                ].map((row) => (
                  <div
                    key={row.cap}
                    className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-white/5 last:border-b-0"
                  >
                    <div>
                      <div className="text-[#f1f5f9] font-medium">{row.cap}</div>
                      <div className="text-[11px] text-[#94a3b8]">
                        {row.choiceLabel}: <span className={row.choice.cls}>{row.choice.text}</span>
                      </div>
                    </div>
                    <span className={`font-mono-num text-[11px] ${row.statusCls}`}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Clues & Inscriptions */}
              <div className="bg-[#10141d] border border-[#1e2636] p-3.5 space-y-2.5">
                <div className="font-display font-bold text-[#e6e1d6] border-b border-white/10 pb-1.5">
                  Pistas e Inscrições Descobertas
                </div>

                <div className="space-y-1">
                  <div className="text-[#fde68a] font-medium">Forja Silenciosa & Poço Seco</div>
                  <p className="text-[#cbd5e1] leading-snug">
                    {flags.forja_badalo_coletado
                      ? flags.poco_grade_aberta
                        ? 'Badalo Ressonante despertado na bigorna e usado para abrir a grade do Poço Seco.'
                        : 'Badalo Ressonante recuperado na bigorna da Forja. Leve-o à grade do Poço Seco.'
                      : flags.bell_clue_heard
                      ? 'Sineiro Eamon revelou que o Badalo caiu junto à bigorna da Forja, a oeste — use a Lanterna lá.'
                      : 'Nenhuma pista registrada ainda. Converse com o Sineiro no Campanário a leste.'}
                  </p>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-white/5">
                  <div className="text-[#67e8f9] font-medium">Placa da Ponte das Raízes</div>
                  <p className="text-[#cbd5e1] leading-snug">
                    {flags.ponte_monolitos_resolvidos
                      ? 'Monólitos sintonizados em harmonia: 1º Raiz · 2º Cristal · 3º Oco.'
                      : flags.monolith_plaque_read
                      ? `Ordem da inscrição: 1º Raiz · 2º Cristal · 3º Oco (progresso: ${flags.monolith_seq.length}/3).`
                      : 'Inscrição ainda não lida. Examine a placa de pedra diante da Ponte das Raízes.'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#fde047] font-medium">Cidadela · Algarismos do Selo</span>
                    <span className="font-mono-num text-[11px] text-[#fde68a]">
                      [{flags.cidadela_digits_found.astro ? '4' : '?'}] - [
                      {flags.cidadela_digits_found.capsula ? '7' : '?'}] - [
                      {flags.cidadela_digits_found.pilar ? '2' : '?'}]
                    </span>
                  </div>
                  <p className="text-[#94a3b8] leading-snug">
                    Astrolábio Submerso, Cápsula Intacta da Galeria e Pilar Partido diante do Altar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bestiario' && (
            <div className="space-y-2.5 text-xs">
              {BESTIARY_CATALOG.map((entry) => {
                const discovered = seen.includes(entry.id);
                return (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-3 p-3 border ${
                      discovered
                        ? 'bg-[#10141d] border-[#263042]'
                        : 'bg-[#090c12] border-[#19202d] opacity-75'
                    }`}
                  >
                    {discovered ? (
                      <img
                        src={getPortraitUrl(entry.portrait)}
                        alt={entry.name}
                        className="w-12 h-12 border border-[#334155] pixelated shrink-0 bg-[#07090e]"
                      />
                    ) : (
                      <div className="w-12 h-12 border border-[#1f2636] bg-[#07090e] shrink-0 flex items-center justify-center font-mono-num text-sm text-[#475569]">
                        ?
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-1.5">
                        <span
                          className={`font-display font-bold text-sm ${
                            discovered ? 'text-[#f3efe6]' : 'text-[#64748b]'
                          }`}
                        >
                          {discovered ? entry.name : 'Entidade Desconhecida'}
                        </span>
                        <span className="text-[10px] text-[#94a3b8]">{entry.biomeLabel}</span>
                      </div>

                      <div className="text-[10px] text-[#67e8f9]">
                        {discovered ? entry.category : 'Registro pendente'}
                      </div>

                      <p className="text-[11px] text-[#cbd5e1] leading-snug">
                        {discovered
                          ? entry.description
                          : 'Explore este bioma e aproxime-se da criatura ou guardião para registrar no Bestiário.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface EndingModalProps {
  ending: EndingSummary;
  flags: WorldFlags;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  ending,
  flags,
  onPlayAgain,
  onReturnTitle,
}) => {
  const isRestore = ending.type === 'FINAL_B';

  const formatFlag = (val: boolean | null) => {
    if (val === true) return 'Restaurado';
    if (val === false) return 'Absorvido';
    return 'Não decidido';
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#05070b]/88 p-6">
      <div
        className={`w-full max-w-xl bg-[#0b0e14] border p-7 space-y-6 ${
          isRestore ? 'border-[#22d3ee]/60' : 'border-[#a855f7]/60'
        }`}
      >
        <div className="space-y-1.5 border-b border-white/10 pb-4">
          <div className="text-xs tracking-wider text-[#94a3b8]">{ending.subtitle}</div>
          <h2
            className={`font-display text-2xl font-bold ${
              isRestore ? 'text-[#cffafe]' : 'text-[#e9d5ff]'
            }`}
          >
            {ending.title}
          </h2>
        </div>

        <p className="text-sm text-[#e6e1d6] leading-relaxed">{ending.epilogue}</p>

        <div className="bg-[#10141d] border border-[#1f2737] p-4 space-y-2 text-xs">
          <div className="font-medium text-[#cbd5e1] pb-1 border-b border-white/10">
            Ressonância das Escolhas
          </div>
          <div className="flex justify-between">
            <span className="text-[#94a3b8]">Vila · Anciã Mara</span>
            <span className="text-[#e2e8f0]">{formatFlag(flags.vila_eco_mara_restaurado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#94a3b8]">Bosque · Guardião Silvano</span>
            <span className="text-[#e2e8f0]">{formatFlag(flags.bosque_eco_guardiao_restaurado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#94a3b8]">Cidadela · Eco do Arquiteto</span>
            <span className="text-[#e2e8f0]">{formatFlag(flags.cidadela_eco_arquiteto_restaurado)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-white/10">
            <span className="text-[#94a3b8]">Relíquias Secretas Encontradas</span>
            <span className="font-mono-num text-[#fde68a]">{ending.secretsFound}/3</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onReturnTitle}
            className="px-5 py-2.5 border border-[#334155] text-sm text-[#cbd5e1] hover:bg-[#151a24] cursor-pointer"
          >
            Voltar ao Menu Principal
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="px-6 py-2.5 bg-[#164e63] hover:bg-[#0e7490] border border-[#22d3ee]/60 text-sm font-medium text-[#f0fdfa] cursor-pointer"
          >
            Jogar Novamente (Nova Jornada)
          </button>
        </div>
      </div>
    </div>
  );
};
