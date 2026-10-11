# Accuracy and limits

Unwedged models an axis aligned rectangular floor, rectangular obstacles and rigid rectangular furniture. Furniture has a fixed carrying height. A doorway opening is represented by up to two jamb rectangles. Its offset is measured along the wall's longer axis, with zero at the centre. The geometry keeps every jamb with a positive extent, even below the collision tolerance. An opening touching a wall end omits the zero length jamb. If carrying height equals or exceeds doorway height, the opening is treated as closed.

For a pose, the app calculates the four furniture corners, checks polygon separation with separating axes, measures Euclidean boundary and segment distance, and checks signed clearance to the outer floor edges. Touching counts as collision. Physical clearance must exceed the entered margin and a numerical epsilon.

For a motion interval, the furniture centre moves linearly and the angle follows the shortest signed difference. At the interval midpoint, every point of the furniture is at most `B = centre_displacement / 2 + 2R sin(|angle_delta| / 4)` from its midpoint location, where `R` is the half diagonal. If midpoint clearance minus `B` exceeds margin plus epsilon, the interval is certified. Otherwise the verifier bisects. A colliding midpoint, an exhausted depth limit or an exhausted interval budget fails certification. Failed certification can be inconclusive and is not a collision verdict.

A* uses a finite lattice anchored at the exact start pose, verifies each transition, tries exact goal connections near the goal, and rechecks the simplified full route from scratch. State and time limits mean search exhaustion is not proof that no route exists. The fine setting uses 5 cm and 5 degree increments. Neither mode claims a shortest route.

Project schema version 1 supports centred doorways and remains accepted. Version 2 adds optional doorway offsets. An offset must be zero or the document must use version 2, and the top-level and project schema versions must match. Older clients reject version 2 files. Draft recovery applies the same schema checks.

This check covers only a 2D rigid carry. It does not represent stairs, tilting, deformable furniture, carrier bodies, wall irregularities, measurement error beyond the entered margin or building conditions. A route is conditional on the entered model.
