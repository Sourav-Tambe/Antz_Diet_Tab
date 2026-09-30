// prototypes/diet-tablet/views-tasks.js — task pages: New request (and edit draft), Mark configured.
// Task pages: header with back, no nav, choices in sheets, one main button in the foot. Labels and actions only.

const TYPE_OPTS = [['yearround', 'Year-round', '', 'yearround'], ['seasonal', 'Seasonal', '', 'seasonal'], ['timebound', 'Time-bound', '', 'timebound']];

const LEVEL_OPTS = LEVELS.map(l => [l, LEVEL[l], '', l === 'animal' ? 'user' : 'place']);

/* ---------- period pieces ---------- */
function splitMD(o) { ['from', 'to'].forEach(k => { const v = o[k]; o[k + 'M'] = v ? v.slice(0, 2) : ''; o[k + 'D'] = v ? String(+v.slice(3, 5)) : ''; }); return o; }
function setMD(obj, key, part, v) {
  const o = S[obj]; o[key + part] = v;
  const m = o[key + 'M'], d = o[key + 'D'];
  if (m && d) { const dd = Math.min(+d, MDAYS[+m - 1]); o[key + 'D'] = String(dd); o[key] = `${m}-${String(dd).padStart(2, '0')}`; }
  else o[key] = null;
  render();
}
function mdPicker(obj, key, label) {
  const o = S[obj], m = o[key + 'M'] || '', d = o[key + 'D'] || '', n = m ? MDAYS[+m - 1] : 31;
  const months = `<option value="">Month</option>` + MON.map((x, i) => { const v = String(i + 1).padStart(2, '0'); return `<option value="${v}"${v === m ? ' selected' : ''}>${x}</option>`; }).join('');
  const days = `<option value="">Day</option>` + Array.from({ length: n }, (_, i) => String(i + 1)).map(v => `<option value="${v}"${v === d ? ' selected' : ''}>${v}</option>`).join('');
  return `<div class="ffield"><span class="fl t-body-regular">${label}</span><div class="dates"><select class="ainp t-minor-regular" id="${obj}-${key}-m" aria-label="${label} month" onchange="setMD('${obj}','${key}','M',this.value)">${months}</select><select class="ainp t-minor-regular" id="${obj}-${key}-d" aria-label="${label} day" onchange="setMD('${obj}','${key}','D',this.value)">${days}</select></div></div>`;
}
const dateField = (obj, key, label) => `<div class="ffield"><span class="fl t-body-regular">${label}</span><input type="date" class="ainp t-minor-regular" id="${obj}-${key}" value="${esc(S[obj][key] || '')}" onchange="S.${obj}.${key}=this.value;render()"></div>`;
const issue = (cls, msg) => `<div class="issue ${cls}">${ic(cls === 'info' ? 'info' : 'alert', 20)}<p class="t-body-regular">${msg}</p></div>`;
const periodSpec = o => ({ sp: o.sp, level: o.level, target: o.target, type: o.type, from: o.from, to: o.to, start: o.start, end: o.end });

function periodBlock(obj, { self, strict = false, skipType = false } = {}) {
  const o = S[obj];
  let h = fsel('Diet type', o.type ? TYPE[o.type] : '', `optionCards('Diet type', TYPE_OPTS, S.${obj}.type, &quot;S.${obj}.type='$K'&quot;)`);
  if (o.type === 'seasonal') h += `<div class="dates">${mdPicker(obj, 'from', 'From')}${mdPicker(obj, 'to', 'To')}</div>`;
  if (o.type === 'timebound') h += `<div class="dates">${dateField(obj, 'start', 'Start')}${dateField(obj, 'end', 'End')}</div>`;
  if (!o.target || !o.type) return h;
  const spec = periodSpec(o);
  /* assignments of the same type that this period still overlaps */
  const base = checkPeriod(spec, { self });
  const ov = base.errors.some(e => e.code !== 'overlap') ? [] : currentAt(o.sp, o.level, o.target).filter(a => a.type === o.type && a.type !== 'yearround' && overlapDays(spec, a));
  o.replaces = (o.replaces || []).filter(id => ov.some(a => a.id === id));
  const chk = checkPeriod(spec, { replaces: o.replaces, self });
  if (o.type === 'yearround' && chk.yearround && obj === 'draft') {
    const opt = (k, l) => `<button class="opt${o.intent === k ? ' on' : ''}" onclick="S.draft.intent='${k}';render()"><span class="radio-ic">${ic('radioOff', 24)}${ic('radioOn', 24)}</span><span class="ot t-body-title">${l}</span></button>`;
    h += `<div class="field"><label class="t-body-title">${esc(plan(chk.yearround.plan).name)}</label><div class="opts c2">${opt('adjust', 'Adjust')}${opt('replace', 'Replace')}</div></div>`;
  }
  chk.errors.forEach(e => { h += issue(e.code === 'overlap' && !strict ? 'warning' : 'error', esc(e.msg)); });
  chk.warnings.forEach(w => { h += issue('warning', w.req ? esc(w.msg).replace(w.req, `<a class="lnk" href="#/req/${w.req}">${w.req}</a>`) : esc(w.msg)); });
  chk.infos.forEach(i => { h += issue('info', esc(i.msg)); });
  if (strict && ov.length) h += ov.map(a => `<label class="check t-body-regular"><input type="checkbox"${o.replaces.includes(a.id) ? ' checked' : ''} onchange="toggleReplace('${obj}','${a.id}')">Replace ${esc(plan(a.plan).name)}</label>`).join('');
  return h;
}
function toggleReplace(obj, id) { const o = S[obj], r = o.replaces || (o.replaces = []), i = r.indexOf(id); if (i < 0) r.push(id); else r.splice(i, 1); render(); }
const periodErrors = (o, opts, ignoreOverlap) => !o.type ? ['type'] : checkPeriod(periodSpec(o), opts).errors.filter(e => !(ignoreOverlap && e.code === 'overlap'));

/* ---------- new request / edit a submitted request (only the author, only before approval) ---------- */
function initDraft(q) {
  const key = S.user + route();
  if (S.draft && (S.draft.key === key || route().startsWith('#/new/where'))) return S.draft;
  const id = q.get('edit');
  if (id) {
    const r = D.requests.find(x => x.id === id);
    if (!r || r.state !== 'submitted' || r.by !== S.user) return (S.draft = { key, blocked: true });
    return (S.draft = splitMD({ key, edit: r.id, sp: r.sp, level: r.level, target: r.target, mode: r.mode || null, type: r.type || null, from: r.from || null, to: r.to || null, start: r.start || '', end: r.end || '',
      intent: r.intent || null, priority: r.priority || 'medium', title: r.title || '', text: r.text || '', files: (r.files || []).map(f => ({ ...f })), replaces: [] }));
  }
  const level = LEVELS.includes(q.get('level')) ? q.get('level') : 'species', sp = q.get('sp') && by('species', q.get('sp')) ? q.get('sp') : null;
  return (S.draft = splitMD({ key, edit: null, sp, level, target: level === 'species' ? sp : q.get('target') || '', mode: null, type: TYPE[q.get('type')] ? q.get('type') : null,
    from: q.get('from') || null, to: q.get('to') || null, start: q.get('start') || '', end: q.get('end') || '', intent: null, priority: 'medium', title: '', text: '', files: [], replaces: [] }));
}
function draftMissing() {
  const d = S.draft, m = [];
  if (!d.sp) m.push('species');
  if (!d.target) m.push('target');
  if (d.sp && d.target && !d.mode) m.push('ask');
  if (!d.type) m.push('type');
  else if (periodErrors(d, { self: d.edit }, true).length) m.push('dates');
  if ((d.title || '').trim().length < 4) m.push('title');
  if ((d.text || '').trim().length < 10) m.push('change');
  return m;
}
/* ---------- New request, after the Antz New Request form ---------- */
const fcard = (icon, title, body, { req = false, q = '' } = {}) => `<section class="card fcard"><div class="fc-h">${ic(icon, 22)}<h2 class="t-minor-title">${title}${req ? '<span class="req">*</span>' : ''}</h2></div>${q ? `<p class="fc-q t-minor-regular">${q}</p>` : ''}<div class="fields">${body}</div></section>`;
const fsel = (label, value, onclick) => `<button class="fsel${value ? ' has' : ''}" onclick="${onclick}">${value ? `<span class="fl t-body-regular">${label}</span>` : ''}<span class="v t-minor-regular">${value || label}</span><span class="chev">${ic('down', 20)}</span></button>`;
/* the entity's active diet, and what this request is about: a change to that diet, or something new with no diet selected */
function askBlock(d) {
  const w = resolveScope(d.sp, d.level, d.target).winner;
  if (!w) { d.mode = 'new'; return `<div class="pchip-f"><span class="av sm place" aria-hidden="true">${ic('diets', 22)}</span><span class="col grow"><span class="t-minor-medium head">No diet</span><span class="t-body-regular muted">New diet request</span></span></div>`; }
  const opt = (k, l) => `<button class="opt${d.mode === k ? ' on' : ''}" onclick="S.draft.mode='${k}';render()"><span class="radio-ic">${ic('radioOff', 24)}${ic('radioOn', 24)}</span><span class="ot t-body-title">${l}</span></button>`;
  return `<div class="pchip-f"><span class="av sm place" aria-hidden="true">${ic('diets', 22)}</span><button class="col grow" style="text-align:left" onclick="dietSheet('${w.asg.id}')"><span class="t-minor-medium head">${esc(plan(w.asg.plan).name)}</span><span class="t-body-regular muted">${srcText(w, d.level)} · ${TYPE[w.asg.type]}</span></button></div><div class="opts c2">${opt('change', 'Change this diet')}${opt('new', 'Request new diet')}</div>`;
}
function whereChip(d) {
  const sp = d.sp && by('species', d.sp);
  const name = d.level === 'species' ? sp.name : d.level === 'animal' ? by('animals', d.target).name : targetName(d.level, d.target);
  const sub = d.level === 'species' ? 'Species-wide' : facts(LEVEL[d.level], d.level === 'animal' ? d.target : placePath(d.level, d.target), sp.name);
  const av = d.level === 'animal' ? `<span class="av sm" aria-hidden="true"><span class="t-body-title">${initials(name)}</span></span>` : `<span class="av sm place" aria-hidden="true">${ic(d.level === 'species' ? 'diets' : 'place', 22)}</span>`;
  return `<div class="pchip-f"><a class="grow flex" href="#/new/where">${av}<span class="col"><span class="t-minor-medium head">${esc(name)}</span><span class="t-body-regular muted">${esc(sub)}</span></span></a><button class="rbtn xr" aria-label="Clear" onclick="S.draft.sp=null;S.draft.target='';S.draft.level='species';S.draft.mode=null;render()">${ic('xcirc', 24)}</button></div>`;
}
function vNew() {
  const q = new URLSearchParams(route().split('?')[1] || ''), d = initDraft(q);
  if (d.blocked || !canRequest()) return { task: true, head: { back: '#/requests', title: 'New request' }, html: `<section class="card">${empty('info', 'Not available')}</section>` };
  d.home = d.home || route();
  const p = d.priority || 'medium', u = me(), t = TYPE_OPTS.find(x => x[0] === d.type);
  const files = `${(d.files || []).length ? `<div class="files">${d.files.map((f, i) => `<span class="file t-body-medium">${ic(f.kind === 'Image' ? 'image' : 'doc', 20)}${esc(f.name)}<button class="x" aria-label="Remove" onclick="S.draft.files.splice(${i},1);render()">${ic('x', 16)}</button></span>`).join('')}</div>` : ''}<button class="dropbox" onclick="pickFile()" aria-label="Add attachment"><span class="db-in">${ic('image', 28)}</span></button>`;
  const html = fcard('requests', 'Request details', `<input class="ainp t-minor-regular" id="d-title" placeholder="Title" aria-label="Title" value="${esc(d.title)}" oninput="S.draft.title=this.value;redrawFoot()"><textarea class="ainp t-minor-regular" id="d-text" rows="5" placeholder="Description / Justification" aria-label="Description" oninput="S.draft.text=this.value;redrawFoot()">${esc(d.text)}</textarea>
      <div><p class="flab t-minor-medium">Requested by</p><div class="pchip-f"><span class="pav lg t-minor-title">${initials(u.name)}</span><span class="col grow"><span class="t-minor-medium head">${esc(u.name)} (You)</span><span class="t-body-regular muted">${u.title}</span></span></div></div>`, { req: true, q: 'What are you requesting?' })
    + fcard('place', 'Diet applies to', d.sp && d.target ? whereChip(d) : `<a class="choose t-minor-medium" href="#/new/where"><span>Choose species, site, section, enclosure or animal</span>${ic('addc', 24)}</a>`, { req: true })
    + (d.sp && d.target ? fcard('diets', 'Current diet', askBlock(d), { req: true }) : '')
    + fcard(d.type || 'seasonal', 'Type and period', periodBlock('draft'), { req: true })
    + fcard('attach', 'Add attachments if any', files);
  return {
    task: true,
    head: { back: d.edit ? `#/req/${d.edit}` : '#/requests', title: d.edit ? `Edit ${d.edit}` : 'New request', right: `<button class="pbtn ${p}" aria-label="Priority: ${PRIORITY[p]}" onclick="optionCards('Priority', [['high','High','','alert'],['medium','Medium','','info'],['low','Low','','info']], S.draft.priority || 'medium', &quot;S.draft.priority='$K'&quot;)"><span class="t-medium-title">${RIBBON[p]}</span></button>` },
    html,
    foot: footBar({ main: `<button class="btn pri upper"${draftMissing().length ? ' disabled' : ''} onclick="submitDraft()">${d.edit ? 'Save changes' : 'Submit request'}</button>` }),
  };
}
/* ---------- Choose species, site, section, enclosure or animal (the Antz location picker) ---------- */
const WL = ['site', 'section', 'enclosure', 'animal'];
function vWhere() {
  const d = S.draft; if (!d) { go('#/new'); return { task: true, head: {}, html: '' }; }
  if (!S.w || S.w.key !== d.key) { const path = d.sp && d.target ? scopePath(d.sp, d.level, d.target) : {}; S.w = { key: d.key, sp: d.sp || null, site: path.site || null, section: path.section || null, enclosure: path.enclosure || null, animal: path.animal || null, q: '' }; }
  const w = S.w, q = w.q.trim().toLowerCase();
  const found = q ? D.animals.filter(a => (!w.sp || a.sp === w.sp) && (a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))).slice(0, 8) : [];
  const block = (label, name, sub, av, clear) => `<div class="selblock"><div class="sb-h"><span class="t-minor-medium head">${label}</span><button class="linkbtn t-minor-regular" onclick="${clear};render()">Clear</button></div><div class="pchip-f white">${av}<span class="col grow"><span class="t-minor-medium head">${esc(name)}</span>${sub ? `<span class="t-body-regular muted">${esc(sub)}</span>` : ''}</span></div></div>`;
  const placeAv = `<span class="av sm place" aria-hidden="true">${ic('place', 22)}</span>`;
  let html = `<label class="asearch">${ic('search', 22)}<input id="wq" class="t-minor-regular" placeholder="Search animal" value="${esc(w.q)}" oninput="S.w.q=this.value;render()"><span class="qr">${ic('scan', 24)}</span></label>`;
  if (found.length) html += `<div class="card">${found.map(a => `<button class="row" onclick="Object.assign(S.w,{sp:'${a.sp}',animal:'${a.id}',enclosure:'${a.enc}',section:by('enclosures','${a.enc}').section,site:by('sections',by('enclosures','${a.enc}').section).site,q:''});render()"><span class="av sm"><span class="t-body-title">${initials(a.name)}</span></span><span class="grow"><span class="title t-minor-title" style="display:block">${esc(a.name)}</span><span class="meta t-body-regular" style="display:block">${facts(a.id, by('species', a.sp).name, targetName('enclosure', a.enc))}</span></span></button>`).join('')}</div>`;
  html += `<p class="w-h t-minor-medium">Choose species, site, section, enclosure or animal</p>`;
  html += w.sp ? block('Selected species', by('species', w.sp).name, by('species', w.sp).sci, `<span class="av sm place">${ic('diets', 22)}</span>`, "S.w={key:S.w.key,q:''}") : fsel('Select species', '', 'wSheet(\'species\')');
  if (w.sp) for (const l of WL) {
    if (w[l]) { const name = l === 'animal' ? by('animals', w[l]).name : targetName(l, w[l]); html += block(`Selected ${LEVEL[l].toLowerCase()}`, name, l === 'animal' ? w[l] : '', l === 'animal' ? `<span class="av sm"><span class="t-body-title">${initials(name)}</span></span>` : placeAv, `WL.slice(WL.indexOf('${l}')).forEach(k=>S.w[k]=null)`); continue; }
    html += fsel(`Select ${LEVEL[l].toLowerCase()}`, '', `wSheet('${l}')`); break;
  }
  const lvl = [...WL].reverse().find(l => w[l]) || 'species';
  return { task: true, head: { back: d.home || '#/new', title: 'Diet applies to' }, html, foot: footBar({ main: `<button class="btn pri"${w.sp ? '' : ' disabled'} onclick="wDone()">Done${w.sp ? ` · ${lvl === 'species' ? 'Species-wide' : LEVEL[lvl]}` : ''}</button>` }) };
}
function wDone() {
  const w = S.w, d = S.draft, lvl = [...WL].reverse().find(l => w[l]) || 'species', target = lvl === 'species' ? w.sp : w[lvl];
  if (d.sp !== w.sp || d.level !== lvl) d.intent = null;
  if (d.sp !== w.sp || d.target !== target) d.mode = null;
  Object.assign(d, { sp: w.sp, level: lvl, target, replaces: [] });
  go(d.home || '#/new');
}
/* the pick lists (sheets): what each option holds, as count chips */
function wSheet(l) {
  const w = S.w, parent = { site: null, section: 'site', enclosure: 'section', animal: 'enclosure' }[l];
  const title = l === 'species' ? 'Select species' : `Select ${LEVEL[l].toLowerCase()}`;
  const within = a => (!w.sp || a.sp === w.sp) && (!parent || !w[parent] || animalPath(a)[parent] === w[parent]);
  let rows;
  if (l === 'species') rows = D.species.map(s => [s.id, s.name, [['Animals', D.animals.filter(a => a.sp === s.id).length]], `<span class="av sm place">${ic('diets', 22)}</span>`]);
  else if (l === 'animal') rows = D.animals.filter(within).map(a => [a.id, a.name, [['ID', a.id]], `<span class="av sm"><span class="t-body-title">${initials(a.name)}</span></span>`]);
  else { const child = { site: 'section', section: 'enclosure', enclosure: null }[l]; rows = [...new Set(D.animals.filter(within).map(a => animalPath(a)[l]))].map(id => { const inIt = D.animals.filter(a => within(a) && animalPath(a)[l] === id); return [id, targetName(l, id), [...(child ? [[LEVEL_PLURAL[child], new Set(inIt.map(a => animalPath(a)[child])).size]] : []), ['Animals', inIt.length]], `<span class="av sm place">${ic('place', 22)}</span>`]; }); }
  const ctx = parent && w[parent] ? `<p class="t-minor-regular head" style="padding:0 var(--sp-24) var(--sp-8)">${LEVEL[parent]}: ${esc(targetName(parent, w[parent]))}</p>` : '';
  SHEET_ROWS = rows; SHEET_L = l;
  openSheet(`<div class="sh-h center"><h2 class="t-major-medium">${title}</h2></div>${ctx}<div class="sh-b" style="padding-top:0"><label class="search fill">${ic('search', 20)}<input class="t-minor-regular" placeholder="Search" oninput="wFilter(this.value)"></label><div id="wlist">${wRows('')}</div></div>`);
}
let SHEET_ROWS = [], SHEET_L = '';
const wRows = q => SHEET_ROWS.filter(r => !q || r[1].toLowerCase().includes(q.toLowerCase())).map(([id, name, chips, av]) => `<button class="row wrow" onclick="wPick('${id}')">${av}<span class="grow"><span class="title t-minor-title" style="display:block">${esc(name)}</span><span class="wchips">${chips.map(([k, v]) => `<span class="wchip t-body-regular">${k} ${v}</span>`).join('')}</span></span></button>`).join('') || `<p class="t-body-regular muted" style="padding:var(--sp-16)">No match</p>`;
function wFilter(q) { $('#wlist').innerHTML = wRows(q); }
function wPick(id) { const w = S.w; if (SHEET_L === 'species') { S.w = { key: w.key, sp: id, q: '' }; } else { w[SHEET_L] = id; WL.slice(WL.indexOf(SHEET_L) + 1).forEach(k => w[k] = null); } closeSheet(); render(); }
/* option cards in a sheet, with a radio and a full-width Continue (the Antz "Choose site" sheet) */
function optionCards(title, opts, current, onpick) { OC = { title, opts, cur: current, onpick }; openSheet(ocHtml()); }
function ocHtml() { return `<div class="sh-h"><h2 class="t-major-medium">${OC.title}</h2></div><div class="sh-b"><div class="ocards">${OC.opts.map(([k, t, d, i]) => `<button class="ocard${OC.cur === k ? ' on' : ''}" onclick="ocSel('${k}')">${i ? `<span class="oc-i">${ic(i, 22)}</span>` : ''}<span class="t-minor-medium grow">${t}</span><span class="radio-ic">${ic('radioOff', 24)}${ic('radioOn', 24)}</span></button>`).join('')}</div></div><div class="sh-f"><button class="btn pri block"${OC.cur ? '' : ' disabled'} onclick="ocGo()">Continue</button></div>`; }
function ocSel(k) { OC.cur = k; $('#sheet').innerHTML = '<div class="grab"></div>' + ocHtml(); typesetButtons(); }
function ocGo() { new Function(OC.onpick.replace(/\$K/g, OC.cur))(); closeSheet(); render(); }
let OC = {};
/* submit: a new request is created and submitted in one step (no drafts); an edit updates the submitted request and logs it */
function submitDraft() {
  const d = S.draft;
  if (!d || d.blocked || draftMissing().length) return;
  const period = d.type === 'seasonal' ? { from: d.from, to: d.to } : d.type === 'timebound' ? { start: d.start, end: d.end } : {};
  const fields = { sp: d.sp, level: d.level, target: d.target, mode: d.mode || 'new', type: d.type || null, ...period, intent: d.intent || null, priority: d.priority || 'medium', title: (d.title || '').trim(), text: (d.text || '').trim(), files: (d.files || []).map(f => ({ ...f })),
    ctx: d.level === 'animal' ? { enc: by('animals', d.target).enc } : null };
  let r;
  try {
    if (d.edit) {
      r = D.requests.find(x => x.id === d.edit);
      if (!r || r.state !== 'submitted' || r.by !== S.user) throw new Error(`Can't edit ${d.edit} now`);
      ['from', 'to', 'start', 'end'].forEach(k => delete r[k]);
      Object.assign(r, fields);
      r.events.push({ kind: 'edited', by: S.user, at: nowStamp() });
    } else {
      r = { id: newRequestId(), ...fields, state: 'new', events: [], config: null, by: S.user };
      D.requests.push(r);
      act(r, 'submit', S.user);
    }
  } catch (e) { toast(e.message); return; }
  S.draft = null; storeSave(); toast(`${d.edit ? 'Saved' : 'Submitted'} · ${r.id}`); go(`#/req/${r.id}`);
}

/* ---------- mark configured ---------- */
function initCfg(r) {
  const key = S.user + r.id;
  if (S.cfg && S.cfg.key === key) return S.cfg;
  const c = r.config || {}, p = r.config || r;
  return (S.cfg = splitMD({ key, rid: r.id, sp: r.sp, level: r.level, target: r.target, type: p.type || null, from: p.from || null, to: p.to || null, start: p.start || '', end: p.end || '',
    replaces: (c.replaces || []).slice(), note: c.note || '' }));
}
function cfgMissing(id) {
  const c = S.cfg, m = [];
  if (periodErrors(c, { replaces: c.replaces, self: id }, false).length) m.push('period');
  return m;
}
function vConfigured(id) {
  const r = by('requests', id); if (!r) throw new Error('No request ' + id);
  const acts = actionsFor(r, me());
  if (!acts.includes('configure')) return { task: true, head: { back: `#/req/${id}`, title: 'Mark configured' }, html: `<section class="card">${empty('info', 'Not available')}</section>` };
  const c = initCfg(r);
  /* no diet picker: the diet is configured and linked in the diet system; here only the period and the note travel with the request (Sourav, 2026-09-30) */
  const html = fcard('requests', 'Request', `<div><p class="t-minor-title head">${esc(r.title)}</p><p class="t-minor-regular muted mt4">${esc(r.text)}</p></div><div class="tags">${typeTag(r, 'line')}</div>`)
    + fcard(c.type || 'seasonal', 'Type and period', periodBlock('cfg', { self: id, strict: true }), { req: true })
    + fcard('note', 'Note to kitchen', `<textarea class="ainp t-minor-regular" id="cfg-note" rows="4" placeholder="Note to kitchen" aria-label="Note to kitchen" oninput="S.cfg.note=this.value">${esc(c.note)}</textarea>`);
  return {
    task: true,
    head: { back: `#/req/${id}`, title: 'Mark configured', facts: facts(r.id, scopeLabel(r.level, r.target)) },
    html,
    foot: footBar({ main: `<button class="btn pri upper"${cfgMissing(id).length ? ' disabled' : ''} onclick="markConfigured('${id}')">Send to kitchen</button>` }),
  };
}
function markConfigured(id) {
  const r = by('requests', id), c = S.cfg; if (!r || !c || cfgMissing(id).length) return;
  const period = c.type === 'seasonal' ? { from: c.from, to: c.to } : c.type === 'timebound' ? { start: c.start, end: c.end } : {};
  const config = { type: c.type, ...period, replaces: c.type === 'yearround' ? [] : (c.replaces || []).slice(), note: (c.note || '').trim() };
  try { act(r, 'configure', S.user, { config }); } catch (e) { toast(e.message); return; }
  S.cfg = null; storeSave(); toast(`Sent to kitchen · ${id}`); go(`#/req/${id}`);
}
