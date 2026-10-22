export type JuniorCommand =
  | { id: string; type: 'start'; icon: string; label: string; color: string }
  | { id: string; type: 'moveRight'; value: number; hideValue?: boolean; icon: string; label: string; color: string }
  | { id: string; type: 'moveLeft'; value: number; hideValue?: boolean; icon: string; label: string; color: string }
  | { id: string; type: 'moveUp'; value: number; hideValue?: boolean; icon: string; label: string; color: string }
  | { id: string; type: 'moveDown'; value: number; hideValue?: boolean; icon: string; label: string; color: string }
  | { id: string; type: 'turnRight'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'turnLeft'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'jump'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'say'; text: string; icon: string; label: string; color: string }
  | { id: string; type: 'recordVoice'; targetText: string; duration?: number; recordingUrl?: string; recordingSize?: number; mimeType?: string; recordedAt?: string; icon: string; label: string; color: string }
  | { id: string; type: 'writeMessage'; message: string; promptText?: string; icon: string; label: string; color: string }
  | { id: string; type: 'sound'; soundId: string; icon: string; label: string; color: string }
  | { id: string; type: 'wait'; value: number; icon: string; label: string; color: string }
  | { id: string; type: 'pick'; objectId?: string; icon: string; label: string; color: string }
  | { id: string; type: 'drop'; targetId?: string; icon: string; label: string; color: string }
  | { id: string; type: 'choice'; choiceId: string; text: string; correct?: boolean; icon: string; label: string; color: string }
  | { id: string; type: 'repeat'; times: number; repeatCommand: RepeatableJuniorCommand; icon: string; label: string; color: string }
  | { id: string; type: 'reset'; icon: string; label: string; color: string };

export type RepeatableJuniorCommand =
  | { type: 'moveRight'; value: number }
  | { type: 'moveLeft'; value: number }
  | { type: 'moveUp'; value: number }
  | { type: 'moveDown'; value: number }
  | { type: 'turnRight'; value: number }
  | { type: 'turnLeft'; value: number }
  | { type: 'jump'; value: number }
  | { type: 'say'; text: string }
  | { type: 'sound'; soundId: string }
  | { type: 'wait'; value: number }
  | { type: 'pick'; objectId?: string }
  | { type: 'drop'; targetId?: string }
  | { type: 'choice'; choiceId: string; text: string; correct?: boolean }
  | { type: 'reset' };

export type CommandType = JuniorCommand['type'];
