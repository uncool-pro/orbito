/**
 * The project model: everything the viewer and the tools know about a mockup project.
 * Pure data and types, no React and no DOM, so it can be used by the viewer, the CLI and tests alike.
 */

/** A device or browser size a screen is designed for. */
export type Viewport = {
  key: string;
  label: string;
  width: number;
  height: number;
  /** `device`: fixed-height frame, only the screen's scroll area scrolls (phones, tablets). `page`: the whole page scrolls (web). */
  kind: 'device' | 'page';
};

export const BUILT_IN_VIEWPORTS = {
  mobile: { key: 'mobile', label: 'Mobile', width: 390, height: 844, kind: 'device' },
  tablet: { key: 'tablet', label: 'Tablet', width: 820, height: 1180, kind: 'device' },
  // a web page on a tablet: tablet width, the whole page scrolls
  'tablet-web': { key: 'tablet-web', label: 'Tablet web', width: 820, height: 1180, kind: 'page' },
  laptop: { key: 'laptop', label: 'Laptop', width: 1280, height: 800, kind: 'page' },
  desktop: { key: 'desktop', label: 'Desktop', width: 1440, height: 900, kind: 'page' },
  // a web page on a phone: phone width, the whole page scrolls (landing pages, sites)
  'mobile-web': { key: 'mobile-web', label: 'Mobile web', width: 390, height: 844, kind: 'page' },
} as const satisfies Record<string, Viewport>;

/** What a screen file declares next to its component (`export const meta = defineScreen({...})`). */
export type ScreenMeta = {
  /** Permanent, human-friendly code shown on the board, e.g. `PL-01`. Never renumber; screens without a code are sandboxes. */
  code?: string;
  title: string;
  /** Viewport key; defaults to the project's `defaultViewport` (or the first of `viewports`). */
  viewport?: string;
  /**
   * A responsive page: one implementation at these sizes (e.g. `['desktop', 'tablet-web', 'mobile-web']`), the first
   * one on the board; the prototype shows one size at a time with a switch between them. Layout changes per size come from CSS container queries on the page (`@container`).
   */
  viewports?: string[];
  /** Logical parent screen id; `goBack()` opens it. */
  back?: string;
  /** Requirement ids this screen implements (traceability; see the requirements view). */
  requirements?: string[];
  /** Free-form note for the team, shown in the screen view. */
  note?: string;
};

/** A screen after loading: meta plus the identity derived from its file. */
export type Screen<C = unknown> = ScreenMeta & {
  /** URL key, derived from the file name (`plant-list.screen.tsx` -> `plant-list`). */
  id: string;
  /** Source file, relative to the project root. */
  file: string;
  component: C;
};

export type FlowPath = 'happy' | 'alternative' | 'negative';

/** A flow is one row (lane) on the board: an ordered path through screens. Arrows are not declared, they are detected from the screens. */
export type Flow = {
  key: string;
  name: string;
  screens: string[];
  /**
   * Which kind of path this flow is, in the order UX maps them: the `happy` path first, then `alternative` paths
   * (detours, interruptions, other ways round), then `negative` ones (errors, dead ends, cancellations). Default `happy`.
   */
  path?: FlowPath;
  /** Stories this flow delivers (ids from `requirements/`, e.g. `REQ-03`), linked by the UX designer when drawing it. */
  requirements?: string[];
  /** Alternative versions of this flow's screens, shown as lanes under it. */
  versions?: FlowVersion[];
};

/** One screen of a version: it either replaces a screen of the flow or is new. */
export type VersionScreen = {
  id: string;
  /** Screen id of the flow this one replaces. Omitted for a new screen. */
  replaces?: string;
  /** For new screens: insert after this screen of the flow (default: at the end). */
  after?: string;
  /** Finding numbers (from the version's report) this screen addresses. */
  findings?: number[];
};

/** A version (branch) of a flow: e.g. the result of a UX review or an alternative concept for a client. */
export type FlowVersion = {
  key: string;
  name: string;
  /** ISO date `YYYY-MM-DD`. */
  date?: string;
  state: 'open' | 'merged' | 'dropped';
  /** Markdown report the findings come from, relative to the project root. */
  report?: string;
  screens: VersionScreen[];
};

/** A page groups the flows of one feature area (board page switcher). */
export type Page = { key: string; name: string; flows: Flow[] };

export type ProjectConfig = {
  title: string;
  /** UI language of the tool. */
  locale?: 'en' | 'pl';
  /** Viewport used by screens that do not set one. */
  defaultViewport?: string;
  /** Extra or overridden viewports. */
  viewports?: Record<string, Viewport>;
  /** A page of the project published as a static site with `orbito export` (e.g. a landing page). */
  site?: SiteConfig;
};

export type SiteConfig = {
  /** Id of the screen to export as `index.html`. */
  screen: string;
  /** `<title>` of the page (default: the screen title). */
  title?: string;
  /** `<meta name="description">`: one or two sentences shown by search engines and link previews. */
  description?: string;
  /** Language of the page content, e.g. `pl`, `en` (default: the project locale). */
  lang?: string;
  /** Output folder relative to the project (default `site`). */
  out?: string;
};

export type Project<C = unknown> = {
  config: Required<Pick<ProjectConfig, 'title' | 'locale' | 'defaultViewport'>> & ProjectConfig;
  viewports: Record<string, Viewport>;
  screens: Screen<C>[];
  pages: Page[];
};

/** Typed identity helpers for project files. */
export const defineConfig = (config: ProjectConfig): ProjectConfig => config;
export const defineScreen = (meta: ScreenMeta): ScreenMeta => meta;
export const definePage = (page: Page): Page => page;
