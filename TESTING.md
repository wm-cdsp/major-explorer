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

Chrome desktop and device-toolbar checks at 390 px and 320 px: inspected both modes, wrapped headings/navigation, mobile program select and stacked question choices. Public deployment verification is recorded after publication.
