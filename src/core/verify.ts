import type { Pose, Project } from "./schema";
import { clearance, EPS, lerpPose, shortAngle } from "./geometry";
export type Cert = {
  ok: boolean;
  clearance: number;
  intervals: number;
  reason?: string;
};
export const CERTIFICATION_BUDGET = 131072;
export function certifySegment(
  a: Pose,
  b: Pose,
  p: Project,
  maxDepth = 18,
  budget = CERTIFICATION_BUDGET,
  stopped?: () => boolean,
): Cert {
  let intervals = 0;
  const threshold = p.margin + EPS;
  function visit(t0: number, t1: number, depth: number): number | null {
    if (++intervals > budget || stopped?.()) return null;
    const pa = lerpPose(a, b, t0),
      pb = lerpPose(a, b, t1),
      m = lerpPose(pa, pb, 0.5),
      R = Math.hypot(p.furniture.length / 2, p.furniture.width / 2),
      B =
        Math.hypot(pb.x - pa.x, pb.y - pa.y) / 2 +
        2 * R * Math.sin(Math.abs(shortAngle(pa.angle, pb.angle)) / 4),
      cm = clearance(m, p);
    if (cm <= threshold) return null;
    if (cm - B > threshold) return cm - B;
    if (depth >= maxDepth) return null;
    const mid = (t0 + t1) / 2,
      l = visit(t0, mid, depth + 1);
    if (l === null) return null;
    const r = visit(mid, t1, depth + 1);
    return r === null ? null : Math.min(l, r);
  }
  const c = visit(0, 1, 0);
  return c === null
    ? {
        ok: false,
        clearance: 0,
        intervals,
        reason: intervals > budget ? "budget" : "uncertified",
      }
    : { ok: true, clearance: c, intervals };
}
export function certifyPath(
  path: Pose[],
  p: Project,
  budget = CERTIFICATION_BUDGET,
  stopped?: () => boolean,
): Cert {
  if (path.length === 0)
    return { ok: false, clearance: 0, intervals: 0, reason: "empty" };
  let low = Infinity,
    n = 0;
  for (let i = 0; i < path.length; i++) {
    if (stopped?.())
      return { ok: false, clearance: 0, intervals: n, reason: "stopped" };
    const point = clearance(path[i]!, p);
    if (point <= p.margin + EPS)
      return {
        ok: false,
        clearance: 0,
        intervals: n,
        reason:
          i === 0
            ? "start-collision"
            : i === path.length - 1
              ? "goal-collision"
              : "pose-collision",
      };
    low = Math.min(low, point);
    if (i) {
      const c = certifySegment(
        path[i - 1]!,
        path[i]!,
        p,
        18,
        budget - n,
        stopped,
      );
      n += c.intervals;
      if (!c.ok) return { ...c, intervals: n };
      low = Math.min(low, c.clearance);
    }
  }
  return { ok: true, clearance: low, intervals: n };
}
