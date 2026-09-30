// prototypes/diet-tablet/sheets.js — list sheets for the task pages: species, target, file, diet (from the diet system).

/* a sheet with a title, optional search and a list that SHEET.draw(q) refills */
function listSheet(title, rowsFn, { search = true } = {}) {
  openSheet(`<div class="sh-h"><h2 class="t-medium-medium">${title}</h2>${search ? `<label class="search mt8">${ic('search', 20)}<input class="t-body-regular" placeholder="Search" oninput="SHEET.draw(this.value)"></label>` : ''}</div><div class="sh-b" id="sh-list"></div>`);
  SHEET.draw = q => { const el = $('#sh-list'); if (el) el.innerHTML = rowsFn(String(q || '').trim().toLowerCase()) || empty('search', 'Nothing found'); };
  SHEET.draw('');
}
const sheetRow = ({ on = false, onclick, tile = '', title, meta = '' }) => `<button class="row${on ? ' on' : ''}" onclick="${onclick}">${tile}<span class="grow"><span class="title t-minor-title" style="display:block">${esc(title)}</span>${meta ? `<span class="meta t-body-regular" style="display:block">${esc(meta)}</span>` : ''}</span>${on ? ic('check', 20) : ''}</button>`;
const hit = (q, ...xs) => !q || xs.some(x => String(x || '').toLowerCase().includes(q));

function chooseSp(obj, id) { const o = S[obj]; o.sp = id; o.target = o.level === 'species' ? id : ''; o.intent = null; closeSheet(); render(); }
function chooseTarget(obj, id) { const o = S[obj]; o.target = id; o.intent = null; closeSheet(); render(); }

function pickSpecies(obj) {
  listSheet('Species', q => D.species.filter(s => hit(q, s.name, s.sci)).map(s => sheetRow({ on: S[obj].sp === s.id, onclick: `chooseSp('${obj}','${s.id}')`, tile: spTile(s.id, 'sm'), title: s.name, meta: s.sci })).join(''));
}

function pickTarget(obj) {
  const o = S[obj];
  if (!o.sp) return pickSpecies(obj);
  if (o.level === 'species') return;
  if (o.level === 'animal') {
    listSheet(LEVEL.animal, q => {
      const list = D.animals.filter(a => a.sp === o.sp && hit(q, a.name, a.id, targetName('enclosure', a.enc)));
      return [...new Set(list.map(a => a.enc))].map(enc => `<p class="sh-g t-subtext-title eyebrow">${esc(targetName('enclosure', enc))}</p>` +
        list.filter(a => a.enc === enc).map(a => sheetRow({ on: o.target === a.id, onclick: `chooseTarget('${obj}','${a.id}')`, tile: `<span class="tile sm">${ic('user', 20)}</span>`, title: a.name, meta: a.id })).join('')).join('');
    });
    return;
  }
  listSheet(LEVEL[o.level], q => placesOf(o.sp, o.level).filter(id => hit(q, targetName(o.level, id), placePath(o.level, id)))
    .map(id => sheetRow({ on: o.target === id, onclick: `chooseTarget('${obj}','${id}')`, tile: `<span class="tile sm">${ic('place', 20)}</span>`, title: targetName(o.level, id), meta: facts(placePath(o.level, id), plural(animalsIn(o.sp, o.level, id).length, 'animal')) })).join(''));
}

const SAMPLE_FILES = [['Vet report.pdf', 'Report'], ['Body condition assessment.pdf', 'Assessment'], ['Weight chart.xlsx', 'Report'], ['Photo of animal.jpg', 'Image'], ['Keeper notes.docx', 'Document']];
function addFile(i) { const [name, kind] = SAMPLE_FILES[i]; S.draft.files = S.draft.files || []; S.draft.files.push({ name, kind }); closeSheet(); render(); }
function pickFile() {
  const have = new Set((S.draft.files || []).map(f => f.name));
  listSheet('Add file', () => SAMPLE_FILES.map(([name, kind], i) => have.has(name) ? '' : sheetRow({ onclick: `addFile(${i})`, tile: `<span class="tile sm">${ic(kind === 'Image' ? 'image' : 'doc', 20)}</span>`, title: name, meta: kind })).join(''), { search: false });
}

