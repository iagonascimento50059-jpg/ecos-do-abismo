import React from 'react';
import { InventoryItemId } from '../game/types';

export const TitleLockupSvg: React.FC = () => (
  <div className="flex items-center gap-4 sm:gap-5 max-w-full">
    {/* Tuning-fork & Lanterna emblem */}
    <svg
      viewBox="0 0 60 76"
      className="w-12 h-16 sm:w-14 sm:h-[72px] shrink-0"
      aria-hidden="true"
    >
      <path
        d="M22 6 L22 38 M38 6 L38 38 M22 38 Q30 48 38 38 M30 44 L30 70"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="2.5"
        strokeLinecap="square"
      />
      <rect x="25" y="18" width="10" height="14" fill="#0c1824" stroke="#f59e0b" strokeWidth="1.5" />
      <rect x="28" y="22" width="4" height="6" fill="#fde68a" />
      <circle cx="30" cy="25" r="18" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 4" opacity="0.55" />
    </svg>

    <div className="min-w-0 flex-1 space-y-2">
      <h1
        className="font-display font-bold text-[#f3efe6] leading-tight tracking-[0.06em] sm:tracking-[0.08em] text-balance"
        style={{ fontSize: 'clamp(1.45rem, 4.5vw, 2.5rem)' }}
      >
        ECOS DO ABISMO
      </h1>

      <div className="flex items-center gap-0" aria-hidden="true">
        <span className="w-1 h-1 bg-[#f59e0b] shrink-0" />
        <span className="h-px flex-1 bg-[#64748b]/45" />
      </div>

      <p
        className="text-[#94a3b8] tracking-[0.18em] sm:tracking-[0.22em] leading-snug"
        style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)' }}
      >
        CAPÍTULO I · VILA DE CINZA-BRANCA
      </p>
    </div>
  </div>
);

export const ItemPixelIcon: React.FC<{ id: InventoryItemId }> = ({ id }) => {
  switch (id) {
    case 'lanterna':
      return (
        <svg viewBox="0 0 16 16" className="w-6 h-6 shrink-0" shapeRendering="crispEdges">
          <rect x="6" y="2" width="4" height="2" fill="#94a3b8" />
          <rect x="5" y="4" width="6" height="8" fill="#164e63" />
          <rect x="6" y="5" width="4" height="6" fill="#22d3ee" />
          <rect x="7" y="6" width="2" height="4" fill="#cffafe" />
          <rect x="5" y="12" width="6" height="2" fill="#7c5d38" />
        </svg>
      );
    case 'badalo':
      return (
        <svg viewBox="0 0 16 16" className="w-6 h-6 shrink-0" shapeRendering="crispEdges">
          <rect x="7" y="2" width="2" height="6" fill="#9ca3af" />
          <rect x="6" y="8" width="4" height="2" fill="#6b7280" />
          <rect x="5" y="10" width="6" height="4" fill="#d4af37" />
          <rect x="6" y="11" width="2" height="2" fill="#fef08a" />
        </svg>
      );
    case 'chave_norte':
      return (
        <svg viewBox="0 0 16 16" className="w-6 h-6 shrink-0" shapeRendering="crispEdges">
          <rect x="3" y="4" width="5" height="5" fill="#cbd5e1" />
          <rect x="4" y="5" width="3" height="3" fill="#0f172a" />
          <rect x="8" y="6" width="6" height="2" fill="#94a3b8" />
          <rect x="11" y="8" width="1" height="3" fill="#cbd5e1" />
          <rect x="13" y="8" width="1" height="2" fill="#cbd5e1" />
        </svg>
      );
    case 'diapasao_cobre':
      return (
        <svg viewBox="0 0 16 16" className="w-6 h-6 shrink-0" shapeRendering="crispEdges">
          <rect x="5" y="2" width="2" height="7" fill="#d97706" />
          <rect x="9" y="2" width="2" height="7" fill="#d97706" />
          <rect x="5" y="8" width="6" height="2" fill="#f59e0b" />
          <rect x="7" y="10" width="2" height="4" fill="#b45309" />
        </svg>
      );
    case 'lente_quartzo':
      return (
        <svg viewBox="0 0 16 16" className="w-6 h-6 shrink-0" shapeRendering="crispEdges">
          <rect x="6" y="2" width="4" height="12" fill="#0891b2" />
          <rect x="4" y="4" width="8" height="8" fill="#22d3ee" />
          <rect x="6" y="5" width="4" height="6" fill="#cffafe" />
        </svg>
      );
    case 'fragmento_melodia':
      return (
        <svg viewBox="0 0 16 16" className="w-6 h-6 shrink-0" shapeRendering="crispEdges">
          <rect x="3" y="3" width="10" height="10" fill="#854d0e" />
          <rect x="4" y="4" width="8" height="8" fill="#ca8a04" />
          <rect x="6" y="6" width="4" height="1" fill="#fef08a" />
          <rect x="6" y="8" width="5" height="1" fill="#fef08a" />
          <rect x="5" y="10" width="3" height="1" fill="#fef08a" />
        </svg>
      );
  }
};
