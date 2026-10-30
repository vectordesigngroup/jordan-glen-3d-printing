#!/usr/bin/env python3
"""Finish a Markmap HTML export so a regeneration keeps course links and a11y.

Usage, from the repo root, after Markmap writes mindmap/course-map.html:

    npx --yes markmap-cli --no-open --offline -o mindmap/course-map.html mindmap/course-map.md
    python3 mindmap/postprocess.py
"""

from pathlib import Path

PAGE = Path(__file__).with_name("course-map.html")
H1 = '<h1 class="visually-hidden">Jordan Glen 3D Printing Course</h1>'
FAVICON = '<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">'
HIDDEN_CSS = """.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
"""


def main() -> None:
    text = PAGE.read_text()
    for prefix in (
        "assets/",
        "teacher/",
        "lab/",
        "challenges/",
        "gallery/",
        "portfolio/",
        "careers/",
        "showcase/",
    ):
        text = text.replace('href=\\"' + prefix, 'href=\\"../' + prefix)
    text = text.replace('href=\\"#', 'href=\\"../index.html#')
    text = text.replace("<title>Markmap</title>", "<title>Jordan Glen 3D Printing Course map</title>")
    text = text.replace("<html>", '<html lang="en">')
    text = text.replace("<html >", '<html lang="en">')
    if 'lang="en"' not in text.split("<head>", 1)[0]:
        text = text.replace("<html", '<html lang="en"', 1)
    if "favicon.svg" not in text:
        text = text.replace("</title>", "</title>\n" + FAVICON, 1)
    if "visually-hidden" not in text:
        text = text.replace("#mindmap {", HIDDEN_CSS + "#mindmap {", 1)
    if "<h1 class=\"visually-hidden\">" not in text:
        text = text.replace("<body>", "<body>\n" + H1, 1)
    PAGE.write_text(text)
    print("updated", PAGE)


if __name__ == "__main__":
    main()
