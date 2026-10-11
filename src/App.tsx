import { useEffect, useRef, useState } from "react";
import { presets } from "./core/presets";
import { exportJson, routeSvg } from "./core/serialize";
import { LIMITS, type Project, type Route } from "./core/schema";
import { messages, localeNames, type Locale } from "./locales";
import { createEmptyProject, createObstacle, editRect } from "./core/editor";
import { shortAngle } from "./core/geometry";
import { formatClearance } from "./core/units";
import {
  Field,
  NumericDraftProvider,
  RectEditor,
  useNumericDrafts,
} from "./ui/Fields";
import { Floorplan } from "./ui/Floorplan";
import { useRoutePlayback } from "./hooks/useRoutePlayback";
import { useWorkerTasks } from "./hooks/useWorkerTasks";
import { useProjectHistory } from "./hooks/useProjectHistory";
import { createDraft, DRAFT_KEY, readDraft } from "./core/draft";
const locales = Object.keys(messages) as Locale[];
const stored = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const saveStored = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is optional. The active preference still applies in memory.
  }
};
const validLocale = (value: string | null): value is Locale =>
  !!value && locales.includes(value as Locale);
export default function App() {
  return (
    <NumericDraftProvider>
      <AppBody />
    </NumericDraftProvider>
  );
}

function AppBody() {
  const initialDraft = useRef<{
    project: Project | null;
    unavailable: boolean;
  } | null>(null);
  if (!initialDraft.current) {
    let raw: string | null = null;
    let unavailable = false;
    try {
      raw = localStorage.getItem(DRAFT_KEY);
    } catch {
      unavailable = true;
    }
    initialDraft.current = { project: readDraft(raw), unavailable };
  }
  const initialProject = initialDraft.current.project ?? presets[1]!;
  const historyState = useProjectHistory(initialProject);
  const { project } = historyState;
  const [route, setRoute] = useState<Route | null>(null);
  const [status, setStatus] = useState<keyof typeof messages.en | "">("");
  const [shareStatus, setShareStatus] = useState<"copied" | "shareReady" | "">(
    "",
  );
  const shareGeneration = useRef(0);
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<
    "saved" | "unavailable" | "restored" | ""
  >(
    initialDraft.current.unavailable
      ? "unavailable"
      : initialDraft.current.project
        ? "restored"
        : "",
  );
  const tasks = useWorkerTasks();
  const { busy, explored } = tasks;
  const [fine, setFine] = useState(false);
  const [unit, setUnit] = useState<"cm" | "in">(() =>
    stored("unwedged-unit") === "in" ? "in" : "cm",
  );
  const [locale, setLocale] = useState<Locale>(() => {
    const value = stored("unwedged-locale");
    return validLocale(value) ? value : "en";
  });
  const [dark, setDark] = useState(stored("unwedged-theme") === "dark");
  const { pose, playing, setPlaying, progress, setProgress } = useRoutePlayback(
    route,
    project.start,
  );
  const [mode, setMode] = useState<"select" | "wall" | "start" | "goal">(
    "select",
  );
  const [selection, setSelection] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(false);
  const measureOpener = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const canvas = useRef<SVGSVGElement>(null);
  const focusCanvasAfterClose = useRef(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const importGeneration = useRef(0);
  const projectRef = historyState.projectRef;
  const routeRef = useRef<Route | null>(route);
  const file = useRef<HTMLInputElement>(null);
  const t = messages[locale];
  const { invalidDraft, pendingDraft, draftVersion, resetDrafts } =
    useNumericDrafts();
  useEffect(() => {
    const query = window.matchMedia("(max-width: 740px)");
    const update = () => {
      setNarrowViewport(query.matches);
      if (!query.matches) setMobileOpen(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!mobileOpen || !narrowViewport) {
      if (mobileOpen) return;
      if (focusCanvasAfterClose.current) {
        focusCanvasAfterClose.current = false;
        requestAnimationFrame(() => canvas.current?.focus());
      }
      return;
    }
    const shell = document.querySelector<HTMLElement>(".app-shell");
    const topbar = shell?.querySelector<HTMLElement>(".topbar");
    const mainPanel = shell?.querySelector<HTMLElement>(".main-panel");
    if (topbar) topbar.inert = true;
    if (mainPanel) mainPanel.inert = true;
    const focusable = () =>
      Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
    const focusFrame = requestAnimationFrame(() => focusable()[0]?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        requestAnimationFrame(() => measureOpener.current?.focus());
      } else if (event.key === "Tab") {
        const items = focusable();
        if (!items.length) {
          event.preventDefault();
          sidebar.current?.focus();
          return;
        }
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !sidebar.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !sidebar.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      if (topbar) topbar.inert = false;
      if (mainPanel) mainPanel.inert = false;
    };
  }, [mobileOpen, narrowViewport]);
  const shown = (cm: number) => (unit === "cm" ? cm : cm / 2.54);
  const label = (cm: number) => `${shown(cm).toFixed(1)} ${unit}`;
  const presetLabel = (name: string) =>
    name === presets[0]!.name
      ? t.presetHall
      : name === presets[1]!.name
        ? t.presetCorner
        : name === presets[2]!.name
          ? t.presetBlocked
          : name;
  const stopWork = () => {
    importGeneration.current += 1;
    tasks.stop();
  };
  const clearSharedLink = () => {
    shareGeneration.current += 1;
    setShareStatus("");
    history.replaceState(null, "", location.pathname + location.search);
  };
  const invalidate = () => {
    clearSharedLink();
    stopWork();
    routeRef.current = null;
    setRoute(null);
    setPlaying(false);
    setProgress(0);
  };
  useEffect(() => {
    if (draftVersion > 0) invalidate();
    // Draft edits invalidate displayed routes before their accepted value commits.
  }, [draftVersion]);
  const change = (fn: (p: Project) => Project) => {
    invalidate();
    const next = fn(structuredClone(projectRef.current));
    if (next.rects.some((rect) => (rect.door?.offset ?? 0) !== 0))
      next.schemaVersion = 2;
    historyState.change(next);
    setAutosaveEnabled(true);
    setStatus("");
  };
  const renameProject = (name: string) => {
    clearSharedLink();
    stopWork();
    historyState.change({ ...projectRef.current, name });
    setAutosaveEnabled(true);
    if (!routeRef.current) setStatus("");
  };
  const restoreHistory = (direction: "undo" | "redo") => {
    resetDrafts();
    if (
      direction === "undo"
        ? !historyState.canUndo && !pendingDraft && !invalidDraft
        : !historyState.canRedo && !pendingDraft && !invalidDraft
    )
      return;
    const previous = projectRef.current;
    clearSharedLink();
    stopWork();
    if (direction === "undo") historyState.undo();
    else historyState.redo();
    const next = projectRef.current;
    // Name edits leave the geometry used to certify the route unchanged.
    const geometryUnchanged =
      previous.schemaVersion === next.schemaVersion &&
      JSON.stringify({ ...previous, name: "" }) ===
        JSON.stringify({ ...next, name: "" });
    if (!geometryUnchanged) {
      routeRef.current = null;
      setRoute(null);
      setPlaying(false);
      setProgress(0);
      setStatus("");
    } else if (!routeRef.current) setStatus("");
    setAutosaveEnabled(true);
  };
  useEffect(() => {
    if (!autosaveEnabled) return;
    try {
      localStorage.setItem(DRAFT_KEY, createDraft(projectRef.current));
      setAutosaveStatus("saved");
    } catch {
      setAutosaveStatus("unavailable");
    }
  }, [autosaveEnabled, project]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        ((target instanceof HTMLInputElement &&
          ["text", "number"].includes(target.type)) ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target.isContentEditable)
      )
        return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        restoreHistory(event.shiftKey ? "redo" : "undo");
      } else if (key === "y" && !event.shiftKey) {
        event.preventDefault();
        restoreHistory("redo");
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  useEffect(() => {
    const rawHash = location.hash.slice(1);
    if (!rawHash) return;
    if (rawHash.length > Math.ceil((LIMITS.jsonBytes * 4) / 3) + 4) {
      setStatus("invalidProject");
      return;
    }
    let raw: string;
    try {
      raw = decodeURIComponent(escape(atob(rawHash)));
    } catch {
      setStatus("invalidProject");
      return;
    }
    tasks.importRaw(raw, {
      onImported: (bundle) => {
        resetDrafts();
        historyState.reset(bundle.project);
        routeRef.current = bundle.route ?? null;
        setRoute(bundle.route ?? null);
        setStatus(bundle.route ? "verified" : "");
        setAutosaveStatus("");
      },
      onImportError: () => setStatus("invalidProject"),
      onWorkerError: () => setStatus("workerError"),
    });
    // Hash loading is a one-time initialization.
  }, []);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let live = true;
    let watchedWorker: ServiceWorker | null = null;
    const markReady = () => {
      if (
        live &&
        navigator.serviceWorker.controller &&
        watchedWorker?.state === "activated"
      )
        setOfflineReady(true);
    };
    const updateReady = () => {
      if (!live || !navigator.serviceWorker.controller) return;
      void navigator.serviceWorker.ready.then((registration) => {
        if (!live) return;
        watchedWorker?.removeEventListener("statechange", markReady);
        watchedWorker = registration.active;
        watchedWorker?.addEventListener("statechange", markReady);
        markReady();
      });
    };
    navigator.serviceWorker.addEventListener("controllerchange", updateReady);
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(updateReady)
      .catch(() => void 0);
    updateReady();
    return () => {
      live = false;
      watchedWorker?.removeEventListener("statechange", markReady);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        updateReady,
      );
    };
  }, []);
  useEffect(() => {
    saveStored("unwedged-theme", dark ? "dark" : "light");
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    saveStored("unwedged-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    saveStored("unwedged-unit", unit);
  }, [unit]);
  const startSearch = () => {
    if (invalidDraft) return;
    stopWork();
    const runProject = projectRef.current;
    setRoute(null);
    routeRef.current = null;
    setStatus("finding");
    tasks.search(runProject, fine, {
      onError: () => {
        routeRef.current = null;
        setRoute(null);
        setStatus("workerError");
      },
      onResult: (result) => {
        if (result.status === "found") {
          setRoute(result.route);
          routeRef.current = result.route;
          setProgress(0);
          setStatus("verified");
        } else {
          const msg =
            (
              {
                "start-collision": "startHit",
                "goal-collision": "goalHit",
                timeout: "timeout",
                cancelled: "cancelled",
                "no-route": "noRoute",
              } as Record<string, keyof typeof messages.en>
            )[result.status] ?? "noRoute";
          setStatus(msg);
        }
      },
    });
  };
  const cancel = () => {
    stopWork();
    setStatus("cancelled");
  };
  const save = () => {
    if (invalidDraft) return;
    const blob = new Blob(
      [exportJson(projectRef.current, routeRef.current ?? undefined)],
      {
        type: "application/json",
      },
    );
    download(blob, "unwedged-project.json");
  };
  const share = async () => {
    if (invalidDraft) return;
    const generation = ++shareGeneration.current;
    const b = btoa(
      unescape(
        encodeURIComponent(
          exportJson(projectRef.current, routeRef.current ?? undefined),
        ),
      ),
    );
    history.replaceState(null, "", `#${b}`);
    setShareStatus("shareReady");
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(location.href);
        if (generation === shareGeneration.current) setShareStatus("copied");
      }
    } catch {
      // The address bar still contains the shared project when clipboard access is unavailable.
    }
  };
  const download = (blob: Blob, name: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const exportSheet = () => {
    if (invalidDraft) return;
    const currentRoute = routeRef.current;
    if (!currentRoute) return;
    download(
      new Blob(
        [
          routeSvg(projectRef.current, currentRoute, {
            caption: `${t.sheetCaption} · ${projectRef.current.name}`,
            dimensions: `${t.room} ${label(projectRef.current.floor.width)} × ${label(projectRef.current.floor.height)} · ${t.furnitureSize} ${label(projectRef.current.furniture.length)} × ${label(projectRef.current.furniture.width)} · ${t.carryHeight} ${label(projectRef.current.furniture.height)} · ${t.safetyMargin} ${label(projectRef.current.margin)} · ${t.clearance} ≥ ${formatClearance(currentRoute.clearance, unit)}`,
          }),
        ],
        { type: "image/svg+xml" },
      ),
      "unwedged-route.svg",
    );
  };
  const openFile = (f?: File) => {
    if (!f) return;
    stopWork();
    setPlaying(false);
    if (f.size > LIMITS.jsonBytes) {
      setStatus("invalidProject");
      return;
    }
    const token = ++importGeneration.current;
    const reader = new FileReader();
    reader.onload = () => {
      if (token !== importGeneration.current) return;
      tasks.importRaw(String(reader.result), {
        onImported: (bundle) => {
          resetDrafts();
          invalidate();
          historyState.endGroup();
          historyState.change(bundle.project);
          setSelection("");
          setMode("select");
          routeRef.current = bundle.route ?? null;
          setRoute(bundle.route ?? null);
          setStatus(bundle.route ? "verified" : "");
          setAutosaveEnabled(true);
          setAutosaveStatus("");
        },
        onImportError: () => setStatus("invalidProject"),
        onWorkerError: () => setStatus("workerError"),
      });
    };
    reader.onerror = () => {
      if (token === importGeneration.current) setStatus("invalidProject");
    };
    reader.readAsText(f);
  };
  const rects = project.rects;
  const presetIndex = presets.findIndex(
    (preset) => JSON.stringify(preset) === JSON.stringify(project),
  );
  const W = project.floor.width;
  const H = project.floor.height;
  const f = (
    key:
      | "length"
      | "width"
      | "height"
      | "margin"
      | "floorW"
      | "floorH"
      | "startX"
      | "startY"
      | "goalX"
      | "goalY",
    v: number,
  ) =>
    change((p) => {
      const raw = v * (unit === "in" ? 2.54 : 1);
      const n = raw;
      if (key === "length" || key === "width" || key === "height")
        return {
          ...p,
          furniture: {
            ...p.furniture,
            [key === "length"
              ? "length"
              : key === "width"
                ? "width"
                : "height"]: n,
          },
        };
      if (key === "margin") return { ...p, margin: n };
      if (key === "floorW" || key === "floorH")
        return {
          ...p,
          floor: { ...p.floor, [key === "floorW" ? "width" : "height"]: n },
        };
      const which = key.startsWith("start") ? "start" : "goal",
        axis = key.endsWith("X") ? "x" : "y";
      return { ...p, [which]: { ...p[which], [axis]: n } };
    });
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img
            className="brand-mark"
            src={`${import.meta.env.BASE_URL}unwedged-mark.svg`}
            alt=""
          />
          <div>
            <strong>Unwedged</strong>
            <small>{t.tagline}</small>
          </div>
        </div>
        <div className="toolbar">
          <button
            className="history-btn"
            onClick={() => restoreHistory("undo")}
            disabled={!historyState.canUndo && !pendingDraft && !invalidDraft}
            aria-label={t.undo}
            title={t.undo}
          >
            ↶
          </button>
          <button
            className="history-btn"
            onClick={() => restoreHistory("redo")}
            disabled={!historyState.canRedo && !pendingDraft && !invalidDraft}
            aria-label={t.redo}
            title={t.redo}
          >
            ↷
          </button>
          {offlineReady && (
            <span className="offline-ready">{t.offlineReady}</span>
          )}
          <select
            aria-label={t.language}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeNames[l]}
              </option>
            ))}
          </select>
          <button
            className="icon-btn"
            onClick={() => setDark(!dark)}
            title={dark ? t.light : t.dark}
            aria-label={dark ? t.light : t.dark}
          >
            {dark ? "☼" : "◐"}
          </button>
          <button
            className="share-btn"
            aria-label={t.share}
            onClick={share}
            disabled={invalidDraft}
          >
            ↗ <span>{t.share}</span>
          </button>
        </div>
      </header>
      <div className="share-notice" role="status" aria-live="polite">
        {shareStatus ? t[shareStatus] : ""}
      </div>
      <main className="workspace">
        <aside
          ref={sidebar}
          id="measurements-panel"
          className={`sidebar ${mobileOpen ? "open" : ""}`}
          role={narrowViewport && mobileOpen ? "dialog" : undefined}
          aria-modal={narrowViewport && mobileOpen ? true : undefined}
          aria-label={narrowViewport && mobileOpen ? t.menu : undefined}
          onFocusCapture={(event) => {
            if (
              event.target instanceof HTMLInputElement &&
              ["number", "text"].includes(event.target.type)
            )
              historyState.beginGroup();
          }}
          onBlurCapture={(event) => {
            if (
              event.target instanceof HTMLInputElement &&
              ["number", "text"].includes(event.target.type)
            )
              historyState.endGroup();
          }}
        >
          <div className="side-head">
            <div>
              <span className="eyebrow">{t.fieldSheet}</span>
              <h1>{t.study}</h1>
            </div>
            <button
              className="mobile-close"
              aria-label={t.close}
              onClick={() => {
                setMobileOpen(false);
                requestAnimationFrame(() => measureOpener.current?.focus());
              }}
            >
              ×
            </button>
          </div>
          <div className="step-tabs">
            <button
              className="active"
              onClick={() => {
                setMobileOpen(false);
                requestAnimationFrame(() => measureOpener.current?.focus());
              }}
            >
              {t.layout}
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("furniture")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {t.furniture}
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("route-panel")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {t.route}
            </button>
          </div>
          <section className="form-section">
            <div className="section-title">
              <h2>{t.floor}</h2>
              <span className="unit-pills">
                <button
                  className={unit === "cm" ? "picked" : ""}
                  onClick={() => {
                    resetDrafts();
                    setUnit("cm");
                  }}
                >
                  cm
                </button>
                <button
                  className={unit === "in" ? "picked" : ""}
                  onClick={() => {
                    resetDrafts();
                    setUnit("in");
                  }}
                >
                  in
                </button>
              </span>
            </div>
            <label className="select-label">
              {t.preset}
              <select
                value={presetIndex < 0 ? "custom" : presetIndex}
                onChange={(e) => {
                  if (e.target.value === "custom") return;
                  const selectedPreset = structuredClone(
                    presets[Number(e.target.value)]!,
                  );
                  resetDrafts();
                  change(() => selectedPreset);
                }}
              >
                {presetIndex < 0 && (
                  <option value="custom">{t.customLayout}</option>
                )}
                {presets.map((p, i) => (
                  <option value={i} key={p.name}>
                    {presetLabel(p.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="select-label">
              {t.planName}
              <input
                type="text"
                maxLength={100}
                value={project.name}
                onChange={(event) => renameProject(event.target.value)}
              />
            </label>
            <button
              className="text-btn new-plan-btn"
              onClick={() => {
                resetDrafts();
                change(() => createEmptyProject(t.untitledPlan));
                setSelection("");
                setMode("select");
              }}
            >
              {t.newEmptyPlan}
            </button>
            <div className="input-grid">
              <Field
                label={t.width}
                value={shown(project.floor.width)}
                onChange={(v) => f("floorW", v)}
                unit={unit}
                min={unit === "in" ? 1 / 2.54 : 1}
                max={shown(Math.min(LIMITS.dimension, LIMITS.area / H))}
                rangeMessage={t.measurementRange}
                emptyMessage={t.measurementRequired}
              />
              <Field
                label={t.depth}
                value={shown(project.floor.height)}
                onChange={(v) => f("floorH", v)}
                unit={unit}
                min={unit === "in" ? 1 / 2.54 : 1}
                max={shown(Math.min(LIMITS.dimension, LIMITS.area / W))}
                rangeMessage={t.measurementRange}
                emptyMessage={t.measurementRequired}
              />
            </div>
            <div className="tool-row" role="group" aria-label={t.canvasTools}>
              <button
                className={mode === "wall" ? "tool-active" : ""}
                disabled={rects.length >= LIMITS.rectangles}
                onClick={() => {
                  setMode(mode === "wall" ? "select" : "wall");
                  if (narrowViewport && mobileOpen) {
                    focusCanvasAfterClose.current = true;
                    setMobileOpen(false);
                  }
                }}
              >
                ＋ {t.draw}
              </button>
              <button
                className={mode === "start" ? "tool-active" : ""}
                onClick={() => {
                  setMode(mode === "start" ? "select" : "start");
                  if (narrowViewport && mobileOpen) {
                    focusCanvasAfterClose.current = true;
                    setMobileOpen(false);
                  }
                }}
              >
                ◎ {t.start}
              </button>
              <button
                className={mode === "goal" ? "tool-active" : ""}
                onClick={() => {
                  setMode(mode === "goal" ? "select" : "goal");
                  if (narrowViewport && mobileOpen) {
                    focusCanvasAfterClose.current = true;
                    setMobileOpen(false);
                  }
                }}
              >
                ◇ {t.destination}
              </button>
            </div>
          </section>
          <section className="form-section" id="furniture">
            <div className="section-title">
              <h2>{t.furniture}</h2>
              <span className="section-index">01—03</span>
            </div>
            <div className="input-grid">
              <Field
                label={t.length}
                value={shown(project.furniture.length)}
                onChange={(v) => f("length", v)}
                unit={unit}
                min={unit === "in" ? 0.1 / 2.54 : 0.1}
                max={shown(LIMITS.dimension)}
                rangeMessage={t.measurementRange}
                emptyMessage={t.measurementRequired}
              />
              <Field
                label={t.width}
                value={shown(project.furniture.width)}
                onChange={(v) => f("width", v)}
                unit={unit}
                min={unit === "in" ? 0.1 / 2.54 : 0.1}
                max={shown(LIMITS.dimension)}
                rangeMessage={t.measurementRange}
                emptyMessage={t.measurementRequired}
              />
              <Field
                label={t.height}
                value={shown(project.furniture.height)}
                onChange={(v) => f("height", v)}
                unit={unit}
                min={unit === "in" ? 0.1 / 2.54 : 0.1}
                max={shown(LIMITS.dimension)}
                rangeMessage={t.measurementRange}
                emptyMessage={t.measurementRequired}
              />
              <Field
                label={t.margin}
                value={shown(project.margin)}
                onChange={(v) => f("margin", v)}
                unit={unit}
                min={0}
                max={shown(LIMITS.margin)}
                rangeMessage={t.measurementRange}
                emptyMessage={t.measurementRequired}
              />
            </div>
            <div className="input-grid pose-inputs">
              <fieldset>
                <legend>{t.start}</legend>
                <Field
                  label="X"
                  value={shown(project.start.x)}
                  onChange={(v) => f("startX", v)}
                  unit={unit}
                  min={shown(-LIMITS.coordinate)}
                  max={shown(LIMITS.coordinate)}
                  rangeMessage={t.measurementRange}
                  emptyMessage={t.measurementRequired}
                />
                <Field
                  label="Y"
                  value={shown(project.start.y)}
                  onChange={(v) => f("startY", v)}
                  unit={unit}
                  min={shown(-LIMITS.coordinate)}
                  max={shown(LIMITS.coordinate)}
                  rangeMessage={t.measurementRange}
                  emptyMessage={t.measurementRequired}
                />
                <Field
                  label={t.angle}
                  value={(shortAngle(0, project.start.angle) * 180) / Math.PI}
                  onChange={(v) =>
                    change((p) => ({
                      ...p,
                      start: {
                        ...p.start,
                        angle: Math.max(
                          -1e6,
                          Math.min(1e6, (v * Math.PI) / 180),
                        ),
                      },
                    }))
                  }
                  unit="°"
                  min={(-1e6 * 180) / Math.PI}
                  max={(1e6 * 180) / Math.PI}
                  rangeMessage={t.measurementRange}
                  emptyMessage={t.measurementRequired}
                />
              </fieldset>
              <fieldset>
                <legend>{t.destination}</legend>
                <Field
                  label="X"
                  value={shown(project.goal.x)}
                  onChange={(v) => f("goalX", v)}
                  unit={unit}
                  min={shown(-LIMITS.coordinate)}
                  max={shown(LIMITS.coordinate)}
                  rangeMessage={t.measurementRange}
                  emptyMessage={t.measurementRequired}
                />
                <Field
                  label="Y"
                  value={shown(project.goal.y)}
                  onChange={(v) => f("goalY", v)}
                  unit={unit}
                  min={shown(-LIMITS.coordinate)}
                  max={shown(LIMITS.coordinate)}
                  rangeMessage={t.measurementRange}
                  emptyMessage={t.measurementRequired}
                />
                <Field
                  label={t.angle}
                  value={(shortAngle(0, project.goal.angle) * 180) / Math.PI}
                  onChange={(v) =>
                    change((p) => ({
                      ...p,
                      goal: {
                        ...p.goal,
                        angle: Math.max(
                          -1e6,
                          Math.min(1e6, (v * Math.PI) / 180),
                        ),
                      },
                    }))
                  }
                  unit="°"
                  min={(-1e6 * 180) / Math.PI}
                  max={(1e6 * 180) / Math.PI}
                  rangeMessage={t.measurementRange}
                  emptyMessage={t.measurementRequired}
                />
              </fieldset>
            </div>
          </section>
          <section className="form-section">
            <div className="section-title">
              <h2>{t.obstacles}</h2>
              <div className="obstacle-actions">
                <button
                  className="text-btn"
                  disabled={rects.length >= LIMITS.rectangles}
                  onClick={() => {
                    const obstacle = createObstacle(projectRef.current);
                    change((p) => ({ ...p, rects: [...p.rects, obstacle] }));
                    setSelection(obstacle.id);
                  }}
                >
                  {t.addObstacle}
                </button>
                <button
                  className="text-btn danger"
                  disabled={!selection}
                  onClick={() => {
                    change((p) => ({
                      ...p,
                      rects: p.rects.filter((r) => r.id !== selection),
                    }));
                    setSelection("");
                  }}
                >
                  {t.remove}
                </button>
              </div>
            </div>
            {rects.length === 0 ? (
              <p className="empty-note">{t.emptyObstacles}</p>
            ) : (
              rects.map((r) => (
                <button
                  type="button"
                  className={`obstacle-row ${selection === r.id ? "selected" : ""}`}
                  key={r.id}
                  onClick={() => setSelection(r.id)}
                >
                  <span className="swatch" />
                  <span>{r.id}</span>
                  <span>
                    {label(r.width)} × {label(r.height)}
                  </span>
                  {r.door && (
                    <span>
                      {t.door} {label(r.door.width)} / {label(r.door.height)}
                    </span>
                  )}
                </button>
              ))
            )}
            {selection && project.rects.find((r) => r.id === selection) && (
              <RectEditor
                key={selection}
                rect={project.rects.find((r) => r.id === selection)!}
                unit={unit}
                t={t}
                shown={shown}
                update={(patch) =>
                  change((p) => ({
                    ...p,
                    rects: p.rects.map((r) =>
                      r.id === selection ? editRect(r, patch) : r,
                    ),
                  }))
                }
              />
            )}
          </section>
          <section className="form-section" id="route-panel">
            <div className="section-title">
              <h2>{t.route}</h2>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={fine}
                  onChange={(e) => setFine(e.target.checked)}
                />
                <span>{t.fineSearch}</span>
              </label>
            </div>
            <button
              className="primary-btn"
              onClick={busy ? cancel : startSearch}
              disabled={!busy && invalidDraft}
            >
              {busy ? t.cancel : t.find}
              <span>{busy ? "×" : "→"}</span>
            </button>
            {busy && (
              <div className="progress-line">
                <span />
                {t.progress}: {Number(explored ?? 0).toLocaleString(locale)}
              </div>
            )}
            <div
              className={`result ${route ? "success" : status ? "notice" : ""}`}
              aria-live="polite"
            >
              {route ? (
                <>
                  <div className="result-head">
                    <span className="check">✓</span>
                    <strong>{t.routeReady}</strong>
                  </div>
                  <p>{t.routeInfo}</p>
                  {(status === "invalidProject" ||
                    status === "workerError") && <p>{t[status]}</p>}
                  <div className="result-meta">
                    <div>
                      <small>{t.clearance}</small>
                      <strong>
                        ≥ {formatClearance(route.clearance, unit)}
                      </strong>
                    </div>
                    <div>
                      <small>{t.progress}</small>
                      <strong>
                        {Number(route.explored ?? 0).toLocaleString(locale)}
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <p>{status ? t[status] : t.noRouteYet}</p>
              )}
            </div>
            <p className="scope-note">{t.scope}</p>
          </section>
          <footer className="side-footer">
            <button onClick={save} disabled={invalidDraft}>
              ↓ {t.save}
            </button>
            <button onClick={() => file.current?.click()}>↑ {t.open}</button>
            <button onClick={exportSheet} disabled={!route || invalidDraft}>
              ⇧ {t.export}
            </button>
            <input
              ref={file}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                e.target.value = "";
                openFile(selectedFile);
              }}
            />
          </footer>
          {autosaveStatus && (
            <p className={`autosave-status ${autosaveStatus}`} role="status">
              {
                t[
                  autosaveStatus === "unavailable"
                    ? "autosaveUnavailable"
                    : autosaveStatus === "restored"
                      ? "autosaveRestored"
                      : "autosaved"
                ]
              }
            </p>
          )}
        </aside>
        <section className="main-panel">
          <div className="canvas-head">
            <div>
              <span className="eyebrow">
                {t.measuredInterior} /{" "}
                {unit === "cm"
                  ? t.unitCm.toUpperCase()
                  : t.unitIn.toUpperCase()}
              </span>
              <h2>
                {presetIndex >= 0 ? presetLabel(project.name) : project.name}
              </h2>
            </div>
            <div className="measure-chip" role="group" aria-label={t.floor}>
              ⌖{" "}
              <span>
                {label(W)} × {label(H)}
              </span>
            </div>
            <button
              className="quick-find"
              onClick={busy ? cancel : startSearch}
              disabled={!busy && invalidDraft}
            >
              {busy ? t.cancel : t.find}
            </button>
            <button
              className="mobile-measure"
              aria-expanded={mobileOpen}
              aria-controls="measurements-panel"
              ref={measureOpener}
              onClick={() => {
                if (!mobileOpen) setMobileOpen(true);
                else setMobileOpen(false);
              }}
            >
              ☷ {t.menu}
            </button>
          </div>
          <p className="canvas-status" role="status">
            {invalidDraft
              ? t.correctMeasurements
              : route && (status === "verified" || !status)
                ? t.routeReady
                : status
                  ? t[status]
                  : t.noRouteYet}
          </p>
          <div className="canvas-wrap">
            <Floorplan
              svgRef={canvas}
              project={project}
              route={route}
              pose={pose}
              unit={unit}
              locale={locale}
              selection={selection}
              setSelection={setSelection}
              mode={mode}
              setMode={setMode}
              label={label}
              change={change}
              beginDrag={historyState.beginGroup}
              endDrag={historyState.endGroup}
            />
          </div>
          <div className="transport">
            <div className="transport-top">
              <span className="transport-label">
                {route ? t.routeReady : t.noRouteYet}
              </span>
              <div className="pose-readout">
                <span>
                  {t.angle} <b>{((pose.angle * 180) / Math.PI).toFixed(1)}°</b>
                </span>
                <span>
                  {t.clearance}{" "}
                  <b>
                    {route
                      ? `≥ ${formatClearance(route.clearance, unit)}`
                      : "—"}
                  </b>
                </span>
              </div>
            </div>
            <div className="transport-controls">
              <button
                className="play-btn"
                onClick={() => {
                  if (route) {
                    if (progress >= 1) setProgress(0);
                    setPlaying(!playing);
                  }
                }}
                disabled={!route || invalidDraft}
                aria-label={playing ? t.pause : t.play}
              >
                {playing ? "Ⅱ" : "▶"}
              </button>
              <input
                aria-label={t.routePosition}
                type="range"
                min="0"
                max="1000"
                value={progress * 1000}
                disabled={!route}
                onChange={(e) => {
                  setPlaying(false);
                  setProgress(Number(e.target.value) / 1000);
                }}
              />
              <span className="progress-number">
                {Math.round(progress * 100)}%
              </span>
              <button
                className="sheet-btn"
                disabled={!route}
                onClick={exportSheet}
              >
                ⇧ <span>SVG</span>
              </button>
            </div>
            <div className="time-track">
              <span>0.0</span>
              <div>
                <i style={{ left: `${progress * 100}%` }} />
              </div>
              <span>
                {route
                  ? t.poseCount.replace(
                      "{count}",
                      route.poses.length.toLocaleString(locale),
                    )
                  : ""}
              </span>
            </div>
          </div>
          <div className="canvas-foot">
            <span>
              <i className="legend-wall" />
              {t.fixedStructure}
            </span>
            <span>
              <i className="legend-furniture" />
              {t.furnitureFootprint}
            </span>
            <span>
              <i className="legend-route" />
              {t.certifiedRoute}
            </span>
            <span className="foot-right">
              {t.measurementsIn} {unit === "cm" ? t.unitCm : t.unitIn},{" "}
              {t.storedCm}
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
