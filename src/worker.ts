import { solve } from "./core/search";
import { validateProject, type Project } from "./core/schema";
import { importJson } from "./core/serialize";
let active = 0;
self.onmessage = (e: MessageEvent) => {
  const m = e.data as
    | { id: number; type: "search"; project: Project; fine: boolean }
    | { id: number; type: "import"; raw: string };
  active = m.id;
  const id = m.id;
  try {
    if (m.type === "import") {
      const bundle = importJson(m.raw);
      if (id === active) self.postMessage({ id, type: "imported", bundle });
      return;
    }
    validateProject(m.project);
    const result = solve(m.project, {
      fine: m.fine,
      cancelled: () => id !== active,
      progress: (explored) =>
        self.postMessage({ id, type: "progress", explored }),
    });
    if (id === active) self.postMessage({ id, type: "result", result });
  } catch (err) {
    if (id === active)
      self.postMessage({
        id,
        type: "error",
        message: err instanceof Error ? err.message : "Search failed",
      });
  }
};
