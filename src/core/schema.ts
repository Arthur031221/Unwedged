export type Pose = { x: number; y: number; angle: number };
export type Rect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: "wall" | "obstacle";
  door?: { width: number; height: number; offset?: number };
};
export type Furniture = { length: number; width: number; height: number };
export type Project = {
  schemaVersion: 1 | 2;
  name: string;
  floor: { width: number; height: number };
  furniture: Furniture;
  margin: number;
  start: Pose;
  goal: Pose;
  rects: Rect[];
};
export type Route = {
  poses: Pose[];
  clearance: number;
  explored: number;
  elapsedMs: number;
  step: number;
  angleStep: number;
  verified: true;
};
export const LIMITS = {
  dimension: 2000,
  rectangles: 100,
  area: 2_000_000,
  margin: 100,
  jsonBytes: 1_000_000,
  coordinate: 2000,
  routePoses: 512,
} as const;
const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n);
export function validateProject(p: unknown): asserts p is Project {
  if (!p || typeof p !== "object") throw Error("Project must be an object");
  const d = p as Project;
  if (
    ![1, 2].includes(d.schemaVersion) ||
    typeof d.name !== "string" ||
    d.name.length > 100
  )
    throw Error("Unsupported project schema");
  if (
    !d.floor ||
    !finite(d.floor.width) ||
    !finite(d.floor.height) ||
    d.floor.width <= 0 ||
    d.floor.height <= 0 ||
    d.floor.width > LIMITS.dimension ||
    d.floor.height > LIMITS.dimension ||
    d.floor.width * d.floor.height > LIMITS.area
  )
    throw Error("Floor dimensions are outside supported limits");
  if (
    !d.furniture ||
    ![
      d.furniture.length,
      d.furniture.width,
      d.furniture.height,
      d.margin,
    ].every(finite) ||
    d.furniture.length <= 0 ||
    d.furniture.width <= 0 ||
    d.furniture.height <= 0 ||
    d.furniture.length > LIMITS.dimension ||
    d.furniture.width > LIMITS.dimension ||
    d.furniture.height > LIMITS.dimension ||
    d.margin < 0 ||
    d.margin > LIMITS.margin
  )
    throw Error("Furniture or margin measurements are invalid");
  for (const q of [d.start, d.goal])
    if (
      !q ||
      ![q.x, q.y, q.angle].every(finite) ||
      Math.abs(q.x) > LIMITS.coordinate ||
      Math.abs(q.y) > LIMITS.coordinate ||
      Math.abs(q.angle) > 1e6
    )
      throw Error("Pose coordinates are invalid");
  if (!Array.isArray(d.rects) || d.rects.length > LIMITS.rectangles)
    throw Error("Obstacle count exceeds limit");
  const ids = new Set<string>();
  for (const r of d.rects)
    if (
      !r ||
      typeof r.id !== "string" ||
      r.id.length === 0 ||
      r.id.length > 80 ||
      ids.has(r.id) ||
      !["wall", "obstacle"].includes(r.kind) ||
      ![r.x, r.y, r.width, r.height].every(finite) ||
      r.width <= 0 ||
      r.height <= 0 ||
      r.width > LIMITS.dimension ||
      r.height > LIMITS.dimension ||
      Math.abs(r.x) > LIMITS.coordinate ||
      Math.abs(r.y) > LIMITS.coordinate ||
      (r.door &&
        (!finite(r.door.width) ||
          !finite(r.door.height) ||
          r.door.width <= 0 ||
          r.door.width >= Math.max(r.width, r.height) ||
          r.door.height <= 0 ||
          r.door.height > LIMITS.dimension ||
          (r.door.offset !== undefined &&
            (!finite(r.door.offset) ||
              Math.abs(r.door.offset) >
                (Math.max(r.width, r.height) - r.door.width) / 2 ||
              (r.door.offset !== 0 && d.schemaVersion !== 2)))))
    )
      throw Error("Obstacle geometry is invalid");
    else ids.add(r.id);
}
