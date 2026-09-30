// prototypes/diet-tablet/data.js — seed data. Plain script: the page and tools/model.test.mjs both load it.
// Diet plans and assignments mirror the diet system (where diets are configured); requests are this module's own.
// Dates are strings: 'YYYY-MM-DD' for days, 'YYYY-MM-DDTHH:MM' for events, 'MM-DD' for seasonal bounds (system.md §3).

const USERS = [
  { id: 'u-carol', name: 'Carol Steve', role: 'requester', title: 'Site Manager' },
  { id: 'u-keer', name: 'Keerthana Lset', role: 'nutritionist', title: 'Nutritionist' },
  { id: 'u-ravi', name: 'Ravi Menon', role: 'kitchen', title: 'Kitchen lead' },
  { id: 'u-anita', name: 'Anita Rao', role: 'caretaker', title: 'Caretaker' },
];

function SEED() {
  const d = SEED_RAW();
  const applied = { 'DR-00402': ['AS-3', []], 'DR-00415': ['AS-4', []], 'DR-00398': ['AS-6', ['AS-5']] };
  const prio = {'DR-00421':'medium','DR-00424':'high','DR-00423':'low','DR-00417':'medium','DR-00419':'high','DR-00416':'high','DR-00415':'high','DR-00412':'low','DR-00410':'low','DR-00402':'medium','DR-00398':'medium','DR-00425':'low'};
  d.requests.forEach(r => { if (applied[r.id]) r.applied = { asg: applied[r.id][0], replaced: applied[r.id][1] }; r.priority = prio[r.id] || 'medium'; });
  const nut = {   // per animal · per day, totals across the plan (from the diet system)
    'PL-LST': { energy: 2540, protein: 171.7, fat: 200, carb: 0, fiber: 0, moist: 61.8, ca: 180, ph: 1580, va: 0, vd: 0, ve: 0, vc: 0 },
    'PL-LSM': { energy: 1210, protein: 84.3, fat: 92, carb: 0, fiber: 0, moist: 63.4, ca: 96, ph: 740, va: 0, vd: 0, ve: 0, vc: 0 },
    'PL-LSN': { energy: 2210, protein: 152.4, fat: 168, carb: 0, fiber: 0, moist: 64.2, ca: 210, ph: 1390, va: 0, vd: 0, ve: 0, vc: 0 },
    'PL-LWG': { energy: 2980, protein: 188.6, fat: 246, carb: 0, fiber: 0, moist: 59.7, ca: 196, ph: 1710, va: 0, vd: 0, ve: 0, vc: 0 },
    'PL-LSO': { energy: 1980, protein: 148.2, fat: 141, carb: 0, fiber: 0, moist: 66.1, ca: 152, ph: 1210, va: 0, vd: 0, ve: 0, vc: 0 },
    'PL-SCD': { energy: 757, protein: 29.6, fat: 15.4, carb: 58.7, fiber: 26, moist: 76.2, ca: 543, ph: 491, va: 175, vd: 0, ve: 0.2, vc: 18.4 },
    'PL-SUM': { energy: 512, protein: 22.1, fat: 9.8, carb: 41.2, fiber: 18, moist: 79.5, ca: 388, ph: 344, va: 132, vd: 0, ve: 0.1, vc: 14.6 },
    'PL-CHM': { energy: 828, protein: 34.9, fat: 18.1, carb: 61.3, fiber: 27, moist: 74.8, ca: 601, ph: 522, va: 190, vd: 0, ve: 0.3, vc: 19.2 },
    'PL-HBF': { energy: 640, protein: 12.4, fat: 6.2, carb: 118.5, fiber: 31, moist: 81.2, ca: 410, ph: 270, va: 460, vd: 0, ve: 0.8, vc: 96.3 },
    'PL-HBF2': { energy: 812, protein: 18.9, fat: 8.8, carb: 141.2, fiber: 35, moist: 80.4, ca: 505, ph: 331, va: 512, vd: 0, ve: 1.1, vc: 112.8 },
    'PL-BCM': { energy: 7400, protein: 520, fat: 580, carb: 0, fiber: 0, moist: 61.4, ca: 560, ph: 4420, va: 0, vd: 0, ve: 0, vc: 0 },
    'PL-BTS': { energy: 9120, protein: 640, fat: 710, carb: 0, fiber: 0, moist: 60.2, ca: 690, ph: 5480, va: 0, vd: 0, ve: 0, vc: 0 },
    'PL-BTL': { energy: 5480, protein: 402, fat: 398, carb: 0, fiber: 0, moist: 62.8, ca: 440, ph: 3320, va: 0, vd: 0, ve: 0, vc: 0 },
    'PL-FLS': { energy: 940, protein: 68.4, fat: 22.1, carb: 96.3, fiber: 12, moist: 34.6, ca: 1240, ph: 860, va: 820, vd: 110, ve: 4.2, vc: 0 },
    'PL-MHS': { energy: 610, protein: 74.2, fat: 14.8, carb: 41.7, fiber: 6, moist: 28.4, ca: 720, ph: 640, va: 310, vd: 84, ve: 2.6, vc: 0 },
  };
  d.plans.forEach(p => { if (nut[p.id]) p.nut = nut[p.id]; });
  /* Lion cross-linking showcase (2026-09-29): each active lion diet is shared at every level —
     2 species · 3 sites · 4 sections · 1 enclosure · 4 animals (with the hand-written rows above). */
  const LIONS = ['LN-0012', 'LN-0015', 'LN-0021', 'LN-0023'];
  const LX = [
    ['PL-LST', ['BT', 'MU'], ['SI-1', 'SI-2', 'SI-3'], ['SE-1', 'SE-2', 'SE-7'], ['EN-5'], LIONS],
    ['PL-LSM', ['MU', 'KC'], ['SI-2', 'SI-3'], ['SE-1', 'SE-2', 'SE-3', 'SE-7'], ['EN-6'], LIONS],
    ['PL-LSO', ['BT', 'MU'], ['SI-1', 'SI-2', 'SI-3'], ['SE-1', 'SE-2', 'SE-3', 'SE-7'], [], ['LN-0012', 'LN-0021', 'LN-0023']],
    ['PL-LBR', ['MU', 'KC'], ['SI-1', 'SI-2', 'SI-3'], ['SE-1', 'SE-2', 'SE-3', 'SE-7'], [], LIONS],
    ['PL-LFD', ['MU'], ['SI-1', 'SI-2', 'SI-3'], ['SE-1', 'SE-2', 'SE-3', 'SE-7'], ['EN-5'], LIONS],
  ];
  let lxn = 70;
  LX.forEach(([pid, sps, sites, secs, encs, ans]) => {
    const b = d.assignments.find(a => a.plan === pid && a.level === 'species' && a.sp === 'LI');
    const add = (sp, level, target) => d.assignments.push({ id: `AS-${lxn++}`, sp, level, target, plan: pid, type: b.type, from: b.from, to: b.to, start: b.start, end: b.end, state: 'current', since: b.since, req: null });
    sps.forEach(x => add(x, 'species', x)); sites.forEach(x => add('LI', 'site', x)); secs.forEach(x => add('LI', 'section', x)); encs.forEach(x => add('LI', 'enclosure', x)); ans.forEach(x => add('LI', 'animal', x));
  });
  return d;
}
function SEED_RAW() {
  const it = (name, qty, unit, prep = '', x = {}) => ({ name, qty, unit, prep, ...x });   // x: alt (either/or item), age [0–1y, 1–5y, 5+y]
  const meal = (time, name, items, x = {}) => ({ time, name, items, days: 'Daily', ...x });   // x: days ('Mon' · 'Wed, Thu, Fri'), to (end time)
  const ri = (recipe, qty, unit) => ({ recipe, qty, unit });                       // a Recipe used in a meal (weight-based master)
  const mi = (mix, qty, unit, vars = null) => ({ mix, qty, unit, vars });          // a Mix used in a meal (ratio-based master); vars: per-diet cut variants
  const ch = (feed, choice, qty, unit) => ({ feed, choice, qty, unit });           // an either-or ingredient choice
  return {
    users: USERS,
    species: [
      { id: 'CH', name: 'African Cuckoo-Hawk', sci: 'Aviceda cuculoides', cls: 'Birds' }, { id: 'LI', name: 'Asiatic Lion', sci: 'Panthera leo persica', cls: 'Mammals' },
      { id: 'SB', name: 'Sloth Bear', sci: 'Melursus ursinus', cls: 'Mammals' }, { id: 'GH', name: 'Great Hornbill', sci: 'Buceros bicornis', cls: 'Birds' },
      { id: 'ST', name: 'Indian Star Tortoise', sci: 'Geochelone elegans', cls: 'Reptiles' }, { id: 'SD', name: 'Spotted Deer', sci: 'Axis axis', cls: 'Mammals' },
      { id: 'PG', name: 'Indian Pangolin', sci: 'Manis crassicaudata', cls: 'Mammals' },
      { id: 'BT', name: 'Bengal Tiger', sci: 'Panthera tigris tigris', cls: 'Mammals' },
      { id: 'GS', name: 'Malabar Giant Squirrel', sci: 'Ratufa indica', cls: 'Mammals' },
      { id: 'FL', name: 'Greater Flamingo', sci: 'Phoenicopterus roseus', cls: 'Birds' },
      { id: 'KC', name: 'King Cobra', sci: 'Ophiophagus hannah', cls: 'Reptiles' },
      { id: 'MU', name: 'Mugger Crocodile', sci: 'Crocodylus palustris', cls: 'Reptiles' },
      { id: 'BR', name: 'Indian Bullfrog', sci: 'Hoplobatrachus tigerinus', cls: 'Amphibians' },
      { id: 'MH', name: 'Golden Mahseer', sci: 'Tor putitora', cls: 'Fish' },
      { id: 'RP', name: 'Red Panda', sci: 'Ailurus fulgens', cls: 'Mammals' },
      { id: 'KF', name: 'White-throated Kingfisher', sci: 'Halcyon smyrnensis', cls: 'Birds' },
      { id: 'JB', name: 'Jewel Beetle', sci: 'Sternocera aequisignata', cls: 'Invertebrates' },
    ],
    sites: [{ id: 'SI-1', name: 'Jamnagar Main Zoo' }, { id: 'SI-2', name: 'Rescue Centre' }, { id: 'SI-3', name: 'Bird Park' }],
    sections: [
      { id: 'SE-1', name: 'Raptor Wing', site: 'SI-3' }, { id: 'SE-2', name: 'Forest Aviaries', site: 'SI-3' }, { id: 'SE-3', name: 'Big Cats', site: 'SI-1' },
      { id: 'SE-4', name: 'Bear Wing', site: 'SI-2' }, { id: 'SE-5', name: 'Bear Sanctuary', site: 'SI-1' }, { id: 'SE-6', name: 'Reptile House', site: 'SI-1' },
      { id: 'SE-7', name: 'Hoofstock', site: 'SI-1' }, { id: 'SE-8', name: 'Rescue Paddocks', site: 'SI-2' }, { id: 'SE-9', name: 'Rescue Aviaries', site: 'SI-2' },
      { id: 'SE-10', name: 'Nocturnal House', site: 'SI-1' },
    ],
    enclosures: [
      { id: 'EN-1', name: 'Aviary 03', section: 'SE-1' }, { id: 'EN-2', name: 'Aviary 05', section: 'SE-1' }, { id: 'EN-3', name: 'Rescue Aviary R1', section: 'SE-9' },
      { id: 'EN-4', name: 'Hornbill Aviary', section: 'SE-2' }, { id: 'EN-5', name: 'Lion Enclosure A', section: 'SE-3' }, { id: 'EN-6', name: 'Lion Enclosure B', section: 'SE-3' },
      { id: 'EN-7', name: 'BW-02', section: 'SE-4' }, { id: 'EN-8', name: 'BW-04', section: 'SE-4' }, { id: 'EN-9', name: 'Sloth Bear Yard', section: 'SE-5' },
      { id: 'EN-10', name: 'Tortoise Yard 1', section: 'SE-6' }, { id: 'EN-11', name: 'Deer Paddock', section: 'SE-7' }, { id: 'EN-12', name: 'Rescue Paddock 2', section: 'SE-8' },
      { id: 'EN-13', name: 'Nocturnal N1', section: 'SE-10' },
    ],
    animals: [
      { id: 'AV-00291', name: 'Kiara', sp: 'CH', enc: 'EN-1', sex: 'F' }, { id: 'AV-00292', name: 'Juno', sp: 'CH', enc: 'EN-1', sex: 'M' },
      { id: 'AV-00295', name: 'Pip', sp: 'CH', enc: 'EN-1', sex: 'F' },
      { id: 'AV-00307', name: 'Tara', sp: 'CH', enc: 'EN-2', sex: 'F', moves: [{ from: 'EN-1', to: 'EN-2', on: '2026-06-11T11:30' }] },
      { id: 'AV-00310', name: 'Sol', sp: 'CH', enc: 'EN-2', sex: 'M' }, { id: 'AV-00318', name: 'Ember', sp: 'CH', enc: 'EN-3', sex: 'F' },
      { id: 'LN-0012', name: 'Raja', sp: 'LI', enc: 'EN-5', sex: 'M' }, { id: 'LN-0015', name: 'Leela', sp: 'LI', enc: 'EN-5', sex: 'F' },
      { id: 'LN-0021', name: 'Veer', sp: 'LI', enc: 'EN-6', sex: 'M' }, { id: 'LN-0023', name: 'Noor', sp: 'LI', enc: 'EN-6', sex: 'F' },
      { id: 'SB-0104', name: 'Bhola', sp: 'SB', enc: 'EN-8', sex: 'M' }, { id: 'SB-0107', name: 'Rani', sp: 'SB', enc: 'EN-8', sex: 'F' },
      { id: 'SB-0111', name: 'Moti', sp: 'SB', enc: 'EN-7', sex: 'M' }, { id: 'SB-0120', name: 'Gauri', sp: 'SB', enc: 'EN-9', sex: 'F' },
      { id: 'HB-0031', name: 'Kavi', sp: 'GH', enc: 'EN-4', sex: 'M' }, { id: 'HB-0033', name: 'Meera', sp: 'GH', enc: 'EN-4', sex: 'F' },
      { id: 'ST-0201', name: 'Tortoise 201', sp: 'ST', enc: 'EN-10', sex: 'F' }, { id: 'ST-0202', name: 'Tortoise 202', sp: 'ST', enc: 'EN-10', sex: 'M' },
      { id: 'ST-0203', name: 'Tortoise 203', sp: 'ST', enc: 'EN-10', sex: 'F' },
      { id: 'SD-0301', name: 'Chital 301', sp: 'SD', enc: 'EN-11', sex: 'F' }, { id: 'SD-0302', name: 'Chital 302', sp: 'SD', enc: 'EN-11', sex: 'M' },
      { id: 'SD-0303', name: 'Chital 303', sp: 'SD', enc: 'EN-11', sex: 'F' }, { id: 'SD-0310', name: 'Chital 310', sp: 'SD', enc: 'EN-12', sex: 'F' },
      { id: 'SD-0311', name: 'Chital 311', sp: 'SD', enc: 'EN-12', sex: 'M' },
      { id: 'PG-0009', name: 'Chintu', sp: 'PG', enc: 'EN-13', sex: 'M' },
    ],
    // diet plans, as set up in the diet system
    recipes: [   // weight-based formulations (the diet system's Recipe master)
      { id: 'RC-LMP', code: 'RC-114', name: 'Lion Meat Preparation', items: [it('Buffalo meat on bone', 7, 'kg', 'Whole joint', { cut: 'Large' }), it('Chicken liver', 0.5, 'kg', 'Whole'), it('Bone meal', 40, 'g', 'Dusted')] },
      { id: 'RC-TMP', code: 'RC-118', name: 'Tiger Meat Preparation', items: [it('Buffalo meat on bone', 8, 'kg', 'Whole joint', { cut: 'Large' }), it('Beef heart', 1, 'kg', 'Whole')] },
      { id: 'RC-CST', code: 'RC-131', name: 'Chicken Stew', items: [it('Chicken', 200, 'g', 'Minced', { cut: 'Small' }), it('Rice', 80, 'g', 'Boiled'), it('Carrot', 20, 'g', 'Chopped', { cut: 'Small' })] },
    ],
    mixes: [   // ratio-based formulations (the diet system's Mix master); the diet names the cut it needs
      { id: 'MX-FRT', code: 'MX-201', name: 'Fruit Mix', parts: [['Banana', 40], ['Apple', 35], ['Papaya', 25]] },
      { id: 'MX-VEG', code: 'MX-207', name: 'Vegetable Mix', parts: [['Carrot', 40], ['Potato', 35], ['Beetroot', 25]] },
    ],
    plans: [
      { id: 'PL-SCD', code: 'Diet 1103', name: 'Standard Carnivore Diet', sp: 'CH', meals: [meal('07:00', 'Morning', [it('Day-old chicks', 3, 'pcs', 'Whole'), it('Mice', 2, 'pcs', 'Whole')]), meal('16:00', 'Evening', [it('Crickets', 20, 'g', 'Live'), it('Mealworms', 15, 'g', 'Live')])] },
      { id: 'PL-HPD', code: 'Diet 1146', name: 'High Protein Diet', sp: 'CH', meals: [meal('07:00', 'Morning', [it('Day-old chicks', 4, 'pcs', 'Whole'), it('Mice', 2, 'pcs', 'Whole')]), meal('16:00', 'Evening', [it('Quail', 1, 'pcs', 'Chopped'), it('Crickets', 20, 'g', 'Live')])] },
      { id: 'PL-REC', code: 'Diet 1188', name: 'Recovery Diet', sp: 'CH', meals: [meal('07:00', 'Morning', [ri('RC-CST', 60, 'g'), it('Vitamin B complex', 0.2, 'ml', 'In food', { feed: 'Supplement' })]), meal('12:00', 'Midday', [it('Day-old chicks', 2, 'pcs', 'Chopped, soaked')]), meal('16:00', 'Evening', [it('Mealworms', 10, 'g', 'Live')])] },
      { id: 'PL-SUM', code: 'Diet 1210', name: 'Summer Diet', sp: 'CH', meals: [meal('06:30', 'Morning', [it('Day-old chicks', 2, 'pcs', 'Whole'), it('Mice', 1, 'pcs', 'Whole')]), meal('17:00', 'Evening', [it('Crickets', 30, 'g', 'Live'), it('Electrolyte water', 50, 'ml', 'In bowl')])] },
      { id: 'PL-HPD2', code: 'Diet 1287', name: 'High Protein Diet · rev 2', sp: 'CH', rev: 'PL-HPD', meals: [meal('07:00', 'Morning', [it('Day-old chicks', 3, 'pcs', 'Whole'), it('Mice', 2, 'pcs', 'Whole'), it('Calcium carbonate', 0.5, 'g', 'Dusted on chicks')]), meal('16:00', 'Evening', [it('Quail', 1, 'pcs', 'Chopped'), it('Crickets', 20, 'g', 'Live')])] },
      { id: 'PL-CHM', code: 'Diet 1234', name: 'Moult Support Diet', sp: 'CH', meals: [meal('07:00', 'Morning', [it('Day-old chicks', 4, 'pcs', 'Whole'), it('Mice', 2, 'pcs', 'Whole')]), meal('16:00', 'Evening', [it('Mealworms', 25, 'g', 'Live'), it('Boiled eggs', 1, 'pcs', 'Chopped')])] },
      { id: 'PL-LST0', code: 'Diet 1250', name: 'Lion Standard Diet 2025', sp: 'LI', meals: [meal('17:00', 'Evening', [it('Buffalo meat on bone', 8, 'kg', 'Whole joint')])], notes: 'Fast day: Wednesday.' },
      { id: 'PL-LST', code: 'Diet 1251', name: 'Lion Standard Diet', sp: 'LI', meals: [
        meal('17:00', 'Evening', [ri('RC-LMP', 7.5, 'kg'), it('Vitamin supplement', 10, 'g', 'In food', { feed: 'Supplement' })], { to: '18:00', days: 'Mon, Tue' }),
        meal('17:00', 'Evening', [it('Buffalo meat on bone', 7, 'kg', 'Whole joint', { alt: 'Goat meat' })], { to: '18:00', days: 'Thu, Fri, Sat' }),
        meal('17:00', 'Evening', [ch('Meat', ['Beef', 'Goat meat'], 6, 'kg')], { to: '18:00', days: 'Sun' }),
      ], notes: 'Fast day: Wednesday.' },
      { id: 'PL-LSM', code: 'Diet 1253', name: 'Lion Summer Light', sp: 'LI', byAge: true, reason: 'Chronic Illness', meals: [
        meal('07:00', 'Morning', [it('Beef', 1, 'kg', 'Chunks', { alt: 'Goat meat', age: [0.5, 1, 2] })], { to: '08:00', days: 'Mon' }),
        meal('07:00', 'Morning', [it('Beef', 1, 'kg', 'Chunks', { alt: 'Goat meat', age: [0.5, 1, 2] })], { to: '08:00', days: 'Wed, Thu, Fri' }),
        meal('07:00', 'Morning', [it('Beef', 1, 'kg', 'Chunks', { alt: 'Goat meat', age: [0.5, 1, 2] })], { to: '08:00', days: 'Sun' }),
      ], notes: 'Light summer ration; water ad lib.' },
      { id: 'PL-LSO', code: 'Diet 1252', name: 'Lion Soft Diet', sp: 'LI', meals: [meal('17:00', 'Evening', [it('Buffalo meat, boneless minced', 5, 'kg', 'Minced'), it('Chicken liver', 0.5, 'kg', 'Minced')])] },
      { id: 'PL-SBD', code: 'Diet 1301', name: 'Sloth Bear Daily Diet', sp: 'SB', meals: [meal('08:00', 'Morning', [it('Ragi porridge', 1.5, 'kg', 'Cooked'), it('Papaya', 0.8, 'kg', 'Cubed'), it('Boiled eggs', 2, 'pcs', 'Halved')]), meal('15:00', 'Afternoon', [it('Termite mound feed', 0.5, 'kg', 'In log feeder'), mi('MX-VEG', 800, 'g', { Carrot: 'Large cut' }), it('Honey', 50, 'g', 'Smeared')])] },
      { id: 'PL-SBC', code: 'Diet 1305', name: 'Summer Cooling Diet', sp: 'SB', meals: [meal('08:00', 'Morning', [it('Ragi porridge', 1, 'kg', 'Cooked, chilled'), it('Watermelon', 1, 'kg', 'Chunks')]), meal('15:00', 'Afternoon', [it('Frozen fruit block', 1, 'kg', 'Frozen'), mi('MX-VEG', 500, 'g', { Carrot: 'Small cut' })])] },
      { id: 'PL-SBM', code: 'Diet 1309', name: 'Monsoon Diet', sp: 'SB', meals: [meal('08:00', 'Morning', [it('Ragi porridge', 1.5, 'kg', 'Cooked'), it('Boiled eggs', 4, 'pcs', 'Halved')]), meal('15:00', 'Afternoon', [it('Termite mound feed', 0.8, 'kg', 'In log feeder'), it('Dates', 0.2, 'kg', 'Pitted')])] },
      { id: 'PL-HBF', code: 'Diet 1402', name: 'Hornbill Fruit Mix', sp: 'GH', meals: [meal('07:30', 'Morning', [mi('MX-FRT', 650, 'g'), it('Figs', 300, 'g', 'Whole')]), meal('14:00', 'Afternoon', [it('Mice', 1, 'pcs', 'Whole', { feed: 'Meat' }), it('Crickets', 20, 'g', 'Live')])] },
      { id: 'PL-HBF2', code: 'Diet 1406', name: 'Hornbill Breeding Mix', sp: 'GH', meals: [meal('07:30', 'Morning', [it('Figs', 450, 'g', 'Whole'), it('Papaya', 0.2, 'kg', 'Cubed'), it('Banana', 150, 'g', 'Sliced')]), meal('14:00', 'Afternoon', [it('Mice', 2, 'pcs', 'Whole'), it('Crickets', 30, 'g', 'Live')])] },
      { id: 'PL-TGR', code: 'Diet 1501', name: 'Tortoise Greens', sp: 'ST', meals: [meal('09:00', 'Morning', [it('Mixed greens', 150, 'g', 'Chopped'), it('Hibiscus flowers', 20, 'g', 'Whole'), it('Cuttlefish bone', 5, 'g', 'Grated')])] },
      { id: 'PL-DBR', code: 'Diet 1601', name: 'Deer Browse Diet', sp: 'SD', meals: [meal('07:00', 'Morning', [it('Lucerne hay', 2, 'kg', 'Loose'), it('Browse', 3, 'kg', 'Hung')]), meal('16:00', 'Evening', [it('Concentrate pellets', 0.4, 'kg', 'In trough')])] },
      { id: 'PL-DRC', code: 'Diet 1605', name: 'Rescue Deer Diet', sp: 'SD', meals: [meal('07:00', 'Morning', [it('Lucerne hay', 3, 'kg', 'Loose'), it('Browse', 3, 'kg', 'Hung')]), meal('16:00', 'Evening', [it('Concentrate pellets', 0.6, 'kg', 'In trough'), it('Mineral lick', 1, 'pcs', 'Fixed')])] },
      { id: 'PL-DRC2', code: 'Diet 1688', name: 'Rescue Deer Diet · napier', sp: 'SD', meals: [meal('07:00', 'Morning', [it('Green fodder (napier)', 4, 'kg', 'Chopped'), it('Browse', 3, 'kg', 'Hung')]), meal('16:00', 'Evening', [it('Concentrate pellets', 0.6, 'kg', 'In trough'), it('Mineral lick', 1, 'pcs', 'Fixed')])] },
      { id: 'PL-BCM', code: 'Diet 1707', name: 'Big Cat Meat Diet', sp: 'LI', rules: ['Adult · 7 kg/day', 'Juvenile · 3 kg/day'], meals: [meal('17:00', 'Evening', [ri('RC-LMP', 7, 'kg'), ch('Meat', ['Beef', 'Buffalo meat'], 1, 'kg')], { to: '18:00' })], notes: 'Shared carnivore base plan.' },
      { id: 'PL-LWG', code: 'Diet 1255', name: 'Lion Winter Gain', sp: 'LI', meals: [meal('17:00', 'Evening', [ri('RC-LMP', 8.5, 'kg'), it('Beef fat trim', 300, 'g', 'Cubed')], { to: '18:00' })] },
      { id: 'PL-LBR', code: 'Diet 1257', name: 'Lion Breeding Support', sp: 'LI', reason: 'Breeding season', meals: [meal('17:00', 'Evening', [ri('RC-LMP', 8, 'kg'), it('Calcium supplement', 20, 'g', 'Dusted', { feed: 'Supplement' })], { to: '18:00' })] },
      { id: 'PL-LFD', code: 'Diet 1263', name: 'Lion Fast-Day Substitute', sp: 'LI', meals: [meal('17:00', 'Evening', [it('Bone broth', 2, 'l', 'Warm'), it('Marrow bone', 1, 'pcs', 'Whole')], { days: 'Wed' })] },
      { id: 'PL-LSN', code: 'Diet 1261', name: 'Senior Soft Meat Diet', sp: 'LI', byAge: true, reason: 'Dental wear', meals: [meal('17:00', 'Evening', [it('Buffalo meat, boneless minced', 4, 'kg', 'Minced', { cut: 'Small', age: [2, 4, 5] }), it('Chicken liver', 0.5, 'kg', 'Minced')], { to: '18:00' })] },
      { id: 'PL-LCB', code: 'Diet 1259', name: 'Lion Cub Starter', sp: 'LI', meals: [meal('07:00', 'Morning', [it('Minced beef', 1, 'kg', 'Minced', { cut: 'Small' }), it('Calcium supplement', 10, 'g', 'Dusted', { feed: 'Supplement' })], { to: '08:00' }), meal('16:00', 'Evening', [it('Minced beef', 1.5, 'kg', 'Minced', { cut: 'Small' })])] },
      { id: 'PL-BTS', code: 'Diet 1701', name: 'Tiger Standard Diet', sp: 'BT', rules: ['Adult male · 9 kg/day', 'Adult female · 7 kg/day', 'Juvenile · 4 kg/day'], meals: [meal('17:00', 'Evening', [ri('RC-TMP', 9, 'kg')], { to: '18:00' })], notes: 'Fast day: Monday.' },
      { id: 'PL-BTL', code: 'Diet 1703', name: 'Tiger Summer Light', sp: 'BT', byAge: true, meals: [meal('07:00', 'Morning', [it('Beef', 5, 'kg', 'Chunks', { alt: 'Goat meat', age: [2, 5, 7] })], { to: '08:00', days: 'Tue, Thu, Sat' }), meal('07:00', 'Morning', [it('Chicken, whole', 3, 'kg', 'Skinned', { age: [1, 3, 4] })], { to: '08:00', days: 'Sun' })] },
      { id: 'PL-BTR', code: 'Diet 1705', name: 'Tiger Recovery Diet', sp: 'BT', reason: 'Post-surgical care', meals: [meal('08:00', 'Morning', [it('Minced beef', 2, 'kg', 'Minced'), it('Taurine supplement', 5, 'g', 'In food')]), meal('16:00', 'Evening', [it('Minced beef', 2, 'kg', 'Minced')])] },
      { id: 'PL-FLS', code: 'Diet 1801', name: 'Flamingo Pellet Mix', sp: 'FL', meals: [meal('08:00', 'Morning', [it('Flamingo pellets', 400, 'g', 'In water tray'), it('Shrimp meal', 120, 'g', 'Mixed in')]), meal('15:00', 'Afternoon', [it('Flamingo pellets', 300, 'g', 'In water tray')])] },
      { id: 'PL-FLB', code: 'Diet 1803', name: 'Flamingo Breeding Boost', sp: 'FL', reason: 'Breeding season', meals: [meal('08:00', 'Morning', [it('Flamingo pellets', 500, 'g', 'In water tray'), it('Shrimp meal', 200, 'g', 'Mixed in'), it('Spirulina', 30, 'g', 'Mixed in')])] },
      { id: 'PL-KCS', code: 'Diet 1901', name: 'Cobra Feed Cycle', sp: 'KC', meals: [meal('10:00', 'Feed day', [it('Rat snake, frozen-thawed', 1, 'pcs', 'Whole', { alt: 'Rodents' })], { days: 'Fri' })], notes: 'Feeds once a week.' },
      { id: 'PL-KCF', code: 'Diet 1903', name: 'Cobra Winter Support', sp: 'KC', meals: [meal('11:00', 'Feed day', [it('Rodents', 2, 'pcs', 'Whole')], { days: 'Sat' })] },
      { id: 'PL-MUS', code: 'Diet 2001', name: 'Crocodile Standard Diet', sp: 'MU', meals: [meal('16:00', 'Evening', [it('Fish, whole', 4, 'kg', 'Whole', { alt: 'Chicken' })], { days: 'Mon, Thu' })] },
      { id: 'PL-MUW', code: 'Diet 2003', name: 'Crocodile Winter Diet', sp: 'MU', meals: [meal('14:00', 'Afternoon', [it('Fish, whole', 2, 'kg', 'Whole')], { days: 'Thu' })], notes: 'Reduced intake in the cold months.' },
      { id: 'PL-BRS', code: 'Diet 2101', name: 'Bullfrog Insect Mix', sp: 'BR', meals: [meal('18:00', 'Evening', [it('Crickets', 15, 'pcs', 'Live, dusted'), it('Earthworms', 6, 'pcs', 'Live')])] },
      { id: 'PL-BRT', code: 'Diet 2103', name: 'Bullfrog Treatment Diet', sp: 'BR', reason: 'Parasite treatment', meals: [meal('18:00', 'Evening', [it('Crickets', 10, 'pcs', 'Live, medicated')])] },
      { id: 'PL-MHS', code: 'Diet 2201', name: 'Mahseer Pellet Diet', sp: 'MH', meals: [meal('09:00', 'Morning', [it('Sinking pellets', 250, 'g', 'Broadcast')]), meal('16:00', 'Evening', [it('Sinking pellets', 250, 'g', 'Broadcast'), it('Chopped prawn', 100, 'g', 'Raw')])] },
      { id: 'PL-GSS', code: 'Diet 2301', name: 'Squirrel Fruit & Nut Mix', sp: 'GS', meals: [meal('07:30', 'Morning', [it('Jackfruit', 150, 'g', 'Cubed'), it('Mixed nuts', 40, 'g', 'Shelled')]), meal('15:30', 'Afternoon', [ch('Fruit', ['Jackfruit', 'Banana', 'Papaya'], 120, 'g')])] },
      { id: 'PL-TGM', code: 'Diet 1503', name: 'Monsoon Greens', sp: 'ST', meals: [meal('09:00', 'Morning', [it('Mixed greens', 200, 'g', 'Chopped'), it('Hibiscus leaves', 60, 'g', 'Whole')])] },
      { id: 'PL-DWS', code: 'Diet 1603', name: 'Deer Winter Supplement', sp: 'SD', meals: [meal('07:00', 'Morning', [it('Lucerne hay', 2.5, 'kg', 'Loose'), it('Concentrate pellets', 0.8, 'kg', 'In trough')])] },
    ],
    assignments: [
      { id: 'AS-1', sp: 'CH', level: 'species', target: 'CH', plan: 'PL-SCD', type: 'yearround', state: 'current', since: '2025-01-10T09:00', req: null },
      { id: 'AS-2', sp: 'CH', level: 'species', target: 'CH', plan: 'PL-SUM', type: 'seasonal', from: '06-01', to: '08-31', state: 'current', since: '2025-05-20T10:00', req: null },
      { id: 'AS-3', sp: 'CH', level: 'enclosure', target: 'EN-1', plan: 'PL-HPD', type: 'yearround', state: 'current', since: '2026-03-14T11:05', req: 'DR-00402' },
      { id: 'AS-4', sp: 'CH', level: 'animal', target: 'AV-00291', plan: 'PL-REC', type: 'timebound', start: '2026-06-10', end: '2026-06-25', state: 'current', since: '2026-06-09T12:40', req: 'DR-00415' },
      { id: 'AS-5', sp: 'LI', level: 'species', target: 'LI', plan: 'PL-LST0', type: 'yearround', state: 'historical', since: '2025-01-10T09:00', until: '2026-02-03T10:15', req: null, by: 'DR-00398' },
      { id: 'AS-6', sp: 'LI', level: 'species', target: 'LI', plan: 'PL-LST', type: 'yearround', state: 'current', since: '2026-02-03T10:15', req: 'DR-00398' },
      { id: 'AS-7', sp: 'SB', level: 'species', target: 'SB', plan: 'PL-SBD', type: 'yearround', state: 'current', since: '2025-01-10T09:00', req: null },
      { id: 'AS-8', sp: 'SB', level: 'section', target: 'SE-4', plan: 'PL-SBC', type: 'seasonal', from: '06-01', to: '08-31', state: 'current', since: '2025-05-02T09:30', req: null },
      { id: 'AS-9', sp: 'GH', level: 'species', target: 'GH', plan: 'PL-HBF', type: 'yearround', state: 'current', since: '2025-01-10T09:00', req: null },
      { id: 'AS-10', sp: 'ST', level: 'species', target: 'ST', plan: 'PL-TGR', type: 'yearround', state: 'current', since: '2025-01-10T09:00', req: null },
      { id: 'AS-11', sp: 'SD', level: 'species', target: 'SD', plan: 'PL-DBR', type: 'yearround', state: 'current', since: '2025-01-10T09:00', req: null },
      { id: 'AS-12', sp: 'LI', level: 'species', target: 'LI', plan: 'PL-LSM', type: 'seasonal', from: '04-01', to: '06-30', state: 'current', since: '2026-03-28T09:00', req: null },
      { id: 'AS-13', sp: 'LI', level: 'species', target: 'LI', plan: 'PL-LSO', type: 'timebound', start: '2026-06-05', end: '2026-06-25', state: 'current', since: '2026-06-04T09:00', req: null },
      { id: 'AS-14', sp: 'CH', level: 'species', target: 'CH', plan: 'PL-CHM', type: 'timebound', start: '2026-10-15', end: '2026-11-30', state: 'current', since: '2026-06-01T09:00', req: null },
      { id: 'AS-15', sp: 'GH', level: 'species', target: 'GH', plan: 'PL-HBF2', type: 'seasonal', from: '02-01', to: '04-30', state: 'current', since: '2026-01-20T09:00', req: null },
      { id: 'AS-16', sp: 'BT', level: 'species', target: 'BT', plan: 'PL-BTS', type: 'yearround', state: 'current', since: '2024-11-02T09:00', req: null },
      { id: 'AS-17', sp: 'BT', level: 'species', target: 'BT', plan: 'PL-BTL', type: 'seasonal', from: '04-15', to: '06-30', state: 'current', since: '2026-04-02T09:00', req: null },
      { id: 'AS-18', sp: 'BT', level: 'species', target: 'BT', plan: 'PL-BTR', type: 'timebound', start: '2026-02-01', end: '2026-03-15', state: 'current', since: '2026-01-30T09:00', req: null },
      { id: 'AS-19', sp: 'FL', level: 'species', target: 'FL', plan: 'PL-FLS', type: 'yearround', state: 'current', since: '2025-02-14T09:00', req: null },
      { id: 'AS-25', sp: 'FL', level: 'species', target: 'FL', plan: 'PL-FLB', type: 'seasonal', from: '05-01', to: '07-31', state: 'current', since: '2025-04-20T09:00', req: null },
      { id: 'AS-26', sp: 'KC', level: 'species', target: 'KC', plan: 'PL-KCS', type: 'yearround', state: 'current', since: '2025-03-05T09:00', req: null },
      { id: 'AS-27', sp: 'KC', level: 'species', target: 'KC', plan: 'PL-KCF', type: 'timebound', start: '2026-11-01', end: '2026-12-15', state: 'current', since: '2026-06-05T09:00', req: null },
      { id: 'AS-28', sp: 'MU', level: 'species', target: 'MU', plan: 'PL-MUS', type: 'yearround', state: 'current', since: '2025-01-22T09:00', req: null },
      { id: 'AS-29', sp: 'MU', level: 'species', target: 'MU', plan: 'PL-MUW', type: 'seasonal', from: '12-01', to: '02-28', state: 'current', since: '2025-11-12T09:00', req: null },
      { id: 'AS-30', sp: 'BR', level: 'species', target: 'BR', plan: 'PL-BRS', type: 'yearround', state: 'current', since: '2025-06-01T09:00', req: null },
      { id: 'AS-31', sp: 'BR', level: 'species', target: 'BR', plan: 'PL-BRT', type: 'timebound', start: '2026-03-01', end: '2026-04-15', state: 'current', since: '2026-02-26T09:00', req: null },
      { id: 'AS-32', sp: 'MH', level: 'species', target: 'MH', plan: 'PL-MHS', type: 'yearround', state: 'current', since: '2025-05-18T09:00', req: null },
      { id: 'AS-33', sp: 'GS', level: 'enclosure', target: 'EN-13', plan: 'PL-GSS', type: 'yearround', state: 'current', since: '2025-08-09T09:00', req: null },
      { id: 'AS-34', sp: 'ST', level: 'species', target: 'ST', plan: 'PL-TGM', type: 'seasonal', from: '07-01', to: '09-30', state: 'current', since: '2025-06-25T09:00', req: null },
      { id: 'AS-35', sp: 'SD', level: 'species', target: 'SD', plan: 'PL-DWS', type: 'seasonal', from: '11-15', to: '01-31', state: 'current', since: '2025-10-30T09:00', req: null },
      { id: 'AS-36', sp: 'LI', level: 'site', target: 'SI-1', plan: 'PL-BCM', type: 'yearround', state: 'current', since: '2026-04-11T09:00', req: null },
      { id: 'AS-37', sp: 'BT', level: 'species', target: 'BT', plan: 'PL-BCM', type: 'seasonal', from: '07-01', to: '09-30', state: 'current', since: '2026-05-02T09:00', req: null },
      { id: 'AS-38', sp: 'MU', level: 'species', target: 'MU', plan: 'PL-BCM', type: 'timebound', start: '2026-06-01', end: '2026-06-30', state: 'current', since: '2026-05-28T09:00', req: null },
      { id: 'AS-39', sp: 'SD', level: 'animal', target: 'SD-0302', plan: 'PL-DRC', type: 'timebound', start: '2026-06-01', end: '2026-07-15', state: 'current', since: '2026-05-30T09:00', req: null },
      { id: 'AS-40', sp: 'SB', level: 'site', target: 'SI-2', plan: 'PL-SBC', type: 'seasonal', from: '06-01', to: '08-31', state: 'current', since: '2026-05-15T09:00', req: null },
      { id: 'AS-41', sp: 'GH', level: 'enclosure', target: 'EN-4', plan: 'PL-HBF2', type: 'timebound', start: '2026-06-01', end: '2026-07-31', state: 'current', since: '2026-05-25T09:00', req: null },
      { id: 'AS-42', sp: 'FL', level: 'section', target: 'SE-2', plan: 'PL-FLB', type: 'seasonal', from: '05-01', to: '07-31', state: 'current', since: '2026-04-22T09:00', req: null },
      { id: 'AS-43', sp: 'LI', level: 'animal', target: 'LN-0015', plan: 'PL-LSO', type: 'timebound', start: '2026-06-05', end: '2026-06-25', state: 'current', since: '2026-06-04T09:00', req: null },
      { id: 'AS-44', sp: 'SD', level: 'site', target: 'SI-1', plan: 'PL-DWS', type: 'seasonal', from: '11-15', to: '01-31', state: 'current', since: '2025-11-01T09:00', req: null },
      { id: 'AS-45', sp: 'LI', level: 'enclosure', target: 'EN-6', plan: 'PL-BTS', type: 'yearround', state: 'current', since: '2026-05-10T09:00', req: null },
      { id: 'AS-46', sp: 'GH', level: 'species', target: 'GH', plan: 'PL-BRS', type: 'timebound', start: '2026-07-01', end: '2026-07-15', state: 'current', since: '2026-06-08T09:00', req: null },
      { id: 'AS-47', sp: 'SD', level: 'species', target: 'SD', plan: 'PL-TGM', type: 'seasonal', from: '07-01', to: '09-30', state: 'current', since: '2026-06-02T09:00', req: null },
      { id: 'AS-48', sp: 'BT', level: 'site', target: 'SI-2', plan: 'PL-BTR', type: 'timebound', start: '2026-02-01', end: '2026-03-15', state: 'current', since: '2026-01-30T09:00', req: null },
      { id: 'AS-49', sp: 'MU', level: 'site', target: 'SI-2', plan: 'PL-MUS', type: 'yearround', state: 'current', since: '2026-03-18T09:00', req: null },
      { id: 'AS-50', sp: 'LI', level: 'species', target: 'LI', plan: 'PL-LWG', type: 'seasonal', from: '11-01', to: '01-31', state: 'current', since: '2025-10-12T09:00', req: null },
      { id: 'AS-51', sp: 'LI', level: 'species', target: 'LI', plan: 'PL-LBR', type: 'seasonal', from: '05-01', to: '07-31', state: 'current', since: '2026-04-18T09:00', req: null },
      { id: 'AS-52', sp: 'LI', level: 'species', target: 'LI', plan: 'PL-LFD', type: 'timebound', start: '2026-06-01', end: '2026-06-30', state: 'current', since: '2026-05-29T09:00', req: null },
      { id: 'AS-53', sp: 'LI', level: 'section', target: 'SE-3', plan: 'PL-LST', type: 'yearround', state: 'current', since: '2026-03-02T09:00', req: null },
      { id: 'AS-54', sp: 'LI', level: 'enclosure', target: 'EN-5', plan: 'PL-LBR', type: 'seasonal', from: '05-01', to: '07-31', state: 'current', since: '2026-04-20T09:00', req: null },
      { id: 'AS-55', sp: 'LI', level: 'animal', target: 'LN-0023', plan: 'PL-LSN', type: 'yearround', state: 'current', since: '2026-04-08T09:00', req: null },
      { id: 'AS-56', sp: 'BT', level: 'species', target: 'BT', plan: 'PL-LSN', type: 'timebound', start: '2026-06-01', end: '2026-09-30', state: 'current', since: '2026-05-27T09:00', req: null },
      { id: 'AS-57', sp: 'LI', level: 'site', target: 'SI-2', plan: 'PL-LWG', type: 'seasonal', from: '11-01', to: '01-31', state: 'current', since: '2025-10-14T09:00', req: null },
      { id: 'AS-58', sp: 'LI', level: 'animal', target: 'LN-0021', plan: 'PL-LCB', type: 'timebound', start: '2026-06-10', end: '2026-07-10', state: 'current', since: '2026-06-09T09:00', req: null },
      { id: 'AS-59', sp: 'LI', level: 'site', target: 'SI-1', plan: 'PL-LSM', type: 'seasonal', from: '04-01', to: '06-30', state: 'current', since: '2026-03-30T09:00', req: null },
      { id: 'AS-60', sp: 'LI', level: 'enclosure', target: 'EN-6', plan: 'PL-LSO', type: 'timebound', start: '2026-06-05', end: '2026-06-25', state: 'current', since: '2026-06-04T09:30', req: null },
      { id: 'AS-61', sp: 'BT', level: 'species', target: 'BT', plan: 'PL-LFD', type: 'timebound', start: '2026-06-01', end: '2026-06-30', state: 'current', since: '2026-05-29T09:30', req: null },
    ],
    requests: [
      req('DR-00421', 'CH', 'enclosure', 'EN-1', 'yearround', {}, 'awaiting_kitchen', 'Fewer chicks, more calcium for Aviary 03',
        'Birds in Aviary 03 are gaining weight on the High Protein Diet. Reduce day-old chicks from 4 to 3 a day and add a calcium supplement.',
        [['Weight log, May–Jun.xlsx', 'Report', '1.2 MB']], 'adjust',
        [ev('submitted', 'u-carol', '2026-06-10T15:55'), ev('approved', 'u-keer', '2026-06-10T16:20'), ev('started', 'u-keer', '2026-06-11T09:05'), ev('configured', 'u-keer', '2026-06-11T17:10', { plan: 'PL-HPD2', note: 'Dust the chicks with calcium carbonate just before feeding.' })],
        { plan: 'PL-HPD2', base: 'PL-HPD', type: 'yearround', note: 'Dust the chicks with calcium carbonate just before feeding.' }),
      req('DR-00424', 'LI', 'animal', 'LN-0012', 'timebound', { start: '2026-06-15', end: '2026-06-30' }, 'submitted', 'Soft food after dental surgery',
        'Raja has dental surgery on 14 Jun. The vet recommends boneless, minced meat for two weeks, then back to the standard diet.',
        [['Dental assessment.pdf', 'Assessment', '3 MB'], ['Jaw X-ray.jpg', 'Image', '1.8 MB']], null, [ev('submitted', 'u-carol', '2026-06-12T09:10')]),
      req('DR-00423', 'SB', 'section', 'SE-4', 'seasonal', { from: '07-01', to: '09-30' }, 'in_progress', 'Monsoon diet for Bear Wing',
        'In the monsoon the bears in Bear Wing eat less fruit and need more protein. Suggest a monsoon diet from July to September.', [], null,
        [ev('submitted', 'u-carol', '2026-06-05T11:20'), ev('approved', 'u-keer', '2026-06-06T09:45'), ev('started', 'u-keer', '2026-06-08T10:15')]),
      req('DR-00417', 'CH', 'animal', 'AV-00307', 'timebound', { start: '2026-06-20', end: '2026-07-10' }, 'approved', 'Extra protein while Tara moults',
        'Tara has started her moult. Add extra protein for three weeks so the new feathers come in well.', [['Moult photo.jpg', 'Image', '2.1 MB']], null,
        [ev('submitted', 'u-carol', '2026-06-09T10:05'), ev('approved', 'u-keer', '2026-06-10T08:50')], null, { enc: 'EN-1' }),
      req('DR-00419', 'GH', 'enclosure', 'EN-4', 'yearround', {}, 'kitchen_progress', 'More fruit for the breeding pair',
        'Kavi and Meera are nesting. Increase figs and add a second mouse so the female is fed well while sealed in the nest.', [['Nest check notes.pdf', 'Document', '640 KB']], null,
        [ev('submitted', 'u-carol', '2026-06-01T09:30'), ev('approved', 'u-keer', '2026-06-02T10:10'), ev('started', 'u-keer', '2026-06-03T09:00'), ev('configured', 'u-keer', '2026-06-03T15:00', { plan: 'PL-HBF2', note: 'Only while they nest, then back to the fruit mix.' }),
         ev('delayed', 'u-ravi', '2026-06-04T08:15', { reason: 'Supplier delay', until: '2026-06-20' }),
         ev('comment', 'u-ravi', '2026-06-04T08:16', { note: 'Fig supply is short until the new vendor starts on 20 Jun.' })],
        { plan: 'PL-HBF2', base: 'PL-HBF', type: 'timebound', start: '2026-06-20', end: '2026-09-30', note: 'Only while they nest, then back to the fruit mix.' }),
      req('DR-00416', 'SD', 'site', 'SI-2', 'yearround', {}, 'kitchen_progress', 'Richer diet for rescued deer',
        'Rescued deer at the Rescue Centre are underweight. They need a richer diet than the zoo herd until they recover condition.', [['Body condition scores.xlsx', 'Assessment', '890 KB']], null,
        [ev('submitted', 'u-carol', '2026-05-28T14:00'), ev('approved', 'u-keer', '2026-05-29T09:20'), ev('started', 'u-keer', '2026-05-30T09:10'), ev('configured', 'u-keer', '2026-05-30T16:45', { plan: 'PL-DRC' }),
         ev('delayed', 'u-ravi', '2026-06-01T07:50', { reason: 'Ingredient not in stock', until: '2026-06-15' }),
         ev('comment', 'u-ravi', '2026-06-01T07:52', { note: 'Lucerne hay isn’t stocked at the Rescue Centre kitchen. Can the diet use the green fodder (napier) we already buy?', files: [{ name: 'Napier stock photo.jpg', kind: 'Image', size: '1.5 MB' }] })],
        { plan: 'PL-DRC', base: 'PL-DBR', type: 'yearround' }),
      req('DR-00415', 'CH', 'animal', 'AV-00291', 'timebound', { start: '2026-06-10', end: '2026-06-25' }, 'applied', 'Soft food after wing surgery',
        'Kiara had a wing fracture repaired on 8 Jun. The vet asks for soft, easily digested food for two weeks.', [['Surgery note.pdf', 'Document', '450 KB'], ['Wing X-ray.jpg', 'Image', '2.4 MB']], null,
        [ev('submitted', 'u-carol', '2026-06-08T16:30'), ev('approved', 'u-keer', '2026-06-08T17:05'), ev('started', 'u-keer', '2026-06-09T08:30'), ev('configured', 'u-keer', '2026-06-09T10:20', { plan: 'PL-REC' }), ev('accepted', 'u-ravi', '2026-06-09T12:40'), ev('applied', null, '2026-06-09T12:40')],
        { plan: 'PL-REC', base: 'PL-HPD', type: 'timebound', start: '2026-06-10', end: '2026-06-25' }),
      req('DR-00412', 'ST', 'species', 'ST', 'seasonal', { from: '11-01', to: '02-28' }, 'rejected', 'Winter: fewer greens',
        'Tortoises eat less in winter. Suggest cutting the greens by a third from November to February.', [], null,
        [ev('submitted', 'u-carol', '2026-05-18T12:00'), ev('rejected', 'u-keer', '2026-05-20T10:30', { reason: 'The tortoises are kept in the heated house in winter, so their intake doesn’t drop. The current plan stays.' })]),
      req('DR-00410', 'LI', 'section', 'SE-3', 'yearround', {}, 'cancelled', 'Add bone meal for Big Cats', 'Add bone meal to the evening feed for all lions in Big Cats.', [], null,
        [ev('submitted', 'u-carol', '2026-05-15T10:00'), ev('cancelled', 'u-carol', '2026-05-16T09:10', { reason: 'Raised twice: the vet team already has this in hand.' })]),
      req('DR-00402', 'CH', 'enclosure', 'EN-1', 'yearround', {}, 'applied', 'Breeding diet for Aviary 03', 'Aviary 03 has two breeding pairs this season. Raise protein for the birds in this aviary.', [], null,
        [ev('submitted', 'u-carol', '2026-03-12T11:00'), ev('approved', 'u-keer', '2026-03-12T15:30'), ev('started', 'u-keer', '2026-03-13T09:00'), ev('configured', 'u-keer', '2026-03-13T12:00', { plan: 'PL-HPD' }), ev('accepted', 'u-ravi', '2026-03-14T11:05'), ev('applied', null, '2026-03-14T11:05')],
        { plan: 'PL-HPD', base: 'PL-SCD', type: 'yearround' }),
      req('DR-00398', 'LI', 'species', 'LI', 'yearround', {}, 'applied', 'Leaner lion diet', 'Keepers report the lions leave meat every evening. Reduce the meat and add liver for vitamins.', [], 'adjust',
        [ev('submitted', 'u-carol', '2026-01-28T10:00'), ev('approved', 'u-keer', '2026-01-29T11:00'), ev('started', 'u-keer', '2026-01-30T09:30'), ev('configured', 'u-keer', '2026-02-01T14:30', { plan: 'PL-LST' }), ev('accepted', 'u-ravi', '2026-02-03T10:15'), ev('applied', null, '2026-02-03T10:15')],
        { plan: 'PL-LST', base: 'PL-LST0', type: 'yearround' }),
    ],
  };
  function ev(kind, by, at, extra = {}) { return { kind, by, at, ...extra }; }
  /* mode: what the request is about — a change to the entity's current diet, or something new with no diet selected (Sourav, 2026-09-30) */
  function req(id, sp, level, target, type, period, state, title, text, files, intent, events, config = null, ctx = null) {
    return { id, sp, level, target, mode: ['DR-00424', 'DR-00417', 'DR-00423', 'DR-00416', 'DR-00415', 'DR-00402'].includes(id) ? 'new' : 'change', type, ...period, state, title, text, files: files.map(([name, kind, size]) => ({ name, kind, size })), intent, events, config, ctx, by: 'u-carol' };
  }
}

// The prototype's "today"; the stage bar can move it.
const DATES = [['2026-06-12', '12 Jun'], ['2026-09-01', '1 Sep'], ['2026-12-15', '15 Dec']];

if (typeof module !== 'undefined') module.exports = { SEED, USERS, DATES };
