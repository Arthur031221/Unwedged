"""Independent Shapely pose and dense motion reference checks."""

import json
import math
import random
import subprocess
import sys
import tempfile
from pathlib import Path

from shapely import affinity
from shapely.geometry import Polygon, box

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "tests/fixtures/reference-cases.json"
SEED = 20261011
POSES = 240
SEGMENTS = 120
SAMPLES_PER_SEGMENT = 200
SOLVE_SEGMENT_SAMPLES = 800


def furniture(pose, length, width):
    shape = box(-length / 2, -width / 2, length / 2, width / 2)
    shape = affinity.rotate(shape, math.degrees(pose["angle"]), origin=(0, 0))
    return affinity.translate(shape, pose["x"], pose["y"])


def shortest(a, b):
    return math.atan2(math.sin(b - a), math.cos(b - a))


def make_fixture():
    rng = random.Random(SEED)
    project = {
        "schemaVersion": 1,
        "name": "Independent reference field",
        "floor": {"width": 500, "height": 340},
        "furniture": {"length": 83, "width": 37, "height": 70},
        "margin": 0.2,
        "start": {"x": 100, "y": 170, "angle": 0},
        "goal": {"x": 400, "y": 170, "angle": 0},
        "rects": [
            {
                "id": "reference-block",
                "x": 250,
                "y": 170,
                "width": 32,
                "height": 120,
                "kind": "obstacle",
            }
        ],
    }
    floor = box(0, 0, 500, 340)
    obstacle = box(234, 110, 266, 230)
    poses = []
    for _ in range(POSES):
        pose = {
            "x": rng.uniform(45, 455),
            "y": rng.uniform(35, 305),
            "angle": rng.uniform(-math.pi, math.pi),
        }
        shape = furniture(pose, 83, 37)
        collides = not floor.covers(shape) or shape.intersects(obstacle)
        clearance = (
            0
            if collides
            else min(shape.distance(floor.boundary), shape.distance(obstacle))
        )
        poses.append({"pose": pose, "collision": collides, "clearance": clearance})
    segments = []
    for _ in range(SEGMENTS):
        x, y, a = rng.uniform(75, 140), rng.uniform(100, 240), rng.uniform(-0.25, 0.25)
        start = {"x": x, "y": y, "angle": a}
        end = {
            "x": x + rng.uniform(-12, 12),
            "y": y + rng.uniform(-12, 12),
            "angle": a + rng.uniform(-0.18, 0.18),
        }
        segments.append([start, end])
    return {"seed": SEED, "project": project, "poses": poses, "segments": segments}


def check_fixture(data):
    p = data["project"]
    floor = box(0, 0, p["floor"]["width"], p["floor"]["height"])
    obstacle = box(234, 110, 266, 230)
    for i, case in enumerate(data["poses"]):
        shape = furniture(
            case["pose"], p["furniture"]["length"], p["furniture"]["width"]
        )
        collision = not floor.covers(shape) or shape.intersects(obstacle)
        assert collision == case["collision"], f"pose collision mismatch {i}"
        if not collision:
            actual = min(shape.distance(floor.boundary), shape.distance(obstacle))
            assert abs(actual - case["clearance"]) <= 1e-10, (
                f"pose clearance mismatch {i}"
            )
    for i, (a, b) in enumerate(data["segments"]):
        delta = shortest(a["angle"], b["angle"])
        for j in range(SAMPLES_PER_SEGMENT + 1):
            t = j / SAMPLES_PER_SEGMENT
            pose = {
                "x": a["x"] + (b["x"] - a["x"]) * t,
                "y": a["y"] + (b["y"] - a["y"]) * t,
                "angle": a["angle"] + delta * t,
            }
            shape = furniture(pose, 83, 37)
            assert floor.covers(shape) and not shape.intersects(obstacle), (
                f"segment {i}, sample {j} collides"
            )
            assert (
                min(shape.distance(floor.boundary), shape.distance(obstacle))
                > p["margin"]
            ), f"segment {i}, sample {j} margin"


def raw_obstacles(project):
    """Expand raw project rectangles independently from the TypeScript oracle."""
    result = []
    for rect in project["rects"]:
        x, y, width, height = (rect[k] for k in ("x", "y", "width", "height"))
        door = rect.get("door")
        if not door or project["furniture"]["height"] >= door["height"]:
            result.append(
                box(x - width / 2, y - height / 2, x + width / 2, y + height / 2)
            )
            continue
        if height > width:
            wall_start, wall_end = y - height / 2, y + height / 2
            opening_center = y + door.get("offset", 0)
            opening_start = opening_center - door["width"] / 2
            opening_end = opening_center + door["width"] / 2
            if opening_start > wall_start:
                result.append(
                    box(x - width / 2, wall_start, x + width / 2, opening_start)
                )
            if opening_end < wall_end:
                result.append(box(x - width / 2, opening_end, x + width / 2, wall_end))
        else:
            wall_start, wall_end = x - width / 2, x + width / 2
            opening_center = x + door.get("offset", 0)
            opening_start = opening_center - door["width"] / 2
            opening_end = opening_center + door["width"] / 2
            if opening_start > wall_start:
                result.append(
                    box(wall_start, y - height / 2, opening_start, y + height / 2)
                )
            if opening_end < wall_end:
                result.append(
                    box(opening_end, y - height / 2, wall_end, y + height / 2)
                )
    return result


def solve_examples():
    with tempfile.TemporaryDirectory(prefix="unwedged-reference-") as temp:
        bundle = Path(temp) / "solved-routes.mjs"
        subprocess.run(
            [
                "node_modules/.bin/esbuild",
                "tests/reference-driver.ts",
                "--bundle",
                "--platform=node",
                "--format=esm",
                "--target=node22",
                f"--outfile={bundle}",
            ],
            cwd=ROOT,
            check=True,
            stdout=subprocess.DEVNULL,
        )
        output = subprocess.run(
            ["node", str(bundle)], cwd=ROOT, check=True, capture_output=True, text=True
        )
        solved = json.loads(output.stdout)
    for item in solved:
        project, route = item["project"], item["route"]
        floor = box(0, 0, project["floor"]["width"], project["floor"]["height"])
        obstacles = raw_obstacles(project)
        if project["name"] in {
            "Vertical off-centre doorway",
            "Horizontal off-centre doorway",
        }:
            wall = project["rects"][0]
            centred = {**wall, "door": {**wall["door"], "offset": 0}}
            centred_obstacles = raw_obstacles({**project, "rects": [centred]})
            crossing_pose = {
                "x": (project["start"]["x"] + project["goal"]["x"]) / 2,
                "y": (project["start"]["y"] + project["goal"]["y"]) / 2,
                "angle": 0,
            }
            crossing_shape = furniture(
                crossing_pose,
                project["furniture"]["length"],
                project["furniture"]["width"],
            )
            assert any(
                crossing_shape.intersects(obstacle) for obstacle in centred_obstacles
            ), f"{project['name']} centred control unexpectedly clears"
        length, width = project["furniture"]["length"], project["furniture"]["width"]
        measured_min = float("inf")
        samples = 0
        for segment, (a, b) in enumerate(zip(route["poses"], route["poses"][1:])):
            delta = shortest(a["angle"], b["angle"])
            for step in range(SOLVE_SEGMENT_SAMPLES + 1):
                t = step / SOLVE_SEGMENT_SAMPLES
                pose = {
                    "x": a["x"] + (b["x"] - a["x"]) * t,
                    "y": a["y"] + (b["y"] - a["y"]) * t,
                    "angle": a["angle"] + delta * t,
                }
                shape = furniture(pose, length, width)
                assert floor.covers(shape), (
                    f"{project['name']} segment {segment} sample {step} leaves floor"
                )
                assert all(not shape.intersects(obstacle) for obstacle in obstacles), (
                    f"{project['name']} segment {segment} sample {step} collides"
                )
                clearance = min(
                    [
                        shape.distance(floor.boundary),
                        *(shape.distance(obstacle) for obstacle in obstacles),
                    ]
                )
                measured_min = min(measured_min, clearance)
                assert clearance > project["margin"], (
                    f"{project['name']} segment {segment} sample {step} violates margin"
                )
                samples += 1
        assert measured_min + 1e-5 >= route["clearance"], (
            f"{project['name']} sampled clearance is below the conservative report"
        )
        print(
            f"  {project['name']}: poses={len(route['poses'])}, segments={len(route['poses']) - 1}, samples={samples}, sampled_clearance={measured_min:.4f} cm, reported_lower_bound={route['clearance']:.4f} cm"
        )


def main():
    if "--write-fixtures" in sys.argv:
        FIXTURE.write_text(json.dumps(make_fixture(), indent=2) + "\n")
    data = json.loads(FIXTURE.read_text())
    check_fixture(data)
    print(
        f"Shapely {__import__('shapely').__version__}: seed={data['seed']}, poses={len(data['poses'])}, segments={len(data['segments'])}, samples_per_segment={SAMPLES_PER_SEGMENT}"
    )
    print(
        f"Independent solve() route verification with {SOLVE_SEGMENT_SAMPLES} equal-time samples per segment. Sampling checks the implementation and is not a continuous proof."
    )
    solve_examples()


if __name__ == "__main__":
    main()
