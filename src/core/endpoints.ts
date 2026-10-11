import { clearance } from "./geometry";
import type { Pose, Project } from "./schema";

export type EndpointCheck = {
  clearance: number;
  issue: "collision" | "margin" | null;
};

export function checkEndpoint(pose: Pose, project: Project): EndpointCheck {
  const distance = clearance(pose, project);
  return {
    clearance: distance,
    issue:
      distance <= 0
        ? "collision"
        : distance <= project.margin
          ? "margin"
          : null,
  };
}
