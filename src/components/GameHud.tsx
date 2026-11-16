import React, { useState } from 'react';
import { Volume2, VolumeX, Save, Pause, Radio, ScrollText } from 'lucide-react';
import { HudSnapshot, PortraitId } from '../game/types';
import { ItemPixelIcon } from './PixelIcons';

interface GameHudProps {
  hud: HudSnapshot;
  getPortraitUrl: (id: PortraitId) => string;
  onPulse: () => void;
  onSave: () => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onAdvanceDialogue: () => void;
  onChooseDialogue: (key: '1' | '2') => void;
  onCodeCursor: (delta: number) => void;
  onCodeDigit: (delta: number) => void;
  onCodeSubmit: () => void;
  onCodeClose: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  getPortraitUrl,
  onPulse,
  onSave,
  onToggleMute,
  onTogglePause,
  onAdvanceDialogue,
  onChooseDialogue,
  onCodeCursor,
  onCodeDigit,
  onCodeSubmit,
  onCodeClose,
}) => {
  const [questOpen, setQuestOpen] = useState(false);

  const hpPct = Math.max(0, Math.min(100, Math.round((hud.hp / hud.maxHp) * 100)));
  const lanternPct = Math.max(
    0,
    Math.min(100, Math.round((hud.lanternCharge / hud.maxLanternCharge) * 100))
  );

  const shortChapter = hud.chapterLabel.replace(/^Cap[íi]tulo/i, 'CAP.');
  const hotbarSlots = Array.from({ length: 6 }, (_, i) => hud.inventory[i] ?? null);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* TOP CORNERS */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Compact Chapter Title, Thin Stacked Bars & Collapsible Objective */}
        <div className="pointer-events-auto bg-[#0b0e14]/85 border border-[#2c3444]/90 px-3 py-2 w-[238px] sm:w-[258px]">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] leading-tight truncate">
              <span className="font-display font-bold text-[#f3efe6]">{shortChapter}</span>
              <span className="mx-1.5 text-[#475569]" aria-hidden="true">·</span>
              <span className="text-[#94a3b8]">{hud.biomeTitle}</span>
            </div>

            <button
              type="button"
              onClick={() => setQuestOpen((prev) => !prev)}
              title={questOpen ? 'Recolher objetivo' : `Objetivo: ${hud.objectiveHint}`}
              aria-label="Alternar objetivo atual"
              aria-expanded={questOpen}
              className={`p-1 border transition-colors cursor-pointer shrink-0 ${
                questOpen
                  ? 'bg-[#17202b] border-[#f59e0b]/70 text-[#fde68a]'
                  : 'bg-[#101520] border-[#263042] text-[#94a3b8] hover:text-[#fde68a] hover:border-[#475569]'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-1.5">
            {/* Vitality Bar (Red / Orange) */}
            <div className="flex items-center gap-2">
              <div
                className="flex-1 h-1.5 bg-[#171c26] overflow-hidden"
                aria-label={`Vitalidade ${hud.hp} de ${hud.maxHp}`}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#dc2626] to-[#f97316] transition-transform duration-150 origin-left"
                  style={{ transform: `scaleX(${hpPct / 100})` }}
                />
              </div>
              <span className="font-mono-num text-[10px] leading-none text-[#fed7aa] w-11 text-right shrink-0">
                {hud.hp}/{hud.maxHp}
              </span>
            </div>

            {/* Lanterna Bar (Cyan) */}
            <div className="flex items-center gap-2">
              <div
                className="flex-1 h-1.5 bg-[#171c26] overflow-hidden"
                aria-label={`Lanterna ${hud.lanternCharge} de ${hud.maxLanternCharge}`}
              >
                <div
                  className="h-full bg-[#22d3ee] transition-transform duration-150 origin-left"
                  style={{ transform: `scaleX(${lanternPct / 100})` }}
                />
              </div>
              <span className="font-mono-num text-[10px] leading-none text-[#a5f3fc] w-11 text-right shrink-0">
                {hud.lanternCharge}/{hud.maxLanternCharge}
              </span>
            </div>
          </div>

          {questOpen && (
            <div className="mt-2 pt-1.5 border-t border-white/10 text-[11px] text-[#cbd5e1] leading-snug">
              {hud.objectiveHint}
            </div>
          )}
        </div>

        {/* Top-Right: Minimalist Icon Action Bar + Small Square Semi-Transparent Minimap/Compass */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="pointer-events-auto flex items-center gap-1 bg-[#0b0e14]/85 border border-[#2c3444]/90 p-1">
            <button
              type="button"
              onClick={onPulse}
              title="Pulso da Lanterna [Q]"
              aria-label="Pulso da Lanterna [Q]"
              className="w-7 h-7 flex items-center justify-center text-[#67e8f9] hover:bg-[#164e63]/60 transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onSave}
              title="Salvar Progresso [S]"
              aria-label="Salvar Progresso [S]"
              className="w-7 h-7 flex items-center justify-center text-[#fde68a] hover:bg-[#292524] transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              title={hud.muted ? 'Ativar Áudio [M]' : 'Silenciar Áudio [M]'}
              aria-label={hud.muted ? 'Ativar Áudio [M]' : 'Silenciar Áudio [M]'}
              className="w-7 h-7 flex items-center justify-center text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e2433] transition-colors cursor-pointer"
            >
              {hud.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onTogglePause}
              title="Pausar [ESC]"
              aria-label="Pausar [ESC]"
              className="w-7 h-7 flex items-center justify-center text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e2433] transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Small Square Semi-Transparent Minimap + Relic Compass */}
          <div
            title={
              hud.secretRadar.active
                ? `Bússola de Relíquias · ${hud.secretRadar.intensityLabel} (${hud.secretRadar.distanceTiles}m)`
                : 'Bússola de Relíquias · Todas encontradas (3/3)'
            }
            className="pointer-events-auto relative w-[88px] h-[88px] bg-[#07090e] border border-[#2c3444] opacity-80 hover:opacity-100 transition-opacity overflow-hidden"
          >
            <svg
              viewBox="0 0 19 19"
              className="w-full h-full block"
              shapeRendering="crispEdges"
              aria-label="Minimapa local"
            >
              {hud.minimap.rows.map((row, ry) =>
                row.split('').map((ch, rx) => {
                  if (ch === ' ') return null;
                  const fill =
                    ch === '#'
                      ? '#1f2633'
                      : ch === '~'
                      ? '#0c273b'
                      : ch === '.'
                      ? '#384152'
                      : '#252b36';
                  return <rect key={`${rx}_${ry}`} x={rx} y={ry} width="1" height="1" fill={fill} />;
                })
              )}
              {hud.minimap.markers.map((m, i) => {
                const mx = 9 + m.dx;
                const my = 9 + m.dy;
                const fill =
                  m.kind === 'secret'
                    ? '#fde047'
                    : m.kind === 'enemy'
                    ? '#c084fc'
                    : m.kind === 'npc'
                    ? '#22d3ee'
                    : '#94a3b8';
                return <rect key={i} x={mx} y={my} width="1" height="1" fill={fill} />;
              })}
              {/* Vael center position */}
              <rect x="9" y="9" width="1" height="1" fill="#f59e0b" />
            </svg>

            {/* Distance indicator (bottom-left) */}
            {hud.secretRadar.active && (
              <span className="absolute bottom-1 left-1.5 font-mono-num text-[9px] leading-none text-[#fde68a] bg-[#07090e]/80 px-1 py-0.5 pointer-events-none">
                {hud.secretRadar.distanceTiles}m
              </span>
            )}

            {/* Vibrating Relic Compass Needle (bottom-right) */}
            <div
              className={`absolute bottom-1 right-1 pointer-events-none ${
                hud.secretRadar.active ? 'animate-lantern-vibrate' : ''
              }`}
              style={
                {
                  '--vibe-duration': `${Math.max(0.14, 1.75 - hud.secretRadar.proximity * 1.6).toFixed(2)}s`,
                } as React.CSSProperties
              }
            >
              <svg viewBox="0 0 36 36" className="w-7 h-7 block" aria-label="Bússola de Ressonância">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="#070a10"
                  fillOpacity="0.88"
                  stroke={hud.secretRadar.proximity >= 0.65 ? '#f59e0b' : '#22d3ee'}
                  strokeWidth="1.5"
                  strokeOpacity={hud.secretRadar.active ? 0.55 + hud.secretRadar.proximity * 0.45 : 0.3}
                />
                {hud.secretRadar.active ? (
                  <g transform={`rotate(${hud.secretRadar.angleDeg} 18 18)`}>
                    <polygon points="18,4 21.5,17 14.5,17" fill="#fde047" />
                    <polygon points="18,32 20,19 16,19" fill="#334155" />
                  </g>
                ) : (
                  <circle cx="18" cy="18" r="3" fill="#22d3ee" opacity="0.5" />
                )}
                <circle
                  cx="18"
                  cy="18"
                  r="2.5"
                  fill={hud.secretRadar.proximity >= 0.65 ? '#fde047' : '#22d3ee'}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {hud.toast && (
        <div className="self-center bg-[#0b0e14]/92 border border-[#f59e0b]/60 px-3.5 py-1.5 text-xs text-[#fde68a] tracking-wide">
          {hud.toast}
        </div>
      )}

      {/* BOTTOM CENTER: INTERACTION / DIALOGUE / CIPHER + RPG HOTBAR + CONTROLS LINE */}
      <div className="flex flex-col items-center gap-2">
        {/* Proximity prompt when not in dialogue */}
        {!hud.dialogue && !hud.codePrompt && hud.nearbyPrompt && (
          <div className="bg-[#0b0e14]/90 border border-[#22d3ee]/50 px-3.5 py-1.5 text-xs text-[#e0f2fe] tracking-wide">
            {hud.nearbyPrompt}
          </div>
        )}

        {/* Dialogue Box */}
        {hud.dialogue && (
          <div className="pointer-events-auto w-full max-w-2xl bg-[#0b0e14]/95 border border-[#475569] p-4 md:p-5 space-y-3">
            <div className="flex items-start gap-4">
              <img
                src={getPortraitUrl(hud.dialogue.portrait)}
                alt={hud.dialogue.speaker}
                className="w-16 h-16 border border-[#334155] pixelated shrink-0 bg-[#080a0f]"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-display font-bold text-[#fde68a]">
                    {hud.dialogue.speaker}
                  </span>
                  <span className="text-[#475569]" aria-hidden="true">·</span>
                  <span className="text-xs text-[#94a3b8]">{hud.dialogue.role}</span>
                </div>
                <p className="text-sm text-[#e6e1d6] leading-relaxed">
                  {hud.dialogue.pages[hud.dialogue.pageIndex]}
                </p>
              </div>
            </div>

            {hud.dialogue.choices &&
            hud.dialogue.pageIndex === hud.dialogue.pages.length - 1 ? (
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-white/10">
                {hud.dialogue.choices.map((choice) => (
                  <button
                    key={choice.key}
                    type="button"
                    onClick={() => onChooseDialogue(choice.key)}
                    className={`flex-1 text-left px-4 py-2.5 text-xs font-medium border transition-colors cursor-pointer ${
                      choice.tone === 'restore'
                        ? 'bg-[#0c2733] hover:bg-[#133b4d] border-[#22d3ee]/60 text-[#cffafe]'
                        : 'bg-[#1f162b] hover:bg-[#2d203f] border-[#a855f7]/60 text-[#f3e8ff]'
                    }`}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onAdvanceDialogue}
                  className="px-3 py-1 text-xs text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
                >
                  {hud.dialogue.pageIndex < hud.dialogue.pages.length - 1
                    ? 'Continuar [E / Espaço]'
                    : 'Fechar [E / Espaço]'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chapter 3 Seal Cipher Input (4-7-2) */}
        {hud.codePrompt && (
          <div className="pointer-events-auto w-full max-w-md bg-[#0b0e14]/95 border border-[#8c6b32] p-5 space-y-4">
            <div className="space-y-1">
              <div className="font-display font-bold text-base text-[#fde68a]">
                Altar do Primeiro Selo
              </div>
              <p className="text-xs text-[#94a3b8]">
                Insira os 3 algarismos revelados pelos Ecos da Cidadela (Astrolábio, Cápsula e Pilar).
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              {hud.codePrompt.digits.map((digit, idx) => {
                const active = hud.codePrompt?.cursor === idx;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!active) onCodeCursor(idx - (hud.codePrompt?.cursor ?? 0));
                        onCodeDigit(1);
                      }}
                      className="px-3 py-1 bg-[#171b24] hover:bg-[#232936] border border-[#334155] text-xs text-[#cbd5e1] cursor-pointer"
                    >
                      +
                    </button>
                    <div
                      onClick={() => onCodeCursor(idx - (hud.codePrompt?.cursor ?? 0))}
                      className={`w-14 h-16 flex items-center justify-center font-mono-num text-2xl font-semibold border cursor-pointer ${
                        active
                          ? 'bg-[#17202b] border-[#22d3ee] text-[#cffafe]'
                          : 'bg-[#10131a] border-[#334155] text-[#cbd5e1]'
                      }`}
                    >
                      {digit}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!active) onCodeCursor(idx - (hud.codePrompt?.cursor ?? 0));
                        onCodeDigit(-1);
                      }}
                      className="px-3 py-1 bg-[#171b24] hover:bg-[#232936] border border-[#334155] text-xs text-[#cbd5e1] cursor-pointer"
                    >
                      -
                    </button>
                  </div>
                );
              })}
            </div>

            {hud.codePrompt.errorMsg && (
              <div className="text-xs text-[#fca5a5] text-center">
                {hud.codePrompt.errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onCodeClose}
                className="px-4 py-2 text-xs text-[#94a3b8] hover:text-white cursor-pointer"
              >
                Cancelar [Esc]
              </button>
              <button
                type="button"
                onClick={onCodeSubmit}
                className="px-5 py-2 bg-[#164e63] hover:bg-[#0e7490] border border-[#22d3ee]/60 text-xs font-medium text-[#f0fdfa] cursor-pointer"
              >
                Sintonizar Selo [Enter]
              </button>
            </div>
          </div>
        )}

        {/* Bottom-Center RPG Inventory Hotbar + Subtle Controls Line */}
        {!hud.dialogue && !hud.codePrompt && (
          <div className="flex flex-col items-center gap-1">
            <div
              role="region"
              aria-label="Inventário"
              className="pointer-events-auto flex items-center gap-1.5 bg-[#0b0e14]/82 border border-[#2c3444]/90 p-1"
            >
              {hotbarSlots.map((item, idx) =>
                item ? (
                  <div
                    key={item.id}
                    tabIndex={0}
                    aria-label={`${item.name}: ${item.shortDesc}`}
                    className="group relative w-8 h-8 flex items-center justify-center bg-[#121722] border border-[#364154] hover:border-[#22d3ee]/80 focus:border-[#22d3ee] focus:outline-none transition-colors"
                  >
                    <ItemPixelIcon id={item.id} />
                    <div
                      role="tooltip"
                      className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#090c12]/95 border border-[#334155] px-2.5 py-1.5 text-left z-30"
                    >
                      <div className="text-[11px] font-semibold text-[#fde68a] leading-tight">
                        {item.name}
                      </div>
                      <div className="mt-0.5 text-[10px] text-[#cbd5e1] leading-snug">
                        {item.shortDesc}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`empty_${idx}`}
                    aria-hidden="true"
                    className="w-8 h-8 bg-[#07090e]/75 border border-[#1a2130]"
                  />
                )
              )}
            </div>

            <div className="text-[10px] tracking-wide text-[#94a3b8]/75 bg-[#07090e]/60 px-2.5 py-0.5">
              WASD: Mover | E: Interagir | Q: Pulso | S: Salvar
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
