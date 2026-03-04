// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
  GLOBAL STYLE
───────────────────────────────────────────────────────────── */
const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --navy:#0a0f1e;--navy2:#111827;--navy3:#1a2235;--navy4:#243047;
      --teal:#00d4aa;--teal2:#00b891;--tealglow:rgba(0,212,170,0.15);
      --amber:#f59e0b;--rose:#f43f5e;--violet:#8b5cf6;--blue:#3b82f6;
      --t1:#f0f4ff;--t2:#9aa5c0;--t3:#5a6785;
      --bdr:rgba(255,255,255,0.07);--bdra:rgba(0,212,170,0.3);
      --glass:rgba(26,34,53,0.9);
      --fd:'Syne',sans-serif;--fb:'DM Sans',sans-serif;
    }
    body{background:var(--navy);color:var(--t1);font-family:var(--fb);overflow:hidden}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--navy4);border-radius:2px}
    .root{display:flex;height:100vh;width:100%;overflow:hidden}
    .bg{position:fixed;inset:0;z-index:0;pointer-events:none;
      background:radial-gradient(ellipse 60% 50% at 10% 20%,rgba(0,212,170,0.06) 0%,transparent 60%),
      radial-gradient(ellipse 40% 60% at 90% 80%,rgba(139,92,246,0.05) 0%,transparent 60%),var(--navy)}
    .sb{width:240px;flex-shrink:0;height:100vh;background:rgba(17,24,39,0.97);backdrop-filter:blur(20px);
      border-right:1px solid var(--bdr);z-index:10;display:flex;flex-direction:column}
    .sb-logo{padding:18px 16px 14px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;gap:10px}
    .logo-ic{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--teal),#00a884);
      display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;box-shadow:0 0 15px var(--tealglow)}
    .logo-t{font-family:var(--fd);font-size:14px;font-weight:700;line-height:1.1}
    .logo-s{font-size:10px;color:var(--t3);letter-spacing:.04em}
    .sb-nav{flex:1;padding:10px 8px;overflow-y:auto}
    .nav-sec{margin-bottom:16px}
    .nav-lbl{font-size:9px;font-weight:600;letter-spacing:.12em;color:var(--t3);text-transform:uppercase;padding:0 8px 6px}
    .nav-it{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;cursor:pointer;
      font-size:12.5px;color:var(--t2);transition:all .15s;border:1px solid transparent;margin-bottom:2px}
    .nav-it:hover{background:var(--navy3);color:var(--t1)}
    .nav-it.on{background:var(--tealglow);color:var(--teal);border-color:var(--bdra);font-weight:500}
    .nav-badge{margin-left:auto;background:var(--rose);color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px}
    .nav-badge.ok{background:var(--teal);color:var(--navy)}
    .sb-foot{padding:10px 8px;border-top:1px solid var(--bdr)}
    .u-card{display:flex;align-items:center;gap:10px;padding:8px 10px}
    .u-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--violet),var(--teal));
      display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
    .main{flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative;z-index:1}
    .topbar{height:52px;flex-shrink:0;background:rgba(10,15,30,0.7);backdrop-filter:blur(20px);
      border-bottom:1px solid var(--bdr);display:flex;align-items:center;padding:0 20px;gap:12px}
    .tb-title{font-family:var(--fd);font-size:16px;font-weight:700;flex:1}
    .content{flex:1;overflow-y:auto;padding:20px}
    .btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:12px;
      font-weight:500;cursor:pointer;transition:all .15s;border:1px solid transparent;font-family:var(--fb);user-select:none}
    .btn-p{background:var(--teal);color:var(--navy);box-shadow:0 0 12px var(--tealglow)}
    .btn-p:hover{background:var(--teal2);transform:translateY(-1px)}
    .btn-p:disabled{opacity:.45;cursor:default;transform:none}
    .btn-g{background:transparent;color:var(--t2);border-color:var(--bdr)}
    .btn-g:hover{background:var(--navy3);color:var(--t1)}
    .btn-blue{background:rgba(59,130,246,0.15);color:var(--blue);border-color:rgba(59,130,246,0.25)}
    .btn-blue:hover{background:rgba(59,130,246,0.25)}
    .btn-rose{background:rgba(244,63,94,0.12);color:var(--rose);border-color:rgba(244,63,94,0.25)}
    .btn-rose:hover{background:rgba(244,63,94,0.22)}
    .card{background:var(--glass);border:1px solid var(--bdr);border-radius:14px;padding:18px}
    .card-t{font-family:var(--fd);font-size:13px;font-weight:600;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
    .kpi{background:var(--glass);border:1px solid var(--bdr);border-radius:12px;padding:14px;position:relative;overflow:hidden}
    .kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--ac,var(--teal))}
    .kpi-lbl{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
    .kpi-val{font-family:var(--fd);font-size:24px;font-weight:800;line-height:1}
    .kpi-d{font-size:10px;margin-top:4px}
    .kpi-ic{position:absolute;top:12px;right:12px;font-size:18px;opacity:.2}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .tw{overflow-x:auto}
    table{width:100%;border-collapse:collapse;font-size:12px}
    thead th{text-align:left;padding:8px 11px;font-size:10px;font-weight:600;color:var(--t3);
      text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--bdr);white-space:nowrap}
    tbody tr{border-bottom:1px solid var(--bdr);transition:background .1s}
    tbody tr:hover{background:rgba(255,255,255,.025)}
    tbody td{padding:9px 11px;vertical-align:middle}
    .fg{margin-bottom:13px}
    .fl{font-size:11px;font-weight:500;color:var(--t2);margin-bottom:5px;display:block}
    .fi,.fs,.fta{width:100%;background:var(--navy3);border:1px solid var(--bdr);border-radius:8px;
      padding:9px 12px;color:var(--t1);font-family:var(--fb);font-size:13px;outline:none;transition:border-color .15s}
    .fi:focus,.fs:focus,.fta:focus{border-color:var(--bdra)}
    .fi::placeholder,.fta::placeholder{color:var(--t3)}
    .fs option{background:var(--navy2)}
    .fta{resize:vertical;min-height:90px}
    .ov{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)}
    .mo{background:var(--navy2);border:1px solid var(--bdra);border-radius:16px;padding:22px;width:100%;max-width:760px;max-height:90vh;overflow-y:auto;animation:mi .2s ease}
    @keyframes mi{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
    .mo-t{font-family:var(--fd);font-size:18px;font-weight:700;margin-bottom:4px}
    .mo-s{font-size:12px;color:var(--t2);margin-bottom:16px}
    .mo-f{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;padding-top:14px;border-top:1px solid var(--bdr)}
    .sp{width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-top-color:#4285f4;border-radius:50%;animation:spin .6s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:40px 20px;color:var(--t3);font-size:13px}
    .tag{padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700}
    .tA{background:rgba(0,212,170,.15);color:var(--teal);border:1px solid rgba(0,212,170,.2)}
    .tB{background:rgba(245,158,11,.15);color:var(--amber);border:1px solid rgba(245,158,11,.2)}
    .tC{background:rgba(90,103,133,.2);color:var(--t2);border:1px solid var(--bdr)}
    .pill{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;border:1px solid var(--bdr);color:var(--t2);font-size:11px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .sep{height:1px;background:var(--bdr);margin:12px 0}
    .mini{font-size:11px;color:var(--t3);line-height:1.6}
    .warn{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:var(--amber);padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.7}
    .ok{background:rgba(0,212,170,.10);border:1px solid rgba(0,212,170,.22);color:var(--teal);padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.7}

    /* Planning board */
    .pl-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px}
    .pl-grid{display:grid;grid-template-columns:repeat(5, minmax(210px, 1fr));gap:10px}
    .pl-day{background:var(--navy3);border:1px solid var(--bdr);border-radius:12px;overflow:hidden;min-height:220px;display:flex;flex-direction:column}
    .pl-day.cl{border-color:rgba(0,212,170,.3);background:rgba(0,212,170,.05)}
    .pl-dh{padding:10px 10px;border-bottom:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
    .pl-dn{font-size:11px;font-weight:800;font-family:var(--fd);line-height:1.2}
    .pl-sub{font-size:10px;color:var(--t3);margin-top:3px}
    .pl-vs{padding:10px;display:flex;flex-direction:column;gap:7px;flex:1}
    .chip{padding:8px 10px;border-radius:10px;background:var(--navy4);border:1px solid rgba(255,255,255,.06);
      display:flex;justify-content:space-between;gap:8px;cursor:grab}
    .chip:active{cursor:grabbing}
    .chip.dragging{opacity:.4}
    .chip-l{min-width:0}
    .chip-n{font-size:11px;font-weight:650;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .chip-s{font-size:9px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .drop-hint{border:1px dashed rgba(0,212,170,.35);background:rgba(0,212,170,.05)}
    .pl-footnote{font-size:11px;color:var(--t3);line-height:1.6;margin-top:12px}
    .imp{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
    .dropzone{
      border:1px dashed rgba(0,212,170,.35);
      background:rgba(0,212,170,.06);
      border-radius:12px;
      padding:12px;
      font-size:12px;
      color:var(--t2);
    }
  `}</style>
);

/* ─────────────────────────────────────────────────────────────
  Storage helpers (persist across closing/reopening)
───────────────────────────────────────────────────────────── */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/* ─────────────────────────────────────────────────────────────
  IndexedDB helper for audio blobs (persist)
───────────────────────────────────────────────────────────── */
const AUDIO_DB = "medrep_audio_db_v1";
const AUDIO_STORE = "audios";

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(AUDIO_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(key, blob) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, "readwrite");
    tx.objectStore(AUDIO_STORE).put(blob, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, "readonly");
    const rq = tx.objectStore(AUDIO_STORE).get(key);
    rq.onsuccess = () => resolve(rq.result || null);
    rq.onerror = () => reject(rq.error);
  });
}
async function idbDel(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, "readwrite");
    tx.objectStore(AUDIO_STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/* ─────────────────────────────────────────────────────────────
  Utils
───────────────────────────────────────────────────────────── */
const MFR = ["Jan", "Fév", "Mars", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const DFR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Cluster Rabat+ (Mer/Jeu uniquement)
const CLUSTER = ["Rabat", "Temara", "Salé", "Kénitra"];

function ymd(dt) {
  const d = new Date(dt);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}
function isWeekday(dt) {
  const d = new Date(dt).getDay();
  return d >= 1 && d <= 5;
}
function isWedThu(dt) {
  const d = new Date(dt).getDay();
  return d === 3 || d === 4;
}
function startOfMonth(year, monthIndex) {
  return new Date(year, monthIndex, 1);
}
function endOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0);
}
function listWorkdays(year, monthIndex) {
  const s = startOfMonth(year, monthIndex);
  const e = endOfMonth(year, monthIndex);
  const out = [];
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    if (isWeekday(d)) out.push(ymd(d));
  }
  return out;
}
const tNow = () => new Date().toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" });
const dtNowISO = () => new Date().toISOString();

function parseCSV(text) {
  // CSV simple (séparateur virgule ou point-virgule), première ligne = headers
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim());
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));
    rows.push(obj);
  }
  return rows;
}

function normalizePotential(p) {
  const v = String(p || "").trim().toUpperCase();
  if (v === "A" || v === "B" || v === "C") return v;
  return "C";
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "DM";
  const a = parts[0]?.[0] || "D";
  const b = parts[1]?.[0] || "M";
  return (a + b).toUpperCase();
}

/* ─────────────────────────────────────────────────────────────
  Providers (Gemini fixed)
───────────────────────────────────────────────────────────── */
const PROVIDERS = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    icon: "✦",
    color: "#4285f4",
    models: ["gemini-1.5-flash", "gemini-1.5-pro"],
    defaultModel: "gemini-1.5-flash",
    detect: (key) => key.startsWith("AIza"),
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    icon: "◐",
    color: "#10a37f",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
    detect: (key) => key.startsWith("sk-") && !key.startsWith("sk-ant-"),
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    icon: "◈",
    color: "#d97706",
    models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
    defaultModel: "claude-3-5-sonnet-20241022",
    detect: (key) => key.startsWith("sk-ant-"),
  },
  groq: {
    id: "groq",
    name: "Groq",
    icon: "⚡",
    color: "#f55036",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    defaultModel: "llama-3.3-70b-versatile",
    detect: (key) => key.startsWith("gsk_"),
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    icon: "🔀",
    color: "#6366f1",
    models: ["google/gemini-1.5-flash", "openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet"],
    defaultModel: "google/gemini-1.5-flash",
    detect: (key) => key.startsWith("sk-or-"),
  },
};

function detectProvider(apiKey) {
  if (!apiKey) return null;
  const key = apiKey.trim();
  const order = ["anthropic", "groq", "openrouter", "gemini", "openai"];
  for (const id of order) {
    if (PROVIDERS[id]?.detect?.(key)) return PROVIDERS[id];
  }
  if (key.startsWith("sk-")) return PROVIDERS.openai;
  return null;
}

const SYS_PROMPT =
  "Tu es un assistant expert pour délégués médicaux au Maroc (terrain). " +
  "Tu aides à structurer des comptes-rendus de visite, qualifier l'intérêt, objections, prochaines étapes. " +
  "Tu respectes la compliance pharma: pas de promesses thérapeutiques, rester factuel et actionnable. " +
  "Réponds en français, format clair: Résumé / Signaux / Objections / Prochaines actions / Objectif next visit.";

/* ─────────────────────────────────────────────────────────────
  LLM calls
───────────────────────────────────────────────────────────── */
async function callGemini(prompt, apiKey, model, sys) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;
  const body = {
    system_instruction: { parts: [{ text: sys }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let msg = `Erreur Gemini HTTP ${r.status}`;
    try {
      const e = await r.json();
      msg = e?.error?.message || msg;
    } catch {}
    if (r.status === 404) msg += " — Modèle introuvable. Essaie gemini-1.5-flash.";
    throw new Error(msg);
  }
  const d = await r.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || "Pas de réponse.";
}

async function callOpenAILike(url, prompt, apiKey, model, sys) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 1400,
    }),
  });
  if (!r.ok) {
    let msg = `Erreur HTTP ${r.status}`;
    try {
      const e = await r.json();
      msg = e?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  const d = await r.json();
  return d?.choices?.[0]?.message?.content || "Pas de réponse.";
}

async function callLLM(prompt, apiKey, provider, model, systemPrompt = SYS_PROMPT) {
  const p = provider || detectProvider(apiKey);
  if (!p) throw new Error("Provider non reconnu. Vérifie ta clé API.");
  const m = model || p.defaultModel;

  if (p.id === "gemini") return callGemini(prompt, apiKey, m, systemPrompt);

  const urls = {
    openai: "https://api.openai.com/v1/chat/completions",
    groq: "https://api.groq.com/openai/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
  };
  if (!urls[p.id]) throw new Error(`Provider ${p.name} non supporté dans cette version.`);
  return callOpenAILike(urls[p.id], prompt, apiKey, m, systemPrompt);
}

/* ─────────────────────────────────────────────────────────────
  Default doctors (will be replaced by your saved list)
───────────────────────────────────────────────────────────── */
const DOCS = [
  { id: 1, name: "Dr. Lyoussi Mouna", city: "Temara", sector: "", potential: "B", phone: "", email: "", activite: "Privé" },
  { id: 2, name: "Dr. Moutie Wafaa", city: "Rabat", sector: "", potential: "A", phone: "", email: "", activite: "Privé" },
  { id: 3, name: "Dr. El Fakir Wafaa", city: "Temara", sector: "", potential: "B", phone: "", email: "", activite: "Privé" },
  { id: 4, name: "Dr. Jouehari Abdelhafid", city: "Rabat", sector: "", potential: "A", phone: "", email: "", activite: "Privé" },
  { id: 5, name: "Dr. Haiat Sara", city: "Temara", sector: "", potential: "A", phone: "", email: "", activite: "Privé" },
];

/* ─────────────────────────────────────────────────────────────
  Pages: NoApi banner
───────────────────────────────────────────────────────────── */
function NoApiBanner({ setPage }) {
  return (
    <div className="content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
      <div className="card" style={{ maxWidth: 720 }}>
        <div style={{ fontSize: 46, opacity: 0.8, marginBottom: 12 }}>🔑</div>
        <div style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Assistant IA non configuré</div>
        <div style={{ color: "var(--t2)", lineHeight: 1.7, marginBottom: 14 }}>
          Ajoute ta clé API dans <strong>Paramètres</strong>. Ensuite tu pourras analyser les comptes-rendus et générer des actions.
        </div>
        <button className="btn btn-p" onClick={() => setPage("settings")}>⚙️ Configurer mon API →</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Dashboard
───────────────────────────────────────────────────────────── */
function Dashboard({ doctors, setPage, hasApi, provider }) {
  const byCity = useMemo(() => {
    const o = {};
    doctors.forEach((d) => { o[d.city] = (o[d.city] || 0) + 1; });
    return o;
  }, [doctors]);

  const cntA = doctors.filter((d) => d.potential === "A").length;
  const cntCluster = doctors.filter((d) => CLUSTER.includes(d.city)).length;

  return (
    <div className="content">
      <div className="kpi-grid">
        <div className="kpi" style={{ "--ac": "var(--teal)" }}>
          <div className="kpi-lbl">Médecins</div><div className="kpi-val">{doctors.length}</div>
          <div className="kpi-d" style={{ color: "var(--teal)" }}>persistants</div><div className="kpi-ic">🧠</div>
        </div>
        <div className="kpi" style={{ "--ac": "var(--violet)" }}>
          <div className="kpi-lbl">Potentiel A</div><div className="kpi-val">{cntA}</div>
          <div className="kpi-d" style={{ color: "var(--teal)" }}>{doctors.length ? Math.round((cntA / doctors.length) * 100) : 0}%</div>
          <div className="kpi-ic">⭐</div>
        </div>
        <div className="kpi" style={{ "--ac": "var(--amber)" }}>
          <div className="kpi-lbl">Cluster Rabat+</div><div className="kpi-val">{cntCluster}</div>
          <div className="kpi-d" style={{ color: "var(--teal)" }}>Mer/Jeu</div><div className="kpi-ic">📍</div>
        </div>
        <div className="kpi" style={{ "--ac": "#00aaff" }}>
          <div className="kpi-lbl">Villes</div><div className="kpi-val">{Object.keys(byCity).length}</div>
          <div className="kpi-d" style={{ color: "var(--teal)" }}>couvertes</div><div className="kpi-ic">🗺️</div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-t">Accès rapide</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-p" onClick={() => setPage("planning")}>📅 Planning</button>
            <button className="btn btn-g" onClick={() => setPage("doctors")}>👨‍⚕️ Médecins</button>
            <button className="btn btn-blue" onClick={() => setPage("reports")}>📝 Comptes-rendus</button>
          </div>
          <div className="mini" style={{ marginTop: 12 }}>
            Tout est sauvegardé automatiquement (planning + médecins + comptes-rendus + actions IA).
          </div>
        </div>

        <div className="card">
          <div className="card-t">
            Assistant IA{" "}
            {hasApi ? (
              <span className="pill" style={{ borderColor: (provider?.color || "var(--teal)") + "55" }}>
                <span style={{ color: provider?.color }}>{provider?.icon}</span> {provider?.name}
              </span>
            ) : (
              <span className="pill" style={{ borderColor: "rgba(244,63,94,.35)", color: "var(--rose)" }}>OFF</span>
            )}
          </div>
          {hasApi ? (
            <div className="ok">✅ IA active : tu peux analyser les comptes-rendus et générer des actions “next visit”.</div>
          ) : (
            <div className="warn">⚠️ Configure une clé API (Gemini/…) pour activer l’analyse IA.</div>
          )}
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-g" onClick={() => setPage("settings")}>⚙️ Paramètres</button>
            <button className="btn btn-blue" onClick={() => setPage("reports")}>📝 Comptes-rendus</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Settings Page
───────────────────────────────────────────────────────────── */
function SettingsPage({ apiKey, setApiKey, model, setModel, provider, setProvider }) {
  const [draft, setDraft] = useState(apiKey || "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [manualProvider, setManualProvider] = useState(null);

  const detectedProvider = detectProvider(draft);
  const activeProvider = manualProvider || detectedProvider;

  const testKey = async () => {
    const key = draft.trim();
    if (!key) return;
    setTesting(true);
    setTestResult(null);
    try {
      const p = activeProvider || detectProvider(key);
      if (!p) throw new Error("Provider non reconnu. Vérifie le format de la clé.");
      const m = model || p.defaultModel;
      await callLLM("Réponds uniquement par: OK", key, p, m, "Tu réponds seulement OK.");
      setTestResult({ ok: true, msg: `✓ Connexion ${p.name} réussie` });
      setApiKey(key);
      setProvider(p);
      setModel(p.defaultModel);
    } catch (e) {
      setTestResult({ ok: false, msg: `✗ ${e.message}` });
    }
    setTesting(false);
  };

  const save = () => {
    const key = draft.trim();
    const p = activeProvider || detectProvider(key);
    setApiKey(key);
    if (p) {
      setProvider(p);
      setModel(p.defaultModel);
    }
    setTestResult({ ok: true, msg: "✓ Sauvegardé (persistant)." });
  };

  return (
    <div className="content" style={{ maxWidth: 820 }}>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-t">🔑 Clé API</div>
        <div className="mini" style={{ marginBottom: 10 }}>
          Colle ta clé (Gemini commence par <b>AIza</b>). Elle est stockée dans ton navigateur (localStorage).
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            className="fi"
            type="password"
            placeholder="AIzaSy... / sk-..."
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setManualProvider(null); setTestResult(null); }}
            style={{ flex: 1, fontFamily: "monospace" }}
          />
          <button className="btn btn-blue" onClick={testKey} disabled={testing || !draft.trim()}>
            {testing ? <><span className="sp" style={{ borderTopColor: "var(--blue)" }} /> Test...</> : "Tester"}
          </button>
          <button className="btn btn-p" onClick={save} disabled={!draft.trim()}>Sauvegarder</button>
        </div>

        {testResult && (
          <div style={{
            marginTop: 10,
            padding: "9px 14px",
            borderRadius: 10,
            fontSize: 12,
            background: testResult.ok ? "rgba(0,212,170,.1)" : "rgba(244,63,94,.1)",
            color: testResult.ok ? "var(--teal)" : "var(--rose)",
            border: `1px solid ${testResult.ok ? "rgba(0,212,170,.2)" : "rgba(244,63,94,.2)"}`
          }}>
            {testResult.msg}
          </div>
        )}
      </div>

      {activeProvider && (
        <div className="card">
          <div className="card-t" style={{ color: activeProvider.color }}>
            {activeProvider.icon} Modèle ({activeProvider.name})
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeProvider.models.map((m) => (
              <button
                key={m}
                className={`btn ${model === m ? "btn-p" : "btn-g"}`}
                style={model === m ? { background: activeProvider.color } : {}}
                onClick={() => setModel(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="mini" style={{ marginTop: 10 }}>
            Astuce 404 : garde <b>gemini-1.5-flash</b>.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Doctors Page (list + edit + persist + CSV/JSON import/export)
───────────────────────────────────────────────────────────── */
function DoctorsPage({ doctors, setDoctors }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [dropOn, setDropOn] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter((d) =>
      (d.name || "").toLowerCase().includes(s) ||
      (d.city || "").toLowerCase().includes(s) ||
      (d.sector || "").toLowerCase().includes(s) ||
      (d.potential || "").toLowerCase().includes(s) ||
      (d.phone || "").toLowerCase().includes(s) ||
      (d.email || "").toLowerCase().includes(s)
    );
  }, [doctors, q]);

  const nextId = useMemo(() => (doctors.reduce((m, d) => Math.max(m, d.id || 0), 0) + 1), [doctors]);

  const upsert = (doc) => {
    setDoctors((prev) => {
      const exists = prev.some((x) => x.id === doc.id);
      if (exists) return prev.map((x) => (x.id === doc.id ? doc : x));
      return [...prev, doc].sort((a, b) => (a.city || "").localeCompare(b.city || "") || (a.name || "").localeCompare(b.name || ""));
    });
  };

  const remove = (id) => {
    if (!window.confirm("Supprimer ce médecin ?")) return;
    setDoctors((prev) => prev.filter((x) => x.id !== id));
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(doctors, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medecins.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ["name", "city", "sector", "potential", "phone", "email", "activite"];
    const lines = [headers.join(";")];
    doctors.forEach((d) => {
      const row = headers.map((h) => String(d[h] ?? "").replaceAll(";", ","));
      lines.push(row.join(";"));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medecins.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromFile = async (file) => {
    const name = (file?.name || "").toLowerCase();
    const text = await file.text();

    let imported = [];
    if (name.endsWith(".json")) {
      try {
        const arr = JSON.parse(text);
        if (!Array.isArray(arr)) throw new Error("JSON invalide (attendu: tableau).");
        imported = arr;
      } catch (e) {
        alert(`Import JSON impossible: ${e.message}`);
        return;
      }
    } else if (name.endsWith(".csv")) {
      const rows = parseCSV(text);
      imported = rows.map((r) => ({
        name: r.name || r.nom || r["médecin"] || r.medecin || "",
        city: r.city || r.ville || "",
        sector: r.sector || r.secteur || "",
        potential: normalizePotential(r.potential || r.potentiel || "C"),
        phone: r.phone || r.tel || r.telephone || "",
        email: r.email || "",
        activite: r.activite || r.activité || r.activité || "",
      }));
    } else {
      alert("Format non supporté. Utilise .CSV ou .JSON (pas de .XLS ici).");
      return;
    }

    // clean + assign ids + merge by (name+city) if exists
    setDoctors((prev) => {
      const maxId = prev.reduce((m, d) => Math.max(m, d.id || 0), 0);
      let id = maxId + 1;

      const keyOf = (d) => `${String(d.name || "").trim().toLowerCase()}__${String(d.city || "").trim().toLowerCase()}`;
      const prevMap = new Map(prev.map((d) => [keyOf(d), d]));

      const merged = [...prev];

      imported.forEach((raw) => {
        const d = {
          id: raw.id || null,
          name: String(raw.name || "").trim(),
          city: String(raw.city || "").trim(),
          sector: String(raw.sector || "").trim(),
          potential: normalizePotential(raw.potential),
          phone: String(raw.phone || "").trim(),
          email: String(raw.email || "").trim(),
          activite: String(raw.activite || "").trim(),
        };
        if (!d.name || !d.city) return;

        const k = keyOf(d);
        const ex = prevMap.get(k);
        if (ex) {
          const upd = {
            ...ex,
            sector: d.sector || ex.sector,
            potential: d.potential || ex.potential,
            phone: d.phone || ex.phone,
            email: d.email || ex.email,
            activite: d.activite || ex.activite,
          };
          const idx = merged.findIndex((x) => x.id === ex.id);
          if (idx >= 0) merged[idx] = upd;
        } else {
          d.id = id++;
          merged.push(d);
          prevMap.set(k, d);
        }
      });

      return merged.sort((a, b) => (a.city || "").localeCompare(b.city || "") || (a.name || "").localeCompare(b.name || ""));
    });

    alert("Import terminé ✅");
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDropOn(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await importFromFile(file);
  };

  return (
    <div className="content">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-t">
          👨‍⚕️ Liste des médecins <span className="pill">{doctors.length}</span>
        </div>

        <div className="imp" style={{ marginBottom: 10 }}>
          <input
            className="fi"
            placeholder="Recherche: nom, ville, secteur, tel, email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1, minWidth: 280 }}
          />
          <button
            className="btn btn-p"
            onClick={() => { setShowNew(true); setEditing({ id: nextId, name: "", city: "", sector: "", potential: "B", phone: "", email: "", activite: "Privé" }); }}
          >
            ➕ Ajouter
          </button>
          <button className="btn btn-g" onClick={exportCSV}>⬇︎ Export CSV</button>
          <button className="btn btn-g" onClick={exportJSON}>⬇︎ Export JSON</button>
          <label className="btn btn-blue" style={{ cursor: "pointer" }}>
            ⬆︎ Import CSV/JSON
            <input
              type="file"
              accept=".csv,.json"
              style={{ display: "none" }}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                await importFromFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <div
          className="dropzone"
          onDragOver={(e) => { e.preventDefault(); setDropOn(true); }}
          onDragLeave={() => setDropOn(false)}
          onDrop={onDrop}
          style={dropOn ? { borderColor: "rgba(0,212,170,.7)", background: "rgba(0,212,170,.09)" } : {}}
        >
          Drag & drop ici un fichier <b>.CSV</b> ou <b>.JSON</b> pour importer.
          <div className="mini" style={{ marginTop: 6 }}>
            (Si tu veux importer .XLS/.XLSX : installe “xlsx” et on l’ajoute ensuite.)
          </div>
        </div>

        <div className="mini" style={{ marginTop: 10 }}>
          Tu peux éditer téléphone/email/secteur/potentiel — tout reste sauvegardé.
        </div>
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Nom</th><th>Ville</th><th>Secteur</th><th>Potentiel</th><th>Téléphone</th><th>Email</th><th>Activité</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 700 }}>{d.name}</td>
                  <td>{d.city}</td>
                  <td>{d.sector || "—"}</td>
                  <td><span className={`tag t${d.potential}`}>{d.potential || "C"}</span></td>
                  <td>{d.phone || "—"}</td>
                  <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.email || "—"}</td>
                  <td>{d.activite || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn btn-g" onClick={() => { setShowNew(false); setEditing({ ...d }); }}>✏️ Éditer</button>
                      <button className="btn btn-rose" onClick={() => remove(d.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8}><div className="empty" style={{ padding: 20 }}>Aucun résultat.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal
          title={showNew ? "Ajouter un médecin" : "Éditer médecin"}
          subtitle="Toutes les modifications sont sauvegardées automatiquement."
          onClose={() => setEditing(null)}
          actions={[
            { label: "Annuler", kind: "g", onClick: () => setEditing(null) },
            {
              label: "Enregistrer",
              kind: "p",
              onClick: () => {
                if (!editing.name?.trim()) return alert("Nom requis.");
                if (!editing.city?.trim()) return alert("Ville requise.");
                upsert({ ...editing, potential: normalizePotential(editing.potential) });
                setEditing(null);
              },
            },
          ]}
        >
          <div className="grid2">
            <div className="fg">
              <label className="fl">Nom</label>
              <input className="fi" value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">Ville</label>
              <input className="fi" value={editing.city} onChange={(e) => setEditing((p) => ({ ...p, city: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">Secteur</label>
              <input className="fi" value={editing.sector || ""} onChange={(e) => setEditing((p) => ({ ...p, sector: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">Potentiel</label>
              <select className="fs" value={editing.potential || "B"} onChange={(e) => setEditing((p) => ({ ...p, potential: e.target.value }))}>
                <option value="A">A</option><option value="B">B</option><option value="C">C</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Téléphone</label>
              <input className="fi" value={editing.phone || ""} onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">Email</label>
              <input className="fi" value={editing.email || ""} onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">Activité</label>
              <input className="fi" value={editing.activite || ""} onChange={(e) => setEditing((p) => ({ ...p, activite: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  PLANNING GENERATOR (FINAL RULES)
  - 6 visites/jour (param)
  - Cluster Rabat/Salé/Temara/Kénitra UNIQUEMENT Mer/Jeu, mais pas tous les Mer/Jeu
  - Priorité potentiel: A puis B puis C
  - Pas de visite 2x (doublon) tant que tous les médecins n'ont pas été planifiés au moins 1 fois
  - Si besoin de répéter (pas assez de médecins), alors répétition autorisée et on favorise A puis B puis C
  - On évite les jours vides: on remplit tous les jours ouvrés jusqu'à perDay (avec répétition seulement si nécessaire)
───────────────────────────────────────────────────────────── */
function generatePlanning({ doctors, year, monthIndex, perDay, clusterDaysTarget }) {
  const workdays = listWorkdays(year, monthIndex);

  const potRank = (p) => (p === "A" ? 0 : p === "B" ? 1 : 2);

  const sortFn = (a, b) =>
    potRank(a.potential) - potRank(b.potential) ||
    (a.city || "").localeCompare(b.city || "") ||
    (a.sector || "").localeCompare(b.sector || "") ||
    (a.name || "").localeCompare(b.name || "");

  const clusterDocs = doctors.filter((d) => CLUSTER.includes(d.city)).slice().sort(sortFn);
  const otherDocs = doctors.filter((d) => !CLUSTER.includes(d.city)).slice().sort(sortFn);

  const wedThuDays = workdays.filter((d) => isWedThu(d));
  const target = Math.min(clusterDaysTarget, wedThuDays.length);

  // pick "target" days among Wed/Thu evenly (pas tous)
  const chosenClusterDays = [];
  const step = wedThuDays.length > target ? wedThuDays.length / target : 1;
  for (let i = 0; i < target; i++) {
    const idx = Math.floor(i * step);
    if (wedThuDays[idx]) chosenClusterDays.push(wedThuDays[idx]);
  }
  const clusterDays = Array.from(new Set(chosenClusterDays)).slice(0, target);

  // init
  const plan = {};
  workdays.forEach((d) => (plan[d] = []));

  const usedOnce = new Set(); // track first-time placement
  const placedCountTarget = doctors.length;

  const canPlaceDocOnDay = (doc, day) => {
    if (CLUSTER.includes(doc.city) && !isWedThu(day)) return false;
    return true;
  };

  const takeUnique = (pool, day, n) => {
    const out = [];
    for (const doc of pool) {
      if (out.length >= n) break;
      if (usedOnce.has(doc.id)) continue;
      if (!canPlaceDocOnDay(doc, day)) continue;
      usedOnce.add(doc.id);
      out.push(doc.id);
    }
    return out;
  };

  // 1) fill chosen clusterDays with cluster uniques
  for (const day of clusterDays) {
    plan[day] = plan[day].concat(takeUnique(clusterDocs, day, perDay));
  }

  // 2) fill remaining days with non-cluster uniques
  for (const day of workdays) {
    if (clusterDays.includes(day)) continue;
    const slots = perDay - plan[day].length;
    if (slots <= 0) continue;
    plan[day] = plan[day].concat(takeUnique(otherDocs, day, slots));
  }

  // 3) top-up Wed/Thu (even if not chosen cluster day) using remaining cluster uniques
  for (const day of workdays) {
    const slots = perDay - plan[day].length;
    if (slots <= 0) continue;
    if (!isWedThu(day)) continue;
    plan[day] = plan[day].concat(takeUnique(clusterDocs, day, slots));
  }

  // after unique pass, determine if we can allow repetition to fill empty slots
  const allVisitedOnce = usedOnce.size >= placedCountTarget;

  // 4) ensure no empty days: fill all days up to perDay
  if (allVisitedOnce) {
    // repetition allowed; prefer A then B then C
    const repeatPool = doctors.slice().sort(sortFn);

    const takeRepeat = (day, n) => {
      const out = [];
      const daySet = new Set(plan[day]);
      for (const doc of repeatPool) {
        if (out.length >= n) break;
        if (!canPlaceDocOnDay(doc, day)) continue;
        if (daySet.has(doc.id)) continue; // no duplicate within same day
        out.push(doc.id);
        daySet.add(doc.id);
      }
      return out;
    };

    for (const day of workdays) {
      const slots = perDay - plan[day].length;
      if (slots <= 0) continue;
      plan[day] = plan[day].concat(takeRepeat(day, slots));
    }
  }

  // backlog = doctors never placed (if not enough slots / constraints)
  const scheduledSet = new Set(Object.values(plan).flat());
  const backlog = doctors.filter((d) => !scheduledSet.has(d.id)).map((d) => d.id);

  return {
    plan,
    backlog,
    meta: { year, monthIndex, perDay, clusterDaysTarget, clusterDays, noRepeatUntilAllVisited: true },
  };
}

/* ─────────────────────────────────────────────────────────────
  Planning Page (auto + drag & drop + persist)
───────────────────────────────────────────────────────────── */
function PlanningPage({ doctors }) {
  const [year, setYear] = useState(2026);
  const [monthIndex, setMonthIndex] = useState(2); // Mars (0=Jan)
  const [perDay, setPerDay] = useState(6);
  const [clusterDaysTarget, setClusterDaysTarget] = useState(6);

  const storageKey = useMemo(() => `medrep_planning_${monthKey(year, monthIndex)}`, [year, monthIndex]);
  const workdays = useMemo(() => listWorkdays(year, monthIndex), [year, monthIndex]);

  const [planState, setPlanState] = useState(() => {
    const saved = loadJSON(storageKey, null);
    if (saved?.plan) return saved;
    return generatePlanning({ doctors, year, monthIndex, perDay, clusterDaysTarget });
  });

  useEffect(() => {
    const saved = loadJSON(storageKey, null);
    if (saved?.plan) setPlanState(saved);
    else setPlanState(generatePlanning({ doctors, year, monthIndex, perDay, clusterDaysTarget }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, doctors.length]);

  useEffect(() => saveJSON(storageKey, planState), [storageKey, planState]);

  const docById = useMemo(() => {
    const m = new Map();
    doctors.forEach((d) => m.set(d.id, d));
    return m;
  }, [doctors]);

  const [dragId, setDragId] = useState(null);
  const [dropDay, setDropDay] = useState(null);
  const [dropBacklog, setDropBacklog] = useState(false);

  const regenerate = () => {
    const gen = generatePlanning({ doctors, year, monthIndex, perDay, clusterDaysTarget });
    setPlanState(gen);
  };

  const clearMonth = () => {
    const blank = {};
    workdays.forEach((d) => (blank[d] = []));
    setPlanState({
      plan: blank,
      backlog: doctors.map((d) => d.id),
      meta: { year, monthIndex, perDay, clusterDaysTarget, clusterDays: [] },
    });
  };

  const onDropToDay = (day) => {
    if (!dragId) return;
    setPlanState((prev) => {
      const plan = { ...prev.plan };
      Object.keys(plan).forEach((k) => { plan[k] = plan[k].filter((id) => id !== dragId); });
      const backlog = prev.backlog.filter((id) => id !== dragId);

      const doc = docById.get(dragId);
      if (doc && CLUSTER.includes(doc.city) && !isWedThu(day)) {
        // cluster only Mer/Jeu → return to backlog
        return { ...prev, plan, backlog: [dragId, ...backlog] };
      }

      plan[day] = [...(plan[day] || []), dragId];
      return { ...prev, plan, backlog };
    });

    setDragId(null);
    setDropDay(null);
    setDropBacklog(false);
  };

  const onDropToBacklog = () => {
    if (!dragId) return;
    setPlanState((prev) => {
      const plan = { ...prev.plan };
      Object.keys(plan).forEach((k) => { plan[k] = plan[k].filter((id) => id !== dragId); });
      const backlog = [dragId, ...prev.backlog.filter((id) => id !== dragId)];
      return { ...prev, plan, backlog };
    });
    setDragId(null);
    setDropDay(null);
    setDropBacklog(false);
  };

  const removeFromDay = (day, id) => {
    setPlanState((prev) => {
      const plan = { ...prev.plan, [day]: (prev.plan[day] || []).filter((x) => x !== id) };
      const backlog = [id, ...prev.backlog.filter((x) => x !== id)];
      return { ...prev, plan, backlog };
    });
  };

  const totalScheduled = Object.values(planState.plan || {}).flat().length;
  const activeDays = Object.entries(planState.plan || {}).filter(([, arr]) => (arr || []).length > 0).length;

  return (
    <div className="content">
      <div className="pl-toolbar">
        <div style={{ minWidth: 170 }}>
          <label className="fl">Mois</label>
          <select className="fs" value={monthIndex} onChange={(e) => setMonthIndex(parseInt(e.target.value, 10))}>
            {MFR.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 120 }}>
          <label className="fl">Année</label>
          <input className="fi" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value || "2026", 10))} />
        </div>
        <div style={{ minWidth: 150 }}>
          <label className="fl">Visites / jour</label>
          <input className="fi" type="number" min={3} max={12} value={perDay} onChange={(e) => setPerDay(parseInt(e.target.value || "6", 10))} />
        </div>
        <div style={{ minWidth: 210 }}>
          <label className="fl">Jours cluster (Mer/Jeu) (pas tous)</label>
          <input
            className="fi"
            type="number"
            min={0}
            max={workdays.filter(isWedThu).length}
            value={clusterDaysTarget}
            onChange={(e) => setClusterDaysTarget(parseInt(e.target.value || "6", 10))}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-p" onClick={regenerate}>⚡ Générer</button>
          <button className="btn btn-g" onClick={clearMonth}>🧹 Vider</button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="pill">📅 {activeDays} jours actifs</span>
          <span className="pill" style={{ borderColor: "rgba(0,212,170,.35)" }}>✅ {totalScheduled} planifiées</span>
        </div>
      </div>

      <div className="ok" style={{ marginBottom: 12 }}>
        ✅ Planning persistant (par mois).<br />
        ⭐ Priorité Potentiel: A → B → C.<br />
        📍 Cluster (Rabat/Salé/Temara/Kénitra) uniquement Mer/Jeu (sinon retour backlog).<br />
        🔁 Aucun médecin n’est répété tant que tous les médecins n’ont pas été planifiés au moins 1 fois.
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-t">Backlog (non planifiés) <span className="pill">{planState.backlog?.length || 0}</span></div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDropBacklog(true); setDropDay(null); }}
          onDragLeave={() => setDropBacklog(false)}
          onDrop={(e) => { e.preventDefault(); onDropToBacklog(); }}
          className={dropBacklog ? "drop-hint" : ""}
          style={{ padding: 10, borderRadius: 12, minHeight: 70 }}
        >
          {(planState.backlog || []).length === 0 && <div className="empty" style={{ padding: 18 }}>Tout est planifié ✅</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(200px, 1fr))", gap: 10 }}>
            {(planState.backlog || []).slice(0, 40).map((id) => {
              const d = docById.get(id);
              if (!d) return null;
              return (
                <div
                  key={id}
                  className={`chip ${dragId === id ? "dragging" : ""}`}
                  draggable
                  onDragStart={() => setDragId(id)}
                  onDragEnd={() => { setDragId(null); setDropBacklog(false); setDropDay(null); }}
                >
                  <div className="chip-l">
                    <div className="chip-n">{d.name}</div>
                    <div className="chip-s">{d.city}{d.sector ? ` · ${d.sector}` : ""}</div>
                  </div>
                  <span className={`tag t${d.potential}`}>{d.potential}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pl-grid">
        {workdays.map((day) => {
          const dt = new Date(day);
          const list = planState.plan?.[day] || [];
          const isClDay = isWedThu(day);

          return (
            <div
              key={day}
              className={`pl-day ${isClDay ? "cl" : ""} ${dropDay === day ? "drop-hint" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDropDay(day); setDropBacklog(false); }}
              onDragLeave={() => setDropDay(null)}
              onDrop={(e) => { e.preventDefault(); onDropToDay(day); }}
            >
              <div className="pl-dh">
                <div>
                  <div className="pl-dn" style={{ color: isClDay ? "var(--teal)" : "var(--t1)" }}>
                    {DFR[dt.getDay()]} {dt.getDate()}/{dt.getMonth() + 1}
                  </div>
                  <div className="pl-sub">{isClDay ? "📍 Mer/Jeu (cluster autorisé)" : "—"}</div>
                </div>
                <span className="pill" style={{ padding: "4px 8px" }}>{list.length}/{perDay}</span>
              </div>

              <div className="pl-vs">
                {list.length === 0 && <div style={{ fontSize: 11, color: "var(--t3)" }}>Dépose des médecins ici.</div>}
                {list.map((id) => {
                  const d = docById.get(id);
                  if (!d) return null;
                  return (
                    <div
                      key={`${day}_${id}`}
                      className={`chip ${dragId === id ? "dragging" : ""}`}
                      draggable
                      onDragStart={() => setDragId(id)}
                      onDragEnd={() => { setDragId(null); setDropBacklog(false); setDropDay(null); }}
                      title="Drag & drop"
                    >
                      <div className="chip-l">
                        <div className="chip-n">{d.name}</div>
                        <div className="chip-s">
                          {d.city}{d.sector ? ` · ${d.sector}` : ""}{CLUSTER.includes(d.city) ? " · 📍cluster" : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className={`tag t${d.potential}`}>{d.potential}</span>
                        <button
                          className="btn btn-g"
                          style={{ padding: "5px 8px", fontSize: 11 }}
                          onClick={() => removeFromDay(day, id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pl-footnote">💾 Tout est sauvegardé par mois. Tu peux générer puis ajuster à la main.</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Reports Page (text + dictation + audio + AI actions, persistent)
───────────────────────────────────────────────────────────── */
function ReportsPage({ doctors, apiKey, provider, model, setPage }) {
  const reportsKey = "medrep_reports_v1";
  const actionsKey = "medrep_actions_v1";

  const [selectedId, setSelectedId] = useState(doctors[0]?.id || null);
  const [reports, setReports] = useState(() => loadJSON(reportsKey, {}));
  const [actions, setActions] = useState(() => loadJSON(actionsKey, {}));

  useEffect(() => saveJSON(reportsKey, reports), [reports]);
  useEffect(() => saveJSON(actionsKey, actions), [actions]);

  const docById = useMemo(() => {
    const m = new Map();
    doctors.forEach((d) => m.set(d.id, d));
    return m;
  }, [doctors]);

  const selectedDoctor = selectedId ? docById.get(selectedId) : null;
  const doctorReports = (selectedId && reports[selectedId]) ? reports[selectedId] : [];

  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);

  // Dictation (Web Speech API)
  const [dictating, setDictating] = useState(false);
  const speechRef = useRef(null);

  const speechSupported = useMemo(() => {
    return typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const startDictation = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Dictée non supportée. Utilise Chrome/Edge.");
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (e) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0]?.transcript || "";
        if (e.results[i].isFinal) finalText += chunk + " ";
      }
      setTranscript((prev) => (prev + " " + finalText).trim());
    };
    rec.onerror = () => setDictating(false);
    rec.onend = () => setDictating(false);

    speechRef.current = rec;
    setDictating(true);
    rec.start();
  };

  const stopDictation = () => {
    try { speechRef.current?.stop(); } catch {}
    setDictating(false);
  };

  // Audio record (MediaRecorder) -> IndexedDB
  const [recording, setRecording] = useState(false);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);

  const mediaSupported = useMemo(() => typeof window !== "undefined" && navigator?.mediaDevices?.getUserMedia, []);

  const startRecording = async () => {
    if (!mediaSupported) return alert("Enregistrement audio non supporté.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecRef.current = mr;
    setRecording(true);
    mr.start();
  };

  const stopRecordingAndSave = async () => {
    if (!mediaRecRef.current) return null;
    setRecording(false);

    const mr = mediaRecRef.current;
    const done = new Promise((resolve) => {
      const prevOnStop = mr.onstop;
      mr.onstop = async () => {
        try { prevOnStop && prevOnStop(); } catch {}
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        resolve(blob);
      };
    });

    mr.stop();
    const blob = await done;
    return blob;
  };

  const addReport = async ({ audioBlob = null } = {}) => {
    if (!selectedId) return;
    const content = (text || "").trim();
    const trans = (transcript || "").trim();
    if (!content && !trans && !audioBlob) return alert("Écris un compte-rendu ou fais une dictée/audio.");

    setSaving(true);
    try {
      const rId = `r_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      let audioKey = null;

      if (audioBlob) {
        audioKey = `audio_${rId}`;
        await idbPut(audioKey, audioBlob);
      }

      const item = { id: rId, createdAt: dtNowISO(), text: content, transcript: trans, audioKey };

      setReports((prev) => {
        const list = prev[selectedId] ? [...prev[selectedId]] : [];
        list.unshift(item);
        return { ...prev, [selectedId]: list };
      });

      setText("");
      setTranscript("");
    } finally {
      setSaving(false);
    }
  };

  const playAudio = async (audioKey) => {
    if (!audioKey) return;
    const blob = await idbGet(audioKey);
    if (!blob) return alert("Audio introuvable.");
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.onended = () => URL.revokeObjectURL(url);
    a.play();
  };

  const deleteReport = async (rid) => {
    if (!selectedId) return;
    if (!window.confirm("Supprimer ce compte-rendu ?")) return;

    const rep = doctorReports.find((x) => x.id === rid);
    if (rep?.audioKey) {
      try { await idbDel(rep.audioKey); } catch {}
    }

    setReports((prev) => {
      const list = (prev[selectedId] || []).filter((x) => x.id !== rid);
      return { ...prev, [selectedId]: list };
    });
  };

  // AI analysis → next actions per doctor
  const [analyzing, setAnalyzing] = useState(false);
  const [aiErr, setAiErr] = useState("");

  const analyze = async () => {
    if (!apiKey) return setPage("settings");
    if (!selectedDoctor) return;

    const last = doctorReports.slice(0, 3);
    if (last.length === 0) return alert("Ajoute au moins un compte-rendu avant l’analyse IA.");

    const prompt = `
Médecin:
- Nom: ${selectedDoctor.name}
- Ville: ${selectedDoctor.city}
- Secteur: ${selectedDoctor.sector || "—"}
- Potentiel: ${selectedDoctor.potential || "—"}
- Tel: ${selectedDoctor.phone || "—"}
- Email: ${selectedDoctor.email || "—"}
- Activité: ${selectedDoctor.activite || "—"}

3 derniers comptes-rendus (le plus récent en premier):
${last.map((r, i) => `
[${i + 1}] Date: ${r.createdAt}
Texte: ${r.text || "—"}
Dictée: ${r.transcript || "—"}
`).join("\n")}

Objectif:
1) Résumer la situation (niveau d’intérêt / stade / signaux).
2) Lister les objections/contraintes.
3) Proposer un plan d’action next visit (3 à 7 actions concrètes).
4) Proposer un objectif SMART pour la prochaine visite.
5) Proposer 2 questions de découverte à poser.

Format de sortie:
- Résumé
- Signaux
- Objections
- Prochaines actions (checklist)
- Objectif next visit (SMART)
- Questions à poser
`;

    setAnalyzing(true);
    setAiErr("");
    try {
      const out = await callLLM(prompt, apiKey, provider, model);
      setActions((prev) => ({ ...prev, [selectedId]: { generatedAt: dtNowISO(), text: out } }));
    } catch (e) {
      setAiErr(e.message);
    }
    setAnalyzing(false);
  };

  if (!doctors.length) {
    return <div className="content"><div className="card"><div className="empty">Aucun médecin. Ajoute des médecins dans “Médecins”.</div></div></div>;
  }

  return (
    <div className="content">
      <div className="g2" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="card-t">🧾 Compte-rendu visite</div>

          <div className="fg">
            <label className="fl">Médecin</label>
            <select className="fs" value={selectedId || ""} onChange={(e) => setSelectedId(parseInt(e.target.value, 10))}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.city}{d.sector ? ` (${d.sector})` : ""}</option>
              ))}
            </select>
          </div>

          <div className="grid2">
            <div className="fg">
              <label className="fl">Compte-rendu (texte)</label>
              <textarea className="fta" placeholder="Ex: échanges, intérêt, objections, prochaines étapes..." value={text} onChange={(e) => setText(e.target.value)} />
            </div>

            <div className="fg">
              <label className="fl">Dictée (audio → texte)</label>
              <textarea
                className="fta"
                placeholder={speechSupported ? "Clique sur Démarrer dictée et parle..." : "Dictée non supportée sur ce navigateur."}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                <button className="btn btn-blue" disabled={!speechSupported || dictating} onClick={startDictation}>🎙️ Démarrer dictée</button>
                <button className="btn btn-g" disabled={!dictating} onClick={stopDictation}>⏹️ Stop</button>
              </div>
              <div className="mini" style={{ marginTop: 8 }}>Dictée = Web Speech API (Chrome/Edge conseillé).</div>
            </div>
          </div>

          <div className="sep" />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn btn-p" disabled={saving} onClick={() => addReport({ audioBlob: null })}>
              {saving ? <span className="sp" /> : "💾 Sauvegarder compte-rendu"}
            </button>

            <button className="btn btn-g" onClick={() => { setText(""); setTranscript(""); }}>🧹 Effacer champs</button>

            <span className="pill" style={{ marginLeft: "auto" }}>{doctorReports.length} CR enregistrés</span>
          </div>

          <div className="sep" />

          <div className="card-t" style={{ marginBottom: 8 }}>🎧 Enregistrement audio (optionnel)</div>
          <div className="mini" style={{ marginBottom: 10 }}>
            Si tu veux garder aussi l’audio, tu peux l’enregistrer. Le fichier est sauvegardé en IndexedDB (persistant).
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-blue" disabled={!mediaSupported || recording} onClick={startRecording}>⏺️ Enregistrer</button>
            <button
              className="btn btn-g"
              disabled={!recording}
              onClick={async () => {
                const blob = await stopRecordingAndSave();
                await addReport({ audioBlob: blob });
              }}
            >
              ⏹️ Stop + Sauvegarder
            </button>
            {!mediaSupported && <span className="pill" style={{ borderColor: "rgba(245,158,11,.35)", color: "var(--amber)" }}>Audio non supporté</span>}
          </div>
        </div>

        <div className="card">
          <div className="card-t">
            🤖 Actions proposées (IA)
            <span className="pill" style={{ borderColor: apiKey ? "rgba(0,212,170,.35)" : "rgba(244,63,94,.35)", color: apiKey ? "var(--teal)" : "var(--rose)" }}>
              {apiKey ? "IA ON" : "IA OFF"}
            </span>
          </div>

          {!apiKey && (
            <div className="warn" style={{ marginBottom: 10 }}>
              ⚠️ Configure l’API dans Paramètres pour analyser les comptes-rendus.
            </div>
          )}

          <button className="btn btn-p" onClick={analyze} disabled={!apiKey || analyzing || !selectedDoctor}>
            {analyzing ? <><span className="sp" /> Analyse…</> : "⚡ Analyser le médecin"}
          </button>

          {aiErr && <div className="warn" style={{ marginTop: 10 }}>⚠️ {aiErr}</div>}

          <div className="sep" />

          {!actions[selectedId]?.text ? (
            <div className="empty" style={{ padding: 20 }}>Lance l’analyse IA après avoir ajouté des comptes-rendus.</div>
          ) : (
            <div>
              <div className="mini" style={{ marginBottom: 8 }}>
                Généré: {new Date(actions[selectedId].generatedAt).toLocaleString("fr-FR")}
              </div>
              <div style={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.7,
                fontSize: 13,
                background: "rgba(255,255,255,.02)",
                border: "1px solid var(--bdr)",
                borderRadius: 12,
                padding: 12
              }}>
                {actions[selectedId].text}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button className="btn btn-g" onClick={() => navigator.clipboard.writeText(actions[selectedId].text)}>📋 Copier</button>
                <button
                  className="btn btn-rose"
                  onClick={() => {
                    if (window.confirm("Supprimer les actions IA pour ce médecin ?")) setActions((p) => ({ ...p, [selectedId]: null }));
                  }}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="card">
        <div className="card-t">📚 Historique des comptes-rendus (médecin sélectionné)</div>

        {doctorReports.length === 0 ? (
          <div className="empty" style={{ padding: 22 }}>Aucun compte-rendu pour ce médecin.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {doctorReports.slice(0, 10).map((r) => (
              <div key={r.id} style={{ border: "1px solid var(--bdr)", borderRadius: 12, padding: 12, background: "rgba(255,255,255,.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 12 }}>
                    {new Date(r.createdAt).toLocaleString("fr-FR")}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {r.audioKey && <button className="btn btn-g" style={{ padding: "5px 10px" }} onClick={() => playAudio(r.audioKey)}>▶︎ Audio</button>}
                    <button className="btn btn-rose" style={{ padding: "5px 10px" }} onClick={() => deleteReport(r.id)}>🗑️</button>
                  </div>
                </div>
                <div className="mini" style={{ marginTop: 8 }}>
                  <b>Texte:</b> {r.text ? r.text.slice(0, 240) : "—"}
                </div>
                <div className="mini" style={{ marginTop: 8 }}>
                  <b>Dictée:</b> {r.transcript ? r.transcript.slice(0, 240) : "—"}
                </div>
              </div>
            ))}
          </div>
        )}

        {doctorReports.length > 10 && <div className="mini" style={{ marginTop: 10 }}>Affichage limité à 10 derniers.</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Assistant (simple chat)
───────────────────────────────────────────────────────────── */
function Assistant({ apiKey, provider, model, setPage }) {
  const [msgs, setMsgs] = useState([
    { role: "assistant", text: `Bonjour ! ${provider?.icon || "✦"}\nJe suis ton assistant IA terrain.\n\nTu veux préparer quoi ? (objections, mail, argumentaire, actions next visit…)`, time: tNow() },
  ]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const bot = useRef(null);

  useEffect(() => { bot.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = async () => {
    const m = inp.trim();
    if (!m || loading) return;
    if (!apiKey) return;
    setErr("");
    setInp("");
    setMsgs((p) => [...p, { role: "user", text: m, time: tNow() }]);
    setLoading(true);
    try {
      const r = await callLLM(m, apiKey, provider, model);
      setMsgs((p) => [...p, { role: "assistant", text: r, time: tNow() }]);
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  };

  if (!apiKey) return <NoApiBanner setPage={setPage} />;

  return (
    <div className="content" style={{ padding: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 52px)" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ marginBottom: 10, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "78%",
                background: m.role === "user" ? (provider?.color || "var(--teal)") : "var(--navy3)",
                color: m.role === "user" ? "var(--navy)" : "var(--t1)",
                border: `1px solid ${m.role === "user" ? "transparent" : "var(--bdr)"}`,
                borderRadius: 12,
                padding: "10px 12px",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                fontSize: 13,
                fontWeight: m.role === "user" ? 600 : 400,
              }}>
                {m.text}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 6, textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</div>
              </div>
            </div>
          ))}
          {loading && <div className="pill"><span className="sp" /> Génération…</div>}
          {err && <div style={{ marginTop: 10, color: "var(--rose)", fontSize: 12 }}>⚠️ {err}</div>}
          <div ref={bot} />
        </div>

        <div style={{ borderTop: "1px solid var(--bdr)", padding: 12, background: "rgba(10,15,30,0.5)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              className="fi"
              style={{ flex: 1, resize: "none" }}
              rows={2}
              placeholder="Pose ta question… (Entrée pour envoyer)"
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button className="btn btn-p" onClick={send} disabled={!inp.trim() || loading} style={{ background: provider?.color || "var(--teal)" }}>
              {loading ? <span className="sp" /> : "↑"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Modal
───────────────────────────────────────────────────────────── */
function Modal({ title, subtitle, children, onClose, actions = [] }) {
  return (
    <div className="ov" onMouseDown={onClose}>
      <div className="mo" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mo-t">{title}</div>
        {subtitle && <div className="mo-s">{subtitle}</div>}
        {children}
        <div className="mo-f">
          {actions.map((a, i) => (
            <button
              key={i}
              className={`btn ${a.kind === "p" ? "btn-p" : a.kind === "blue" ? "btn-blue" : a.kind === "rose" ? "btn-rose" : "btn-g"}`}
              onClick={a.onClick}
              disabled={a.disabled}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  APP (FINAL)
───────────────────────────────────────────────────────────── */
export default function App() {
  // Doctors persist
  const [doctors, setDoctors] = useState(() => loadJSON("medrep_doctors_v1", DOCS));
  useEffect(() => saveJSON("medrep_doctors_v1", doctors), [doctors]);

  // API persist
  const [apiKey, setApiKey] = useState(() => (localStorage.getItem("medrep_apiKey") || ""));
  const [provider, setProvider] = useState(() => detectProvider(localStorage.getItem("medrep_apiKey") || ""));
  const [model, setModel] = useState(() => (localStorage.getItem("medrep_model") || ""));

  useEffect(() => { try { localStorage.setItem("medrep_apiKey", apiKey || ""); } catch {} }, [apiKey]);
  useEffect(() => { try { localStorage.setItem("medrep_model", model || ""); } catch {} }, [model]);
  useEffect(() => { setProvider(detectProvider(apiKey)); }, [apiKey]);

  const hasApi = !!apiKey.trim();
  const [page, setPage] = useState("dashboard");

  const NAV = [
    { sec: "Principal", items: [
      { id: "dashboard", ic: "⊞", lbl: "Dashboard" },
      { id: "assistant", ic: provider?.icon || "✦", lbl: "Assistant IA", needsApi: true },
    ]},
    { sec: "Terrain", items: [
      { id: "planning", ic: "📅", lbl: "Planning visites" },
      { id: "reports", ic: "📝", lbl: "Comptes-rendus" },
      { id: "doctors", ic: "👨‍⚕️", lbl: "Médecins" },
    ]},
    { sec: "Compte", items: [
      { id: "settings", ic: "⚙️", lbl: "Paramètres" },
    ]},
  ];

  const TITLES = {
    dashboard: "Vue d'ensemble",
    assistant: `Assistant IA · ${provider?.name || "Non configuré"}`,
    planning: "Planning · Génération & optimisation",
    reports: "Comptes-rendus · Actions IA",
    doctors: "Médecins · Base & édition",
    settings: "Paramètres & API",
  };

  const render = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard doctors={doctors} setPage={setPage} hasApi={hasApi} provider={provider} />;
      case "assistant":
        return <Assistant apiKey={apiKey} provider={provider} model={model || provider?.defaultModel} setPage={setPage} />;
      case "planning":
        return <PlanningPage doctors={doctors} />;
      case "reports":
        return <ReportsPage doctors={doctors} apiKey={apiKey} provider={provider} model={model || provider?.defaultModel} setPage={setPage} />;
      case "doctors":
        return <DoctorsPage doctors={doctors} setDoctors={setDoctors} />;
      case "settings":
        return <SettingsPage apiKey={apiKey} setApiKey={setApiKey} model={model || provider?.defaultModel} setModel={setModel} provider={provider} setProvider={setProvider} />;
      default:
        return null;
    }
  };

  return (
    <>
      <GS />
      <div className="root">
        <div className="bg" />
        <aside className="sb">
          <div className="sb-logo">
            <div className="logo-ic">🧠</div>
            <div>
              <div className="logo-t">MedRep AI</div>
              <div className="logo-s">Neurologie · Maroc</div>
            </div>
          </div>

          <nav className="sb-nav">
            {NAV.map((s) => (
              <div key={s.sec} className="nav-sec">
                <div className="nav-lbl">{s.sec}</div>
                {s.items.map((it) => (
                  <div key={it.id} className={`nav-it${page === it.id ? " on" : ""}`} onClick={() => setPage(it.id)}>
                    <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0 }}>{it.ic}</span>
                    {it.lbl}
                    {it.needsApi && (hasApi ? <span className="nav-badge ok">ON</span> : <span className="nav-badge">OFF</span>)}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          <div className="sb-foot">
            <div style={{ padding: "0 10px 8px", fontSize: 10, color: "var(--t3)", display: "flex", alignItems: "center", gap: 6 }}>
              {hasApi ? (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: provider?.color || "#4285f4", boxShadow: `0 0 5px ${provider?.color || "#4285f4"}`, display: "inline-block" }} />
                  {provider?.name || "IA"} · {(model || provider?.defaultModel)}
                </>
              ) : (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--t3)", display: "inline-block" }} />
                  IA non configurée
                </>
              )}
            </div>
            <div className="u-card">
              <div className="u-av">{initials("Délégué Médical")}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Délégué Médical</div>
                <div style={{ fontSize: 10, color: "var(--t3)" }}>Maroc · Neurologie</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="tb-title">{TITLES[page]}</div>
            {!hasApi && <button className="btn btn-blue" style={{ fontSize: 11 }} onClick={() => setPage("settings")}>🔑 Configurer API</button>}
            {hasApi && <button className="btn btn-g" style={{ fontSize: 11 }} onClick={() => setPage("assistant")}>{provider?.icon || "✦"} Assistant IA</button>}
          </div>
          {render()}
        </main>
      </div>
    </>
  );
}