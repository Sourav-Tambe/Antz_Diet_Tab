// Prototype tooling: the regression walk, evaluated in the page by tools/walk.sh. Renders every route as every viewer, runs the
// request flow end to end through the UI's own functions, and reports anything that broke or spills past the frame.
(() => {
  const bad = [];
  const acts_of = (r, u) => actionsFor(r, user(u)).join();
  const visit = (h, u) => {
    S.user = u; window.__route = h; window.__notFound = null; render();
    if (window.__notFound) bad.push(`${u} ${h}: ${window.__notFound}`);
    const dev = document.querySelector('.device').getBoundingClientRect(), k = dev.width / document.querySelector('.device').offsetWidth;
    const over = [...document.querySelectorAll('#main *, #foot *, #bar *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > dev.right + 1; });
    if (over.length) bad.push(`${u} ${h}: ${over.length} past the right edge (${over[0].className})`);
    const tiny = [...document.querySelectorAll('.device button, .device a.btn, .device .iconbtn')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height / k < 40 && !e.classList.contains('x'); });
    if (tiny.length) bad.push(`${u} ${h}: ${tiny.length} tap targets under 40 (${tiny[0].textContent.trim().slice(0, 20)})`);
  };
  const users = D.users.map(u => u.id), routes = ['#/menu', '#/diets', '#/requests', '#/kitchen', '#/new', '#/new?sp=CH&level=enclosure&target=EN-1&type=yearround'];
  D.species.forEach(sp => { routes.push(`#/diets/sp/${sp.id}`); ['site', 'section', 'enclosure'].forEach(l => placesOf(sp.id, l).forEach(id => routes.push(`#/diets/${l}/${sp.id}/${id}`))); });
  D.species.forEach(sp => LEVELS.forEach(l => routes.push(`#/diets/level/${sp.id}/${l}`)));
  D.animals.forEach(a => routes.push(`#/diets/animal/${a.id}`));
  D.plans.forEach(p => routes.push(`#/plan/${p.id}`));
  D.requests.forEach(r => routes.push(`#/req/${r.id}`));
  const kSees = h => !h.startsWith('#/req/DR') || h.includes('/configured') || !!KSUB[(by('requests', h.slice(6, 14)) || {}).state];
  routes.push('#/diets/filters');
  routes.push('#/req/DR-00423/configured', '#/req/DR-00416/configured');
  const whereCheck = () => { for (const u of ['u-carol', 'u-keer']) { S.user = u; S.draft = null; S.w = null; window.__route = '#/new?sp=CH&level=enclosure&target=EN-1'; render(); visit('#/new/where', u); for (const l of ['species', 'site', 'section', 'enclosure', 'animal']) { try { wSheet(l); closeSheet(); } catch (e) { bad.push('wSheet ' + l + ': ' + e.message); } } } };
  for (const u of users) for (const h of routes) { if (user(u).role === 'kitchen' && !kSees(h)) continue; S.draft = null; S.cfg = null; visit(h, u); }
  for (const sp of D.species) for (const l of LEVELS) { visit(`#/diets/level/${sp.id}/${l}`, 'u-keer'); S.lf = 'own'; visit(`#/diets/level/${sp.id}/${l}`, 'u-anita'); S.lf = 'all'; }
  for (const t of ['with', 'without', 'all']) { S.sd = t; visit('#/diets', 'u-anita'); } S.sd = 'with';
  try { sortSheet(); SRT = 'az'; srtDraw(); closeSheet(); for (const [k] of SP_SORTS) { S.spsort = k; visit('#/diets', 'u-anita'); } S.spsort = null; } catch (e) { bad.push('sort: ' + e.message); }
  try {
    S.fl = null; visit('#/diets/filters', 'u-keer'); flToggle('Birds'); S.fl.q = 'rep'; render(); flApply();
    visit('#/diets', 'u-keer'); if (fltCount(S.flt) !== 1) bad.push('filters not applied: ' + JSON.stringify(S.flt));
    if (!document.querySelector('.fchip')) bad.push('no filter chip'); flRemove('cls', 'Birds'); if (fltCount(S.flt) !== 0 || document.querySelector('.fchip')) bad.push('chip remove failed');
    S.flt = { type: ['seasonal'], lvl: ['enclosure'] }; visit('#/diets', 'u-keer'); flRemove('type', 'seasonal'); flRemove('lvl', 'enclosure'); S.flt = null;
    S.flt = null; S.fl = null;
  } catch (e) { bad.push('filters: ' + e.message); }
  S.q = 'aviary'; visit('#/diets', 'u-anita'); S.q = 'zzz'; visit('#/diets', 'u-anita'); S.q = '';
  for (const u of users) { S.tab = null; for (const [t] of reqTabs()) { S.tab = t; if (t === 'completed') { for (const [k] of KSUB_TABS) { S.ksub = k; visit('#/requests', u); } } else visit('#/requests', u); } } S.tab = null; S.ksub = 'awaiting';
  for (const d of DATES) { TODAY = d[0]; for (const u of users) visit('#/diets', u); visit('#/diets/animal/AV-00291', 'u-anita'); visit('#/req/DR-00419', 'u-ravi'); } TODAY = DATES[0][0];
  S.frame = 'web'; fit(); for (const h of ['#/kitchen', '#/requests', '#/req/DR-00421', '#/diets', '#/diets/animal/AV-00291']) { S.sel = null; visit(h, 'u-ravi'); } S.frame = 'tablet'; fit();
  S.user = 'u-ravi'; window.__route = '#/req/DR-00424'; window.__notFound = null; render(); if (!window.__notFound) bad.push('the kitchen can see a request before it is completed'); window.__notFound = null;
  for (const st of ['SI-1', 'SI-2', 'SI-3']) { S.site = st; for (const u of users) for (const h of ['#/diets', '#/requests', '#/kitchen']) visit(h, u); } S.site = 'all';
  try { siteSheet(); SITE.q = 'bird'; siteDraw(); if (document.querySelectorAll('#sheet .ocard').length !== 1) bad.push('site search'); closeSheet(); } catch (e) { bad.push('siteSheet: ' + e.message); }
  try {
    S.spid = null; visit('#/diets/sp/CH', 'u-anita');
    for (const f of ['active', 'inactive', 'all']) { S.sptF = f; visit('#/diets/sp/CH', 'u-anita'); }
    for (const t of ['ho', 'an']) { S.spt = t; visit('#/diets/sp/CH', 'u-anita'); } S.spt = 'sp';
    S.spq = 'summer'; visit('#/diets/sp/CH', 'u-anita'); S.spq = '';
    flOpen('type', '#/diets/sp/CH'); visit('#/diets/filters', 'u-anita'); flToggle('seasonal'); flApply(); visit('#/diets/sp/CH', 'u-anita');
    if (!(S.sflt.type || []).length) bad.push('type filter not applied'); S.sflt = null; S.spid = null;
    dietSheet('AS-6'); dsView('nutrition'); dsView('items'); dietSheet('AS-12'); dietSheet('AS-13');
    dietSheet('AS-3'); for (const [k] of [['species'],['site'],['section'],['enclosure'],['animal']]) { DS.shr = k; dsDraw(); }
    if (!document.querySelector('.dstable')) bad.push('diet sheet table missing');
    closeSheet(); S.spt = 'ho'; for (const l of ['site', 'section', 'enclosure']) { S.hlv = l; visit('#/diets/sp/LI', 'u-keer'); } S.hq = 'rescue'; visit('#/diets/sp/LI', 'u-keer'); S.hq = '';
    flOpen('housing', '#/diets/sp/LI'); visit('#/diets/filters', 'u-keer'); flToggle('site'); S.fl.cat = 'hsite'; flToggle('SI-1'); S.fl.cat = 'hdiet'; flToggle('PL-BCM'); flApply();
    S.spt = 'ho'; visit('#/diets/sp/LI', 'u-keer'); if (fltCount(S.hflt) !== 3) bad.push('housing filters not applied'); S.hflt = null; S.spt = 'sp';
    S.scid = null; for (const f of ['active', 'inactive', 'all']) { S.scF = f; visit('#/diets/site/LI/SI-1', 'u-keer'); } S.scq = 'soft'; visit('#/diets/site/LI/SI-1', 'u-keer'); S.scq = ''; dietSheet('AS-36'); closeSheet();
    S.spt = 'an'; visit('#/diets/sp/LI', 'u-keer'); anSortSheet(); SRT = 'az'; anSrtDraw(); closeSheet();
    for (const k of ['az', 'eaz', 'id']) { S.ansort = k; visit('#/diets/sp/LI', 'u-keer'); }
    S.aflt = { sex: ['F'], asite: ['SI-1'] }; visit('#/diets/sp/LI', 'u-keer'); S.aflt = null; S.spt = 'sp';
    S.anid = null; for (const f of ['active', 'inactive', 'all']) { S.anF = f; visit('#/diets/animal/LN-0015', 'u-keer'); }
    S.spid = null; visit('#/diets/sp/LI', 'u-keer');
    if (!document.querySelector('.pane .dstable')) bad.push('split pane missing');
    S.dsel = 'AS-12'; S.dsv = 'nutrition'; visit('#/diets/sp/LI', 'u-keer'); if (!document.querySelector('.pane .ncard')) bad.push('pane nutrition missing'); S.dsv = 'items';
    spDietsSheet('LI', 'all'); if (!document.querySelector('.dcard .lvp')) bad.push('diets sheet footprints missing');
    dietSheet('AS-6', true); if (!document.querySelector('.dstable')) bad.push('stacked diet sheet missing');
    closeSheet(); if (!document.querySelector('.dcard .lvp')) bad.push('sheet stack did not pop'); closeSheet();
    spDietsSheet('LI', 'active'); closeSheet();
  } catch (e) { bad.push('species tab: ' + e.message); }
  whereCheck();
  try {
    S.user = 'u-carol'; S.draft = null; window.__route = '#/new?sp=SD&level=animal&target=SD-0301'; render();
    Object.assign(S.draft, { type: 'timebound', start: '2026-06-15', end: '2026-06-30', title: 'Walk request', text: 'A walk test of the whole flow.' });
    if (!draftMissing().includes('ask')) bad.push('submit possible without saying change-or-new');
    S.draft.mode = 'change';
    submitDraft(); const r = D.requests[D.requests.length - 1];
    if (r.state !== 'submitted') bad.push('submit: ' + r.state);
    if (r.mode !== 'change') bad.push('mode not carried: ' + r.mode);
    S.user = 'u-carol'; S.draft = null; window.__route = `#/new?edit=${r.id}`; render(); if (S.draft.blocked) bad.push('the requester cannot edit before approval');
    S.user = 'u-keer'; S.draft = null; window.__route = `#/new?edit=${r.id}`; render(); if (!S.draft.blocked) bad.push('someone else can edit a submitted request');
    S.user = 'u-keer'; doAct(r.id, 'approve');
    if (acts_of(r, 'u-carol') !== 'cancel') bad.push('approved: requester should have cancel only, got ' + acts_of(r, 'u-carol'));
    doAct(r.id, 'start'); if (r.state !== 'in_progress') bad.push('start: ' + r.state);
    if (acts_of(r, 'u-carol') !== '' || acts_of(r, 'u-keer') !== 'configure') bad.push('in progress: only configure should remain');
    window.__route = `#/req/${r.id}/configured`; S.cfg = null; render(); S.cfg.note = 'Configured in the diet system.'; markConfigured(r.id);
    if (r.state !== 'awaiting_kitchen') bad.push('configure: ' + r.state);
    if (r.config.plan) bad.push('a diet reference travelled with the request');
    const asgsBefore = D.assignments.length;
    S.user = 'u-ravi'; doAct(r.id, 'delay', { reason: 'Supplier delay', until: '2026-06-20' }); if (r.state !== 'kitchen_progress') bad.push('kitchen delay: ' + r.state);
    doAct(r.id, 'accept'); if (r.state !== 'applied') bad.push('accept: ' + r.state);
    if (D.assignments.length !== asgsBefore) bad.push('accepting wrote an assignment (the diet system owns them)');
    visit(`#/req/${r.id}`, 'u-carol');
    S.user = 'u-carol'; S.draft = null; window.__route = `#/new?edit=${r.id}`; render(); if (!S.draft.blocked) bad.push('an applied request opened for edit');
    S.user = 'u-keer'; S.cfg = null; window.__route = '#/req/DR-00423/configured'; render();
    if (!cfgMissing('DR-00423').length) bad.push('overlap not caught'); S.cfg.replaces = ['AS-8']; if (cfgMissing('DR-00423').length) bad.push('replace did not clear: ' + cfgMissing('DR-00423'));
    markConfigured('DR-00423'); S.user = 'u-ravi'; doAct('DR-00423', 'accept'); if (by('assignments', 'AS-8').state !== 'current') bad.push('accepting touched an assignment (the diet system owns them)');
    S.user = 'u-keer'; window.__route = '#/req/DR-00424'; render(); reasonSheet('DR-00424', 'reject'); if (!document.querySelector('#rs-go').disabled) bad.push('reject enabled without a reason'); closeSheet();
    S.user = 'u-carol'; S.draft = null; window.__route = '#/new'; render(); S.draft.type = 'seasonal'; setMD('draft', 'from', 'M', '07'); if (S.draft.from) bad.push('month alone set a date'); setMD('draft', 'from', 'D', '31'); setMD('draft', 'from', 'M', '02'); if (S.draft.from !== '02-28') bad.push('day not clamped: ' + S.draft.from);
  } catch (e) { bad.push('flow: ' + e.message); }
  window.__route = null;
  return JSON.stringify({ routes: routes.length, bad: bad.slice(0, 30), nbad: bad.length, errs: window.__errors });
})()
