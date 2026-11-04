/**
 * Functional requirements as the project keeps them: `requirements/<area>.md`, one file per epic (`# EP-01 · Name`), one
 * section per story (`## REQ-01 · Name`) with its status, priority, the story and its acceptance criteria. The local
 * mirror of the team's tracker, written by the business analyst; the board shows a story's text next to the screens
 * that implement it.
 */
export type Requirement = {
  /** `REQ-01` */
  id: string;
  title: string;
  /** The epic heading of the file, e.g. `EP-01 · Plants get watered on time`. */
  epic?: string;
  /** Relative to the project root. */
  file: string;
  status?: string;
  priority?: string;
  /** Everything else in the section: the story, acceptance criteria, rules, open questions, as written. */
  text: string;
};

const FIELD = /^-\s*(Status|Priority|Flows|Screens):\s*(.*?)\s*(?:\(.*\))?\s*$/i;

/** Reads the stories of one requirements file; text outside a `## <ID> · <title>` section is the epic's and is skipped. */
export const parseRequirements = (file: string, markdown: string): Requirement[] => {
  const out: Requirement[] = [];
  let epic: string | undefined;
  let current: (Requirement & { lines: string[] }) | null = null;
  const close = () => {
    if (!current) return;
    const { lines, ...r } = current;

    out.push({ ...r, text: lines.join('\n').trim() });
    current = null;
  };

  for (const line of markdown.split(/\r?\n/)) {
    const h1 = /^#\s+(.+?)\s*$/.exec(line);
    const h2 = /^##\s+([A-Za-z]+-\d+[\w.-]*)\s*(?:[·:—-]\s*(.*?))?\s*$/.exec(line);

    if (h1) {
      close();
      epic = h1[1];
    } else if (h2) {
      close();
      current = { id: h2[1]!, title: h2[2] ?? '', epic, file, text: '', lines: [] };
    } else if (/^##\s/.test(line)) close();
    else if (current) {
      const field = FIELD.exec(line);

      if (field?.[1]?.toLowerCase() === 'status') current.status = field[2];
      else if (field?.[1]?.toLowerCase() === 'priority') current.priority = field[2];
      // flows and screens are already on the board, the links are drawn from the mockups
      else if (!field) current.lines.push(line);
    }
  }
  close();

  return out;
};
