import { useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { EndingModal, PauseModal } from './components/Modals';
import { SplashScreen } from './components/SplashScreen';
import { TitleScreen } from './components/TitleScreen';
import { EcosGameEngine } from './game/engine';
import { HudSnapshot, PortraitId } from './game/types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EcosGameEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new EcosGameEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engine.setInputLocked(true);
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setInputLocked(splashVisible);
  }, [splashVisible]);

  const getPortraitUrl = (id: PortraitId): string => {
    return engineRef.current?.getPortraitUrl(id) ?? '';
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#07090e]">
      {/* Isolated 60fps Pixel-Art Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full pixelated"
        aria-label="Área de jogo Ecos do Abismo"
      />

      {hud?.mode === 'TITLE_MENU' && (
        <TitleScreen
          hasSaveFile={hud.hasSaveFile}
          saveSummary={hud.saveSummary}
          onStartNew={() => engineRef.current?.startNewGame()}
          onContinue={() => engineRef.current?.continueSavedGame()}
        />
      )}

      {splashVisible && (
        <SplashScreen
          onChime={(canPlay) => engineRef.current?.sound.playSplashChord(canPlay)}
          onComplete={() => setSplashVisible(false)}
        />
      )}

      {hud?.mode === 'PLAYING' && (
        <GameHud
          hud={hud}
          getPortraitUrl={getPortraitUrl}
          onPulse={() => engineRef.current?.triggerLanternPulse()}
          onSave={() => engineRef.current?.saveGame()}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onTogglePause={() => engineRef.current?.togglePause()}
          onAdvanceDialogue={() => engineRef.current?.advanceDialogue()}
          onChooseDialogue={(key) => engineRef.current?.chooseDialogueOption(key)}
          onCodeCursor={(delta) => engineRef.current?.moveCodeCursor(delta)}
          onCodeDigit={(delta) => engineRef.current?.adjustCodeDigit(delta)}
          onCodeSubmit={() => engineRef.current?.submitCode()}
          onCodeClose={() => engineRef.current?.closeCodePrompt()}
        />
      )}

      {hud?.mode === 'PAUSED' && (
        <PauseModal
          muted={hud.muted}
          biome={hud.biome}
          flags={hud.flags}
          inventory={hud.inventory}
          getPortraitUrl={getPortraitUrl}
          onResume={() => engineRef.current?.togglePause()}
          onSave={() => engineRef.current?.saveGame()}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onReturnTitle={() => engineRef.current?.returnToTitle()}
        />
      )}

      {hud?.mode === 'ENDING' && hud.ending && (
        <EndingModal
          ending={hud.ending}
          flags={hud.flags}
          onPlayAgain={() => engineRef.current?.startNewGame()}
          onReturnTitle={() => engineRef.current?.returnToTitle()}
        />
      )}
    </main>
  );
}
