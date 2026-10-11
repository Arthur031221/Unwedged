import { LIMITS, type Rect } from "./schema";

const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

export function editRect(rect: Rect, patch: Partial<Rect>): Rect {
  const next = { ...rect, ...patch };
  next.x = clamp(next.x, -LIMITS.coordinate, LIMITS.coordinate);
  next.y = clamp(next.y, -LIMITS.coordinate, LIMITS.coordinate);
  next.width = clamp(next.width, 0.1, LIMITS.dimension);
  next.height = clamp(next.height, 0.1, LIMITS.dimension);
  if (next.kind !== "wall") delete next.door;
  if (next.door) {
    const length = Math.max(next.width, next.height);
    const end = Math.min(0.1, length / 2);
    next.door = {
      width: clamp(next.door.width, end, length - end),
      height: clamp(next.door.height, 0.1, LIMITS.dimension),
    };
  }
  return next;
}
