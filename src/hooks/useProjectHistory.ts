import { useRef, useState } from "react";
import {
  beginProjectGroup,
  createHistory,
  endProjectGroup,
  recordProject,
  redoProject,
  undoProject,
} from "../core/history";
import type { Project } from "../core/schema";

export function useProjectHistory(initial: Project) {
  const [history, setHistory] = useState(() => createHistory(initial));
  const historyRef = useRef(history);
  const projectRef = useRef(history.present);
  const publish = (next: typeof history) => {
    historyRef.current = next;
    projectRef.current = next.present;
    setHistory(next);
    return next.present;
  };
  const change = (next: Project) => {
    return publish(recordProject(historyRef.current, next));
  };
  const beginGroup = () => {
    publish(beginProjectGroup(historyRef.current));
  };
  const endGroup = () => {
    publish(endProjectGroup(historyRef.current));
  };
  const reset = (next: Project) => {
    publish(createHistory(next));
  };
  const undo = () => {
    return publish(undoProject(historyRef.current));
  };
  const redo = () => {
    return publish(redoProject(historyRef.current));
  };
  return {
    project: history.present,
    projectRef,
    change,
    beginGroup,
    endGroup,
    reset,
    undo,
    redo,
    canUndo:
      history.past.length > 0 ||
      (history.groupStart !== null && history.groupStart !== history.present),
    canRedo: historyRef.current.future.length > 0,
  };
}
