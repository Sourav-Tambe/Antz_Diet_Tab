// prototypes/diet-tablet/model.js — the Diet module's logic (docs/system.md). No DOM: tools/model.test.mjs runs it in node.
// Diets are configured in the diet system; here: what applies (resolution by date), requests, and their workflow.

const LEVELS = ['species', 'site', 'section', 'enclosure', 'animal'];          // broad → specific
const LEVEL = { species: 'Species', site: 'Site', section: 'Section', enclosure: 'Enclosure', animal: 'Animal' };
const LEVEL_WIDE = { species: 'Species-wide', site: 'Site-wide', section: 'Section-wide', enclosure: 'Enclosure-wide', animal: 'Animal' };
const LEVEL_COLL = { site: 'sites', section: 'sections', enclosure: 'enclosures', animal: 'animals' };
const TYPE = { yearround: 'Year-round', seasonal: 'Seasonal', timebound: 'Time-bound' };
const TYPE_RANK = { timebound: 3, seasonal: 2, yearround: 1 };                   // I-2
const TERMINAL = ['applied', 'rejected', 'cancelled'];
/* the Antz request lifecycle (Sourav, 2026-09-30): submitted → approved → in_progress → Completed, where Completed is the
   kitchen's lane in sub-states: awaiting_kitchen → kitchen_progress (kitchen delayed = took action) → applied. No drafts. */
const KSUB = { awaiting_kitchen: 'awaiting', kitchen_progress: 'progress', applied: 'applied' };
const PRIORITY = { high: 'High', medium: 'Medium', low: 'Low' }, PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

let D = null, TODAY = '2026-06-12';
function useData(d, today) { D = d; if (today) TODAY = today; }
const by = (k, id) => D[k].find(x => x.id === id);
const plan = id => by('plans', id);
const user = id => by('users', id);

/* ---------- dates ---------- */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const fmtDay = s => s ? `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]}` : '';
const fmtDayY = s => s ? `${fmtDay(s)} ${s.slice(0, 4)}` : '';
const fmtMD = md => md ? `${+md.slice(3, 5)} ${MON[+md.slice(0, 2) - 1]}` : '';
const fmtTime = s => { if (!s || s.length < 16) return ''; let h = +s.slice(11, 13); const m = s.slice(14, 16), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${String(h).padStart(2, '0')}:${m} ${ap}`; };
const fmtAt = s => `${fmtDay(s)} · ${fmtTime(s)}`;
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5);
const nowStamp = () => { const d = new Date(); return `${TODAY}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const realMD = md => /^\d\d-\d\d$/.test(md || '') && +md.slice(3) >= 1 && +md.slice(3) <= MDAYS[+md.slice(0, 2) - 1];
function periodText(p) {
  if (!p || !p.type) return 'Type not set';
  if (p.type === 'yearround') return 'All year';
  if (p.type === 'seasonal') return p.from && p.to ? `${fmtMD(p.from)} – ${fmtMD(p.to)} · every year` : 'Months not set';
  return p.start && p.end ? `${fmtDayY(p.start)} – ${fmtDayY(p.end)}` : 'Dates not set';
}

/* ---------- places ---------- */
function animalPath(a) { const en = by('enclosures', a.enc), se = by('sections', en.section); return { species: a.sp, site: se.site, section: se.id, enclosure: en.id, animal: a.id }; }
function scopePath(sp, level, target) {
  if (level === 'animal') return animalPath(by('animals', target));
  const p = { species: sp };
  if (level === 'enclosure') { const en = by('enclosures', target), se = by('sections', en.section); Object.assign(p, { enclosure: en.id, section: se.id, site: se.site }); }
  if (level === 'section') { const se = by('sections', target); Object.assign(p, { section: se.id, site: se.site }); }
  if (level === 'site') p.site = target;
  return p;
}
function targetName(level, id) { if (!id) return ''; if (level === 'species') return by('species', id).name; const x = by(LEVEL_COLL[level], id); return x ? x.name : id; }
const scopeLabel = (level, id) => level === 'species' ? 'Species-wide' : id ? `${LEVEL[level]} · ${targetName(level, id)}` : `${LEVEL[level]} not chosen`;
function placePath(level, id) {
  if (!id) return '';
  if (level === 'enclosure') { const e = by('enclosures', id), s = by('sections', e.section); return `${s.name}, ${by('sites', s.site).name}`; }
  if (level === 'section') return by('sites', by('sections', id).site).name;
  return '';
}
const animalsIn = (sp, level, target) => D.animals.filter(a => a.sp === sp && (level === 'species' || (target && animalPath(a)[level] === target)));
const placesOf = (sp, level) => level === 'species' ? [sp] : [...new Set(D.animals.filter(a => a.sp === sp).map(a => animalPath(a)[level]))];

/* ---------- what applies (system.md §3): the most specific level in force wins; inside a level, time-bound > seasonal > year-round ---------- */
function inForce(a, date) {
  if (a.type === 'yearround') return true;
  if (a.type === 'timebound') return date >= a.start && date <= a.end;
  const md = date.slice(5);
  return a.from <= a.to ? md >= a.from && md <= a.to : md >= a.from || md <= a.to;
}
const currentAt = (sp, level, target) => D.assignments.filter(a => a.state === 'current' && a.sp === sp && a.level === level && a.target === target);
const pickWinner = list => list.slice().sort((x, y) => TYPE_RANK[y.type] - TYPE_RANK[x.type])[0];
function resolvePath(sp, path, date, start = 'animal') {
  const order = LEVELS.slice().reverse(); let winner = null; const chain = [];
  for (const lvl of order.slice(order.indexOf(start))) {
    if (!path[lvl]) continue;
    const asgs = currentAt(sp, lvl, path[lvl]), active = asgs.filter(a => inForce(a, date));
    const win = !winner && active.length ? pickWinner(active) : null;
    if (win) winner = { asg: win, level: lvl };
    chain.push({ level: lvl, target: path[lvl], asgs, active, win });
  }
  return { winner, chain };
}
const resolveAnimal = (a, date = TODAY) => resolvePath(a.sp, animalPath(a), date, 'animal');
const resolveScope = (sp, level, target, date = TODAY) => resolvePath(sp, scopePath(sp, level, target), date, level);
/* a diet's status: Active (applies) · In force but overridden · Inactive (out of its period) · Replaced (history) */
function roleOf(asg, res, date = TODAY) {
  if (asg.state === 'historical') return 'replaced';
  if (res.winner && res.winner.asg.id === asg.id) return 'applies';
  return inForce(asg, date) ? 'overridden' : 'notinforce';
}
function yearSegments(sp, path, start, year = TODAY.slice(0, 4)) {
  const segs = []; let d = `${year}-01-01`;
  while (d.startsWith(year)) {
    const r = resolvePath(sp, path, d, start), id = r.winner ? r.winner.asg.id : null, last = segs[segs.length - 1];
    if (last && last.id === id) last.to = d; else segs.push({ id, from: d, to: d, level: r.winner && r.winner.level });
    d = addDays(d, 1);
  }
  return segs;
}
function nextChange(sp, path, start, date = TODAY) {
  const w0 = resolvePath(sp, path, date, start).winner, cur = w0 ? w0.asg.id : null;
  for (let i = 1; i <= 366; i++) { const d = addDays(date, i), r = resolvePath(sp, path, d, start); if ((r.winner ? r.winner.asg.id : null) !== cur) return { on: d, winner: r.winner }; }
  return null;
}

/* ---------- periods and validation ---------- */
const DOY = md => Math.round((new Date(`2025-${md}T00:00:00Z`) - new Date('2025-01-01T00:00:00Z')) / 864e5);
function seasonDays(p) { const a = DOY(p.from), b = DOY(p.to), s = new Set(); if (a <= b) for (let i = a; i <= b; i++) s.add(i); else { for (let i = a; i < 365; i++) s.add(i); for (let i = 0; i <= b; i++) s.add(i); } return s; }
function overlapDays(p, q) {
  if (p.type === 'yearround' || q.type === 'yearround') return 0;
  if (p.type === 'seasonal' && q.type === 'seasonal') { const s = seasonDays(p); let n = 0; seasonDays(q).forEach(i => s.has(i) && n++); return n; }
  if (p.type === 'timebound' && q.type === 'timebound') { const a = p.start > q.start ? p.start : q.start, b = p.end < q.end ? p.end : q.end; return a <= b ? daysBetween(a, b) + 1 : 0; }
  const t = p.type === 'timebound' ? p : q, s = p.type === 'seasonal' ? p : q; let n = 0;
  for (let d = t.start; d <= t.end; d = addDays(d, 1)) if (inForce(s, d)) n++;
  return n;
}
function overlapText(p, q) {
  if (p.type === 'seasonal' && q.type === 'seasonal') {
    const other = seasonDays(q), start = DOY(p.from), n = seasonDays(p).size, runs = []; let cur = null;
    const md = i => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(5, 10);
    for (let k = 0; k < n; k++) { const i = (start + k) % 365; if (other.has(i)) { if (!cur) runs.push(cur = [i, i]); else cur[1] = i; } else cur = null; }
    return runs.map(([x, y]) => `${fmtMD(md(x))} – ${fmtMD(md(y))}`).join(' and ');
  }
  const t = p.type === 'timebound' ? p : q, o = p === t ? q : p;
  if (o.type === 'timebound') { const a = p.start > q.start ? p.start : q.start, b = p.end < q.end ? p.end : q.end; return `${fmtDay(a)} – ${fmtDay(b)}`; }
  let a = null, b = null; for (let d = t.start; d <= t.end; d = addDays(d, 1)) if (inForce(o, d)) { a = a || d; b = d; }
  return a ? `${fmtDay(a)} – ${fmtDay(b)}` : '';
}
/* → { errors, warnings, infos, yearround }. Overlap errors block configuration; the request form shows them as warnings */
function checkPeriod(spec, opts = {}) {
  const out = { errors: [], warnings: [], infos: [], yearround: null }, rep = opts.replaces || [];
  if (spec.type === 'timebound') {
    if (!spec.start || !spec.end) out.errors.push({ code: 'dates-missing', msg: 'Choose start and end.' });
    else if (spec.end < spec.start) out.errors.push({ code: 'end-before-start', msg: 'End is before start.' });
    else if (spec.end < TODAY) out.errors.push({ code: 'past', msg: 'This period has ended.' });
    else if (spec.start < TODAY) out.infos.push({ code: 'starts-past', msg: `Runs from acceptance to ${fmtDay(spec.end)}.` });
  }
  if (spec.type === 'seasonal') {
    if (!spec.from || !spec.to) out.errors.push({ code: 'dates-missing', msg: 'Choose the months.' });
    else if (!realMD(spec.from) || !realMD(spec.to)) out.errors.push({ code: 'bad-date', msg: 'That day doesn’t exist.' });
    else if (seasonDays(spec).size < 7) out.errors.push({ code: 'too-short', msg: 'At least a week.' });
  }
  if (out.errors.length || !spec.level || !spec.target) return out;
  const here = currentAt(spec.sp, spec.level, spec.target);
  if (spec.type === 'yearround') out.yearround = here.find(a => a.type === 'yearround') || null;
  for (const a of here) {
    if (a.type === 'yearround' || spec.type === 'yearround' || rep.includes(a.id)) continue;
    if (!overlapDays(spec, a)) continue;
    const range = overlapText(spec, a), name = plan(a.plan).name;
    if (a.type === spec.type) out.errors.push({ code: 'overlap', asg: a.id, msg: `Overlaps ${name}, ${range}.`, range });
    else if (spec.type === 'timebound') out.infos.push({ code: 'inside-season', asg: a.id, msg: `Replaces ${name} from ${range}.`, range });
    else out.infos.push({ code: 'contains-timebound', asg: a.id, msg: `${name} applies ${range}.`, range });
  }
  D.requests.filter(r => r.id !== opts.self && !TERMINAL.includes(r.state) && r.state !== 'new' && r.sp === spec.sp && r.level === spec.level && r.target === spec.target && r.type === spec.type)
    .forEach(r => out.warnings.push({ code: 'open-request', req: r.id, msg: `${r.id} is already open.` }));
  return out;
}

/* ---------- requests: real states, flags ---------- */
function display(r) {
  const req = user(r.by).name.split(' ')[0];
  switch (r.state) {
    case 'submitted': return { label: 'Awaiting approval', owner: 'nutritionist', next: 'Nutritionist to review', tone: 'info', glyph: 'clock' };
    case 'approved': return { label: 'Approved', owner: 'nutritionist', next: 'Nutritionist to start configuring', tone: 'info', glyph: 'check' };
    case 'in_progress': return { label: 'In Progress', owner: 'nutritionist', next: 'Nutritionist configuring', tone: 'info', glyph: 'edit' };
    case 'awaiting_kitchen': return { label: 'Completed', sub: 'Awaiting kitchen', owner: 'kitchen', next: 'Kitchen to accept', tone: 'info', glyph: 'clock' };
    case 'kitchen_progress': { const e = r.events.filter(x => x.kind === 'delayed').pop() || {}; return { label: 'Completed', sub: 'Kitchen in progress', owner: 'kitchen', next: 'Kitchen to apply', tone: 'info', glyph: 'clock', flag: e.until < TODAY ? { label: `Overdue since ${fmtDay(e.until)}`, tone: 'bad', glyph: 'timer' } : { label: `Delayed to ${fmtDay(e.until)}`, tone: 'warn', glyph: 'timer' } }; }
    case 'applied': return { label: 'Completed', sub: 'Applied', owner: null, next: effectNote(r), tone: 'ok', glyph: 'check' };
    case 'rejected': return { label: 'Rejected', owner: null, next: 'By the Nutritionist', tone: 'bad', glyph: 'x' };
    case 'cancelled': return { label: 'Cancelled', owner: null, next: `By ${req}`, tone: '', glyph: 'x' };
  }
}
function effectNote(r) {
  const c = r.config || r, since = (r.events.find(e => e.kind === 'applied') || {}).at || '';
  if (c.type === 'timebound') return c.end < TODAY ? `Ran ${fmtDay(c.start)} – ${fmtDay(c.end)}` : c.start > TODAY ? `From ${fmtDay(c.start)}` : `Until ${fmtDay(c.end)}`;
  if (c.type === 'seasonal') return `${fmtMD(c.from)} – ${fmtMD(c.to)} each year`;
  return `Since ${fmtDay(since.slice(0, 10))}`;
}
const bucket = r => KSUB[r.state] ? 'completed' : ['rejected', 'cancelled'].includes(r.state) ? 'closed' : { submitted: 'awaiting', approved: 'approved', in_progress: 'progress' }[r.state];
/* why Kitchen can't accept as it stands: ended, conflicts with what is current now, or built on a plan that is no longer current */
function acceptBlock(r) {
  const c = r.config; if (!c) return null;
  if (c.type === 'timebound' && c.end < TODAY) return { code: 'ended', msg: `Ended ${fmtDay(c.end)}. Return it.` };
  const chk = checkPeriod({ sp: r.sp, level: r.level, target: r.target, ...c, start: c.start && c.start < TODAY ? TODAY : c.start }, { replaces: c.replaces, self: r.id });
  if (chk.errors.length) return { code: 'conflict', msg: `${chk.errors[0].msg} Return it.` };
  if (c.type === 'yearround' && c.base !== undefined) {
    const now = (currentAt(r.sp, r.level, r.target).find(a => a.type === 'yearround') || {}).plan || null;
    if (c.base && now && now !== c.base) return { code: 'stale', msg: `${plan(now).name} is current now. Return it.` };
  }
  return null;
}
/* reject and cancel end at the In Progress door; the kitchen has accept and delay only, inside Completed (Sourav, 2026-09-30) */
function actionsFor(r, u) {
  const a = [];
  if (r.by === u.id && r.state === 'submitted') a.push('edit');
  if (r.by === u.id && ['submitted', 'approved'].includes(r.state)) a.push('cancel');
  if (u.role === 'nutritionist') {
    if (r.state === 'submitted') a.push('approve', 'reject');
    if (r.state === 'approved') a.push(movedUnack(r) ? 'confirmMove' : 'start', 'reject');
    if (r.state === 'in_progress') a.push(movedUnack(r) ? 'confirmMove' : 'configure');
  }
  if (u.role === 'kitchen' && ['awaiting_kitchen', 'kitchen_progress'].includes(r.state)) a.push(...(acceptBlock(r) ? [] : ['accept']), 'delay');   // no kitchen reject: the kitchen talks in the activity chat (Sourav)
  return a;
}
const needsYou = (r, u) => actionsFor(r, u).some(k => !['edit', 'cancel'].includes(k));
function moved(r) {
  if (r.level !== 'animal' || !r.ctx) return null;
  const a = by('animals', r.target); if (a.enc === r.ctx.enc) return null;
  return (a.moves || []).slice().reverse().find(m => m.from === r.ctx.enc) || { from: r.ctx.enc, to: a.enc };
}
const movedUnack = r => !!moved(r) && !r.moveAck;

const NEED_REASON = ['reject', 'delay', 'cancel'];
/* why the kitchen delays: chosen from a list (Sourav) */
const DELAY_REASONS = ['Ingredient not in stock', 'Supplier delay', 'Kitchen staff unavailable', 'Equipment not ready', 'Preparation time needed'];
function act(r, kind, uid, x = {}) {
  const u = user(uid), allowed = actionsFor(r, u);
  if (kind === 'submit' ? !(r.state === 'new' && r.by === uid) : !allowed.includes(kind)) throw new Error(`${u.title} can't ${kind} ${r.id} now`);
  if (NEED_REASON.includes(kind) && !(x.reason || '').trim()) throw new Error('A reason is required');
  if (kind === 'delay' && !(x.until > TODAY)) throw new Error('Choose a date after today');
  const at = nowStamp(), ev = (e, extra = {}) => r.events.push({ kind: e, by: uid, at, ...extra });
  switch (kind) {
    case 'submit': ev('submitted'); r.state = 'submitted';
      if (u.role === 'nutritionist') { ev('approved'); r.state = 'approved'; }
      break;
    case 'approve': ev('approved'); r.state = 'approved'; break;
    case 'reject': ev('rejected', { reason: x.reason }); r.state = 'rejected'; break;
    case 'cancel': ev('cancelled', { reason: x.reason }); r.state = 'cancelled'; break;
    case 'confirmMove': r.moveAck = { by: uid, at }; ev('move_confirmed'); break;
    case 'start': ev('started'); r.state = 'in_progress'; break;
    case 'configure': {
      /* the diet is configured and linked in the diet system; here only the period and the note to kitchen are recorded (Sourav, 2026-09-30) */
      const c = x.config || {};
      const chk = checkPeriod({ sp: r.sp, level: r.level, target: r.target, ...c }, { replaces: c.replaces, self: r.id });
      if (chk.errors.length) throw new Error(chk.errors[0].msg);
      r.config = c; ev('configured', c.note ? { note: c.note } : {}); r.state = 'awaiting_kitchen'; break;
    }
    case 'delay': ev('delayed', { reason: x.reason, until: x.until }); r.state = 'kitchen_progress'; break;
    case 'accept': { const b = acceptBlock(r); if (b) throw new Error(b.msg); } ev('accepted'); applyRequest(r, at); r.events.push({ kind: 'applied', by: null, at }); r.state = 'applied'; break;
    default: throw new Error('Unknown action ' + kind);
  }
  return r;
}
/* acceptance writes the assignment; what it replaces becomes history (nothing is deleted).
   A request with no diet reference (configured after 2026-09-30) changes nothing here: assignments belong to the diet system. */
function applyRequest(r, at) {
  const c = r.config, here = currentAt(r.sp, r.level, r.target);
  if (!c.plan) { r.applied = { asg: null, replaced: [] }; return null; }
  const replaced = here.filter(a => (c.type === 'yearround' && a.type === 'yearround') || (c.replaces || []).includes(a.id));
  replaced.forEach(a => { a.state = 'historical'; a.until = at; a.by = r.id; });
  const n = { id: 'AS-' + (D.assignments.length + 1), sp: r.sp, level: r.level, target: r.target, plan: c.plan, type: c.type, state: 'current', since: at, req: r.id };
  if (c.type === 'seasonal') Object.assign(n, { from: c.from, to: c.to });
  if (c.type === 'timebound') Object.assign(n, { start: c.start, end: c.end });
  D.assignments.push(n); r.applied = { asg: n.id, replaced: replaced.map(a => a.id) };
  return n;
}
/* runs fn as if r had been accepted, then puts everything back */
function withApplied(r, fn) {
  const keep = D.assignments, kept = r.applied;
  D.assignments = keep.map(a => ({ ...a }));
  try { if (r.config) applyRequest(r, nowStamp()); return fn(); } finally { D.assignments = keep; r.applied = kept; if (kept === undefined) delete r.applied; }
}
/* per animal: from which day (within a year) the request would change what it receives */
function impactOf(r) {
  const days = Array.from({ length: 366 }, (_, i) => addDays(TODAY, i));
  const track = a => days.map(d => { const w = resolveAnimal(a, d).winner; return w ? w.asg.plan : null; });
  const animals = animalsIn(r.sp, r.level, r.target), before = animals.map(track), after = withApplied(r, () => animals.map(track));
  return animals.map((a, k) => { const i = days.findIndex((d, j) => before[k][j] !== after[k][j]); return { a, now: before[k][0], from: i < 0 ? null : days[i], to: i < 0 ? null : after[k][i], was: i < 0 ? null : before[k][i] }; });
}
const pendingFor = (sp, path) => D.requests.filter(r => r.sp === sp && !TERMINAL.includes(r.state) && r.state !== 'new' && path[r.level] === r.target);
function newRequestId() { const n = Math.max(D.seq || 0, ...D.requests.map(r => +r.id.slice(3))) + 1; D.seq = n; return 'DR-' + String(n).padStart(5, '0'); }

/* ---------- plans (read from the diet system) ---------- */
const asPlan = x => x && typeof x === 'object' ? x : x ? plan(x) : null;
const entryName = i => i.name || (i.recipe ? by('recipes', i.recipe).name : i.mix ? by('mixes', i.mix).name : i.choice ? i.choice.join(' or ') : '');
function planDiff(fromId, toId) {
  const A = asPlan(fromId) || { meals: [] }, B = asPlan(toId) || { meals: [] }, out = [];
  for (const name of [...new Set([...A.meals, ...B.meals].map(m => m.name))]) {
    const ma = A.meals.find(m => m.name === name) || { items: [] }, mb = B.meals.find(m => m.name === name) || { items: [] }, rows = [];
    for (const i of mb.items) { const o = ma.items.find(x => entryName(x) === entryName(i)); rows.push(!o ? { k: 'added', i } : o.qty !== i.qty || o.prep !== i.prep ? { k: 'changed', i, o } : { k: 'same', i }); }
    for (const o of ma.items) if (!mb.items.find(x => entryName(x) === entryName(o))) rows.push({ k: 'removed', i: o });
    out.push({ name, time: mb.time || ma.time, gone: !mb.items.length && !!ma.items.length, added: !ma.items.length, rows });
  }
  return out;
}
const diffCount = diff => diff.reduce((n, m) => n + m.rows.filter(r => r.k !== 'same').length, 0);
function newIngredients(fromId, toId) {
  const had = new Set(((asPlan(fromId) || { meals: [] }).meals).flatMap(m => m.items.map(entryName)));
  return [...new Set(asPlan(toId).meals.flatMap(m => m.items.map(entryName)))].filter(n => !had.has(n));
}
const usesOf = pid => D.assignments.filter(a => a.plan === pid && a.state === 'current');

if (typeof module !== 'undefined') module.exports = { useData };
