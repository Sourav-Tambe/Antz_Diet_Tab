/* "Requests (N)" with the sort toggle: priority first, or most recent */
const listBar = n => `<div class="list-bar"><h2 class="t-minor-medium">Requests (${n})</h2><button class="chip t-body-medium" onclick="S.sort=S.sort==='recent'?'priority':'recent';render()">${ic('filter', 18)}${S.sort === 'recent' ? 'Recent' : 'Priority'}</button></div>`;
// prototypes/diet-tablet/views-requests.js — Requests list + detail, Kitchen, History. Labels, names, states, actions only.

/* ---------- actions ---------- */
const DONE = { approve: 'Approved', reject: 'Rejected', cancel: 'Cancelled', delay: 'Delayed', accept: 'Applied', start: 'Started', confirmMove: 'Confirmed' };
function doAct(id, kind, x = {}) {
  const r = by('requests', id);
  try { act(r, kind, S.user, x); } catch (e) { toast(e.message); return false; }
  storeSave(); closeSheet(); toast(`${DONE[kind] || 'Done'} · ${id}`); render();
  return true;
}
const RS = { reject: ['Reject', 'Reject'], delay: ['Delay', 'Delay'], cancel: ['Cancel request', 'Cancel request'], close: ['Close request', 'Close request'] };
function reasonSheet(id, kind) {
  const [title, verb] = RS[kind], date = kind === 'delay'
    ? `<div class="field"><label class="t-body-title" for="rs-until">Review by</label><input id="rs-until" type="date" class="inp t-minor-regular" min="${addDays(TODAY, 1)}" value="${addDays(TODAY, 7)}" oninput="rsCheck()" onchange="rsCheck()"></div>` : '';
  const run = `doAct('${id}','${kind}',{reason:document.getElementById('rs-reason').value.trim()${kind === 'delay' ? `,until:document.getElementById('rs-until').value` : ''}})`;
  openSheet(`<div class="sh-h"><h2 class="t-medium-medium">${title}</h2></div><div class="sh-b fields" style="padding-top:var(--sp-16)"><div class="field"><label class="t-body-title" for="rs-reason">Reason</label><textarea id="rs-reason" class="inp t-minor-regular" autofocus oninput="rsCheck()"></textarea></div>${date}</div><div class="sh-f"><button class="btn" onclick="closeSheet()">Back</button><button id="rs-go" class="btn act" disabled onclick="${run}">${verb}</button></div>`);
}
function rsCheck() {
  const t = document.getElementById('rs-reason'), d = document.getElementById('rs-until'), go = document.getElementById('rs-go');
  if (go) go.disabled = !(t && t.value.trim().length >= 3 && (!d || d.value > TODAY));
}
/* ---------- list: the lifecycle stages as tabs, the same for requester and Nutritionist; Completed holds the kitchen's sub-tabs.
   The kitchen sees a request only once it is Completed (its own tabs live on the Kitchen screen). Rejected and cancelled show in All. ---------- */
function reqTabs() {
  return [['awaiting', 'Awaiting approval'], ['approved', 'Approved'], ['progress', 'In Progress'], ['completed', 'Completed'], ['all', 'All']];
}
const KSUB_TABS = [['awaiting', 'Awaiting kitchen'], ['progress', 'Kitchen in progress'], ['applied', 'Applied']];
const kitchenSees = r => !!KSUB[r.state];
function reqFilter(k, sub) {
  const u = me(), vis = D.requests.filter(r => r.state !== 'new' && atSite(r) && (u.role !== 'kitchen' || kitchenSees(r)));
  const f = {
    awaiting: r => bucket(r) === 'awaiting', approved: r => bucket(r) === 'approved', progress: r => bucket(r) === 'progress',
    completed: r => bucket(r) === 'completed' && (!sub || KSUB[r.state] === sub),
  }[k] || (() => true);
  const pr = r => S.sort === 'recent' || k === 'all' ? 0 : TERMINAL.includes(r.state) ? 3 : PRIORITY_RANK[r.priority || 'medium'];
  return vis.filter(f).sort((a, b) => pr(a) - pr(b) || (lastAt(a) < lastAt(b) ? 1 : lastAt(a) > lastAt(b) ? -1 : 0));
}
function vRequests() {
  const tabs = reqTabs();
  if (!S.tab || !tabs.some(([k]) => k === S.tab)) S.tab = tabs[0][0];
  if (!KSUB_TABS.some(([k]) => k === S.ksub)) S.ksub = 'awaiting';
  const sub = S.tab === 'completed' ? S.ksub : null, list = reqFilter(S.tab, sub);
  const subNav = S.tab === 'completed' ? tabsNav(KSUB_TABS, S.ksub, "S.ksub='$K';S.sel=null;render()", k => reqFilter('completed', k).length) : '';
  const nav = strip(countTabs(tabs, S.tab, "S.tab='$K';S.sel=null;render()", k => reqFilter(k, null).length)) + subNav + listBar(list.length);
  const head = { title: 'Requests', right: siteBtn() }, f = canRequest() ? fab() : '';
  if (isWeb()) {
    const cur = list.find(r => r.id === S.sel) || list[0];
    if (!cur) return { tab: 'requests', head, html: nav + `<section class="card">${empty('requests', 'No requests')}</section>`, fab: f, wide: true };
    S.sel = cur.id;
    const rows = list.map(r => reqRow(r, { sel: r.id === cur.id, href: `javascript:S.sel='${r.id}';render()` })).join('');
    return { tab: 'requests', head, wide: true, fab: f, foot: requestFoot(cur),
      html: nav + `<div class="split"><div class="rqcards list">${rows}</div><div class="col" style="gap:var(--sp-16)">${requestBody(cur)}</div></div>` };
  }
  return { tab: 'requests', head, fab: f, html: nav + `<div class="rqcards list">${list.length ? list.map(r => reqRow(r)).join('') : `<section class="card">${empty('requests', 'No requests')}</section>`}</div>` };
}

/* ---------- detail ---------- */
/* ---------- request detail, after the Antz Help Desk detail: hero · icon rows · activity · current status ---------- */
const STATE_AFTER = { submitted: 'Awaiting approval', approved: 'Approved', started: 'In Progress', configured: 'Completed · Awaiting kitchen', delayed: 'Completed · Kitchen in progress', accepted: 'Completed · Applied', rejected: 'Rejected', cancelled: 'Cancelled' };
const personChip = (uid, dark = false) => { const u = user(uid); return `<span class="pchip${dark ? ' dark' : ''}"><span class="pav t-body-title">${initials(u.name)}</span><span class="t-body-medium">${esc(u.name)}</span><button class="rbtn" aria-label="Call ${esc(u.name)}" onclick="event.preventDefault();toast('Calling ${esc(first(u.name))}')">${ic('call', 20)}</button><button class="rbtn" aria-label="Message ${esc(u.name)}" onclick="event.preventDefault();toast('Message to ${esc(first(u.name))}')">${ic('chat', 20)}</button></span>`; };
function dhero(r) {
  const p = r.priority || 'medium', sub = r.events[0];
  return `<section class="dhero"><div class="dh-row"><span class="dh-tile t-body-title">${initials(by('species', r.sp).name)}</span><span class="dh-cat t-medium-medium">${esc(by('species', r.sp).name)}</span><span class="ribbon ${p} t-medium-title" aria-label="${PRIORITY[p]} priority">${RIBBON[p]}</span></div><p class="dh-when t-body-regular">${fmtDayY(sub.at.slice(0, 10))} • ${fmtTime(sub.at)}</p><div class="dh-who">${personChip(r.by, true)}</div></section>`;
}
const drow = (icon, label, body, link = '') => `<div class="drow"><span class="di">${ic(icon, 22)}</span><div class="grow"><div class="dl"><span class="t-minor-medium head">${label}</span>${link}</div>${body}</div></div>`;
const dlink = (label, js) => `<button class="dlink t-minor-medium" onclick="${js}">${label}</button>`;
/* small person line: avatar · name · role (the Antz "Requested by / Approved by" rows) */
const personRow = (uid, { check = false } = {}) => { const u = user(uid); return `<div class="pline"><span class="pav sm t-subtext-title">${initials(u.name)}</span><span class="col grow"><span class="t-body-medium head">${esc(u.name)}${uid === S.user ? ' (You)' : ''}</span><span class="t-subtext-regular muted">${esc(u.title)}</span></span>${check ? `<span class="pok">${ic('check', 20)}</span>` : ''}</div>`; };
function requestBody(r) {
  const mv = moved(r);
  const appr = r.events.find(e => e.kind === 'approved');
  /* the entity's active diet today (read from the diet system): the request changes it, or asks for something new beside it */
  const w = resolveScope(r.sp, r.level, r.target).winner;
  const askTag = `<span class="tags mt8"><span class="tag line t-body-medium">${ic(r.mode === 'new' ? 'plus' : 'edit', 16)}${r.mode === 'new' ? 'New diet requested' : 'Change requested'}</span></span>`;
  const rows = [
    drow('place', 'Applies to', `<div class="ents one dents">${targetCard(r, { link: false })}</div>`, dlink('View', `appliesSheet('${r.id}')`)),
    drow('diets', 'Current diet', w ? `<p class="dv t-minor-regular">${esc(plan(w.asg.plan).name)}</p><p class="ds t-body-regular">${srcText(w, r.level)} · ${TYPE[w.asg.type]}</p>${askTag}` : `<p class="dv t-minor-regular">No diet</p>${askTag}`, w ? dlink('View', `dietSheet('${w.asg.id}')`) : ''),
    drow('requests', 'Request', `<p class="dv t-minor-title">${esc(r.title)}</p><p class="ds t-minor-regular">${esc(r.text)}</p>`),
    drow(r.type || 'yearround', 'Diet type', `<p class="dv t-minor-regular">${r.type ? TYPE[r.type] : 'Not set'}${r.type && r.type !== 'yearround' ? ` · ${periodText(r).replace(' · every year', '')}` : ''}</p>`),
    r.config && r.config.note ? drow('note', 'Note to kitchen', `<p class="dv t-minor-regular">${esc(r.config.note)}</p>`) : '',
    drow('user', 'Requested by', personRow(r.by)),
    appr && appr.by && appr.by !== r.by ? drow('check', 'Approved by', personRow(appr.by, { check: true })) : '',
    mv ? drow('place', 'Animal moved', `<p class="dv t-minor-regular">${targetName('enclosure', mv.from)} → ${targetName('enclosure', mv.to)}</p>`, r.moveAck ? '' : `<span class="dflag warn t-body-medium">${ic('alert', 18)}Confirm</span>`) : '',
  ].join('');
  return dhero(r) + `<section class="drows">${rows}</section>` + attachBlock(r) + activityBlock(r);
}
/* ---------- attachments: everything added on the request, as file cards (the Antz Requests page) ---------- */
function fileCard(f, at) {
  const img = f.kind === 'Image', cls = img ? 'img' : /\.pdf$/i.test(f.name) ? 'pdf' : 'doc';
  return `<button class="fcx" onclick="toast('Opens ${esc(f.name)}')"><span class="fcx-th ${cls}">${ic(img ? 'image' : 'doc', 40)}</span><span class="fcx-n t-subtext-regular">${esc(f.name)}</span><span class="fcx-m t-small"><span>${fmtTime(at)} • ${fmtDayY(at.slice(0, 10))}</span><span>${esc(f.size || '')}</span></span></button>`;
}
function attachBlock(r) {
  if (!(r.files || []).length) return '';
  const at = r.events[0].at;
  return `<section class="dsec"><div class="dact-h"><span class="di">${ic('attach', 24)}</span><h2 class="t-medium-medium head grow">${plural(r.files.length, 'Attachment')}</h2></div><div class="fgrid">${r.files.map(f => fileCard(f, at)).join('')}</div></section>`;
}
/* ---------- activity: comment box, filter, then who did what. Variations (the Antz Requests page):
   comment = notes-yellow box · status update = tinted box with "from → to", a reason, and the configured period/note · files under the box */
const AF = { all: 'Show All', comments: 'Comments', updates: 'Updates' };
const EV_TONE = k => ['rejected', 'cancelled', 'closed', 'kitchen_rejected'].includes(k) ? 'bad' : ['approved', 'accepted', 'submitted'].includes(k) ? 'ok' : 'plain';
const akv = (label, value) => value ? `<div class="akv"><p class="t-subtext-regular muted">${label}</p><p class="t-body-regular">${esc(value)}</p></div>` : '';
function activityBlock(r) {
  const f = AF[S.af] ? S.af : 'all', order = r.events.filter(e => e.kind !== 'applied');
  let evs = order.slice().reverse();
  if (f === 'comments') evs = evs.filter(e => e.kind === 'comment');
  if (f === 'updates') evs = evs.filter(e => e.kind !== 'comment');
  let prev = {}; order.forEach((e, i) => { prev[i] = i ? (STATE_AFTER[order.slice(0, i).reverse().find(x => STATE_AFTER[x.kind])?.kind] || 'New request') : 'New request'; });
  const box = e => {
    const i = order.indexOf(e), to = STATE_AFTER[e.kind];
    if (e.kind === 'comment') return `<div class="abox note t-body-regular">${esc(e.note)}</div>`;
    if (!to) return `<div class="abox plain t-body-regular">${EV[e.kind] || e.kind}</div>`;
    const cfg = ['configured', 'reconfigured'].includes(e.kind);
    return `<div class="abox st ${EV_TONE(e.kind)}"><p class="t-body-regular">Status Update</p><div class="atrans t-subtext-title"><span class="muted">${prev[i]}</span>${ic('chev', 14)}<span class="to">${to}</span></div>${akv('Reason', e.reason)}${e.kind === 'delayed' && e.until ? akv('Review by', fmtDayY(e.until)) : ''}${cfg && r.config ? akv('Type and period', `${TYPE[r.config.type]}${r.config.type !== 'yearround' ? ` · ${periodText(r.config).replace(' · every year', '')}` : ''}`) : ''}${cfg ? akv('Note to kitchen', e.note) : !e.reason ? akv('Note', e.note) : ''}</div>`;
  };
  const item = e => { const u = e.by && user(e.by);
    return `<div class="aitem"><div class="ahead">${u ? `<span class="pav t-body-title">${initials(u.name)}</span><span class="t-minor-medium head grow">${esc(u.name)}</span>` : '<span class="grow"></span>'}<span class="t-small muted">${fmtDayY(e.at.slice(0, 10))} • ${fmtTime(e.at)}</span></div>${box(e)}${(e.files || []).length ? `<div class="fgrid mt8">${e.files.map(x => fileCard(x, e.at)).join('')}</div>` : ''}</div>`; };
  const filter = `<button class="afilter t-body-title" onclick="S.af='${f === 'all' ? 'comments' : f === 'comments' ? 'updates' : 'all'}';render()">${AF[f]}${ic('filter', 20)}</button>`;
  return `<section class="dact"><div class="dact-h"><span class="di">${ic('chat', 24)}</span><h2 class="t-medium-medium head grow">Activity</h2>${filter}</div><div class="acompose"><button class="rbtn big" aria-label="Attach" onclick="toast('Attach a file')">${ic('attach', 22)}</button><label class="abox-in"><span class="pav t-body-title">${initials(me().name)}</span><input id="cmt" class="t-minor-regular" placeholder="Add your comment" onkeydown="if(event.key==='Enter')addComment('${r.id}')"><button class="rbtn" aria-label="Send" onclick="addComment('${r.id}')">${ic('send', 20)}</button></label></div>${evs.map(item).join('') || `<p class="t-body-regular muted" style="padding:var(--sp-16) 0">Nothing here</p>`}</section>`;
}
function addComment(id) { const el = $('#cmt'), t = el && el.value.trim(); if (!t) return; by('requests', id).events.push({ kind: 'comment', by: S.user, at: nowStamp(), note: t }); el.value = ''; S.af = 'all'; storeSave(); render(); }
function requestFoot(r) {
  if (!r) return '';
  const a = actionsFor(r, me()), id = r.id, B = {
    approve: `<button class="btn act" onclick="doAct('${id}','approve')">Approve</button>`,
    reject: `<button class="btn bad" onclick="reasonSheet('${id}','reject')">Reject</button>`,
    start: `<button class="btn act" onclick="doAct('${id}','start')">Start configuring</button>`,
    configure: `<a class="btn act" href="#/req/${id}/configured">Mark configured</a>`,
    confirmMove: `<button class="btn act" onclick="doAct('${id}','confirmMove')">Still applies</button>`,
    accept: `<button class="btn pri" onclick="doAct('${id}','accept')">Accept</button>`,
    delay: `<button class="btn" onclick="delaySheet('${id}')">Delay</button>`,
    cancel: `<button class="btn bad" onclick="reasonSheet('${id}','cancel')">Cancel</button>`,
    edit: `<a class="btn act" href="#/new?edit=${id}">Edit</a>`,
  };
  const mainK = ['accept', 'approve', 'start', 'configure', 'confirmMove', 'edit'].find(k => a.includes(k));
  const secondary = ['cancel', 'reject', 'delay'].filter(k => k !== mainK).filter(k => a.includes(k)).map(k => B[k]);
  const d = display(r), at = lastAt(r);
  let body;
  if (TERMINAL.includes(r.state)) {
    const ev = r.events.filter(e => STATE_AFTER[e.kind] && e.by).pop(), u = ev && user(ev.by);
    const tone = r.state === 'applied' ? 'ok' : r.state === 'closed' ? 'plain' : 'bad';
    body = `<div class="endcard ${tone}"><p class="t-minor-title ec-t">Request ${d.label}</p>${u ? `<div class="pline"><span class="pav t-subtext-title">${initials(u.name)}</span><span class="col grow"><span class="t-body-medium head">${esc(u.name)}</span><span class="t-subtext-regular">${esc(u.title)}</span><span class="t-subtext-regular">${fmtDayY(ev.at.slice(0, 10))} • ${fmtTime(ev.at)}</span></span></div>` : ''}${r.state === 'applied' ? `<p class="t-body-regular">${effectNote(r)}</p>` : ''}</div>`;
  } else {
    const blk = ['awaiting_kitchen', 'delayed'].includes(r.state) && acceptBlock(r);
    body = `<p class="t-major-medium cs-v">${stageLabel(d)}${d.flag ? ` <span class="dflag ${d.flag.tone} t-minor-medium">${d.flag.label}</span>` : ''}</p><p class="t-body-regular muted">${ownerLine(r)}</p>${blk ? `<p class="dflag bad t-body-medium">${ic('alert', 18)}${esc(blk.msg)}</p>` : ''}`;
  }
  const panel = `<div class="cstatus"><p class="t-body-regular muted">Current Status • ${agoText(at)}</p>${body}</div>`;
  return panel + (mainK || secondary.length ? footBar({ secondary, main: mainK ? B[mainK] : '' }) : '');
}
/* "2m ago": against the prototype's TODAY and the real clock */
function agoText(at) {
  const days = daysBetween(at.slice(0, 10), TODAY);
  if (days > 1) return `${days}d ago`;
  if (days === 1) return 'Yesterday';
  const n = new Date(), mins = n.getHours() * 60 + n.getMinutes() - (+at.slice(11, 13) * 60 + +at.slice(14, 16));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ago` : mins > 1 ? `${mins}m ago` : 'Just now';
}
function vRequest(id) {
  const r = by('requests', id);
  if (!r || r.state === 'new' || (me().role === 'kitchen' && !kitchenSees(r))) throw new Error('Request not found');   // the kitchen sees a request only once it is Completed
  const head = { back: me().role === 'kitchen' ? '#/kitchen' : '#/requests', title: r.id, dark: true, center: true };
  return { head, wide: isWeb(), html: requestBody(r), foot: requestFoot(r), flush: true };
}

/* ---------- kitchen: the Completed sub-states are its tabs; All in chronology ---------- */
function kList(k) {
  const st = { accept: 'awaiting_kitchen', progress: 'kitchen_progress', applied: 'applied' }[k];
  const pr = r => S.sort === 'recent' || !st || st === 'applied' ? 0 : PRIORITY_RANK[r.priority || 'medium'];
  return D.requests.filter(r => (st ? r.state === st : kitchenSees(r)) && atSite(r)).sort((a, b) => pr(a) - pr(b) || (lastAt(a) < lastAt(b) ? 1 : -1));
}
function vKitchen() {
  const k = S.kt || 'accept', list = kList(k), head = { title: 'Kitchen', right: siteBtn() };
  const nav = strip(countTabs([['accept', 'To accept'], ['progress', 'In progress'], ['applied', 'Applied'], ['all', 'All']], k, "S.kt='$K';S.sel=null;render()", x => kList(x).length)) + listBar(list.length);
  if (isWeb()) {
    const cur = list.find(r => r.id === S.sel) || list[0];
    if (!cur) return { tab: 'kitchen', head, wide: true, html: nav + `<section class="card">${empty('kitchen', 'Nothing here')}</section>` };
    S.sel = cur.id;
    return { tab: 'kitchen', head, wide: true, foot: requestFoot(cur),
      html: nav + `<div class="split"><div class="rqcards list">${list.map(r => reqRow(r, { sel: r.id === cur.id, href: `javascript:S.sel='${r.id}';render()` })).join('')}</div><div class="col" style="gap:var(--sp-16)">${requestBody(cur)}</div></div>` };
  }
  return { tab: 'kitchen', head, html: nav + `<div class="rqcards list">${list.length ? list.map(r => reqRow(r)).join('') : `<section class="card">${empty('kitchen', 'Nothing here')}</section>`}</div>` };
}

/* the kitchen delays until a date, for a reason from the list; anything more goes in the activity chat */
function delaySheet(id) { DL = { id, until: addDays(TODAY, 7), reason: null }; openSheet(delayHtml()); }
let DL = {};
function delayHtml() {
  return `<div class="sh-h"><h2 class="t-major-medium">Delay</h2></div><div class="sh-b fields" style="padding-top:var(--sp-20)"><div class="ffield"><span class="fl t-body-regular">Delay until</span><input type="date" class="ainp t-minor-regular" id="dl-until" min="${addDays(TODAY, 1)}" value="${DL.until}" onchange="DL.until=this.value;dlDraw()"></div><p class="flab t-minor-medium">Reason</p><div class="ocards">${DELAY_REASONS.map(t => `<button class="ocard${DL.reason === t ? ' on' : ''}" onclick="DL.reason='${t}';dlDraw()"><span class="t-minor-medium grow">${t}</span><span class="radio-ic">${ic('radioOff', 24)}${ic('radioOn', 24)}</span></button>`).join('')}</div></div><div class="sh-f"><button class="btn pri block"${DL.reason && DL.until > TODAY ? '' : ' disabled'} onclick="doAct(DL.id,'delay',{reason:DL.reason,until:DL.until})">Delay</button></div>`;
}
function dlDraw() { $('#sheet').innerHTML = '<div class="grab"></div>' + delayHtml(); typesetButtons(); }

/* Applies to · View: a bottom sheet with the entity itself — species, housing, enclosure or animal — and its facts */
function appliesSheet(id) {
  const r = by('requests', id), sp = by('species', r.sp);
  const path = r.level === 'animal' ? animalPath(by('animals', r.target)) : scopePath(r.sp, r.level, r.target);
  const loc = ['enclosure', 'section', 'site'].filter(l => path[l] && l !== r.level && !(r.level === 'animal' && l === 'enclosure')).map(l => targetName(l, path[l])).join(', ');
  const kvs = r.level === 'species'
    ? [sp.sci ? ['Scientific name', esc(sp.sci)] : null]
    : [['Species', `${esc(sp.name)}${sp.sci ? `<span class="muted t-body-regular">${esc(sp.sci)}</span>` : ''}`], loc ? ['Location', esc(loc)] : null];
  const kvRows = kvs.filter(Boolean).map(([k, v]) => `<div class="k t-body-regular">${k}</div><div class="v t-minor-regular">${v}</div>`).join('');
  openSheet(`<div class="sh-h"><h2 class="t-major-medium">Applies to</h2></div><div class="sh-b sheet-stack"><div class="ents one" style="padding:0">${targetCard(r, { link: false })}</div>${kvRows ? `<section class="card" style="padding:0"><div class="kv">${kvRows}</div></section>` : ''}</div>`);
}
