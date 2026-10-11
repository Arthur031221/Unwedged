import { LIMITS, validateProject, type Rect } from "./schema";
import type { Project } from "./schema";

const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

export function editRect(rect: Rect, patch: Partial<Rect>): Rect {
  const next = { ...rect, ...patch };
  next.x = clamp(next.x, -LIMITS.coordinate, LIMITS.coordinate);
  next.y = clamp(next.y, -LIMITS.coordinate, LIMITS.coordinate);
  if (patch.width !== undefined)
    next.width = clamp(next.width, 0.1, LIMITS.dimension);
  if (patch.height !== undefined)
    next.height = clamp(next.height, 0.1, LIMITS.dimension);
  if (next.kind !== "wall") delete next.door;
  if (next.door) {
    // Imported jambs may be narrower than the minimum used for new openings.
    const length = Math.max(next.width, next.height);
    const end = Math.min(0.1, length / 2);
    const resized = length !== Math.max(rect.width, rect.height);
    next.door = { ...next.door };
    if (next.door.width !== rect.door?.width)
      next.door.width = clamp(next.door.width, end, length - end);
    else if (resized && next.door.width >= length)
      next.door.width = length - end;
    if (next.door.height !== rect.door?.height)
      next.door.height = clamp(next.door.height, 0.1, LIMITS.dimension);
    if (
      resized ||
      next.door.width !== rect.door?.width ||
      next.door.offset !== rect.door?.offset
    ) {
      const offset = clamp(
        next.door.offset ?? 0,
        -(length - next.door.width) / 2,
        (length - next.door.width) / 2,
      );
      if (offset !== (next.door.offset ?? 0)) next.door.offset = offset;
    }
  }
  return next;
}

export function createEmptyProject(name: string): Project {
  const project: Project = {
    schemaVersion: 1,
    name,
    floor: { width: 500, height: 300 },
    furniture: { length: 150, width: 70, height: 70 },
    margin: 2,
    start: { x: 100, y: 150, angle: 0 },
    goal: { x: 400, y: 150, angle: 0 },
    rects: [],
  };
  validateProject(project);
  return project;
}

export function createObstacle(project: Project): Rect {
  let number = 1;
  while (project.rects.some((rect) => rect.id === `obstacle-${number}`))
    number += 1;
  return {
    id: `obstacle-${number}`,
    x: project.floor.width / 2,
    y: project.floor.height / 2,
    width: Math.min(64, project.floor.width),
    height: Math.min(18, project.floor.height),
    kind: "obstacle",
  };
}
