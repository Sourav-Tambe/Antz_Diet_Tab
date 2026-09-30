// prototypes/diet-tablet/icons.js — every icon is an Antz glyph from app/icons (LIB-ICON-001), all of the thin line weight (CRAFT-ICON-001;
// checked side by side in tools/icon-sheet.html). A slug starting "local/" is a Material Symbols glyph kept in this build's icons/ (Sourav asked for
// Material radio buttons, 2026-09-28), used as a mask like the new/ ones. A slug starting "new/" is a pending master glyph in app/icons/new/, used as a file mask.
const IC = {
  home: ['dashboard'], diets: ['new/book-thin'], requests: ['reason-or-list'], history: ['duration'], kitchen: ['new/category'],
  back: ['back'], chev: ['dropdown', 'rotate(-90deg)'], down: ['dropdown'], up: ['dropdown', 'rotate(180deg)'], x: ['close'], plus: ['add'], addc: ['add-with-circle'],
  search: ['search'], filter: ['filter-2'], clock: ['time'], check: ['just-tick-mark'], alert: ['alert'], info: ['info'], edit: ['pencil'],
  user: ['new/person-thin'], place: ['location-icon'], attach: ['new/task-attachment'], doc: ['file-doc'], image: ['image'], note: ['notes-new'],
  yearround: ['time'], seasonal: ['local/star'], timebound: ['calendar'], plan: ['new/book-thin'], compare: ['compare'], view: ['view'], reset: ['reset'],
  tag: ['new/task-tag'], remove: ['remove-or-minus'], undo: ['reset', 'scaleX(-1)'], call: ['call-or-contact'], xcirc: ['close-with-circle'], scan: ['qr-code'], chat: ['message'], send: ['send'], timer: ['timer'],
  radioOn: ['local/radio-button-checked'], radioOff: ['local/radio-button-unchecked'], cbOn: ['checkbox-checked'], cbOff: ['checkbox-unchecked'], sort: ['local/swap-vert'], meals: ['local/restaurant'], nutrition: ['local/nutrition'],
};
const ic = (n, s = 20) => {
  const [slug, tf] = IC[n] || ['question'];
  const isNew = slug.startsWith('new/') || slug.startsWith('local/');
  const src = slug.startsWith('local/') ? `../prototypes/diet-tablet/icons/${slug.slice(6)}.svg` : `../../app/icons/${slug}.svg`;
  const style = `width:${s}px;height:${s}px${isNew ? `;--icon:url(${src})` : ''}${tf ? `;transform:${tf}` : ''}`;
  return `<span class="app-icon app-icon--tint${isNew ? '' : ' i-' + slug}" style="${style}" aria-hidden="true"></span>`;
};
