import type { JuniorCommand, RepeatableJuniorCommand } from '../engine/commandTypes';

export type StageSummary = {
  id: string;
  title: string;
  manifest: string;
  thumbnail: string;
  status: 'active' | 'locked' | string;
  difficulty?: number;
};

export type StagesIndex = {
  defaultStageId: string;
  stages: StageSummary[];
};

export type StageBackground = {
  id: string;
  name: string;
  file: string;
  thumbnail?: string;
  completionOnly?: boolean;
  locked?: boolean;
  unlockRewardId?: string;
  /**
   * cover  = memenuhi panggung tanpa penyet, bagian tepi boleh terpotong sedikit.
   * contain = seluruh gambar terlihat tanpa penyet, bisa muncul ruang kosong/letterbox.
   */
  fit?: 'cover' | 'contain';
};

export type StageCharacter = {
  id: string;
  name: string;
  file: string;
  thumbnail?: string;
  instructionAvatar?: string;
  startPosition?: { x: number; y: number };
  displaySize?: { width: number; height: number };
  scale?: number;
};

export type StageObject = {
  id: string;
  name: string;
  file: string;
  kind?: 'collectible' | 'target' | 'checkpoint' | 'obstacle' | 'npc' | 'choice' | 'decoration' | 'reward';
  position?: { x: number; y: number };
  displaySize?: { width: number; height: number };
  scale?: number;
  depth?: number;
  interactionRadius?: number;
  targetId?: string;
  correct?: boolean;
  label?: string;
  pickupText?: string;
  dropText?: string;
  choiceText?: string;
  successText?: string;
  locked?: boolean;
  showHalo?: boolean;
};

export type StageSound = {
  id: string;
  name: string;
  file: string;
};

export type StageInstruction = {
  order: number;
  command: JuniorCommand['type'];
  label: string;
  icon: string;
  value?: number;
  text?: string;
  targetText?: string;
  objectId?: string;
  targetId?: string;
  choiceId?: string;
  times?: number;
  repeatCommand?: RepeatableJuniorCommand;
  duration?: number;
  promptText?: string;
  soundId?: string;
  hideValue?: boolean;
};

export type PaletteCommandFromManifest = Omit<JuniorCommand, 'id'>;

export type StageReward = {
  stars?: number;
  badgeId?: string;
  badgeTitle?: string;
  badgeText?: string;
  unlockId?: string;
  unlockTitle?: string;
};

export type StageRoutePoint = {
  x: number;
  y: number;
  actorPosition?: { x: number; y: number };
  kind?: 'start' | 'path' | 'goal';
  hint?: JuniorCommand['type'];
  hintColor?: string;
};

export type StageRoute = {
  points: StageRoutePoint[];
  actorFootOffset?: number;
  tileSize?: { width: number; height: number };
  missionTitle?: string;
  startLabel?: string;
  goalLabel?: string;
};

export type StageLevel = {
  id: string;
  title: string;
  label?: string;
  description?: string;
  maxCommands?: number;
  instructions: StageInstruction[];
  commands?: PaletteCommandFromManifest[];
  objects?: StageObject[];
  instructionMode?: 'list' | 'visual-route';
  route?: StageRoute;
  startBackgroundId?: string;
  completionBackgroundId?: string;
  completionMessage?: string;
  reward?: StageReward;
};

export type StageManifest = {
  id: string;
  /** Ukuran panggung virtual. Pakai 16:9 agar background 1280x720 tidak penyet. */
  stageSize?: { width: number; height: number; aspectRatio?: string };
  title: string;
  description?: string;
  thumbnail?: string;
  status?: string;
  difficulty?: number;
  maxCommands?: number;
  ui?: {
    stageLabel?: string;
    tip?: string;
    theme?: string;
  };
  backgrounds: StageBackground[];
  characters: StageCharacter[];
  objects?: StageObject[];
  sounds?: StageSound[];
  levels?: StageLevel[];
  instructions: StageInstruction[];
  commands: PaletteCommandFromManifest[];
  reward?: StageReward;
};
