export type Unit = "cm" | "in";

export const inUnit = (cm: number, unit: Unit) =>
  unit === "cm" ? cm : cm / 2.54;

export function formatClearance(cm: number, unit: Unit = "cm"): string {
  return `${(Math.floor(inUnit(cm, unit) * 10) / 10).toFixed(1)} ${unit}`;
}
