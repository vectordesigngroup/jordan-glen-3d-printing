/* Classroom print estimate shared by the slicer lab and the take-home projects.
   This is not a slicer. It is a transparent school model:
   - some of the part is walls, tops, and bottoms
   - the rest is infill
   - PLA is about 1.24 g per cm3
   - a school printer lays down about 12 mm3/s at 0.20 mm layers
     and slows when the layers get thinner
*/
(function (root) {
  const PLA_DENSITY = 1.24;

  function estimatePrint(volumeMm3, layerHeight, infillPct, perimeters) {
    const walls = perimeters == null ? 3 : perimeters;
    const layer = Math.min(0.32, Math.max(0.08, Number(layerHeight) || 0.2));
    const infill = Math.min(100, Math.max(0, Number(infillPct) || 0));
    const shell = Math.min(0.78, 0.16 + walls * 0.07 + (0.2 / layer) * 0.05);
    const effective = shell + (1 - shell) * (infill / 100);
    const filamentMm3 = volumeMm3 * effective;
    const grams = (filamentMm3 / 1000) * PLA_DENSITY;
    const flow = 12 * Math.sqrt(layer / 0.2);
    const minutes = filamentMm3 / flow / 60;
    return { grams, minutes, effective, filamentMm3, layer, infill };
  }

  function formatMinutes(minutes) {
    const total = Math.max(1, Math.round(minutes));
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (hours <= 0) return total + " min";
    return hours + " h " + mins + " min";
  }

  root.JGEstimate = { estimatePrint, formatMinutes, PLA_DENSITY };
})(window);
