# Source brief (verbatim, pasted by Sourav on 2026-09-28)

> JARVIS → CLAUDE · ANTz Diet Module — UX + UI Execution Brief. Kept here as the source record. The build's reading of it is `system.md` and `plan.md`.
> The "attached screenshots" of the current product were not attached. The current product is known from `projects/Antz/web-diet/` (deep-dive).

## 0. MISSION
Redesign the existing **ANTz Diet module** into a complete diet-management system supporting:
1. Hierarchical diet assignment
2. Diet inheritance / override
3. Year-round, seasonal and time-bound diets
4. Diet Change Requests
5. Nutritionist review and diet configuration
6. Kitchen operational acceptance
7. Request tracking and activity history
8. Effective-diet visibility at every level

Do **not** treat this as a simple CRUD redesign. The system needs to communicate:
> **What diet applies → where it comes from → why it applies → whether it is being changed → who is responsible for the change → whether the change has actually become effective.**

The attached screenshots are the **current product baseline**. Preserve useful existing patterns but redesign the IA and interaction model where necessary.

## 1. PRODUCT CONTEXT
ANTz is an animal-management platform used by zoo/wildlife-rescue operations. The Diet module is used by: Site Managers / operational users; Nutritionists / Dietitians; Kitchen teams; Other authorized staff. The system manages diets for animals across an organizational hierarchy. The user should not need to understand the underlying database model. The UI should make the **effective diet and responsibility** obvious.

## 2. CORE DIET HIERARCHY
Diet can exist at five levels: SPECIES → SITE → SECTION → ENCLOSURE → ANIMAL. This is a specificity hierarchy. The more specific level takes precedence over the broader level.
Effective diet resolution for an individual animal: Animal diet → if none Enclosure diet → if none Section diet → if none Site diet → if none Species diet. Therefore: **The lowest applicable diet in the hierarchy wins.**
Example: Species Standard Carnivore Diet; Site —; Section —; Enclosure High Protein Diet; Animal —. Effective diet: **High Protein Diet**. If the animal gets its own diet (Animal Recovery Diet), effective diet becomes **Recovery Diet**.

## 3. IMPORTANT DISTINCTION
Do not confuse **Assigned diet** (a diet explicitly attached to a scope) with **Effective diet** (the diet that ultimately applies to an animal after inheritance/override resolution). This distinction should be visible in the UX. For example, on an animal: "Effective diet · Recovery Diet · Applied from **Animal**" or "Effective diet · High Protein Diet · Inherited from **Enclosure · Aviary 03**". This is a critical product concept.

## 4. DIET TYPES
Every diet assignment can have one of three lifecycle types:
1. **Year-round** — permanent/current diet. Existing current plan is edited rather than creating competing year-round plans.
2. **Seasonal** — recurring diet. Repeats every year according to a defined period (e.g. Summer Diet, June → August, repeats every year).
3. **Time-bound** — one-time diet between fixed dates (e.g. Recovery Diet, 10 June → 25 June).
The UI should make these three types visually and conceptually distinct.

## 5. IMPORTANT DIET RULE
Do not allow the UI to imply that a newly configured diet immediately becomes active. Configured diet ≠ Current effective diet. Example: Current: Standard Diet. Nutritionist configures: High Protein Diet. At this point **Current diet remains Standard Diet.** Only after Kitchen accepts the configured change does High Protein Diet become the current diet. This distinction must be reflected in the data model, status system and UI.

## 6. DIET CHANGE REQUEST
Operational users such as Site Managers need to request diet changes. The requester should **describe the requirement**, not directly configure the final diet. Create a first-class **Diet Change Request**.

## 7. REQUEST FORM
A. Where should the diet change apply? Label "**Diet applies to**": Species · Site · Section · Enclosure · Animal. The entity selector should dynamically change according to the selected scope (e.g. Enclosure → Aviary 03; Animal → African Cuckoo-Hawk AV-00291).
B. What type of diet? Year-round · Seasonal · Time-bound. Dynamic fields: Seasonal asks for the recurring period; Time-bound asks start date and end date.
C. What change are you requesting? Large text field "**Describe the requested change**" (e.g. "Reduce whole fish from 500g to 350g and increase calcium supplementation."). The requester is NOT building the nutritional configuration.
D. Attachments: documents, images, reports, assessments, other supporting files.
E. Submit: primary CTA "**Submit request**".

## 8. REQUEST WORKFLOW
DRAFT → SUBMITTED → NUTRITIONIST REVIEW (→ REJECTED + reason) → APPROVED → AWAITING CONFIGURATION → CONFIGURED → KITCHEN REVIEW (→ REJECTED BY KITCHEN + reason; → DELAYED + reason) → ACCEPTED → APPLIED.
Do not overexpose technical states if they create UI noise. You may combine internal states where appropriate for display (e.g. Approved + Awaiting configuration shown as "Awaiting configuration" while maintaining the approval event in history).

## 9. RESPONSIBILITY MODEL
**Requester** — responsible for identifying the need. Can create, view, track progress, see rejection reasons, see configured diet, see Kitchen decision, view history. Cannot configure the actual diet.
**Nutritionist** — responsible for determining and configuring the appropriate diet. Can review request, review attachments/context, approve, reject with mandatory reason, configure actual diet, mark configured. Once configuration is completed, Nutritionist's workflow ends.
**Kitchen** — responsible for operational acceptance. Receives the configured diet. Can review change, accept, reject, delay, provide reason. Kitchen is the final operational authority before the diet becomes effective.

## 10. FINAL APPLICATION RULE
When Kitchen accepts: Configured diet becomes Current diet at that scope. Previous diet should become historical (CURRENT Standard Diet → Kitchen accepts → CURRENT High Protein Diet, HISTORY Standard Diet). Never silently overwrite history.

## 11. REQUEST ACTIVITY TRAIL
Every request needs a chronological activity timeline, e.g. DR-00421 · African Cuckoo-Hawk · Enclosure · Aviary 03: ✓ Request submitted (Carol Steve, 21 Apr · 03:55 PM) · ✓ Approved (Keerthana Lset · Nutritionist, 21 Apr · 04:20 PM) · ✓ Diet configured (Keerthana Lset · Nutritionist, 21 Apr · 05:10 PM) · ● Under kitchen review (21 Apr · 05:11 PM) · ○ Accepted —. If rejected: ✕ Rejected by Kitchen · Reason "Fish supply for this diet is currently unavailable." · Kitchen · 21 Apr · 06:15 PM. The activity timeline should make ownership and progression immediately understandable.

## 12. NEW IA
The existing "Species with diet / Species without diet" is no longer sufficient. Recommended top-level IA: DIET → Diets · Requests · History. Diets should allow users to understand diet assignments across Species, Sites, Sections, Enclosures, Animals. Do not necessarily turn these into five giant tabs. Explore the cleanest IA for showing **where diets are assigned** and **what diet is effectively applicable**.

## 13. DIET LIST EXPERIENCE
Replace "Species with diet / Species without diet". A species/entity list should communicate: entity · current assigned diet · effective/inherited status · number of active diets · exceptions/customisations. E.g. "African Cuckoo-Hawk · Aviceda cuculoides · Standard Carnivore Diet · Species-wide · 1 active diet"; for an entity inheriting from above: "Aviary 03 · High Protein Diet · Enclosure-wide · Overrides species diet". The distinction between **assigned here** and **inherited from above** must be clear.

## 14. ENTITY DETAIL
Header: entity identity. **Effective Diet** (the most important information): "EFFECTIVE DIET · High Protein Diet · Applied from Enclosure · Aviary 03 · Seasonal Jun 01 – Aug 31". Then access to diet assignments (Species-wide · Site-wide · Section-wide · Enclosure-wide · Animal-wide). Use the hierarchy visually. The user should understand exactly where the current diet comes from.

## 15. SCOPE SELECTOR
The reference concept "SCOPE · SPECIES-WIDE · Species-wide 0 diets ✓ · Site-wide 0 diets · 4 sites · Section-wide 0 diets · 7 sections · Enclosure-wide 0 diets · 9 enclosures · Animal-wide No customised animals yet" is directionally correct. Refine it into a polished hierarchy component. Each level should show: scope name · number of diets · number of entities · whether currently selected · expand/collapse affordance where needed · current/active state. Do not make it feel like five unrelated cards. It should visually communicate: **This is one inheritance hierarchy.**

## 16. REQUESTS IA
Requests should be first-class: [All] [Needs review] [In progress] [Completed] [Rejected]. Each request card/list row should show: request · target · requested diet type · current status · requester · last updated (e.g. High Protein Diet · Enclosure · Aviary 03 · Time-bound 10 Jun – 25 Jun · Awaiting configuration · Requested by Carol Steve · Updated 21 Apr · 04:20 PM).

## 17. ROLE-SPECIFIC WORK QUEUES
Do NOT create completely different IA for each role. Use the same request object and navigation. Permissions determine available actions. Requester sees "My requests"; Nutritionist sees "Requests requiring nutritionist action"; Kitchen sees "Configured diets awaiting kitchen review". The underlying request remains the same.

## 18. KITCHEN EXPERIENCE
Design a dedicated web-oriented operational view for Kitchen, more execution-oriented than administrative. Kitchen should immediately see configured diet changes with: target · diet · type · effective period · previous diet · new diet · nutritionist · supporting information · request context. Primary action: **Accept changes**. Secondary: **Delay**, **Reject**. If Delay or Reject is selected: **Reason required**.

## 19. STATUS VISUAL LANGUAGE
Establish a consistent state system (Submitted · Under review · Awaiting configuration · Configured · Under kitchen review · Delayed · Accepted · Applied · Rejected). Use status indicators consistently. Do not rely solely on color. Every important status should communicate: state · owner · next action (e.g. "AWAITING CONFIGURATION · Nutritionist action required" rather than merely "Awaiting configuration").

## 20. EDGE CASES YOU MUST DESIGN
A. Existing diet at same scope: requesting Species → Year-round where one exists — "Edit current plan / replace current plan" should be clear.
B. Overlapping seasonal diets (Summer Jun–Aug, Monsoon Jul–Sep): do not silently allow ambiguous effective diets. Design validation.
C. Time-bound diet overlapping seasonal diet (Seasonal Jun–Aug, Time-bound 10–25 Jun): the system needs a deterministic precedence rule; the UI must make clear which applies during the overlap.
D. Lower-level override (Species Standard, Enclosure High Protein, Animal Recovery): show the inheritance chain.
E. Request rejected by Nutritionist: request remains historical; reason mandatory.
F. Nutritionist configures a different diet than the requester described: must be possible. The request is a **need**, not a fixed prescription. UI should preserve "Requested change" and separately show "Configured diet".
G. Kitchen rejects configured diet: the configured diet must NOT become active; current diet remains unchanged.
H. Kitchen delays: current diet remains unchanged; request enters "Delayed" with reason.
I. Request cancellation: consider whether cancellation is permitted before configuration/acceptance; if supported, define exactly when it can occur.
J. Entity changes during request: if an animal moves enclosure while a request is in progress, the system must not silently redirect the request. Surface the changed context.

## 21. UI DIRECTION
The current UI uses a light interface, ANTz green, deep teal/navy, soft green-tinted backgrounds, rounded cards, large touch targets, iOS/mobile-style interaction patterns. Retain the ANTz visual language but elevate the information architecture. The UI should feel calm, operational, premium, data-rich without looking like enterprise software, highly scannable, touch-friendly, appropriate for iPad, appropriate for desktop/web Kitchen workflows. Avoid: dense admin tables everywhere, excessive tabs, excessive nested cards, decorative UI, generic SaaS dashboard patterns, giant forms, status-color overload.

## 22. DESIGN PRINCIPLE
Design around DECISION → CONTEXT → ACTION → CONSEQUENCE, not DATABASE → FIELDS → FORMS. Every screen should answer: What does this user need to know? What decision do they need to make? What can they do next?

## 23. REQUIRED SCREENS
01 Diet Home · 02 Diet assignment hierarchy · 03 Species diet list · 04 Entity diet detail · 05 Scope detail · 06 Create Diet Change Request · 07 Request detail · 08 Nutritionist review · 09 Nutritionist configuration · 10 Configured state · 11 Kitchen review · 12 Applied diet · 13 Diet history · 14 Empty states · 15 Error / validation states.

## 24. DO NOT SIMPLY COPY THE EXISTING UI
The current screens are references for visual language, content density, existing patterns and ANTz conventions — not constraints on the new IA. Challenge "Species with diet / Species without diet". The new system needs to represent: Assignment · Inheritance · Effective diet · Request · Configuration · Operational acceptance · History.

## 25. OUTPUT EXPECTATION
Work in order: 1 Product model · 2 Entity model · 3 Diet inheritance logic · 4 Request state machine · 5 Role responsibilities · 6 IA · 7 Primary user flows · 8 Screen architecture · 9 Interaction model · 10 UI design · 11 Edge cases · 12 Final consistency pass. Do not jump directly into visual screens.

## 26. FINAL QUALITY BAR
Can a Site Manager understand "What diet am I requesting and where?" Can a Nutritionist understand "Why is this request here and what do I need to configure?" Can Kitchen understand "What changed and can we operationally execute it?" Can an animal caretaker understand "What diet does this animal actually receive?" Can a reviewer understand "Who requested this, who approved it, who configured it, who accepted it, and when did it become effective?" If any of those questions require opening multiple unrelated screens or interpreting hidden logic, improve the UX.

## 27. ONE CRITICAL DESIGN OUTCOME
Make visually obvious: DIET splits into ASSIGNMENT (Species → Site → Section → Enclosure → Animal) and REQUEST (Requester → Nutritionist → Configure → Kitchen → Accept → CURRENT DIET → HISTORY). The system should never make users wonder: **"Is this actually the current diet, or is this just a requested/configured change?"** That distinction is the heart of the UX.

## Execution instruction
Produce the complete UX architecture and UI as a coherent product, not isolated screens. Challenge weak assumptions where necessary, but preserve the business rules. Prioritize clarity → effective-diet visibility → workflow ownership → operational usability → traceability → visual polish. Design the actual screens, states, transitions, empty states, validation and responsive behavior. Resolved enough that a designer/developer can implement without inventing missing interaction logic. Do not ask for clarification unless a contradiction makes implementation impossible; make reasonable UX decisions and document them explicitly.
