/**
 * Review status of a feature (a flow): changes rarely stay on one screen, so the status belongs to the flow that delivers
 * the feature. The tool owns the list; a project stores values in `.orbito/status.json` under `flow:<page>/<flow>`.
 */
export const STATUSES = ['todo', 'wip', 'review', 'changes', 'approved', 'onHold', 'dropped'] as const;
export type Status = (typeof STATUSES)[number];

export type StatusEntry = { status: Status; note?: string; updatedAt?: string };
export type StatusFile = Record<string, StatusEntry>;

/** A feature missing from the status file is work in progress. */
export const DEFAULT_STATUS: Status = 'wip';

export const isStatus = (v: unknown): v is Status => typeof v === 'string' && (STATUSES as readonly string[]).includes(v);

export const statusOf = (file: StatusFile, id: string): StatusEntry => file[id] ?? { status: DEFAULT_STATUS };

/** The key of a feature (flow) in the status file. */
export const flowStatusId = (pageKey: string, flowKey: string) => `flow:${pageKey}/${flowKey}`;
