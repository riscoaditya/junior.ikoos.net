type IconName =
  | 'book'
  | 'chevron'
  | 'check'
  | 'clapper'
  | 'folder'
  | 'image'
  | 'lightbulb'
  | 'lock'
  | 'play'
  | 'save'
  | 'spark'
  | 'stage'
  | 'star'
  | 'stop'
  | 'text'
  | 'train'
  | 'trash'
  | 'user';

type Props = {
  name: IconName;
  className?: string;
};

export default function UiIcon({ name, className }: Props) {
  const common = {
    className: `ui-icon ${className || ''}`.trim(),
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };

  switch (name) {
    case 'book':
      return (
        <svg {...common}>
          <path d="M6 4.5h10.5A1.5 1.5 0 0 1 18 6v14H7.5A2.5 2.5 0 0 1 5 17.5V6.5A2 2 0 0 1 7 4.5Z" />
          <path d="M8 8h7M8 11h6M7.5 17.5H18" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m7 10 5 5 5-5" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4 4 10-10" />
        </svg>
      );
    case 'clapper':
      return (
        <svg {...common}>
          <path d="M4 9h16v9.5A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5V9Z" />
          <path d="M4.5 9 6 4l3.2.8L7.8 9M10.4 9l1.4-3.5 3.2.8L13.4 9M16 9l1.1-2.6 2.4.6" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...common}>
          <path d="M3.5 8.5h6l1.8 2h9.2l-1.7 8H4.2L3.5 8.5Z" />
          <path d="M4 8.5V6.8A1.8 1.8 0 0 1 5.8 5h4.4l1.8 2h5.5A1.5 1.5 0 0 1 19 8.5" />
        </svg>
      );
    case 'image':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="m5 16 4.5-4.5 3 3L14 13l5 5M8 8.5h.1" />
        </svg>
      );
    case 'lightbulb':
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M8 14.5c-1.3-1-2-2.6-2-4.2A6 6 0 0 1 12 4a6 6 0 0 1 6 6.3c0 1.6-.7 3.2-2 4.2-.7.5-1 1.2-1 2H9c0-.8-.3-1.5-1-2Z" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V8a4 4 0 0 1 8 0v2M12 14v3" />
        </svg>
      );
    case 'play':
      return (
        <svg {...common}>
          <path d="M8 5.5v13l11-6.5-11-6.5Z" />
        </svg>
      );
    case 'save':
      return (
        <svg {...common}>
          <path d="M5 4h12l2 2v14H5V4Z" />
          <path d="M8 4v6h8V4M8 16h8" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />
        </svg>
      );
    case 'stage':
      return (
        <svg {...common}>
          <path d="M4 18h16M6 15h12V6H6v9Z" />
          <path d="m8 15 2-4 2 2 2-3 2 5" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
      );
    case 'stop':
      return (
        <svg {...common}>
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
      );
    case 'text':
      return (
        <svg {...common}>
          <path d="M5 6h14M12 6v12M8.5 18h7" />
        </svg>
      );
    case 'train':
      return (
        <svg {...common}>
          <path d="M6 5h9.5A2.5 2.5 0 0 1 18 7.5V15H6V5Z" />
          <path d="M8 8h3M14 8h2M4 15h16M7 19h2M15 19h2M9 15l-2 4M15 15l2 4" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M5 7h14M10 11v6M14 11v6M8 7l1-3h6l1 3M7 7l1 13h8l1-13" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 21a7.5 7.5 0 0 1 15 0" />
        </svg>
      );
    default:
      return null;
  }
}
