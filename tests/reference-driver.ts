import { solve } from "../src/core/search";
import { presets } from "../src/core/presets";
import { exportJson, importJson } from "../src/core/serialize";

const halfTurn = structuredClone(presets[0]!);
halfTurn.name = "Saved half-turn regression";
halfTurn.floor = { width: 500, height: 500 };
halfTurn.furniture = { length: 100, width: 10, height: 10 };
halfTurn.start = { x: 150, y: 250, angle: 3 * Math.PI };
halfTurn.goal = { x: 350, y: 250, angle: 4 * Math.PI };
halfTurn.rects = [
  { id: "corner", x: 165, y: 285, width: 6, height: 6, kind: "obstacle" },
];
const nearMargin = structuredClone(presets[0]!);
nearMargin.name = "Saved near-margin regression";
nearMargin.rects = [];
nearMargin.start.y = nearMargin.goal.y = 43.01;

const verticalOffset = structuredClone(presets[0]!);
verticalOffset.name = "Vertical off-centre doorway";
verticalOffset.schemaVersion = 2;
verticalOffset.floor = { width: 500, height: 400 };
verticalOffset.furniture = { length: 60, width: 40, height: 70 };
verticalOffset.margin = 2;
verticalOffset.start = { x: 100, y: 270, angle: 0 };
verticalOffset.goal = { x: 400, y: 270, angle: 0 };
verticalOffset.rects = [
  {
    id: "vertical-door",
    x: 250,
    y: 200,
    width: 20,
    height: 400,
    kind: "wall",
    door: { width: 100, height: 190, offset: 70 },
  },
];
const horizontalOffset = structuredClone(presets[0]!);
horizontalOffset.name = "Horizontal off-centre doorway";
horizontalOffset.schemaVersion = 2;
horizontalOffset.floor = { width: 500, height: 400 };
horizontalOffset.furniture = { length: 60, width: 40, height: 70 };
horizontalOffset.margin = 2;
horizontalOffset.start = { x: 170, y: 80, angle: 0 };
horizontalOffset.goal = { x: 170, y: 320, angle: 0 };
horizontalOffset.rects = [
  {
    id: "horizontal-door",
    x: 250,
    y: 200,
    width: 500,
    height: 20,
    kind: "wall",
    door: { width: 100, height: 190, offset: -80 },
  },
];

const results = [
  presets[0]!,
  presets[1]!,
  halfTurn,
  nearMargin,
  verticalOffset,
  horizontalOffset,
].map((project) => {
  const result = solve(project, {
    fine: false,
    timeoutMs: 30000,
    maxStates: 65000,
  });
  if (result.status !== "found")
    throw new Error(`${project.name}: ${result.status}`);
  const imported = importJson(exportJson(project, result.route));
  if (!imported.route)
    throw new Error(`${project.name}: route missing after import`);
  return { project: imported.project, route: imported.route };
});
console.log(JSON.stringify(results));
