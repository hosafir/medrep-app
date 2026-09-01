import { getDefaultFrequency } from "./frequency.js";
import { buildHeaderMap, looksLikeCity, normalizeCity, normalizeKey, normalizePotential, normalizeText, stableSortDocs, valueAt } from "./normalize.js";

export function normalizeDoctorRow(row,hm,fi){
  const rn=normalizeText(valueAt(row,hm.name)),rc=normalizeText(valueAt(row,hm.city)),rs=normalizeText(valueAt(row,hm.sector)),sp=normalizeText(valueAt(row,hm.specialite));
  let city=normalizeCity(rc),sector=rs;
  if((!city||city===normalizeCity(rs))&&looksLikeCity(rs)){city=normalizeCity(rs);sector="";}
  if(!sector&&sp)sector=sp;else if(sector&&sp&&!normalizeKey(sector).includes(normalizeKey(sp)))sector=`${sector} · ${sp}`;
  const doc={
    id:Number(valueAt(row,hm.id))||fi,
    name:rn,
    city,
    sector,
    potential:normalizePotential(valueAt(row,hm.potential)),
    phone:normalizeText(valueAt(row,hm.phone)),
    email:normalizeText(valueAt(row,hm.email)).toLowerCase(),
    activite:normalizeText(valueAt(row,hm.activite))||"Privé",
    adoptionScore:null,
    mainObjection:"",
    nextVisitGoal:"",
    priorityLevel:"",
    visitFrequency: getDefaultFrequency(normalizePotential(valueAt(row,hm.potential))),
    product: "Fumetil" // Default product on import
  };
  if(!doc.name||!doc.city)return null;
  return doc;
}
export function dedupeDoctors(list){const seen=new Map();for(const d of list){const key=`${normalizeKey(d.name)}__${normalizeKey(d.city)}__${normalizeKey(d.sector)}`;if(!seen.has(key))seen.set(key,d);else{const prev=seen.get(key);seen.set(key,{...prev,...d,phone:d.phone||prev.phone,email:d.email||prev.email,activite:d.activite||prev.activite,potential:d.potential||prev.potential,adoptionScore:d.adoptionScore??prev.adoptionScore??null,mainObjection:d.mainObjection||prev.mainObjection||"",nextVisitGoal:d.nextVisitGoal||prev.nextVisitGoal||"",priorityLevel:d.priorityLevel||prev.priorityLevel||""});}}return Array.from(seen.values());}
export function parseCSVSmart(text){const rows=[];let row=[],cur="",inQ=false;for(let i=0;i<text.length;i++){const ch=text[i],nx=text[i+1];if(ch==='"'){if(inQ&&nx==='"'){cur+='"';i++;}else inQ=!inQ;}else if(ch===","&&!inQ){row.push(cur);cur="";}else if((ch==="\n"||ch==="\r")&&!inQ){if(ch==="\r"&&nx==="\n")i++;row.push(cur);rows.push(row);row=[];cur="";}else cur+=ch;}if(cur.length||row.length){row.push(cur);rows.push(row);}return rows.map(r=>r.map(c=>c.trim())).filter(r=>r.some(c=>normalizeText(c)));}
export async function importDoctorsFromFile(file){
  // Chargement dynamique de XLSX (divise la taille du bundle initial par 2)
  const XLSX = await import("xlsx");
  
  const name=file.name.toLowerCase();
  if(name.endsWith(".json")){
    const txt=await file.text();
    const json=JSON.parse(txt);
    const list=Array.isArray(json?.doctors)?json.doctors:Array.isArray(json)?json:[];
    const out=list.map((d,i)=>({
      id:Number(d.id)||i+1,
      name:normalizeText(d.name),
      city:normalizeCity(d.city),
      sector:normalizeText(d.sector),
      potential:normalizePotential(d.potential),
      phone:normalizeText(d.phone),
      email:normalizeText(d.email).toLowerCase(),
      activite:normalizeText(d.activite)||"Privé",
      adoptionScore:d?.adoptionScore??null,
      mainObjection:d?.mainObjection??"",
      nextVisitGoal:d?.nextVisitGoal??"",
      priorityLevel:d?.priorityLevel??"",
      visitFrequency:d?.visitFrequency||"quarterly",
      product:d?.product||"Fumetil"
    })).filter(d=>d.name&&d.city);
    return stableSortDocs(dedupeDoctors(out));
  }
  if(name.endsWith(".csv")){
    const txt=await file.text();
    const rows=parseCSVSmart(txt);
    if(rows.length<2)throw new Error("CSV vide.");
    const hm=buildHeaderMap(rows[0]);
    if(hm.name<0||(hm.city<0&&hm.sector<0))throw new Error("Colonnes introuvables.");
    const out=rows.slice(1).map((r,i)=>normalizeDoctorRow(r,hm,i+1)).filter(Boolean);
    return stableSortDocs(dedupeDoctors(out));
  }
  if(name.endsWith(".xlsx")||name.endsWith(".xls")){
    const buf=await file.arrayBuffer();
    // Utilisation de XLSX chargé dynamiquement
    const wb=XLSX.read(buf,{type:"array"});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:""});
    if(rows.length<2)throw new Error("Excel vide.");
    const hm=buildHeaderMap(rows[0]);
    if(hm.name<0||(hm.city<0&&hm.sector<0))throw new Error("Colonnes introuvables.");
    const out=rows.slice(1).map((r,i)=>normalizeDoctorRow(r,hm,i+1)).filter(Boolean);
    return stableSortDocs(dedupeDoctors(out));
  }
  throw new Error("Format non supporté (.xlsx/.csv/.json)");
}
