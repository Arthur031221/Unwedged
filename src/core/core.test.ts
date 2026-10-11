import { describe, it, expect } from "vitest";
import { presets } from "./presets";
import { clearance, expanded, shortAngle } from "./geometry";
import { certifyPath, certifySegment } from "./verify";
import { solve } from "./search";
import { exportJson, importJson, routeSvg } from "./serialize";
import { localeParity, messages } from "../locales";
describe("geometry and certificate", () => {
  it("finds a straight certified route on the open layout", () => {
    const p = structuredClone(presets[0]!);
    p.rects = [];
    expect(certifySegment(p.start, p.goal, p).ok).toBe(true);
  });
  it("rejects a solid wall obstruction without claiming impossibility", () => {
    const p = structuredClone(presets[0]!);
    p.rects = [
      { id: "wall", x: 280, y: 150, width: 22, height: 300, kind: "wall" },
    ];
    const r = solve(p, { maxStates: 600, timeoutMs: 100 });
    expect(r.status).not.toBe("found");
    expect(["no-route", "timeout"]).toContain(r.status);
  });
  it("handles centered door height based on fixed carry height", () => {
    const r = presets[0]!.rects[0]!;
    expect(expanded(r, 74)).toHaveLength(2);
    expect(expanded(r, 210)).toHaveLength(1);
    expect(expanded(r, r.door!.height)).toHaveLength(1);
  });
  it("cuts horizontal and vertical door gaps only for furniture that fits", () => {
    const vertical = {
      id: "vertical",
      x: 0,
      y: 0,
      width: 20,
      height: 100,
      kind: "wall" as const,
      door: { width: 40, height: 190 },
    };
    const horizontal = {
      ...vertical,
      id: "horizontal",
      width: 100,
      height: 20,
    };
    expect(expanded(vertical, 70).map((r) => r.height)).toEqual([30, 30]);
    expect(expanded(horizontal, 70).map((r) => r.width)).toEqual([30, 30]);
    expect(expanded(horizontal, 200)).toHaveLength(1);
  });
  it("keeps angles across the +/- pi seam short", () => {
    expect(Math.abs(shortAngle(Math.PI - 0.01, -Math.PI + 0.01))).toBeLessThan(
      0.03,
    );
  });
  it("rejects a near tangent below the safety margin", () => {
    const p = structuredClone(presets[0]!);
    p.margin = 3;
    expect(clearance({ x: 75, y: 150, angle: 0 }, p)).toBeLessThan(3);
  });
  it("rejects endpoint-safe motion whose midpoint hits a solid wall", () => {
    const p = structuredClone(presets[0]!);
    p.start = { x: 160, y: 150, angle: 0 };
    p.goal = { x: 400, y: 150, angle: 0 };
    p.rects = [
      { id: "barrier", x: 280, y: 150, width: 26, height: 300, kind: "wall" },
    ];
    expect(clearance(p.start, p)).toBeGreaterThan(0);
    expect(clearance(p.goal, p)).toBeGreaterThan(0);
    expect(certifySegment(p.start, p.goal, p).ok).toBe(false);
  });
  it("treats exact wall tangency as collision for an asymmetric footprint", () => {
    const p = structuredClone(presets[0]!);
    p.rects = [
      {
        id: "tangent",
        x: 205,
        y: 150,
        width: 30,
        height: 40,
        kind: "obstacle",
      },
    ];
    p.furniture = { length: 20, width: 10, height: 10 };
    expect(clearance({ x: 195, y: 150, angle: 0 }, p)).toBeLessThanOrEqual(0);
  });
  it("finds the measured doorway route and bounds exhausted search honestly", () => {
    expect(solve(presets[0]!).status).toBe("found");
    expect(solve(presets[2]!, { maxStates: 1, timeoutMs: 1000 }).status).toBe(
      "timeout",
    );
  });
  it("rejects a segment that tunnels through a full-height wall", () => {
    const p = structuredClone(presets[0]!);
    p.rects = [
      { id: "solid", x: 280, y: 150, width: 20, height: 300, kind: "wall" },
    ];
    const result = certifyPath([p.start, p.goal], p);
    expect(result.ok).toBe(false);
  });
});
describe("serialization and locales", () => {
  it("round trips a project and rejects tampering with route data", () => {
    const p = structuredClone(presets[0]!);
    p.rects = [];
    expect(importJson(exportJson(p)).project).toEqual(p);
    const raw = JSON.parse(
      exportJson(p, {
        poses: [p.start, p.goal],
        clearance: 2,
        explored: 1,
        elapsedMs: 1,
        step: 10,
        angleStep: 0.2,
        verified: true,
      }),
    );
    raw.route.poses[1].x = 999;
    expect(() => importJson(JSON.stringify(raw))).toThrow();
  });
  it("escapes project labels in a generated SVG sheet", () => {
    const project = { ...structuredClone(presets[0]!), name: 'Room <A> & "B"' };
    const svg = routeSvg(project, {
      poses: [project.start, project.goal],
      clearance: 2,
      explored: 1,
      elapsedMs: 1,
      step: 10,
      angleStep: 0.2,
      verified: true,
    });
    expect(svg).toContain("Room &lt;A&gt; &amp; &quot;B&quot;");
    expect(svg).not.toContain("Room <A>");
  });
  it("wraps localized export text above a tiny floor and escapes each line", () => {
    const project = structuredClone(presets[0]!);
    project.floor.width = 40;
    project.floor.height = 30;
    const svg = routeSvg(
      project,
      {
        poses: [project.start, project.goal],
        clearance: 2,
        explored: 1,
        elapsedMs: 1,
        step: 10,
        angleStep: 0.2,
        verified: true,
      },
      {
        caption: "Room <A> & detail",
        dimensions: "尺寸與家具測量資訊必須完整顯示".repeat(4),
      },
    );
    expect(svg.match(/<tspan/g)?.length).toBeGreaterThan(2);
    expect(svg).toContain("Room &lt;A&gt; &amp; detail");
    expect(svg).toContain("尺寸與家具測量資訊必須完整顯示");
    const floorY = Number(
      svg.match(/<rect x="48" y="([\d.]+)" width="60"/)?.[1],
    );
    const textYs = [...svg.matchAll(/<tspan x="48" y="([\d.]+)">/g)].map((m) =>
      Number(m[1]),
    );
    expect(floorY).toBeGreaterThan(Math.max(...textYs));
    expect(svg).toContain('height="');
  });
  it("keeps translation key parity and translated main actions", () => {
    expect(localeParity()).toBe(true);
    for (const l of (Object.keys(messages) as (keyof typeof messages)[]).filter(
      (l) => l !== "en",
    ))
      expect(messages[l].find).not.toBe(messages.en.find);
  });
});

import cases from "../../tests/fixtures/reference-cases.json";
describe("Shapely reference fixtures", () => {
  it("matches independent pose collision and clearance cases", () => {
    const data = cases as {
      project: (typeof presets)[number];
      poses: {
        pose: { x: number; y: number; angle: number };
        collision: boolean;
        clearance: number;
      }[];
    };
    for (const item of data.poses) {
      const actual = clearance(item.pose, data.project);
      if (item.collision) expect(actual).toBeLessThanOrEqual(0);
      else expect(actual).toBeCloseTo(item.clearance, 6);
    }
  });
  it("continuously certifies each independent random segment", () => {
    const data = cases as {
      project: (typeof presets)[number];
      segments: { x: number; y: number; angle: number }[][];
    };
    for (const pair of data.segments)
      expect(certifySegment(pair[0]!, pair[1]!, data.project).ok).toBe(true);
  });
});
