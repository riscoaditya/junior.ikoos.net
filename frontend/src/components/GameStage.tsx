import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGame, JuniorScene } from '../engine/phaserScene';
import type { StageManifest } from '../types/stageAsset';

type Props = {
  manifest: StageManifest;
  backgroundId: string;
  characterId: string;
  onReady: (scene: JuniorScene) => void;
};

export default function GameStage({ manifest, backgroundId, characterId, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    gameRef.current?.destroy(true);
    gameRef.current = createGame(containerRef.current, manifest, onReady, backgroundId, characterId);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [manifest.id]);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('JuniorScene') as JuniorScene | undefined;
    scene?.setBackground(backgroundId);
  }, [backgroundId]);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('JuniorScene') as JuniorScene | undefined;
    scene?.setCharacter(characterId);
  }, [characterId]);

  return <div ref={containerRef} className="stage-wrap" />;
}
