import type { Pose, Project, Route } from "./schema";
import { validateProject } from "./schema";
import { shortAngle } from "./geometry";
import { checkEndpoint } from "./endpoints";
import { certifySegment, certifyPath, CERTIFICATION_BUDGET } from "./verify";
export type SearchOptions = {
  fine?: boolean;
  maxStates?: number;
  timeoutMs?: number;
  cancelled?: () => boolean;
  progress?: (n: number) => void;
};
type Node = {
  p: Pose;
  ix: number;
  iy: number;
  ia: number;
  g: number;
  f: number;
  parent: number;
};
class Heap {
  a: number[] = [];
  constructor(private ns: Node[]) {}
  push(i: number) {
    let k = this.a.push(i) - 1;
    while (k) {
      const p = (k - 1) >> 1;
      if (this.ns[this.a[p]!]!.f <= this.ns[i]!.f) break;
      this.a[k] = this.a[p]!;
      k = p;
    }
    this.a[k] = i;
  }
  pop() {
    const root = this.a[0]!;
    const last = this.a.pop()!;
    if (this.a.length) {
      let k = 0;
      while (k * 2 + 1 < this.a.length) {
        let c = k * 2 + 1;
        if (
          c + 1 < this.a.length &&
          this.ns[this.a[c + 1]!]!.f < this.ns[this.a[c]!]!.f
        )
          c++;
        if (this.ns[last]!.f <= this.ns[this.a[c]!]!.f) break;
        this.a[k] = this.a[c]!;
        k = c;
      }
      this.a[k] = last;
    }
    return root;
  }
  get size() {
    return this.a.length;
  }
}
const key = (x: number, y: number, a: number) => `${x},${y},${a}`;
export function solve(
  p: Project,
  o: SearchOptions = {},
):
  | { status: "found"; route: Route }
  | {
      status:
        | "timeout"
        | "cancelled"
        | "no-route"
        | "start-collision"
        | "goal-collision";
      explored: number;
    } {
  validateProject(p);
  if (
    (o.maxStates !== undefined &&
      (!Number.isInteger(o.maxStates) ||
        o.maxStates < 1 ||
        o.maxStates > 65000)) ||
    (o.timeoutMs !== undefined &&
      (!Number.isFinite(o.timeoutMs) ||
        o.timeoutMs <= 0 ||
        o.timeoutMs > 30000))
  )
    throw Error("Search limits are invalid");
  if (o.cancelled?.()) return { status: "cancelled", explored: 0 };
  const began = performance.now(),
    step = o.fine ? 5 : 10,
    as = o.fine ? Math.PI / 36 : Math.PI / 18,
    start = p.start,
    goal = p.goal,
    max = o.maxStates ?? 65000,
    deadline = began + (o.timeoutMs ?? 9000);
  const stopped = () => !!o.cancelled?.() || performance.now() > deadline;
  const segment = (a: Pose, b: Pose) =>
    certifySegment(a, b, p, 18, CERTIFICATION_BUDGET, stopped);
  if (checkEndpoint(start, p).issue)
    return { status: "start-collision", explored: 0 };
  if (checkEndpoint(goal, p).issue)
    return { status: "goal-collision", explored: 0 };
  const direct = segment(start, goal);
  if (stopped())
    return { status: o.cancelled?.() ? "cancelled" : "timeout", explored: 0 };
  if (direct.ok) {
    return {
      status: "found",
      route: {
        poses: [start, goal],
        clearance: direct.clearance,
        explored: 0,
        elapsedMs: performance.now() - began,
        step,
        angleStep: as,
        verified: true,
      },
    };
  }
  const nodes: Node[] = [
      { p: start, ix: 0, iy: 0, ia: 0, g: 0, f: 0, parent: -1 },
    ],
    heap = new Heap(nodes),
    best = new Map<string, number>([[key(0, 0, 0), 0]]);
  heap.push(0);
  const stride = Math.max(1, Math.floor((Math.PI * 2) / as));
  const h = (q: Pose) =>
    Math.hypot(goal.x - q.x, goal.y - q.y) +
    Math.min(1, p.furniture.length / 2) *
      Math.abs(shortAngle(q.angle, goal.angle));
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  let explored = 0,
    last = performance.now();
  while (heap.size && explored < max) {
    if (o.cancelled?.()) return { status: "cancelled", explored };
    if (performance.now() > deadline) return { status: "timeout", explored };
    const ni = heap.pop()!,
      n = nodes[ni]!;
    if (best.get(key(n.ix, n.iy, n.ia)) !== n.g) continue;
    explored++;
    if (explored % 100 === 0 && performance.now() - last > 100) {
      o.progress?.(explored);
      last = performance.now();
    }
    const goalNear =
      Math.hypot(n.p.x - goal.x, n.p.y - goal.y) <= step * 1.5 &&
      Math.abs(shortAngle(n.p.angle, goal.angle)) <= as * 1.5;
    if (goalNear && segment(n.p, goal).ok) {
      const ids: number[] = [];
      for (let z = ni; z >= 0; z = nodes[z]!.parent) ids.push(z);
      const path = ids.reverse().map((i) => nodes[i]!.p);
      path.push(goal);
      let changed = true;
      while (changed && path.length > 2) {
        changed = false;
        for (let i = 0; i < path.length - 2; i++)
          if (segment(path[i]!, path[i + 2]!).ok) {
            path.splice(i + 1, 1);
            changed = true;
            break;
          }
      }
      const cert = certifyPath(path, p, CERTIFICATION_BUDGET, stopped);
      if (cert.ok)
        return {
          status: "found",
          route: {
            poses: path,
            clearance: cert.clearance,
            explored,
            elapsedMs: performance.now() - began,
            step,
            angleStep: as,
            verified: true,
          },
        };
    }
    const candidates: Pose[] = [];
    for (const [dx, dy] of dirs)
      candidates.push({
        x: n.p.x + dx * step,
        y: n.p.y + dy * step,
        angle: n.p.angle,
      });
    for (const da of [-1, 1])
      candidates.push({ x: n.p.x, y: n.p.y, angle: n.p.angle + da * as });
    for (const q of candidates) {
      if (stopped())
        return { status: o.cancelled?.() ? "cancelled" : "timeout", explored };
      const ix = Math.round((q.x - start.x) / step),
        iy = Math.round((q.y - start.y) / step),
        ia = Math.round(shortAngle(start.angle, q.angle) / as);
      if (
        q.x < 0 ||
        q.y < 0 ||
        q.x > p.floor.width ||
        q.y > p.floor.height ||
        Math.abs(ia) > stride / 2
      )
        continue;
      const k = key(ix, iy, ia),
        g =
          n.g +
          Math.hypot(q.x - n.p.x, q.y - n.p.y) +
          Math.abs(shortAngle(q.angle, n.p.angle)) * p.furniture.length * 0.1;
      if ((best.get(k) ?? Infinity) <= g) continue;
      if (!segment(n.p, q).ok) continue;
      best.set(k, g);
      const node: Node = { p: q, ix, iy, ia, g, f: g + h(q), parent: ni };
      nodes.push(node);
      heap.push(nodes.length - 1);
    }
  }
  return {
    status: o.cancelled?.()
      ? "cancelled"
      : performance.now() > deadline || explored >= max
        ? "timeout"
        : "no-route",
    explored,
  };
}
