import { describe, expect, it } from "vitest";
import { clearance, lerpPose } from "./geometry";
import { presets } from "./presets";
import { solve } from "./search";
import { exportJson, importJson } from "./serialize";
import { validateProject } from "./schema";
import { certifySegment } from "./verify";
import { formatClearance } from "./units";

describe("route correctness regressions", () => {
  it("preserves a certified half-turn direction through save and import", () => {
    const p = structuredClone(presets[0]!);
    p.floor = { width: 500, height: 500 };
    p.furniture = { length: 100, width: 10, height: 10 };
    p.start = { x: 150, y: 250, angle: 3 * Math.PI };
    p.goal = { x: 350, y: 250, angle: 4 * Math.PI };
    p.rects = [
      { id: "corner", x: 165, y: 285, width: 6, height: 6, kind: "obstacle" },
    ];
    const result = solve(p);
    if (result.status !== "found")
      throw Error("Half-turn fixture did not solve");
    const imported = importJson(exportJson(p, result.route)).route!;
    expect(imported.poses).toEqual(result.route.poses);
    for (let step = 0; step <= 100; step += 1) {
      expect(
        clearance(
          lerpPose(imported.poses[0]!, imported.poses[1]!, step / 100),
          p,
        ),
      ).toBeGreaterThan(p.margin);
    }
  });
  it("reopens saved routes that require more than 16384 verification intervals", () => {
    const p = structuredClone(presets[0]!);
    p.rects = [];
    p.start.y = p.goal.y = 43.01;
    const result = solve(p);
    if (result.status !== "found")
      throw Error("Near-margin fixture did not solve");
    expect(certifySegment(p.start, p.goal, p).intervals).toBeGreaterThan(16384);
    expect(importJson(exportJson(p, result.route)).route?.verified).toBe(true);
  });

  it("never rounds a displayed conservative clearance upwards", () => {
    for (const cm of [0.099, 2.059, 5.09, 254.99]) {
      expect(parseFloat(formatClearance(cm))).toBeLessThanOrEqual(cm);
      expect(parseFloat(formatClearance(cm, "in")) * 2.54).toBeLessThanOrEqual(
        cm,
      );
    }
  });
  it("interrupts expensive near-margin subdivision at the search deadline", () => {
    const p = structuredClone(presets[0]!);
    p.start.y = p.goal.y = 43.0003;
    p.rects = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      x: 280,
      y: 250,
      width: 5,
      height: 5,
      kind: "obstacle",
    }));
    const began = performance.now();
    expect(solve(p, { timeoutMs: 100, maxStates: 2 }).status).toBe("timeout");
    expect(performance.now() - began).toBeLessThan(1500);
  });
  it("measures positive distance between separated collinear edges", () => {
    const p = structuredClone(presets[0]!);
    p.furniture = { length: 20, width: 10, height: 10 };
    p.rects = [
      { id: "box", x: 130, y: 100, width: 20, height: 10, kind: "obstacle" },
    ];
    expect(clearance({ x: 100, y: 100, angle: 0 }, p)).toBe(10);
  });
  it("searches beyond the initial pose to turn around a wall", () => {
    const p = presets[1]!;
    expect(certifySegment(p.start, p.goal, p).ok).toBe(false);
    const result = solve(p, { timeoutMs: 30000 });
    expect(result.status).toBe("found");
    if (result.status === "found") {
      expect(result.route.explored).toBeGreaterThan(0);
      expect(result.route.poses.length).toBeGreaterThan(2);
      expect(importJson(exportJson(p, result.route)).route?.verified).toBe(
        true,
      );
    }
  });
  it("rejects rotation that sweeps through an obstacle between free endpoints", () => {
    const p = structuredClone(presets[0]!);
    p.floor = { width: 500, height: 500 };
    p.furniture = { length: 100, width: 10, height: 10 };
    p.rects = [
      { id: "sweep", x: 285, y: 285, width: 6, height: 6, kind: "obstacle" },
    ];
    const a = { x: 250, y: 250, angle: 0 },
      b = { ...a, angle: Math.PI / 2 };
    expect(clearance(a, p)).toBeGreaterThan(p.margin);
    expect(clearance(b, p)).toBeGreaterThan(p.margin);
    expect(certifySegment(a, b, p).ok).toBe(false);
  });
  it("rejects short, mismatched, null and oversized imported route data", () => {
    const p = presets[0]!;
    const result = solve(p);
    if (result.status !== "found") throw Error("Fixture search failed");
    const valid = JSON.parse(exportJson(p, result.route));
    for (const poses of [
      [p.start],
      [p.start, p.start],
      [null, p.goal],
      Array(513).fill(p.start),
    ]) {
      expect(() =>
        importJson(
          JSON.stringify({ ...valid, route: { ...valid.route, poses } }),
        ),
      ).toThrow();
    }
    valid.route.elapsedMs = "forged";
    valid.route.explored = -10;
    valid.route.clearance = 999999;
    const imported = importJson(JSON.stringify(valid));
    expect(imported.route?.elapsedMs).toBe(0);
    expect(imported.route?.explored).toBe(0);
    expect(imported.route?.clearance).toBeLessThan(10);
  });
  it("rejects duplicate obstacle identities and out of range carrying heights", () => {
    const p = structuredClone(presets[0]!);
    p.rects.push({ ...p.rects[0]! });
    expect(() => validateProject(p)).toThrow();
    p.rects.pop();
    p.furniture.height = 2001;
    expect(() => validateProject(p)).toThrow();
  });
  it("honors cancellation and bounds invalid caller supplied search limits", () => {
    expect(solve(presets[0]!, { cancelled: () => true }).status).toBe(
      "cancelled",
    );
    expect(() => solve(presets[0]!, { maxStates: Infinity })).toThrow();
    expect(() => solve(presets[0]!, { timeoutMs: NaN })).toThrow();
  });
});
