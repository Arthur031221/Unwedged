# Usage

Choose Apartment hallway, Corner landing or Blocked corridor. Edit floor dimensions and enter the furniture length, width, fixed carry height and safety margin. Set start and destination positions and angles with the fields or canvas tools. Select a wall or obstacle to move it or edit its dimensions. Walls can have one centered doorway with editable width and height.

Find route starts a bounded search in a worker. Fine search uses a 5 cm and 5 degree lattice instead of 10 cm and 10 degrees. Use the transport slider or play button to inspect poses. Save project downloads JSON with any checked route. Open project validates the input and rechecks a saved route before display. Share encodes the same document in the URL hash. Export route sheet writes a dimensioned SVG after rechecking the route.

Units switch between centimetres and inches while stored values remain centimetres. Keyboard users can focus and edit numerical fields instead of placing poses by touch. On small screens, the measurement sidebar opens from the Measurements button.

A route is conditional on the entered measurements and 2D model. Search limits may miss a route. Read [accuracy and limits](accuracy.md) before treating a route as a building measurement guarantee.

To create a wall or doorway, choose Draw obstacle and click the floor plan. Select the new piece, set Structure type to Wall, and enable Centered doorway. Enter the opening width and height. The opening follows the wall's longer axis.
