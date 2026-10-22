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
  const hideValue = 'hideValue' in command && command.hideValue;
  const value = hideValue ? undefined : (command.type === 'repeat' ? command.times : ('value' in command ? command.value : undefined));

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
      <span className="command-symbol"><CommandGlyph type={command.type} icon={command.icon} /></span>
      {value !== undefined && <span className="command-value">{value}</span>}
      {onRemove && <span className="remove-command" onClick={(e) => { e.stopPropagation(); onRemove(); }}>×</span>}
    </button>
  );
}

export function CommandGlyph({ type, icon }: { type: CommandType; icon?: string }) {
  const common = {
    className: 'command-glyph',
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };

  switch (icon) {
    case 'pick-pencil-1':
    case 'pick-pencil-2':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="m10 33 5-13L32 7l9 9-17 13-14 4Z" />
          <path className="glyph-stroke" d="m15 20 9 9M32 7l-3 7 7 7 5-5" />
          <circle className="glyph-fill-white glyph-stroke" cx="12" cy="36" r="8" />
          <path className="glyph-stroke" d={icon === 'pick-pencil-1' ? 'M12 32v8' : 'M9 33c1-2 6-2 6 1 0 2-5 3-6 6h6'} />
        </svg>
      );
    case 'pick-pencil':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="m9 35 4-12L31 7l10 10-18 16-14 2Z" />
          <path className="glyph-stroke" d="m13 23 10 10M31 7l-3 8 6 6 7-4M8 40h24" />
        </svg>
      );
    case 'drop-pencil-cup':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M12 27h24l-3 13H15l-3-13Z" />
          <path className="glyph-stroke" d="m16 24 5-15M24 24V8M31 24l3-15M21 17h6" />
          <path className="glyph-fill-white glyph-stroke" d="m21 18 3 5 3-5" />
        </svg>
      );
    case 'drop-pencil-return':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="m13 30 4-10L31 8l8 8-14 12-12 2Z" />
          <path className="glyph-stroke" d="m17 20 8 8M9 38c5-5 11-7 20-6" />
          <path className="glyph-fill-white glyph-stroke" d="m10 31-2 8 8-2" />
        </svg>
      );
    case 'pick-book-fallen':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="m10 28 7-15 23 7-7 15-23-7Z" />
          <path className="glyph-stroke" d="m17 13 3 15M10 34h24M24 40V29" />
          <path className="glyph-fill-white glyph-stroke" d="m18 34 6-7 6 7" />
        </svg>
      );
    case 'pick-book-gift':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M13 10h22v24H13V10Z" />
          <path className="glyph-stroke" d="M18 10v24M10 40c4-5 9-6 14-2 5-4 10-3 14 2M24 34v5" />
        </svg>
      );
    case 'drop-book-shelf':
      return (
        <svg {...common}>
          <path className="glyph-stroke" d="M8 38h32M10 25h28v13H10V25Z" />
          <path className="glyph-fill-white glyph-stroke" d="M17 8h14v13H17V8Z" />
          <path className="glyph-stroke" d="M24 7v15" />
          <path className="glyph-fill-white glyph-stroke" d="m19 17 5 6 5-6" />
        </svg>
      );
    case 'choice-tolong':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M8 11h32v24H25l-8 6v-6H8V11Z" />
          <path className="glyph-stroke" d="M17 27v-8M13 23h8M27 25c2-5 8-5 10 0-1 4-5 6-5 6s-4-2-5-6Z" />
        </svg>
      );
    case 'choice-maaf':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M8 11h32v24H25l-8 6v-6H8V11Z" />
          <path className="glyph-stroke" d="M15 23c0-7 9-8 10-2 1-6 10-5 10 2 0 6-10 10-10 10S15 29 15 23ZM25 18l-3 5 5 3-4 5" />
        </svg>
      );
    case 'choice-thanks':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M8 11h32v24H25l-8 6v-6H8V11Z" />
          <path className="glyph-fill-white glyph-stroke" d="m24 16 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" />
        </svg>
      );
    case 'choice-wrong':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M8 11h32v24H25l-8 6v-6H8V11Z" />
          <path className="glyph-stroke" d="m17 18 14 12M31 18 17 30" />
        </svg>
      );
    case 'mic-tolong':
    case 'mic-maaf':
    case 'mic-thanks':
      return (
        <svg {...common}>
          <rect className="glyph-fill-white glyph-stroke" x="11" y="8" width="12" height="21" rx="6" />
          <path className="glyph-stroke" d="M7 22c0 7 4 11 10 11s10-4 10-11M17 33v7M12 40h10" />
          {icon === 'mic-tolong' && <path className="glyph-fill-white glyph-stroke" d="M31 19v-5M28.5 16.5h5M30 24c2-4 7-4 9 0-1 4-4.5 6-4.5 6S31 28 30 24Z" />}
          {icon === 'mic-maaf' && <path className="glyph-fill-white glyph-stroke" d="M29 18c0-6 7-7 9-2 2-5 9-4 9 2 0 6-9 10-9 10s-9-4-9-10Z" transform="translate(-3 4) scale(.88)" />}
          {icon === 'mic-thanks' && <path className="glyph-fill-white glyph-stroke" d="m35 13 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L35 13Z" />}
        </svg>
      );
    case 'wudhu-tangan':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M24 6c5 7 7 10 7 14a7 7 0 0 1-14 0c0-4 2-7 7-14Z" />
          <path className="glyph-fill-white glyph-stroke" d="m8 31 5-6 8 7 6-7 13 9-6 8H15l-7-11Z" />
          <path className="glyph-stroke" d="m14 28 7 7m6-7-5 8m9-6-5 8" />
        </svg>
      );
    case 'wudhu-kumur':
      return (
        <svg {...common}>
          <circle className="glyph-fill-white glyph-stroke" cx="24" cy="23" r="14" />
          <path className="glyph-stroke" d="M17 19h.1M31 19h.1M19 28c3 2 7 2 10 0M13 37c3-6 8-8 15-5" />
          <path className="glyph-fill-white glyph-stroke" d="M28 33c4-5 9-4 11 1-2 4-6 6-11 5" />
          <path className="glyph-stroke" d="M19 26h10" />
        </svg>
      );
    case 'wudhu-hidung':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M14 9c13-3 23 4 23 16 0 9-6 15-15 15-8 0-13-6-13-14 0-6 2-12 5-17Z" />
          <path className="glyph-stroke" d="M22 16c4 1 5 5 3 9l-3 5c3 2 6 2 9 0M15 21h.1M32 21h.1" />
          <path className="glyph-fill-white glyph-stroke" d="M32 8c4 5 5 7 5 10a5 5 0 0 1-10 0c0-3 1-5 5-10Z" />
        </svg>
      );
    case 'wudhu-wajah':
      return (
        <svg {...common}>
          <ellipse className="glyph-fill-white glyph-stroke" cx="24" cy="24" rx="12" ry="15" />
          <path className="glyph-stroke" d="M19 21h.1M29 21h.1M20 29c3 2 5 2 8 0M10 18c-5 5-5 13 1 18M38 18c5 5 5 13-1 18" />
          <path className="glyph-fill-white glyph-stroke" d="M9 21c4 2 6 7 5 13l-5 3c-4-5-4-11 0-16Zm30 0c-4 2-6 7-5 13l5 3c4-5 4-11 0-16Z" />
        </svg>
      );
    case 'wudhu-lengan':
    case 'wudhu-lengan-kanan':
    case 'wudhu-lengan-kiri':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M8 28c8-4 14-9 20-16l8 7c-5 8-11 14-19 21H9l-1-12Z" />
          <path className="glyph-stroke" d="m17 28 9 8M29 15l7 7M17 39c5-6 10-11 16-16" />
          <path className="glyph-fill-white glyph-stroke" d="M38 6c3 5 5 7 5 10a5 5 0 0 1-10 0c0-3 2-5 5-10Z" />
          {icon === 'wudhu-lengan-kanan' && <path className="glyph-fill-white glyph-stroke" d="m31 38 8 4-8 4v-3h-7v-3h7v-2Z" />}
          {icon === 'wudhu-lengan-kiri' && <path className="glyph-fill-white glyph-stroke" d="m17 38-8 4 8 4v-3h7v-3h-7v-2Z" />}
        </svg>
      );
    case 'wudhu-kepala':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M10 29c0-11 6-18 14-18s14 7 14 18v8H10v-8Z" />
          <path className="glyph-stroke" d="M12 26c7-6 17-8 25-3M9 18c5-7 12-11 21-10M7 18l3 1 1-4M39 15l2 4-4 1" />
          <path className="glyph-fill-white glyph-stroke" d="M8 10h7v8H8zM33 10h7v8h-7z" />
        </svg>
      );
    case 'wudhu-telinga':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M10 12c-7 5-5 20 3 23 5 2 8-2 6-7-2-4-1-8 3-10-1-7-7-10-12-6Zm28 0c7 5 5 20-3 23-5 2-8-2-6-7 2-4 1-8-3-10 1-7 7-10 12-6Z" />
          <path className="glyph-stroke" d="M12 19c4 2 5 7 2 11M36 19c-4 2-5 7-2 11M15 39V25M33 39V25" />
          <circle className="glyph-fill-white glyph-stroke" cx="15" cy="40" r="3" />
          <circle className="glyph-fill-white glyph-stroke" cx="33" cy="40" r="3" />
        </svg>
      );
    case 'wudhu-kaki':
    case 'wudhu-kaki-kanan':
    case 'wudhu-kaki-kiri':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M17 9c4 8 4 14 1 20-2 4-1 9 4 11 7 3 17 0 20-5 2-4-1-7-5-6l-7 2c-2-8-3-15-3-22H17Z" />
          <path className="glyph-stroke" d="M29 31c3 2 7 3 11 2M17 15h11" />
          <path className="glyph-fill-white glyph-stroke" d="M9 8c4 6 5 8 5 11a6 6 0 0 1-12 0c0-3 2-5 7-11Z" />
          {icon === 'wudhu-kaki-kanan' && <path className="glyph-fill-white glyph-stroke" d="m31 39 8 4-8 4v-3h-7v-3h7v-2Z" />}
          {icon === 'wudhu-kaki-kiri' && <path className="glyph-fill-white glyph-stroke" d="m17 39-8 4 8 4v-3h7v-3h-7v-2Z" />}
        </svg>
      );
    default:
      break;
  }

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
    case 'recordVoice':
      return (
        <svg {...common}>
          <rect className="glyph-fill-white glyph-stroke" x="17" y="8" width="14" height="22" rx="7" />
          <path className="glyph-stroke" d="M12 22c0 7 5 12 12 12s12-5 12-12M24 34v6M18 40h12" />
          <path className="glyph-stroke" d="M19 17h10M19 22h10" />
        </svg>
      );
    case 'writeMessage':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M10 10h25v28H10V10Z" />
          <path className="glyph-stroke" d="M10 10h25v28H10V10Z" />
          <path className="glyph-stroke" d="M16 18h13M16 25h11M16 32h8" />
          <path className="glyph-fill-white" d="m30 33 8-8 4 4-8 8-6 2 2-6Z" />
          <path className="glyph-stroke" d="m30 33 8-8 4 4-8 8-6 2 2-6Z" />
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
    case 'pick':
      return (
        <svg {...common}>
          <path className="glyph-stroke" d="M12 25v-4c0-5 4-9 9-9h2" />
          <path className="glyph-fill-white" d="M27 9h11v11H27V9Z" />
          <path className="glyph-stroke" d="M27 9h11v11H27V9Z" />
          <path className="glyph-stroke" d="M10 27h18l-3 12H13l-3-12Z" />
          <path className="glyph-stroke" d="M14 31h10" />
        </svg>
      );
    case 'drop':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M10 10h14v14H10V10Z" />
          <path className="glyph-stroke" d="M10 10h14v14H10V10Z" />
          <path className="glyph-stroke" d="M31 10v21" />
          <path className="glyph-fill-white" d="M25 29h12l-6 9-6-9Z" />
          <path className="glyph-stroke" d="M25 29h12l-6 9-6-9Z" />
          <path className="glyph-stroke" d="M12 37h24" />
        </svg>
      );
    case 'choice':
      return (
        <svg {...common}>
          <path className="glyph-fill-white" d="M9 12h30v22H9V12Z" />
          <path className="glyph-stroke" d="M9 12h30v22H9V12Z" />
          <path className="glyph-stroke" d="m15 23 5 5 13-13" />
          <path className="glyph-stroke" d="M15 38h18" />
        </svg>
      );
    case 'wudhu':
      return (
        <svg {...common}>
          <path className="glyph-fill-white glyph-stroke" d="M24 6c7 9 10 14 10 20a10 10 0 0 1-20 0c0-6 3-11 10-20Z" />
          <path className="glyph-stroke" d="m18 27 4 4 8-10" />
        </svg>
      );
    case 'repeat':
      return (
        <svg {...common}>
          <path className="glyph-stroke" d="M35 16a14 14 0 0 0-22 3" />
          <path className="glyph-fill-white" d="m36 8 1 12-11-5 10-7Z" />
          <path className="glyph-stroke" d="m36 8 1 12-11-5 10-7Z" />
          <path className="glyph-stroke" d="M13 32a14 14 0 0 0 22-3" />
          <path className="glyph-fill-white" d="m12 40-1-12 11 5-10 7Z" />
          <path className="glyph-stroke" d="m12 40-1-12 11 5-10 7Z" />
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
