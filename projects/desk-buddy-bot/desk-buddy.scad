// Desk Buddy Bot — starter template for Jordan Glen School.
// Remix these numbers, then render the part you need:
//   openscad -D 'part="body"' -o body.stl desk-buddy.scad
// Shipped STL files were exported from ../build_models.py at the same sizes.
// Clearance: head hole is 0.3 mm over the pin, arm and leg holes are 0.2 mm over.

part = "body"; // body, head, arm, leg, name_plate, pin

pin_d = 6.0;
head_hole_d = 6.3;
arm_hole_d = 6.2;
leg_post_d = 8.0;
leg_hole_d = 8.2;

module pin() {
  cylinder(h = 18, d = pin_d, $fn = 64);
  cylinder(h = 2.4, d = 9.2, $fn = 64);
}

module name_plate() {
  cube([60, 16, 3.2]);
  translate([-8.1, 16, 0]) cube([16.2, 6, 2.4]);
}

module arm() {
  hull() {
    cylinder(h = 8, d = 14, $fn = 48);
    translate([36, 0, 0]) cylinder(h = 8, d = 14, $fn = 48);
  }
  difference() {
    cylinder(h = 8, d = 14, $fn = 48);
    translate([0, 0, -1]) cylinder(h = 12, d = arm_hole_d, $fn = 48);
  }
}

module leg() {
  hull() {
    cylinder(h = 8, d = 16, $fn = 40);
    translate([16, 0, 0]) cylinder(h = 8, d = 16, $fn = 40);
  }
  cylinder(h = 20, d = leg_post_d, $fn = 48);
}

module head() {
  difference() {
    hull() {
      cube([32, 28, 26], center = true);
      rotate([90, 0, 0]) cylinder(h = 28, d = 28, center = true, $fn = 64);
    }
    translate([0, 0, -6]) cylinder(h = 16, d = head_hole_d, $fn = 48);
    translate([8, 6, 2]) rotate([0, 90, 0]) cylinder(h = 10, d = 5.6, $fn = 32);
    translate([8, -6, 2]) rotate([0, 90, 0]) cylinder(h = 10, d = 5.6, $fn = 32);
  }
}

module body() {
  difference() {
    union() {
      cylinder(h = 60, d = 33, $fn = 80);
      translate([-32, -22, 4]) cube([64, 8, 58]);
      translate([0, -8, 20]) rotate([22, 0, 0]) translate([-32, -40, 0]) cube([64, 8, 62]);
      translate([-32, -52, 10]) cube([64, 12, 8]);
      translate([-29, 0, 36]) rotate([0, 90, 0]) cylinder(h = 14, d = 14.4, $fn = 40);
      translate([15, 0, 36]) rotate([0, 90, 0]) cylinder(h = 14, d = 14.4, $fn = 40);
      translate([0, 0, 60]) cylinder(h = 8, d = 16, $fn = 48);
    }
    translate([0, 0, 16]) cylinder(h = 46, d = 25.2, $fn = 80);
    translate([-11, 4, -1]) cylinder(h = 12, d = leg_hole_d, $fn = 40);
    translate([11, 4, -1]) cylinder(h = 12, d = leg_hole_d, $fn = 40);
    translate([-32, 0, 40]) rotate([0, 90, 0]) cylinder(h = 16, d = arm_hole_d, $fn = 40);
    translate([18, 0, 40]) rotate([0, 90, 0]) cylinder(h = 16, d = arm_hole_d, $fn = 40);
    translate([0, 0, 58]) cylinder(h = 14, d = head_hole_d, $fn = 40);
    translate([-9, 13.5, 20]) cube([18, 4, 8]);
  }
}

if (part == "body") body();
else if (part == "head") head();
else if (part == "arm") arm();
else if (part == "leg") leg();
else if (part == "name_plate") name_plate();
else if (part == "pin") pin();
