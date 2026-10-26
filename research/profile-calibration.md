# Program emphasis profiles

These are editorial matching profiles, separate from the catalog's course and degree requirements. The October 22, 2026 reference-chart calibration uses the following values on the tool's common 0–5 scale:

| Route | Data analysis | AI models | Applied AI | Outline |
| --- | --- | --- | --- | --- |
| CS — Cybersecurity | Catalog-tag baseline | 2.5 | Catalog-tag baseline | Radar polygon |
| DS — Artificial Intelligence | 5 | 5 | Catalog-tag baseline | Convex hull |
| Business Analytics — Data Science | 3.5 | Catalog-tag baseline | 3 | Convex hull |
| Business Analytics — Supply Chain | Catalog-tag baseline | Catalog-tag baseline | Catalog-tag baseline | Filled polygon; Spatial Data overridden to 1 |

Business sits on the left axis, with Spatial Data at the lower left. The other route profiles retain their catalog-tag baseline.

`dist/matching.js` is the single source for the calibrated profiles. It samples convex envelopes on all eight axes for DS–AI and Business Analytics, then applies any dimension overrides. The SVG, numerical values, similarity rankings, career-interest sorting and comparisons all use the resulting profile. Supply Chain retains its Business and Operations peaks at 5, with Spatial Data lowered from the envelope's 3.54 to 1. This introduces an inward bend between Business and Operations: a strictly convex outline would inflate Spatial Data again. Its other dimensions retain the envelope values, avoiding the original collapsed spokes. Course requirements and questionnaire responses are unchanged.
