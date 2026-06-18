/*
 * Recover missing sign images for grouped.json from questions_v2.json / _full.
 * Match by NUMBER + OPTION TEXT (options are unique per sign; the question text
 * "Iki cyapa gisobanura iki?" is NOT discriminating). Only accept an image when
 * the candidate's options match well. Writes with --write.
 */
const fs = require('fs');
const path = require('path');
const WRITE = process.argv.includes('--write');
const GPATH = path.join(__dirname, 'src/data/questions_grouped.json');
const G = JSON.parse(fs.readFileSync(GPATH, 'utf8'));
const V2 = require('./src/data/questions_v2.json');
const FULL = require('./src/data/questions_full.json');
const WI = require('./src/data/questions_with_images.json');

const norm = s => (s||'').toLowerCase().replace(/[‘’]/g,"'").replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const img = q => (q.image||q.signImageUrl||q.signSvg||q.imageUrl||'').toString();
const hasImg = q => img(q).trim().length>20;
const optBlob = q => norm((q.options||[]).map(o=>o.text).join(' | '));
function jacc(a,b){const A=new Set(norm(a).split(' ').filter(Boolean));const B=new Set(norm(b).split(' ').filter(Boolean));if(!A.size||!B.size)return 0;let i=0;for(const x of A)if(B.has(x))i++;return i/(A.size+B.size-i);}

const NEEDS = /\b(iki|iyi|ibi|iyo|iyihe|aya)\b[^.]{0,40}\b(cyapa|byapa|kimenyetso|bimenyetso|shusho|ishusho)\b|\b(cyapa|kimenyetso|shusho)\b[^.]{0,30}\b(gikurikira|gisobanura|cyivuga|kivuze|kivuga|kigaragaza|kiri hejuru)\b/i;

const pool = [...V2, ...FULL, ...WI].filter(hasImg);

const missing = G.filter(q => NEEDS.test(q.text||'') && !hasImg(q));
const results = [];
for (const q of missing) {
  // candidates: same number, with image
  let cands = pool.filter(c => c.number === q.number);
  let via = 'number';
  if (!cands.length) { cands = pool; via = 'options-only'; }
  let best=null, bestS=-1;
  for (const c of cands) {
    const s = jacc(optBlob(q), optBlob(c));
    if (s > bestS) { bestS=s; best=c; }
  }
  results.push({ q, best, s: best?+bestS.toFixed(2):0, via });
}

const ACCEPT = 0.5; // option-overlap threshold
let applied = 0;
const accepted=[], rejected=[];
for (const r of results) {
  if (r.best && r.s >= ACCEPT && r.via==='number') {
    accepted.push(r);
    if (WRITE) { r.q.image = img(r.best); applied++; }
  } else {
    rejected.push(r);
  }
}

console.log('Missing-image sign questions:', missing.length);
console.log('ACCEPTED (number match + options>=%s overlap): %d', ACCEPT, accepted.length);
accepted.sort((a,b)=>a.q.number-b.q.number).forEach(r=>
  console.log(`  #${r.q.number} optSim=${r.s}  "${(r.q.text||'').slice(0,45)}"  img=${img(r.best).slice(0,18)}...`));
console.log('-'.repeat(70));
console.log('REJECTED (no confident image source):', rejected.length);
rejected.sort((a,b)=>a.q.number-b.q.number).forEach(r=>
  console.log(`  #${r.q.number} bestOptSim=${r.s} via=${r.via}  "${(r.q.text||'').slice(0,55)}"`));

if (WRITE) {
  fs.copyFileSync(GPATH, GPATH+'.bak2');
  fs.writeFileSync(GPATH, JSON.stringify(G, null, 2));
  console.log(`\nWROTE ${GPATH} (+${applied} images), backup .bak2`);
} else {
  console.log('\n(dry run — pass --write to apply)');
}
