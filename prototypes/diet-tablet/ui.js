// prototypes/diet-tablet/ui.js — shared state and the components every screen is built from. One item type, one function, so the
// same thing looks the same everywhere. Text styles are .t-* classes from app/type.css; colours live in diet.css.
// Copy rule (Sourav): labels, states and actions only — no explanatory sentences, no subtitles, each fact once.

const S = { user: 'u-keer', frame: 'tablet', level: {}, flt: null, fl: null, q: '', tab: null, hist: 'all', sel: null, draft: null, cfg: null };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const me = () => user(S.user);
const isWeb = () => S.frame === 'web' && innerWidth > 860;
const first = n => n.split(' ')[0];
const initials = n => n.split(/[\s-]+/).filter(w => /^[A-Z0-9]/.test(w)).slice(0, 2).map(w => w[0]).join('');
const plural = (n, w, p = w + 's') => `${n} ${n === 1 ? w : p}`;
const qty = i => `${i.qty} ${i.unit === 'pcs' && +i.qty === 1 ? 'pc' : i.unit}`;
const facts = (...xs) => xs.filter(Boolean).join(' • ');
const who = id => id ? user(id).name : '';
const lastAt = r => r.events[r.events.length - 1].at;
const canRequest = () => ['requester', 'nutritionist'].includes(me().role);
const placeHref = (level, sp, id) => level === 'species' ? `#/diets/sp/${sp}` : level === 'animal' ? `#/diets/animal/${id}` : `#/diets/${level}/${sp}/${id}`;
function toast(msg) { const t = $('#toast'); t.innerHTML = ic('check', 18) + esc(msg); t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600); }
const go = h => { if (window.__route) { window.__route = h; render(); } else location.hash = h; };

/* ---------- page pieces ---------- */
const sec = (title, body, { aside = '', cls = '' } = {}) => `<section class="card ${cls}">${title ? `<div class="sec-h"><h2 class="t-minor-title">${title}</h2>${aside ? `<span class="aside t-body-regular">${aside}</span>` : ''}</div>` : ''}${body}</section>`;
const card = (title, body) => `<section class="card"><div class="sec-h"><h2 class="t-minor-title">${title}</h2></div><div class="fields">${body}</div></section>`;
const empty = (icon, head, btn = '') => `<div class="empty"><span class="ei">${ic(icon, 24)}</span><p class="head t-minor-title">${head}</p>${btn}</div>`;
const chev = () => `<span class="chev">${ic('chev', 20)}</span>`;
const strip = html => `<div class="strip">${html}</div>`;
const countTabs = (tabs, cur, onclick, count) => `<nav class="ctabs">${tabs.map(([k, l]) => `<a class="ctab${cur === k ? ' on' : ''}" href="javascript:void 0" onclick="${onclick.replace(/\$K/g, k)}"><span class="c t-medium-medium">${count(k)}</span><span class="l t-body-regular">${l}</span></a>`).join('')}</nav>`;
const tabsNav = (tabs, cur, onclick, count) => `<nav class="tabs">${tabs.map(([k, l]) => `<a class="t-minor-medium${cur === k ? ' on' : ''}" href="javascript:void 0" onclick="${onclick.replace(/\$K/g, k)}">${l}${count ? `<span class="n t-body-regular">${count(k)}</span>` : ''}</a>`).join('')}</nav>`;
const footBar = ({ secondary = [], main = '' }) => `<div class="foot"><div class="fbtns">${secondary.join('')}${main}</div></div>`;
/* create FAB as a speed dial (the Antz app pattern): gradient + with no text; open = white wash, labelled actions above a light-green × */
const DIAL = [['New request', 'requests', '#/new']];
function fab() {
  const items = DIAL.map(([l, i, h]) => `<a class="tdial-it" href="${h}" onclick="S.dial=false"><span class="t-minor-medium">${l}</span><span class="tdial-b">${ic(i, 24)}</span></a>`).join('');
  return (S.dial ? `<div class="tdial" onclick="S.dial=false;render()"></div><div class="tdial-items">${items}</div>` : '')
    + `<button class="fab gfab${S.dial ? ' open' : ''}" onclick="S.dial=!S.dial;render()" aria-label="${S.dial ? 'Close' : 'Create'}" aria-expanded="${!!S.dial}">${S.dial ? ic('x', 28) : ic('addc', 30)}</button>`;
}

/* ---------- entities ---------- */
const spTile = (sp, cls = '') => `<span class="tile ${cls} t-body-title" aria-hidden="true">${initials(by('species', sp).name)}</span>`;
const sexBadge = a => `<span class="app-photo-badge app-photo-badge--${a.sex === 'F' ? 'female' : 'male'} t-subtext-title">${a.sex}</span>`;
function animalCard(a, { right = '', link = true } = {}) {
  const tag = link ? 'a' : 'div';
  return `<${tag} class="ent"${link ? ` href="#/diets/animal/${a.id}"` : ''}><span class="av" aria-hidden="true"><span class="t-minor-title">${initials(a.name)}</span>${sexBadge(a)}</span><span class="grow"><span class="ent-n t-minor-title">${esc(a.name)}</span><span class="ent-m t-body-regular">${a.id}</span><span class="ent-m t-body-regular">${targetName('enclosure', a.enc)}</span></span>${right ? `<span class="ent-r">${right}</span>` : ''}</${tag}>`;
}
function placeCard(level, sp, id, { right = '', link = true } = {}) {
  const tag = link ? 'a' : 'div';
  return `<${tag} class="ent"${link ? ` href="${placeHref(level, sp, id)}"` : ''}><span class="av place" aria-hidden="true">${ic(level === 'species' ? 'diets' : 'place', 24)}</span><span class="grow"><span class="ent-n t-minor-title">${esc(level === 'species' ? by('species', sp).name : targetName(level, id))}</span><span class="ent-m t-body-regular">${level === 'species' ? 'Species-wide' : LEVEL[level]}</span><span class="ent-m t-body-regular">${plural(animalsIn(sp, level, id).length, 'animal')}</span></span>${right ? `<span class="ent-r">${right}</span>` : ''}</${tag}>`;
}
const targetCard = (r, o = {}) => r.level === 'animal' ? animalCard(by('animals', r.target), o) : placeCard(r.level, r.sp, r.target, o);
/* what something receives: diet name, and where it comes from (one phrasing everywhere) */
const srcText = (w, here) => !w ? '' : w.level === 'species' ? (here === 'species' ? 'Species-wide' : 'From species') : w.level === here ? 'Own diet' : `From ${LEVEL[w.level].toLowerCase()}`;
const dietRight = (w, here) => `<span class="t-body-title head">${w ? esc(plan(w.asg.plan).name) : 'No diet'}</span><span class="t-body-regular muted">${srcText(w, here)}</span>`;

/* ---------- diet status: Active · Overridden · Inactive · Replaced (colour on the glyph only) ---------- */
function statusTag(role) {
  const T = { applies: ['ok', 'check', 'Active'], overridden: ['', 'x', 'Overridden'], notinforce: ['', 'clock', 'Inactive'], replaced: ['', 'undo', 'Replaced'] }[role];
  return `<span class="pill ${T[0]} t-body-medium">${ic(T[1], 16)}${T[2]}</span>`;
}
/* type tag: solid in force · dashed pending · faded closed */
function typeTag(p, cls = '') { if (!p || !p.type) return `<span class="tag line t-body-medium">Type not set</span>`; return `<span class="tag ${cls} t-body-medium">${ic(p.type, 16)}${TYPE[p.type]}${p.type !== 'yearround' ? ` · ${periodText(p).replace(' · every year', '')}` : ''}</span>`; }
const reqTagCls = r => r.state === 'applied' ? '' : TERMINAL.includes(r.state) ? 'faded' : 'line';
/* a diet attached to a scope, as a row: name · type · status */
function asgRow(a, res, { href = `#/plan/${a.plan}` } = {}) {
  const role = roleOf(a, res);
  return `<a class="row arow${role === 'applies' ? '' : ' off'}" href="${href}"><span class="grow"><span class="title t-minor-title" style="display:block">${esc(plan(a.plan).name)}</span><span class="tags mt4">${typeTag(a, role === 'replaced' ? 'faded' : '')}</span></span>${statusTag(role)}${chev()}</a>`;
}

/* ---------- request status: state pill + flags ---------- */
const flagHtml = f => f ? `<span class="flag ${f.tone} t-body-medium">${ic(f.glyph, 16)}${f.label}</span>` : '';
function pill(r) { const d = display(r); return `<span class="pills"><span class="pill ${d.tone} t-body-medium">${ic(d.glyph, 16)}${stageLabel(d)}</span>${flagHtml(d.flag)}${movedUnack(r) ? flagHtml({ label: 'Animal moved', tone: 'warn', glyph: 'place' }) : ''}</span>`; }
function ownerLine(r) {
  const d = display(r), owner = d.owner === 'kitchen' ? user('u-ravi') : d.owner === 'nutritionist' ? user('u-keer') : d.owner === 'requester' ? user(r.by) : null;
  if (owner && owner.id === S.user) return d.next.replace(/^(Nutritionist|Kitchen|\w+) to/, 'You to');
  return `${d.next}${owner && d.owner !== 'requester' ? ` · ${first(owner.name)}` : ''}`;
}
/* request card in lists (Sourav: title, target, status — nothing else) */
const prioTag = p => `<span class="prio ${p || 'medium'} t-body-medium">${p === 'high' ? ic('alert', 16) : ''}${PRIORITY[p || 'medium']}</span>`;
/* request card, after the Antz Help Desk card: ID · about · where, priority ribbon | title · description · requester • date | status band */
const RIBBON = { low: '!', medium: '!!', high: '!!!' };
const bandTone = r => ({ applied: 'ok', rejected: 'bad', cancelled: 'bad' }[r.state] || 'wait');
const stageLabel = d => `${d.label}${d.sub ? ` · ${d.sub}` : ''}`;
function reqRow(r, { sel = false, href = `#/req/${r.id}` } = {}) {
  const d = display(r), f = d.flag || (movedUnack(r) ? { label: 'Animal moved' } : null), p = r.priority || 'medium';
  const where = r.level === 'species' ? 'Species-wide' : r.level === 'animal' ? `${esc(by('animals', r.target).name)} · ${targetName('enclosure', by('animals', r.target).enc)}` : esc(targetName(r.level, r.target));
  return `<a class="hdcard${sel ? ' on' : ''}${r.state === 'cancelled' ? ' struck' : ''}" href="${href}">
    <span class="hd-top"><span class="grow"><span class="hd-id t-minor-title">${r.id}</span><span class="hd-cat t-body-medium">${esc(by('species', r.sp).name)}</span><span class="hd-where t-body-regular">${LEVEL[r.level]} · ${where}</span></span><span class="ribbon ${p} t-medium-title" title="${PRIORITY[p]} priority" aria-label="${PRIORITY[p]} priority">${RIBBON[p]}</span></span>
    <span class="hd-body"><span class="hd-title t-medium-medium">${esc(r.title)}</span><span class="hd-text t-body-regular">${esc(r.text)}</span><span class="hd-by t-body-regular"><b class="t-body-title">${esc(who(r.by))}</b> • ${fmtDayY(r.events[0].at.slice(0, 10))}</span></span>
    <span class="hd-band ${bandTone(r)} t-minor-medium">${ic(d.glyph, 20)}${stageLabel(d)}${f ? ` · ${f.label}` : ''}</span></a>`;
}
/* a pending change on a diet page: dashed */
function pendingCard(list) {
  if (!list.length) return '';
  return `<section class="pend"><p class="pend-h t-body-title">${ic('clock', 18)}Pending</p><div class="rqcards">${list.map(r => reqRow(r)).join('')}</div></section>`;
}

/* ---------- inheritance chain: Species at the top, most specific at the bottom ---------- */
function chainCard(sp, path, start) {
  const res = resolvePath(sp, path, TODAY, start), rows = res.chain.slice().reverse();
  const body = rows.map((c, i) => {
    const items = c.asgs.length ? c.asgs.map(a => `<div class="it"><a class="nm t-body-title" href="#/plan/${a.plan}">${esc(plan(a.plan).name)}</a>${typeTag(a, 'faded')}${statusTag(roleOf(a, res))}</div>`).join('') : `<span class="none t-body-regular">—</span>`;
    const name = c.level === 'species' ? by('species', sp).name : targetName(c.level, c.target);
    return `<div class="lv${c.asgs.length ? ' has' : ''}${c.win ? ' win' : ''}${i === rows.length - 1 ? ' last' : ''}"><span class="node"></span><span><span class="lbl t-body-title" style="display:block">${c.level === 'species' ? 'Species-wide' : LEVEL[c.level]}</span><a class="cnt t-body-regular lnk" href="${placeHref(c.level, sp, c.target)}">${esc(name)}</a></span><div class="items">${items}</div></div>`;
  }).join('');
  return sec('Where it comes from', `<div class="ladder chain">${body}</div>`);
}

/* ---------- year strip: which diet applies on each day ---------- */
const yday = d => daysBetween(d.slice(0, 4) + '-01-01', d);
function yearCard(sp, path, start) {
  const year = TODAY.slice(0, 4), segs = yearSegments(sp, path, start, year), cls = {}; let k = 0;
  const pos = (a, b) => `left:${(yday(a) / 365 * 100).toFixed(2)}%;width:${((yday(b) - yday(a) + 1) / 365 * 100).toFixed(2)}%`;
  const bars = segs.map(s => { if (!s.id) return `<span class="yr-seg none t-subtext-regular" style="${pos(s.from, s.to)}"></span>`; cls[s.id] = cls[s.id] || 'abcd'[k++ % 4]; const name = plan(by('assignments', s.id).plan).name; return `<span class="yr-seg ${cls[s.id]} t-subtext-title" style="${pos(s.from, s.to)}" title="${esc(name)} · ${fmtDay(s.from)} – ${fmtDay(s.to)}">${yday(s.to) - yday(s.from) > 32 ? esc(name) : ''}</span>`; }).join('');
  const key = Object.keys(cls).map(id => `<span class="t-body-regular"><i class="yr-seg ${cls[id]}"></i>${esc(plan(by('assignments', id).plan).name)}</span>`).join('') + `<span class="t-body-regular"><i class="now"></i>Today</span>`;
  return sec('This year', `<div class="yr"><div class="yr-grid one"><div class="yr-m t-subtext-regular">${MON.map(m => `<span>${m}</span>`).join('')}</div><div class="yr-lane res">${bars}<span class="yr-today" style="left:${(yday(TODAY) / 365 * 100).toFixed(2)}%"></span></div></div><div class="yr-key">${key}</div></div>`);
}

/* ---------- meals, diff, compare ---------- */
function mealsBlock(pid) {
  const p = asPlan(pid);
  return p.meals.map(m => `<div class="meal"><p class="when t-body-title">${m.time}<span class="t-body-regular">${esc(m.name)}</span></p><ul>${m.items.map(i => `<li class="t-body-regular"><span class="nm head">${esc(entryName(i))}</span>${i.prep ? `<span class="p">· ${esc(i.prep)}</span>` : ''}<span class="q t-body-medium">${qty(i)}</span></li>`).join('')}</ul></div>`).join('');
}
const MARK = { added: ['plus', 'Added'], removed: ['remove', 'Removed'], changed: ['edit', 'Changed'], same: [null, 'Unchanged'] };
function diffBlock(diff, { onlyChanges = false } = {}) {
  return diff.map(m => { const rows = onlyChanges ? m.rows.filter(r => r.k !== 'same') : m.rows; if (!rows.length) return '';
    return `<div class="meal"><p class="when t-body-title">${m.time}<span class="t-body-regular">${esc(m.name)}</span></p><ul>${rows.map(r => `<li class="${r.k} t-body-regular"><span class="dmark ${r.k}" title="${MARK[r.k][1]}" aria-label="${MARK[r.k][1]}">${MARK[r.k][0] ? ic(MARK[r.k][0], 16) : ''}</span><span class="nm head">${esc(entryName(r.i))}</span><span class="q t-body-medium">${r.k === 'changed' && r.o.qty !== r.i.qty ? `<span class="was t-body-regular">${qty(r.o)}</span>` : ''}${qty(r.i)}</span></li>`).join('')}</ul></div>`; }).join('');
}
/* Now (solid) beside After (dashed); once applied, Before fades */
function cmpBlock(fromId, toId, { applied = false } = {}) {
  const before = `<div class="before"><p class="cmp-h t-body-title">${applied ? 'Before' : 'Now'}${fromId ? ` · ${esc(plan(fromId).name)}` : ''}</p>${fromId ? mealsBlock(fromId) : `<div class="meal"><p class="t-body-regular muted">No diet</p></div>`}</div>`;
  const after = `<div class="after"><p class="cmp-h t-body-title">${applied ? 'Now' : 'After'} · ${esc(plan(toId).name)}</p>${diffBlock(planDiff(fromId, toId))}</div>`;
  return `<div class="cmp${applied ? ' applied' : ''}">${before}${after}</div>`;
}

/* ---------- activity ---------- */
const EV = { submitted: 'Submitted', edited: 'Edited', approved: 'Approved', started: 'Started configuring', rejected: 'Rejected', cancelled: 'Cancelled', move_confirmed: 'Move confirmed',
  configured: 'Configured', delayed: 'Delayed', accepted: 'Accepted', applied: 'Applied', moved: 'Animal moved', comment: 'Comment' };

/* ---------- sheets: choices and reasons only ---------- */
let SHEET = null;
let SHEETS = [];   // stacked sheets: a sheet opened with push keeps the one under it, and closing pops back to it
function openSheet(html, cls = '', push = false) {
  const sh = $('#sheet');
  if (push && $('#scrim').classList.contains('on')) SHEETS.push({ html: sh.innerHTML, cls: sh.className }); else SHEETS = [];
  SHEET = {}; sh.className = `sheet${cls ? ' ' + cls : ''}`; sh.innerHTML = `<div class="grab"></div>${html}`; $('#scrim').classList.add('on'); typesetButtons(); const f = $('#sheet [autofocus]'); if (f) setTimeout(() => f.focus(), 30);
}
function closeSheet() {
  if (SHEETS.length) { const p = SHEETS.pop(), sh = $('#sheet'); sh.className = p.cls; sh.innerHTML = p.html; typesetButtons(); return; }
  $('#scrim').classList.remove('on'); SHEET = null;
}
function closeSheetAll() { SHEETS = []; $('#scrim').classList.remove('on'); SHEET = null; }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#scrim').classList.contains('on')) closeSheet(); });
const pickField = (label, value, ph, onclick, sub = '') => `<div class="field"><label class="t-body-title">${label}</label><button class="pick" onclick="${onclick}">${value ? `<span class="grow"><span class="v t-minor-medium" style="display:block">${value}</span>${sub ? `<span class="t-body-regular muted" style="display:block">${sub}</span>` : ''}</span>` : `<span class="ph t-minor-regular grow">${ph}</span>`}<span class="chev">${ic('down', 20)}</span></button></div>`;
/* opts: [key, title, description, icon]; onpick is JS with $K for the chosen key */
function optionSheet(title, opts, current, onpick) {
  openSheet(`<div class="sh-h"><h2 class="t-medium-medium">${title}</h2></div><div class="sh-b">${opts.map(([k, t, d, i]) => `<button class="row${k === current ? ' on' : ''}" onclick="${onpick.replace(/\$K/g, k)};closeSheet();render()">${i ? `<span class="tile sm">${ic(i, 20)}</span>` : ''}<span class="grow"><span class="title t-minor-title" style="display:block">${t}</span>${d ? `<span class="meta t-body-regular" style="display:block">${d}</span>` : ''}</span>${k === current ? ic('check', 20) : ''}</button>`).join('')}</div>`);
}
function typesetButtons() { document.querySelectorAll('.device .btn, #sheet .btn').forEach(b => { if (![...b.classList].some(c => c.startsWith('t-'))) b.classList.add('t-body-title'); }); }

/* ---------- site filter (Antz Lab pattern): pin · site name · chevron in the top bar, Choose site sheet ---------- */
const siteOfRef = (sp, level, target) => level === 'species' ? null : scopePath(sp, level, target).site;
const atSite = x => !S.site || S.site === 'all' || !siteOfRef(x.sp, x.level, x.target) || siteOfRef(x.sp, x.level, x.target) === S.site;
const siteName = () => !S.site || S.site === 'all' ? 'All Sites' : by('sites', S.site).name;
const siteBtn = () => `<button class="sitebtn" onclick="siteSheet()" aria-label="Site">${ic('place', 24)}<span class="t-minor-medium">${esc(siteName())}</span>${ic('down', 20)}</button>`;
let SITE = {};
function siteSheet() { SITE = { cur: S.site || 'all', q: '' }; openSheet(siteHtml()); }
function siteHtml() {
  const q = SITE.q.trim().toLowerCase(), opts = [['all', 'All Sites'], ...D.sites.map(s => [s.id, s.name])].filter(([, n]) => !q || n.toLowerCase().includes(q));
  return `<div class="sh-h"><h2 class="t-major-medium">Choose site</h2></div><div class="sh-b"><label class="search fill">${ic('search', 24)}<input id="site-q" class="t-minor-regular" placeholder="Search" value="${esc(SITE.q)}" oninput="SITE.q=this.value;siteDraw()" aria-label="Search"></label><div class="ocards">${opts.map(([k, n]) => `<button class="ocard${SITE.cur === k ? ' on' : ''}" onclick="SITE.cur='${k}';siteDraw()"><span class="oc-i">${ic('place', 24)}</span><span class="t-minor-medium grow">${esc(n)}</span><span class="radio-ic">${ic('radioOff', 24)}${ic('radioOn', 24)}</span></button>`).join('') || empty('search', 'No match')}</div></div><div class="sh-f"><button class="btn pri block" onclick="S.site=SITE.cur;S.sel=null;storeSave();closeSheet();render()">Continue</button></div>`;
}
function siteDraw() { const f = document.activeElement && document.activeElement.id === 'site-q', p = f && document.activeElement.selectionStart; $('#sheet').innerHTML = '<div class="grab"></div>' + siteHtml(); typesetButtons(); if (f) { const el = $('#site-q'); el.focus(); el.setSelectionRange(p, p); } }
