# Diet requests tablet: plan and decisions

Date: 2026-09-28 · Brief: [`brief.md`](brief.md) · Logic: [`system.md`](system.md) · Live: https://antz-diet.pages.dev
Build: `prototypes/diet-tablet/`. It reads `app/tokens.css`, `app/type.css`, `app/components.css` and `app/icons/`, and writes nothing outside its folder.

## Decisions
| # | Decision | Ruling |
|---|---|---|
| D-1 | Frame | Tablet 834 × 1194, plus a Web 1280 × 800 frame (the Kitchen's desk: list and request side by side) |
| D-2 | **Scope** (Sourav) | The full module: Home, Diets (Active / Inactive / Overridden / Replaced, the level ladder, chain, year strip), Requests, Kitchen, History. **Only diet configuration is removed**: it happens in the diet system |
| D-3 | **Configuration** (Sourav, revised 2026-09-30) | The Nutritionist configures and links the diet in the diet system, then **marks the request configured** here with the period and a note to the kitchen. **No diet reference on the request** — there is no diet directory in this module, so no picker, no configured-diet row, no before/after diff. Accepting never touches assignments |
| D-4 | Status | Superseded by D-16 for the states; a kitchen delay is the Kitchen-in-progress sub-state with a delayed-to flag. Pill = glyph + word; the owner and the next step sit beneath it |
| D-5 | Pending vs accepted | Dashed = configured but not accepted; solid = accepted; faded = closed |
| D-6 | Headers (Sourav) | One header everywhere: back arrow · title · a "•" line of key facts. No subtitles |
| D-7 | Navigation (Sourav) | Tab pages (Home · Diets · Requests · History) have the bottom nav; detail and task pages don't. Back returns where you came from. Task pages (New request, Mark as configured) are full pages with back, choices in bottom sheets, and one full-width action |
| D-8 | Buttons (Sourav) | On-primary-container for task actions (Approve, Mark as configured). Primary for the final submit (Submit request, Accept) |
| D-9 | Surfaces (Sourav) | 8px corners; white containers on the Antz background; overlays are a white wash with a light blur; colour for state only |
| D-10 | Entities (Sourav) | The animal or place a request is for is shown as an entity card (avatar with the Antz sex badge) |
| D-11 | Nutritionist raises | Allowed; it skips review (system S-1) |
| D-12 | Cancel window | Superseded by D-16: the requester cancels, with a reason, until In Progress |
| D-13 | Moved animal | The request stays on the animal; the Nutritionist confirms it or closes it |
| D-14 | Viewing as | The stage bar switches between Carol (Site Manager), Keerthana (Nutritionist) and Ravi (Kitchen). It sits outside the tablet |
| D-17 | **Change or new** (Sourav, 2026-09-30) | A request is about the entity's **current diet** (its active diet, resolved live from the diet system) or about **something new** with no diet selected. The form shows the current diet once the entity is chosen and requires the choice; the detail page has a Current diet row with the source, the type, a "Change requested / New diet requested" tag, and View → the read-only diet sheet |
| D-16 | **Lifecycle** (Sourav, 2026-09-30, from the Antz request-lifecycle map) | Awaiting approval → Approved → In Progress (Nutritionist configuring) → Completed, where Completed holds the kitchen sub-states: Awaiting kitchen → Kitchen in progress (delay = action) → Applied. **No drafts** — submit creates the request; the requester edits before approval. Reject (Nutritionist) and cancel (requester) end at the In Progress door. No kitchen reject. Rejected/cancelled show in All only; every list is chronological, tabs mirror the states for both sides |
| D-15 | **Request detail** (Sourav, 2026-09-30) | Follows the Antz Requests Figma (Req Details, node 611-48888): hero · detail rows (applies to · request · diet type · note to kitchen · requested by · approved by) · **Attachments** section (file cards: tinted thumb, name, time • date, size) · **Activity** with a Show All / Comments / Updates filter and boxed variations (comment = notes yellow; status update = tinted box with from → to, reason, period/note; files under the box) · foot shows "Current Status • ago", terminal states as a bordered tinted card with who ended it |

## Screens
| Screen | Route |
|---|---|
| Requests (home): Awaiting approval · Approved · In Progress · Completed (Awaiting kitchen / Kitchen in progress / Applied) · All | `#/requests` |
| Request: applies to, requested change, diet type, note, people, attachments, activity; status and actions at the foot | `#/req/:id` |
| New request / edit before approval (task) | `#/new`, `#/new?edit=:id` |
| Mark as configured (task) | `#/req/:id/configured` |
| Reason sheet: reject, return, delay (+ date), close, cancel | on the request |

## Checks
- `node --test tools/model.test.mjs`
- `node tools/check-static.mjs`
- `tools/walk.sh` (server on 8789)
- `tools/publish.sh` deploys to https://antz-diet.pages.dev
