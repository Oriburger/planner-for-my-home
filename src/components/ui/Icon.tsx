import type { ReactNode } from 'react';

/**
 * 단순한 선(stroke) 아이콘 세트. 24×24 그리드, currentColor 사용.
 * 이모지 대신 이 아이콘만 써서 형태 언어를 통일한다.
 */
const PATHS = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  timeline: (
    <>
      <path d="M3 12h1.5M8.5 12h1.5M14 12h1.5M19.5 12H21" />
      <circle cx="6.5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="17.5" cy="12" r="2" />
    </>
  ),
  chart: <path d="M4 20h16M7 16v-4M12 16V7M17 16v-7" />,
  trend: <path d="M4 4v16h16M8 14l3.5-3.5 3 3L19 8" />,
  table: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="M20.5 15.5 16 11l-9 8.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1" />
    </>
  ),
  moon: <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />,
  sparkle: (
    <>
      <path d="M11 4l1.6 4.4L17 10l-4.4 1.6L11 16l-1.6-4.4L5 10l4.4-1.6L11 4Z" />
      <path d="M18 15v4M16 17h4" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.25" />
      <circle cx="12" cy="12" r="1.25" />
      <circle cx="18.5" cy="12" r="1.25" />
    </>
  ),
  panel: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </>
  ),
  trash: <path d="M4.5 7h15M10 11v5.5M14 11v5.5M6.5 7l.8 11.2a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8L17.5 7M9.5 7V4.5h5V7" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="5.5" width="17" height="14" rx="2.5" />
      <path d="M3.5 10h17M15.5 15h2" />
    </>
  ),
  banknote: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  home: <path d="M3.5 10.5 12 3.5l8.5 7M5.5 9v11h13V9M10 20v-5.5h4V20" />,
  landmark: <path d="M3.5 8.5 12 4l8.5 4.5M5.5 11v6.5M10 11v6.5M14 11v6.5M18.5 11v6.5M3.5 20.5h17" />,
  receipt: <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17ZM9 8.5h6M9 12.5h6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.75" />
    </>
  ),
  flag: <path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11" />,
  flow: <path d="M4 7.5h13M14 4.5l3 3-3 3M20 16.5H7M10 13.5l-3 3 3 3" />,
  upload: <path d="M12 15V4.5M7.5 9 12 4.5 16.5 9M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  reset: <path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L19.5 9M19.5 4.5V9H15M19.5 12a7.5 7.5 0 0 1-13 5.1L4.5 15M4.5 19.5V15H9" />,
  alert: <path d="M12 4.5 20.5 19.5h-17L12 4.5ZM12 10v4M12 17h.01" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = 'h-[18px] w-[18px]',
  strokeWidth = 1.75,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
