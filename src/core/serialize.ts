import type { Project, Route } from "./schema";
import { validateProject, LIMITS } from "./schema";
import { certifyPath } from "./verify";
import { expanded, shortAngle } from "./geometry";
import { formatClearance } from "./units";
export type Bundle = {
  format: "unwedged";
  schemaVersion: 1 | 2;
  project: Project;
  route?: Route;
};
export function exportJson(project: Project, route?: Route) {
  const schemaVersion: 1 | 2 = project.rects.some(
    (rect) => (rect.door?.offset ?? 0) !== 0,
  )
    ? 2
    : 1;
  const exportedProject = { ...project, schemaVersion };
  const bundle: Bundle = {
    format: "unwedged",
    schemaVersion,
    project: exportedProject,
    ...(route ? { route } : {}),
  };
  return JSON.stringify(bundle, null, 2);
}
export function importJson(raw: string): Bundle {
  if (new TextEncoder().encode(raw).length > LIMITS.jsonBytes)
    throw Error("File is larger than 1 MB");
  const b = JSON.parse(raw) as Bundle;
  if (
    !b ||
    b.format !== "unwedged" ||
    ![1, 2].includes(b.schemaVersion) ||
    !b.project ||
    b.project.schemaVersion !== b.schemaVersion
  )
    throw Error("Not an Unwedged project");
  validateProject(b.project);
  if (b.route) {
    if (
      !Array.isArray(b.route.poses) ||
      b.route.poses.length < 2 ||
      b.route.poses.length > LIMITS.routePoses ||
      !b.route.poses.every(
        (q) =>
          q &&
          [q.x, q.y, q.angle].every(Number.isFinite) &&
          Math.abs(q.x) <= LIMITS.coordinate &&
          Math.abs(q.y) <= LIMITS.coordinate &&
          Math.abs(q.angle) <= 1e6,
      )
    )
      throw Error("Route data is invalid");
    const same = (a: Project["start"], z: Project["start"]) =>
      Math.hypot(a.x - z.x, a.y - z.y) <= 1e-7 &&
      Math.abs(shortAngle(a.angle, z.angle)) <= 1e-7;
    if (
      !same(b.route.poses[0]!, b.project.start) ||
      !same(b.route.poses.at(-1)!, b.project.goal)
    )
      throw Error("Saved route endpoints do not match the project");
    const checked = certifyPath(b.route.poses, b.project);
    if (!checked.ok) throw Error("Saved route failed re-verification");
    b.route = {
      poses: b.route.poses.map((q) => ({
        x: q.x,
        y: q.y,
        // Normalizing a half-turn can reverse the motion that was verified.
        angle: q.angle,
      })),
      clearance: checked.clearance,
      verified: true,
      explored: 0,
      elapsedMs: 0,
      step: 0,
      angleStep: 0,
    };
  }
  return {
    format: "unwedged",
    schemaVersion: b.schemaVersion,
    project: b.project,
    ...(b.route ? { route: b.route } : {}),
  };
}
const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
export function routeSvg(
  p: Project,
  r: Route,
  labels?: { caption?: string; dimensions?: string },
) {
  const scale = 1.5;
  const pad = 48;
  const width = Math.max(640, p.floor.width * scale + pad * 2);
  const wrap = (value: string, maxChars: number) => {
    const lines: string[] = [];
    let line = "";
    for (const word of value.split(/\s+/)) {
      let remaining = word;
      while (remaining.length > maxChars) {
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(Array.from(remaining).slice(0, maxChars).join(""));
        remaining = Array.from(remaining).slice(maxChars).join("");
      }
      const next = line ? `${line} ${remaining}` : remaining;
      if (line && next.length > maxChars) {
        lines.push(line);
        line = remaining;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const captionRaw = labels?.caption ?? `Unwedged route · ${p.name}`;
  const dimensionsRaw =
    labels?.dimensions ??
    `${p.floor.width} × ${p.floor.height} cm · furniture ${p.furniture.length} × ${p.furniture.width} cm · carry height ${p.furniture.height} cm · margin ${p.margin} cm · conservative clearance ≥ ${formatClearance(r.clearance)}`;
  const maxChars = Math.max(1, Math.floor((width - pad * 2) / 14));
  const captionLines = wrap(captionRaw, maxChars);
  const dimensionLines = wrap(dimensionsRaw, maxChars);
  const headerHeight =
    18 + captionLines.length * 17 + dimensionLines.length * 15;
  const floorTop = headerHeight + pad;
  const height = floorTop + p.floor.height * scale + pad;
  const px = (x: number) => pad + x * scale;
  const py = (y: number) => height - pad - y * scale;
  const poly = (pose: { x: number; y: number; angle: number }) => {
    const c = Math.cos(pose.angle);
    const s = Math.sin(pose.angle);
    const l = p.furniture.length / 2;
    const b = p.furniture.width / 2;
    return [
      [-l, -b],
      [l, -b],
      [l, b],
      [-l, b],
    ]
      .map(
        ([x, y]) =>
          `${px(pose.x + x! * c - y! * s)},${py(pose.y + x! * s + y! * c)}`,
      )
      .join(" ");
  };
  const title = escapeXml(captionRaw);
  const textLines = (lines: string[], startY: number, lineHeight: number) =>
    lines
      .map(
        (line, i) =>
          `<tspan x="${pad}" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`,
      )
      .join("");
  const obstacles = p.rects
    .flatMap((rect) => expanded(rect, p.furniture.height))
    .map(
      (rect) =>
        `<rect x="${px(rect.x - rect.width / 2)}" y="${py(rect.y + rect.height / 2)}" width="${rect.width * scale}" height="${rect.height * scale}" fill="#50697c"/>`,
    )
    .join("");
  const route = r.poses.map((pose) => `${px(pose.x)},${py(pose.y)}`).join(" ");
  const furniture = r.poses
    .map(
      (pose) =>
        `<polygon points="${poly(pose)}" fill="#8dcab2" fill-opacity=".45" stroke="#3157a0"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${title}</title><rect width="100%" height="100%" fill="#fff"/><text font-family="sans-serif" font-size="14">${textLines(captionLines, 24, 17)}</text><text font-family="sans-serif" font-size="12">${textLines(dimensionLines, 43 + captionLines.length * 17, 15)}</text><rect x="${pad}" y="${floorTop}" width="${p.floor.width * scale}" height="${p.floor.height * scale}" fill="#f3f7f9" stroke="#50697c" stroke-width="3"/>${obstacles}<polyline points="${route}" fill="none" stroke="#007f72" stroke-width="3" stroke-dasharray="8 5"/>${furniture}</svg>`;
}
