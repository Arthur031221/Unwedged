import { exportJson } from "./serialize";
import { LIMITS, validateProject, type Project } from "./schema";

export const DRAFT_KEY = "unwedged-draft";

export function createDraft(project: Project): string {
  return exportJson(project);
}

export function readDraft(raw: string | null): Project | null {
  if (!raw || new TextEncoder().encode(raw).length > LIMITS.jsonBytes)
    return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const document = data as Record<string, unknown>;
    if (
      document.format !== "unwedged" ||
      ![1, 2].includes(document.schemaVersion as number) ||
      !("project" in document)
    )
      return null;
    if (
      !document.project ||
      typeof document.project !== "object" ||
      (document.project as Project).schemaVersion !== document.schemaVersion
    )
      return null;
    validateProject(document.project);
    return structuredClone(document.project);
  } catch {
    return null;
  }
}
