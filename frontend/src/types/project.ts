import type { JuniorCommand } from '../engine/commandTypes';

export type JuniorProject = {
  id: string;
  title: string;
  characterId: string;
  backgroundId: string;
  blocksXml: string;
  commands: JuniorCommand[];
  updatedAt: string;
};
