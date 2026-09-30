// Checks the rules in docs/system.md against model.js, loaded exactly as the page loads it. Run: node --test tools/model.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const dir = new URL('..', import.meta.url).pathname;
function fresh(today = '2026-06-12') {
  const ctx = vm.createContext({ console });
  for (const f of ['data.js', 'model.js']) vm.runInContext(readFileSync(dir + f, 'utf8'), ctx, { filename: f });
  vm.runInContext(`D = SEED(); TODAY = '${today}';`, ctx);
  return ctx;
}
const run = (c, js) => vm.runInContext(js, c);
const eff = (c, id, date) => run(c, `(() => { const r = resolveAnimal(by('animals','${id}')${date ? `,'${date}'` : ''}); return r.winner ? plan(r.winner.asg.plan).name + ' @' + r.winner.level : 'none'; })()`);
const acts = (c, req, u) => [...run(c, `actionsFor(by('requests','${req}'), user('${u}'))`)].join(',');

test('I-1 scope before type · I-2 time-bound > seasonal > year-round · I-3 out-of-period passes up', () => {
  const c = fresh();
  assert.equal(eff(c, 'AV-00292'), 'High Protein Diet @enclosure');
  assert.equal(eff(c, 'AV-00310'), 'Summer Diet @species');
  assert.equal(eff(c, 'AV-00310', '2026-09-15'), 'Standard Carnivore Diet @species');
  assert.equal(eff(c, 'AV-00291'), 'Recovery Diet @animal');
  assert.equal(eff(c, 'AV-00291', '2026-06-26'), 'High Protein Diet @enclosure');
  assert.equal(eff(c, 'SB-0104', '2026-10-01'), 'Sloth Bear Daily Diet @species');
  assert.equal(eff(c, 'PG-0009'), 'none');
});
test('status of a diet: applies · overridden · not in force · replaced', () => {
  const c = fresh();
  const roles = run(c, `(() => { const r = resolveAnimal(by('animals','AV-00291')); return ['AS-1','AS-2','AS-3','AS-4'].map(id => roleOf(by('assignments', id), r)).join(); })()`);
  assert.equal(roles, 'overridden,overridden,overridden,applies');
  assert.equal(run(c, `roleOf(by('assignments','AS-5'), resolveScope('LI','species','LI'))`), 'replaced');
});
test('validation: overlapping seasons, dates, open duplicates, wrap-around text', () => {
  const c = fresh(), chk = js => run(c, `checkPeriod(${js})`);
  assert.equal(chk(`{sp:'SB',level:'section',target:'SE-4',type:'seasonal',from:'07-01',to:'09-30'}`).errors[0].code, 'overlap');
  assert.equal(run(c, `checkPeriod({sp:'SB',level:'section',target:'SE-4',type:'seasonal',from:'07-01',to:'09-30'},{replaces:['AS-8']}).errors.length`), 0);
  assert.equal(chk(`{type:'seasonal',from:'02-30',to:'03-10'}`).errors[0].code, 'bad-date');
  assert.equal(chk(`{type:'timebound',start:'2026-05-01',end:'2026-05-10'}`).errors[0].code, 'past');
  assert.equal(chk(`{sp:'CH',level:'enclosure',target:'EN-1',type:'yearround'}`).warnings[0].req, 'DR-00421');
  assert.equal(run(c, `overlapText({type:'seasonal',from:'12-01',to:'01-15'},{type:'seasonal',from:'11-15',to:'02-10'})`), '1 Dec – 15 Jan');
});
test('actions belong to the owner of the next step; reject and cancel end at the In Progress door', () => {
  const c = fresh();
  assert.equal(acts(c, 'DR-00424', 'u-keer'), 'approve,reject');
  assert.equal(acts(c, 'DR-00424', 'u-carol'), 'edit,cancel');
  assert.equal(acts(c, 'DR-00421', 'u-ravi'), 'accept,delay');
  assert.equal(acts(c, 'DR-00421', 'u-keer'), '');           // completed: no nutritionist actions
  assert.equal(acts(c, 'DR-00416', 'u-keer'), '');
  assert.equal(acts(c, 'DR-00421', 'u-carol'), '');
  assert.equal(acts(c, 'DR-00423', 'u-keer'), 'configure');  // in progress: no reject, no cancel
  assert.equal(acts(c, 'DR-00423', 'u-carol'), '');
  assert.equal(acts(c, 'DR-00417', 'u-keer'), 'confirmMove,reject');
  assert.equal(acts(c, 'DR-00417', 'u-carol'), 'cancel');    // approved: cancel yes, edit no
  assert.equal(acts(fresh('2026-12-15'), 'DR-00419', 'u-ravi'), 'delay');
});
test('configured is never current until Kitchen accepts; accepting replaces and keeps history', () => {
  const c = fresh();
  run(c, `act(by('requests','DR-00421'),'delay','u-ravi',{reason:'x',until:'2026-06-20'})`);
  assert.equal(eff(c, 'AV-00292'), 'High Protein Diet @enclosure');
  run(c, `act(by('requests','DR-00421'),'accept','u-ravi')`);
  assert.equal(eff(c, 'AV-00292'), 'High Protein Diet · rev 2 @enclosure');
  assert.equal(run(c, `by('assignments','AS-3').state`), 'historical');
  assert.equal(eff(c, 'AV-00291'), 'Recovery Diet @animal');
});
test('mark configured carries no diet reference (the diet system owns it); overlap still blocks until replaced', () => {
  const c = fresh();
  assert.throws(() => run(c, `act(by('requests','DR-00423'),'configure','u-keer',{config:{type:'seasonal',from:'07-01',to:'09-30'}})`), /Overlaps/);
  run(c, `act(by('requests','DR-00423'),'configure','u-keer',{config:{type:'seasonal',from:'07-01',to:'09-30',replaces:['AS-8'],note:'Monsoon diet from the diet system'}})`);
  assert.equal(run(c, `by('requests','DR-00423').state`), 'awaiting_kitchen');
  run(c, `act(by('requests','DR-00423'),'accept','u-ravi')`);
  assert.equal(run(c, `by('requests','DR-00423').state`), 'applied');
  assert.equal(run(c, `by('assignments','AS-8').state`), 'current');   // assignments change only in the diet system
});
test('reasons required; Nutritionist-raised requests skip review; IDs never reused', () => {
  const c = fresh();
  assert.throws(() => run(c, `act(by('requests','DR-00424'),'reject','u-keer',{reason:' '})`), /reason/);
  run(c, `D.requests.push({id:'DR-09998',sp:'CH',level:'species',target:'CH',type:'yearround',state:'new',title:'t',text:'x',files:[],events:[],by:'u-keer'}); act(by('requests','DR-09998'),'submit','u-keer')`);
  assert.equal(run(c, `by('requests','DR-09998').state`), 'approved');
  const a = run(c, `newRequestId()`); run(c, `D.requests.pop()`); assert.notEqual(run(c, `newRequestId()`), a);
});
test('impact: Kiara keeps her own diet until it ends; nothing persists', () => {
  const c = fresh();
  assert.equal(run(c, `impactOf(by('requests','DR-00421')).map(x => x.a.id + ':' + (x.from || '-')).join()`), 'AV-00291:2026-06-26,AV-00292:2026-06-12,AV-00295:2026-06-12');
  assert.equal(run(c, `by('assignments','AS-3').state`), 'current');
});
