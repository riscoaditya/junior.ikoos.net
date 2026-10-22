import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
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
  embedded?: boolean;
  slotCount?: number;
  instructionLabel?: string;
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

function clampColumns(value: number, max: number) {
  return Math.max(1, Math.min(max, value));
}

function getBalancedColumns(slotCount: number, fitColumns: number) {
  const maxColumns = clampColumns(fitColumns, Math.min(5, slotCount));
  let bestColumns = maxColumns;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let candidate = maxColumns; candidate >= 1; candidate -= 1) {
    const rows = Math.ceil(slotCount / candidate);
    const lastRowCount = slotCount % candidate || candidate;
    const orphanPenalty = rows > 1 && lastRowCount === 1 ? 100 : 0;
    const imbalancePenalty = rows > 1 ? (candidate - lastRowCount) * 3 : 0;
    const compactPenalty = (maxColumns - candidate) * 2;
    const score = orphanPenalty + imbalancePenalty + compactPenalty + rows * 10;

    if (score < bestScore) {
      bestColumns = candidate;
      bestScore = score;
    }
  }

  return bestColumns;
}

export default function JuniorScriptArea({
  commands,
  activeCommandId,
  onRemove,
  onClear,
  onDropCommand,
  embedded = false,
  slotCount = 5,
  instructionLabel = 'stage ini',
}: Props) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [columns, setColumns] = useState(5);
  const slotsRef = useRef<HTMLDivElement | null>(null);
  const totalSlots = Math.max(1, slotCount, commands.length);
  const slotIndexes = useMemo(() => Array.from({ length: totalSlots }, (_, index) => index), [totalSlots]);
  const slotGridStyle = { '--train-columns': columns } as CSSProperties;

  useEffect(() => {
    const node = slotsRef.current;
    if (!node) return;

    const updateColumns = () => {
      const slotMinWidth = embedded ? 48 : 96;
      const fitColumns = Math.floor(node.clientWidth / slotMinWidth);
      const nextColumns = getBalancedColumns(totalSlots, fitColumns);
      setColumns(nextColumns);
    };

    updateColumns();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateColumns);
      return () => window.removeEventListener('resize', updateColumns);
    }

    const observer = new ResizeObserver(updateColumns);
    observer.observe(node);
    return () => observer.disconnect();
  }, [embedded, totalSlots]);

  return (
    <section className={`train-card ${embedded ? 'embedded' : 'pro-card'}`}>
      <div className="train-head">
        {!embedded && <div className="section-title"><span className="title-icon"><UiIcon name="train" /></span> Kereta Perintah</div>}
        <button type="button" className={`clear-btn ${embedded ? 'compact' : ''}`} onClick={onClear}><UiIcon name="trash" /> Hapus Semua</button>
      </div>

      <div className="train-board">
        <div className="train-engine"><TrainIllustration /></div>

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
          {embedded && <div className="train-inline-hint">Tarik ikon perintah ke kereta perintah di bawah ini.</div>}
          <div className="train-slots" ref={slotsRef} style={slotGridStyle}>
            {slotIndexes.map((index) => {
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
                    ) : (
                      <span className="slot-number">{index + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {!embedded && <div className="train-note"><UiIcon name="lightbulb" /> Susun perintah sesuai instruksi {instructionLabel}, lalu tekan <b>Play</b>.</div>}
        </div>
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
