export const MFR=["Jan","Fév","Mars","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
export const DFR=["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
export const CLUSTER=["Rabat","Temara","Salé","Kénitra"];
export function ymd(dt){const d=new Date(dt);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
export function monthKey(year,mi){return `${year}-${String(mi+1).padStart(2,"0")}`;}
export function isWeekday(dt){const d=new Date(dt).getDay();return d>=1&&d<=5;}
export function isWedThu(dt){const d=new Date(dt).getDay();return d===3||d===4;}
export function listWorkdays(year,mi){const s=new Date(year,mi,1),e=new Date(year,mi+1,0),out=[];for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1))if(isWeekday(d))out.push(ymd(d));return out;}
export const tNow=()=>new Date().toLocaleTimeString("fr",{hour:"2-digit",minute:"2-digit"});
export const dtNowISO=()=>new Date().toISOString();

export function groupWorkdaysByWeek(wds){const weeks=[];let cur=[];for(const day of wds){const d=new Date(day),wd=d.getDay();if(wd===1&&cur.length){weeks.push(cur);cur=[];}cur.push(day);if(wd===5){weeks.push(cur);cur=[];}}if(cur.length)weeks.push(cur);return weeks;}
