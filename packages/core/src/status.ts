/** Review status of a screen. The tool owns the list; a project only stores values in `.orbito/status.json`. */
export const STATUSES = ['todo', 'wip', 'review', 'changes', 'approved', 'onHold', 'dropped'] as const;
export type Status = (typeof STATUSES)[number];

export type StatusEntry = { status: Status; note?: string; updatedAt?: string };
export type StatusFile = Record<string, StatusEntry>;

/** A screen missing from the status file is work in progress. */
export const DEFAULT_STATUS: Status = 'wip';

export const isStatus = (v: unknown): v is Status => typeof v === 'string' && (STATUSES as readonly string[]).includes(v);

export const statusOf = (file: StatusFile, id: string): StatusEntry => file[id] ?? { status: DEFAULT_STATUS };
