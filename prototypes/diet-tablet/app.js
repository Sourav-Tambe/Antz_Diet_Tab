// prototypes/diet-tablet/app.js — router, shell (header · nav · foot), the stage bars (prototype only), persistence, frame fitting.
// A view returns { tab?, head: { title, facts, back, right }, html, foot?, fab?, task?, wide? }. Tab pages get the bottom nav; detail and task pages don't.

const STORE = 'diet-tablet-v4';
function storeSave() { try { sessionStorage.setItem(STORE, JSON.stringify({ D, TODAY, S: { user: S.user, frame: S.frame, site: S.site } })); } catch (e) {} }
(function load() { let o = null; try { o = JSON.parse(sessionStorage.getItem(STORE)); } catch (e) {} useData(o ? o.D : SEED(), o ? o.TODAY : DATES[0][0]); if (o) Object.assign(S, o.S); })();
function resetData() { try { sessionStorage.removeItem(STORE); } catch (e) {} location.hash = '#/diets'; location.reload(); }

/* the walk sets window.__route instead of the hash, because the browser throttles hundreds of navigations */
function route() { return window.__route || location.hash || '#/diets'; }
function view() {
  const [path] = route().slice(2).split('?'), [a, b, c, d] = path.split('/');
  switch (a) {
    case 'diets': return !b ? vDiets() : b === 'filters' ? vFilters() : b === 'sp' ? vSpecies(c) : b === 'level' ? vLevel(c, d) : b === 'animal' ? vAnimal(c) : vScope(b, c, d);
    case 'plan': return vPlan(b);
    case 'requests': return vRequests();
    case 'req': return c === 'configured' ? vConfigured(b) : vRequest(b);
    case 'new': return b === 'where' ? vWhere() : vNew();
    case 'menu': return vMenu();
    case 'kitchen': return vKitchen();
    default: return vDiets();
  }
}
function notFound(e) { window.__notFound = String(e && e.message); return { head: { back: '#/diets', title: 'Not available' }, html: `<section class="card">${empty('alert', 'Not available', `<a class="btn sm" href="#/diets">Diets</a>`)}</section>` }; }
let V = null;
function render() {
  window.__notFound = null;
  try { V = view(); } catch (e) { console.error(e); V = notFound(e); }
  const dev = $('.device'), main = $('#main'), top = main.scrollTop, act = document.activeElement, fid = act && act.id, pos = act && act.selectionStart;
  dev.classList.toggle('in-task', !!V.task); dev.classList.toggle('no-nav', !V.tab); dev.classList.toggle('is-web', isWeb());
  drawBar(V.head || {}); drawNav(V.tab);
  main.classList.toggle('wide', !!V.wide); main.classList.toggle('flush', !!V.flush); main.classList.toggle('has-fab', !!V.fab); main.classList.toggle('lock', !!V.lock);
  main.innerHTML = V.html + (V.fab || ''); $('#foot').innerHTML = V.foot || '';
  typesetButtons(); main.scrollTop = top;
  if (fid && document.getElementById(fid) && fid !== 'rs-reason') { const el = document.getElementById(fid); el.focus(); try { if (pos != null) el.setSelectionRange(pos, pos); } catch (e) {} }
  drawStage();
}
function redrawFoot() { try { $('#foot').innerHTML = view().foot || ''; typesetButtons(); } catch (e) { console.error(e); } }
const STACK = []; let BACKING = false, LAST = location.hash;
function goBack(fallback) { if (window.__route) { go(fallback); return; } if (STACK.length) { BACKING = true; location.hash = STACK.pop(); } else location.hash = fallback; }
function drawBar(h) {
  $('#bar').className = h.dark ? 'dark' : ''; $('#bar').classList.toggle('center', !!h.center); if (h.cls) $('#bar').classList.add(h.cls);
  $('#bar').innerHTML = `${h.back ? `<button class="iconbtn" onclick="goBack('${h.back}')" aria-label="Back">${ic('back', 24)}</button>` : ''}${h.ava ? `<span class="bar-ava t-body-title" aria-hidden="true">${h.ava}</span>` : ''}<div class="hd"><h1 class="t-medium-medium">${h.title || 'Diet'}</h1>${h.facts ? `<p class="facts t-body-regular">${h.facts}</p>` : ''}</div>${h.right ? `<div class="bar-r">${h.right}</div>` : ''}`;
}
function drawNav(on) {
  const u = me(), k = u.role === 'kitchen', needs = D.requests.filter(r => atSite(r) && (k ? r.state === 'awaiting_kitchen' : needsYou(r, u))).length;
  const items = [['diets', 'Diets', 'diets', 0], k ? ['kitchen', 'Kitchen', 'kitchen', needs] : ['requests', 'Requests', 'requests', needs]];
  $('#nav').innerHTML = `<span class="brand t-medium-medium">${ic('diets', 24)}Diet</span>` + items.map(([key, l, i, n]) => `<a class="nav t-subtext-title${on === key ? ' on' : ''}" href="#/${key}"><span class="ni">${ic(i, 24)}${n ? `<span class="n t-subtext-title">${n}</span>` : ''}</span><span>${l}</span></a>`).join('');
}

/* ---------- stage bars: prototype controls, outside the tablet ---------- */
const SCENES = [
  ['Review', 'u-keer', '#/req/DR-00424'], ['Mark configured', 'u-keer', '#/req/DR-00423'], ['Kitchen accepts', 'u-ravi', '#/req/DR-00421'], ['Raise a request', 'u-carol', '#/diets/animal/AV-00310'],
  ['Delayed · stock', 'u-keer', '#/req/DR-00416'], ['Delayed', 'u-ravi', '#/req/DR-00419'], ['Animal moved', 'u-keer', '#/req/DR-00417'], ['Chain', 'u-anita', '#/diets/animal/AV-00291'], ['No diet', 'u-anita', '#/diets/sp/PG'],
];
function scene(u, h) { S.user = u; S.draft = null; S.cfg = null; S.tab = null; storeSave(); if (location.hash === h) render(); else go(h); }
function drawStage() {
  const link = (on, label, js) => on ? `<b class="stage__me">${label}</b>` : `<button type="button" class="stage__link" onclick="${js}">${label}</button>`;
  $('#stage-bar').innerHTML = `<span class="stage__label t-subtext-title">Prototype controls</span>
<span class="stage__group t-subtext-regular">Viewing as ${D.users.map(u => link(u.id === S.user, `${first(u.name)} (${u.title})`, `S.user='${u.id}';S.tab=null;S.sel=null;S.draft=null;S.cfg=null;storeSave();render()`)).join(' · ')}</span>
<span class="stage__group t-subtext-regular">Today ${DATES.map(([d, l]) => link(d === TODAY, l, `TODAY='${d}';S.draft=null;S.cfg=null;storeSave();render()`)).join(' · ')}</span>
<span class="stage__group t-subtext-regular">Frame ${link(S.frame === 'tablet', 'Tablet 834', "S.frame='tablet';storeSave();fit()")} · ${link(S.frame === 'web', 'Web 1280', "S.frame='web';storeSave();fit()")}</span>
<span class="stage__group t-subtext-regular"><button type="button" class="stage__link" onclick="resetData()">Reset data</button></span>`;
  $('#stage-bar2').innerHTML = `<span class="stage__label t-subtext-title">Jump to</span><span class="stage__group t-subtext-regular">${SCENES.map(([t, u, h]) => `<button type="button" class="stage__link" onclick="scene('${u}','${h}')">${t}</button>`).join(' · ')}</span>`;
}
function fit() {
  const dev = $('.device'), slot = $('.device-slot'), fill = innerWidth <= 860;
  document.body.classList.toggle('fill', fill); $('#stage').classList.toggle('web', S.frame === 'web');
  const W = isWeb() ? 1280 : 834, H = isWeb() ? 800 : 1194;
  if (fill) { dev.style.transform = ''; slot.style.width = slot.style.height = ''; }
  else { const k = Math.min(1, (innerHeight - slot.getBoundingClientRect().top - 24) / H, (innerWidth - 48) / W); dev.style.transform = k < 1 ? `scale(${k})` : ''; slot.style.width = W * k + 'px'; slot.style.height = H * k + 'px'; }
  render();
}
window.__errors = [];
addEventListener('error', e => window.__errors.push(String(e.message)));
addEventListener('resize', fit);
addEventListener('hashchange', () => { S.dial = false; if (!BACKING && LAST && LAST !== location.hash) STACK.push(LAST); BACKING = false; LAST = location.hash; closeSheetAll(); render(); $('#main').scrollTop = 0; });
fit();
