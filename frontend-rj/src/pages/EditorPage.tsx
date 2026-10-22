import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
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
import type { StageInstruction, StageLevel, StageManifest, StageReward, StageSummary, StagesIndex } from '../types/stageAsset';
import { loadDefaultStage, loadStageManifest } from '../utils/loadStageAssets';
import {
  playCompleteRunFeedback,
  playCorrectBlockFeedback,
  playWrongBlockFeedback,
  warmAudioFeedback,
} from '../utils/audioFeedback';

type SavedJuniorProject = {
  stageId: string;
  levelId?: string;
  title: string;
  commands: JuniorCommand[];
  backgroundId: string;
  characterId: string;
};

const ADVANCED_STAGE_PASSWORD = '355255';
const PASSWORD_STAGE_THRESHOLD = 5;
const PROGRESS_STORAGE_KEY = 'ikoos-jr-progress-v2';
const LEVELS_PER_STAGE = 3;

type JuniorProgress = {
  completedLevels: Record<string, string[]>;
  rewards: string[];
};

const emptyProgress: JuniorProgress = { completedLevels: {}, rewards: [] };

function getBackgroundName(manifest: StageManifest | null, id: string) {
  return manifest?.backgrounds.find((background) => background.id === id)?.name || '';
}

function getStageNumber(stage: StageSummary) {
  if (typeof stage.difficulty === 'number') return stage.difficulty;
  const match = stage.id.match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function isPasswordProtectedStage(stage: StageSummary) {
  return getStageNumber(stage) >= PASSWORD_STAGE_THRESHOLD;
}

function getInitialLevelId(manifest: StageManifest) {
  return manifest.levels?.[0]?.id || '';
}

function getActiveLevel(manifest: StageManifest | null, levelId: string): StageLevel | null {
  if (!manifest?.levels?.length) return null;
  return manifest.levels.find((level) => level.id === levelId) || manifest.levels[0] || null;
}

function repeatCommandMatches(command: JuniorCommand, instruction: StageInstruction) {
  if (command.type !== 'repeat') return false;
  if (instruction.times !== undefined && command.times !== instruction.times) return false;
  if (!instruction.repeatCommand) return true;

  const expected = instruction.repeatCommand;
  const actual = command.repeatCommand;
  if (actual.type !== expected.type) return false;
  if ('value' in expected && (!('value' in actual) || actual.value !== expected.value)) return false;
  if ('text' in expected && (!('text' in actual) || actual.text !== expected.text)) return false;
  if ('soundId' in expected && (!('soundId' in actual) || actual.soundId !== expected.soundId)) return false;
  if ('objectId' in expected && (!('objectId' in actual) || actual.objectId !== expected.objectId)) return false;
  if ('targetId' in expected && (!('targetId' in actual) || actual.targetId !== expected.targetId)) return false;
  if ('choiceId' in expected && (!('choiceId' in actual) || actual.choiceId !== expected.choiceId)) return false;
  return true;
}

function commandMatchesInstruction(command: JuniorCommand, instruction: StageInstruction) {
  if (command.type !== instruction.command) return false;
  if (instruction.value !== undefined && (!('value' in command) || command.value !== instruction.value)) return false;
  if (instruction.soundId !== undefined && (!('soundId' in command) || command.soundId !== instruction.soundId)) return false;
  if (instruction.text !== undefined && (!('text' in command) || command.text !== instruction.text)) return false;
  if (instruction.targetText !== undefined && (!('targetText' in command) || command.targetText !== instruction.targetText)) return false;
  if (instruction.objectId !== undefined && (!('objectId' in command) || command.objectId !== instruction.objectId)) return false;
  if (instruction.targetId !== undefined && (!('targetId' in command) || command.targetId !== instruction.targetId)) return false;
  if (instruction.choiceId !== undefined && (!('choiceId' in command) || command.choiceId !== instruction.choiceId)) return false;
  if (instruction.command === 'repeat' && !repeatCommandMatches(command, instruction)) return false;
  if (instruction.duration !== undefined && (!('duration' in command) || command.duration !== instruction.duration)) return false;
  return true;
}

function commandsMatchInstructions(commands: JuniorCommand[], instructions: StageInstruction[]) {
  if (!instructions.length) return commands.length > 0;
  if (commands.length !== instructions.length) return false;
  return instructions.every((instruction, index) => {
    const command = commands[index];
    return command ? commandMatchesInstruction(command, instruction) : false;
  });
}

function revokeVoiceRecording(command: JuniorCommand) {
  if (command.type === 'recordVoice' && command.recordingUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(command.recordingUrl);
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(reader.error || new Error('Gagal membaca rekaman.')));
    reader.readAsDataURL(blob);
  });
}

function loadJuniorProgress(): JuniorProgress {
  return loadProject<JuniorProgress>(PROGRESS_STORAGE_KEY) || emptyProgress;
}

function rewardKey(stageId: string, levelId: string, reward?: StageReward) {
  return reward?.badgeId || reward?.unlockId || `${stageId}:${levelId}`;
}

function markProgress(progress: JuniorProgress, stageId: string, levelId: string, reward?: StageReward): JuniorProgress {
  const completedForStage = new Set(progress.completedLevels[stageId] || []);
  completedForStage.add(levelId || 'stage');

  const rewards = new Set(progress.rewards);
  rewards.add(rewardKey(stageId, levelId || 'stage', reward));

  return {
    completedLevels: {
      ...progress.completedLevels,
      [stageId]: [...completedForStage],
    },
    rewards: [...rewards],
  };
}

function levelCompleted(progress: JuniorProgress, stageId: string, levelId: string) {
  return progress.completedLevels[stageId]?.includes(levelId || 'stage') || false;
}

function stageCompleted(progress: JuniorProgress, stage: StageSummary) {
  const stageLevels = progress.completedLevels[stage.id] || [];
  return stageLevels.length >= LEVELS_PER_STAGE;
}

function rewardForCompletion(manifest: StageManifest, activeLevel: StageLevel | null, activeLevelId: string): StageReward {
  const baseReward = activeLevel?.reward || manifest.reward || { stars: 3, badgeTitle: 'Misi Selesai', unlockTitle: 'Level berikutnya' };
  const levels = manifest.levels || [];
  const currentLevelIndex = levels.findIndex((level) => level.id === (activeLevel?.id || activeLevelId));
  const nextLevel = currentLevelIndex >= 0 ? levels[currentLevelIndex + 1] : undefined;

  if (!nextLevel) return baseReward;

  return {
    ...baseReward,
    badgeText: `${activeLevel?.label || 'Level ini'} selesai. Lanjutkan ${nextLevel.label || nextLevel.title} dulu sebelum masuk misi berikutnya.`,
    unlockId: nextLevel.id,
    unlockTitle: nextLevel.label || nextLevel.title,
  };
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
  const [missionReward, setMissionReward] = useState<StageReward | null>(null);
  const [progress, setProgress] = useState<JuniorProgress>(() => loadJuniorProgress());
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Membaca asset stage...');
  const [errorMessage, setErrorMessage] = useState('');
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);
  const [voiceCapture, setVoiceCapture] = useState<{ targetText: string } | null>(null);
  const [messagePrompt, setMessagePrompt] = useState<{ promptText: string } | null>(null);
  const [passwordPrompt, setPasswordPrompt] = useState<{ stageLabel: string } | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [stagePassword, setStagePassword] = useState('');
  const [stagePasswordError, setStagePasswordError] = useState('');

  const sceneRef = useRef<JuniorScene | null>(null);
  const runnerRef = useRef(new CommandRunner());
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandsRef = useRef<JuniorCommand[]>([]);
  const collectingCommandInputRef = useRef(false);
  const messageResolveRef = useRef<((value: string | null) => void) | null>(null);
  const passwordResolveRef = useRef<((value: boolean) => void) | null>(null);

  const showFeedback = useCallback((title: string, message: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ title, message });
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2200);
  }, []);

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => () => {
    commandsRef.current.forEach(revokeVoiceRecording);
  }, []);

  useEffect(() => {
    warmAudioFeedback();
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
        setTitle(manifest.title);
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

  const askStagePassword = useCallback((stage: StageSummary) => {
    setStagePassword('');
    setStagePasswordError('');
    setPasswordPrompt({ stageLabel: `Stage ${getStageNumber(stage)}` });
    return new Promise<boolean>((resolve) => {
      passwordResolveRef.current = resolve;
    });
  }, []);

  const closePasswordPrompt = (allowed: boolean) => {
    passwordResolveRef.current?.(allowed);
    passwordResolveRef.current = null;
    setPasswordPrompt(null);
    setStagePassword('');
    setStagePasswordError('');
  };

  const submitStagePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (stagePassword.trim() !== ADVANCED_STAGE_PASSWORD) {
      playWrongBlockFeedback();
      setStagePasswordError('Password belum tepat.');
      return;
    }

    closePasswordPrompt(true);
  };

  const switchStage = async (stage: StageSummary) => {
    if (stage.status === 'locked') return false;

    if (isPasswordProtectedStage(stage)) {
      const allowed = await askStagePassword(stage);
      if (!allowed) return false;
    }

    setLoadingMessage('Membaca stage...');
    setErrorMessage('');
    try {
      const nextManifest = await loadStageManifest(stage.manifest);
      setActiveStage(stage);
      setManifest(nextManifest);
      setActiveLevelId(getInitialLevelId(nextManifest));
      setTitle(nextManifest.title);
      commandsRef.current.forEach(revokeVoiceRecording);
      setCommands([]);
      setFeedback(null);
      setMissionReward(null);
      setSelectedBackground(nextManifest.backgrounds[0]?.id || '');
      setSelectedCharacter(nextManifest.characters[0]?.id || '');
      sceneRef.current = null;
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal membaca stage.');
      return false;
    } finally {
      setLoadingMessage('');
    }
  };

  const recordVoiceForCommand = useCallback(async (command: JuniorCommand) => {
    if (command.type !== 'recordVoice') return command;

    const targetText = command.targetText.trim() || 'Ucapkan dengan suara lantang';
    const duration = command.duration || 3;
    const canRecord = typeof navigator !== 'undefined'
      && !!navigator.mediaDevices?.getUserMedia
      && typeof MediaRecorder !== 'undefined';

    if (!canRecord) {
      playWrongBlockFeedback();
      showFeedback('Mikrofon belum tersedia.', 'Blok belum dipasang karena suara harus direkam dulu.');
      return null;
    }

    let stream: MediaStream | null = null;

    try {
      setVoiceCapture({ targetText });
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      const stopped = new Promise<Blob>((resolve) => {
        recorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        });
        recorder.addEventListener('stop', () => {
          resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
        }, { once: true });
      });

      recorder.start();
      await new Promise((resolve) => window.setTimeout(resolve, duration * 1000));
      if (recorder.state !== 'inactive') recorder.stop();
      const audioBlob = await stopped;

      if (!audioBlob.size) {
        playWrongBlockFeedback();
        showFeedback('Suara belum terekam.', 'Coba pasang blok rekam suara lagi.');
        return null;
      }

      return {
        ...command,
        targetText,
        recordingUrl: await blobToDataUrl(audioBlob),
        recordingSize: audioBlob.size,
        mimeType: audioBlob.type,
        recordedAt: new Date().toISOString(),
      } satisfies JuniorCommand;
    } catch {
      playWrongBlockFeedback();
      showFeedback('Izin mikrofon belum aktif.', 'Blok belum dipasang karena suara harus direkam dulu.');
      return null;
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setVoiceCapture(null);
    }
  }, [showFeedback]);

  const askMessage = useCallback((promptText: string, defaultValue = '') => {
    setDraftMessage(defaultValue);
    setMessagePrompt({ promptText });
    return new Promise<string | null>((resolve) => {
      messageResolveRef.current = resolve;
    });
  }, []);

  const closeMessagePrompt = (value: string | null) => {
    messageResolveRef.current?.(value);
    messageResolveRef.current = null;
    setMessagePrompt(null);
    setDraftMessage('');
  };

  const submitMessagePrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = draftMessage.trim();
    closeMessagePrompt(message || null);
  };

  const prepareMessageCommand = useCallback(async (command: JuniorCommand) => {
    if (command.type !== 'writeMessage') return command;

    const promptText = command.promptText || 'Tulis pesan pendek';
    const message = await askMessage(promptText, command.message);
    if (!message) {
      playWrongBlockFeedback();
      showFeedback('Pesan belum ditulis.', 'Blok belum dipasang karena pesan masih kosong.');
      return null;
    }

    return {
      ...command,
      message,
      promptText,
    } satisfies JuniorCommand;
  }, [askMessage, showFeedback]);

  const addCommand = async (command: JuniorCommand, targetIndex = commands.length) => {
    if (collectingCommandInputRef.current) {
      showFeedback('Sebentar ya.', 'Selesaikan input blok yang sedang terbuka dulu.');
      return;
    }

    const activeLevel = getActiveLevel(manifest, activeLevelId);
    const activeInstructions = activeLevel?.instructions || manifest?.instructions || [];
    const usesVisualRoute = activeLevel?.instructionMode === 'visual-route';
    const maxCommands = activeInstructions.length || activeLevel?.maxCommands || manifest?.maxCommands || 5;
    const nextIndex = commands.length;

    if (nextIndex >= maxCommands) {
      playWrongBlockFeedback();
      showFeedback('Uups, kereta sudah penuh.', `Maksimal ${maxCommands} perintah untuk stage ini.`);
      return;
    }

    if (targetIndex !== nextIndex) {
      playWrongBlockFeedback();
      const message = targetIndex < nextIndex
        ? `Slot ${targetIndex + 1} sudah terisi. Gunakan slot ${nextIndex + 1}.`
        : `Isi slot ${nextIndex + 1} terlebih dahulu.`;
      showFeedback('Uups, urutannya belum tepat.', message);
      return;
    }

    const expectedInstruction = activeInstructions[nextIndex];
    if (!usesVisualRoute && expectedInstruction && !commandMatchesInstruction(command, expectedInstruction)) {
      playWrongBlockFeedback();
      showFeedback('Uups, perintah tidak tepat.', `Perintah berikutnya harus ${expectedInstruction.label}.`);
      return;
    }

    collectingCommandInputRef.current = true;
    const recordedCommand = await recordVoiceForCommand(command);
    const commandToAdd = recordedCommand ? await prepareMessageCommand(recordedCommand) : null;
    collectingCommandInputRef.current = false;

    if (!commandToAdd) return;

    setCommands((prev) => [...prev, commandToAdd]);
    playCorrectBlockFeedback();
    setReward(true);
    setTimeout(() => setReward(false), 650);
  };

  const removeCommand = (id: string) => setCommands((prev) => {
    const removed = prev.find((cmd) => cmd.id === id);
    if (removed) revokeVoiceRecording(removed);
    return prev.filter((cmd) => cmd.id !== id);
  });
  const clearCommands = () => {
    commandsRef.current.forEach(revokeVoiceRecording);
    setCommands([]);
    setActiveCommandId(null);
    setFeedback(null);
    setMissionReward(null);
  };

  const handlePlay = async () => {
    if (!sceneRef.current || isRunning || !manifest) return;
    const scene = sceneRef.current;
    const activeLevel = getActiveLevel(manifest, activeLevelId);
    const activeInstructions = activeLevel?.instructions || manifest.instructions || [];
    const usesVisualRoute = activeLevel?.instructionMode === 'visual-route';

    if (!commandsMatchInstructions(commands, activeInstructions)) {
      playWrongBlockFeedback();
      if (usesVisualRoute) {
        showFeedback(
          commands.length < activeInstructions.length ? 'Rutenya belum lengkap.' : 'Rutenya belum tepat.',
          commands.length < activeInstructions.length
            ? `Isi semua ${activeInstructions.length} gerbong, lalu coba lagi.`
            : 'Amati kembali jalur dan rintangannya di Panggung Cerita.',
        );
        return;
      }
      showFeedback(
        commands.length < activeInstructions.length ? 'Uups, keretanya belum lengkap.' : 'Uups, urutannya belum tepat.',
        commands.length < activeInstructions.length
          ? `Lengkapi ${activeInstructions.length} perintah dulu.`
          : 'Cek lagi susunan perintahnya sebelum menjalankan.',
      );
      return;
    }

    if (activeLevel?.startBackgroundId) {
      scene.setBackground(activeLevel.startBackgroundId);
      setSelectedBackground(activeLevel.startBackgroundId);
    }

    setIsRunning(true);
    const completed = await runnerRef.current.run(scene, commands, setActiveCommandId);
    if (!completed) {
      setIsRunning(false);
      return;
    }

    if (activeLevel?.completionBackgroundId) {
      await scene.revealBackground(activeLevel.completionBackgroundId, activeLevel.completionMessage);
      setSelectedBackground(activeLevel.completionBackgroundId);
    }

    setIsRunning(false);
    const rewardPayload = rewardForCompletion(manifest, activeLevel, activeLevelId);
    scene.showMissionComplete(rewardPayload);
    const nextProgress = markProgress(progress, manifest.id, activeLevel?.id || activeLevelId || 'stage', rewardPayload);
    setProgress(nextProgress);
    saveProject(PROGRESS_STORAGE_KEY, nextProgress);
    setMissionReward(rewardPayload);
    playCompleteRunFeedback();
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
      const switched = await switchStage(savedStage);
      if (!switched) return;
    }

    setTitle(saved.title || getBackgroundName(manifest, saved.backgroundId) || manifest?.title || 'Project Junior');
    setActiveLevelId(saved.levelId || activeLevelId);
    commandsRef.current.forEach(revokeVoiceRecording);
    setCommands(saved.commands || []);
    setFeedback(null);
    setMissionReward(null);
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
      targetText: item.targetText || (item.command === 'recordVoice' ? "Assalamu'alaikum!" : undefined),
      objectId: item.objectId,
      targetId: item.targetId,
      choiceId: item.choiceId,
      times: item.times,
      repeatCommand: item.repeatCommand,
      correct: item.command === 'choice' ? true : undefined,
      duration: item.duration,
      message: item.command === 'writeMessage' ? 'Pesanku hebat!' : undefined,
      promptText: item.promptText,
      soundId: item.soundId || (item.command === 'sound' ? manifest.sounds?.[0]?.id || 'success' : undefined),
      hideValue: item.hideValue,
      icon: item.icon,
      label: item.label,
      color: activeCommands.find((cmd) => cmd.type === item.command)?.color || '#168eea',
    })) as JuniorCommand[];
    commandsRef.current.forEach(revokeVoiceRecording);
    setCommands(sample);
    setFeedback(null);
    setMissionReward(null);
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
  const activeObjects = activeLevel?.objects || manifest.objects || [];
  const activeRoute = activeLevel?.route;
  const activeSlotCount = activeInstructions.length || activeLevel?.maxCommands || manifest.maxCommands || 5;
  const activeLevelLabel = activeLevel?.label || activeLevel?.title || manifest.ui?.stageLabel || 'Stage';
  const selectedCharacterAsset = manifest.characters.find((character) => character.id === selectedCharacter);
  const selectedCharacterPreview = selectedCharacterAsset?.thumbnail;
  const challengeAvatar = selectedCharacterAsset?.instructionAvatar
    || selectedCharacterPreview
    || manifest.characters[0]?.instructionAvatar
    || manifest.characters[0]?.thumbnail
    || manifest.characters[0]?.file;
  const challengeText = activeLevel?.description || manifest.description || '';
  const challengeLesson = manifest.description && manifest.description !== challengeText
    ? manifest.description
    : manifest.ui?.tip || challengeText;
  const selectedBackgroundName = getBackgroundName(manifest, selectedBackground) || title;
  const commandColor = (type: JuniorCommand['type']) => activeCommands.find((command) => command.type === type)?.color || '#168eea';
  const stageTabs = stagesIndex.stages.map((stage, index) => {
    const passwordProtected = isPasswordProtectedStage(stage);
    return {
      stage,
      label: `Stage ${index + 1}`,
      locked: stage.status === 'locked',
      passwordProtected,
      disabled: stage.status === 'locked',
      completed: stageCompleted(progress, stage),
    };
  });
  const switchLevel = (levelId: string) => {
    if (levelId === activeLevelId) return;
    const nextLevel = getActiveLevel(manifest, levelId);
    setActiveLevelId(levelId);
    commandsRef.current.forEach(revokeVoiceRecording);
    setCommands([]);
    setActiveCommandId(null);
    setFeedback(null);
    setMissionReward(null);
    sceneRef.current?.setObjects(nextLevel?.objects || manifest.objects || []);
    sceneRef.current?.setRoute(nextLevel?.route);
    sceneRef.current?.resetRunState();
    if (nextLevel?.startBackgroundId) {
      setSelectedBackground(nextLevel.startBackgroundId);
      sceneRef.current?.setBackground(nextLevel.startBackgroundId);
    }
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

      <main className={`layout-pro ${activeLevel?.instructionMode === 'visual-route' ? 'visual-route-layout' : ''}`}>
        <section className="left-panel">
          <div className="card-pro stage-card-pro">
            <div className="card-title-row"><h2><UiIcon name="clapper" /> Panggung Cerita</h2></div>
            <div className="stage-frame">
              <GameStage manifest={manifest} backgroundId={selectedBackground} characterId={selectedCharacter} objects={activeObjects} route={activeRoute} routeCommands={commands} onReady={onSceneReady} />
              {activeLevel?.instructionMode === 'visual-route' ? (
                <div className="stage-mission-board">
                  <div className="stage-mission-title">
                    <strong>{activeRoute?.missionTitle || 'Jalur Cerita'}</strong>
                    <span>{activeLevelLabel}</span>
                  </div>
                  <p>{challengeText}</p>
                </div>
              ) : (
                <div className="stage-scene-label">{selectedBackgroundName}</div>
              )}
            </div>
            <div className="stage-tabs" aria-label="Pilih stage">
              {stageTabs.map((item, index) => (
                <button
                  key={item.stage?.id || item.label}
                  className={`${activeStage.id === item.stage?.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''} ${item.locked ? 'locked' : ''} ${item.passwordProtected ? 'password-locked' : ''} ${item.completed ? 'completed' : ''}`}
                  type="button"
                  disabled={item.disabled}
                  title={item.completed ? `${item.label} selesai` : (item.passwordProtected ? `${item.label} butuh password` : item.label)}
                  onClick={() => item.stage && !item.disabled && switchStage(item.stage)}
                >
                  <UiIcon name={item.completed ? 'check' : (item.locked || item.passwordProtected ? 'lock' : 'star')} /> {item.label}
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
                      className={`${level.id === (activeLevel?.id || activeLevelId) ? 'active' : ''} ${levelCompleted(progress, manifest.id, level.id) ? 'completed' : ''}`}
                      onClick={() => switchLevel(level.id)}
                    >
                      {level.label || level.title}
                    </button>
                  ))}
                </div>
              )}
              {challengeText && activeLevel?.instructionMode !== 'visual-route' && (
                <div className="challenge-card">
                  <p className="challenge-task">{challengeText}</p>
                  <div className="challenge-body">
                    {challengeAvatar && <img className="challenge-avatar" src={challengeAvatar} alt="" />}
                    <div className="challenge-bubble">
                      <span>{challengeLesson}</span>
                      <i className="challenge-spark one" />
                      <i className="challenge-spark two" />
                    </div>
                  </div>
                </div>
              )}
              {activeLevel?.instructionMode !== 'visual-route' && (
                <div className="instruction-list" aria-label="Urutan perintah">
                  {activeInstructions.map((item) => (
                    <div className="instruction-item" key={item.order}>
                      <span className="number">{item.order}</span>
                      <span className="mini-command" style={{ background: commandColor(item.command) }}><CommandGlyph type={item.command} /></span>
                      <strong>{item.label}</strong>
                    </div>
                  ))}
                </div>
              )}
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

      {voiceCapture && (
        <div className="voice-capture-panel" role="status" aria-live="polite">
          <div className="voice-capture-card">
            <span className="voice-capture-icon"><CommandGlyph type="recordVoice" /></span>
            <strong>Merekam suara...</strong>
            <p>{voiceCapture.targetText}</p>
          </div>
        </div>
      )}

      {messagePrompt && (
        <div className="message-prompt-panel" role="dialog" aria-modal="true" aria-label="Tulis pesan">
          <form className="message-prompt-card" onSubmit={submitMessagePrompt}>
            <span className="message-prompt-icon"><CommandGlyph type="writeMessage" /></span>
            <label htmlFor="junior-message-input">{messagePrompt.promptText}</label>
            <input
              id="junior-message-input"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              autoFocus
              maxLength={48}
            />
            <div className="message-prompt-actions">
              <button type="button" onClick={() => closeMessagePrompt(null)}>Batal</button>
              <button type="submit">Pasang</button>
            </div>
          </form>
        </div>
      )}

      {passwordPrompt && (
        <div className="password-prompt-panel" role="dialog" aria-modal="true" aria-label="Password stage">
          <form className="password-prompt-card" onSubmit={submitStagePassword}>
            <span className="password-prompt-icon"><UiIcon name="lock" /></span>
            <label htmlFor="stage-password-input">{passwordPrompt.stageLabel} butuh password</label>
            <input
              id="stage-password-input"
              type="password"
              value={stagePassword}
              onChange={(event) => {
                setStagePassword(event.target.value);
                setStagePasswordError('');
              }}
              autoFocus
              inputMode="numeric"
              maxLength={12}
            />
            {stagePasswordError && <p className="password-prompt-error">{stagePasswordError}</p>}
            <div className="password-prompt-actions">
              <button type="button" onClick={() => closePasswordPrompt(false)}>Batal</button>
              <button type="submit">Masuk</button>
            </div>
          </form>
        </div>
      )}

      {feedback && <div className="feedback-toast" role="status" aria-live="polite"><strong>{feedback.title}</strong><span>{feedback.message}</span></div>}
      {missionReward && (
        <div className="mission-result-panel" role="dialog" aria-modal="true" aria-label="Misi selesai">
          <div className="mission-result-card">
            <button type="button" className="mission-result-close" onClick={() => setMissionReward(null)} aria-label="Tutup reward">x</button>
            <div className="mission-result-stars" aria-label={`${missionReward.stars || 3} bintang`}>
              {Array.from({ length: missionReward.stars || 3 }).map((_, index) => <UiIcon key={index} name="star" />)}
            </div>
            <strong>{missionReward.badgeTitle || 'Misi Selesai'}</strong>
            {missionReward.badgeText && <p>{missionReward.badgeText}</p>}
            {missionReward.unlockTitle && <span><UiIcon name="spark" /> Misi berikutnya: {missionReward.unlockTitle}</span>}
          </div>
        </div>
      )}
      {reward && <div className="reward-pop"><div className="reward-card">Hebat!<div><UiIcon name="spark" /> <UiIcon name="star" /> <UiIcon name="spark" /></div></div></div>}
    </div>
  );
}
