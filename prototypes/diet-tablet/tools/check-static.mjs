// Prototype tooling: the library rules on this prototype's own files (standards/LIBRARY.md L0.4, LIB-ICON-001).
// No hex colours, no font-size / font-weight in diet.css or the templates, icons only through ic(). Run: node tools/check-static.mjs
import { readFileSync, readdirSync } from 'node:fs';
const dir = new URL('..', import.meta.url).pathname;
const files = readdirSync(dir).filter(f => /\.(js|css|html)$/.test(f));
const bad = [];
for (const f of files) {
  const src = readFileSync(dir + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  src.split('\n').forEach((l, i) => {
    const t = l.replace(/href="#[^"]*"|'#\/[^']*'|"#\/[^"]*"|`#\/[^`]*`|#\$\{|#(main|sheet|scrim|toast|nav|bar|foot|stage|stage-bar2?|q|rs-reason|rs-until|rs-go|sh-list|cfg-diff|cfg-diff-card|d-title|d-text|c-name)\b/g, '');
    if (/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/.test(t)) bad.push(`${f}:${i + 1} hex colour`);
    if (/font-(size|weight)\s*:/.test(l)) bad.push(`${f}:${i + 1} font size/weight outside type.css`);
    if (/<svg[^>]*viewBox|<img[^>]+icons\//.test(l)) bad.push(`${f}:${i + 1} icon not drawn through ic()`);
  });
}
console.log(bad.length ? bad.join('\n') + `\nSTATIC FAIL (${bad.length})` : `STATIC PASS (${files.length} files)`);
process.exit(bad.length ? 1 : 0);
