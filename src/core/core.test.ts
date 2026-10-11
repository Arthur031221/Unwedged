import { describe, it, expect } from "vitest";
import { presets } from "./presets";
import { clearance, expanded, shortAngle } from "./geometry";
import { checkEndpoint } from "./endpoints";
import { certifyPath, certifySegment } from "./verify";
import { solve } from "./search";
import { exportJson, importJson, routeSvg } from "./serialize";
import { localeParity, messages } from "../locales";
describe("geometry and certificate", () => {
  it("classifies endpoint clearance against the solver's strict margin", () => {
    const p = structuredClone(presets[0]!);
    p.rects = [];
    p.furniture = { length: 40, width: 20, height: 70 };
    p.floor = { width: 500, height: 400 };
    p.margin = 10;
    expect(checkEndpoint({ x: 100, y: 100, angle: 0 }, p).issue).toBe(null);
    expect(checkEndpoint({ x: 15, y: 100, angle: 0 }, p).issue).toBe(
      "collision",
    );
    expect(checkEndpoint({ x: 25, y: 100, angle: 0 }, p).issue).toBe("margin");
    expect(checkEndpoint({ x: 30, y: 100, angle: 0 }, p).issue).toBe("margin");
  });
  it("reports overlap with a fixed obstacle as a physical collision", () => {
    const p = structuredClone(presets[0]!);
    p.rects = [
      {
        id: "cabinet",
        x: 100,
        y: 100,
        width: 30,
        height: 30,
        kind: "obstacle",
      },
    ];
    expect(checkEndpoint({ x: 100, y: 100, angle: 0 }, p).issue).toBe(
      "collision",
    );
  });
  it("uses the rotated destination footprint and doorway carry height and offset", () => {
    const p = structuredClone(presets[0]!);
    p.floor = { width: 500, height: 400 };
    p.furniture = { length: 60, width: 20, height: 70 };
    p.margin = 2;
    p.rects = [
      {
        id: "door",
        x: 250,
        y: 200,
        width: 20,
        height: 200,
        kind: "wall",
        door: { width: 100, height: 190, offset: 40 },
      },
    ];
    expect(checkEndpoint({ x: 250, y: 240, angle: 0 }, p).issue).toBe(null);
    expect(checkEndpoint({ x: 250, y: 200, angle: 0 }, p).issue).toBe(
      "collision",
    );
    p.furniture.height = 190;
    expect(checkEndpoint({ x: 250, y: 240, angle: 0 }, p).issue).toBe(
      "collision",
    );
    p.rects = [];
    p.margin = 0;
    expect(checkEndpoint({ x: 489, y: 200, angle: 0 }, p).issue).toBe(
      "collision",
    );
    expect(checkEndpoint({ x: 489, y: 200, angle: Math.PI / 2 }, p).issue).toBe(
      null,
    );
  });
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
  it("places unequal jambs from off-centre openings in both orientations", () => {
    const vertical = {
      id: "v",
      x: 10,
      y: 20,
      width: 12,
      height: 100,
      kind: "wall" as const,
      door: { width: 40, height: 190, offset: 10 },
    };
    const horizontal = {
      ...vertical,
      id: "h",
      width: 100,
      height: 12,
      door: { ...vertical.door, offset: -10 },
    };
    expect(expanded(vertical, 70).map(({ y, height }) => [y, height])).toEqual([
      [-10, 40],
      [60, 20],
    ]);
    expect(expanded(horizontal, 70).map(({ x, width }) => [x, width])).toEqual([
      [-30, 20],
      [40, 40],
    ]);
  });
  it("allows a flush opening, omits its zero jamb, and closes at the height limit", () => {
    const wall = {
      id: "flush",
      x: 50,
      y: 50,
      width: 20,
      height: 100,
      kind: "wall" as const,
      door: { width: 40, height: 190, offset: 30 },
    };
    expect(expanded(wall, 70)).toHaveLength(1);
    expect(expanded(wall, 190)).toEqual([wall]);
  });
  it("retains a positive jamb smaller than the collision tolerance", () => {
    const wall = {
      id: "tiny-jamb",
      x: 50,
      y: 50,
      width: 20,
      height: 100,
      kind: "wall" as const,
      door: { width: 40, height: 190, offset: 30 - 1e-8 },
    };
    const parts = expanded(wall, 70);
    expect(parts).toHaveLength(2);
    expect(parts[1]!.height).toBeGreaterThan(0);
    expect(parts[1]!.height).toBeLessThan(1e-7);
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
  it("changes clearance and certification when the opening moves off centre", () => {
    const p = structuredClone(presets[0]!);
    p.floor = { width: 500, height: 400 };
    p.furniture = { length: 60, width: 40, height: 70 };
    p.margin = 2;
    p.start = { x: 100, y: 270, angle: 0 };
    p.goal = { x: 400, y: 270, angle: 0 };
    p.rects = [
      {
        id: "wall",
        x: 250,
        y: 200,
        width: 20,
        height: 400,
        kind: "wall",
        door: { width: 100, height: 190, offset: 70 },
      },
    ];
    p.schemaVersion = 2;
    expect(certifyPath([p.start, p.goal], p).ok).toBe(true);
    p.rects[0]!.door!.offset = 0;
    expect(clearance({ x: 250, y: 270, angle: 0 }, p)).toBeLessThanOrEqual(0);
    expect(certifyPath([p.start, p.goal], p).ok).toBe(false);
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
  it("exports positioned openings as version 2 and accepts centred version 1", () => {
    const p = structuredClone(presets[0]!);
    p.floor = { width: 500, height: 400 };
    p.furniture = { length: 60, width: 40, height: 70 };
    p.start = { x: 100, y: 270, angle: 0 };
    p.goal = { x: 400, y: 270, angle: 0 };
    p.rects = [
      {
        id: "wall",
        x: 250,
        y: 200,
        width: 20,
        height: 400,
        kind: "wall",
        door: { width: 100, height: 190, offset: 70 },
      },
    ];
    p.schemaVersion = 2;
    const route = {
      poses: [p.start, p.goal],
      clearance: 1,
      explored: 0,
      elapsedMs: 0,
      step: 1,
      angleStep: 1,
      verified: true as const,
    };
    const raw = exportJson(p, route);
    expect(JSON.parse(raw).schemaVersion).toBe(2);
    expect(importJson(raw)).toMatchObject({
      schemaVersion: 2,
      project: p,
      route: { poses: [p.start, p.goal] },
    });
    const movedOpening = JSON.parse(raw);
    movedOpening.project.rects[0].door.offset = 0;
    expect(() => importJson(JSON.stringify(movedOpening))).toThrow(
      "Saved route failed re-verification",
    );
    const legacy = structuredClone(presets[0]!);
    expect(importJson(exportJson(legacy)).schemaVersion).toBe(1);
    legacy.rects.find((rect) => rect.door)!.kind = "obstacle";
    expect(() => importJson(exportJson(legacy))).not.toThrow();
    const centredV2 = structuredClone(p);
    centredV2.rects[0]!.door!.offset = 0;
    const minimal = JSON.parse(exportJson(centredV2));
    expect(minimal.schemaVersion).toBe(1);
    expect(minimal.project.schemaVersion).toBe(1);
    const v1Offset = JSON.parse(exportJson(p));
    v1Offset.schemaVersion = 1;
    v1Offset.project.schemaVersion = 1;
    expect(() => importJson(JSON.stringify(v1Offset))).toThrow();
    const bad = JSON.parse(exportJson(p));
    bad.project.rects[0].door.offset = 170;
    expect(() => importJson(JSON.stringify(bad))).toThrow();
    bad.project.rects[0].door.offset = "NaN";
    expect(() => importJson(JSON.stringify(bad))).toThrow();
    bad.project.rects[0].door.offset = 70;
    bad.project.schemaVersion = 1;
    expect(() => importJson(JSON.stringify(bad))).toThrow();
  });
  it("exports exact SVG jamb positions", () => {
    const p = structuredClone(presets[0]!);
    p.rects = [
      {
        id: "wall",
        x: 250,
        y: 200,
        width: 20,
        height: 400,
        kind: "wall",
        door: { width: 100, height: 190, offset: 70 },
      },
    ];
    const svg = routeSvg(p, {
      poses: [p.start, p.goal],
      clearance: 1,
      explored: 0,
      elapsedMs: 0,
      step: 1,
      angleStep: 1,
      verified: true,
    });
    const height = Number(svg.match(/height="([\d.]+)" viewBox/)?.[1]);
    expect(svg).toContain(
      `<rect x="408" y="${height - 48 - 220 * 1.5}" width="30" height="330" fill="#50697c"/>`,
    );
    expect(svg).toContain(
      `<rect x="408" y="${height - 48 - 400 * 1.5}" width="30" height="120" fill="#50697c"/>`,
    );
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
