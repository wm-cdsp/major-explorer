# W&M Major Explorer

A static copy of the William & Mary major-exploration tool, redesigned to connect visually to [CDSP Computational Pathways](https://cdsp.wm.edu/computational-pathways/index_new.php).

## Direct entry links for Cascade

- **Explore Majors on My Own:** https://wm-cdsp.github.io/major-explorer/#explore
- **Help Me Pick a Major:** https://wm-cdsp.github.io/major-explorer/#guide

Each link opens its requested mode on a fresh visit and reload. Hash routing works under GitHub Pages' project directory without server rewrites. Individual requirements remain shareable at `#path/<program-id>`; guided steps use `#guide/2` through `#guide/4`. Browser Back/Forward restores the appropriate screen and step. In-progress answers survive reload in the current tab using sessionStorage; completed profiles, saved programs and course notes use localStorage. Storage failures leave browsing and matching available.

The original Site and Cascade page are unchanged. Notes stored on the original Site remain on that origin; browsers do not transfer them automatically to GitHub Pages.

## Content and behavior

The original [live tool](https://wm-which-path.geogdan.chatgpt.site/#path/ds-algorithms) and CDSP reference were inspected in Chrome on October 26, 2026 before redesigning. The complete source was recovered at commit `b4e3bef9aca9647564a6471acb2615cd9d76205f`. Its published `app.js` and `matching.js` matched the recovered scripts byte for byte.

The curriculum and matching model are preserved without modification: four major families, ten degree/track/concentration routes and 210 courses. This includes Applied AI BA, four Data Science BS tracks, three Computer Science BS concentrations, and two Business Analytics BBA routes. The source tool exposes majors only; this redesign retains that scope.

Preserved interactions include four questions with one to three choices each, editable eight-axis interests, ten ranked major matches, course and prerequisite lookup, track/concentration selection, optional business concentrations, saving programs, completed-course notes, comparison of up to three programs, note export, program link copying and print requirements.

Catalog facts reflect the source tool's 2026–27 catalog review of October 20, 2026. Career suggestions and matching weights are editorial interpretations, not an official assessment. Catalog notes, prerequisites, credit caveats, source links and the downloadable dataset are retained. Personal course marks are not a degree audit.

## Design

The black masthead uses the exact public CDSP horizontal logo. W&M green navigation, restrained gold accents, serif headings, Roboto text, square panels and generous white spacing echo the external entry page. Both modes have visible navigation and links back to Computational Pathways. Aleo is the self-hosted open-font serif alternative; licensed CDSP web fonts are not copied. See `docs/assets/README.md` for provenance and font licenses.

On mobile, program navigation becomes a labeled select, question choices stack, and comparison tables scroll within their panel. Focus indicators, skip links, semantic labels, live selection counts and reduced-motion preferences are supported.

## Local preview and tests

Node 20+ and Python 3 are sufficient:

```sh
npm ci
npm test
python3 -m http.server 5173 --bind 127.0.0.1 --directory docs
```

No build is required. Open `http://127.0.0.1:5173/#explore` or `#guide`.

- `docs/`: complete deployed application and self-hosted assets; no backend, runtime package installation, account login, external script or analytics.
- `tests/matching.test.js`: original model tests.
- `tests/app.test.js`: DOM integration tests for routing, reloads, history, saved state, matching completion, storage failures and preserved interactions.
- `scripts/build-curriculum.py`, `research/*.json`: original curriculum generation and public catalog snapshots. Future catalog updates require review of prerequisites, credit totals, notes and optional courses before rebuilding.

See [TESTING.md](TESTING.md) for verification details.

## GitHub Pages

Publish from **main → /docs** using GitHub Pages' branch deployment. GitHub's standard Pages build/deploy pipeline serves the static files; no custom workflow or new backend is needed. Keep `.nojekyll` in `docs/`. The stable project URL is `https://wm-cdsp.github.io/major-explorer/`.

To update, edit files under `docs/`, run tests, and push to `main`. Keep both entry hashes stable for external Cascade links.
