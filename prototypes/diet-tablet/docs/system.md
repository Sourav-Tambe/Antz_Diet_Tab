# Diet requests: system logic

Date: 2026-09-28 · Source: the JARVIS → Claude brief ([`brief.md`](brief.md)), narrowed by Sourav the same day · Build: `prototypes/diet-tablet/`

**Scope (Sourav, 2026-09-28):** diets are configured in the **diet system**, not here. This module shows what diet applies (read from the diet system) and runs the **diet change request**:
it is raised here, reviewed here, marked configured once the diet exists in the diet system, and accepted, delayed or rejected by the Kitchen here.
Only diet configuration (meals and ingredients) is out of this build; everything else in the brief is here.

`model.js` implements every rule below, and `tools/model.test.mjs` checks them.

## 1. Objects
| Object | Fields | Notes |
|---|---|---|
| Species, Site, Section, Enclosure, Animal | name, parent; an animal has an ID, species, sex and enclosure | Read from Antz. An animal can move enclosure during a request |
| **Request** | ID, where it applies (level + target + species), **mode** (change / new), requested type and period, title, description, files, requester, state, events, **configuration** | The only object this module owns. **Mode** (Sourav, 2026-09-30): a request either asks to **change the entity's current diet** (the active diet, read live from the diet system and shown on the form and the detail page) or asks for **something new** with no diet selected |
| Configuration | type and period, note to kitchen | Recorded when the Nutritionist marks the request configured. **No diet reference: there is no diet directory in this module, so the request never points at a diet (Sourav, 2026-09-30).** The note and the activity are the channel to the kitchen. The period may differ from what was requested |
| Event | kind, who, when, reason / note / diet | The activity trail. Append-only |

## 2. Where a request applies
One of five levels: **Species · Site · Section · Enclosure · Animal**. Every level except Species also names a place or an animal, and the request is always for one species.

## 3. Periods
| Type | Period | Checks (V-1) |
|---|---|---|
| Year-round | none | none |
| Seasonal | month-day to month-day, every year; it may wrap the year end | both set; real dates (no 30 Feb); longer than one day |
| Time-bound | start and end dates | both set; the end is after the start; it hasn't already ended. A start in the past is allowed, with a note |

- **V-2** A second open request for the same place, species and type is allowed, but the form and the request page show the open one.
- **V-3** Only real month-days are accepted, and the day is clamped when the month changes.
- **V-4** A reason is required to reject, delay, return, close or cancel. A delay also needs a review date after today.

## 4. States — the Antz request lifecycle (Sourav, 2026-09-30)
The module follows the standard Antz request lifecycle. **No drafts**: submitting creates the request. The fulfiller is the **Nutritionist** (she configures the diet); the kitchen's fulfilment lives **inside Completed** as sub-states. A delay is the kitchen taking action, not a dead state. The history keeps every event.

| State | Owner · next step | Notes |
|---|---|---|
| Awaiting approval | Nutritionist · approve or reject | Requester can **edit** and cancel |
| Approved | Nutritionist · start configuring | Last exit: Nutritionist can still reject, requester can still cancel |
| In Progress | Nutritionist · configure in the diet system, then **Mark as configured** | No reject, no cancel from here on · Animal-moved confirm |
| Completed · Awaiting kitchen | Kitchen · accept or delay | — |
| Completed · Kitchen in progress | Kitchen · accept (delayed = took action) | Delayed to (date) · Review overdue flags |
| Completed · Applied | — · in effect from / until / ran | — |
| Rejected · Cancelled | — | Show in the All tab only |

```
submitted ─approve─▶ approved ─start─▶ in progress ─mark configured─▶ COMPLETED: awaiting kitchen ─accept─▶ applied
   │ └─reject─▶ rejected └─reject─▶ rejected                                  └─delay─▶ kitchen in progress ─accept─▶ applied
requester: edit while awaiting approval; cancel (with a reason) until In Progress
```

- **S-1** A request raised by the Nutritionist skips review: it is approved as it is submitted.
- **S-2** Kitchen can't accept a time-bound diet whose period has ended; it flags it in the activity.
- **S-3** Every configured event records the period and the note. There is **no kitchen reject and no return** (Sourav): the kitchen talks in the activity.
- **S-4** Only the author edits a request, and only while it awaits approval; every edit is an event.
- **S-5** Request IDs are never reused.
- **S-6** Accepting a request never touches assignments: linking diets to species, animals or places happens in the diet system only (Sourav, 2026-09-30). What applies is read from there.

## 5. Roles and tabs
| | Requester (Site Manager) | Nutritionist | Kitchen |
|---|---|---|---|
| Tabs | Awaiting approval · Approved · In Progress · Completed (Awaiting kitchen / Kitchen in progress / Applied) · All | the same tabs | To accept · In progress · Applied · All |
| Can | raise, edit before approval, cancel before In Progress | raise (skips review), approve, reject (until In Progress), start, mark configured, confirm a moved animal | accept, delay (again) |
| Sees | everything at the site | everything at the site | **only Completed requests** |

All tabs list in chronology. Actions appear only for the owner of the next step; everyone else sees the same page, with the owner named.

## 6. The moved animal
If an animal moves enclosure after a request is raised, the request stays on the animal (it is never redirected). The request shows the move, and the Nutritionist confirms that it still applies, or closes it, before marking it configured.
