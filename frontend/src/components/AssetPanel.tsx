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

export default function AssetPanel({ manifest, backgroundId, characterId, onBackgroundChange, onCharacterChange }: Props) {
  const sceneTiles: SceneTile[] = [...manifest.backgrounds];
  while (sceneTiles.length < 4) {
    sceneTiles.push({ id: `locked-scene-${sceneTiles.length + 1}`, name: 'Terkunci', locked: true });
  }

  return (
    <div className="asset-panel-pro">
      <div className="asset-box">
        <div className="asset-title"><UiIcon name="stage" /> Pilih Stage</div>
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

      <div className="asset-box character-box">
        <div className="asset-title"><UiIcon name="user" /> Pilih Karakter</div>
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
  );
}
