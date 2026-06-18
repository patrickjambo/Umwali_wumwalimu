/*
 * Find "sign-dependent" questions (text shows a road sign) that are MISSING an
 * image, and check whether the image can be recovered from another data file.
 */
const G = require('./src/data/questions_grouped.json');
const V2 = require('./src/data/questions_v2.json');
const FULL = require('./src/data/questions_full.json');
const WI = require('./src/data/questions_with_images.json');

const SM = require('string_decoder'); // noop, keep node happy
function norm(s){return (s||'').toLowerCase().replace(/[‘’]/g,"'").replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();}
function sim(a,b){a=norm(a);b=norm(b);if(!a||!b)return 0;const m=Math.max(a.length,b.length);let d=0;const A=a.split(' '),B=new Set(b.split(' '));for(const w of A)if(B.has(w))d++;return d/Math.max(A.length,b.split(' ').length);}

const img = q => (q.image||q.signImageUrl||q.signSvg||q.imageUrl||'').toString();
const hasImg = q => img(q).trim().length>20;

// "this sign shown here" demonstrative reference -> needs an image
const NEEDS = /\b(iki|iyi|ibi|iyo|iyihe|aya)\b[^.]{0,40}\b(cyapa|byapa|kimenyetso|bimenyetso|shusho|ishusho)\b|\b(cyapa|kimenyetso|shusho)\b[^.]{0,30}\b(gikurikira|gisobanura|cyivuga|kivuze|kivuga|kigaragaza|kiri hejuru)\b/i;

// build lookup pools with images
const pools = [['v2',V2],['full',FULL],['withImages',WI]].map(([n,arr])=>[n,arr.filter(hasImg)]);

const need = [];
for(const q of G){
  if(!NEEDS.test(q.text||'')) continue;
  need.push(q);
}
const missing = need.filter(q=>!hasImg(q));

console.log('Total questions               :', G.length);
console.log('Sign-dependent (text shows sign):', need.length);
console.log('  ...of which HAVE an image    :', need.length-missing.length);
console.log('  ...MISSING an image          :', missing.length);
console.log('='.repeat(70));

let recoverable=0, orphan=0;
const recoverList=[], orphanList=[];
for(const q of missing){
  let best=null,bestS=0,bestPool=null;
  for(const [pn,pool] of pools){
    for(const c of pool){
      // match by number first, fall back to text similarity
      let s = sim(q.text, c.text);
      if(c.number===q.number) s += 0.25;
      if(s>bestS){bestS=s;best=c;bestPool=pn;}
    }
  }
  if(best && bestS>=0.6){
    recoverable++; recoverList.push({n:q.number, s:+bestS.toFixed(2), pool:bestPool, t:(q.text||'').slice(0,55)});
  } else {
    orphan++; orphanList.push({n:q.number, s:+bestS.toFixed(2), t:(q.text||'').slice(0,60)});
  }
}
console.log('RECOVERABLE (image found elsewhere):', recoverable);
recoverList.sort((a,b)=>a.n-b.n).forEach(r=>console.log(`  #${r.n} <-${r.pool} sim=${r.s}  ${r.t}`));
console.log('-'.repeat(70));
console.log('NO IMAGE ANYWHERE (orphans):', orphan);
orphanList.sort((a,b)=>a.n-b.n).forEach(r=>console.log(`  #${r.n} bestSim=${r.s}  ${r.t}`));
