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

const results = [presets[0]!, presets[1]!, halfTurn, nearMargin].map(
  (project) => {
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
  },
);
console.log(JSON.stringify(results));
