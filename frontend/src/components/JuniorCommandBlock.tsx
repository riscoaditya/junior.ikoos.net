import type { DragEventHandler } from 'react';
import type { CommandType, JuniorCommand } from '../engine/commandTypes';

type Props = {
  command: JuniorCommand;
  active?: boolean;
  compact?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: DragEventHandler<HTMLButtonElement>;
  onDragEnd?: DragEventHandler<HTMLButtonElement>;
  onRemove?: () => void;
};

export default function JuniorCommandBlock({ command, active, compact, draggable, onClick, onDragStart, onDragEnd, onRemove }: Props) {
  const value = 'value' in command ? command.value : undefined;

  return (
    <button
      type="button"
      className={`icon-command ${compact ? 'compact' : ''} ${active ? 'active' : ''}`}
      style={{ background: command.color }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={command.label}
      aria-label={command.label}
    >
      <span className="command-symbol"><CommandGlyph type={command.type} /></span>
      {value !== undefined && <span className="command-value">{value}</span>}
      {onRemove && <span className="remove-command" onClick={(e) => { e.stopPropagation(); onRemove(); }}>×</span>}
    </button>
  );
}

export function CommandGlyph({ type }: { type: CommandType }) {
  const common = {
    className: 'command-glyph',
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };

  switch (type) {
    case 'start':
      return (
        <svg {...common}>
          <path className="glyph-stroke" d="M13 39V9" />
          <path className="glyph-fill-red" d="M15 10h22l-5 8 5 8H15V10Z" />
          <path className="glyph-stroke" d="M15 10h22l-5 8 5 8H15" />
        </svg>
      );
    case 'moveRight':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M8 21h20v-8l13 11-13 11v-8H8v-6Z" />
          <path className="glyph-stroke" d="M8 21h20v-8l13 11-13 11v-8H8v-6Z" />
        </svg>
      );
    case 'moveLeft':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M40 21H20v-8L7 24l13 11v-8h20v-6Z" />
          <path className="glyph-stroke" d="M40 21H20v-8L7 24l13 11v-8h20v-6Z" />
        </svg>
      );
    case 'moveUp':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M21 40V20h-8L24 7l11 13h-8v20h-6Z" />
          <path className="glyph-stroke" d="M21 40V20h-8L24 7l11 13h-8v20h-6Z" />
        </svg>
      );
    case 'moveDown':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M21 8v20h-8l11 13 11-13h-8V8h-6Z" />
          <path className="glyph-stroke" d="M21 8v20h-8l11 13 11-13h-8V8h-6Z" />
        </svg>
      );
    case 'jump':
      return (
        <svg {...common}>
          <path className="glyph-stroke" d="M11 34c5-11 12-17 25-20" />
          <path className="glyph-stroke" d="M31 12h6v6M16 36h21" />
          <circle className="glyph-fill-white glyph-stroke" cx="21" cy="21" r="4" />
          <path className="glyph-stroke" d="M20 25 16 33M23 25l6 8M18 27l8 1" />
        </svg>
      );
    case 'turnRight':
      return (
        <svg {...common}>
          <path className="glyph-stroke" d="M15 30a12 12 0 1 0 2-14" />
          <path className="glyph-fill-white" d="m15 15 2 12-10-6 8-6Z" />
          <path className="glyph-stroke" d="m15 15 2 12-10-6 8-6Z" />
        </svg>
      );
    case 'turnLeft':
      return (
        <svg {...common}>
          <path className="glyph-stroke" d="M33 30a12 12 0 1 1-2-14" />
          <path className="glyph-fill-white" d="m33 15-2 12 10-6-8-6Z" />
          <path className="glyph-stroke" d="m33 15-2 12 10-6-8-6Z" />
        </svg>
      );
    case 'say':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M9 12h30v21H21l-8 6v-6H9V12Z" />
          <path className="glyph-stroke" d="M9 12h30v21H21l-8 6v-6H9V12Z" />
          <path className="glyph-stroke" d="M17 22h.1M24 22h.1M31 22h.1" />
        </svg>
      );
    case 'sound':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M8 20h8l10-8v24l-10-8H8v-8Z" />
          <path className="glyph-stroke" d="M8 20h8l10-8v24l-10-8H8v-8Z" />
          <path className="glyph-stroke" d="M31 19c2 3 2 7 0 10M36 15c4.2 5.6 4.2 12.4 0 18" />
        </svg>
      );
    case 'wait':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M15 8h18v8l-6 8 6 8v8H15v-8l6-8-6-8V8Z" />
          <path className="glyph-stroke" d="M15 8h18v8l-6 8 6 8v8H15v-8l6-8-6-8V8Z" />
          <path className="glyph-stroke" d="M18 12h12M18 36h12" />
        </svg>
      );
    case 'reset':
      return (
        <svg {...common}>
          <path className="glyph-stroke" d="M35 17A14 14 0 1 1 24 10" />
          <path className="glyph-fill-white" d="M33 8v12H21L33 8Z" />
          <path className="glyph-stroke" d="M33 8v12H21L33 8Z" />
        </svg>
      );
    default:
      return null;
  }
}
