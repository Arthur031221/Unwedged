import { describe, expect, it } from "vitest";
import { createDraft, readDraft } from "./draft";
import { presets } from "./presets";

describe("measurement drafts", () => {
  it("stores and restores only a validated project document", () => {
    const raw = createDraft(presets[1]!);
    expect(JSON.parse(raw)).not.toHaveProperty("route");
    expect(readDraft(raw)).toEqual(presets[1]);
  });

  it("ignores corrupt, oversized, and invalid project data", () => {
    expect(readDraft("{")).toBeNull();
    expect(readDraft("x".repeat(1_000_001))).toBeNull();
    expect(
      readDraft(
        JSON.stringify({ format: "unwedged", schemaVersion: 1, project: {} }),
      ),
    ).toBeNull();
  });

  it("validates projects and discards any route in stored data", () => {
    const data = JSON.parse(createDraft(presets[1]!));
    data.route = { poses: [{ x: 99999, y: 99999, angle: 0 }] };
    expect(readDraft(JSON.stringify(data))).toEqual(presets[1]);
  });
  it("restores version 2 off-centre drafts and requires matching versions", () => {
    const project = structuredClone(presets[0]!);
    project.schemaVersion = 2;
    project.rects[0]!.door = { ...project.rects[0]!.door!, offset: 12 };
    const data = JSON.parse(createDraft(project));
    data.route = { discarded: true };
    expect(readDraft(JSON.stringify(data))).toEqual(project);
    data.project.schemaVersion = 1;
    expect(readDraft(JSON.stringify(data))).toBeNull();
  });
});
