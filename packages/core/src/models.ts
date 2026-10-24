/**
 * How the team's agents use models — a personal choice of each person, never a change to shared files.
 *
 * - Two profiles ship with Orbito in `agents/models.json` (copied to a project's `.orbito/models.json`):
 *   `optimal` — each role on the model and effort its work needs, fewer tokens (the agent files carry these values);
 *   `high` — the strongest model almost everywhere, with high effort where the work is strategic.
 * - The mode in use is resolved per person, highest first: the `ORBITO_MODELS` environment variable →
 *   `.orbito/settings.local.json` (personal, git-ignored) → `.orbito/settings.json` (the team's default, committed) → `optimal`.
 * - A competence can need more than the rest of its role's work: a `<role>/<skill>` entry (`ui-designer/look-and-feel`)
 *   overrides the role's values when the role is called for that competence.
 * - Agent files are never rewritten. Orbito (the main session) passes the profile's model and effort each time it
 *   calls an agent, which Claude Code applies over the agent file's own values.
 */

export type ModelMode = 'optimal' | 'high';
export const MODEL_MODES: ModelMode[] = ['optimal', 'high'];
export type ModelChoice = { model: string; effort?: string };
export type ModelProfiles = Record<ModelMode, Record<string, ModelChoice>>;
export type OrbitoSettings = { models?: ModelMode };
/** Where the mode in use comes from. */
export type ModeSource = 'env' | 'local' | 'team' | 'default';

export const isModelMode = (v: unknown): v is ModelMode => v === 'optimal' || v === 'high';

/** The mode in use for this person, and where it comes from. */
export const resolveMode = (sources: { env?: string; local?: OrbitoSettings; team?: OrbitoSettings }): { mode: ModelMode; source: ModeSource } => {
  if (isModelMode(sources.env)) return { mode: sources.env, source: 'env' };
  if (isModelMode(sources.local?.models)) return { mode: sources.local!.models!, source: 'local' };
  if (isModelMode(sources.team?.models)) return { mode: sources.team!.models!, source: 'team' };

  return { mode: 'optimal', source: 'default' };
};

/**
 * The model and effort of a role in a mode — for one of its competences when `skill` is given and the profile has an
 * entry for it; roles the profiles do not know (the project's own agents) get `undefined`.
 */
export const modelFor = (profiles: ModelProfiles | undefined, mode: ModelMode, role: string, skill?: string): ModelChoice | undefined =>
  (skill ? profiles?.[mode]?.[`${role}/${skill}`] : undefined) ?? profiles?.[mode]?.[role];

/** The competences of a role that run on their own model and effort in a mode (`<role>/<skill>` entries). */
export const skillModels = (profiles: ModelProfiles | undefined, mode: ModelMode, role: string): Record<string, ModelChoice> =>
  Object.fromEntries(
    Object.entries(profiles?.[mode] ?? {})
      .filter(([key]) => key.startsWith(`${role}/`))
      .map(([key, choice]) => [key.slice(role.length + 1), choice]),
  );
