import { useCallback, useEffect, useRef, useState } from "react";
import type { Project, Route } from "../core/schema";
import type { solve } from "../core/search";

type SearchResult = ReturnType<typeof solve>;
type ImportedBundle = { project: Project; route?: Route };
type Handlers = {
  onImported: (bundle: ImportedBundle) => void;
  onImportError: () => void;
  onWorkerError: () => void;
};

export function useWorkerTasks() {
  const worker = useRef<Worker | null>(null);
  const generation = useRef(0);
  const importGeneration = useRef(0);
  const [busy, setBusy] = useState(false);
  const [explored, setExplored] = useState(0);

  const stop = useCallback(() => {
    generation.current += 1;
    importGeneration.current += 1;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
  }, []);

  const importRaw = useCallback((raw: string, handlers: Handlers) => {
    const importId = ++importGeneration.current;
    const id = ++generation.current;
    worker.current?.terminate();
    const current = new Worker(new URL("../worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = current;
    setBusy(true);
    const isCurrent = () =>
      importId === importGeneration.current &&
      id === generation.current &&
      worker.current === current;
    const finish = () => {
      worker.current = null;
      current.terminate();
      setBusy(false);
    };
    const workerFailed = () => {
      if (!isCurrent()) return;
      finish();
      handlers.onWorkerError();
    };
    current.onmessage = (event: MessageEvent) => {
      if (!isCurrent()) return;
      if (event.data.type === "imported") {
        const bundle = event.data.bundle as ImportedBundle;
        finish();
        handlers.onImported(bundle);
      } else if (event.data.type === "error") {
        finish();
        handlers.onImportError();
      }
    };
    current.onerror = workerFailed;
    current.postMessage({ id, type: "import", raw });
    return importId;
  }, []);

  const search = useCallback(
    (
      project: Project,
      fine: boolean,
      handlers: {
        onProgress?: (count: number) => void;
        onResult: (result: SearchResult) => void;
        onError: () => void;
      },
    ) => {
      stop();
      const id = generation.current;
      const current = new Worker(new URL("../worker.ts", import.meta.url), {
        type: "module",
      });
      worker.current = current;
      setBusy(true);
      const isCurrent = () =>
        id === generation.current && worker.current === current;
      const fail = () => {
        if (!isCurrent()) return;
        worker.current = null;
        current.terminate();
        setBusy(false);
        handlers.onError();
      };
      current.onmessage = (event: MessageEvent) => {
        if (!isCurrent()) return;
        const message = event.data;
        if (message.type === "progress") {
          setExplored(message.explored);
          handlers.onProgress?.(message.explored);
        } else if (message.type === "error") fail();
        else if (message.type === "result") {
          worker.current = null;
          current.terminate();
          setBusy(false);
          setExplored(message.result.explored);
          handlers.onResult(message.result as SearchResult);
        }
      };
      current.onerror = fail;
      current.postMessage({ id, type: "search", project, fine });
    },
    [stop],
  );

  useEffect(
    () => () => {
      generation.current += 1;
      importGeneration.current += 1;
      worker.current?.terminate();
      worker.current = null;
    },
    [],
  );

  return { busy, explored, stop, search, importRaw };
}
