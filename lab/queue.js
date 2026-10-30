(function () {
  const KEY = "jg3d-print-queue";
  const blank = { jobs: [], formLink: "" };

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "");
      if (!data || !Array.isArray(data.jobs)) return blank;
      data.formLink = data.formLink || "";
      return data;
    } catch (err) {
      return { jobs: [], formLink: "" };
    }
  }
  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  function uid() {
    return "job-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }

  const state = load();
  const board = document.querySelector("[data-board]");
  const table = document.querySelector("[data-jobs]");
  const totals = document.querySelector("[data-totals]");
  const form = document.querySelector("[data-job-form]");
  const formLink = document.querySelector("[data-form-link]");
  const fileInput = document.querySelector("[data-import]");
  const gate = document.querySelector("[data-operator-gate]");

  if (formLink) formLink.value = state.formLink;

  function operatorNote() {
    if (!gate) return;
    let safety = false;
    try {
      const course = JSON.parse(localStorage.getItem("jg3d-course-v1") || "{}");
      safety = Boolean((course["56"] && course["56"].safety) || (course["78"] && course["78"].safety));
    } catch (err) {
      safety = false;
    }
    let badge = {};
    try { badge = JSON.parse(localStorage.getItem("jg3d-operator") || "{}"); }
    catch (err) { badge = {}; }
    const ready = safety && Number(badge.prints) >= 3 && badge.maintenance;
    gate.textContent = ready
      ? "Printer Operator checklist looks complete on this browser. A teacher still approves every job. This badge is a reminder, not a lock."
      : "Printer Operator badge is not complete on this browser (safety quiz, three supervised prints, and one maintenance task, recorded in the portfolio). A teacher can still approve jobs. This is a reminder, not a lock.";
  }

  function render() {
    operatorNote();
    if (board) {
      const cards = [];
      for (let i = 1; i <= 9; i += 1) {
        const active = state.jobs.find(function (job) {
          return Number(job.printer) === i && (job.status === "approved" || job.status === "printing");
        });
        cards.push(
          "<article class='printer-card'><h3>Printer " + i + "</h3><p>" +
          (active ? active.name + " · " + active.status + " · " + active.color : "Idle") +
          "</p></article>"
        );
      }
      board.innerHTML = cards.join("");
    }
    if (table) {
      if (!state.jobs.length) {
        table.innerHTML = "<tr><td colspan='8'>No jobs yet. Add one below.</td></tr>";
      } else {
        table.innerHTML = state.jobs.map(function (job) {
          return "<tr><td>" + escapeHtml(job.name) + "</td><td>" + (job.band === "78" ? "7–8" : "5–6") +
            "</td><td>" + escapeHtml(job.file) + "</td><td>" + job.minutes + " min</td><td>" + job.grams +
            " g</td><td>" + job.printer + "</td><td>" + escapeHtml(job.color) + "</td><td><span class='status " +
            job.status + "'>" + job.status + "</span>" +
            (job.reason ? "<br>" + escapeHtml(job.reason) : "") +
            "<div class='row no-print'>" + actions(job) + "</div></td></tr>";
        }).join("");
      }
      table.querySelectorAll("[data-act]").forEach(function (button) {
        button.addEventListener("click", function () { act(button.dataset.id, button.dataset.act); });
      });
    }
    if (totals) {
      const byName = {};
      let grams = 0;
      let minutes = 0;
      state.jobs.forEach(function (job) {
        if (job.status === "rejected") return;
        grams += Number(job.grams) || 0;
        minutes += Number(job.minutes) || 0;
        byName[job.name] = byName[job.name] || { grams: 0, minutes: 0 };
        byName[job.name].grams += Number(job.grams) || 0;
        byName[job.name].minutes += Number(job.minutes) || 0;
      });
      const rows = Object.keys(byName).sort().map(function (name) {
        const item = byName[name];
        return "<li>" + escapeHtml(name) + ": " + item.grams.toFixed(1) + " g, " + (item.minutes / 60).toFixed(2) + " h</li>";
      }).join("");
      totals.innerHTML = "<p><strong>Class (not counting rejected jobs):</strong> " + grams.toFixed(1) +
        " g and " + (minutes / 60).toFixed(2) + " hours.</p><ul>" + (rows || "<li>No approved work yet.</li>") + "</ul>";
    }
  }

  function actions(job) {
    const id = job.id;
    const button = function (actName, label) {
      return "<button class='btn' type='button' data-act='" + actName + "' data-id='" + id + "'>" + label + "</button>";
    };
    if (job.status === "submitted") return button("approved", "Approve") + button("rejected", "Reject");
    if (job.status === "approved") return button("printing", "Mark printing") + button("rejected", "Reject");
    if (job.status === "printing") return button("done", "Done") + button("failed", "Failed");
    return "";
  }

  function act(id, next) {
    const job = state.jobs.find(function (item) { return item.id === id; });
    if (!job) return;
    if (next === "rejected" || next === "failed") {
      const reason = window.prompt(next === "failed" ? "Why did it fail?" : "Why reject this job?", job.reason || "");
      if (reason == null) return;
      job.reason = reason.trim();
    }
    job.status = next;
    save(state);
    render();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[ch];
    });
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const file = String(data.get("file") || "").trim();
      const minutes = Number(data.get("minutes"));
      const grams = Number(data.get("grams"));
      const printer = Number(data.get("printer"));
      if (!name || !file || !Number.isFinite(minutes) || minutes <= 0 || !Number.isFinite(grams) || grams <= 0 || printer < 1 || printer > 9) {
        const msg = document.querySelector("[data-form-msg]");
        if (msg) msg.textContent = "Add a name, a file name, minutes, grams, and a printer from 1 to 9.";
        return;
      }
      state.jobs.unshift({
        id: uid(),
        name: name,
        band: data.get("band") === "78" ? "78" : "56",
        file: file,
        minutes: Math.round(minutes),
        grams: Math.round(grams * 10) / 10,
        printer: printer,
        color: String(data.get("color") || "PLA"),
        status: "submitted",
        reason: "",
        created: new Date().toISOString()
      });
      save(state);
      form.reset();
      const msg = document.querySelector("[data-form-msg]");
      if (msg) msg.textContent = "Job submitted. A teacher approves it before it prints.";
      render();
    });
  }

  if (formLink) {
    formLink.addEventListener("change", function () {
      state.formLink = formLink.value.trim();
      save(state);
    });
  }

  function toCsv() {
    const header = ["id", "name", "band", "file", "minutes", "grams", "printer", "color", "status", "reason", "created"];
    const lines = [header.join(",")];
    state.jobs.forEach(function (job) {
      lines.push(header.map(function (key) {
        const cell = String(job[key] == null ? "" : job[key]).replaceAll("\"", "\"\"");
        return "\"" + cell + "\"";
      }).join(","));
    });
    return lines.join("\n");
  }

  const exportBtn = document.querySelector("[data-export]");
  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      const blob = new Blob([toCsv()], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "jordan-glen-print-queue.csv";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quoted) {
        if (ch === "\"" && text[i + 1] === "\"") { cell += "\""; i += 1; }
        else if (ch === "\"") quoted = false;
        else cell += ch;
      } else if (ch === "\"") quoted = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (ch !== "\r") cell += ch;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (line) { return line.some(function (part) { return part.trim(); }); });
  }

  if (fileInput) {
    fileInput.addEventListener("change", function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        const rows = parseCsv(String(reader.result || ""));
        const header = rows.shift() || [];
        const index = {};
        header.forEach(function (name, i) { index[name.trim()] = i; });
        rows.forEach(function (cols) {
          const id = cols[index.id] || uid();
          const job = {
            id: id,
            name: cols[index.name] || "Student",
            band: cols[index.band] === "78" ? "78" : "56",
            file: cols[index.file] || "",
            minutes: Number(cols[index.minutes]) || 0,
            grams: Number(cols[index.grams]) || 0,
            printer: Math.min(9, Math.max(1, Number(cols[index.printer]) || 1)),
            color: cols[index.color] || "PLA",
            status: cols[index.status] || "submitted",
            reason: cols[index.reason] || "",
            created: cols[index.created] || new Date().toISOString()
          };
          const existing = state.jobs.findIndex(function (item) { return item.id === job.id; });
          if (existing >= 0) state.jobs[existing] = job;
          else state.jobs.push(job);
        });
        save(state);
        render();
        fileInput.value = "";
      };
      reader.readAsText(file);
    });
  }

  render();
  window.JGQueue = { state: state, toCsv: toCsv, render: render };
})();
