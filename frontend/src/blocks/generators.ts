import * as Blockly from 'blockly';
import type { JuniorCommand } from '../engine/commandTypes';

function blockToCommand(block: Blockly.Block): JuniorCommand | null {
  switch (block.type) {
    case 'move_forward': return { type: 'move', steps: Number(block.getFieldValue('STEPS') || 50) };
    case 'jump_up': return { type: 'jump', height: Number(block.getFieldValue('HEIGHT') || 80) };
    case 'turn_right': return { type: 'turn', degrees: Number(block.getFieldValue('DEGREES') || 90) };
    case 'turn_left': return { type: 'turn', degrees: -Number(block.getFieldValue('DEGREES') || 90) };
    case 'say_text': return { type: 'say', text: String(block.getFieldValue('TEXT') || 'Halo!'), seconds: 2 };
    case 'play_sound': return { type: 'sound', soundId: String(block.getFieldValue('SOUND') || 'pop') };
    case 'change_background': return { type: 'background', backgroundId: String(block.getFieldValue('BACKGROUND') || 'masjid-ceria') };
    case 'change_costume': return { type: 'costume', characterId: String(block.getFieldValue('CHARACTER') || 'anak-muslim') };
    case 'wait_seconds': return { type: 'wait', seconds: Number(block.getFieldValue('SECONDS') || 1) };
    case 'repeat_times': {
      const firstChild = block.getInputTargetBlock('DO');
      return { type: 'repeat', times: Number(block.getFieldValue('TIMES') || 2), commands: firstChild ? chainToCommands(firstChild) : [] };
    }
    default: return null;
  }
}

function chainToCommands(startBlock: Blockly.Block): JuniorCommand[] {
  const commands: JuniorCommand[] = [];
  let current: Blockly.Block | null = startBlock;
  while (current) {
    if (current.type !== 'event_start') {
      const cmd = blockToCommand(current);
      if (cmd) commands.push(cmd);
    }
    current = current.getNextBlock();
  }
  return commands;
}

export function workspaceToCommands(workspace: Blockly.WorkspaceSvg): JuniorCommand[] {
  const topBlocks = workspace.getTopBlocks(true);
  const startBlock = topBlocks.find((b) => b.type === 'event_start') || topBlocks[0];
  if (!startBlock) return [];
  const first = startBlock.type === 'event_start' ? startBlock.getNextBlock() : startBlock;
  return first ? chainToCommands(first) : [];
}
