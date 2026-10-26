# Verification — October 26, 2026

## Content preservation

- Full source recovered; published application/matching script SHA-256 digests matched the recovered source.
- `docs/curriculum.js`, `docs/curriculum-data.json` and `docs/matching.js` remain byte-identical to the original.
- Ten major routes, 210 courses, original four questions and matching weights retained.

## Automated checks

30 Node tests pass (21 original model checks and nine integration checks). Coverage includes:

- Fresh and returning direct entry at `#explore` and `#guide`, plus simulated reloads.
- All ten original `#path/<id>` links, correct requirements and variant selection.
- Back/Forward between program routes and guided steps.
- One-to-three-choice limits; continuation disabled until a selection; re-enabling unchecked options.
- Guided draft reload; completion into ten ranked routes; editable interest profiles.
- Saved programs and course marks; course search; prerequisite lookup; optional business concentration; comparison; note download.
- Blocked/malformed browser storage, malformed hashes, invalid program links, and skip-to-tool behavior.
- Keyboard skip-link focus without losing the direct entry URL.
- Static asset references resolve locally; no remote runtime scripts.

DOM integration uses jsdom rather than browser layout emulation. Responsive and rendered checks are performed separately in Chrome.

## Browser checks

Chrome desktop and device-toolbar checks at 390 px and 320 px: inspected both modes, wrapped headings/navigation, mobile program select and stacked question choices. Public tests at 320 px completed the four-question guide into ten ranked matches and the radar chart. The three-choice limit, browser Back/Forward between questions, and reload at question two with a selected answer all passed.

## Public deployment

- Repository: https://github.com/wm-cdsp/major-explorer — confirmed public, default branch `main`.
- Application commit: `a83e71a49436e7e618f8fa94ab3e43de385f1d04`.
- GitHub Pages: `built`, no build error; source `main` / `/docs`; HTTPS enforced.
- Explore link: https://wm-cdsp.github.io/major-explorer/#explore — opened directly in Chrome, displayed the program tool, survived reload, and supported Back/Forward through a selected Computer Science program.
- Guided link: https://wm-cdsp.github.io/major-explorer/#guide — opened directly on question one on its first public-origin visit; completed all four questions on mobile, preserving a selection across reload and restoring steps with browser Back/Forward.
- Twelve deployed files returned HTTP 200 and matched local SHA-256 digests: HTML, four application/model/data scripts plus the router, both stylesheets, official lockup and three fonts.
- `curriculum.js`, `curriculum-data.json` and `matching.js` have the same SHA-256 digests as the recovered original source.

No remaining blockers. Responsive checks used Chrome device emulation, not physical mobile hardware. The existing source Site and external Cascade page were not modified.
