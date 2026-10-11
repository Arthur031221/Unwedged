import { useEffect, useRef, useState } from "react";
import { presets } from "./core/presets";
import { exportJson, routeSvg } from "./core/serialize";
import { LIMITS, type Project, type Route } from "./core/schema";
import { messages, localeNames, type Locale } from "./locales";
import { editRect } from "./core/editor";
import { shortAngle } from "./core/geometry";
import { formatClearance } from "./core/units";
import { Field, RectEditor } from "./ui/Fields";
import { Floorplan } from "./ui/Floorplan";
import { useRoutePlayback } from "./hooks/useRoutePlayback";
import { useWorkerTasks } from "./hooks/useWorkerTasks";
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
  const [project, setProject] = useState<Project>(structuredClone(presets[1]!));
  const [route, setRoute] = useState<Route | null>(null);
  const [status, setStatus] = useState<keyof typeof messages.en | "">("");
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
  const [offlineReady, setOfflineReady] = useState(false);
  const importGeneration = useRef(0);
  const projectRef = useRef(project);
  const routeRef = useRef<Route | null>(route);
  const file = useRef<HTMLInputElement>(null);
  const t = messages[locale];
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
  const invalidate = () => {
    importGeneration.current += 1;
    stopWork();
    routeRef.current = null;
    setRoute(null);
    setPlaying(false);
    setProgress(0);
    history.replaceState(null, "", location.pathname + location.search);
  };
  const change = (fn: (p: Project) => Project) => {
    invalidate();
    const next = fn(structuredClone(projectRef.current));
    projectRef.current = next;
    setProject(next);
    setStatus("");
  };
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
        projectRef.current = bundle.project;
        routeRef.current = bundle.route ?? null;
        setProject(bundle.project);
        setRoute(bundle.route ?? null);
        setStatus(bundle.route ? "verified" : "");
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
    const blob = new Blob(
      [exportJson(projectRef.current, routeRef.current ?? undefined)],
      {
        type: "application/json",
      },
    );
    download(blob, "unwedged-project.json");
  };
  const share = async () => {
    const b = btoa(
      unescape(
        encodeURIComponent(
          exportJson(projectRef.current, routeRef.current ?? undefined),
        ),
      ),
    );
    history.replaceState(null, "", `#${b}`);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(location.href);
        setStatus("copied");
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
    const currentRoute = routeRef.current;
    if (!currentRoute) return;
    download(
      new Blob(
        [
          routeSvg(projectRef.current, currentRoute, {
            caption: t.sheetCaption,
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
    invalidate();
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
          projectRef.current = bundle.project;
          routeRef.current = bundle.route ?? null;
          setProject(bundle.project);
          setRoute(bundle.route ?? null);
          setStatus(bundle.route ? "verified" : "");
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
      const clamp = (x: number, lo: number, hi: number) =>
        Math.min(hi, Math.max(lo, Number.isFinite(x) ? x : lo));
      let n = raw;
      if (key === "length" || key === "width" || key === "height")
        n = clamp(raw, 0.1, 2000);
      if (key === "margin") n = clamp(raw, 0, 100);
      if (key === "floorW")
        n = clamp(raw, 1, Math.min(2000, 2_000_000 / p.floor.height));
      if (key === "floorH")
        n = clamp(raw, 1, Math.min(2000, 2_000_000 / p.floor.width));
      if (key.startsWith("start") || key.startsWith("goal"))
        n = clamp(raw, -2000, 2000);
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
          <button className="share-btn" onClick={share}>
            ↗ <span>{t.share}</span>
          </button>
        </div>
      </header>
      <main className="workspace">
        <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
          <div className="side-head">
            <div>
              <span className="eyebrow">{t.fieldSheet}</span>
              <h1>{t.study}</h1>
            </div>
            <button
              className="mobile-close"
              aria-label={t.close}
              onClick={() => setMobileOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="step-tabs">
            <button
              className="active"
              onClick={() => setMobileOpen(!mobileOpen)}
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
                  onClick={() => setUnit("cm")}
                >
                  cm
                </button>
                <button
                  className={unit === "in" ? "picked" : ""}
                  onClick={() => setUnit("in")}
                >
                  in
                </button>
              </span>
            </div>
            <label className="select-label">
              {t.preset}
              <select
                value={presets.findIndex((x) => x.name === project.name)}
                onChange={(e) => {
                  const selectedPreset = structuredClone(
                    presets[Number(e.target.value)]!,
                  );
                  invalidate();
                  projectRef.current = selectedPreset;
                  setProject(selectedPreset);
                  setStatus("");
                }}
              >
                {presets.map((p, i) => (
                  <option value={i} key={p.name}>
                    {presetLabel(p.name)}
                  </option>
                ))}
              </select>
            </label>
            <div className="input-grid">
              <Field
                label={t.width}
                value={shown(project.floor.width)}
                onChange={(v) => f("floorW", v)}
                unit={unit}
              />
              <Field
                label={t.depth}
                value={shown(project.floor.height)}
                onChange={(v) => f("floorH", v)}
                unit={unit}
              />
            </div>
            <div className="tool-row" role="group" aria-label={t.canvasTools}>
              <button
                className={mode === "wall" ? "tool-active" : ""}
                disabled={rects.length >= LIMITS.rectangles}
                onClick={() => setMode(mode === "wall" ? "select" : "wall")}
              >
                ＋ {t.draw}
              </button>
              <button
                className={mode === "start" ? "tool-active" : ""}
                onClick={() => setMode(mode === "start" ? "select" : "start")}
              >
                ◎ {t.start}
              </button>
              <button
                className={mode === "goal" ? "tool-active" : ""}
                onClick={() => setMode(mode === "goal" ? "select" : "goal")}
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
              />
              <Field
                label={t.width}
                value={shown(project.furniture.width)}
                onChange={(v) => f("width", v)}
                unit={unit}
              />
              <Field
                label={t.height}
                value={shown(project.furniture.height)}
                onChange={(v) => f("height", v)}
                unit={unit}
              />
              <Field
                label={t.margin}
                value={shown(project.margin)}
                onChange={(v) => f("margin", v)}
                unit={unit}
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
                />
                <Field
                  label="Y"
                  value={shown(project.start.y)}
                  onChange={(v) => f("startY", v)}
                  unit={unit}
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
                />
              </fieldset>
              <fieldset>
                <legend>{t.destination}</legend>
                <Field
                  label="X"
                  value={shown(project.goal.x)}
                  onChange={(v) => f("goalX", v)}
                  unit={unit}
                />
                <Field
                  label="Y"
                  value={shown(project.goal.y)}
                  onChange={(v) => f("goalY", v)}
                  unit={unit}
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
                />
              </fieldset>
            </div>
          </section>
          <section className="form-section">
            <div className="section-title">
              <h2>{t.obstacles}</h2>
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
            <button onClick={save}>↓ {t.save}</button>
            <button onClick={() => file.current?.click()}>↑ {t.open}</button>
            <button onClick={exportSheet} disabled={!route}>
              ⇧ {t.export}
            </button>
            <input
              ref={file}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={(e) => openFile(e.target.files?.[0])}
            />
          </footer>
        </aside>
        <section className="main-panel">
          <div className="canvas-head">
            <div>
              <span className="eyebrow">
                {t.measuredInterior} / {t.unitCm.toUpperCase()}
              </span>
              <h2>{project.name}</h2>
            </div>
            <div className="measure-chip" role="group" aria-label={t.floor}>
              ⌖{" "}
              <span>
                {label(W)} × {label(H)}
              </span>
            </div>
            <button
              className="mobile-measure"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              ☷ {t.menu}
            </button>
          </div>
          <div className="canvas-wrap">
            <Floorplan
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
                disabled={!route}
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
              <span>{route ? `${route.poses.length} poses` : "—"}</span>
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
