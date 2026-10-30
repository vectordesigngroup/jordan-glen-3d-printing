// Crank-Gear Mini Catapult — starter template for Jordan Glen grades 7-8.
// Ratio = gear_teeth / pinion_teeth. The starter is 36 / 12 = 3.
// Render one part:
//   openscad -D 'part="gear"' -o gear-36t.stl crank-catapult.scad
// Launch soft pom-poms only. Aim away from people.
// Moving holes are 0.2–0.3 mm larger than the pins. The shipped STLs
// come from ../build_models.py using these dimensions.

part = "base"; // base, pinion, gear, crank, axle, arm, hinge_pin, stop_peg, name_plate

module_m = 1.5;
pinion_teeth = 12;
gear_teeth = 36;
backlash = 0.2;
axle_d = 5.0;
axle_hole_d = 5.3; // 0.3 mm clearance
center = (pinion_teeth + gear_teeth) * module_m / 2;

module spur(teeth, thickness, bore) {
  pitch_r = module_m * teeth / 2;
  tip_r = pitch_r + module_m;
  root_r = pitch_r - 1.25 * module_m;
  step = 360 / teeth;
  difference() {
    union() {
      cylinder(h = thickness, r = root_r, $fn = 64);
      for (k = [0 : teeth - 1]) {
        rotate([0, 0, k * step])
          linear_extrude(height = thickness)
            polygon([
              [-1.15, root_r - 0.2],
              [-0.45, tip_r],
              [0.45, tip_r],
              [1.15, root_r - 0.2]
            ]);
      }
    }
    translate([0, 0, -1]) cylinder(h = thickness + 2, d = bore, $fn = 36);
  }
}

module base() {
  difference() {
    union() {
      cube([130, 90, 6]);
      translate([40, 34, 6]) cube([14, 22, 22]);
      translate([76, 34, 6]) cube([14, 22, 30]);
      translate([96, 28, 6]) cube([16, 6, 16]);
      translate([96, 56, 6]) cube([16, 6, 16]);
    }
    translate([47, 30, 24]) rotate([90, 0, 0]) cylinder(h = 30, d = axle_hole_d, $fn = 32);
    translate([83, 30, 28]) rotate([90, 0, 0]) cylinder(h = 30, d = axle_hole_d, $fn = 32);
    translate([104, 20, 18]) rotate([90, 0, 0]) cylinder(h = 40, d = axle_hole_d, $fn = 32);
    for (x = [48, 56, 64]) translate([x, 45, -1]) cylinder(h = 10, d = 5.2, $fn = 24);
    translate([12, 62, 4]) cube([46, 16, 3]);
  }
}

module crank() {
  difference() {
    union() {
      cylinder(h = 6, d = 16, $fn = 40);
      translate([0, -6, 0]) cube([40, 12, 6]);
      translate([36, 0, 0]) cylinder(h = 16, d = 8.4, $fn = 32);
    }
    translate([0, 0, -1]) cylinder(h = 10, d = 5.2, $fn = 32);
  }
}

module axle() {
  cylinder(h = 32, d = axle_d, $fn = 32);
  cylinder(h = 2.4, d = 8.4, $fn = 32);
}

module arm() {
  difference() {
    union() {
      translate([0, -7, 0]) cube([78, 14, 8]);
      rotate([90, 0, 0]) cylinder(h = 14, d = 12, center = true, $fn = 32);
      translate([64, -11, 4]) cube([22, 22, 8]);
    }
    rotate([90, 0, 0]) cylinder(h = 20, d = axle_hole_d, center = true, $fn = 28);
    translate([70, -7, 6]) cube([14, 14, 8]);
  }
}

module hinge_pin() {
  cylinder(h = 28, d = 5, $fn = 28);
  cylinder(h = 2.4, d = 8.8, $fn = 28);
}

module stop_peg() {
  cylinder(h = 12, d = 4.8, $fn = 24);
  translate([0, 0, 10]) cylinder(h = 2.4, d = 10, $fn = 24);
}

if (part == "base") base();
else if (part == "pinion") spur(pinion_teeth, 6, 5.2);
else if (part == "gear") spur(gear_teeth, 6, 5.2);
else if (part == "crank") crank();
else if (part == "axle") axle();
else if (part == "arm") arm();
else if (part == "hinge_pin") hinge_pin();
else if (part == "stop_peg") stop_peg();
else if (part == "name_plate") cube([42, 14, 2.2]);
