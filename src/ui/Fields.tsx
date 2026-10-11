import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LIMITS, type Project } from "../core/schema";
import { editRect } from "../core/editor";
import { messages, type Locale } from "../locales";

const formatValue = (n: number) =>
  String(Number(Number.isFinite(n) ? n.toFixed(2) : 0));

type DraftContextValue = {
  invalidDraft: boolean;
  pendingDraft: boolean;
  draftVersion: number;
  resetVersion: number;
  markEdited: (id: string) => void;
  clearPending: (id: string) => void;
  setInvalid: (id: string, invalid: boolean) => void;
  resetDrafts: () => void;
};
const DraftContext = createContext<DraftContextValue | null>(null);

export function NumericDraftProvider({ children }: { children: ReactNode }) {
  const [invalid, setInvalidState] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [draftVersion, setDraftVersion] = useState(0);
  const [resetVersion, setResetVersion] = useState(0);
  const markEdited = useCallback((id: string) => {
    setPending((previous) => {
      if (previous.has(id)) return previous;
      const next = new Set(previous);
      next.add(id);
      return next;
    });
    setDraftVersion((version) => version + 1);
  }, []);
  const clearPending = useCallback((id: string) => {
    setPending((previous) => {
      if (!previous.has(id)) return previous;
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  }, []);
  const setInvalid = useCallback((id: string, value: boolean) => {
    setInvalidState((previous) => {
      if (previous.has(id) === value) return previous;
      const next = new Set(previous);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const resetDrafts = useCallback(() => {
    setInvalidState(new Set());
    setPending(new Set());
    setResetVersion((version) => version + 1);
  }, []);
  const value = useMemo(
    () => ({
      invalidDraft: invalid.size > 0,
      pendingDraft: pending.size > 0,
      draftVersion,
      resetVersion,
      markEdited,
      clearPending,
      setInvalid,
      resetDrafts,
    }),
    [
      invalid.size,
      pending.size,
      draftVersion,
      resetVersion,
      markEdited,
      clearPending,
      setInvalid,
      resetDrafts,
    ],
  );
  return (
    <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
  );
}

export function useNumericDrafts() {
  const context = useContext(DraftContext);
  if (!context) throw new Error("Numeric fields need NumericDraftProvider");
  return context;
}

export function Field({
  label,
  value,
  onChange,
  unit,
  help,
  min,
  max,
  validate,
  rangeMessage,
  emptyMessage,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit: string;
  help?: string;
  min?: number;
  max?: number;
  validate?: (n: number) => string | undefined;
  rangeMessage: string;
  emptyMessage: string;
}) {
  const [draft, setDraft] = useState(() => formatValue(value));
  const [error, setError] = useState(false);
  const editing = useRef(false);
  const touched = useRef(false);
  const previousUnit = useRef(unit);
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const { markEdited, clearPending, setInvalid, resetVersion } =
    useNumericDrafts();
  const previousReset = useRef(resetVersion);
  const resetDraft = useCallback(() => {
    editing.current = false;
    touched.current = false;
    setDraft(formatValue(value));
    setError(false);
    clearPending(inputId);
    setInvalid(inputId, false);
  }, [value, inputId, clearPending, setInvalid]);

  useEffect(() => {
    const forced =
      previousUnit.current !== unit || previousReset.current !== resetVersion;
    previousUnit.current = unit;
    previousReset.current = resetVersion;
    if (forced || !editing.current) resetDraft();
  }, [unit, resetVersion, resetDraft]);
  useEffect(
    () => () => {
      clearPending(inputId);
      setInvalid(inputId, false);
    },
    [inputId, clearPending, setInvalid],
  );

  const check = (raw: string) => {
    if (!raw.trim()) return emptyMessage;
    const number = Number(raw);
    const rangeError = rangeMessage
      .replace(
        "{min}",
        min === undefined ? "−∞" : formatValue(Math.ceil(min * 100) / 100),
      )
      .replace(
        "{max}",
        max === undefined ? "∞" : formatValue(Math.floor(max * 100) / 100),
      )
      .replace("{unit}", unit);
    if (!Number.isFinite(number)) return rangeError;
    if (
      (min !== undefined && number < min) ||
      (max !== undefined && number > max)
    )
      return rangeError;
    return validate?.(number) ?? "";
  };
  const setDraftError = (raw: string) => {
    const nextError = check(raw);
    setError(!!nextError);
    setInvalid(inputId, !!nextError);
    return nextError;
  };
  const draftError = check(draft);
  useEffect(() => {
    if (error && !editing.current && !draftError) resetDraft();
  }, [draftError, error, resetDraft]);
  const commit = () => {
    if (!editing.current) return;
    editing.current = false;
    if (!touched.current || !draft.trim()) {
      resetDraft();
      return;
    }
    const nextError = setDraftError(draft);
    if (nextError) return;
    const number = Number(draft);
    onChange(number);
    setDraft(formatValue(number));
    clearPending(inputId);
    setInvalid(inputId, false);
    touched.current = false;
  };

  return (
    <label className={`field${error ? " field-invalid" : ""}`}>
      <span>{label}</span>
      <div>
        <input
          id={inputId}
          type="number"
          aria-label={label}
          aria-description={help ? `${unit}. ${help}` : unit}
          aria-invalid={!!error}
          aria-describedby={
            [help ? helpId : "", error ? errorId : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          step="0.1"
          value={draft}
          onFocus={() => {
            editing.current = true;
          }}
          onChange={(e) => {
            editing.current = true;
            if (!touched.current) {
              touched.current = true;
              markEdited(inputId);
            }
            const next = e.currentTarget.value;
            setDraft(next);
            setDraftError(next);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <small>{unit}</small>
      </div>
      {help && (
        <small className="field-help" id={helpId}>
          {help}
        </small>
      )}
      {error && (
        <small className="field-error" id={errorId}>
          {check(draft)}
        </small>
      )}
    </label>
  );
}

export function RectEditor({
  rect,
  unit,
  t,
  shown,
  update,
}: {
  rect: Project["rects"][number];
  unit: string;
  t: (typeof messages)[Locale];
  shown: (n: number) => number;
  update: (d: Partial<Project["rects"][number]>) => void;
}) {
  const conv = (v: number) => v * (unit === "in" ? 2.54 : 1);
  const d = rect.door ?? { width: 72, height: 198 };
  const length = Math.max(rect.width, rect.height);
  const min = unit === "in" ? 0.1 / 2.54 : 0.1;
  const maxDimension = shown(LIMITS.dimension);
  const coordinate = shown(LIMITS.coordinate);
  const changesDoor = (patch: Partial<Project["rects"][number]>) => {
    const next = editRect(rect, patch);
    return (
      !!rect.door &&
      (next.door?.width !== rect.door.width ||
        (next.door?.offset ?? 0) !== (rect.door.offset ?? 0))
    );
  };
  const doorConflict = (patch: Partial<Project["rects"][number]>) =>
    changesDoor(patch) ? t.measurementDoorConflict : undefined;
  return (
    <div className="door-editor">
      <span>{t.selectedObstacle}</span>
      <label className="select-label">
        {t.obstacleKind}
        <select
          value={rect.kind}
          onChange={(event) =>
            update({ kind: event.target.value as typeof rect.kind })
          }
        >
          <option value="obstacle">{t.solidObstacle}</option>
          <option value="wall">{t.wall}</option>
        </select>
      </label>
      <Field
        label="X"
        value={shown(rect.x)}
        unit={unit}
        min={-coordinate}
        max={coordinate}
        rangeMessage={t.measurementRange}
        emptyMessage={t.measurementRequired}
        onChange={(n) => update({ x: conv(n) })}
      />
      <Field
        label="Y"
        value={shown(rect.y)}
        unit={unit}
        min={-coordinate}
        max={coordinate}
        rangeMessage={t.measurementRange}
        emptyMessage={t.measurementRequired}
        onChange={(n) => update({ y: conv(n) })}
      />
      <Field
        label={t.width}
        value={shown(rect.width)}
        unit={unit}
        min={min}
        max={maxDimension}
        rangeMessage={t.measurementRange}
        emptyMessage={t.measurementRequired}
        validate={(n) => doorConflict({ width: conv(n) })}
        onChange={(n) => update({ width: conv(n) })}
      />
      <Field
        label={t.depth}
        value={shown(rect.height)}
        unit={unit}
        min={min}
        max={maxDimension}
        rangeMessage={t.measurementRange}
        emptyMessage={t.measurementRequired}
        validate={(n) => doorConflict({ height: conv(n) })}
        onChange={(n) => update({ height: conv(n) })}
      />
      {rect.kind === "wall" && (
        <>
          <label className="toggle door-toggle">
            <input
              type="checkbox"
              checked={!!rect.door}
              onChange={(event) =>
                update({ door: event.target.checked ? d : undefined })
              }
            />
            {t.doorway}
          </label>
          {rect.door && (
            <>
              <Field
                label={t.openingWidth}
                value={shown(d.width)}
                unit={unit}
                min={min}
                max={shown(
                  Math.min(length - 0.1, length - 2 * Math.abs(d.offset ?? 0)),
                )}
                rangeMessage={t.measurementRange}
                emptyMessage={t.measurementRequired}
                onChange={(n) => update({ door: { ...d, width: conv(n) } })}
              />
              <Field
                label={t.openingHeight}
                value={shown(d.height)}
                unit={unit}
                min={min}
                max={maxDimension}
                rangeMessage={t.measurementRange}
                emptyMessage={t.measurementRequired}
                onChange={(n) => update({ door: { ...d, height: conv(n) } })}
              />
              <Field
                label={t.openingOffset}
                value={shown(d.offset ?? 0)}
                unit={unit}
                min={shown(-(length - d.width) / 2)}
                max={shown((length - d.width) / 2)}
                help={t.openingOffsetHelp}
                rangeMessage={t.measurementRange}
                emptyMessage={t.measurementRequired}
                onChange={(n) => update({ door: { ...d, offset: conv(n) } })}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
