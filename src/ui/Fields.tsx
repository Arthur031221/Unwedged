import { useEffect, useRef, useState } from "react";
import type { Project } from "../core/schema";
import { messages, type Locale } from "../locales";

const formatValue = (n: number) =>
  String(Number.isFinite(n) ? Number(n.toFixed(2)) : 0);

export function Field({
  label,
  value,
  onChange,
  unit,
  help,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit: string;
  help?: string;
}) {
  const [draft, setDraft] = useState(() => formatValue(value));
  const editing = useRef(false);
  const previousUnit = useRef(unit);

  useEffect(() => {
    if (previousUnit.current !== unit) {
      previousUnit.current = unit;
      setDraft(formatValue(value));
    } else if (!editing.current) {
      setDraft(formatValue(value));
    }
  }, [unit, value]);

  const normalize = () => {
    editing.current = false;
    setDraft(formatValue(value));
  };

  return (
    <label className="field">
      <span>{label}</span>
      <div>
        <input
          type="number"
          aria-label={label}
          aria-description={help ? `${unit}. ${help}` : unit}
          step="0.1"
          value={draft}
          onFocus={() => {
            editing.current = true;
          }}
          onChange={(e) => {
            editing.current = true;
            const next = e.currentTarget.value;
            setDraft(next);
            if (next.trim() === "") return;
            const number = Number(next);
            if (Number.isFinite(number)) onChange(number);
          }}
          onBlur={normalize}
          onKeyDown={(e) => {
            if (e.key === "Enter") normalize();
          }}
        />
        <small>{unit}</small>
      </div>
      {help && <small className="field-help">{help}</small>}
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
  const conv = (v: number) => v * (unit === "in" ? 2.54 : 1),
    d = rect.door ?? { width: 72, height: 198 };
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
        onChange={(n) => update({ x: conv(n) })}
      />
      <Field
        label="Y"
        value={shown(rect.y)}
        unit={unit}
        onChange={(n) => update({ y: conv(n) })}
      />
      <Field
        label={t.width}
        value={shown(rect.width)}
        unit={unit}
        onChange={(n) => update({ width: conv(n) })}
      />
      <Field
        label={t.depth}
        value={shown(rect.height)}
        unit={unit}
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
                onChange={(n) => update({ door: { ...d, width: conv(n) } })}
              />
              <Field
                label={t.openingHeight}
                value={shown(d.height)}
                unit={unit}
                onChange={(n) => update({ door: { ...d, height: conv(n) } })}
              />
              <Field
                label={t.openingOffset}
                value={shown(d.offset ?? 0)}
                unit={unit}
                help={t.openingOffsetHelp}
                onChange={(n) => update({ door: { ...d, offset: conv(n) } })}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
