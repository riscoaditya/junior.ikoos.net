import { useState } from 'react';
import type { JuniorCommand } from '../engine/commandTypes';
import JuniorCommandBlock from './JuniorCommandBlock';
import UiIcon from './UiIcon';

const DRAG_COMMAND_TYPE = 'application/x-junior-command';

type Props = {
  commands: JuniorCommand[];
  activeCommandId: string | null;
  onRemove: (id: string) => void;
  onClear: () => void;
  onDropCommand: (command: JuniorCommand, slotIndex: number) => void;
};

function readDroppedCommand(dataTransfer: DataTransfer) {
  const raw = dataTransfer.getData(DRAG_COMMAND_TYPE);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as JuniorCommand;
  } catch {
    return null;
  }
}

export default function JuniorScriptArea({ commands, activeCommandId, onRemove, onClear, onDropCommand }: Props) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const slots = Array.from({ length: 5 });

  return (
    <section className="train-card pro-card">
      <div className="train-head">
        <div className="section-title"><span className="title-icon"><UiIcon name="train" /></span> Kereta Perintah</div>
        <button type="button" className="clear-btn" onClick={onClear}><UiIcon name="trash" /> Hapus Semua</button>
      </div>

      <div
        className={`train-track ${dragOverIndex === commands.length ? 'drop-target-track' : ''}`}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes(DRAG_COMMAND_TYPE)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          setDragOverIndex(commands.length);
        }}
        onDragLeave={() => setDragOverIndex(null)}
        onDrop={(event) => {
          const droppedCommand = readDroppedCommand(event.dataTransfer);
          if (!droppedCommand) return;
          event.preventDefault();
          setDragOverIndex(null);
          onDropCommand(droppedCommand, commands.length);
        }}
      >
        <div className="train-engine"><TrainIllustration /></div>
        <div className="train-slots">
          {slots.map((_, index) => {
            const command = commands[index];
            return (
              <div className="slot-wrap" key={index}>
                <div
                  className={`train-slot ${command ? 'filled' : ''} ${dragOverIndex === index ? 'drop-target' : ''}`}
                  onDragOver={(event) => {
                    if (!event.dataTransfer.types.includes(DRAG_COMMAND_TYPE)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = 'copy';
                    setDragOverIndex(index);
                  }}
                  onDragLeave={(event) => {
                    event.stopPropagation();
                    setDragOverIndex((current) => current === index ? null : current);
                  }}
                  onDrop={(event) => {
                    const droppedCommand = readDroppedCommand(event.dataTransfer);
                    if (!droppedCommand) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setDragOverIndex(null);
                    onDropCommand(droppedCommand, index);
                  }}
                  aria-label={`Slot perintah ${index + 1}`}
                >
                  {command ? (
                    <JuniorCommandBlock
                      command={command}
                      compact
                      active={activeCommandId === command.id}
                      onRemove={() => onRemove(command.id)}
                    />
                  ) : null}
                </div>
                {index < slots.length - 1 && <span className="slot-arrow">›</span>}
                <span className="slot-number">{index + 1}</span>
              </div>
            );
          })}
        </div>
        <div className="train-note"><UiIcon name="lightbulb" /> Susun perintah sesuai instruksi Stage 1 di atas, lalu tekan <b>Play</b> untuk melihat hasilnya.</div>
      </div>
    </section>
  );
}

function TrainIllustration() {
  return (
    <svg viewBox="0 0 112 86" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M29 22c0-7 5-12 12-12h19c7 0 12 5 12 12v8h17c6 0 10 4 10 10v21H18V36c0-6 5-11 11-11v-3Z" fill="#1d94ef" stroke="#063b7a" strokeWidth="3" />
      <path d="M23 61h76l-7 14H13l10-14Z" fill="#ffd347" stroke="#063b7a" strokeWidth="3" />
      <path d="M37 18h23v18H37V18ZM73 39h18v13H73V39Z" fill="#eaf7ff" stroke="#063b7a" strokeWidth="3" />
      <path d="M26 13h40v8H26v-8Z" fill="#ff4b3f" stroke="#063b7a" strokeWidth="3" />
      <circle cx="38" cy="65" r="10" fill="#ff8b22" stroke="#063b7a" strokeWidth="3" />
      <circle cx="72" cy="65" r="10" fill="#ff8b22" stroke="#063b7a" strokeWidth="3" />
      <circle cx="38" cy="65" r="4" fill="#063b7a" />
      <circle cx="72" cy="65" r="4" fill="#063b7a" />
      <path d="M19 19c-4-6 1-10 7-7M13 11c-4-5 1-9 6-7" stroke="#b8cce2" strokeWidth="6" strokeLinecap="round" />
      <path d="M50 47h8" stroke="#ffd347" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
