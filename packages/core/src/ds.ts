/**
 * Design system model: tokens (the single source of every value), component docs written next to the components,
 * and the report of the design-system check (`orbito check ds`), which the catalog in the viewer shows too.
 */

/** One design token. `name` becomes the CSS variable `--<name>`. */
export type Token = {
  name: string;
  value: string;
  /** When and where to use it. Every token needs one: it is how people and agents pick the right token. */
  usage?: string;
  /** Colour tokens used as text or icons: the background tokens they sit on (checked for contrast). */
  on?: string[];
  /** Large text (24px+ or 18.66px+ bold) only needs 3:1 instead of 4.5:1. */
  large?: boolean;
};

/**
 * `design-system/tokens.json`: groups of tokens. Known groups get their own preview in the catalog
 * (`color`, `font`, `type`, `space`, `radius`, `shadow`, `motion`); any other group is listed as values.
 */
export type TokenFile = Record<string, Token[]>;

export const TOKEN_GROUPS = ['color', 'font', 'type', 'space', 'radius', 'shadow', 'motion'] as const;

/** CSS custom properties for every token, in file order. */
export const tokensToCss = (tokens: TokenFile): string =>
  `:root {\n${Object.values(tokens)
    .flat()
    .map((t) => `  --${t.name}: ${t.value};`)
    .join('\n')}\n}\n`;

/** Atomic design levels, lowest first. A component may only build on its own level or lower ones. */
export const DS_LEVELS = ['atoms', 'molecules', 'organisms', 'templates'] as const;
export type DsLevel = (typeof DS_LEVELS)[number];

/** One example rendering of a component in the catalog. */
export type Variant<R = unknown> = {
  name: string;
  /** Returns the element to show, e.g. `() => <Button variant="secondary">Edit</Button>`. */
  render: () => R;
  /** What this variant is for, when it is not obvious from the name. */
  note?: string;
  /** Width of the preview box in px (default: fits the content). Use the viewport width for full-width organisms. */
  width?: number;
  /** Background token behind the preview (default `color-bg` if it exists). */
  background?: string;
};

/** `<Component>.docs.tsx` next to a component: what it is for, how to use it, and its variants. */
export type ComponentDocs<R = unknown> = {
  /** Exported name of the component, e.g. `Button`. */
  component: string;
  description: string;
  guidelines?: { do?: string[]; dont?: string[] };
  variants: Variant<R>[];
};

export const defineDocs = <R>(docs: ComponentDocs<R>): ComponentDocs<R> => docs;

// ---- check report

export type DsRule =
  | 'raw-color'
  | 'ds-exception'
  | 'raw-font'
  | 'raw-spacing'
  | 'unknown-token'
  | 'token-usage'
  | 'contrast'
  | 'raw-interactive'
  | 'import-boundary'
  | 'deep-import'
  | 'level-order'
  | 'undocumented'
  | 'no-variants'
  | 'unused'
  | 'duplicate-name';

export type DsIssue = {
  rule: DsRule;
  severity: 'error' | 'warning' | 'info';
  message: string;
  /** How to fix it, in one sentence. */
  hint?: string;
  file?: string;
  line?: number;
  component?: string;
  screen?: string;
};

export type DsComponent = {
  name: string;
  level: DsLevel;
  file: string;
  documented: boolean;
  variants: number;
  /** Design-system components this one is built from. */
  uses: string[];
  /** Components built from this one. */
  usedBy: string[];
  /** Screen ids that use it. */
  screens: string[];
};

export type DsReport = {
  tokens: TokenFile;
  components: DsComponent[];
  /** Screen id -> design-system components it uses. */
  screens: Record<string, string[]>;
  issues: DsIssue[];
  counts: { error: number; warning: number; info: number };
};

// ---- contrast (WCAG 2.x)

const hexRgb = (hex: string): [number, number, number] | null => {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 || h.length === 4 ? [...h.slice(0, 3)].map((c) => c + c).join('') : h.slice(0, 6);

  if (!/^[0-9a-f]{6}$/i.test(full)) return null;

  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
};

const luminance = ([r, g, b]: [number, number, number]) => {
  const ch = (v: number) => {
    const s = v / 255;

    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};

/** Contrast ratio of two hex colours, or null when either is not a plain hex colour. */
export const contrastRatio = (a: string, b: string): number | null => {
  const ra = hexRgb(a);
  const rb = hexRgb(b);

  if (!ra || !rb) return null;
  const [hi, lo] = [luminance(ra), luminance(rb)].sort((x, y) => y - x) as [number, number];

  return (hi + 0.05) / (lo + 0.05);
};
