import React, { useEffect, useState } from 'react';
import { SaveSummary } from '../game/types';
import { TitleLockupSvg } from './PixelIcons';

interface TitleScreenProps {
  hasSaveFile: boolean;
  saveSummary: SaveSummary | null;
  onStartNew: () => void;
  onContinue: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSaveFile,
  saveSummary,
  onStartNew,
  onContinue,
}) => {
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const canContinue = hasSaveFile && saveSummary !== null;

  useEffect(() => {
    if (!confirmOverwrite) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setConfirmOverwrite(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmOverwrite]);

  const handleStartClick = () => {
    if (canContinue) {
      setConfirmOverwrite(true);
    } else {
      onStartNew();
    }
  };

  const handleConfirmStart = () => {
    setConfirmOverwrite(false);
    onStartNew();
  };

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-5 sm:p-8 md:p-12 overflow-y-auto bg-gradient-to-r from-[#07090e]/92 via-[#07090e]/70 to-[#07090e]/25">
      <div className="flex-1 flex items-center py-4">
        <div className="max-w-xl w-full space-y-5 sm:space-y-6">
          <TitleLockupSvg />

          <p className="text-sm md:text-base text-[#c8c3b8] leading-relaxed max-w-md pl-1">
            Empunhe a Lanterna de Diapasão, revele memórias apagadas pela névoa da Dissonância e decida entre restaurar os últimos sobreviventes ou absorver seus ecos.
          </p>

          <div className="flex flex-wrap items-stretch gap-4 pt-2 pl-1">
            <button
              type="button"
              onClick={handleStartClick}
              className="px-6 py-3 bg-[#164e63] hover:bg-[#0e7490] text-[#f0fdfa] border border-[#22d3ee]/60 font-medium text-sm tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#22d3ee]"
            >
              Iniciar Jornada
            </button>

            <button
              type="button"
              disabled={!canContinue}
              onClick={() => {
                if (canContinue) onContinue();
              }}
              className={`px-6 py-2.5 border font-medium text-sm tracking-wide transition-colors shrink-0 flex flex-col items-start justify-center ${
                canContinue
                  ? 'bg-[#151923] hover:bg-[#1e2433] text-[#e6e1d6] border-[#64748b]/60 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#f59e0b]'
                  : 'bg-[#0e121a]/70 text-[#64748b] border-[#334155]/40 opacity-50 cursor-not-allowed'
              }`}
            >
              <span className="whitespace-nowrap">
                {canContinue ? 'Continuar Progresso' : 'Nenhum Progresso Salvo'}
              </span>
              {canContinue && saveSummary && (
                <span className="text-[11px] font-mono-num text-[#67e8f9]/90 mt-0.5 whitespace-nowrap">
                  {saveSummary.chapterLabel} · {saveSummary.biomeShort} · {saveSummary.secretsFound}/3 Relíquias
                </span>
              )}
            </button>
          </div>

          {confirmOverwrite && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="overwrite-title"
              className="max-w-md ml-1 bg-[#0b0e14]/96 border border-[#f59e0b]/60 p-4 space-y-3 shadow-2xl"
            >
              <p id="overwrite-title" className="text-xs sm:text-sm text-[#e6e1d6] leading-relaxed">
                Iniciar uma nova jornada substituirá o progresso salvo. Deseja continuar?
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmOverwrite(false)}
                  className="px-4 py-1.5 bg-[#151923] hover:bg-[#1e2433] border border-[#475569] text-xs font-medium text-[#cbd5e1] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#94a3b8]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStart}
                  className="px-4 py-1.5 bg-[#7c2d12] hover:bg-[#9a3412] border border-[#f59e0b]/70 text-xs font-medium text-[#fef3c7] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#f59e0b]"
                >
                  Sim
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 text-xs text-[#94a3b8] tracking-wide">
        <span>WASD / Setas Mover</span>
        <span className="mx-2 text-[#475569]" aria-hidden="true">·</span>
        <span>E / Espaço Interagir</span>
        <span className="mx-2 text-[#475569]" aria-hidden="true">·</span>
        <span>Q Pulso da Lanterna</span>
        <span className="mx-2 text-[#475569]" aria-hidden="true">·</span>
        <span>1 / 2 Escolhas</span>
        <span className="mx-2 text-[#475569]" aria-hidden="true">·</span>
        <span>S Salvar</span>
        <span className="mx-2 text-[#475569]" aria-hidden="true">·</span>
        <span>Esc Pausa</span>
      </div>
    </div>
  );
};
