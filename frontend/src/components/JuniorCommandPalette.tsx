import type { JuniorCommand } from '../engine/commandTypes';
import type { PaletteCommandFromManifest } from '../types/stageAsset';
import type { StageManifest } from '../types/stageAsset';
import JuniorCommandBlock from './JuniorCommandBlock';
import UiIcon from './UiIcon';

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const DRAG_COMMAND_TYPE = 'application/x-junior-command';

function makeCommand(cmd: PaletteCommandFromManifest) {
  return { ...cmd, id: makeId() } as JuniorCommand;
}

type Props = {
  manifest: StageManifest;
  onAdd: (command: JuniorCommand) => void;
};

export default function JuniorCommandPalette({ manifest, onAdd }: Props) {
  return (
    <section className="palette-card pro-card">
      <div className="section-title"><span className="title-icon"><UiIcon name="star" /></span> Kumpulan Perintah</div>
      <div className="command-rack" aria-label="Kumpulan perintah">
        {manifest.commands.map((cmd) => {
          const command = { ...cmd, id: `${cmd.type}-${cmd.label}` } as JuniorCommand;
          return (
            <JuniorCommandBlock
              key={`${cmd.type}-${cmd.label}`}
              command={command}
              draggable
              onClick={() => onAdd(makeCommand(cmd))}
              onDragStart={(event) => {
                const draggedCommand = makeCommand(cmd);
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData(DRAG_COMMAND_TYPE, JSON.stringify(draggedCommand));
                event.dataTransfer.setData('text/plain', draggedCommand.label);
              }}
            />
          );
        })}
      </div>
      <div className="drag-hint">Tarik ikon perintah ke kereta perintah di bawah ini</div>
    </section>
  );
}
