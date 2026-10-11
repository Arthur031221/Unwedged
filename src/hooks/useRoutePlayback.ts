import { useCallback, useEffect, useRef, useState } from "react";
import type { Pose, Route } from "../core/schema";

export function useRoutePlayback(route: Route | null, initialPose: Pose) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pose, setPose] = useState(initialPose);
  const progressRef = useRef(progress);
  const updateProgress = useCallback((value: number) => {
    progressRef.current = value;
    setProgress(value);
  }, []);

  useEffect(() => {
    if (!route) {
      setPlaying(false);
      updateProgress(0);
      setPose(initialPose);
      return;
    }
    setPlaying(false);
    updateProgress(0);
    setPose(route.poses[0]!);
  }, [route, initialPose, updateProgress]);

  useEffect(() => {
    if (!playing || !route) return;
    const duration = Math.max(1500, route.poses.length * 520);
    const startedAt = performance.now() - progressRef.current * duration;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.max(0, Math.min(1, (now - startedAt) / duration));
      updateProgress(next);
      if (next === 1) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, route, updateProgress]);

  useEffect(() => {
    if (!route) return;
    const total = route.poses.length - 1;
    const at = progress * total;
    const index = Math.min(total - 1, Math.floor(at));
    const amount = at - index;
    const a = route.poses[index]!;
    const b = route.poses[Math.min(total, index + 1)]!;
    const delta = Math.atan2(
      Math.sin(b.angle - a.angle),
      Math.cos(b.angle - a.angle),
    );
    setPose({
      x: a.x + (b.x - a.x) * amount,
      y: a.y + (b.y - a.y) * amount,
      angle: a.angle + delta * amount,
    });
  }, [progress, route]);

  return { playing, setPlaying, progress, setProgress: updateProgress, pose };
}
