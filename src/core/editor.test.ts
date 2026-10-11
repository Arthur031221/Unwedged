import { describe, expect, it } from "vitest";
import { createEmptyProject, createObstacle, editRect } from "./editor";
import { presets } from "./presets";
import { validateProject } from "./schema";
import { solve } from "./search";

describe("editable structure round trips", () => {
  it("creates independent validated empty projects with a verified route", () => {
    const first = createEmptyProject("Untitled plan");
    const second = createEmptyProject("Second plan");
    expect(first).toEqual({
      schemaVersion: 1,
      name: "Untitled plan",
      floor: { width: 500, height: 300 },
      furniture: { length: 150, width: 70, height: 70 },
      margin: 2,
      start: { x: 100, y: 150, angle: 0 },
      goal: { x: 400, y: 150, angle: 0 },
      rects: [],
    });
    expect(() => validateProject(first)).not.toThrow();
    first.floor.width = 450;
    first.rects.push({
      id: "test",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      kind: "obstacle",
    });
    expect(second.floor.width).toBe(500);
    expect(second.rects).toEqual([]);
    const result = solve(second);
    expect(result.status).toBe("found");
    if (result.status === "found") expect(result.route.verified).toBe(true);
  });

  it("keeps a doorway inside its resized wall", () => {
    const project = structuredClone(presets[0]!);
    const wall = project.rects.find((rect) => rect.door)!;
    const resized = editRect(wall, { width: 0.1, height: 0.1 });
    expect(resized.door!.width).toBeLessThan(0.1);
    project.rects = [resized];
    expect(() => validateProject(project)).not.toThrow();
  });
  it("preserves imported obstacle doorways when moving or resizing", () => {
    const obstacle = {
      id: "obstacle-door",
      x: 120,
      y: 80,
      width: 26,
      height: 132,
      kind: "obstacle" as const,
      door: { width: 92, height: 190, offset: 10 },
    };
    const moved = editRect(obstacle, { x: 121, y: 81 });
    expect(moved).toEqual({ ...obstacle, x: 121, y: 81 });
    const resized = editRect(obstacle, { id: "obstacle-resized", height: 140 });
    expect(resized).toEqual({
      ...obstacle,
      id: "obstacle-resized",
      height: 140,
    });
    const project = structuredClone(presets[0]!);
    project.schemaVersion = 2;
    project.rects = [moved, resized];
    expect(() => validateProject(project)).not.toThrow();
  });

  it("removes a doorway only when converting a wall to an obstacle", () => {
    const wall = {
      id: "conversion-door",
      x: 0,
      y: 0,
      width: 26,
      height: 132,
      kind: "wall" as const,
      door: { width: 92, height: 190, offset: 10 },
    };
    expect(editRect(wall, { x: 1 }).door).toEqual(wall.door);
    expect(editRect(wall, { kind: "obstacle" }).door).toBeUndefined();
  });

  it("preserves imported measurements when only moving a wall", () => {
    const project = structuredClone(presets[0]!);
    project.schemaVersion = 2;
    const wall = project.rects.find((rect) => rect.door)!;
    wall.width = 0.05;
    wall.door = { width: 131.95, height: 190, offset: 0.01 };
    expect(() => validateProject(project)).not.toThrow();
    const moved = editRect(wall, { x: 281, y: 151 });
    expect(moved).toEqual({ ...wall, x: 281, y: 151 });
    project.rects = [moved];
    expect(() => validateProject(project)).not.toThrow();
  });
  it.each([
    ["opening height", { door: { width: 131.95, height: 200, offset: 0.01 } }],
    ["opening offset", { door: { width: 131.95, height: 190, offset: 0.02 } }],
    ["wall thickness", { width: 27 }],
    ["wall length", { height: 132.01 }],
  ])(
    "preserves unrelated imported measurements when editing %s",
    (_, patch) => {
      const project = structuredClone(presets[0]!);
      project.schemaVersion = 2;
      const wall = project.rects.find((rect) => rect.door)!;
      wall.door = { width: 131.95, height: 190, offset: 0.01 };
      expect(() => validateProject(project)).not.toThrow();
      const edited = editRect(wall, patch);
      expect(edited).toEqual({ ...wall, ...patch });
      project.rects = [edited];
      expect(() => validateProject(project)).not.toThrow();
    },
  );
  it("clamps doorway offsets after changing wall and opening widths", () => {
    const wall = {
      id: "offset",
      x: 0,
      y: 0,
      width: 20,
      height: 100,
      kind: "wall" as const,
      door: { width: 40, height: 190, offset: 30 },
    };
    expect(editRect(wall, { height: 80 }).door?.offset).toBe(20);
    expect(
      editRect(wall, { door: { ...wall.door, width: 60 } }).door?.offset,
    ).toBe(20);
  });
  it("removes a doorway explicitly and when converting to an obstacle", () => {
    const wall = presets[0]!.rects.find((rect) => rect.door)!;
    expect(editRect(wall, { door: undefined }).door).toBeUndefined();
    expect(editRect(wall, { kind: "obstacle" }).door).toBeUndefined();
    expect(wall.door).toBeDefined();
  });
  it("clamps dragged structure coordinates to the file format limits", () => {
    const wall = presets[0]!.rects[0]!;
    const moved = editRect(wall, { x: 5000, y: -5000 });
    expect(moved.x).toBe(2000);
    expect(moved.y).toBe(-2000);
  });
  it("creates a centered bounded obstacle with a unique ID", () => {
    const project = structuredClone(presets[1]!);
    project.rects.push(
      { id: "obstacle-1", x: 0, y: 0, width: 1, height: 1, kind: "obstacle" },
      { id: "obstacle-3", x: 0, y: 0, width: 1, height: 1, kind: "obstacle" },
    );
    const obstacle = createObstacle(project);
    expect(obstacle).toMatchObject({
      id: "obstacle-2",
      x: project.floor.width / 2,
      y: project.floor.height / 2,
      width: 64,
      height: 18,
      kind: "obstacle",
    });
    expect(Math.abs(obstacle.x)).toBeLessThanOrEqual(2000);
    expect(Math.abs(obstacle.y)).toBeLessThanOrEqual(2000);
    project.rects.push(obstacle);
    expect(() => validateProject(project)).not.toThrow();
  });
  it("keeps centered coordinates within supported limits on large floors", () => {
    const project = structuredClone(presets[1]!);
    project.floor = { width: 2000, height: 1000 };
    expect(createObstacle(project)).toMatchObject({ x: 1000, y: 500 });
  });
  it("fits an obstacle inside a floor smaller than the default obstacle", () => {
    const project = structuredClone(presets[1]!);
    project.floor = { width: 24, height: 12 };
    expect(createObstacle(project)).toMatchObject({
      x: 12,
      y: 6,
      width: 24,
      height: 12,
    });
  });
});
