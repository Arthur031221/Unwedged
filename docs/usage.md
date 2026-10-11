# Usage

Choose Apartment hallway, Corner landing or Blocked corridor. Enter measured floor and obstacle dimensions, then set the furniture length, width, fixed carry height and safety margin. Set start and destination positions and angles with the fields or canvas tools. Select a wall or obstacle to move it or edit its dimensions. Walls can have one doorway with editable width, height and offset along the wall.

## Coordinates

X and Y locate centers, not a rectangle's upper left corner or measured edge. The floor origin is at the lower left. X increases to the right and Y increases upward. Positive angles rotate counterclockwise. JSON stores angles in radians, while displayed headings use degrees. The canvas shows the Y axis upward even though screen pixels increase downward.

For example, a wall measured from its left edge at X = 100 cm with width 20 cm has center X = 110 cm. Set center Y = 150 cm. Using X = 100 cm would place the wall center at the measured left edge and shift the wall 10 cm left. See the [coordinate diagram](coordinate-example.svg).

## Endpoints and warnings

The start and destination checks run as measurements or geometry change. A positive clearance at or below the required safety margin triggers a margin warning. A clearance at or below zero means the furniture touches or overlaps an obstacle or floor edge, so the app reports a collision. Margin warnings report clearance and the required margin. Collision warnings do not estimate or report overlap depth. The destination footprint is drawn on the floor plan so its placement can be inspected.

Warnings describe the entered 2D measurements. They do not account for unmeasured wall irregularities or prove that a real building matches the plan. Search limits can also miss a valid route. See [Accuracy and limits](accuracy.md).

## Editing and saving

Find route is beside the plan and changes to Cancel search while a search is running. It starts a bounded search in a worker. Fine search uses a 5 cm and 5 degree lattice instead of 10 cm and 10 degrees. Use the transport slider or play button to inspect poses. Any geometry edit clears the current route. Undo and Redo discard any unfinished numeric entry and move through committed measurement edits.

Accepted imported obstacle doorways keep their measured width and offset when obstacle dimensions are edited. The accepted doorway data is saved with the plan and restored when the saved plan is reopened. When an edit would make a doorway invalid, the edit is rejected rather than silently changing its opening.

Choose New empty plan to start with a blank layout, then enter its name in Plan name. Creating the plan is one Undo step. Plan names autosave with measurements, and renaming a plan keeps a verified route. Measurements autosave locally and can be recovered on the next visit. Autosaved drafts contain measurements, not routes. If browser storage is unavailable, use Save project to download a copy. Open project validates input and checks a saved route before display. A successful open is undoable. If an import is rejected, the current plan and its certified route remain in place.

A numeric measurement commits its complete value when you leave the field or press Enter. Invalid values receive visible accessible feedback and block search, sharing, saving and export until corrected. Keyboard users can edit numerical fields. On small screens, open the Measurements panel to edit obstacles. Units switch between centimetres and inches while stored values remain centimetres.

To create a wall or doorway, choose Draw obstacle and click the floor plan. Select the new piece, set Structure type to Wall, and enable Doorway. Enter the opening width, height and offset. An offset moves the opening along the wall's longer axis. Offset files use schema version 2 and older clients reject them. Centred version 1 files remain accepted.

Headings follow the selected centimetre or inch display unit. Export route sheet includes the plan name in its SVG caption. Share encodes the document in the URL hash. The app reports when a link was copied to the clipboard. If clipboard access is blocked or unavailable, the link stays in the address bar and the app reports that separately. Opening a shared plan preserves your saved draft until you edit the shared plan. An invalid share link falls back to your saved measurements. Export route sheet writes a dimensioned SVG of the currently certified route.
