/**
 * How the team's agents use models. The person picks the mode at the kickoff (and can change it any time);
 * it lives in `.orbito/settings.json` as `{ "models": "optimal" | "high" }`.
 * - `optimal`: each role on the model and effort its work needs — thinking on the strongest, building on the middle
 *   one, repeated checks and personas on the lightest. Fewer tokens. The tool's agent files hold these settings.
 * - `high`: quality first — the strongest model with high effort almost everywhere; the middle one with high effort
 *   only for the lightest work (repeated checks, personas). More tokens.
 * Orbito itself (the main session) runs on the strongest model in both modes.
 */

export type ModelMode = 'optimal' | 'high';
export const MODEL_MODES: ModelMode[] = ['optimal', 'high'];
export type OrbitoSettings = { models?: ModelMode };
export type ModelChoice = { model: string; effort?: string };

/** The roles in the `high` mode; roles not listed (the project's own agents) keep their settings. */
export const HIGH_MODELS: Record<string, ModelChoice> = {
  'business-analyst': { model: 'opus', effort: 'high' },
  'ux-designer': { model: 'opus', effort: 'high' },
  'ui-designer': { model: 'opus', effort: 'high' },
  'design-auditor': { model: 'sonnet', effort: 'high' },
  'synthetic-user': { model: 'sonnet', effort: 'high' },
};

/** What an agent runs on in a mode, given its `optimal` settings (from the tool's agent file). */
export const modelFor = (agent: string, mode: ModelMode, optimal: ModelChoice): ModelChoice => (mode === 'high' ? (HIGH_MODELS[agent] ?? optimal) : optimal);

/** Rewrites the `model:` (and `effort:`, added after `model:` when missing) lines of an agent file's front matter. */
export const withModel = (agentFile: string, choice: ModelChoice): string => {
  const m = /^(---\r?\n)([\s\S]*?)(\r?\n---)/.exec(agentFile);

  if (!m) return agentFile;
  let head = m[2]!.replace(/^model:.*$/m, `model: ${choice.model}`);

  if (choice.effort) head = /^effort:.*$/m.test(head) ? head.replace(/^effort:.*$/m, `effort: ${choice.effort}`) : head.replace(/^(model:.*)$/m, `$1\neffort: ${choice.effort}`);

  return m[1] + head + agentFile.slice(m[1]!.length + m[2]!.length);
};

export const isModelMode = (v: unknown): v is ModelMode => v === 'optimal' || v === 'high';
