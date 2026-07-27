import type { JuniorCommand } from '../engine/commandTypes';

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
  startPosition?: { x: number; y: number };
  displaySize?: { width: number; height: number };
  scale?: number;
};

export type StageObject = {
  id: string;
  name: string;
  file: string;
  position?: { x: number; y: number };
  displaySize?: { width: number; height: number };
  scale?: number;
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
  soundId?: string;
};

export type PaletteCommandFromManifest = Omit<JuniorCommand, 'id'>;

export type StageLevel = {
  id: string;
  title: string;
  label?: string;
  description?: string;
  maxCommands?: number;
  instructions: StageInstruction[];
  commands?: PaletteCommandFromManifest[];
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
};
