import type { Project } from "./schema";
export const presets: Project[] = [
  {
    schemaVersion: 1,
    name: "Apartment hallway",
    floor: { width: 560, height: 300 },
    furniture: { length: 190, width: 82, height: 74 },
    margin: 2,
    start: { x: 120, y: 150, angle: 0 },
    goal: { x: 440, y: 150, angle: 0 },
    rects: [
      {
        id: "pinch",
        x: 280,
        y: 150,
        width: 26,
        height: 132,
        kind: "wall",
        door: { width: 92, height: 190 },
      },
      {
        id: "cabinet",
        x: 440,
        y: 52,
        width: 112,
        height: 28,
        kind: "obstacle",
      },
    ],
  },
  {
    schemaVersion: 1,
    name: "Corner landing",
    floor: { width: 460, height: 390 },
    furniture: { length: 150, width: 74, height: 68 },
    margin: 2,
    start: { x: 95, y: 300, angle: 0 },
    goal: { x: 390, y: 90, angle: -Math.PI / 2 },
    rects: [
      { id: "return", x: 230, y: 175, width: 210, height: 28, kind: "wall" },
    ],
  },
  {
    schemaVersion: 1,
    name: "Blocked corridor",
    floor: { width: 420, height: 280 },
    furniture: { length: 150, width: 70, height: 65 },
    margin: 2,
    start: { x: 90, y: 140, angle: 0 },
    goal: { x: 330, y: 140, angle: 0 },
    rects: [
      { id: "barrier", x: 210, y: 140, width: 24, height: 280, kind: "wall" },
    ],
  },
];
