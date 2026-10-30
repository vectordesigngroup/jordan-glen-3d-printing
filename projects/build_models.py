#!/usr/bin/env python3
"""Build starter STL meshes for the Jordan Glen take-home projects.

OpenSCAD files in the same folders are the remix source. These STLs are
exported from the same dimensions so the site can offer a download even
when a student has not installed OpenSCAD yet.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import trimesh
from shapely.geometry import Point, Polygon

ROOT = Path(__file__).resolve().parent

PIN_D = 6.0
HEAD_HOLE_D = 6.3  # 0.3 mm clearance, swivel
ARM_HOLE_D = 6.2  # 0.2 mm clearance, snug
LEG_POST_D = 8.0
LEG_HOLE_D = 8.2  # 0.2 mm clearance


def export(mesh: trimesh.Trimesh, path: Path) -> dict:
    mesh.merge_vertices()
    mesh.export(path)
    volume = float(abs(mesh.volume))
    bounds = mesh.bounds
    size = (bounds[1] - bounds[0]).tolist()
    print(f"{path.name:22} {volume:8.0f} mm3  {size[0]:6.1f} x {size[1]:6.1f} x {size[2]:6.1f} mm")
    return {
        "file": path.name,
        "volume_mm3": round(volume, 1),
        "size_mm": [round(v, 1) for v in size],
        "watertight": bool(mesh.is_watertight),
    }


def union(meshes: list[trimesh.Trimesh]) -> trimesh.Trimesh:
    return trimesh.boolean.union(meshes, engine="manifold")


def difference(base: trimesh.Trimesh, holes: list[trimesh.Trimesh]) -> trimesh.Trimesh:
    return trimesh.boolean.difference([base, *holes], engine="manifold")


def cyl(radius: float, height: float, center: tuple[float, float, float], axis: str = "z") -> trimesh.Trimesh:
    mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=64)
    if axis == "x":
        mesh.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
    elif axis == "y":
        mesh.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
    mesh.apply_translation(center)
    return mesh


def box(extents: tuple[float, float, float], center: tuple[float, float, float]) -> trimesh.Trimesh:
    mesh = trimesh.creation.box(extents=extents)
    mesh.apply_translation(center)
    return mesh


def extrude(poly: Polygon, height: float, z: float = 0.0) -> trimesh.Trimesh:
    mesh = trimesh.creation.extrude_polygon(poly, height)
    mesh.apply_translation((0, 0, z))
    return mesh


def gear_polygon(teeth: int, module: float, backlash: float = 0.2) -> Polygon:
    """Trapezoid spur tooth. Starter mesh, not a machinist's involute.

    Backlash shortens the tooth so a classroom FDM print can turn after a test fit.
    """
    pitch_r = module * teeth / 2.0
    tip_r = pitch_r + module
    root_r = pitch_r - 1.25 * module
    step = 2 * math.pi / teeth
    thick = (math.pi / teeth) - (backlash / pitch_r)
    root_thick = thick * 1.05
    tip_thick = thick * 0.48
    pts: list[tuple[float, float]] = []
    for k in range(teeth):
        center = step * k
        profile = (
            (center - root_thick / 2, root_r),
            (center - tip_thick / 2, tip_r),
            (center + tip_thick / 2, tip_r),
            (center + root_thick / 2, root_r),
        )
        for ang, radius in profile:
            pts.append((radius * math.cos(ang), radius * math.sin(ang)))
        a0 = center + root_thick / 2
        a1 = center + step - root_thick / 2
        for s in range(1, 4):
            ang = a0 + (a1 - a0) * s / 4
            pts.append((root_r * math.cos(ang), root_r * math.sin(ang)))
    return Polygon(pts).buffer(0)


def gear_mesh(teeth: int, module: float, thickness: float, bore_d: float) -> trimesh.Trimesh:
    poly = gear_polygon(teeth, module)
    hole = Point(0, 0).buffer(bore_d / 2, resolution=48)
    solid = extrude(Polygon(poly.exterior.coords, [list(hole.exterior.coords)]), thickness)
    # Hub so the bore has a little more bearing length than a thin gear web.
    return solid


def desk_buddy() -> dict:
    out = ROOT / "desk-buddy-bot"
    out.mkdir(parents=True, exist_ok=True)
    parts = {}

    cup_h = 60.0
    cup_outer = cyl(16.5, cup_h, (0, 0, cup_h / 2))
    # Floor stays solid so leg sockets and the pen cavity do not meet.
    cup_inner = cyl(12.6, 46, (0, 0, 37))
    back = box((64, 7, 58), (0, -18, 32))
    rest = box((64, 6, 70), (0, 0, 0))
    rest.apply_transform(trimesh.transformations.rotation_matrix(math.radians(22), [1, 0, 0]))
    rest.apply_translation((0, -34, 36))
    lip = box((64, 10, 7), (0, -48, 14))
    body = union([cup_outer, back, rest, lip])
    body = difference(body, [cup_inner])
    sockets = [
        cyl(LEG_HOLE_D / 2, 12, (-11, 4, 5)),
        cyl(LEG_HOLE_D / 2, 12, (11, 4, 5)),
    ]
    bosses = [
        cyl(7.2, 14, (-22, 0, 40), axis="x"),
        cyl(7.2, 14, (22, 0, 40), axis="x"),
    ]
    arm_holes = [
        cyl(ARM_HOLE_D / 2, 16, (-24, 0, 40), axis="x"),
        cyl(ARM_HOLE_D / 2, 16, (24, 0, 40), axis="x"),
    ]
    top_boss = cyl(8, 8, (0, 0, 64))
    head_bore = cyl(HEAD_HOLE_D / 2, 12, (0, 0, 64))
    pocket = box((18, 3.2, 8), (0, 15.3, 24))
    body = difference(union([body, *bosses, top_boss]), [*sockets, *arm_holes, head_bore, pocket])
    parts["body"] = export(body, out / "body.stl")

    head_blank = box((32, 28, 26), (0, 0, 13))
    head_round = cyl(14, 26, (0, 0, 13), axis="y")
    head = union([head_blank, head_round])
    head = difference(head, [cyl(HEAD_HOLE_D / 2, 16, (0, 0, 7))])
    head = difference(
        head,
        [
            cyl(2.8, 8, (10, 6, 16), axis="x"),
            cyl(2.8, 8, (10, -6, 16), axis="x"),
        ],
    )
    parts["head"] = export(head, out / "head.stl")

    arm_bar = box((40, 14, 8), (16, 0, 0))
    hand = cyl(7, 8, (36, 0, 0), axis="z")
    shoulder = cyl(7, 8, (0, 0, 0))
    arm = difference(union([arm_bar, hand, shoulder]), [cyl(ARM_HOLE_D / 2, 12, (0, 0, 0))])
    parts["arm"] = export(arm, out / "arm.stl")

    foot = box((28, 18, 8), (6, 0, 4))
    toe = cyl(9, 8, (16, 0, 4))
    post = cyl(LEG_POST_D / 2, 14, (0, 0, 13))
    leg = union([foot, toe, post])
    parts["leg"] = export(leg, out / "leg.stl")

    plate = box((60, 16, 3.2), (0, 0, 1.6))
    tab = box((16.2, 6, 2.4), (0, 10, 1.2))
    parts["name-plate"] = export(union([plate, tab]), out / "name-plate.stl")

    pin_shaft = cyl(PIN_D / 2, 18, (0, 0, 9))
    pin_head = cyl(4.6, 2.4, (0, 0, 1.2))
    parts["pin"] = export(union([pin_shaft, pin_head]), out / "pin.stl")
    return parts


def catapult() -> dict:
    out = ROOT / "crank-catapult"
    out.mkdir(parents=True, exist_ok=True)
    parts = {}
    module = 1.5
    pinion_teeth = 12
    gear_teeth = 36
    center = (pinion_teeth + gear_teeth) * module / 2  # 36 mm

    base_plate = box((130, 90, 6), (0, 0, 3))
    # Towers for the two gear axles. Pinion at x=-18, gear at x=+18 (36 mm apart).
    tower_a = box((14, 22, 28), (-18, 0, 18))
    tower_b = box((14, 22, 36), (18, 0, 22))
    # Hinge clevis at the back of the gear tower.
    clevis_l = box((16, 6, 22), (36, 10, 16))
    clevis_r = box((16, 6, 22), (36, -10, 16))
    cheek = box((8, 26, 8), (28, 0, 10))
    base = union([base_plate, tower_a, tower_b, clevis_l, clevis_r, cheek])
    axle_hole_d = 5.3  # 0.3 mm over a 5.0 mm axle
    holes = [
        cyl(axle_hole_d / 2, 30, (-18, 0, 24), axis="y"),
        cyl(axle_hole_d / 2, 30, (18, 0, 28), axis="y"),
        cyl(5.3 / 2, 28, (40, 0, 18), axis="y"),
    ]
    # Three stop holes, 8 mm apart, for the adjustable peg.
    for i, x in enumerate((48, 56, 64)):
        holes.append(cyl(2.6, 10, (x, 0, 5)))
    # Name recess.
    holes.append(box((46, 16, 2.2), (-28, 28, 5.2)))
    parts["base"] = export(difference(base, holes), out / "base.stl")

    pinion = gear_mesh(pinion_teeth, module, 6, 5.2)
    pinion.apply_translation((0, 0, 0))
    parts["pinion"] = export(pinion, out / "pinion-12t.stl")

    gear = gear_mesh(gear_teeth, module, 6, 5.2)
    # Winding peg on the large gear so it can pull the arm band.
    peg = cyl(3.2, 8, (12, 0, 10))
    parts["gear"] = export(union([gear, peg]), out / "gear-36t.stl")

    crank_arm = box((42, 12, 6), (16, 0, 3))
    crank_hub = cyl(8, 6, (0, 0, 3))
    handle = cyl(4.2, 16, (36, 0, 12))
    # 5.2 mm hole (0.2 mm over the 5.0 mm axle) plus a flat so the crank turns the axle.
    crank_hole = cyl(2.6, 10, (0, 0, 3))
    crank_flat = box((3.2, 2.2, 10), (1.6, 2.2, 3))
    crank = difference(union([crank_arm, crank_hub, handle]), [crank_hole, crank_flat])
    parts["crank"] = export(crank, out / "crank.stl")

    axle_shaft = cyl(2.5, 32, (0, 0, 16))
    axle_head = cyl(4.2, 2.4, (0, 0, 1.2))
    axle_flat = box((3.2, 2.0, 14), (1.5, 2.15, 24))
    parts["axle"] = export(difference(union([axle_shaft, axle_head]), [axle_flat]), out / "axle.stl")

    arm_beam = box((78, 14, 8), (30, 0, 4))
    knuckle = cyl(6, 14, (0, 0, 6), axis="y")
    scoop = box((22, 22, 8), (72, 0, 8))
    scoop_hole = box((14, 14, 6), (74, 0, 10))
    arm = difference(union([arm_beam, knuckle, scoop]), [cyl(5.3 / 2, 20, (0, 0, 6), axis="y"), scoop_hole])
    parts["arm"] = export(arm, out / "arm.stl")

    hinge = union([cyl(2.5, 28, (0, 0, 14), axis="z"), cyl(4.4, 2.4, (0, 0, 1.2))])
    parts["hinge-pin"] = export(hinge, out / "hinge-pin.stl")

    stop = union([cyl(2.4, 12, (0, 0, 6)), cyl(5, 2.4, (0, 0, 11.2))])
    parts["stop-peg"] = export(stop, out / "stop-peg.stl")

    plate = box((42, 14, 2.2), (0, 0, 1.1))
    parts["name-plate"] = export(plate, out / "name-plate.stl")

    meta = {
        "module_mm": module,
        "pinion_teeth": pinion_teeth,
        "gear_teeth": gear_teeth,
        "center_distance_mm": center,
        "ratio": gear_teeth / pinion_teeth,
    }
    return parts, meta


def main() -> None:
    buddy = desk_buddy()
    cat_parts, cat_meta = catapult()
    manifest = {
        "desk-buddy-bot": {
            "clearance_mm": {"head_swivel": 0.3, "arms": 0.2, "legs": 0.2, "name_tab": 0.3},
            "parts": buddy,
        },
        "crank-catapult": {
            "gear": cat_meta,
            "clearance_mm": {"axles": 0.3, "hinge": 0.3, "stop": 0.2, "crank_socket": 0.1},
            "parts": cat_parts,
        },
    }
    path = ROOT / "volumes.json"
    path.write_text(json.dumps(manifest, indent=2))
    print("wrote", path)


if __name__ == "__main__":
    main()
