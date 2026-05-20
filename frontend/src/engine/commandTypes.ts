export type JuniorCommand =
  | { id: string; type: 'start'; icon: string; label: string; color: string }
  | { id: string; type: 'moveRight'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'moveLeft'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'moveUp'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'moveDown'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'turnRight'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'turnLeft'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'jump'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'say'; text: string; icon: string; label: string; color: string }
  | { id: string; type: 'sound'; soundId: string; icon: string; label: string; color: string }
  | { id: string; type: 'wait'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'reset'; icon: string; label: string; color: string };

export type CommandType = JuniorCommand['type'];
