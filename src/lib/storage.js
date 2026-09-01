/* ─── Storage helpers ─── */
export function loadJSON(key,fallback){try{const r=localStorage.getItem(key);if(!r)return fallback;return JSON.parse(r);}catch{return fallback;}}
export function saveJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{ /* quota localStorage dépassé */ }}

/* ─── IndexedDB Storage (Audio + Knowledge Files) ─── */
export const AUDIO_DB="medrep_audio_db_v1", AUDIO_STORE="audios", KNOWLEDGE_STORE="knowledge_files";
export function idbOpen(){return new Promise((res,rej)=>{const req=indexedDB.open(AUDIO_DB,1);req.onupgradeneeded=()=>{const db=req.result;
  if(!db.objectStoreNames.contains(AUDIO_STORE))db.createObjectStore(AUDIO_STORE);
  if(!db.objectStoreNames.contains(KNOWLEDGE_STORE))db.createObjectStore(KNOWLEDGE_STORE);
};req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);});}
export async function idbPut(storeName, key, value){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).put(value, key);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}
export async function idbGet(storeName, key){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readonly");const rq=tx.objectStore(storeName).get(key);rq.onsuccess=()=>res(rq.result||null);rq.onerror=()=>rej(tx.error);});}
export async function idbGetAll(storeName){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readonly");const rq=tx.objectStore(storeName).getAll();rq.onsuccess=()=>res(rq.result||[]);rq.onerror=()=>rej(tx.error);});}
export async function idbDel(storeName, key){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).delete(key);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}
export async function idbClearAll(){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction([AUDIO_STORE, KNOWLEDGE_STORE],"readwrite");tx.objectStore(AUDIO_STORE).clear();tx.objectStore(KNOWLEDGE_STORE).clear();tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}
export const saveAudio = (key, blob) => idbPut(AUDIO_STORE, key, blob);
export const getAudio = (key) => idbGet(AUDIO_STORE, key);
export const deleteAudio = (key) => idbDel(AUDIO_STORE, key);
export const saveKnowledgeFile = (key, blob) => idbPut(KNOWLEDGE_STORE, key, blob);
export const getKnowledgeFile = (key) => idbGet(KNOWLEDGE_STORE, key);
export const getAllKnowledgeFiles = () => idbGetAll(KNOWLEDGE_STORE);
export const deleteKnowledgeFile = (key) => idbDel(KNOWLEDGE_STORE, key);

/* ─── Backup ─── */
export async function exportBackup({includeAudio=true}={}){
  const payload={version:1,exportedAt:new Date().toISOString(),localStorage:{},audio:includeAudio?{}:null};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k)continue;if(k.startsWith("medrep_"))payload.localStorage[k]=localStorage.getItem(k);}
  if(includeAudio){try{const db=await idbOpen();const tx=db.transaction(AUDIO_STORE,"readonly");const store=tx.objectStore(AUDIO_STORE);const keys=await new Promise(r=>{const rq=store.getAllKeys();rq.onsuccess=()=>r(rq.result||[]);rq.onerror=()=>r([]);});for(const key of keys){const blob=await new Promise(r=>{const rq=store.get(key);rq.onsuccess=()=>r(rq.result||null);rq.onerror=()=>r(null);});if(!blob)continue;const buf=await blob.arrayBuffer();payload.audio[key]={type:blob.type||"audio/webm",bytes:Array.from(new Uint8Array(buf))};}}catch(e){console.warn("Audio export skipped:",e);}}
  const blob=new Blob([JSON.stringify(payload)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="medrep_backup.json";a.click();URL.revokeObjectURL(url);
}
export async function importBackup(file,{includeAudio=true}={}){
  const text=await file.text();const payload=JSON.parse(text);
  const ls=payload?.localStorage||{};for(const k of Object.keys(ls))localStorage.setItem(k,ls[k]);
  if(includeAudio&&payload?.audio){try{const db=await idbOpen();const tx=db.transaction(AUDIO_STORE,"readwrite");const store=tx.objectStore(AUDIO_STORE);for(const key of Object.keys(payload.audio)){const item=payload.audio[key];if(!item?.bytes)continue;const bytes=new Uint8Array(item.bytes);const blob=new Blob([bytes],{type:item.type||"audio/webm"});store.put(blob,key);}await new Promise(r=>{tx.oncomplete=()=>r(true);tx.onerror=()=>r(true);});}catch(e){console.warn("Audio import skipped:",e);}}
  alert("Backup importé ✅ Recharge la page pour appliquer.");
}
