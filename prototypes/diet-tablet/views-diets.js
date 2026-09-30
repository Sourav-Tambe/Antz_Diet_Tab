// prototypes/diet-tablet/views-diets.js — Diets tab: species list + search, species ladder, place, animal and plan pages.
// Diets are configured in the diet system; these pages only show what applies and where it comes from.

function speciesSummary(sp) {
  const cur = D.assignments.filter(a => a.sp === sp.id && a.state === 'current');
  const custom = cur.filter(a => a.level !== 'species');
  const scopes = new Set(custom.map(a => `${a.level}|${a.target}`)).size;
  const pend = D.requests.filter(r => r.sp === sp.id && !TERMINAL.includes(r.state) && r.state !== 'draft');
  const animals = D.animals.filter(a => a.sp === sp.id);
  const res = resolveScope(sp.id, 'species', sp.id);
  const act = new Set(cur.filter(a => roleOf(a, resolveScope(sp.id, a.level, a.target)) !== 'notinforce').map(a => a.plan)).size;   // distinct diets in force today at any level, as on the species stat bar
  const hasSp = cur.some(a => a.level === 'species');
  const other = new Set(cur.filter(a => a.level !== 'species').map(a => a.plan)).size;
  return { cur, custom, scopes, pend, animals, res, act, hasSp, other, none: !cur.length };
}

/* the effective diet for this place / animal today */
function heroFor(sp, path, start) {
  const w = resolvePath(sp, path, TODAY, start).winner;
  if (!w) return `<section class="hero none"><p class="eyebrow t-subtext-title">Active · ${fmtDay(TODAY)}</p><h2 class="t-major-title">No diet</h2></section>`;
  const src = w.level === start ? (start === 'species' ? 'Species-wide' : 'Own diet') : `From <a class="lnk" href="${placeHref(w.level, sp, path[w.level])}">${w.level === 'species' ? 'species' : LEVEL[w.level].toLowerCase()}</a>`;
  const n = nextChange(sp, path, start);
  const next = n ? `<p class="next t-body-regular">${ic('clock', 18)}<span>From <b>${fmtDay(n.on)}</b>: ${n.winner ? esc(plan(n.winner.asg.plan).name) : 'No diet'}</span></p>` : '';
  return `<section class="hero"><p class="eyebrow t-subtext-title">Active · ${fmtDay(TODAY)}</p><h2 class="t-major-title"><a href="#/plan/${w.asg.plan}">${esc(plan(w.asg.plan).name)}</a></h2><p class="src t-body-medium">${ic('place', 18)}${src}</p><div class="tags mt8">${typeTag(w.asg)}</div>${next}</section>`;
}

/* species card (Antz Species Diet): avatar · name · scientific name · active diet count */
function spRow(sp, s = speciesSummary(sp)) {
  const n = s.act, gap = !s.hasSp && s.cur.length;
  const right = s.cur.length && !gap ? `<span class="spn"><span class="v t-stat-title">${n}</span><span class="l t-body-regular">${n === 1 ? 'Active diet' : 'Active diets'}</span></span>` : '';
  const gapLine = gap ? `<span class="m t-body-medium spgap">No species diet · ${plural(s.other, 'housing/animal diet')}</span>` : '';
  return `<a class="spcard" href="#/diets/sp/${sp.id}"><span class="spav t-minor-title" aria-hidden="true">${initials(sp.name)}</span><span class="grow"><span class="n t-minor-title">${esc(sp.name)}</span><span class="m t-minor-reg-italic">${esc(sp.sci)}</span>${gapLine}</span>${right}</a>`;
}

/* the Antz menu the Diet module is entered from — the way out of the module */
function vMenu() {
  const mods = [['diets', 'Diet', '#/diets'], ['user', 'Animals'], ['place', 'Housing'], ['check', 'Tasks'], ['requests', 'Help Desk'], ['plan', 'Reports']];
  const tile = ([i, l, href]) => `<a class="mtile" href="${href || 'javascript:void 0'}"${href ? '' : ` onclick="toast('${l} opens in Antz')"`}><span class="tile">${ic(i, 24)}</span><span class="t-minor-title">${l}</span></a>`;
  return { head: { title: 'Menu' }, html: `<div class="mgrid">${mods.map(tile).join('')}</div>` };
}

/* Sort by (Antz sort sheet): count and name orders, applied on Done */
const SP_SORTS = [['cd', 'Count (High - Low)'], ['ca', 'Count (Low - High)'], ['az', 'Species (A-Z)'], ['za', 'Species (Z-A)'], ['saz', 'Scientific Name (A-Z)'], ['sza', 'Scientific Name (Z-A)']];
let SRT = null;
function sortSheet() { SRT = S.spsort || 'cd'; openSheet(sortHtml()); }
function sortHtml() {
  return `<div class="sh-h shx"><h2 class="t-major-medium">Sort by</h2><button class="iconbtn" onclick="closeSheet()" aria-label="Close">${ic('x', 24)}</button></div><div class="sh-b"><div class="ocards">${SP_SORTS.map(([k, l]) => `<button class="ocard${SRT === k ? ' on' : ''}" onclick="SRT='${k}';srtDraw()"><span class="t-minor-medium grow">${l}</span><span class="radio-ic">${ic('radioOff', 24)}${ic('radioOn', 24)}</span></button>`).join('')}</div></div><div class="sh-f"><button class="btn pri block" onclick="S.spsort=SRT;closeSheet();render()">Done</button></div>`;
}
function srtDraw() { $('#sheet').innerHTML = '<div class="grab"></div>' + sortHtml(); typesetButtons(); }
const spSort = (list, k) => list.sort((a, b) => k === 'cd' ? b.s.act - a.s.act : k === 'ca' ? a.s.act - b.s.act : k === 'az' ? a.sp.name.localeCompare(b.sp.name) : k === 'za' ? b.sp.name.localeCompare(a.sp.name) : k === 'saz' ? a.sp.sci.localeCompare(b.sp.sci) : b.sp.sci.localeCompare(a.sp.sci));

const SD_TABS = [['with', 'Species with diet'], ['without', 'Species without diet'], ['all', 'All species']];

/* ---------- Filters page (Antz Filters pattern): category rail on the left, search + checkboxes on the right, Apply ---------- */
const CLASSES = ['Mammals', 'Birds', 'Reptiles', 'Amphibians', 'Fish', 'Invertebrates'];
const FILTER_CATS = [
  { k: 'cls', label: 'Class', opts: () => CLASSES.map(c => [c, c]) },
  { k: 'type', label: 'Diet type', opts: () => Object.entries(TYPE_NAME) },
  { k: 'lvl', label: 'Assigned at', opts: () => [['species', 'Species'], ['site', 'Site'], ['section', 'Section'], ['enclosure', 'Enclosure'], ['animal', 'Animal']] },
];
const fltCount = f => Object.values(f || {}).reduce((n, a) => n + (Array.isArray(a) ? a.length : 0), 0);
function spMatch(x) {
  const f = S.flt || {};
  return (!(f.cls || []).length || f.cls.includes(x.sp.cls))
    && (!(f.type || []).length || x.s.cur.some(a => f.type.includes(a.type)))
    && (!(f.lvl || []).length || x.s.cur.some(a => f.lvl.includes(a.level)));
}
const TYPE_CATS = [{ k: 'type', label: 'Type', opts: () => Object.entries(TYPE_NAME) }];
const hoSiteOf = a => a.level === 'site' ? a.target : a.level === 'section' ? by('sections', a.target).site : by('sections', by('enclosures', a.target).section).site;
const hoSecOf = a => a.level === 'section' ? a.target : a.level === 'enclosure' ? by('enclosures', a.target).section : null;
function hoCats(sp) {
  const H = D.assignments.filter(a => a.sp === sp && a.state === 'current' && ['site', 'section', 'enclosure'].includes(a.level));
  const uniq = xs => [...new Set(xs.filter(Boolean))];
  return [
    { k: 'lvl', label: 'Housing level', opts: () => [['site', 'Site-wide'], ['section', 'Section-wide'], ['enclosure', 'Enclosure-wide']] },
    { k: 'hsite', label: 'Site', opts: () => uniq(H.map(hoSiteOf)).map(x => [x, by('sites', x).name]) },
    { k: 'hsec', label: 'Section', opts: () => uniq(H.map(hoSecOf)).map(x => [x, by('sections', x).name]) },
    { k: 'henc', label: 'Enclosure', opts: () => uniq(H.filter(a => a.level === 'enclosure').map(a => a.target)).map(x => [x, by('enclosures', x).name]) },
    { k: 'hdiet', label: 'Diet', opts: () => uniq(H.map(a => a.plan)).map(x => { const p = plan(x); return [x, `${p.code || p.id} · ${p.name}`]; }) },
    { k: 'type', label: 'Diet type', opts: () => Object.entries(TYPE_NAME) },
  ];
}
function flOpen(kind, ret) {
  const cats = kind === 'animals' ? anCats(S.spid) : kind === 'housing' ? hoCats(S.spid) : kind === 'type' ? TYPE_CATS : FILTER_CATS, key = kind === 'animals' ? 'aflt' : kind === 'housing' ? 'hflt' : kind === 'type' ? 'sflt' : 'flt';
  S.fl = { cats, key, ret, cat: cats[0].k, q: '', sel: JSON.parse(JSON.stringify(S[key] || {})) };
  go('#/diets/filters');
}
function flToggle(k) { const a = S.fl.sel[S.fl.cat] = S.fl.sel[S.fl.cat] || []; const i = a.indexOf(k); if (i >= 0) a.splice(i, 1); else a.push(k); render(); }
function flApply() { const f = S.fl; S[f.key || 'flt'] = f.sel; S.fl = null; goBack(f.ret || '#/diets'); }
const labelOf = (c, k) => (c.opts().find(o => o[0] === k) || [k, k])[1];
function flRemove(cat, k) { const a = (S.flt || {})[cat] || []; const i = a.indexOf(k); if (i >= 0) a.splice(i, 1); render(); }
function vFilters() {
  if (!S.fl) S.fl = { cats: FILTER_CATS, key: 'flt', ret: '#/diets', cat: FILTER_CATS[0].k, q: '', sel: JSON.parse(JSON.stringify(S.flt || {})) };
  const fl = S.fl, cats = fl.cats || FILTER_CATS, cat = cats.find(c => c.k === fl.cat) || cats[0], q = fl.q.trim().toLowerCase();
  const rail = cats.map(c => `<button class="flcat${c.k === fl.cat ? ' on' : ''}" onclick="S.fl.cat='${c.k}';S.fl.q='';render()"><span class="t-minor-title grow">${c.label}</span><span class="t-minor-title">${(fl.sel[c.k] || []).length}</span></button>`).join('');
  const rows = cat.opts().filter(([, l]) => !q || l.toLowerCase().includes(q))
    .map(([k, l]) => { const on = (fl.sel[cat.k] || []).includes(k); return `<button class="flopt${on ? ' on' : ''}" onclick="flToggle('${k}')">${ic(on ? 'cbOn' : 'cbOff', 26)}<span class="t-minor-regular">${esc(l)}</span></button>`; }).join('');
  return {
    task: true, flush: true,
    head: { title: `Filters (${fltCount(fl.sel)})`, right: `<button class="iconbtn" onclick="var r=S.fl&&S.fl.ret||'#/diets';S.fl=null;goBack(r)" aria-label="Close">${ic('x', 24)}</button>` },
    html: `<div class="flpage"><div class="flrail">${rail}</div><div class="flbody"><label class="flsearch"><input id="flq" class="t-minor-regular" placeholder="Search" value="${esc(fl.q)}" oninput="S.fl.q=this.value;render()" aria-label="Search">${ic('search', 22)}</label>${rows || empty('search', 'No match')}</div></div>`,
    foot: `<div class="foot end"><button class="btn pri" onclick="flApply()">Apply filters</button></div>`,
  };
}

function vDiets() {
  S.fl = null;
  const q = (S.q || '').trim().toLowerCase(), hit = x => String(x).toLowerCase().includes(q), t = S.sd || 'with';
  const here = sp => !S.site || S.site === 'all' || D.animals.some(a => a.sp === sp.id && animalPath(a).site === S.site);
  const all = D.species.filter(here).map(sp => { const s = speciesSummary(sp); return { sp, s: { ...s, cur: s.cur.filter(atSite), pend: s.pend.filter(atSite), custom: s.custom.filter(atSite) } }; });
  const list = spSort(all.filter(x => (t === 'all' || (t === 'with' ? !x.s.none : x.s.none)) && spMatch(x) && (!q || hit(x.sp.name) || hit(x.sp.sci))), S.spsort || 'cd');
  const nTab = k => all.filter(x => (k === 'all' || (k === 'with' ? !x.s.none : x.s.none)) && spMatch(x) && (!q || hit(x.sp.name) || hit(x.sp.sci))).length;
  const tabs = `<nav class="sdtabs">${SD_TABS.map(([k, l]) => `<a class="t-minor-medium${t === k ? ' on' : ''}" href="javascript:void 0" onclick="S.sd='${k}';render()">${l} - ${nTab(k)}</a>`).join('')}</nav>`;
  const fn = fltCount(S.flt);
  const filter = `<button class="spfilter${fn ? ' on' : ''}" onclick="flOpen('cls', '#/diets')" aria-label="Filters">${ic('filter', 24)}${fn ? `<span class="t-minor-medium">${fn}</span>` : ''}</button><button class="spfilter" onclick="sortSheet()" aria-label="Sort">${ic('sort', 24)}</button>`;
  const chips = fn ? `<div class="fchips">${FILTER_CATS.flatMap(c => ((S.flt || {})[c.k] || []).map(k => `<button class="fchip" onclick="flRemove('${c.k}','${k}')" aria-label="Remove ${esc(labelOf(c, k))}"><span class="t-minor-medium">${esc(labelOf(c, k))}</span>${ic('x', 20)}</button>`)).join('')}</div>` : '';
  const tools = `<div class="spband inpage"><label class="spsearch">${ic('search', 20)}<input id="q" class="t-body-regular" placeholder="Search" value="${esc(S.q)}" oninput="S.q=this.value;render()" aria-label="Search"></label>${filter}</div>${chips}`;
  let more = '';
  if (q) {
    const ans = D.animals.filter(a => hit(a.name) || hit(a.id)), places = [];
    D.species.forEach(sp => ['site', 'section', 'enclosure'].forEach(l => placesOf(sp.id, l).forEach(id => { if (hit(targetName(l, id))) places.push([l, sp.id, id]); })));
    more = (ans.length ? sec('Animals', `<div class="ents">${ans.map(a => animalCard(a, { right: dietRight(resolveAnimal(a).winner, 'animal') })).join('')}</div>`) : '')
      + (places.length ? sec('Places', `<div class="ents">${places.map(([l, sp, id]) => placeCard(l, sp, id, { right: dietRight(resolveScope(sp, l, id).winner, l) })).join('')}</div>`) : '');
  }
  const body = list.length ? `<div class="spcards">${list.map(x => spRow(x.sp, x.s)).join('')}</div>` : more ? '' : `<section class="card">${empty(q ? 'search' : 'check', q ? 'No match' : 'None')}</section>`;
  return { tab: 'diets', head: { back: '#/menu', title: 'Species Diet', right: siteBtn() }, html: tabs + tools + body + more };
}

/* the species page — an exact copy of the Figma draft, frame 31:302 (read via get_design_context, 2026-09-29).
   Species Wise answers one question: which diets are directly assigned to this species? Housing and Animal IA are not solved yet. */
const TYPE_NAME = { yearround: 'Year-round', seasonal: 'Seasonal', timebound: 'Time-Bound' };
const SP_TABS = [['sp', 'Species Wise'], ['ho', 'Housing Wise'], ['an', 'Animal Wise']];
function spDietMeta(a) {
  const when = a.type === 'seasonal' ? `${fmtMD(a.from)} → ${fmtMD(a.to)}` : a.type === 'timebound' ? `${fmtDayY(a.start)} → ${fmtDayY(a.end)}` : '';
  return `<span>${esc(plan(a.plan).name)}</span>${when ? `<span>•</span><span>${when}</span>` : ''}`;
}
function spDietCard(a, on, { fp = '', push = false, pick = false } = {}) {
  const p = plan(a.plan);
  return `<a class="dcard${pick && S.dsel === a.id ? ' sel' : ''}" href="javascript:void 0" onclick="${pick ? `S.dsel='${a.id}';S.dsv='items';S.dshr=null;render()` : `dietSheet('${a.id}'${push ? ', true' : ''})`}"><span class="dtxt"><span class="ttag ${a.type} t-body-medium">${ic(a.type, 16)}${TYPE_NAME[a.type]}</span><span class="dtt"><span class="n t-minor-medium${on ? '' : ' strike'}">${esc(p.code || p.id)}</span><span class="m t-body-regular">${spDietMeta(a)}</span>${fp ? `<span class="lvpills">${fp}</span>` : ''}</span></span>${ic('chev', 24)}</a>`;
}
/* ---------- the diet sheet (diet-system reference screens, 2026-09-29): chips to switch diet, Items | Nutrition ---------- */
let DS = null;
const hr12 = t => { const h = +t.slice(0, 2); return `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`; };
const dsWhen = a => a.type === 'seasonal' ? `${fmtMD(a.from)} – ${fmtMD(a.to)}` : a.type === 'timebound' ? `${fmtDayY(a.start)} – ${fmtDayY(a.end)}` : '';
function dietSheet(id, push = false) { const a = by('assignments', id); DS = { sp: a.sp, asg: id, view: 'items' }; openSheet(dsHtml(), 'tall', push); }
function dsView(v) { DS.view = v; dsDraw(); }
function dsDraw() { $('#sheet').innerHTML = '<div class="grab"></div>' + dsHtml(); typesetButtons(); }
const dsPrep = i => [i.prep, i.cut && `${i.cut} cut`].filter(Boolean).join(' · ');
function dsEntry(i) {
  const feed = i.feed ? `<span class="dfeed t-subtext-title">${esc(i.feed)}</span>` : '';
  const head = (name, kind) => `${feed}<span class="dnm"><span class="t-minor-title">${esc(name)}</span>${kind ? `<span class="ktag t-subtext-title">${kind}</span>` : ''}</span>`;
  if (i.recipe) { const r = by('recipes', i.recipe);
    return head(r.name, 'Recipe') + `<span class="dsub">${r.items.map(x => `<span class="t-body-regular">${esc(x.name)} · ${qty(x)}${dsPrep(x) ? ` — ${esc(dsPrep(x))}` : ''}</span>`).join('')}</span>`; }
  if (i.mix) { const m = by('mixes', i.mix);
    const vars = i.vars ? Object.entries(i.vars).map(([k, v]) => `<span class="t-body-regular dvar">${esc(k)} → ${esc(v)}</span>`).join('') : '';
    return head(m.name, 'Mix') + `<span class="dsub">${m.parts.map(([n, pc]) => `<span class="t-body-regular">${esc(n)} · ${pc}%</span>`).join('')}${vars}</span>`; }
  if (i.choice) return head(i.choice.join(' or '), 'Choose one');
  return head(i.name) + `${dsPrep(i) ? `<span class="prep t-body-reg-italic">(${esc(dsPrep(i))})</span>` : ''}${i.alt ? `<span class="alt t-body-regular">or ${esc(i.alt)}</span>` : ''}`;
}
function dsItemsTable(a, p) {
  const byAge = !!p.byAge, groups = [];   // rows grouped by time, then by meal (the day)
  p.meals.forEach(m => { const g = groups.find(x => x.time === m.time && x.to === m.to); if (g) g.meals.push(m); else groups.push({ time: m.time, to: m.to, meals: [m] }); });
  const ageTd = i => byAge ? [0, 1, 2].map(k => `<td class="num t-body-regular">${i.age ? `${i.age[k]} ${i.unit}` : ''}</td>`).join('') : '';
  let rows = '';
  groups.forEach(g => {
    const gN = g.meals.reduce((n, m) => n + m.items.length, 0); let gFirst = true;
    g.meals.forEach(m => { let mFirst = true;
      m.items.forEach(i => {
        rows += `<tr>${gFirst ? `<td class="time t-minor-title" rowspan="${gN}">${hr12(g.time)}${g.to ? ` – ${hr12(g.to)}` : ''}</td>` : ''}${mFirst ? `<td class="t-body-regular" rowspan="${m.items.length}">${esc(m.days)}</td>` : ''}<td>${dsEntry(i)}</td><td class="num t-minor-title">${qty(i)}</td>${ageTd(i)}</tr>`;
        gFirst = false; mFirst = false;
      });
    });
  });
  const ageTh = byAge ? '<th class="num t-subtext-title">0–1 Y</th><th class="num t-subtext-title">1–5 Y</th><th class="num t-subtext-title">5+ Y</th>' : '';
  return `<div class="dstable-wrap"><table class="dstable"><thead><tr><th class="t-subtext-title">Time</th><th class="t-subtext-title">Day</th><th class="t-subtext-title">Item</th><th class="num t-subtext-title">Daily amt</th>${ageTh}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
function dsNut(p) {
  const n = p.nut || {}, row = (l, k, u, sub) => { const v = n[k] || 0; return `<div class="nrow${sub ? ' sub' : ''}"><span class="${sub ? 't-body-regular' : 't-minor-title'}">${l}</span><span class="nv${v ? '' : ' zero'}"><span class="t-minor-title">${v.toLocaleString('en-IN')}</span><span class="t-body-regular"> ${u}</span></span></div>`; };
  return `<div class="ncard"><p class="t-medium-title">Nutrition</p><p class="nsub t-body-regular">Per animal · per day — totals across every item in this plan</p>
<p class="nsec t-subtext-title">Macros</p>${row('Energy', 'energy', 'kcal')}${row('Protein', 'protein', 'g')}${row('Fat', 'fat', 'g')}${row('Carbohydrate', 'carb', 'g')}${row('Fiber', 'fiber', 'g', true)}${row('Moisture', 'moist', '%', true)}
<p class="nsec t-subtext-title">Minerals</p>${row('Calcium', 'ca', 'mg')}${row('Phosphorus', 'ph', 'mg')}
<p class="nsec t-subtext-title">Vitamins</p>${row('Vitamin A', 'va', 'IU')}${row('Vitamin D', 'vd', 'IU')}${row('Vitamin E', 've', 'mg')}${row('Vitamin C', 'vc', 'mg')}</div>`;
}
/* everywhere this diet is assigned, level by level (the assignment layer) */
const SHR_LV = [['species', 'Species'], ['site', 'Sites'], ['section', 'Sections'], ['enclosure', 'Enclosures'], ['animal', 'Animals']];
function dsShared(a) {
  /* everywhere else this diet is assigned; the species being viewed is not "shared" */
  const uses = usesOf(a.plan).filter(u => !(u.level === 'species' && u.target === DS.sp));
  const lv = SHR_LV.map(([k, l]) => [k, l, uses.filter(u => u.level === k).length]).filter(([, , n]) => n);
  if (!lv.length) return '';
  if (!DS.shr || !lv.some(([k]) => k === DS.shr)) DS.shr = lv[0][0];
  const tabs = `<div class="spchips">${lv.map(([k, l, n]) => `<button class="spchip${DS.shr === k ? ' on' : ''} t-body-medium" onclick="DS.shr='${k}';dsDraw()">${l} - ${n}</button>`).join('')}</div>`;
  const list = uses.filter(u => u.level === DS.shr);
  const cards = `<div class="ents">${list.map(u => u.level === 'animal' ? animalCard(by('animals', u.target)) : placeCard(u.level, u.sp, u.target)).join('')}</div>`;
  return `<div class="dsshared"><h2 class="t-minor-title">Diet shared with</h2>${tabs}${cards}</div>`;
}
function dsHtml() {
  const a = by('assignments', DS.asg), p = plan(a.plan), res = resolveScope(DS.sp, 'species', DS.sp);
  const on = roleOf(a, res) !== 'notinforce';
  const seg = `<div class="dseg">${[['items', 'meals', 'Items'], ['nutrition', 'nutrition', 'Nutrition']].map(([k, i, l]) => `<button class="${DS.view === k ? 'on' : ''}" onclick="dsView('${k}')" aria-label="${l}" title="${l}">${ic(i, 20)}</button>`).join('')}</div>`;
  const head = `<div class="dshead"><div class="dsh-l"><div class="dsh-r1"><span class="t-medium-medium">${esc(p.code || p.id)}</span><span class="dstag${on ? ' ok' : ''} t-body-medium">${on ? 'Active' : 'Inactive'}</span>${p.byAge ? `<span class="dsage t-body-medium">By age</span>` : ''}</div><p class="dsh-nm t-body-regular">${esc(p.name)}</p></div><span class="grow"></span><button class="iconbtn" onclick="closeSheet()" aria-label="Close">${ic('x', 24)}</button></div>
<div class="dsrow2"><div class="dsr2-l"><p class="dstype ${a.type} t-body-medium">${ic(a.type, 16)}${TYPE_NAME[a.type]}</p>${a.type === 'yearround' ? '' : `<p class="dsperiod t-body-medium">${dsWhen(a)}${a.type === 'seasonal' ? ' · yearly' : ''}</p>`}<p class="dssince t-body-regular">Since ${fmtDayY(a.since.slice(0, 10))}</p></div><span class="grow"></span>${seg}</div>`;
  const body = DS.view === 'items' ? dsItemsTable(a, p) : dsNut(p);
  const rules = DS.view === 'items' && p.rules ? `<div class="dreason"><span class="t-body-title">Feeding rules:</span>${p.rules.map(r => `<span class="rchip t-body-medium">${esc(r)}</span>`).join('')}</div>` : '';
  const reason = p.reason ? `<div class="dreason"><span class="t-body-title">Change reason:</span><span class="rchip t-body-medium">${esc(p.reason)}</span></div>` : '';
  const shared = dsShared(a);
  return `<div class="sh-b ds">${head}<div class="ds-scroll">${body}${rules}${reason}${shared}</div></div>`;
}

/* Housing Wise (the Figma draft, frame 35:1600): level chips, then only the locations that hold an assignment
   for this species at that level — a card per location with its parent line and its active-diet count. */
const HO_LV = [['site', 'Site'], ['section', 'Section'], ['enclosure', 'Enclosure']];
function vSpeciesHousing(id, head, tabs) {
  const q = (S.hq || '').trim().toLowerCase(), f = S.hflt || {}, pick = (ks, v) => !(ks || []).length || ks.includes(v);
  const H = D.assignments.filter(a => a.sp === id && a.state === 'current' && ['site', 'section', 'enclosure'].includes(a.level))
    .filter(a => pick(f.type, a.type) && pick(f.hdiet, a.plan) && pick(f.lvl, a.level) && pick(f.hsite, hoSiteOf(a)) && pick(f.hsec, hoSecOf(a)) && pick(f.henc, a.level === 'enclosure' ? a.target : null));
  const locs = l => [...new Set(H.filter(a => a.level === l).map(a => a.target))];
  const lvs = HO_LV.filter(([k]) => pick(f.lvl, k));
  const lvl = lvs.some(([k]) => k === (S.hlv || 'site')) ? (S.hlv || 'site') : lvs[0][0];
  const fn = fltCount(f);
  const band = `<div class="spband"><label class="spsearch">${ic('search', 20)}<input id="hq" class="t-body-regular" placeholder="Search" value="${esc(S.hq || '')}" oninput="S.hq=this.value;render()" aria-label="Search"></label><button class="spfilter${fn ? ' on' : ''}" onclick="flOpen('housing', '#/diets/sp/${id}')" aria-label="Filters">${ic('filter', 24)}${fn ? `<span class="t-minor-medium">${fn}</span>` : ''}</button></div>`;
  const chips = `<div class="spchips">${lvs.map(([k, l]) => `<button class="spchip${lvl === k ? ' on' : ''} t-body-medium" onclick="S.hlv='${k}';render()">${l} - ${locs(k).length}</button>`).join('')}</div>`;
  const inforce = a => roleOf(a, resolveScope(id, a.level, a.target)) !== 'notinforce';
  const items = locs(lvl).map(t => ({ t, name: targetName(lvl, t), sub: lvl === 'site' ? '' : placePath(lvl, t), n: H.filter(a => a.level === lvl && a.target === t && inforce(a)).length }))
    .filter(x => !q || x.name.toLowerCase().includes(q) || x.sub.toLowerCase().includes(q));
  const cards = items.length
    ? `<div class="spcards">${items.map(x => `<a class="spcard" href="${placeHref(lvl, id, x.t)}"><span class="tile">${ic('place', 24)}</span><span class="grow"><span class="n t-minor-title">${esc(x.name)}</span>${x.sub ? `<span class="m t-body-regular">${esc(x.sub)}</span>` : ''}</span><span class="spn"><span class="v t-stat-title">${x.n}</span><span class="l t-body-regular">${x.n === 1 ? 'Active Diet' : 'Active Diets'}</span></span></a>`).join('')}</div>`
    : `<section class="card">${empty('place', q ? 'No match' : 'Not assigned')}</section>`;
  return { head, flush: true, html: tabs + band + `<div class="spbody">${chips}${cards}</div>` };
}

/* Animal Wise: only the animals that hold a diet assignment at animal level (the Animals scope shows
   animal-level assignments, nothing inherited). Cards follow the Antz Animal List. */
const AN_SORTS = [['id', 'Animal Id'], ['az', 'Name (A-Z)'], ['za', 'Name (Z-A)'], ['eaz', 'Enclosure (A-Z)'], ['eza', 'Enclosure (Z-A)']];
function anSortSheet() { SRT = S.ansort || 'id'; openSheet(anSortHtml()); }
function anSortHtml() {
  return `<div class="sh-h shx"><h2 class="t-major-medium">Sort by</h2><button class="iconbtn" onclick="closeSheet()" aria-label="Close">${ic('x', 24)}</button></div><div class="sh-b"><div class="ocards">${AN_SORTS.map(([k, l]) => `<button class="ocard${SRT === k ? ' on' : ''}" onclick="SRT='${k}';anSrtDraw()"><span class="t-minor-medium grow">${l}</span><span class="radio-ic">${ic('radioOff', 24)}${ic('radioOn', 24)}</span></button>`).join('')}</div></div><div class="sh-f"><button class="btn pri block" onclick="S.ansort=SRT;closeSheet();render()">Done</button></div>`;
}
function anSrtDraw() { $('#sheet').innerHTML = '<div class="grab"></div>' + anSortHtml(); typesetButtons(); }
const anSiteOf = a => by('sections', by('enclosures', a.enc).section).site;
function anCats(sp) {
  const sites = [...new Set(D.animals.filter(a => a.sp === sp && D.assignments.some(x => x.level === 'animal' && x.target === a.id && x.state === 'current')).map(anSiteOf))];
  return [
    { k: 'sex', label: 'Gender', opts: () => [['M', 'Male'], ['F', 'Female']] },
    { k: 'asite', label: 'Site', opts: () => sites.map(x => [x, by('sites', x).name]) },
    { k: 'type', label: 'Diet type', opts: () => Object.entries(TYPE_NAME) },
  ];
}
function vSpeciesAnimals(id, head, tabs) {
  const q = (S.aq || '').trim().toLowerCase(), f = S.aflt || {}, pick = (ks, v) => !(ks || []).length || ks.includes(v);
  const own = a => D.assignments.filter(x => x.level === 'animal' && x.target === a.id && x.state === 'current' && pick(f.type, x.type));
  const list = D.animals.filter(a => a.sp === id && own(a).length)
    .filter(a => pick(f.sex, a.sex) && pick(f.asite, anSiteOf(a)))
    .filter(a => !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || targetName('enclosure', a.enc).toLowerCase().includes(q));
  const srt = S.ansort || 'id', en = a => targetName('enclosure', a.enc);
  list.sort((a, b) => srt === 'az' ? a.name.localeCompare(b.name) : srt === 'za' ? b.name.localeCompare(a.name) : srt === 'eaz' ? en(a).localeCompare(en(b)) : srt === 'eza' ? en(b).localeCompare(en(a)) : a.id.localeCompare(b.id));
  const fn = fltCount(f);
  const band = `<div class="spband"><label class="spsearch">${ic('search', 20)}<input id="aq" class="t-body-regular" placeholder="Search" value="${esc(S.aq || '')}" oninput="S.aq=this.value;render()" aria-label="Search"></label><button class="spfilter${fn ? ' on' : ''}" onclick="flOpen('animals', '#/diets/sp/${id}')" aria-label="Filters">${ic('filter', 24)}${fn ? `<span class="t-minor-medium">${fn}</span>` : ''}</button><button class="spfilter" onclick="anSortSheet()" aria-label="Sort">${ic('sort', 24)}</button></div>`;
  const nact = a => { const res = resolveAnimal(a); return own(a).filter(x => roleOf(x, res) !== 'notinforce').length; };
  const cards = list.length
    ? `<div class="spcards">${list.map(a => { const n = nact(a); return `<a class="spcard" href="#/diets/animal/${a.id}"><span class="av" aria-hidden="true"><span class="t-minor-title">${initials(a.name)}</span>${sexBadge(a)}</span><span class="grow"><span class="n t-minor-title">AAID: ${a.id}</span><span class="m t-body-regular">Name: ${esc(a.name)}</span><span class="m t-body-regular">Encl: ${esc(targetName('enclosure', a.enc))}</span></span><span class="spn"><span class="v t-stat-title">${n}</span><span class="l t-body-regular">${n === 1 ? 'Active Diet' : 'Active Diets'}</span></span></a>`; }).join('')}</div>`
    : `<section class="card">${empty('user', q ? 'No match' : 'Not assigned')}</section>`;
  return { head, flush: true, html: tabs + band + `<div class="spbody">${cards}</div>` };
}

/* the 40/60 split (requests-desk pattern): diet cards left, the sheet's detail content docked right */
function paneShared(a, spCtx) {
  const uses = usesOf(a.plan).filter(u => !(u.level === 'species' && u.target === spCtx));
  const lv = SHR_LV.map(([k, l]) => [k, l, uses.filter(u => u.level === k).length]).filter(([, , n]) => n);
  if (!lv.length) return '';
  if (!S.dshr || !lv.some(([k]) => k === S.dshr)) S.dshr = lv[0][0];
  const chips = `<div class="spchips">${lv.map(([k, l, n]) => `<button class="spchip${S.dshr === k ? ' on' : ''} t-body-medium" onclick="S.dshr='${k}';render()">${l} - ${n}</button>`).join('')}</div>`;
  const list = uses.filter(u => u.level === S.dshr);
  return `<div class="dsshared" style="margin-top:0"><h2 class="t-minor-title">Diet shared with</h2>${chips}<div class="ents">${list.map(u => u.level === 'animal' ? animalCard(by('animals', u.target)) : placeCard(u.level, u.sp, u.target)).join('')}</div></div>`;
}
function dietPane(a, spCtx) {
  const p = plan(a.plan), on = asgInforce(a), v = S.dsv || 'items';
  const seg = `<div class="dseg">${[['items', 'meals', 'Items'], ['nutrition', 'nutrition', 'Nutrition']].map(([k, i, l]) => `<button class="${v === k ? 'on' : ''}" onclick="S.dsv='${k}';render()" aria-label="${l}" title="${l}">${ic(i, 20)}</button>`).join('')}</div>`;
  const body = v === 'items' ? dsItemsTable(a, p) : dsNut(p);
  const rules = v === 'items' && p.rules ? `<div class="dreason"><span class="t-body-title">Feeding rules:</span>${p.rules.map(r => `<span class="rchip t-body-medium">${esc(r)}</span>`).join('')}</div>` : '';
  const reason = p.reason ? `<div class="dreason"><span class="t-body-title">Change reason:</span><span class="rchip t-body-medium">${esc(p.reason)}</span></div>` : '';
  return `<section class="pane"><div class="dshead"><div class="dsh-l"><div class="dsh-r1"><span class="t-medium-medium">${esc(p.code || p.id)}</span><span class="dstag${on ? ' ok' : ''} t-body-medium">${on ? 'Active' : 'Inactive'}</span>${p.byAge ? `<span class="dsage t-body-medium">By age</span>` : ''}</div><p class="dsh-nm t-body-regular">${esc(p.name)}</p></div></div>
<div class="dsrow2"><div class="dsr2-l"><p class="dstype ${a.type} t-body-medium">${ic(a.type, 16)}${TYPE_NAME[a.type]}</p>${a.type === 'yearround' ? '' : `<p class="dsperiod t-body-medium">${dsWhen(a)}${a.type === 'seasonal' ? ' · yearly' : ''}</p>`}<p class="dssince t-body-regular">Since ${fmtDayY(a.since.slice(0, 10))}</p></div><span class="grow"></span>${seg}</div>
<div class="pbody">${body}${rules}${reason}${paneShared(a, spCtx)}</div></section>`;
}
function dietSplit(list, inforce, spCtx, qid) {
  if (!list.some(a => a.id === S.dsel)) S.dsel = list[0].id;
  const cur = list.find(a => a.id === S.dsel);
  return `<div class="split dsplit"><div class="dcards lscroll">${list.map(a => spDietCard(a, inforce(a), { pick: true })).join('')}</div>${dietPane(cur, spCtx)}</div>`;
}
/* the species stat bar (Antz stats card) and its Diets / Active diets sheet, grouped by level in
   hierarchy order — species level first. A diet card opens the diet sheet ON TOP (stacked). */
const asgInforce = a => roleOf(a, resolveScope(a.sp, a.level, a.target)) !== 'notinforce';
function spStats(id) {
  const animals = D.animals.filter(a => a.sp === id);
  const sites = new Set(animals.map(anSiteOf)).size;
  const cur = D.assignments.filter(a => a.sp === id && a.state === 'current');
  const plans = new Set(cur.map(a => a.plan)).size;
  const active = new Set(cur.filter(asgInforce).map(a => a.plan)).size;
  return { animals: animals.length, sites, plans, active, cur };
}
function spDietsSheet(id, mode) {
  const cur = D.assignments.filter(a => a.sp === id && a.state === 'current').filter(a => mode !== 'active' || asgInforce(a));
  const groups = [];   // one card per unique diet, its footprint (the levels it is assigned at) on the card
  cur.forEach(a => { let g = groups.find(x => x.plan === a.plan); if (!g) { g = { plan: a.plan, rows: [] }; groups.push(g); } g.rows.push(a); });
  const rank = g => g.rows.some(a => a.level === 'species') ? 0 : g.rows.some(a => a.level !== 'animal') ? 1 : 2;
  groups.sort((x, y) => rank(x) - rank(y));
  const fpOf = g => LEVELS.map(l => { const n = g.rows.filter(a => a.level === l).length; return !n ? '' : `<span class="lvp t-body-medium"><b>${n}</b>${LEVEL[l]}${n === 1 ? '' : 's'}</span>`; }).join('');
  const cards = groups.map(g => { const rep = g.rows.find(a => a.level === 'species') || g.rows[0]; return spDietCard(rep, g.rows.some(asgInforce), { fp: fpOf(g), push: true }); }).join('');
  openSheet(`<div class="sh-h shx"><h2 class="t-major-medium">${mode === 'active' ? 'Active diets' : 'Diets'} - ${groups.length}</h2><button class="iconbtn" onclick="closeSheet()" aria-label="Close">${ic('x', 24)}</button></div><div class="sh-b sheet-stack">${groups.length ? `<div class="dcards">${cards}</div>` : empty('diets', 'No diets')}</div>`, 'tall');
}
function spStatBar(id, st = spStats(id)) {
  const cell = (v, l, on, ok) => `<button class="stx${ok ? ' ok' : ''}" onclick="${on}"><span class="v t-stat-title">${v}</span><span class="l t-body-regular">${l}</span></button>`;
  return `<div class="statbar">${cell(st.animals, 'Animals', `S.spt='an';render()`)}${cell(st.sites, 'Sites', `S.spt='ho';S.hlv='site';render()`)}${cell(st.plans, 'Diets', `spDietsSheet('${id}','all')`)}${cell(st.active, 'Active diets', `spDietsSheet('${id}','active')`, true)}</div>`;
}

function vSpecies(id) {
  const sp = by('species', id), s = speciesSummary(sp);
  if (S.spid !== id) {
    const cur = D.assignments.filter(a => a.sp === id && a.state === 'current');
    const spt = cur.some(a => a.level === 'species') || !cur.length ? 'sp' : cur.some(a => ['site', 'section', 'enclosure'].includes(a.level)) ? 'ho' : 'an';
    const hlv = ['site', 'section', 'enclosure'].find(l => cur.some(a => a.level === l)) || 'site';
    Object.assign(S, { spid: id, spq: '', hq: '', aq: '', hlv, sptF: 'active', sflt: null, hflt: null, aflt: null, ansort: null, spt, dsel: null, dsv: 'items', dshr: null, dsort: null });
  }
  const t = S.spt || 'sp', res = resolveScope(id, 'species', id), q = (S.spq || '').trim().toLowerCase();
  const head = { back: '#/diets', cls: 'sp', ava: initials(sp.name), title: esc(sp.name), facts: `<i>${esc(sp.sci)}</i>` };
  const st = spStats(id);
  const nOf = f => new Set(st.cur.filter(a => f(a.level) && asgInforce(a)).map(a => a.plan)).size;
  const nSp = nOf(l => l === 'species'), nHo = nOf(l => ['site', 'section', 'enclosure'].includes(l)), nAn = nOf(l => l === 'animal');
  const tabN = { sp: nSp, ho: nHo, an: nAn };
  const tabs = spStatBar(id, st) + `<nav class="stabs">${SP_TABS.map(([k, l]) => `<a class="t-minor-medium${t === k ? ' on' : ''}" href="javascript:void 0" onclick="S.spt='${k}';render()">${l} - ${tabN[k]}</a>`).join('')}</nav>`;
  if (t === 'ho') return vSpeciesHousing(id, head, tabs);
  if (t === 'an') return vSpeciesAnimals(id, head, tabs);
  const types = (S.sflt || {}).type || [];
  const base = D.assignments.filter(a => a.sp === id && a.level === 'species' && a.state === 'current')
    .filter(a => (!types.length || types.includes(a.type)) && (!q || (plan(a.plan).code || '').toLowerCase().includes(q) || plan(a.plan).name.toLowerCase().includes(q)));
  const inforce = a => roleOf(a, res) !== 'notinforce';
  const act = base.filter(inforce), inact = base.filter(a => !inforce(a));
  const f = S.sptF || 'active', list = f === 'active' ? act : f === 'inactive' ? inact : base;
  const fn = types.length;
  const band = `<div class="spband"><label class="spsearch">${ic('search', 20)}<input id="spq" class="t-body-regular" placeholder="Search" value="${esc(S.spq || '')}" oninput="S.spq=this.value;render()" aria-label="Search"></label><button class="spfilter${fn ? ' on' : ''}" onclick="flOpen('type', '#/diets/sp/${id}')" aria-label="Filters">${ic('filter', 24)}</button></div>`;
  const chips = `<div class="spchips">${[['active', 'Active', act.length], ['inactive', 'Inactive', inact.length], ['all', 'All', base.length]].map(([k, l, n]) => `<button class="spchip${f === k ? ' on' : ''} t-body-medium" onclick="S.sptF='${k}';render()">${l} - ${n}</button>`).join('')}</div>`;
  return {
    head, flush: true, lock: list.length > 0,
    html: tabs + band + `<div class="spbody">${chips}${list.length ? dietSplit(list, inforce, id, 'spq') : `<section class="card">${empty('diets', 'No species diet')}</section>`}</div>`,
  };
}

/* a location page (site · section · enclosure): the Species Wise elements, scoped to the diets assigned
   directly at this place for this species. Cards open the diet bottom sheet. (Sourav, 2026-09-29) */
function vScope(level, sp, id) {
  const key = `${level}|${id}|${sp}`;
  if (S.scid !== key) Object.assign(S, { scid: key, scq: '', scF: 'active', dsel: null, dsv: 'items', dshr: null });
  const spe = by('species', sp), res = resolveScope(sp, level, id), q = (S.scq || '').trim().toLowerCase(), types = (S.sflt || {}).type || [];
  const base = D.assignments.filter(a => a.sp === sp && a.level === level && a.target === id && a.state === 'current')
    .filter(a => (!types.length || types.includes(a.type)) && (!q || (plan(a.plan).code || '').toLowerCase().includes(q) || plan(a.plan).name.toLowerCase().includes(q)));
  const inforce = a => roleOf(a, res) !== 'notinforce';
  const act = base.filter(inforce), inact = base.filter(a => !inforce(a));
  const f = S.scF || 'active', list = f === 'active' ? act : f === 'inactive' ? inact : base;
  const fn = types.length, here = `#/diets/${level}/${sp}/${id}`;
  const band = `<div class="spband"><label class="spsearch">${ic('search', 20)}<input id="scq" class="t-body-regular" placeholder="Search" value="${esc(S.scq || '')}" oninput="S.scq=this.value;render()" aria-label="Search"></label><button class="spfilter${fn ? ' on' : ''}" onclick="flOpen('type', '${here}')" aria-label="Filters">${ic('filter', 24)}</button></div>`;
  const chips = `<div class="spchips">${[['active', 'Active', act.length], ['inactive', 'Inactive', inact.length], ['all', 'All', base.length]].map(([k, l, n]) => `<button class="spchip${f === k ? ' on' : ''} t-body-medium" onclick="S.scF='${k}';render()">${l} - ${n}</button>`).join('')}</div>`;
  return {
    head: { back: `#/diets/sp/${sp}`, cls: 'sp', ava: ic('place', 22), title: esc(targetName(level, id)), facts: facts(level === 'site' ? '' : placePath(level, id), spe.name) },
    flush: true, lock: list.length > 0,
    html: band + `<div class="spbody">${chips}${list.length ? dietSplit(list, inforce, sp, 'scq') : `<section class="card">${empty('diets', q ? 'No match' : 'Not assigned')}</section>`}</div>`,
  };
}

function vAnimal(id) {
  const a = by('animals', id);
  if (S.anid !== id) Object.assign(S, { anid: id, anq: '', anF: 'active', dsel: null, dsv: 'items', dshr: null });
  const res = resolveAnimal(a), q = (S.anq || '').trim().toLowerCase(), types = (S.sflt || {}).type || [];
  const base = D.assignments.filter(x => x.level === 'animal' && x.target === id && x.state === 'current')
    .filter(x => (!types.length || types.includes(x.type)) && (!q || (plan(x.plan).code || '').toLowerCase().includes(q) || plan(x.plan).name.toLowerCase().includes(q)));
  const inforce = x => roleOf(x, res) !== 'notinforce';
  const act = base.filter(inforce), inact = base.filter(x => !inforce(x));
  const f = S.anF || 'active', list = f === 'active' ? act : f === 'inactive' ? inact : base;
  const fn = types.length;
  const band = `<div class="spband"><label class="spsearch">${ic('search', 20)}<input id="anq" class="t-body-regular" placeholder="Search" value="${esc(S.anq || '')}" oninput="S.anq=this.value;render()" aria-label="Search"></label><button class="spfilter${fn ? ' on' : ''}" onclick="flOpen('type', '#/diets/animal/${id}')" aria-label="Filters">${ic('filter', 24)}${fn ? `<span class="t-minor-medium">${fn}</span>` : ''}</button></div>`;
  const chips = `<div class="spchips">${[['active', 'Active', act.length], ['inactive', 'Inactive', inact.length], ['all', 'All', base.length]].map(([k, l, n]) => `<button class="spchip${f === k ? ' on' : ''} t-body-medium" onclick="S.anF='${k}';render()">${l} - ${n}</button>`).join('')}</div>`;
  return {
    head: { back: `#/diets/sp/${a.sp}`, cls: 'sp', ava: initials(a.name), title: esc(a.name), facts: facts(a.id, targetName('enclosure', a.enc), by('species', a.sp).name) },
    flush: true, lock: list.length > 0,
    html: band + `<div class="spbody">${chips}${list.length ? dietSplit(list, inforce, a.sp, 'anq') : `<section class="card">${empty('diets', q ? 'No match' : 'Not assigned')}</section>`}</div>`,
  };
}

function vPlan(pid) {
  const p = plan(pid), uses = usesOf(pid);
  const cards = uses.map(u => u.level === 'animal' ? animalCard(by('animals', u.target)) : placeCard(u.level, u.sp, u.target)).join('');
  return {
    head: { back: '#/diets', title: esc(p.name), facts: facts('Diet plan', p.sp && by('species', p.sp).name) },
    html: sec('Meals', mealsBlock(pid)) + (uses.length ? sec('In use', `<div class="ents one">${cards}</div>`) : ''),
  };
}

/* one level of one species: every location at that level, each with its diets (Active · Inactive · Overridden · Replaced) */
const LEVEL_PLURAL = { species: 'Species-wide', site: 'Sites', section: 'Sections', enclosure: 'Enclosures', animal: 'Animals' };
function vLevel(sp, lvl) {
  const spe = by('species', sp), q = (S.lq || '').trim().toLowerCase(), F = S.lf || 'all';
  const head = { back: `#/diets/sp/${sp}`, title: LEVEL_PLURAL[lvl], facts: facts(spe.name, lvl === 'species' ? '' : plural(placesOf(sp, lvl).length, lvl === 'animal' ? 'animal' : 'place')) };
  if (lvl === 'species') {
    const res = resolveScope(sp, 'species', sp), list = D.assignments.filter(a => a.sp === sp && a.level === 'species');
    return { head, html: sec('', list.length ? list.map(a => asgRow(a, res)).join('') : empty('diets', 'No diet')) };
  }
  const items = placesOf(sp, lvl).map(pid => {
    const own = D.assignments.filter(a => a.sp === sp && a.level === lvl && a.target === pid);
    const name = lvl === 'animal' ? by('animals', pid).name + ' ' + pid : targetName(lvl, pid);
    return { pid, own, name };
  }).filter(x => (!q || x.name.toLowerCase().includes(q)) && (F === 'all' || x.own.some(a => a.state === 'current')));
  const chips = [['all', 'All'], ['own', 'Own diet']].map(([k, l]) => `<button class="chip${F === k ? ' on' : ''} t-body-medium" onclick="S.lf='${k}';render()">${l}</button>`).join('');
  const block = x => {
    const res = resolveScope(sp, lvl, x.pid), ent = lvl === 'animal' ? animalCard(by('animals', x.pid)) : placeCard(lvl, sp, x.pid);
    const diets = x.own.length ? x.own.map(a => asgRow(a, res)).join('') : `<div class="row arow off"><span class="grow"><span class="title t-body-title" style="display:block">${res.winner ? esc(plan(res.winner.asg.plan).name) : 'No diet'}</span></span><span class="t-body-regular muted">${srcText(res.winner, lvl)}</span></div>`;
    return `<section class="card lvcard"><div class="lvhead"><div class="ents one grow" style="padding:var(--sp-12) 0 0 var(--sp-12)">${ent}</div></div>${diets}</section>`;
  };
  return {
    head, html: strip(`<label class="search">${ic('search', 20)}<input id="lq" class="t-minor-regular" placeholder="Search" value="${esc(S.lq || '')}" oninput="S.lq=this.value;render()" aria-label="Search"></label><div class="tools">${chips}</div>`)
      + (items.length ? items.map(block).join('') : `<section class="card">${empty('search', 'No match')}</section>`),
  };
}
