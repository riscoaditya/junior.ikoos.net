import { useState } from 'react';
import type { StageBackground, StageManifest } from '../types/stageAsset';
import UiIcon from './UiIcon';

type Props = {
  manifest: StageManifest;
  backgroundId: string;
  characterId: string;
  onBackgroundChange: (id: string) => void;
  onCharacterChange: (id: string) => void;
};

type SceneTile = StageBackground | { id: string; name: string; locked: true };
type OpenPanel = 'background' | 'character' | null;

export default function AssetPanel({ manifest, backgroundId, characterId, onBackgroundChange, onCharacterChange }: Props) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const sceneTiles: SceneTile[] = [...manifest.backgrounds];
  const selectedBackground = manifest.backgrounds.find((scene) => scene.id === backgroundId);
  const selectedCharacter = manifest.characters.find((character) => character.id === characterId);

  while (sceneTiles.length < 4) {
    sceneTiles.push({ id: `locked-scene-${sceneTiles.length + 1}`, name: 'Terkunci', locked: true });
  }

  const togglePanel = (panel: Exclude<OpenPanel, null>) => {
    setOpenPanel((current) => current === panel ? null : panel);
  };

  return (
    <div className="asset-panel-pro">
      <div className={`asset-box asset-accordion ${openPanel === 'background' ? 'open' : ''}`}>
        <button
          type="button"
          className="asset-accordion-trigger"
          aria-expanded={openPanel === 'background'}
          onClick={() => togglePanel('background')}
        >
          <span className="asset-title"><UiIcon name="stage" />Background</span>
          <span className="asset-current">{selectedBackground?.name || 'Belum dipilih'}</span>
          <UiIcon name="chevron" className="accordion-chevron" />
        </button>
        <div className="asset-accordion-body">
          <div className="stage-list">
          {sceneTiles.map((scene, index) => {
            const locked = 'locked' in scene;
            return (
              <button
                key={scene.id}
                className={`stage-tile ${backgroundId === scene.id ? 'selected' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => !locked && onBackgroundChange(scene.id)}
                disabled={locked}
                type="button"
              >
                {locked ? (
                  <span className="locked-preview"><UiIcon name="lock" /></span>
                ) : (
                  <img src={scene.thumbnail} alt={scene.name} />
                )}
                <small>{scene.name}</small>
                <span className="stars" aria-hidden="true">{locked ? <UiIcon name="lock" /> : Array.from({ length: Math.min(index + 1, 3) }).map((_, starIndex) => <UiIcon key={starIndex} name="star" />)}</span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      <div className={`asset-box asset-accordion character-box ${openPanel === 'character' ? 'open' : ''}`}>
        <button
          type="button"
          className="asset-accordion-trigger"
          aria-expanded={openPanel === 'character'}
          onClick={() => togglePanel('character')}
        >
          <span className="asset-title"><UiIcon name="user" />Karakter</span>
          <span className="asset-current">{selectedCharacter?.name || 'Belum dipilih'}</span>
          <UiIcon name="chevron" className="accordion-chevron" />
        </button>
        <div className="asset-accordion-body">
          <div className="character-list">
          {manifest.characters.map((c) => (
            <button key={c.id} className={`character-tile ${characterId === c.id ? 'selected' : ''}`} onClick={() => onCharacterChange(c.id)} type="button">
              {c.thumbnail ? <img src={c.thumbnail} alt={c.name} /> : <span className="char-preview"><UiIcon name="user" /></span>}
              <span>{c.name}</span>
              {characterId === c.id && <b className="check"><UiIcon name="check" /></b>}
            </button>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
