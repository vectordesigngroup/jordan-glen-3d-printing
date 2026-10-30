(function () {
  const THEME = "jg3d-course-v1";
  const TEACHER = "jg3d-teacher-view";

  function courseState() {
    try { return JSON.parse(localStorage.getItem(THEME) || "{}"); }
    catch (err) { return {}; }
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const data = courseState();
    data.theme = theme;
    localStorage.setItem(THEME, JSON.stringify(data));
    document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
      const dark = theme === "dark";
      button.setAttribute("aria-pressed", dark ? "true" : "false");
      button.textContent = dark ? "Light mode" : "Dark mode";
    });
  }

  function setTrack(track) {
    document.body.dataset.track = track;
    const data = courseState();
    data.track = track;
    localStorage.setItem(THEME, JSON.stringify(data));
    document.querySelectorAll(".track-toggle button").forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.track === track ? "true" : "false");
    });
  }

  function setTeacher(on) {
    document.body.classList.toggle("teacher-view", on);
    localStorage.setItem(TEACHER, on ? "1" : "0");
    document.querySelectorAll("[data-teacher-toggle]").forEach(function (button) {
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.textContent = on ? "Hide teacher view" : "Teacher view";
    });
  }

  const saved = courseState();
  const theme = saved.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  setTheme(theme);
  if (document.querySelector(".track-toggle")) setTrack(saved.track === "78" ? "78" : "56");
  setTeacher(localStorage.getItem(TEACHER) === "1");

  document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
  });
  document.querySelectorAll(".track-toggle button").forEach(function (button) {
    button.addEventListener("click", function () { setTrack(button.dataset.track); });
  });
  document.querySelectorAll("[data-teacher-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      setTeacher(!document.body.classList.contains("teacher-view"));
    });
  });
})();
