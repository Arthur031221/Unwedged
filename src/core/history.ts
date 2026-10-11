import type { Project } from "./schema";

export const HISTORY_LIMIT = 50;

export type ProjectHistory = {
  past: Project[];
  present: Project;
  future: Project[];
  groupStart: Project | null;
};

const snapshot = (project: Project): Project => {
  const copy = structuredClone(project);
  const freeze = (value: object): void => {
    Object.freeze(value);
    for (const child of Object.values(value))
      if (child && typeof child === "object" && !Object.isFrozen(child))
        freeze(child);
  };
  freeze(copy);
  return copy;
};

export const createHistory = (project: Project): ProjectHistory => ({
  past: [],
  present: snapshot(project),
  future: [],
  groupStart: null,
});

export function recordProject(
  history: ProjectHistory,
  project: Project,
): ProjectHistory {
  if (JSON.stringify(history.present) === JSON.stringify(project))
    return history;
  const present = snapshot(project);
  if (history.groupStart) return { ...history, present, future: [] };
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present,
    future: [],
    groupStart: null,
  };
}

export function beginProjectGroup(history: ProjectHistory): ProjectHistory {
  return history.groupStart
    ? history
    : { ...history, groupStart: history.present };
}

export function endProjectGroup(history: ProjectHistory): ProjectHistory {
  if (!history.groupStart) return history;
  const past =
    JSON.stringify(history.groupStart) === JSON.stringify(history.present)
      ? history.past
      : [...history.past, history.groupStart].slice(-HISTORY_LIMIT);
  return {
    ...history,
    past,
    future: past === history.past ? history.future : [],
    groupStart: null,
  };
}

export function undoProject(history: ProjectHistory): ProjectHistory {
  const ended = endProjectGroup(history);
  if (!ended.past.length) return ended;
  return {
    past: ended.past.slice(0, -1),
    present: ended.past.at(-1)!,
    future: [ended.present, ...ended.future],
    groupStart: null,
  };
}

export function redoProject(history: ProjectHistory): ProjectHistory {
  const ended = endProjectGroup(history);
  if (!ended.future.length) return ended;
  return {
    past: [...ended.past, ended.present].slice(-HISTORY_LIMIT),
    present: ended.future[0]!,
    future: ended.future.slice(1),
    groupStart: null,
  };
}
