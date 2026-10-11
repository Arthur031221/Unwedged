import { describe, expect, it } from "vitest";
import { presets } from "./presets";
import {
  beginProjectGroup,
  createHistory,
  endProjectGroup,
  HISTORY_LIMIT,
  recordProject,
  redoProject,
  undoProject,
} from "./history";

const resized = (value: number) => ({
  ...structuredClone(presets[1]!),
  floor: { ...presets[1]!.floor, width: value },
});

describe("project history", () => {
  it("keeps redo and history unchanged for an edit with the same measurements", () => {
    const history = undoProject(
      recordProject(createHistory(resized(460)), resized(470)),
    );
    expect(recordProject(history, resized(460))).toBe(history);
    const focused = endProjectGroup(beginProjectGroup(history));
    expect(focused.past).toHaveLength(0);
    expect(redoProject(focused).present.floor.width).toBe(470);
  });

  it("records a focus group as one immutable undo step", () => {
    const original = createHistory(resized(460));
    let history = beginProjectGroup(original);
    history = recordProject(history, resized(470));
    history = recordProject(history, resized(480));
    history = endProjectGroup(history);
    expect(history.past).toHaveLength(1);
    expect(undoProject(history).present.floor.width).toBe(460);
    expect(Object.isFrozen(history.present.floor)).toBe(true);
  });

  it("clears redo after a branch and bounds past snapshots", () => {
    let history = createHistory(resized(460));
    history = recordProject(history, resized(470));
    history = recordProject(history, resized(480));
    history = undoProject(history);
    history = recordProject(history, resized(490));
    expect(history.future).toHaveLength(0);
    for (let i = 0; i < HISTORY_LIMIT + 5; i++)
      history = recordProject(history, resized(500 + i));
    expect(history.past).toHaveLength(HISTORY_LIMIT);
  });

  it("supports redo and caps snapshots restored through redo", () => {
    let history = createHistory(resized(460));
    history = recordProject(history, resized(470));
    expect(redoProject(undoProject(history)).present.floor.width).toBe(470);
  });
});
