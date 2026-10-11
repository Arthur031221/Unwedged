import React, { useState } from "react";
import { LIMITS, type Pose, type Project, type Route } from "../core/schema";
import { editRect } from "../core/editor";
import { expanded } from "../core/geometry";
import { messages, type Locale } from "../locales";

type Mode = "select" | "wall" | "start" | "goal";
type Props = {
  svgRef?: React.Ref<SVGSVGElement>;
  project: Project;
  route: Route | null;
  pose: Pose;
  unit: "cm" | "in";
  locale: Locale;
  selection: string;
  setSelection: (value: string) => void;
  mode: Mode;
  setMode: (value: Mode) => void;
  label: (cm: number) => string;
  change: (fn: (project: Project) => Project) => void;
  beginDrag: () => void;
  endDrag: () => void;
};

export function Floorplan({
  svgRef,
  project,
  route,
  pose,
  unit,
  locale,
  selection,
  setSelection,
  mode,
  setMode,
  label,
  change,
  beginDrag,
  endDrag,
}: Props) {
  const t = messages[locale];
  const rects = project.rects;
  const W = project.floor.width;
  const H = project.floor.height;
  const margin = 34;
  const viewW = 760;
  const viewH = Math.max(440, Math.min(620, (760 * H) / W));
  const s = Math.min((viewW - 2 * margin) / W, (viewH - 2 * margin) / H);
  const ox = (viewW - W * s) / 2;
  const oy = (viewH - H * s) / 2;
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => viewH - oy - y * s;
  const [dragging, setDragging] = useState<{
    id: string;
    dx: number;
    dy: number;
  } | null>(null);
  const worldPoint = (e: React.PointerEvent<SVGElement>) => {
    const target = e.currentTarget as SVGGraphicsElement | SVGSVGElement;
    const svg =
      target instanceof SVGSVGElement ? target : target.ownerSVGElement!;
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      matrix.inverse(),
    );
    const bounded = (value: number) =>
      Math.max(-LIMITS.coordinate, Math.min(LIMITS.coordinate, value));
    return {
      x: bounded((point.x - ox) / s),
      y: bounded((viewH - point.y - oy) / s),
    };
  };
  const pointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode === "select") return;
    const world = worldPoint(e);
    if (mode === "start" || mode === "goal") {
      change((p) => ({ ...p, [mode]: { ...p[mode], ...world } }));
      setMode("select");
      return;
    }
    if (mode === "wall") {
      if (project.rects.length >= LIMITS.rectangles) return;
      let number = 1;
      while (project.rects.some((rect) => rect.id === `obstacle-${number}`))
        number += 1;
      const id = `obstacle-${number}`;
      change((p) => ({
        ...p,
        rects: [
          ...p.rects,
          {
            id,
            x: world.x,
            y: world.y,
            width: 64,
            height: 18,
            kind: "obstacle",
          },
        ],
      }));
      setSelection(id);
      setMode("select");
    }
  };
  const corners = (p: Pose, l: number, w: number) => {
    const c = Math.cos(p.angle);
    const sn = Math.sin(p.angle);
    return [
      [-l / 2, -w / 2],
      [l / 2, -w / 2],
      [l / 2, w / 2],
      [-l / 2, w / 2],
    ]
      .map(
        ([x, y]) => `${X(p.x + x! * c - y! * sn)},${Y(p.y + x! * sn + y! * c)}`,
      )
      .join(" ");
  };
  const path = route?.poses.map((q) => `${X(q.x)},${Y(q.y)}`).join(" ");
  return (
    <svg
      ref={svgRef}
      className={`floorplan ${mode !== "select" ? "placing" : ""}`}
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="img"
      tabIndex={0}
      aria-label={`${project.name}. ${mode === "wall" ? t.placeObstacle : mode === "start" ? t.setStartPose : mode === "goal" ? t.setDestinationPose : t.inspect}. ${t.keyboardFields}`}
      onPointerDown={pointer}
      onPointerMove={(e) => {
        if (dragging) {
          const q = worldPoint(e);
          change((p) => ({
            ...p,
            rects: p.rects.map((r) =>
              r.id === dragging.id
                ? editRect(r, { x: q.x - dragging.dx, y: q.y - dragging.dy })
                : r,
            ),
          }));
        }
      }}
      onPointerUp={() => {
        if (dragging) endDrag();
        setDragging(null);
      }}
      onPointerCancel={() => {
        if (dragging) endDrag();
        setDragging(null);
      }}
      onLostPointerCapture={() => {
        if (dragging) endDrag();
        setDragging(null);
      }}
    >
      <defs>
        <pattern
          id="grid"
          width={10 * s}
          height={10 * s}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${10 * s} 0 L 0 0 0 ${10 * s}`}
            fill="none"
            stroke="var(--grid)"
            strokeWidth=".7"
          />
        </pattern>
        <pattern
          id="minor"
          width={2 * s}
          height={2 * s}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${2 * s} 0 L 0 0 0 ${2 * s}`}
            fill="none"
            stroke="var(--grid-minor)"
            strokeWidth=".5"
          />
        </pattern>
      </defs>
      <rect
        x={ox}
        y={oy}
        width={W * s}
        height={H * s}
        fill="var(--plan)"
        stroke="var(--wall)"
        strokeWidth="4"
      />
      <rect x={ox} y={oy} width={W * s} height={H * s} fill="url(#minor)" />
      <rect x={ox} y={oy} width={W * s} height={H * s} fill="url(#grid)" />
      {Array.from({ length: Math.floor(W / 50) + 1 }, (_, i) => (
        <g key={`x${i}`} className="ruler-x">
          <line
            x1={X(i * 50)}
            x2={X(i * 50)}
            y1={oy - 6}
            y2={oy}
            stroke="var(--wall)"
          />
          <text x={X(i * 50)} y={oy - 12} textAnchor="middle">
            {unit === "cm" ? i * 50 : ((i * 50) / 2.54).toFixed(1)}
          </text>
        </g>
      ))}
      {Array.from({ length: Math.floor(H / 50) + 1 }, (_, i) => (
        <g key={`y${i}`} className="ruler-y">
          <line
            x1={ox - 6}
            x2={ox}
            y1={Y(i * 50)}
            y2={Y(i * 50)}
            stroke="var(--wall)"
          />
          <text x={ox - 12} y={Y(i * 50) + 3} textAnchor="end">
            {unit === "cm" ? i * 50 : ((i * 50) / 2.54).toFixed(1)}
          </text>
        </g>
      ))}
      {rects.map((r) => (
        <g
          key={r.id}
          className="wall-shape"
          onPointerDown={(e) => {
            e.stopPropagation();
            setSelection(r.id);
            if (mode === "select") {
              const q = worldPoint(
                e as unknown as React.PointerEvent<SVGSVGElement>,
              );
              if (document.activeElement instanceof HTMLElement)
                document.activeElement.blur();
              beginDrag();
              setDragging({ id: r.id, dx: q.x - r.x, dy: q.y - r.y });
              e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId);
            }
          }}
        >
          {expanded(r, project.furniture.height).map((part, index) => (
            <rect
              key={index}
              x={X(part.x - part.width / 2)}
              y={Y(part.y + part.height / 2)}
              width={part.width * s}
              height={part.height * s}
              fill={selection === r.id ? "var(--wall-selected)" : "var(--wall)"}
            />
          ))}
          <text
            x={X(r.x)}
            y={Y(r.y) + 4}
            textAnchor="middle"
            className="wall-label"
          >
            {r.id}
          </text>
          {r.door && project.furniture.height < r.door.height && (
            <g>
              <text
                x={X(r.x + (r.height > r.width ? 0 : (r.door.offset ?? 0)))}
                y={Y(r.y + (r.height > r.width ? (r.door.offset ?? 0) : 0)) - 8}
                textAnchor="middle"
                className="door-label"
              >
                {t.door} {label(r.door.width)} × {label(r.door.height)}
              </text>
            </g>
          )}
        </g>
      ))}
      {path && <polyline points={path} className="route-line" />}
      {route?.poses.map((q, i) => (
        <polygon
          key={i}
          points={corners(q, project.furniture.length, project.furniture.width)}
          className="route-ghost"
        />
      ))}
      <polygon
        points={corners(
          pose,
          project.furniture.length,
          project.furniture.width,
        )}
        className="furniture-shape"
      />
      <line
        x1={X(pose.x)}
        y1={Y(pose.y)}
        x2={X(pose.x + (Math.cos(pose.angle) * project.furniture.length) / 2)}
        y2={Y(pose.y + (Math.sin(pose.angle) * project.furniture.length) / 2)}
        className="pivot-line"
      />
      <path
        d={`M ${X(pose.x + 28)} ${Y(pose.y)} A ${28 * s} ${28 * s} 0 0 ${pose.angle >= 0 ? 0 : 1} ${X(pose.x + Math.cos(pose.angle) * 28)} ${Y(pose.y + Math.sin(pose.angle) * 28)}`}
        className="rotation-arc"
      />
      <circle cx={X(pose.x)} cy={Y(pose.y)} r="4" className="pivot" />
      <g className="pose-marker">
        <circle cx={X(project.start.x)} cy={Y(project.start.y)} r="8" />
        <text x={X(project.start.x)} y={Y(project.start.y) - 15}>
          {t.start}
        </text>
      </g>
      <g className="pose-marker goal-marker">
        <rect
          x={X(project.goal.x) - 6}
          y={Y(project.goal.y) - 6}
          width="12"
          height="12"
        />
        <text x={X(project.goal.x)} y={Y(project.goal.y) - 15}>
          {t.destination}
        </text>
      </g>
      <text x={ox + 8} y={oy + 18} className="axis-label">
        X / {unit === "cm" ? "CM" : "IN"}
      </text>
      <text
        x={ox + W * s - 8}
        y={oy + H * s - 9}
        textAnchor="end"
        className="axis-label"
      >
        {t.north} ↑
      </text>
    </svg>
  );
}
