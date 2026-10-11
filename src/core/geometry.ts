import type { Pose, Project, Rect } from "./schema";
export const EPS = 1e-7;
export const shortAngle = (a: number, b: number) =>
  Math.atan2(Math.sin(b - a), Math.cos(b - a));
export const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  angle: a.angle + shortAngle(a.angle, b.angle) * t,
});
export function corners(p: Pose, l: number, w: number) {
  const c = Math.cos(p.angle),
    s = Math.sin(p.angle);
  return [
    [-l / 2, -w / 2],
    [l / 2, -w / 2],
    [l / 2, w / 2],
    [-l / 2, w / 2],
  ].map(
    ([x, y]) =>
      [p.x + x! * c - y! * s, p.y + x! * s + y! * c] as [number, number],
  );
}
const edges = (v: [number, number][]) =>
  v.map((p, i) => [p, v[(i + 1) % v.length]] as const);
const dot = (a: [number, number], b: [number, number]) =>
  a[0] * b[0] + a[1] * b[1];
function sat(a: [number, number][], b: [number, number][]) {
  for (const poly of [a, b])
    for (const [u, v] of edges(poly)) {
      const ax = -(v[1] - u[1]),
        ay = v[0] - u[0];
      const ap = a.map((p) => p[0] * ax + p[1] * ay),
        bp = b.map((p) => p[0] * ax + p[1] * ay);
      if (
        Math.max(...ap) < Math.min(...bp) - EPS ||
        Math.max(...bp) < Math.min(...ap) - EPS
      )
        return false;
    }
  return true;
}
const dist2 = (a: [number, number], b: [number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);
function pointSeg(
  p: [number, number],
  a: [number, number],
  b: [number, number],
) {
  const ab: [number, number] = [b[0] - a[0], b[1] - a[1]],
    ap: [number, number] = [p[0] - a[0], p[1] - a[1]],
    den = dot(ab, ab);
  const t = den ? Math.max(0, Math.min(1, dot(ap, ab) / den)) : 0;
  return dist2(p, [a[0] + ab[0] * t, a[1] + ab[1] * t]);
}
function orient(a: [number, number], b: [number, number], c: [number, number]) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function segdist(
  a: [number, number],
  b: [number, number],
  c: [number, number],
  d: [number, number],
) {
  if (
    orient(a, b, c) * orient(a, b, d) < 0 &&
    orient(c, d, a) * orient(c, d, b) < 0
  )
    return 0;
  return Math.min(
    pointSeg(a, c, d),
    pointSeg(b, c, d),
    pointSeg(c, a, b),
    pointSeg(d, a, b),
  );
}
function rectPoly(r: Rect): [number, number][] {
  return [
    [r.x - r.width / 2, r.y - r.height / 2],
    [r.x + r.width / 2, r.y - r.height / 2],
    [r.x + r.width / 2, r.y + r.height / 2],
    [r.x - r.width / 2, r.y + r.height / 2],
  ];
}
export function expanded(rect: Rect, furnitureHeight: number): Rect[] {
  if (!rect.door) return [rect];
  const vertical = rect.height > rect.width,
    span = vertical ? rect.height : rect.width,
    gap =
      furnitureHeight >= rect.door.height ? 0 : Math.min(span, rect.door.width);
  if (gap <= 0) return [rect];
  const rem = (span - gap) / 2;
  if (rem <= 0) return [];
  return vertical
    ? [
        {
          ...rect,
          id: rect.id + ":A",
          height: rem,
          y: rect.y - gap / 2 - rem / 2,
        },
        {
          ...rect,
          id: rect.id + ":B",
          height: rem,
          y: rect.y + gap / 2 + rem / 2,
        },
      ]
    : [
        {
          ...rect,
          id: rect.id + ":A",
          width: rem,
          x: rect.x - gap / 2 - rem / 2,
        },
        {
          ...rect,
          id: rect.id + ":B",
          width: rem,
          x: rect.x + gap / 2 + rem / 2,
        },
      ];
}
export function clearance(p: Pose, project: Project) {
  const body = corners(p, project.furniture.length, project.furniture.width);
  let min = Math.min(
    ...body.map((v) => v[0]),
    ...body.map((v) => v[1]),
    project.floor.width - Math.max(...body.map((v) => v[0])),
    project.floor.height - Math.max(...body.map((v) => v[1])),
  );
  if (min <= EPS) return -Math.max(EPS, -min + EPS);
  for (const raw of project.rects)
    for (const r of expanded(raw, project.furniture.height)) {
      const box = rectPoly(r);
      if (sat(body, box)) return -EPS;
      for (const [a, b] of edges(body))
        for (const [c, d] of edges(box))
          min = Math.min(min, segdist(a, b, c, d));
    }
  return min;
}
