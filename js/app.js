(function () {
  const SECTIONS = [
    ["what-is-3d-printing", "Layer One"],
    ["how-a-printer-works", "Machine Reader"],
    ["safety", "Safety Crew"],
    ["materials", "Material Scout"],
    ["cad-design", "Shape Builder"],
    ["model-libraries", "Library Card"],
    ["slicing", "Slicer"],
    ["troubleshooting", "Fixer"],
    ["vex-robotics", "Gridsmith"],
    ["business", "Pitch Maker"],
    ["capstone", "Capstone"],
  ];
  const STORE = "jg3d-course-v1";

  function blank() {
    return { "56": {}, "78": {}, build: { "56": {}, "78": {} }, pitch: {}, plan: {}, theme: "" };
  }
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORE) || "{}");
      const base = blank();
      base["56"] = data["56"] || {};
      base["78"] = data["78"] || {};
      base.build = data.build || base.build;
      base.pitch = data.pitch || {};
      base.plan = data.plan || {};
      base.theme = data.theme || "";
      base.track = data.track || "";
      return base;
    } catch (err) {
      return blank();
    }
  }
  function save(data) {
    localStorage.setItem(STORE, JSON.stringify(data));
  }

  const state = load();
  const params = new URLSearchParams(location.search);
  if (params.get("theme") === "dark" || params.get("theme") === "light") state.theme = params.get("theme");
  if (params.get("track") === "56" || params.get("track") === "78") state.track = params.get("track");
  const trackButtons = document.querySelectorAll(".track-toggle button");

  function currentTrack() {
    return document.body.dataset.track === "78" ? "78" : "56";
  }

  function renderProgress() {
    const track = currentTrack();
    const done = SECTIONS.filter(function (pair) { return state[track][pair[0]]; }).length;
    const projectDone = takeHomeComplete();
    const total = SECTIONS.length;
    const pct = Math.round((done / total) * 100);
    document.querySelectorAll("[data-progress-count]").forEach(function (node) {
      node.textContent = done + " / " + total;
    });
    document.querySelectorAll("[data-progress-bar]").forEach(function (node) {
      node.style.width = pct + "%";
    });
    document.querySelectorAll(".badge").forEach(function (badge) {
      const id = badge.dataset.badge;
      const earned = id === "take-home" ? projectDone : Boolean(state[track][id]);
      badge.classList.toggle("earned", earned);
    });
  }

  function markSection(id) {
    state[currentTrack()][id] = true;
    save(state);
    renderProgress();
  }

  function setTrack(track) {
    document.body.dataset.track = track;
    state.track = track;
    save(state);
    trackButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.track === track ? "true" : "false");
    });
    renderProgress();
    restoreBuild();
    updateProjectTotals();
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    state.theme = theme;
    save(state);
    const button = document.querySelector("[data-theme-toggle]");
    if (button) {
      const dark = theme === "dark";
      button.setAttribute("aria-pressed", dark ? "true" : "false");
      button.textContent = dark ? "Light mode" : "Dark mode";
    }
  }

  const initialTheme = state.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  setTheme(initialTheme);
  setTrack(state.track === "78" ? "78" : "56");

  trackButtons.forEach(function (button) {
    button.addEventListener("click", function () { setTrack(button.dataset.track); });
  });
  const themeButton = document.querySelector("[data-theme-toggle]");
  if (themeButton) {
    themeButton.addEventListener("click", function () {
      setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  document.querySelectorAll(".quiz").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const sets = Array.from(form.querySelectorAll("fieldset"));
      let correct = 0;
      sets.forEach(function (set) {
        const picked = set.querySelector("input:checked");
        const why = set.querySelector(".why");
        set.querySelectorAll("label").forEach(function (label) {
          label.classList.remove("right", "wrong");
        });
        if (!picked) return;
        const label = picked.closest("label");
        if (picked.value === "1") {
          correct += 1;
          label.classList.add("right");
        } else {
          label.classList.add("wrong");
          const answer = set.querySelector('input[value="1"]');
          if (answer) answer.closest("label").classList.add("right");
        }
        if (why) why.hidden = false;
      });
      const need = Number(form.dataset.pass || 3);
      const result = form.querySelector(".quiz-result");
      const passed = correct >= need && sets.every(function (set) { return set.querySelector("input:checked"); });
      if (!sets.every(function (set) { return set.querySelector("input:checked"); })) {
        result.textContent = "Choose an answer for every question, then check again.";
        return;
      }
      result.textContent = passed
        ? "You got " + correct + " of " + sets.length + ". Badge saved on this track."
        : "You got " + correct + " of " + sets.length + ". " + need + " correct unlocks the badge. Adjust an answer and check again.";
      if (passed) markSection(form.dataset.section);
    });
  });

  document.querySelectorAll("[data-video]").forEach(function (player) {
    const video = player.querySelector("video");
    if (!video) return;
    const status = player.querySelector(".player-status");
    function showPoster(message) {
      player.classList.remove("ready");
      if (status) status.textContent = message;
    }
    video.addEventListener("error", function () {
      showPoster("The custom clip is not in the folder yet. The animated poster stays up until assets/videos/" + player.dataset.video + ".mp4 is added.");
    });
    video.addEventListener("loadeddata", function () {
      player.classList.add("ready");
      if (status) status.textContent = "Custom explainer ready.";
    });
    video.load();
  });

  const makeCopy = {
    add: "Additive: the shape grows as layers stack. You only melt the plastic the part needs, plus a little skirt or support.",
    sub: "Subtractive: you start with a bigger block and cut the scrap away. Carving, drilling, and milling work this way.",
  };
  function playMake(mode) {
    const scene = document.querySelector("#make-art .make-scene");
    if (!scene) return;
    scene.classList.remove("is-playing");
    scene.dataset.mode = mode === "sub" ? "sub" : "add";
    void scene.getBoundingClientRect();
    scene.classList.add("is-playing");
  }
  document.querySelectorAll("[data-make]").forEach(function (button) {
    button.addEventListener("click", function () {
      const mode = button.dataset.make === "sub" ? "sub" : "add";
      document.querySelectorAll("[data-make]").forEach(function (other) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      const target = document.querySelector("[data-make-result]");
      if (target) target.textContent = makeCopy[mode];
      playMake(mode);
    });
  });

  const partCopy = {
    spool: "Filament is the plastic string on the spool. PLA is the school default.",
    extruder: "The extruder is the motor and gear that push filament forward. It does not melt the plastic.",
    hotend: "The hotend is the heated block. For PLA it is often around 200°C. Do not touch it.",
    nozzle: "The nozzle is the tiny tip. Melted plastic comes out in a thin line, often 0.4 mm wide.",
    gantry: "The gantry is the moving frame. It carries the nozzle in X, Y, and Z.",
    bed: "The bed is the print surface. A warm bed helps the first layer stick. It can still burn.",
    part: "The part grows one layer at a time. Each new line welds to the layer under it.",
  };
  document.querySelectorAll("[data-printer-part]").forEach(function (button) {
    button.addEventListener("click", function () {
      const name = button.dataset.printerPart;
      document.querySelectorAll("[data-printer-part]").forEach(function (other) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      const diagram = document.querySelector(".printer-diagram");
      if (diagram) diagram.classList.add("is-lit");
      document.querySelectorAll("[data-part-shape]").forEach(function (shape) {
        shape.classList.toggle("is-on", shape.dataset.partShape === name);
      });
      const detail = document.querySelector("[data-printer-detail]");
      if (detail) detail.textContent = partCopy[name] || "";
    });
  });

  const hazardScene = document.querySelector(".hazard-scene");
  const hazardButtons = hazardScene ? Array.from(hazardScene.querySelectorAll(".hazard")) : [];
  function hazardFoundCount() {
    return hazardButtons.filter(function (button) {
      return button.classList.contains("found-bad") || button.classList.contains("found-ok");
    }).length;
  }
  function updateHazardCount() {
    const count = document.querySelector("[data-hazard-count]");
    if (count) count.textContent = "Found " + hazardFoundCount() + " of " + hazardButtons.length;
  }
  hazardButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const bad = button.dataset.safe === "0";
      button.classList.add(bad ? "found-bad" : "found-ok");
      button.setAttribute("aria-pressed", "true");
      button.textContent = "✓";
      if (hazardScene) hazardScene.classList.add("is-lit");
      document.querySelectorAll("[data-hazard-target]").forEach(function (shape) {
        shape.classList.toggle("is-on", shape.dataset.hazardTarget === button.dataset.hazard);
      });
      const note = document.querySelector("[data-hazard-note]");
      if (note) note.textContent = button.dataset.note;
      updateHazardCount();
    });
  });
  const hazardReset = document.querySelector("[data-hazard-reset]");
  if (hazardReset) {
    hazardReset.addEventListener("click", function () {
      hazardButtons.forEach(function (button) {
        button.classList.remove("found-bad", "found-ok");
        button.setAttribute("aria-pressed", "false");
        button.textContent = button.dataset.glyph || "!";
      });
      if (hazardScene) hazardScene.classList.remove("is-lit");
      document.querySelectorAll("[data-hazard-target]").forEach(function (shape) {
        shape.classList.remove("is-on");
      });
      const note = document.querySelector("[data-hazard-note]");
      if (note) note.textContent = "Tap a mark on the object. Gold means you have not checked it yet. A checkmark means you found it.";
      updateHazardCount();
    });
  }

  const jobs = {
    keychain: "PLA. It is the easiest school filament, comes in bright colors, and a keychain does not need to bend or get hot.",
    clip: "PETG if a teacher is running the printer. It is tougher than PLA. PLA still works for a first prototype.",
    wheel: "TPU, the flexible one. Print it slowly. A PLA wheel would be too stiff and brittle.",
    car: "Not ABS in this makerspace. ABS needs an enclosure and makes stronger fumes. Keep hot-car parts as a design problem, not a school print.",
  };
  const jobFilament = { keychain: "pla", clip: "petg", wheel: "tpu", car: "abs" };
  document.querySelectorAll("[data-job]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-job]").forEach(function (other) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      const target = document.querySelector("[data-job-result]");
      if (target) target.textContent = jobs[button.dataset.job];
      const board = document.querySelector(".filament-board");
      const filament = jobFilament[button.dataset.job];
      if (board && filament) {
        board.classList.add("is-lit");
        board.querySelectorAll("[data-filament]").forEach(function (spool) {
          spool.classList.toggle("is-on", spool.dataset.filament === filament);
        });
      }
    });
  });

  const stage = document.querySelector("[data-extrude]");
  const height = document.querySelector("[data-extrude-height]");
  document.querySelectorAll("[data-shape]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-shape]").forEach(function (other) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      if (!stage) return;
      const shape = button.dataset.shape;
      stage.dataset.shape = shape;
      stage.style.borderRadius = shape === "cylinder" ? "999px" : shape === "hole" ? "12px" : "8px";
      stage.style.width = shape === "wedge" ? "40px" : "90px";
      stage.style.clipPath = shape === "wedge" ? "polygon(0 100%, 100% 100%, 100% 0)" : shape === "hole" ? "circle(42% at 70% 50%)" : "none";
    });
  });
  if (height && stage) {
    height.addEventListener("input", function () {
      stage.style.height = height.value + "px";
      const label = document.querySelector("[data-extrude-label]");
      if (label) label.textContent = height.value + " mm tall in this sketch";
    });
  }

  const licenses = {
    by: "CC BY: you may copy it, change it, and even sell a print, as long as you credit the maker.",
    sa: "CC BY-SA: you may remix it, including for a sale, but your new file must stay under the same ShareAlike license and you must give credit.",
    nc: "CC BY-NC: fine for class and for a gift. Not okay to sell, even at a school fair.",
    nd: "CC BY-ND: you may share it as-is with credit. You may not change the model.",
    zero: "CC0 or public domain: the maker gave up the rights they can. Credit is still good manners.",
    all: "All rights reserved: look only, unless the page clearly says you may download and print.",
  };
  const licenseMarks = {
    by: "CC BY",
    sa: "CC BY-SA",
    nc: "CC BY-NC",
    nd: "CC BY-ND",
    zero: "CC0",
    all: "All rights reserved",
  };
  document.querySelectorAll("[data-license]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-license]").forEach(function (other) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      const target = document.querySelector("[data-license-result]");
      if (target) target.textContent = licenses[button.dataset.license];
      const badge = document.querySelector("[data-license-badge]");
      const kind = button.dataset.license;
      if (badge && licenseMarks[kind]) {
        badge.dataset.kind = kind;
        badge.textContent = licenseMarks[kind];
      }
    });
  });

  function readNumber(id, fallback) {
    const node = document.querySelector(id);
    const value = node ? Number(node.value) : fallback;
    return Number.isFinite(value) ? value : fallback;
  }

  function updateSlicer() {
    const layer = readNumber("#layer-height", 0.2);
    const infill = readNumber("#infill", 15);
    const estimate = window.JGEstimate.estimatePrint(5000, layer, infill, 3);
    const grams = document.querySelector("[data-slice-grams]");
    const time = document.querySelector("[data-slice-time]");
    const fill = document.querySelector("[data-slice-fill]");
    if (grams) grams.textContent = estimate.grams.toFixed(1) + " g";
    if (time) time.textContent = window.JGEstimate.formatMinutes(estimate.minutes);
    if (fill) fill.textContent = Math.round(estimate.effective * 100) + "%";
    const pattern = document.querySelector("#infill-pattern");
    if (pattern) {
      const step = Math.max(4, Math.round(18 - infill / 8));
      pattern.setAttribute("stroke-width", layer < 0.16 ? "1.2" : layer > 0.24 ? "3.2" : "2");
      pattern.setAttribute("stroke-dasharray", infill < 8 ? "0 8" : step + " " + Math.max(2, 14 - infill / 10));
    }
  }
  ["#layer-height", "#infill"].forEach(function (id) {
    const node = document.querySelector(id);
    if (node) node.addEventListener("input", updateSlicer);
  });
  updateSlicer();

  const fixes = {
    stringing: "Those hairs are stringing. Dry the filament, then lower the nozzle temperature a little inside the label's range. A teacher can also raise retraction.",
    warping: "The corners lifted. That is warping. Clean the bed, add a brim, and keep drafts off the printer. PLA warps less than ABS.",
    spaghetti: "The nozzle printed in the air. The part came loose, or a layer had nothing under it. Check the first layer and add supports for steep overhangs.",
    first: "The first layer is the foundation. Too close and the nozzle scrapes. Too far and the lines look like loose rope. Ask a teacher to set the nozzle gap.",
  };
  document.querySelectorAll("[data-symptom]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-symptom]").forEach(function (other) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      const target = document.querySelector("[data-symptom-result]");
      if (target) target.textContent = fixes[button.dataset.symptom];
      const board = document.querySelector(".failure-board");
      if (board) {
        board.classList.add("is-lit");
        board.querySelectorAll("[data-failure]").forEach(function (card) {
          card.classList.toggle("is-on", card.dataset.failure === button.dataset.symptom);
        });
      }
    });
  });

  const holes = document.querySelectorAll(".pitch-grid .hole");
  function updateGrid() {
    const platform = document.querySelector("[data-platform].is-selected, [data-platform][aria-pressed='true']");
    const iq = !platform || platform.dataset.platform !== "v5";
    const grid = document.querySelector(".pitch-grid");
    if (grid) grid.dataset.gridPlatform = iq ? "iq" : "v5";
    const selected = Array.from(holes).filter(function (hole) { return hole.getAttribute("aria-pressed") === "true"; });
    const out = document.querySelector("[data-grid-result]");
    if (!out) return;
    if (!selected.length) {
      out.textContent = iq
        ? "Tap holes to grow a practice plate. VEX IQ pitch is 12.70 mm. Official snap holes are 4.20 mm across."
        : "Tap holes to grow a practice plate. VEX V5 holes sit on a 0.500 inch (12.70 mm) grid. The metal hole is 0.182 inch square.";
      return;
    }
    const cols = selected.map(function (hole) { return Number(hole.dataset.col); });
    const rows = selected.map(function (hole) { return Number(hole.dataset.row); });
    const spanX = (Math.max.apply(null, cols) - Math.min.apply(null, cols)) * 12.7;
    const spanY = (Math.max.apply(null, rows) - Math.min.apply(null, rows)) * 12.7;
    const holeText = iq
      ? "Draw snap holes at the official 4.20 mm, then test-fit a real IQ pin."
      : "The official metal opening is a 0.182 inch square. A round printed clearance hole is a different shape. Start a test coupon near 4.8 to 5.2 mm and adjust.";
    out.textContent = selected.length + " holes. Center span " + spanX.toFixed(1) + " mm by " + spanY.toFixed(1) + " mm (" +
      (spanX / 25.4).toFixed(2) + " in by " + (spanY / 25.4).toFixed(2) + " in). " + holeText + " Practice part only until the current game manual says otherwise.";
  }
  holes.forEach(function (hole) {
    hole.addEventListener("click", function () {
      const on = hole.getAttribute("aria-pressed") === "true";
      hole.setAttribute("aria-pressed", on ? "false" : "true");
      updateGrid();
    });
  });
  document.querySelectorAll("[data-platform]").forEach(function (button) {
    button.addEventListener("click", function () {
      document.querySelectorAll("[data-platform]").forEach(function (other) {
        other.setAttribute("aria-pressed", other === button ? "true" : "false");
      });
      updateGrid();
    });
  });
  updateGrid();

  function updateGear() {
    const driver = readNumber("#driver-teeth", 12);
    const driven = readNumber("#driven-teeth", 36);
    const target = document.querySelector("[data-gear-result]");
    if (!target || driver <= 0 || driven <= 0) return;
    const ratio = driven / driver;
    target.textContent = "Ratio " + driven + " / " + driver + " = " + ratio.toFixed(2) +
      ". The big gear turns once each time the crank gear turns " + ratio.toFixed(2) +
      " times. The arm side is slower and can push harder. The catapult starter uses 36 / 12 = 3.";
  }
  ["#driver-teeth", "#driven-teeth"].forEach(function (id) {
    const node = document.querySelector(id);
    if (node) node.addEventListener("input", updateGear);
  });
  updateGear();

  function money(value) {
    return "$" + value.toFixed(2);
  }
  function updateCost() {
    const grams = readNumber("#cost-grams", 20);
    const perKg = readNumber("#cost-kg", 20);
    const minutes = readNumber("#cost-minutes", 40);
    const rate = readNumber("#cost-rate", 0);
    const markup = readNumber("#cost-markup", 50);
    const qty = readNumber("#cost-qty", 1);
    const pack = readNumber("#cost-pack", 0);
    const fee = readNumber("#cost-fee", 0);
    const filament = (grams / 1000) * perKg;
    const time = (minutes / 60) * rate;
    const unitCost = filament + time + pack;
    const price = unitCost * (1 + markup / 100);
    const feeCost = price * (fee / 100);
    const profit = (price - feeCost - unitCost) * qty;
    const set = function (sel, text) {
      const node = document.querySelector(sel);
      if (node) node.textContent = text;
    };
    set("[data-cost-filament]", money(filament));
    set("[data-cost-unit]", money(unitCost));
    set("[data-cost-price]", money(price));
    set("[data-cost-profit]", money(profit));
    set("[data-cost-revenue]", money(price * qty));
  }
  ["#cost-grams", "#cost-kg", "#cost-minutes", "#cost-rate", "#cost-markup", "#cost-qty", "#cost-pack", "#cost-fee"].forEach(function (id) {
    const node = document.querySelector(id);
    if (node) node.addEventListener("input", updateCost);
  });
  updateCost();

  function updateProjectTotals() {
    document.querySelectorAll("[data-project]").forEach(function (project) {
      let grams = 0;
      let minutes = 0;
      project.querySelectorAll("[data-part]").forEach(function (row) {
        const qty = Number(row.dataset.qty || 1);
        const estimate = window.JGEstimate.estimatePrint(
          Number(row.dataset.volume),
          Number(row.dataset.layer),
          Number(row.dataset.infill),
          Number(row.dataset.perimeters)
        );
        const gramCell = row.querySelector("[data-grams]");
        const timeCell = row.querySelector("[data-time]");
        if (gramCell) gramCell.textContent = (estimate.grams * qty).toFixed(1);
        if (timeCell) timeCell.textContent = window.JGEstimate.formatMinutes(estimate.minutes * qty);
        grams += estimate.grams * qty;
        minutes += estimate.minutes * qty;
      });
      const g = project.querySelector("[data-total-grams]");
      const t = project.querySelector("[data-total-time]");
      const cost = project.querySelector("[data-total-cost]");
      const klass = project.querySelector("[data-class-time]");
      const klassCost = project.querySelector("[data-class-cost]");
      if (g) g.textContent = grams.toFixed(0) + " g";
      if (t) t.textContent = window.JGEstimate.formatMinutes(minutes);
      if (cost) cost.textContent = money((grams / 1000) * 20);
      if (klass) klass.textContent = window.JGEstimate.formatMinutes(minutes * 20);
      if (klassCost) klassCost.textContent = money((grams / 1000) * 20 * 20);
    });
  }
  updateProjectTotals();

  function buildKey() {
    return currentTrack() === "78" ? "catapult" : "buddy";
  }
  function restoreBuild() {
    const saved = (state.build[currentTrack()] || {})[buildKey()] || {};
    document.querySelectorAll(".check-list input").forEach(function (box) {
      const visible = box.closest(".track-56, .track-78") == null || box.closest(currentTrack() === "78" ? ".track-78" : ".track-56");
      if (!visible) return;
      box.checked = Boolean(saved[box.dataset.step]);
    });
    updateCelebrate();
  }
  function takeHomeComplete() {
    const list = document.querySelector(currentTrack() === "78" ? ".track-78 .check-list" : ".track-56 .check-list");
    if (!list) return false;
    const boxes = Array.from(list.querySelectorAll("input"));
    return boxes.length > 0 && boxes.every(function (box) { return box.checked; });
  }
  function updateCelebrate() {
    document.querySelectorAll("[data-celebrate]").forEach(function (panel) {
      const mine = currentTrack() === "78" ? panel.dataset.celebrate === "78" : panel.dataset.celebrate === "56";
      panel.classList.toggle("show", mine && takeHomeComplete());
    });
    renderProgress();
  }
  document.querySelectorAll(".check-list input").forEach(function (box) {
    box.addEventListener("change", function () {
      const track = currentTrack();
      const key = buildKey();
      state.build[track] = state.build[track] || {};
      state.build[track][key] = state.build[track][key] || {};
      state.build[track][key][box.dataset.step] = box.checked;
      save(state);
      updateCelebrate();
    });
  });
  restoreBuild();

  document.querySelectorAll("[data-save]").forEach(function (form) {
    const bucket = form.dataset.save;
    const saved = state[bucket] || {};
    Array.from(form.elements).forEach(function (field) {
      if (field.name && saved[field.name] != null) field.value = saved[field.name];
    });
    form.addEventListener("input", function () {
      const next = {};
      Array.from(form.elements).forEach(function (field) {
        if (field.name) next[field.name] = field.value;
      });
      state[bucket] = next;
      save(state);
    });
  });

  const links = Array.from(document.querySelectorAll(".section-nav a"));
  const sections = links.map(function (link) { return document.querySelector(link.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.setAttribute("aria-current", link.getAttribute("href") === "#" + entry.target.id ? "true" : "false");
        });
      });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 });
    sections.forEach(function (section) { navObserver.observe(section); });

    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add("in");
      });
    }, { threshold: 0.25 });
    document.querySelectorAll(".reveal").forEach(function (node) { revealObserver.observe(node); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (node) { node.classList.add("in"); });
  }
})();
