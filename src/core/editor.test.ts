import { describe, expect, it } from "vitest";
import { editRect } from "./editor";
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
});
