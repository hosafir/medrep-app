import { ymd } from "./dates.js";

export function extractAdoptionInsights(text){const raw=text||"";const sM=raw.match(/Score\s*:\s*(\d{1,3})\s*\/\s*100/i);const pM=raw.match(/Priorité\s*:\s*(haute|moyenne|basse)/i);const oM=raw.match(/Frein principal\s*[:-]\s*(.+)/i);const nM=raw.match(/##\s*Objectif next visit\s*([\s\S]*?)(##|$)/i);const prM=raw.match(/Probabilit[ée]\s+(?:de\s+)?(?:prescription|actuelle)\s*[:-]\s*(faible|moyenne|élevée|\d{1,3}\s*%)/i);const score=sM?Math.max(0,Math.min(100,parseInt(sM[1],10))):null;return{adoptionScore:Number.isFinite(score)?score:null,mainObjection:oM?oM[1].trim():"",nextVisitGoal:nM?nM[1].replace(/^-+\s*/gm,"").replace(/\n+/g," ").trim():"",priorityLevel:pM?pM[1].toLowerCase():"",prescriptionProba:prM?prM[1].trim():""};}
export function extractAIMemory(text,existing={}){const raw=text||"",m={...existing};const p=raw.match(/pr[eé]f[eè]re\s+(?:les?\s+)?(.{8,60}?)(?:\.|,|\n)/i);if(p)m.preference=p[1].trim();const s=raw.match(/style\s+(?:de\s+)?(?:communication|d[''']approche)\s*:\s*(.{8,80}?)(?:\.|,|\n)/i);if(s)m.style=s[1].trim();const a=raw.match(/(?:argument|levier)\s+(?:efficace|pertinent)\s*:\s*(.{8,80}?)(?:\.|,|\n)/i);if(a)m.bestArg=a[1].trim();const o=raw.match(/Frein principal\s*:\s*(.{8,120}?)(?:\.|,|\n|$)/i);if(o)m.mainObjection=o[1].trim();return m;}
export function computePredictiveScore(doctor,allReports){const dr=allReports[doctor.id]||[];const pot=doctor.potential==="A"?28:doctor.potential==="B"?16:6;const vis=Math.min(dr.length*6,24);const now=Date.now();const r90=dr.filter(r=>(now-new Date(r.createdAt))/86400000<=90).length;const freq=Math.min(r90*8,24);const obj=doctor.mainObjection?.trim()?-12:0;const eng=doctor.nextVisitGoal?10:0;const raw=pot+vis+freq+obj+eng;const c=Math.max(0,Math.min(100,raw));return doctor.adoptionScore!=null?Math.round(doctor.adoptionScore*0.6+c*0.4):c;}
export function detectOpportunities(doctors,reports){const opps=[],now=Date.now();doctors.forEach(d=>{const score=d.adoptionScore;if(score!=null&&score>=55&&score<76&&d.potential!=="C")opps.push({type:"hot",doctor:d,reason:`Score ${score}/100 — proche de la conversion`,ic:"🎯"});if(d.potential==="A"&&score==null)opps.push({type:"warn",doctor:d,reason:"Potentiel A non encore évalué",ic:"⭐"});const sorted=[...(reports[d.id]||[])].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));if(sorted.length>0){const days=(now-new Date(sorted[0].createdAt))/86400000;if(days>45&&score!=null&&score>=50)opps.push({type:"risk",doctor:d,reason:`Pas vu depuis ${Math.round(days)}j — risque de refroidissement`,ic:"⚠️"});}if((reports[d.id]||[]).length===0&&d.potential==="A")opps.push({type:"warn",doctor:d,reason:"Potentiel A — aucun compte-rendu",ic:"🆕"});});const seen=new Set();return opps.filter(o=>{if(seen.has(o.doctor.id))return false;seen.add(o.doctor.id);return true;}).slice(0,8);}
export function buildAssistantContext(doctors,reports,planning,specialty,product,accounts=[]){
  const evaluated=doctors.filter(d=>d.adoptionScore!=null);
  const chauds=evaluated.filter(d=>d.adoptionScore>=76);
  const near=evaluated.filter(d=>d.adoptionScore>=50&&d.adoptionScore<76);
  const today=ymd(new Date());
  const todayDocs=(planning?.[today]||[]).map(id=>doctors.find(d=>d.id===id)).filter(Boolean);
  const lastVisitMap={};
  Object.entries(reports).forEach(([id,rList])=>{if(rList?.length){const sorted=[...rList].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));lastVisitMap[id]=sorted[0].createdAt;}});const notSeen=doctors.filter(d=>{const lv=lastVisitMap[d.id];if(!lv)return true;return(Date.now()-new Date(lv))/86400000>60;});
  
  return`
--- CONTEXTE UTILISATEUR ---
Profil : Délégué Médical ${specialty?`(${specialty})`:""}
Produit : ${product||"Non spécifié"}

--- CONTEXTE TERRAIN ---
Médecins total : ${doctors.length}
Chauds (≥76) : ${chauds.length} — ${chauds.slice(0,3).map(d=>d.name).join(", ")}
Proches conversion : ${near.length}
Non vus 60j+ : ${notSeen.length}
Aujourd'hui planifiés : ${todayDocs.length?todayDocs.map(d=>d.name).join(", "):"aucun"}

--- COMPTES (KAM) ---
Comptes suivis : ${accounts.length}${accounts.length?` — dont ${accounts.filter(a=>a.tier==="A").length} de niveau A`:""}
${accounts.slice(0,8).map(a=>{const list=doctors.filter(d=>d.accountId===a.id);const champs=list.filter(d=>Number(d.influence)>=4&&Number(d.support)>=4).length;const blocks=list.filter(d=>Number(d.influence)>=4&&Number(d.support)<=2).length;return `- ${a.name} (${a.city||"?"}, niveau ${a.tier}) : ${list.length} contacts, ${champs} champion(s), ${blocks} opposant(s)${a.objective?`, objectif : ${a.objective}`:""}`;}).join("\n")||"- aucun compte enregistré"}
---`;
}
export function probaLabel(p){if(!p)return null;const t=p.toLowerCase();if(t.includes("élevée")||t.includes("elevee")||(parseInt(t)>=65))return{lbl:"Élevée",cls:"high",ic:"🟢"};if(t.includes("moyenne")||(parseInt(t)>=35))return{lbl:"Moyenne",cls:"med",ic:"🟡"};return{lbl:"Faible",cls:"low",ic:"🔴"};}
export function priorityBadgeClass(level){const v=(level||"").toLowerCase();if(v==="haute")return "tA";if(v==="moyenne")return "tB";return "tC";}
export function scoreColor(score){if(score==null)return"var(--t2)";if(score>=76)return"var(--teal)";if(score>=51)return"var(--blue)";if(score>=26)return"var(--amber)";return"var(--rose)";}
