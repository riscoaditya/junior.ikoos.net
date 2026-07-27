import { useCallback, useEffect, useRef, useState } from 'react';
import GameStage from '../components/GameStage';
import AssetPanel from '../components/AssetPanel';
import Toolbar from '../components/Toolbar';
import JuniorCommandPalette from '../components/JuniorCommandPalette';
import JuniorScriptArea from '../components/JuniorScriptArea';
import { CommandGlyph } from '../components/JuniorCommandBlock';
import UiIcon from '../components/UiIcon';
import type { JuniorCommand } from '../engine/commandTypes';
import { CommandRunner } from '../engine/commandRunner';
import type { JuniorScene } from '../engine/phaserScene';
import { saveProject, loadProject } from '../utils/storage';
import type { StageInstruction, StageLevel, StageManifest, StageSummary, StagesIndex } from '../types/stageAsset';
import { loadDefaultStage, loadStageManifest } from '../utils/loadStageAssets';

type SavedJuniorProject = {
  stageId: string;
  levelId?: string;
  title: string;
  commands: JuniorCommand[];
  backgroundId: string;
  characterId: string;
};

function getBackgroundName(manifest: StageManifest | null, id: string) {
  return manifest?.backgrounds.find((background) => background.id === id)?.name || '';
}

function getInitialLevelId(manifest: StageManifest) {
  return manifest.levels?.[0]?.id || '';
}

function getActiveLevel(manifest: StageManifest | null, levelId: string): StageLevel | null {
  if (!manifest?.levels?.length) return null;
  return manifest.levels.find((level) => level.id === levelId) || manifest.levels[0] || null;
}

function commandMatchesInstruction(command: JuniorCommand, instruction: StageInstruction) {
  if (command.type !== instruction.command) return false;
  if (instruction.value !== undefined && (!('value' in command) || command.value !== instruction.value)) return false;
  if (instruction.soundId !== undefined && (!('soundId' in command) || command.soundId !== instruction.soundId)) return false;
  if (instruction.text !== undefined && (!('text' in command) || command.text !== instruction.text)) return false;
  return true;
}

export default function EditorPage() {
  const [stagesIndex, setStagesIndex] = useState<StagesIndex | null>(null);
  const [activeStage, setActiveStage] = useState<StageSummary | null>(null);
  const [manifest, setManifest] = useState<StageManifest | null>(null);
  const [activeLevelId, setActiveLevelId] = useState('');
  const [title, setTitle] = useState('IKOOS Junior Coding');
  const [commands, setCommands] = useState<JuniorCommand[]>([]);
  const [selectedBackground, setSelectedBackground] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [reward, setReward] = useState(false);
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Membaca asset stage...');
  const [errorMessage, setErrorMessage] = useState('');
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);

  const sceneRef = useRef<JuniorScene | null>(null);
  const runnerRef = useRef(new CommandRunner());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((title: string, message: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ title, message });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2200);
  }, []);

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadDefaultStage()
      .then(({ index, summary, manifest }) => {
        if (!mounted) return;
        setStagesIndex(index);
        setActiveStage(summary);
        setManifest(manifest);
        setActiveLevelId(getInitialLevelId(manifest));
        setTitle(manifest.backgrounds[0]?.name || manifest.title);
        setSelectedBackground(manifest.backgrounds[0]?.id || '');
        setSelectedCharacter(manifest.characters[0]?.id || '');
      })
      .catch((error) => {
        if (!mounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Gagal membaca manifest stage.');
      })
      .finally(() => mounted && setLoadingMessage(''));
    return () => { mounted = false; };
  }, []);

  const onSceneReady = useCallback((scene: JuniorScene) => {
    sceneRef.current = scene;
    if (selectedBackground) scene.setBackground(selectedBackground);
    if (selectedCharacter) scene.setCharacter(selectedCharacter);
  }, [selectedBackground, selectedCharacter]);

  const switchStage = async (stage: StageSummary) => {
    if (stage.status === 'locked') return;
    setLoadingMessage('Membaca stage...');
    setErrorMessage('');
    try {
      const nextManifest = await loadStageManifest(stage.manifest);
      setActiveStage(stage);
      setManifest(nextManifest);
      setActiveLevelId(getInitialLevelId(nextManifest));
      setTitle(nextManifest.backgrounds[0]?.name || nextManifest.title);
      setCommands([]);
      setFeedback(null);
      setSelectedBackground(nextManifest.backgrounds[0]?.id || '');
      setSelectedCharacter(nextManifest.characters[0]?.id || '');
      sceneRef.current = null;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal membaca stage.');
    } finally {
      setLoadingMessage('');
    }
  };

  const addCommand = (command: JuniorCommand, targetIndex = commands.length) => {
    const activeLevel = getActiveLevel(manifest, activeLevelId);
    const activeInstructions = activeLevel?.instructions || manifest?.instructions || [];
    const maxCommands = activeInstructions.length || activeLevel?.maxCommands || manifest?.maxCommands || 5;
    const nextIndex = commands.length;

    if (nextIndex >= maxCommands) {
      showFeedback('Uups, kereta sudah penuh.', `Maksimal ${maxCommands} perintah untuk stage ini.`);
      return;
    }

    if (targetIndex !== nextIndex) {
      const message = targetIndex < nextIndex
        ? `Slot ${targetIndex + 1} sudah terisi. Gunakan slot ${nextIndex + 1}.`
        : `Isi slot ${nextIndex + 1} terlebih dahulu.`;
      showFeedback('Uups, urutannya belum tepat.', message);
      return;
    }

    const expectedInstruction = activeInstructions[nextIndex];
    if (expectedInstruction && !commandMatchesInstruction(command, expectedInstruction)) {
      showFeedback('Uups, perintah tidak tepat.', `Perintah berikutnya harus ${expectedInstruction.label}.`);
      return;
    }

    setCommands((prev) => [...prev, command]);
    setReward(true);
    setTimeout(() => setReward(false), 650);
  };

  const removeCommand = (id: string) => setCommands((prev) => prev.filter((cmd) => cmd.id !== id));
  const clearCommands = () => { setCommands([]); setActiveCommandId(null); setFeedback(null); };

  const handlePlay = async () => {
    if (!sceneRef.current || isRunning) return;
    setIsRunning(true);
    await runnerRef.current.run(sceneRef.current, commands, setActiveCommandId);
    setIsRunning(false);
    setReward(true);
    setTimeout(() => setReward(false), 1000);
  };

  const handleStop = () => { runnerRef.current.stop(); setIsRunning(false); setActiveCommandId(null); };

  const handleSave = () => {
    saveProject('ikoos-jr-pro-project', {
      stageId: activeStage?.id || manifest?.id || 'stage-1',
      levelId: activeLevelId,
      title,
      commands,
      backgroundId: selectedBackground,
      characterId: selectedCharacter,
    } satisfies SavedJuniorProject);
    setReward(true);
    setTimeout(() => setReward(false), 850);
  };

  const handleLoad = async () => {
    const saved = loadProject<SavedJuniorProject>('ikoos-jr-pro-project');
    if (!saved || !stagesIndex) return;

    const savedStage = stagesIndex.stages.find((stage) => stage.id === saved.stageId);
    if (savedStage && savedStage.id !== activeStage?.id && savedStage.status !== 'locked') {
      await switchStage(savedStage);
    }

    setTitle(saved.title || getBackgroundName(manifest, saved.backgroundId) || manifest?.title || 'Project Junior');
    setActiveLevelId(saved.levelId || activeLevelId);
    setCommands(saved.commands || []);
    setFeedback(null);
    setSelectedBackground(saved.backgroundId || manifest?.backgrounds[0]?.id || '');
    setSelectedCharacter(saved.characterId || manifest?.characters[0]?.id || '');
    sceneRef.current?.setBackground(saved.backgroundId || manifest?.backgrounds[0]?.id || '');
    sceneRef.current?.setCharacter(saved.characterId || manifest?.characters[0]?.id || '');
  };

  const playExample = () => {
    if (!manifest) return;
    const activeLevel = getActiveLevel(manifest, activeLevelId);
    const activeInstructions = activeLevel?.instructions || manifest.instructions;
    const activeCommands = activeLevel?.commands || manifest.commands;
    const sample = activeInstructions.map((item) => ({
      id: `ex-${item.order}-${Date.now()}`,
      type: item.command,
      value: item.value,
      text: item.text || (item.command === 'say' ? "Assalamu'alaikum!" : undefined),
      soundId: item.soundId || (item.command === 'sound' ? manifest.sounds?.[0]?.id || 'success' : undefined),
      icon: item.icon,
      label: item.label,
      color: activeCommands.find((cmd) => cmd.type === item.command)?.color || '#168eea',
    })) as JuniorCommand[];
    setCommands(sample);
    setFeedback(null);
  };

  if (errorMessage) {
    return <div className="loading-screen"><h1>Asset belum terbaca</h1><p>{errorMessage}</p><p>Pastikan file <b>public/assets/stages/stages.json</b> dan <b>manifest.json</b> sudah ada.</p></div>;
  }

  if (!manifest || !stagesIndex || !activeStage || loadingMessage) {
    return <div className="loading-screen"><h1>IKOOS Junior Coding</h1><p>{loadingMessage || 'Menyiapkan kelas...'}</p></div>;
  }

  const activeLevel = getActiveLevel(manifest, activeLevelId);
  const activeInstructions = activeLevel?.instructions || manifest.instructions;
  const activeCommands = activeLevel?.commands || manifest.commands;
  const activeSlotCount = activeInstructions.length || activeLevel?.maxCommands || manifest.maxCommands || 5;
  const activeLevelLabel = activeLevel?.label || activeLevel?.title || manifest.ui?.stageLabel || 'Stage';
  const selectedCharacterPreview = manifest.characters.find((character) => character.id === selectedCharacter)?.thumbnail;
  const selectedBackgroundName = getBackgroundName(manifest, selectedBackground) || title;
  const commandColor = (type: JuniorCommand['type']) => activeCommands.find((command) => command.type === type)?.color || '#168eea';
  const stageTabs = Array.from({ length: 4 }, (_, index) => {
    const stage = stagesIndex.stages[index];
    return {
      stage,
      label: `Stage ${index + 1}`,
      locked: !stage || stage.status === 'locked',
      disabled: !stage || stage.status === 'locked',
    };
  });
  const switchLevel = (levelId: string) => {
    if (levelId === activeLevelId) return;
    setActiveLevelId(levelId);
    setCommands([]);
    setActiveCommandId(null);
    setFeedback(null);
  };

  return (
    <div className="app-pro">
      <header className="topbar-pro">
        <div className="brand-pro">
          <div className="avatar-pro">{selectedCharacterPreview ? <img src={selectedCharacterPreview} alt="" /> : <UiIcon name="user" />}</div>
          <div><h1>IKOOS Junior <span>Coding</span></h1><p>Belajar coding dengan cara yang seru dan menyenangkan.</p></div>
        </div>
        <Toolbar onPlay={handlePlay} onStop={handleStop} onSave={handleSave} onLoad={handleLoad} />
      </header>

      <main className="layout-pro">
        <section className="left-panel">
          <div className="card-pro stage-card-pro">
            <div className="card-title-row"><h2><UiIcon name="clapper" /> Panggung Cerita</h2></div>
            <div className="stage-frame">
              <GameStage manifest={manifest} backgroundId={selectedBackground} characterId={selectedCharacter} onReady={onSceneReady} />
              <div className="stage-scene-label">{selectedBackgroundName}</div>
            </div>
            <div className="stage-tabs" aria-label="Pilih stage">
              {stageTabs.map((item, index) => (
                <button
                  key={item.stage?.id || item.label}
                  className={`${activeStage.id === item.stage?.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''} ${item.locked ? 'locked' : ''}`}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => item.stage && !item.disabled && switchStage(item.stage)}
                >
                  <UiIcon name={item.locked ? 'lock' : 'star'} /> {item.label}
                </button>
              ))}
            </div>
          </div>
          <AssetPanel
            manifest={manifest}
            backgroundId={selectedBackground}
            characterId={selectedCharacter}
            onBackgroundChange={(id) => {
              setSelectedBackground(id);
              setTitle(getBackgroundName(manifest, id) || title);
              sceneRef.current?.setBackground(id);
            }}
            onCharacterChange={(id) => { setSelectedCharacter(id); sceneRef.current?.setCharacter(id); }}
          />
        </section>

        <section className="right-panel card-pro">
          <div className="project-header-pro">
            <div className="project-name"><span><UiIcon name="book" /></span><input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Judul project" /></div>
            
          </div>

          <div className="learning-row">
            <aside className="instruction-card pro-card">
              <div className="section-title small"><span><UiIcon name="save" /></span> Instruksi {activeLevelLabel} <b><UiIcon name="star" /> {manifest.ui?.stageLabel || 'Stage'}</b></div>
              {!!manifest.levels?.length && (
                <div className="level-tabs" aria-label="Pilih level instruksi">
                  {manifest.levels.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      className={level.id === (activeLevel?.id || activeLevelId) ? 'active' : ''}
                      onClick={() => switchLevel(level.id)}
                    >
                      {level.label || level.title}
                    </button>
                  ))}
                </div>
              )}
              {activeLevel?.description && <p className="level-description">{activeLevel.description}</p>}
              {activeInstructions.map((item) => (
                <div className="instruction-item" key={item.order}>
                  <span className="number">{item.order}</span>
                  <span className="mini-command" style={{ background: commandColor(item.command) }}><CommandGlyph type={item.command} /></span>
                  <strong>{item.label}</strong>
                </div>
              ))}
            </aside>
            <JuniorCommandPalette manifest={manifest} commands={activeCommands} onAdd={addCommand}>
              <JuniorScriptArea
                commands={commands}
                activeCommandId={activeCommandId}
                onRemove={removeCommand}
                onClear={clearCommands}
                onDropCommand={addCommand}
                embedded
                slotCount={activeSlotCount}
              />
            </JuniorCommandPalette>
          </div>
        </section>
      </main>

      {feedback && <div className="feedback-toast" role="status" aria-live="polite"><strong>{feedback.title}</strong><span>{feedback.message}</span></div>}
      {reward && <div className="reward-pop"><div className="reward-card">Hebat!<div><UiIcon name="spark" /> <UiIcon name="star" /> <UiIcon name="spark" /></div></div></div>}
    </div>
  );
}
