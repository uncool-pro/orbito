/** Line icons on a 24px grid, 1.8px stroke, coloured by the surrounding text colour. Add new ones here, in the same style. */
const paths = {
  home: 'M4 11l8-7 8 7v9H4zM10 20v-6h4v6',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 4 4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12l2-1-1-3-2 .4-1.4-1.4.4-2-3-1-1 2h-2l-1-2-3 1 .4 2L5.6 7.4 3.6 7l-1 3 2 1v2l-2 1 1 3 2-.4 1.4 1.4-.4 2 3 1 1-2h2l1 2 3-1-.4-2 1.4-1.4 2 .4 1-3-2-1z',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  menu: 'M4 7h16M4 12h16M4 17h16',
  filter: 'M4 6h16M7 12h10M10 18h4',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  calendar: 'M4 7h16v13H4zM4 11h16M8 3v4M16 3v4',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 8h.01',
  alert: 'M12 4 3 20h18zM12 10v4M12 17h.01',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z',
  star: 'M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2 8 13.7 4 9.8 9.5 9z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
} as const;

export type IconName = keyof typeof paths;
export const ICON_NAMES = Object.keys(paths) as IconName[];

export const Icon = ({ name, size = 24, label }: { name: IconName; size?: number; label?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    style={{ flex: 'none' }}
  >
    <path d={paths[name]} />
  </svg>
);
