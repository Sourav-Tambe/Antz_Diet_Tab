# Diet requests · app tablet prototype

Diet change requests for Antz. A request is raised and reviewed here. The Nutritionist configures the diet in the diet system and marks the
request configured, and the Kitchen accepts, delays or rejects it. Tablet 834 × 1194, plus a web 1280 frame.

**Live:** https://antz-diet.pages.dev · **Logic:** [`docs/system.md`](docs/system.md) · **Decisions:** [`docs/plan.md`](docs/plan.md) · **Source brief:** [`docs/brief.md`](docs/brief.md)

## Open it locally
From the repo root (`Antz-Design-TAB/`), run `python3 -m http.server 8789`, then open http://localhost:8789/prototypes/diet-tablet/index.html.

The dashed bars above the tablet are prototype controls, not app UI:
- **Viewing as:** switch between Carol, Keerthana and Ravi.
- **Today:** 12 Jun, 22 Jun or 15 Dec.
- **Frame:** tablet or web.
- **Reset data:** start again from the seed data.
- **Jump to:** opens each main case.

## Files
- `data.js`: the seed data.
- `model.js`: the rules and the request state machine.
- `ui.js`: shared components.
- `views-requests.js`: the list, the request page and the reason sheets.
- `views-tasks.js`: New request and Mark as configured.
- `sheets.js`: the pickers.
- `app.js`: the router, the shell and the stage bar.
- `diet.css`: the styles.

## Checks
Run these from `prototypes/diet-tablet/`:
- `node --test tools/model.test.mjs`
- `node tools/check-static.mjs`
- `tools/walk.sh`

To republish, run `tools/publish.sh`.
