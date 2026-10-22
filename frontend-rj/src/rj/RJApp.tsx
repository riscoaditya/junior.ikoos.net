import { useEffect, useMemo, useRef, useState } from 'react';
import {
  commandMatches,
  getCommand,
  stageDefs as defaultStageDefs,
  type CommandId,
  type StageAnimationDef,
  type StageDef,
  type StageLevelDef,
  type StageId,
} from './stageData';

const BOOK_ICON = '/assets/stages/shared/objects/book.png';
const APPLE_ICON = '/assets/stages/shared/objects/apple.png';
const GIFT_ICON = '/assets/stages/shared/objects/gift.png';
const STAGE_ONE_BACKDROP = '/assets/rj/backgrounds/stage-1-kebun-masjid.png';
const DEFAULT_BACKDROP = '/assets/stages/stage-1/backgrounds/masjid.png';
const STAGE_CONFIG_URL = '/assets/rj/stage-config.json';
const COMMAND_CLICK_SOUND = '/assets/stages/stage-1/sounds/pop.wav';
const PRAISE_SOUND = '/assets/rj/sounds/kamu-luar-biasa.mp3';
const DRAG_TYPE = 'application/x-rj-command';
const BUBBLE_TEXT_COMMAND: CommandId = 'talk';
const VOICE_COMMAND: CommandId = 'voiceText';

const CHARACTER_OPTIONS = {
  ali: {
    id: 'ali',
    name: 'Iko',
    main: '/assets/stages/shared/characters/ali-main.png',
    avatar: '/assets/stages/shared/characters/ali-avatar.png',
    planting: '/assets/rj/characters/ali-planting.png',
    chooseAppleSeed: '/assets/rj/characters/iko-choose-apple-seed.png',
    dig: '/assets/rj/characters/iko-dig.png',
    coverSoil: '/assets/rj/characters/iko-cover-soil.png',
  },
  aisyah: {
    id: 'aisyah',
    name: 'Ozi',
    main: '/assets/stages/shared/characters/aisyah-main.png',
    avatar: '/assets/stages/shared/characters/aisyah-avatar.png',
    planting: '/assets/rj/characters/aisyah-planting.png',
    chooseAppleSeed: '/assets/rj/characters/ozi-choose-apple-seed.png',
    dig: '/assets/rj/characters/ozi-dig.png',
    coverSoil: '/assets/rj/characters/ozi-cover-soil.png',
  },
} as const;

type CharacterId = keyof typeof CHARACTER_OPTIONS;
type CharacterProfile = typeof CHARACTER_OPTIONS[CharacterId];

type SceneState = {
  action: string;
  poseAction: string;
  plantPhase: number;
  selectedSeed?: CommandId;
  selectedObject?: CommandId;
  selectedFruit?: CommandId;
  message: string;
  cycle: number;
  holeOpen: boolean;
  seedPlanted: boolean;
  soilCovered: boolean;
  wateringCanReady: boolean;
  fruitInBasket: boolean;
  shareFamily: boolean;
  shareFriend: boolean;
  showBubble: boolean;
};

type RunStep = {
  commandIndex: number;
  action: string;
  message: string;
  duration: number;
  recordingUrl?: string;
  patch?: Partial<SceneState>;
};

type VoiceRecording = {
  targetText: string;
  recordingUrl: string;
  recordingSize: number;
  mimeType: string;
  recordedAt: string;
};

type VoiceRecordingMap = Record<number, VoiceRecording>;

type Feedback = {
  tone: 'success' | 'warn' | 'info';
  title: string;
  message: string;
};

function initialScene(stage: StageDef): SceneState {
  return {
    action: 'idle',
    poseAction: 'idle',
    plantPhase: stage.initialPlantPhase,
    message: stage.bubble,
    cycle: 0,
    holeOpen: false,
    seedPlanted: false,
    soilCovered: false,
    wateringCanReady: false,
    fruitInBasket: false,
    shareFamily: false,
    shareFriend: false,
    showBubble: false,
  };
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function speakVoiceText(text: string) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.rate = 0.88;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(reader.error || new Error('Gagal membaca rekaman.')));
    reader.readAsDataURL(blob);
  });
}

function withCharacterName(text: string, characterName: string) {
  return text.replace(/\bAli\b/g, characterName);
}

function persistedCharacterId(value: string | undefined): CharacterId {
  return value && value in CHARACTER_OPTIONS ? value as CharacterId : 'ali';
}

function isCommandId(value: unknown): value is CommandId {
  return typeof value === 'string' && Boolean(getCommand(value as CommandId));
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function commandListValue(value: unknown, fallback: CommandId[]) {
  if (!Array.isArray(value)) return fallback;
  const commands = value.filter(isCommandId);
  return commands.length > 0 ? commands : fallback;
}

function sceneTypeValue(value: unknown, fallback?: StageDef['sceneType']) {
  return value === 'seed-choice' || value === 'planting' ? value : fallback;
}

function instructionListValue(value: unknown, fallback: StageDef['instructions']) {
  if (!Array.isArray(value)) return fallback;
  const instructions = value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    if (!isCommandId(record.command)) return [];
    return [{
      command: record.command,
      label: stringValue(record.label, getCommand(record.command).label),
      ...(typeof record.targetText === 'string' ? { targetText: record.targetText } : {}),
      ...(record.duration !== undefined ? { duration: numberValue(record.duration, 3, 1, 8) } : {}),
    }];
  });
  return instructions.length > 0 ? instructions : fallback;
}

function stringListValue(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return items.length > 0 ? items : undefined;
}

function animationConfigValue(value: unknown, fallback?: StageDef['animations']) {
  if (!value || typeof value !== 'object') return fallback;

  const animations: Record<string, StageAnimationDef> = {};
  Object.entries(value as Record<string, unknown>).forEach(([action, rawAnimation]) => {
    if (!action || !rawAnimation || typeof rawAnimation !== 'object') return;
    const record = rawAnimation as Record<string, unknown>;
    const characters: Record<string, string[]> = {};

    if (record.characters && typeof record.characters === 'object') {
      Object.entries(record.characters as Record<string, unknown>).forEach(([characterId, frames]) => {
        const nextFrames = stringListValue(frames);
        if (nextFrames) characters[characterId] = nextFrames;
      });
    }

    const defaultFrames = stringListValue(record.frames);
    if (!defaultFrames && Object.keys(characters).length === 0) return;

    animations[action] = {
      frameMs: numberValue(record.frameMs, 140, 48, 800),
      loop: typeof record.loop === 'boolean' ? record.loop : true,
      ...(defaultFrames ? { frames: defaultFrames } : {}),
      ...(Object.keys(characters).length > 0 ? { characters } : {}),
    };
  });

  return Object.keys(animations).length > 0 ? animations : fallback;
}

function stageOverridesFromRecord(base: StageDef, record: Record<string, unknown>): StageLevelDef {
  const override: StageLevelDef = {};

  if (typeof record.label === 'string') override.label = record.label;
  if (typeof record.title === 'string') override.title = record.title;
  if (typeof record.shortTitle === 'string') override.shortTitle = record.shortTitle;
  if (typeof record.subtitle === 'string') override.subtitle = record.subtitle;
  if (isCommandId(record.icon)) override.icon = record.icon;
  if (typeof record.accent === 'string') override.accent = record.accent;
  override.sceneType = sceneTypeValue(record.sceneType, base.sceneType);
  if (typeof record.mission === 'string') override.mission = record.mission;
  if (typeof record.bubble === 'string') override.bubble = record.bubble;
  if (typeof record.leftSign === 'string') override.leftSign = record.leftSign;
  if (typeof record.rightSign === 'string') override.rightSign = record.rightSign;
  if (typeof record.trainSign === 'string') override.trainSign = record.trainSign;
  if (typeof record.bottomTip === 'string') override.bottomTip = record.bottomTip;
  if (typeof record.quote === 'string') override.quote = record.quote;
  if (typeof record.quoteSource === 'string') override.quoteSource = record.quoteSource;
  if (Array.isArray(record.palette)) override.palette = commandListValue(record.palette, base.palette);
  if (Array.isArray(record.solution)) override.solution = commandListValue(record.solution, base.solution);
  if (Array.isArray(record.instructions)) override.instructions = instructionListValue(record.instructions, base.instructions);
  if (record.slots !== undefined) override.slots = numberValue(record.slots, base.slots, 1, 8);
  if (record.initialPlantPhase !== undefined) override.initialPlantPhase = numberValue(record.initialPlantPhase, base.initialPlantPhase, 0, 8);
  if (typeof record.successTitle === 'string') override.successTitle = record.successTitle;
  if (typeof record.successMessage === 'string') override.successMessage = record.successMessage;
  if (record.animations) override.animations = animationConfigValue(record.animations, base.animations);
  if (typeof record.bubbleText === 'string') override.bubbleText = record.bubbleText;
  if (typeof record.voiceText === 'string') override.voiceText = record.voiceText;
  if (typeof record.voiceSrc === 'string') override.voiceSrc = record.voiceSrc;

  return override;
}

function levelConfigValue(value: unknown, base: StageDef) {
  if (!value || typeof value !== 'object') return base.levels;

  const levels: Record<string, StageLevelDef> = {};
  Object.entries(value as Record<string, unknown>).forEach(([level, rawLevel]) => {
    if (!rawLevel || typeof rawLevel !== 'object') return;
    levels[level] = stageOverridesFromRecord(base, rawLevel as Record<string, unknown>);
  });

  return Object.keys(levels).length > 0 ? levels : base.levels;
}

function numberValue(value: unknown, fallback: number, min = 0, max = 99) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

function mergeStageConfig(defaultStages: StageDef[], rawConfig: unknown): StageDef[] {
  const rawStages = rawConfig && typeof rawConfig === 'object' && Array.isArray((rawConfig as { stages?: unknown }).stages)
    ? (rawConfig as { stages: unknown[] }).stages
    : [];

  return defaultStages.map((stage) => {
    const rawStage = rawStages.find((item) => item && typeof item === 'object' && Number((item as { id?: unknown }).id) === stage.id);
    if (!rawStage || typeof rawStage !== 'object') return stage;

    const record = rawStage as Record<string, unknown>;
    const baseStage: StageDef = {
      ...stage,
      title: stringValue(record.title, stage.title),
      shortTitle: stringValue(record.shortTitle, stage.shortTitle),
      subtitle: stringValue(record.subtitle, stage.subtitle),
      icon: isCommandId(record.icon) ? record.icon : stage.icon,
      accent: stringValue(record.accent, stage.accent),
      sceneType: sceneTypeValue(record.sceneType, stage.sceneType),
      mission: stringValue(record.mission, stage.mission),
      bubble: stringValue(record.bubble, stage.bubble),
      leftSign: stringValue(record.leftSign, stage.leftSign),
      rightSign: stringValue(record.rightSign, stage.rightSign),
      trainSign: stringValue(record.trainSign, stage.trainSign),
      bottomTip: stringValue(record.bottomTip, stage.bottomTip),
      quote: stringValue(record.quote, stage.quote),
      quoteSource: stringValue(record.quoteSource, stage.quoteSource),
      palette: commandListValue(record.palette, stage.palette),
      solution: commandListValue(record.solution, stage.solution),
      instructions: instructionListValue(record.instructions, stage.instructions),
      slots: numberValue(record.slots, stage.slots, 1, 8),
      initialPlantPhase: numberValue(record.initialPlantPhase, stage.initialPlantPhase, 0, 8),
      successTitle: stringValue(record.successTitle, stage.successTitle),
      successMessage: stringValue(record.successMessage, stage.successMessage),
      animations: animationConfigValue(record.animations, stage.animations),
      bubbleText: stringValue(record.bubbleText, stage.bubbleText || ''),
      voiceText: stringValue(record.voiceText, stage.voiceText || ''),
      voiceSrc: stringValue(record.voiceSrc, stage.voiceSrc || ''),
    };

    return {
      ...baseStage,
      levels: levelConfigValue(record.levels, baseStage),
    };
  });
}

function applyStageLevel(stage: StageDef, level: number): StageDef {
  const override = stage.levels?.[String(level)];
  if (!override) {
    return {
      ...stage,
      level,
      levelLabel: `Lv ${level}`,
    };
  }

  return {
    ...stage,
    ...override,
    level,
    levelLabel: override.label || `Lv ${level}`,
    levels: stage.levels,
  };
}

function maybeAutoFinish(stage: StageDef, nextProgram: CommandId[]): CommandId[] {
  if (stage.palette.includes('finish')) return nextProgram;
  if (stage.solution[stage.solution.length - 1] !== 'finish') return nextProgram;
  if (nextProgram.length !== stage.solution.length - 1) return nextProgram;

  const isReady = nextProgram.every((commandId, index) => commandMatches(stage, commandId, stage.solution[index], index));
  return isReady ? [...nextProgram, 'finish' as CommandId] : nextProgram;
}

function stripRuntimeOnlyCommands(stage: StageDef, program: CommandId[]) {
  if (stage.solution.includes(BUBBLE_TEXT_COMMAND)) return program;
  return program.filter((commandId) => commandId !== BUBBLE_TEXT_COMMAND);
}

function withBubbleTextSteps(stage: StageDef, program: CommandId[], steps: RunStep[]): RunStep[] {
  const bubbleIndexes = program
    .map((commandId, index) => ({ commandId, index }))
    .filter((item) => item.commandId === BUBBLE_TEXT_COMMAND)
    .map((item) => item.index);

  if (bubbleIndexes.length === 0) return steps;

  const result = [...steps];
  bubbleIndexes.reverse().forEach((programIndex) => {
    const nonBubbleBefore = program.slice(0, programIndex).filter((commandId) => commandId !== BUBBLE_TEXT_COMMAND).length;
    const previousCommandIndex = nonBubbleBefore - 1;
    const insertAt = previousCommandIndex < 0
      ? 0
      : result.reduce((lastIndex, step, index) => (step.commandIndex === previousCommandIndex ? index + 1 : lastIndex), result.length);

    result.splice(insertAt, 0, {
      commandIndex: programIndex,
      action: 'talk',
      message: stage.bubble,
      duration: 1450,
      patch: { showBubble: true },
    });
  });

  return result;
}

function getInstructionForSlot(stage: StageDef, slotIndex: number) {
  return stage.instructions[slotIndex];
}

function getVoiceTargetText(stage: StageDef, slotIndex: number) {
  return getInstructionForSlot(stage, slotIndex)?.targetText || stage.voiceText || 'Bismillah';
}

function getVoiceDuration(stage: StageDef, slotIndex: number) {
  return getInstructionForSlot(stage, slotIndex)?.duration || 3;
}

function getBubbleText(stage: StageDef, slotIndex: number) {
  return getInstructionForSlot(stage, slotIndex)?.targetText || stage.bubbleText || stage.bubble;
}

function buildSeedChoiceRunSteps(stage: StageDef, program: CommandId[], voiceRecordings: VoiceRecordingMap): RunStep[] {
  return program.flatMap((commandId, commandIndex): RunStep[] => {
    if (commandId === 'finish') {
      return [{
        commandIndex,
        action: 'finish',
        message: 'Alhamdulillah, pilihan biji selesai.',
        duration: 900,
      }];
    }

    if (commandId === 'start') {
      return [{
        commandIndex,
        action: 'start',
        message: 'Bismillah, kita mulai memilih biji terbaik.',
        duration: 760,
      }];
    }

    if (commandId === VOICE_COMMAND) {
      const recording = voiceRecordings[commandIndex];
      const targetText = recording?.targetText || getVoiceTargetText(stage, commandIndex);
      return [{
        commandIndex,
        action: 'voice-text',
        message: targetText,
        recordingUrl: recording?.recordingUrl,
        duration: getVoiceDuration(stage, commandIndex) * 1000 + 280,
      }];
    }

    if (commandId === 'seedBean') {
      return [{
        commandIndex,
        action: 'choose-apple-seed',
        message: 'Biji buah apel dipilih dengan hati-hati.',
        duration: 1250,
        patch: { selectedSeed: 'seedBean' },
      }];
    }

    if (commandId === BUBBLE_TEXT_COMMAND) {
      return [{
        commandIndex,
        action: 'talk',
        message: getBubbleText(stage, commandIndex),
        duration: 1500,
        patch: { showBubble: true },
      }];
    }

    return [];
  });
}

function buildPlantingRunSteps(stage: StageDef, program: CommandId[], characterName: string, voiceRecordings: VoiceRecordingMap): RunStep[] {
  return program.flatMap((commandId, commandIndex): RunStep[] => {
    if (commandId === 'finish') {
      return [{
        commandIndex,
        action: 'finish',
        message: 'Alhamdulillah, susunan perintah selesai dijalankan.',
        duration: 900,
      }];
    }

    if (commandId === 'start') {
      return [{
        commandIndex,
        action: 'start',
        message: 'Bismillah, kita mulai misi kebaikan.',
        duration: 760,
      }];
    }

    if (commandId === VOICE_COMMAND) {
      const recording = voiceRecordings[commandIndex];
      const targetText = recording?.targetText || getVoiceTargetText(stage, commandIndex);
      return [{
        commandIndex,
        action: 'voice-text',
        message: targetText,
        recordingUrl: recording?.recordingUrl,
        duration: getVoiceDuration(stage, commandIndex) * 1000 + 280,
      }];
    }

    if (commandId === 'dig') {
      return [{
        commandIndex,
        action: 'dig',
        message: `${characterName} menggali tanah dengan hati-hati.`,
        duration: 1350,
        patch: { holeOpen: true, plantPhase: 0 },
      }];
    }

    if (commandId === 'insertSeed') {
      return [{
        commandIndex,
        action: 'insert-seed',
        message: 'Biji dimasukkan ke lubang tanah.',
        duration: 1150,
        patch: { seedPlanted: true, plantPhase: 1 },
      }];
    }

    if (commandId === 'coverSoil') {
      return [{
        commandIndex,
        action: 'cover-soil',
        message: 'Tanah ditutup rapi agar biji terlindungi.',
        duration: 1150,
        patch: { soilCovered: true, plantPhase: 2 },
      }];
    }

    if (commandId === BUBBLE_TEXT_COMMAND) {
      return [{
        commandIndex,
        action: 'talk',
        message: getBubbleText(stage, commandIndex) || 'MasyaAllah, ikhtiar menanam sudah selesai.',
        duration: 1550,
        patch: { showBubble: true },
      }];
    }

    return [];
  });
}

function getStageCharacterImage(stage: StageDef, scene: SceneState, character: CharacterProfile) {
  if (stage.id !== 1 && stage.id !== 2) return character.main;
  if (stage.sceneType === 'seed-choice') {
    return scene.action === 'choose-apple-seed' || scene.selectedSeed === 'seedBean' ? character.chooseAppleSeed : character.main;
  }
  const poseAction = scene.poseAction || scene.action;
  if (poseAction === 'idle' || poseAction === 'start' || poseAction === 'try-again' || poseAction === 'voice-text') return character.main;
  if (poseAction === 'dig') return character.dig;
  if (poseAction === 'cover-soil' || (poseAction === 'finish' && scene.soilCovered)) return character.coverSoil;
  return character.planting;
}

function getActionAnimation(stage: StageDef, action: string, character: CharacterProfile) {
  const animation = stage.animations?.[action];
  if (!animation) return null;

  const frames = animation.characters?.[character.id] || animation.frames || [];
  if (frames.length === 0) return null;

  return {
    frames,
    frameMs: animation.frameMs || 140,
    loop: animation.loop !== false,
  };
}

function collectStageAnimationImages(stages: StageDef[]) {
  const images = new Set<string>();
  stages.forEach((stage) => {
    Object.values(stage.animations || {}).forEach((animation) => {
      animation.frames?.forEach((frame) => images.add(frame));
      Object.values(animation.characters || {}).forEach((frames) => {
        frames.forEach((frame) => images.add(frame));
      });
    });
  });
  return images;
}

function buildRunSteps(stage: StageDef, program: CommandId[], characterName: string, voiceRecordings: VoiceRecordingMap): RunStep[] {
  const baseStart: RunStep = {
    commandIndex: 0,
    action: 'start',
    message: 'Bismillah, kita mulai misi kebaikan.',
    duration: 760,
  };

  if (stage.sceneType === 'seed-choice') {
    return buildSeedChoiceRunSteps(stage, program, voiceRecordings);
  }

  if (stage.id === 1 || stage.id === 2 || stage.sceneType === 'planting') {
    return buildPlantingRunSteps(stage, program, characterName, voiceRecordings);
  }

  if (stage.id === 3) {
    return withBubbleTextSteps(stage, program, [
      baseStart,
      {
        commandIndex: 1,
        action: 'pick-watering-can',
        message: `${characterName} memilih penyiram air, bukan benda pengalih.`,
        duration: 1000,
        patch: { wateringCanReady: true, selectedObject: 'wateringCan' },
      },
      {
        commandIndex: 2,
        action: 'water',
        message: 'Air masuk ke tanah. Tanaman jadi segar.',
        duration: 1450,
        patch: { plantPhase: 3 },
      },
      {
        commandIndex: 3,
        action: 'finish',
        message: 'Air adalah nikmat dari Allah.',
        duration: 950,
      },
    ]);
  }

  if (stage.id === 4) {
    const repeatedCare = [1, 2, 3].flatMap((cycle) => [
      {
        commandIndex: 1,
        action: 'water',
        message: `Siklus ${cycle}: siram tanaman.`,
        duration: 900,
        patch: { cycle, plantPhase: Math.max(3, 2 + cycle) },
      },
      {
        commandIndex: 2,
        action: 'sunlight',
        message: `Siklus ${cycle}: beri sinar matahari.`,
        duration: 900,
        patch: { cycle, plantPhase: Math.max(3, 2 + cycle) },
      },
      {
        commandIndex: 3,
        action: 'wait',
        message: `Siklus ${cycle}: tunggu dengan sabar.`,
        duration: 900,
        patch: { cycle, plantPhase: Math.min(6, 3 + cycle) },
      },
    ] satisfies RunStep[]);

    return withBubbleTextSteps(stage, program, [
      baseStart,
      ...repeatedCare.slice(0, 3),
      {
        commandIndex: 4,
        action: 'repeat3',
        message: 'Ulangi perawatan sampai 3 kali.',
        duration: 850,
        patch: { cycle: 1 },
      },
      ...repeatedCare.slice(3),
      {
        commandIndex: 5,
        action: 'finish',
        message: 'Tanaman tumbuh karena dirawat dengan sabar.',
        duration: 1100,
        patch: { cycle: 3, plantPhase: 6 },
      },
    ]);
  }

  if (stage.id === 5) {
    return withBubbleTextSteps(stage, program, [
      baseStart,
      {
        commandIndex: 1,
        action: 'choose-ripe-fruit',
        message: `${characterName} memilih buah merah yang sudah matang.`,
        duration: 1150,
        patch: { selectedFruit: 'fruitRipe' },
      },
      {
        commandIndex: 2,
        action: 'harvest',
        message: 'Buah matang dipetik dan masuk keranjang.',
        duration: 1350,
        patch: { fruitInBasket: true, plantPhase: 8 },
      },
      {
        commandIndex: 3,
        action: 'finish',
        message: 'Alhamdulillah, panen selesai.',
        duration: 1000,
      },
    ]);
  }

  return withBubbleTextSteps(stage, program, [
    baseStart,
    {
      commandIndex: 1,
      action: 'take-fruit',
      message: `${characterName} membawa keranjang hasil panen.`,
      duration: 1050,
      patch: { fruitInBasket: true },
    },
    {
      commandIndex: 2,
      action: 'share-family',
      message: 'Sebagian buah diberikan kepada keluarga.',
      duration: 1150,
      patch: { shareFamily: true },
    },
    {
      commandIndex: 3,
      action: 'share-friend',
      message: 'Sebagian lagi diberikan kepada teman.',
      duration: 1150,
      patch: { shareFriend: true },
    },
    {
      commandIndex: 4,
      action: 'finish',
      message: 'MasyaAllah, berbagi membuat hati gembira.',
      duration: 1000,
    },
  ]);
}

function validateProgram(stage: StageDef, program: CommandId[]): Feedback | null {
  const hasHiddenFinish = !stage.palette.includes('finish') && stage.solution[stage.solution.length - 1] === 'finish';
  const visibleRequiredLength = hasHiddenFinish ? stage.solution.length - 1 : stage.solution.length;
  const requiredProgram = stripRuntimeOnlyCommands(stage, program);
  const candidateProgram = hasHiddenFinish && requiredProgram.length === visibleRequiredLength ? [...requiredProgram, 'finish' as CommandId] : requiredProgram;

  if (requiredProgram.length < visibleRequiredLength) {
    return {
      tone: 'warn',
      title: 'Susunan belum lengkap.',
      message: `Isi ${visibleRequiredLength} kotak dulu, lalu tekan Jalan.`,
    };
  }

  if (candidateProgram.length > stage.solution.length) {
    return {
      tone: 'warn',
      title: 'Terlalu banyak perintah.',
      message: `Stage ini butuh ${stage.solution.length} perintah saja.`,
    };
  }

  if (stage.id === 3 && (candidateProgram.includes('stone') || candidateProgram.includes('toyCar'))) {
    return {
      tone: 'warn',
      title: 'Belum tepat.',
      message: candidateProgram.includes('stone') ? 'Tanaman tidak membutuhkan batu.' : 'Mobil mainan bukan alat untuk menyiram tanaman.',
    };
  }

  if (stage.id === 5 && candidateProgram.includes('fruitGreen')) {
    return {
      tone: 'warn',
      title: 'Belum matang.',
      message: 'Buah hijau perlu ditunggu dulu. Pilih buah matang ya.',
    };
  }

  const mismatch = stage.solution.findIndex((expected, index) => !commandMatches(stage, candidateProgram[index], expected, index));
  if (mismatch >= 0) {
    return {
      tone: 'warn',
      title: 'Hampir benar.',
      message: `Cek lagi kotak ${mismatch + 1}: seharusnya ${getCommand(stage.solution[mismatch]).label}.`,
    };
  }

  return null;
}

function persistedStageId(value: number): StageId {
  return defaultStageDefs.some((stage) => stage.id === value) ? value as StageId : 1;
}

function getInitialStageFromUrl(): StageId {
  if (typeof window === 'undefined') return 1;
  const stageParam = new URLSearchParams(window.location.search).get('stage');
  return persistedStageId(Number(stageParam || 1));
}

function getInitialCharacterFromUrl(): CharacterId {
  if (typeof window === 'undefined') return 'ali';
  const characterParam = new URLSearchParams(window.location.search).get('character') || undefined;
  return persistedCharacterId(characterParam);
}

function getInitialLevelFromUrl() {
  if (typeof window === 'undefined') return 1;
  const level = Number(new URLSearchParams(window.location.search).get('level') || 1);
  return Number.isFinite(level) && level >= 1 && level <= 3 ? Math.round(level) : 1;
}

export default function RJApp() {
  const [stages, setStages] = useState<StageDef[]>(defaultStageDefs);
  const [activeStageId, setActiveStageId] = useState<StageId>(() => getInitialStageFromUrl());
  const [activeLevel, setActiveLevel] = useState(() => getInitialLevelFromUrl());
  const activeStageBase = useMemo(() => stages.find((stage) => stage.id === activeStageId) || stages[0], [activeStageId, stages]);
  const activeStage = useMemo(() => applyStageLevel(activeStageBase, activeLevel), [activeStageBase, activeLevel]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>(() => getInitialCharacterFromUrl());
  const selectedCharacter = CHARACTER_OPTIONS[selectedCharacterId];
  const [program, setProgram] = useState<CommandId[]>([]);
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecordingMap>({});
  const [voiceCapture, setVoiceCapture] = useState<{ targetText: string; duration: number } | null>(null);
  const [scene, setScene] = useState<SceneState>(() => initialScene(activeStage));
  const [activeCommandIndex, setActiveCommandIndex] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [rewardPulse, setRewardPulse] = useState(false);
  const [levelFeedback, setLevelFeedback] = useState('');
  const runTokenRef = useRef(0);
  const feedbackTimerRef = useRef<number | null>(null);
  const commandSoundRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const praiseAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(STAGE_CONFIG_URL, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`Stage config HTTP ${response.status}`);
        return response.json();
      })
      .then((config) => {
        if (!cancelled) setStages(mergeStageConfig(defaultStageDefs, config));
      })
      .catch((error) => {
        console.warn('RJ stage config fallback aktif:', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setProgram([]);
    setVoiceRecordings({});
    setScene(initialScene(activeStage));
    setActiveCommandIndex(null);
    setFeedback(null);
    setLevelFeedback('');
  }, [activeStage]);

  useEffect(() => () => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
  }, []);

  useEffect(() => {
    const audio = new Audio(COMMAND_CLICK_SOUND);
    audio.volume = 0.42;
    commandSoundRef.current = audio;

    const praiseAudio = new Audio(PRAISE_SOUND);
    praiseAudio.volume = 0.95;
    praiseAudioRef.current = praiseAudio;
  }, []);

  useEffect(() => {
    const imagePaths = new Set<string>();
    Object.values(CHARACTER_OPTIONS).forEach((character) => {
      imagePaths.add(character.main);
      imagePaths.add(character.avatar);
      imagePaths.add(character.planting);
      imagePaths.add(character.chooseAppleSeed);
      imagePaths.add(character.dig);
      imagePaths.add(character.coverSoil);
    });
    collectStageAnimationImages(stages).forEach((src) => imagePaths.add(src));
    imagePaths.forEach((src) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = src;
    });
  }, [stages]);

  const playCommandSound = () => {
    const audio = commandSoundRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  };

  const playPraiseSound = () => {
    const audio = praiseAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  };

  const stopVoiceCue = () => {
    const audio = voiceAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      voiceAudioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const playVoiceCue = (text: string, recordingUrl?: string) => {
    stopVoiceCue();
    const src = recordingUrl || activeStage.voiceSrc;
    if (src) {
      const audio = new Audio(src);
      audio.volume = 0.92;
      voiceAudioRef.current = audio;
      void audio.play().catch(() => speakVoiceText(text));
      return;
    }
    speakVoiceText(text);
  };

  const recordVoiceForSlot = async (slotIndex: number): Promise<VoiceRecording | null> => {
    const targetText = getVoiceTargetText(activeStage, slotIndex).trim() || 'Ucapkan dengan suara lantang';
    const duration = getVoiceDuration(activeStage, slotIndex);
    const canRecord = typeof navigator !== 'undefined'
      && !!navigator.mediaDevices?.getUserMedia
      && typeof MediaRecorder !== 'undefined';

    if (!canRecord) {
      showFeedback({
        tone: 'warn',
        title: 'Mikrofon belum tersedia.',
        message: 'Blok Voice belum dipasang karena suara harus direkam dulu.',
      });
      return null;
    }

    let stream: MediaStream | null = null;

    try {
      setVoiceCapture({ targetText, duration });
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
      await wait(duration * 1000);
      if (recorder.state !== 'inactive') recorder.stop();
      const audioBlob = await stopped;

      if (!audioBlob.size) {
        showFeedback({
          tone: 'warn',
          title: 'Suara belum terekam.',
          message: 'Coba pasang blok Voice lagi.',
        });
        return null;
      }

      return {
        targetText,
        recordingUrl: await blobToDataUrl(audioBlob),
        recordingSize: audioBlob.size,
        mimeType: audioBlob.type,
        recordedAt: new Date().toISOString(),
      };
    } catch {
      showFeedback({
        tone: 'warn',
        title: 'Izin mikrofon belum aktif.',
        message: 'Blok Voice belum dipasang karena suara harus direkam dulu.',
      });
      return null;
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setVoiceCapture(null);
    }
  };

  const showFeedback = (next: Feedback) => {
    setFeedback(next);
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 2600);
  };

  const addCommand = async (commandId: CommandId, slotIndex?: number) => {
    if (isRunning) return;
    setFeedback(null);
    const nextIndex = slotIndex ?? program.length;

    if (nextIndex > program.length) {
      showFeedback({
        tone: 'warn',
        title: 'Isi berurutan ya.',
        message: `Lengkapi kotak ${program.length + 1} terlebih dahulu.`,
      });
      return;
    }

    if (nextIndex >= activeStage.slots) {
      showFeedback({
        tone: 'warn',
        title: 'Kotak sudah penuh.',
        message: `Stage ini memakai ${activeStage.slots} kotak perintah.`,
      });
      return;
    }

    const recording = commandId === VOICE_COMMAND ? await recordVoiceForSlot(nextIndex) : null;
    if (commandId === VOICE_COMMAND && !recording) return;

    setProgram((current) => {
      if (nextIndex > current.length) {
        showFeedback({
          tone: 'warn',
          title: 'Isi berurutan ya.',
          message: `Lengkapi kotak ${current.length + 1} terlebih dahulu.`,
        });
        return current;
      }

      if (nextIndex >= activeStage.slots) {
        showFeedback({
          tone: 'warn',
          title: 'Kotak sudah penuh.',
          message: `Stage ini memakai ${activeStage.slots} kotak perintah.`,
        });
        return current;
      }

      const updated = [...current];
      updated[nextIndex] = commandId;
      return maybeAutoFinish(activeStage, updated.slice(0, activeStage.slots)).slice(0, activeStage.slots);
    });
    setVoiceRecordings((current) => {
      const next = { ...current };
      if (recording) next[nextIndex] = recording;
      else delete next[nextIndex];
      return next;
    });
  };

  const removeCommand = (index: number) => {
    if (isRunning) return;
    setProgram((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setVoiceRecordings((current) => {
      const next: VoiceRecordingMap = {};
      Object.entries(current).forEach(([rawIndex, recording]) => {
        const recordingIndex = Number(rawIndex);
        if (recordingIndex < index) next[recordingIndex] = recording;
        if (recordingIndex > index) next[recordingIndex - 1] = recording;
      });
      return next;
    });
  };

  const clearProgram = () => {
    if (isRunning) return;
    setProgram([]);
    setVoiceRecordings({});
    setActiveCommandIndex(null);
    setScene(initialScene(activeStage));
    setFeedback(null);
  };

  const switchStage = (stageId: StageId) => {
    runTokenRef.current += 1;
    setIsRunning(false);
    setActiveStageId(stageId);
    setActiveLevel(1);
  };

  const selectCharacter = (characterId: CharacterId) => {
    if (isRunning) return;
    setSelectedCharacterId(characterId);
  };

  const play = async () => {
    if (isRunning) return;
    const validation = validateProgram(activeStage, program);
    if (validation) {
      showFeedback(validation);
      setScene((current) => ({
        ...current,
        action: 'try-again',
        message: validation.message,
        showBubble: false,
        selectedObject: program.find((command) => command === 'stone' || command === 'toyCar'),
        selectedFruit: program.find((command) => command === 'fruitGreen' || command === 'fruitRipe'),
      }));
      return;
    }

    const missingVoiceIndex = program.findIndex((commandId, index) => commandId === VOICE_COMMAND && !voiceRecordings[index]);
    if (missingVoiceIndex >= 0) {
      showFeedback({
        tone: 'warn',
        title: 'Rekaman belum ada.',
        message: `Pasang ulang blok Voice di kotak ${missingVoiceIndex + 1}, lalu rekam suara dulu.`,
      });
      return;
    }

    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    setIsRunning(true);
    setFeedback(null);
    setRewardPulse(false);
    setScene(initialScene(activeStage));
    await wait(80);

    const steps = buildRunSteps(activeStage, program, selectedCharacter.name, voiceRecordings);
    for (const step of steps) {
      if (runTokenRef.current !== token) return;
      setActiveCommandIndex(step.commandIndex);
      setScene((current) => ({
        ...current,
        showBubble: false,
        ...step.patch,
        action: step.action,
        poseAction: step.action === 'talk' ? current.poseAction : step.action,
        message: step.message,
      }));
      if (step.action === 'voice-text') playVoiceCue(step.message, step.recordingUrl);
      await wait(step.duration);
    }

    if (runTokenRef.current !== token) return;
    setActiveCommandIndex(null);
    setIsRunning(false);
    setRewardPulse(true);
    playPraiseSound();
    showFeedback({
      tone: 'success',
      title: activeStage.successTitle,
      message: withCharacterName(activeStage.successMessage, selectedCharacter.name),
    });
    window.setTimeout(() => setRewardPulse(false), 1000);
  };

  const stop = () => {
    runTokenRef.current += 1;
    stopVoiceCue();
    setIsRunning(false);
    setActiveCommandIndex(null);
    setScene((current) => ({
      ...current,
      action: 'idle',
      poseAction: 'idle',
      message: 'Animasi dihentikan. Kamu bisa mengatur ulang kotak perintah.',
      showBubble: false,
    }));
  };

  const selectLevel = (level: number) => {
    if (isRunning) return;
    if (level === activeLevel) return;
    if (level === 1 || activeStageBase.levels?.[String(level)]) {
      runTokenRef.current += 1;
      setIsRunning(false);
      setActiveLevel(level);
      setLevelFeedback('');
      return;
    }
    setLevelFeedback(`Lv ${level} sedang disiapkan untuk tantangan berikutnya.`);
    window.setTimeout(() => setLevelFeedback(''), 2200);
  };

  return (
    <div className="rj-app">
      <div className="rj-desktop-frame">
        <Header
          character={selectedCharacter}
          onPlay={play}
          onStop={stop}
          isRunning={isRunning}
        />

        <main className="rj-layout">
          <section className="rj-left-column">
            <StoryPanel
              stage={activeStage}
              scene={scene}
              stages={stages}
              onSwitchStage={switchStage}
              activeStageId={activeStage.id}
              character={selectedCharacter}
            />
            <CharacterPanel
              selectedCharacterId={selectedCharacterId}
              onSelectCharacter={selectCharacter}
            />
          </section>

          <StageInstructionPanel
            stage={activeStage}
            character={selectedCharacter}
            activeLevel={activeLevel}
            levelFeedback={levelFeedback}
            onSelectLevel={selectLevel}
          />

          <section className="rj-right-column">
            <CommandPalette
              stage={activeStage}
              characterName={selectedCharacter.name}
              onAdd={addCommand}
              onCommandSound={playCommandSound}
            />
            <CommandTrain
              stage={activeStage}
              program={program}
              activeCommandIndex={activeCommandIndex}
              characterName={selectedCharacter.name}
              onAdd={addCommand}
              onRemove={removeCommand}
              onClear={clearProgram}
              onCommandSound={playCommandSound}
            />
            <QuoteCard stage={activeStage} />
          </section>
        </main>
      </div>

      {feedback && (
        <div className={`rj-toast ${feedback.tone}`} role="status" aria-live="polite">
          <strong>{feedback.title}</strong>
          <span>{feedback.message}</span>
        </div>
      )}
      {rewardPulse && (
        <div className="rj-reward" aria-hidden="true">
          <span>Hebat!</span>
          <i />
          <i />
          <i />
        </div>
      )}
      {voiceCapture && <VoiceCaptureOverlay targetText={voiceCapture.targetText} duration={voiceCapture.duration} />}
    </div>
  );
}

function VoiceCaptureOverlay({ targetText, duration }: { targetText: string; duration: number }) {
  return (
    <div className="rj-voice-capture" role="status" aria-live="polite">
      <div className="rj-voice-capture-card">
        <span className="rj-voice-capture-icon">
          <img src={getCommand(VOICE_COMMAND).image} alt="" />
        </span>
        <strong>Merekam suara...</strong>
        <p>Ucapkan: "{targetText}"</p>
        <small>{duration} detik</small>
      </div>
    </div>
  );
}

function Header({
  character,
  onPlay,
  onStop,
  isRunning,
}: {
  character: CharacterProfile;
  onPlay: () => void;
  onStop: () => void;
  isRunning: boolean;
}) {
  return (
    <header className="rj-topbar">
      <div className="rj-brand-card">
        <img src={character.avatar} alt="" className="rj-brand-avatar" />
        <div>
          <h1>IKOOS <span>Junior</span> Coding</h1>
          <p>Belajar coding dengan cara yang seru dan menyenangkan.</p>
        </div>
      </div>

      <div className="rj-theme-sign" aria-label="Kebun Amanah">
        <span>Kebun Amanah</span>
        <small>Dari Biji Menjadi Buah</small>
      </div>

      <div className="rj-toolbar" aria-label="Kontrol project">
        <button className="rj-btn play" type="button" onClick={onPlay} disabled={isRunning}>
          <span className="rj-btn-icon play-icon" /> Jalan
        </button>
        <button className="rj-btn stop" type="button" onClick={onStop}>
          <span className="rj-btn-icon stop-icon" /> Stop
        </button>
      </div>
    </header>
  );
}

function StoryPanel({
  stage,
  scene,
  stages,
  activeStageId,
  onSwitchStage,
  character,
}: {
  stage: StageDef;
  scene: SceneState;
  stages: StageDef[];
  activeStageId: StageId;
  onSwitchStage: (stageId: StageId) => void;
  character: CharacterProfile;
}) {
  return (
    <section className="rj-panel rj-story-panel">
      <PanelTitle icon={BOOK_ICON} title="Panggung Cerita" subtitle="Lihat cerita dan hasil coding-mu di sini." />
      <StoryStage stage={stage} scene={scene} character={character} />
      <nav className="rj-stage-tabs" aria-label="Pilih stage">
        {stages.map((item) => {
          const command = getCommand(item.icon);
          return (
            <button
              key={item.id}
              type="button"
              className={item.id === activeStageId ? 'active' : ''}
              onClick={() => onSwitchStage(item.id)}
            >
              <span>Stage {item.id}</span>
              <img src={command.image} alt="" />
              <strong>{item.shortTitle}</strong>
            </button>
          );
        })}
      </nav>
    </section>
  );
}

function CharacterPanel({
  selectedCharacterId,
  onSelectCharacter,
}: {
  selectedCharacterId: CharacterId;
  onSelectCharacter: (characterId: CharacterId) => void;
}) {
  const selectedCharacter = CHARACTER_OPTIONS[selectedCharacterId];

  return (
    <section className="rj-panel rj-character-panel">
      <img src={selectedCharacter.avatar} alt="" />
      <div>
        <h2>Karakter</h2>
        <p>Pilih karakter yang bermain.</p>
      </div>
      <label className="rj-character-select">
        <span className="sr-only">Pilih karakter</span>
        <select
          value={selectedCharacterId}
          onChange={(event) => onSelectCharacter(event.target.value as CharacterId)}
        >
          <option value="ali">Iko</option>
          <option value="aisyah">Ozi</option>
        </select>
      </label>
    </section>
  );
}

function PanelTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="rj-panel-title">
      <img src={icon} alt="" />
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function StageInstructionPanel({
  stage,
  character,
  activeLevel,
  levelFeedback,
  onSelectLevel,
}: {
  stage: StageDef;
  character: CharacterProfile;
  activeLevel: number;
  levelFeedback: string;
  onSelectLevel: (level: number) => void;
}) {
  const stageIcon = getCommand(stage.icon);

  return (
    <section className="rj-panel rj-instruction-panel">
      <header className="rj-stage-heading">
        <img src={stageIcon.image} alt="" />
        <div>
          <h2>{stage.title}</h2>
          <p>{stage.subtitle}</p>
        </div>
      </header>

      <div className="rj-level-card">
        <div className="rj-level-title">
          <span className="notebook-icon" />
          <strong>Instruksi Lv {activeLevel}</strong>
        </div>
        <div className="rj-level-tabs" aria-label="Pilih level">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              type="button"
              className={level === activeLevel ? 'active' : ''}
              onClick={() => onSelectLevel(level)}
            >
              Lv {level}
            </button>
          ))}
        </div>
        {levelFeedback && <p className="rj-level-feedback">{levelFeedback}</p>}
      </div>

      <div className="rj-mission-copy">
        <strong>{stage.mission}</strong>
        <div className="rj-ali-tip">
          <img src={character.avatar} alt="" />
          <p>{stage.bubble}</p>
        </div>
      </div>

      <div className="rj-step-list" aria-label="Urutan instruksi">
        {stage.instructions.map((item, index) => {
          const command = getCommand(item.command);
          return (
            <div className="rj-step-row" key={`${item.command}-${index}`}>
              <span className={`rj-step-number ${index === 0 || item.command === 'finish' ? 'red' : ''}`}>{index + 1}</span>
              <span className="rj-mini-command" style={{ background: command.color }}>
                <img src={command.image} alt="" />
              </span>
              <strong>{item.label}</strong>
              <i />
            </div>
          );
        })}
      </div>

      <footer className="rj-tip-card">
        <span className="bulb-icon" />
        <p>{stage.bottomTip}</p>
      </footer>
    </section>
  );
}

function CommandPalette({
  stage,
  characterName,
  onAdd,
  onCommandSound,
}: {
  stage: StageDef;
  characterName: string;
  onAdd: (commandId: CommandId) => void;
  onCommandSound: () => void;
}) {
  return (
    <section className={`rj-panel rj-palette-panel stage-${stage.id}`}>
      <PanelTitle icon="/assets/rj/commands/cube.png" title="Kumpulan Perintah" subtitle="Pilih dan seret perintah ke bawah." />
      <div className="rj-command-grid">
        {stage.palette.map((commandId) => (
          <CommandTile key={commandId} commandId={commandId} characterName={characterName} onAdd={onAdd} onCommandSound={onCommandSound} />
        ))}
      </div>
    </section>
  );
}

function CommandTile({
  commandId,
  characterName,
  onAdd,
  onCommandSound,
}: {
  commandId: CommandId;
  characterName: string;
  onAdd: (commandId: CommandId) => void;
  onCommandSound: () => void;
}) {
  const command = getCommand(commandId);
  const label = withCharacterName(command.label, characterName);
  const shortLabel = command.shortLabel ? withCharacterName(command.shortLabel, characterName) : label;
  return (
    <button
      type="button"
      className="rj-command-tile"
      draggable
      onClick={() => {
        onCommandSound();
        onAdd(commandId);
      }}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData(DRAG_TYPE, commandId);
        event.dataTransfer.setData('text/plain', label);
      }}
      title={label}
    >
      <span className="rj-command-art" style={{ background: command.color }}>
        <img src={command.image} alt="" />
      </span>
    </button>
  );
}

function CommandTrain({
  stage,
  program,
  activeCommandIndex,
  characterName,
  onAdd,
  onRemove,
  onClear,
  onCommandSound,
}: {
  stage: StageDef;
  program: CommandId[];
  activeCommandIndex: number | null;
  characterName: string;
  onAdd: (commandId: CommandId, slotIndex?: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onCommandSound: () => void;
}) {
  const slots = Array.from({ length: stage.slots }, (_, index) => index);
  const slotColumnCount = Math.min(stage.slots, 5);

  return (
    <section className="rj-panel rj-train-panel">
      <div className="rj-train-title">
        <div>
          <div>
            <h2>Susunan Perintah</h2>
            <p>Tarik ikon perintah ke susunan di bawah ini.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onCommandSound();
            onClear();
          }}
          aria-label="Hapus semua perintah"
        >
          Hapus
        </button>
      </div>

      <div
        className="rj-train-board"
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes(DRAG_TYPE)) event.preventDefault();
        }}
        onDrop={(event) => {
          const commandId = event.dataTransfer.getData(DRAG_TYPE) as CommandId;
          if (!commandId) return;
          event.preventDefault();
          onCommandSound();
          onAdd(commandId, program.length);
        }}
      >
        <div className="rj-train-landscape">
          <div className="rj-train-slots" style={{ gridTemplateColumns: `repeat(${slotColumnCount}, minmax(0, 1fr))` }}>
            {slots.map((slotIndex) => {
              const commandId = program[slotIndex];
              const command = commandId ? getCommand(commandId) : null;
              const label = command ? withCharacterName(command.label, characterName) : '';
              const shortLabel = command ? (command.shortLabel ? withCharacterName(command.shortLabel, characterName) : label) : '';
              return (
                <div
                  className={`rj-train-slot ${command ? 'filled' : ''} ${activeCommandIndex === slotIndex ? 'active' : ''}`}
                  key={slotIndex}
                  onDragOver={(event) => {
                    if (event.dataTransfer.types.includes(DRAG_TYPE)) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    const dropped = event.dataTransfer.getData(DRAG_TYPE) as CommandId;
                    if (!dropped) return;
                    event.preventDefault();
                    onCommandSound();
                    onAdd(dropped, slotIndex);
                  }}
                  aria-label={`Kotak perintah ${slotIndex + 1}`}
                >
                  {command ? (
                    <button
                      type="button"
                      onClick={() => {
                        onCommandSound();
                        onRemove(slotIndex);
                      }}
                      title={`Hapus ${label}`}
                    >
                      <img src={command.image} alt="" />
                      <span>{shortLabel}</span>
                    </button>
                  ) : (
                    <strong>{slotIndex + 1}</strong>
                  )}
                </div>
              );
            })}
          </div>
          <div className="rj-rails" />
        </div>
      </div>
    </section>
  );
}

function QuoteCard({ stage }: { stage: StageDef }) {
  const icon = stage.id === 5 ? APPLE_ICON : stage.id === 6 ? GIFT_ICON : BOOK_ICON;
  return (
    <section className="rj-quote-card">
      <img src={icon} alt="" />
      <p>"{stage.quote}"</p>
      <strong>{stage.quoteSource}</strong>
    </section>
  );
}

function StoryStage({
  stage,
  scene,
  character,
}: {
  stage: StageDef;
  scene: SceneState;
  character: CharacterProfile;
}) {
  const fallbackCharacterImage = getStageCharacterImage(stage, scene, character);
  const visualAction = scene.poseAction || scene.action;
  const actionAnimation = useMemo(() => getActionAnimation(stage, visualAction, character), [stage, visualAction, character]);
  const [animationFrameIndex, setAnimationFrameIndex] = useState(0);
  const animationKey = actionAnimation ? `${stage.id}:${visualAction}:${character.id}:${actionAnimation.frames.join('|')}` : '';

  useEffect(() => {
    setAnimationFrameIndex(0);
    if (!actionAnimation || actionAnimation.frames.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setAnimationFrameIndex((current) => {
        const next = current + 1;
        if (next < actionAnimation.frames.length) return next;
        return actionAnimation.loop ? 0 : current;
      });
    }, actionAnimation.frameMs);

    return () => window.clearInterval(timer);
  }, [animationKey, actionAnimation]);

  const characterImage = actionAnimation
    ? actionAnimation.frames[Math.min(animationFrameIndex, actionAnimation.frames.length - 1)]
    : fallbackCharacterImage;
  const backdropImage = stage.id === 1 || stage.id === 2 ? STAGE_ONE_BACKDROP : DEFAULT_BACKDROP;
  const poseClass = fallbackCharacterImage === character.main ? 'pose-greeting' : fallbackCharacterImage === character.planting ? 'pose-planting' : 'pose-action';
  const frameClass = actionAnimation && actionAnimation.frames.length > 1 ? 'frame-sequence' : '';
  const showStageSigns = stage.id > 2;
  const showSeedChoices = stage.sceneType === 'seed-choice' && scene.action !== 'choose-apple-seed' && scene.selectedSeed !== 'seedBean';

  return (
    <div className={`rj-story-stage stage-${stage.id} action-${visualAction}`}>
      <img className="rj-stage-backdrop" src={backdropImage} alt="" />
      <div className="rj-sky">
        <span className="cloud c1" />
        <span className="cloud c2" />
        <span className={`scene-sun ${scene.action === 'sunlight' ? 'bright' : ''}`} />
      </div>
      <div className="rj-back-trees">
        <span />
        <span />
        <span />
      </div>
      <div className="rj-mosque" aria-hidden="true">
        <i />
        <i />
        <b />
      </div>
      {showSeedChoices && <SeedChoiceObjects selectedSeed={scene.selectedSeed} />}
      {showStageSigns && (
        <>
          <WoodSign className="left" text={stage.leftSign} />
          <WoodSign className="right" text={stage.rightSign} />
        </>
      )}
      
      <img
        className={`rj-scene-ali character-${character.id} ${poseClass} ${frameClass}`}
        src={characterImage}
        alt={character.name}
      />
      {scene.showBubble && <SpeechBubble text={scene.message} />}
      <LoopBadge stage={stage} scene={scene} />
    </div>
  );
}

function SeedChoiceObjects({ selectedSeed }: { selectedSeed?: CommandId }) {
  const seeds: CommandId[] = ['seedSunflower', 'seedBean', 'seedMango'];
  return (
    <div className="rj-seed-choice-row" aria-hidden="true">
      {seeds.map((seedId) => {
        const command = getCommand(seedId);
        return (
          <div className={`rj-seed-choice ${selectedSeed === seedId ? 'selected' : ''}`} key={seedId}>
            <img src={command.image} alt="" />
          </div>
        );
      })}
    </div>
  );
}

function WoodSign({ text, className }: { text: string; className: string }) {
  return (
    <div className={`rj-wood-sign ${className}`}>
      <span>{text}</span>
      <b />
    </div>
  );
}

function StageObjects({ stage, scene }: { stage: StageDef; scene: SceneState }) {
  if (stage.id === 1 || stage.id === 2) {
    return (
      <>
        <img className="rj-tool watering-prop" src={getCommand('wateringCan').image} alt="" />
        <div className="rj-seed-sack">
          BIJI<br />KEBAIKAN
          <span />
        </div>
        <img className={`rj-tool shovel ${scene.action === 'dig' ? 'swing' : ''}`} src={getCommand('dig').image} alt="" />
        <img className={`rj-tool seed ${scene.seedPlanted ? 'dropped' : ''}`} src={getCommand('seedSunflower').image} alt="" />
        <div className={`rj-hole ${scene.holeOpen ? 'open' : ''} ${scene.soilCovered ? 'covered' : ''}`} />
      </>
    );
  }

  if (stage.id === 3) {
    return (
      <div className="rj-choice-objects">
        <img className={`watering ${scene.wateringCanReady ? 'selected' : ''}`} src={getCommand('wateringCan').image} alt="" />
        <img className={`stone ${scene.selectedObject === 'stone' ? 'wrong' : ''}`} src={getCommand('stone').image} alt="" />
        <img className={`car ${scene.selectedObject === 'toyCar' ? 'wrong' : ''}`} src={getCommand('toyCar').image} alt="" />
      </div>
    );
  }

  if (stage.id === 4) {
    return (
      <div className="rj-care-tools">
        <img className={`care-water ${scene.action === 'water' ? 'active' : ''}`} src={getCommand('water').image} alt="" />
        <img className={`care-sun ${scene.action === 'sunlight' ? 'active' : ''}`} src={getCommand('sunlight').image} alt="" />
        <img className={`care-wait ${scene.action === 'wait' ? 'active' : ''}`} src={getCommand('wait').image} alt="" />
      </div>
    );
  }

  if (stage.id === 5) {
    return (
      <>
        <div className="rj-fruit-tree">
          <span className="green-fruit" />
          <span className={`ripe-fruit ${scene.action === 'choose-ripe-fruit' ? 'selected' : ''} ${scene.fruitInBasket ? 'picked' : ''}`} />
          <span className="ripe-fruit second" />
        </div>
        <div className={`rj-harvest-basket ${scene.fruitInBasket ? 'filled' : ''}`}>
          <span />
          <span />
          <span />
        </div>
      </>
    );
  }

  return (
    <div className="rj-share-scene">
      <div className={`rj-fruit-basket ${scene.fruitInBasket ? 'filled' : ''}`}>
        <span />
        <span />
        <span />
      </div>
      <div className={`rj-family-target ${scene.shareFamily ? 'received' : ''}`}>
        <img src={getCommand('shareFamily').image} alt="" />
        <strong>Keluarga</strong>
      </div>
      <div className={`rj-friend-target ${scene.shareFriend ? 'received' : ''}`}>
        <img src={getCommand('shareFriend').image} alt="" />
        <strong>Teman</strong>
      </div>
    </div>
  );
}

function PlantModel({ phase, ripe }: { phase: number; ripe?: boolean }) {
  return (
    <div className={`rj-plant-model phase-${phase} ${ripe ? 'ripe' : ''}`}>
      <div className="plant-shadow" />
      <div className="stem" />
      <span className="leaf left" />
      <span className="leaf right" />
      <span className="leaf top-left" />
      <span className="leaf top-right" />
      <span className="fruit f1" />
      <span className="fruit f2" />
      <span className="fruit f3" />
    </div>
  );
}

function WaterStream({ active }: { active: boolean }) {
  return (
    <div className={`rj-water-stream ${active ? 'active' : ''}`}>
      {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
    </div>
  );
}

function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="rj-scene-bubble">
      <p>{text}</p>
    </div>
  );
}

function LoopBadge({ stage, scene }: { stage: StageDef; scene: SceneState }) {
  if (stage.id !== 4 || scene.cycle < 1) return null;
  return (
    <div className="rj-loop-badge">
      <img src={getCommand('repeat3').image} alt="" />
      <strong>{scene.cycle}/3</strong>
    </div>
  );
}
