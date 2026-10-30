(function () {
  const svg = document.querySelector("#course-map-svg");
  const fallback = document.querySelector("[data-map-fallback]");

  function showFallback() {
    if (fallback) fallback.hidden = false;
  }

  if (!svg || !window.markmap || !window.d3 || !window.COURSE_MAP || !window.COURSE_MAP.root) {
    showFallback();
    return;
  }

  function unfold(node) {
    if (!node) return;
    node.payload = Object.assign({}, node.payload, { fold: 0 });
    (node.children || []).forEach(unfold);
  }

  try {
    const source = window.COURSE_MAP.frontmatter && window.COURSE_MAP.frontmatter.markmap;
    const options = window.markmap.deriveOptions(source || {
      colorFreezeLevel: 2,
      initialExpandLevel: 2,
      maxWidth: 300
    });
    const markmap = window.markmap.Markmap.create(svg, options, window.COURSE_MAP.root);
    const expand = document.querySelector("[data-map-expand]");
    const fit = document.querySelector("[data-map-fit]");
    if (expand) {
      expand.addEventListener("click", function () {
        const copy = JSON.parse(JSON.stringify(window.COURSE_MAP.root));
        unfold(copy);
        markmap.setOptions({ initialExpandLevel: -1 });
        markmap.setData(copy).then(function () { markmap.fit(); });
      });
    }
    if (fit) {
      fit.addEventListener("click", function () { markmap.fit(); });
    }
    document.addEventListener("click", function (event) {
      const link = event.target.closest ? event.target.closest("#course-map-svg a") : null;
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const hashAt = href.indexOf("#");
      if (hashAt < 0) return;
      const target = document.querySelector(href.slice(hashAt));
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, true);
  } catch (err) {
    showFallback();
  }
})();
