import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGame, JuniorScene } from '../engine/phaserScene';
import type { JuniorCommand } from '../engine/commandTypes';
import type { StageManifest, StageObject, StageRoute } from '../types/stageAsset';

type Props = {
  manifest: StageManifest;
  backgroundId: string;
  characterId: string;
  objects: StageObject[];
  route?: StageRoute;
  routeCommands: JuniorCommand[];
  onReady: (scene: JuniorScene) => void;
};

export default function GameStage({ manifest, backgroundId, characterId, objects, route, routeCommands, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    gameRef.current?.destroy(true);
    gameRef.current = createGame(containerRef.current, manifest, onReady, backgroundId, characterId, objects, route, routeCommands);
    const refreshScale = () => gameRef.current?.scale.refresh();
    const raf = window.requestAnimationFrame(refreshScale);
    const timer = window.setTimeout(refreshScale, 120);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refreshScale) : null;
    observer?.observe(containerRef.current);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer?.disconnect();
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

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('JuniorScene') as JuniorScene | undefined;
    scene?.setObjects(objects);
  }, [objects]);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('JuniorScene') as JuniorScene | undefined;
    scene?.setRoute(route);
  }, [route]);

  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('JuniorScene') as JuniorScene | undefined;
    scene?.setRouteCommands(routeCommands);
  }, [routeCommands]);

  return <div ref={containerRef} className="stage-wrap" />;
}
