# Usage

Choose Apartment hallway, Corner landing or Blocked corridor. Edit floor dimensions and enter the furniture length, width, fixed carry height and safety margin. Set start and destination positions and angles with the fields or canvas tools. Select a wall or obstacle to move it or edit its dimensions. Walls can have one doorway with editable width, height and offset along the wall.

Find route starts a bounded search in a worker. Fine search uses a 5 cm and 5 degree lattice instead of 10 cm and 10 degrees. Use the transport slider or play button to inspect poses. Any geometry edit clears the current route. Undo and Redo restore grouped measurement edits.

Measurements autosave locally and can be recovered on the next visit. Autosaved drafts contain measurements, not routes. If browser storage is unavailable, use Save project to download a copy. Open project validates input and rechecks a saved route before display. Share encodes the document in the URL hash. Opening a shared plan preserves your saved draft until you edit the shared plan. An invalid share link falls back to your saved measurements. Export route sheet writes a dimensioned SVG after rechecking the route.

Keyboard users can edit numerical fields. On small screens, open the Measurements panel to edit obstacles. Units switch between centimetres and inches while stored values remain centimetres.

To create a wall or doorway, choose Draw obstacle and click the floor plan. Select the new piece, set Structure type to Wall, and enable Doorway. Enter the opening width, height and offset. An offset moves the opening along the wall's longer axis. Offset files use schema version 2 and older clients reject them. Centred version 1 files remain accepted.

A route is conditional on the entered measurements and 2D model. Search limits may miss a route. Read [accuracy and limits](accuracy.md) before treating a route as a building measurement guarantee.
