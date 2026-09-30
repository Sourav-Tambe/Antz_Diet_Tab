// prototypes/diet-tablet/figma-bar.js — prototype only: a Figma capture toolbar on the stage, above the tablet.
// Uses Figma's html-to-design script (index.html), which exposes window.figma.captureForDesign({ selector }) and copies the element to the clipboard.
(function () {
  const bar = document.getElementById('figma-bar'); if (!bar) return;
  const PICK = 'data-figma-pick';
  let picking = false, hovered = null, busy = false;
  const ready = () => !!(window.figma && window.figma.captureForDesign);
  const say = (text, tone = '') => { const s = bar.querySelector('.figbar__status'); if (s) { s.textContent = text; s.dataset.tone = tone; } };
  const btn = (act, label, extra = '') => `<button type="button" class="stage__link t-subtext-regular figbar__btn" data-fig="${act}"${extra}>${label}</button>`;
  function draw() {
    const sheetOpen = document.getElementById('scrim').classList.contains('on');
    bar.innerHTML = `<span class="stage__label t-subtext-title">Figma</span>
<span class="stage__group t-subtext-regular">${btn('screen', 'Copy screen')} · ${btn('sheet', 'Copy sheet', sheetOpen ? '' : ' disabled title="Open a sheet first"')} · ${btn('pick', picking ? 'Cancel pick' : 'Pick element', ` aria-pressed="${picking}"`)} · ${btn('page', 'Copy page')}</span>
<span class="figbar__status t-subtext-regular" role="status">${ready() ? (picking ? 'Tap anything in the tablet to copy it · Esc cancels' : 'Copies to the clipboard; paste into Figma') : 'Loading the Figma capture script…'}</span>`;
  }
  async function capture(selector, label) {
    if (!ready()) return say('The Figma capture script has not loaded (it needs internet).', 'error');
    if (busy) return; busy = true; say(`Copying ${label}…`);
    try {
      const r = await window.figma.captureForDesign({ selector, delayMs: 0 });
      if (r && r.success === false) say(`Could not copy: ${r.error}`, 'error'); else say(`${label[0].toUpperCase() + label.slice(1)} copied. Paste into Figma.`, 'ok');
    } catch (e) { say(`Could not copy: ${e.message || e}`, 'error'); }
    finally { busy = false; document.querySelectorAll(`[${PICK}]`).forEach(x => x.removeAttribute(PICK)); }
  }
  // pick mode: outline what the pointer is over inside the tablet; the next tap copies it and never reaches the app
  const outline = document.createElement('div'); outline.className = 'figbar__outline'; outline.hidden = true; document.body.appendChild(outline);
  const inFrame = el => el && el.closest && el.closest('.device') && !el.closest('.figbar__outline');
  function show(el) { const r = el.getBoundingClientRect(); Object.assign(outline.style, { top: `${r.top + scrollY}px`, left: `${r.left + scrollX}px`, width: `${r.width}px`, height: `${r.height}px` }); outline.hidden = false; }
  function stopPick() { picking = false; hovered = null; outline.hidden = true; document.body.classList.remove('is-figma-picking'); draw(); }
  document.addEventListener('mouseover', e => { if (!picking || !inFrame(e.target)) return; hovered = e.target; show(hovered); }, true);
  document.addEventListener('click', e => {
    if (!picking || !inFrame(e.target)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const el = e.target.closest('.dietcard, .spcard, .hdcard, .ocard, .fchip, .flopt, .ent, .hero, .stat, .row, .ffield, .field, .card, button, a, section') || e.target;   // copy a whole card, not a stray span
    el.setAttribute(PICK, '1'); const name = (el.className && String(el.className).split(' ')[0]) || el.tagName.toLowerCase();
    stopPick(); capture(`[${PICK}="1"]`, `the ${name}`);
  }, true);
  document.addEventListener('keydown', e => { if (picking && e.key === 'Escape') { e.stopImmediatePropagation(); stopPick(); } }, true);
  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-fig]'); if (!b || b.disabled) return;
    const act = b.dataset.fig;
    if (act === 'screen') return capture('.device', 'the screen');
    if (act === 'sheet') return capture('#sheet', 'the sheet');
    if (act === 'page') return capture('body', 'the page');
    if (act === 'pick') { if (picking) return stopPick(); picking = true; document.body.classList.add('is-figma-picking'); draw(); }
  });
  // redraw when a sheet opens or closes (Copy sheet follows it), and once the capture script arrives
  new MutationObserver(() => { if (!busy) draw(); }).observe(document.getElementById('scrim'), { attributes: true, attributeFilter: ['class'] });
  const wait = setInterval(() => { if (ready()) { clearInterval(wait); draw(); } }, 300); setTimeout(() => clearInterval(wait), 15000);
  draw();
})();
