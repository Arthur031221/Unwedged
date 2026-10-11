import { describe, expect, it } from "vitest";
import { createObstacle, editRect } from "./editor";
import { presets } from "./presets";
import { validateProject } from "./schema";

describe("editable structure round trips", () => {
  it("keeps a doorway inside its resized wall", () => {
    const project = structuredClone(presets[0]!);
    const wall = project.rects.find((rect) => rect.door)!;
    const resized = editRect(wall, { width: 0.1, height: 0.1 });
    expect(resized.door!.width).toBeLessThan(0.1);
    project.rects = [resized];
    expect(() => validateProject(project)).not.toThrow();
  });
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
