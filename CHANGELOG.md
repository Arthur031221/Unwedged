# Changelog

## 1.2.0

- Commit complete numeric measurements on blur or Enter, with accessible validation that blocks search, sharing, saving and export until corrected. Preserve measured doorway width and offset when wall dimensions change, and reject conflicting dimensions. Successful project opens are undoable. Rejected imports preserve the current plan and certified route.
- Add named empty plans, with Undo, Redo and local autosave. Renaming a plan keeps a verified route.
- Put Find route beside the plan and show Cancel search while a search is running.
- Report clipboard success separately from a link left in the address bar when clipboard access is blocked or missing.
- Match measurement headings to the selected unit and include the plan name in exported SVG captions.

## 1.1.0

- Add grouped Undo and Redo, local measurement autosave and recovery, with a Save project fallback when browser storage is unavailable. Routes are not included in autosaved drafts.
- Add keyboard field editing, a mobile obstacle editor and movable doorway openings.
- Add doorway offsets in schema version 2. Older clients reject version 2 files. Centred version 1 files remain supported.
- Keep doorway jambs positive even when the opening is narrower than the collision tolerance.
- Expand independent route sampling coverage to two successful presets and four regression fixtures, including both doorway orientations.

## 1.0.0

- Add measured floorplan editor, rigid furniture poses, doorway height checks and three example layouts.
- Add bounded worker search and adaptive continuous clearance certification.
- Add route replay, project import/export, URL sharing, SVG sheets and nine interface locales.
