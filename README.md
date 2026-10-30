# Jordan Glen School 3D printing course

Interactive static course for grades 5–6 and 7–8. Open `index.html` in a browser, or host it with GitHub Pages. No build step.

Created for Jordan Glen School by Vector Design Group.

## Course map

`mindmap/course-map.md` is the markmap source. The home page draws it with vendored Markmap files in `assets/vendor/` (no CDN). `mindmap/course-map.html` is a full-screen offline copy, and `mindmap/course-map.png` is the printable expanded map. After regenerating the HTML with Markmap, run `python3 mindmap/postprocess.py` so the language, heading, favicon, and lesson links stay in place.

## Tracks

The header toggle switches reading level, projects, quizzes, and the take-home lab. Progress and the build checklist are stored in `localStorage` on this device, separately for each track.

## Custom explainer clips

Narrated 16:9 clips and poster images are already in this folder. The animated poster remains the fallback if a file is removed. Transcripts: [assets/videos/scripts.md](assets/videos/scripts.md).

Expected names:

- `assets/videos/what-is-3d-printing.mp4`
- `assets/videos/how-a-printer-works.mp4`
- `assets/videos/safety.mp4`
- `assets/videos/materials.mp4`
- `assets/videos/cad-design.mp4`
- `assets/videos/model-libraries.mp4`
- `assets/videos/slicing.mp4`
- `assets/videos/troubleshooting.mp4`
- `assets/videos/vex-robotics.mp4`
- `assets/videos/business.mp4`
- `assets/videos/capstone.mp4`
- `assets/videos/take-home-project.mp4`

`assets/videos/manifest.json` maps each slug to its file, title, poster, duration, and caption. If a clip is missing, that section keeps the animated poster. The jpg poster is the `poster` attribute on each player.

## Take-home starters

- `projects/desk-buddy-bot/` — Desk Buddy Bot (grades 5–6)
- `projects/crank-catapult/` — Crank-Gear Mini Catapult (grades 7–8)

OpenSCAD files are the remix templates. The STL files were exported from `projects/build_models.py` at the same dimensions. Re-run that script after a geometry change, or render the `.scad` with OpenSCAD:

```bash
openscad -D 'part="body"' -o body.stl desk-buddy.scad
```

## GitHub Pages

This repo includes `.github/workflows/pages.yml`. It deploys the site on every push to `main`.

1. Merge this branch into `main`.
2. In the GitHub repo, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
4. The first push to `main` runs **Deploy GitHub Pages**. If GitHub asks to approve the `github-pages` environment, approve it once.
5. The site is then served at `https://vectordesigngroup.github.io/jordan-glen-3d-printing/`.

Paths in the HTML are relative, so the project site and a local `index.html` both work. Keep custom mp4 files out of Git LFS unless you choose to; short clips can be committed normally.

## Credits

Tool links, VEX dimensions, game-manual versions, and YouTube embeds are listed in the sources section of the course. YouTube IDs were checked with `https://www.youtube.com/oembed`. Competition legality changes every season; the VEX module tells students to read the current manual and the RobotEvents Q&A.
