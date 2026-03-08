import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

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
    .mo{background:var(--navy2);border:1px solid var(--bdra);border-radius:16px;padding:22px;width:100%;max-width:900px;max-height:90vh;overflow-y:auto;animation:mi .2s ease}
    @keyframes mi{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
    .mo-t{font-family:var(--fd);font-size:18px;font-weight:700;margin-bottom:4px}
    .mo-s{font-size:12px;color:var(--t2);margin-bottom:16px}
    .mo-f{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;padding-top:14px;border-top:1px solid var(--bdr)}
    .sp{width:14px;height:14px;border:2px solid rgba(255,255,255,.2);border-top-color:#4285f4;border-radius:50%;animation:spin .6s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty{text-align:center;padding:40px 20px;color:var(--t3);font-size:13px}
    .tag{padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;display:inline-block}
    .tA{background:rgba(0,212,170,.15);color:var(--teal);border:1px solid rgba(0,212,170,.2)}
    .tB{background:rgba(245,158,11,.15);color:var(--amber);border:1px solid rgba(245,158,11,.2)}
    .tC{background:rgba(90,103,133,.2);color:var(--t2);border:1px solid var(--bdr)}
    .pill{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;border:1px solid var(--bdr);color:var(--t2);font-size:11px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .sep{height:1px;background:var(--bdr);margin:12px 0}
    .mini{font-size:11px;color:var(--t3);line-height:1.6}
    .warn{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:var(--amber);padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.7}
    .ok{background:rgba(0,212,170,.10);border:1px solid rgba(0,212,170,.22);color:var(--teal);padding:10px 12px;border-radius:12px;font-size:12px;line-height:1.7}

    .pl-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:14px}
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

    .week-block{margin-bottom:16px;border:1px solid var(--bdr);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.02)}
    .week-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--bdr);background:rgba(255,255,255,.03)}
    .week-title{font-family:var(--fd);font-size:13px;font-weight:800}
    .week-sub{font-size:11px;color:var(--t3);margin-top:2px}
    .week-kpis{display:flex;gap:8px;flex-wrap:wrap}
    .mini-pill{padding:4px 8px;border-radius:999px;border:1px solid var(--bdr);font-size:10px;color:var(--t2)}
    .pl-grid-week{display:grid;grid-template-columns:repeat(5, minmax(220px, 1fr));gap:12px;padding:12px}
    .pl-day.full{border-color:rgba(0,212,170,.32);box-shadow:0 0 0 1px rgba(0,212,170,.08) inset}
    .pl-day.partial{border-color:rgba(245,158,11,.22)}
    .pl-day.emptyday{opacity:.85}
    .pl-day-topbadges{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
    .soft-badge{font-size:9px;padding:3px 7px;border-radius:999px;border:1px solid var(--bdr);color:var(--t2)}
    .soft-badge.ok{color:var(--teal);border-color:rgba(0,212,170,.28);background:rgba(0,212,170,.08)}
    .soft-badge.warn{color:var(--amber);border-color:rgba(245,158,11,.28);background:rgba(245,158,11,.08)}

    /* ── Fumetil Dashboard ── */
    .fum-hero{
      background:linear-gradient(135deg,rgba(0,212,170,.12) 0%,rgba(139,92,246,.08) 50%,rgba(59,130,246,.06) 100%);
      border:1px solid rgba(0,212,170,.2);
      border-radius:16px;
      padding:20px 24px;
      margin-bottom:16px;
      position:relative;
      overflow:hidden;
    }
    .fum-hero::before{
      content:'';position:absolute;top:-60px;right:-60px;
      width:200px;height:200px;border-radius:50%;
      background:radial-gradient(circle,rgba(0,212,170,.1),transparent 70%);
      pointer-events:none;
    }
    .fum-hero-title{font-family:var(--fd);font-size:22px;font-weight:800;letter-spacing:-.02em;margin-bottom:4px}
    .fum-hero-sub{font-size:12px;color:var(--t2);line-height:1.6}
    .temp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
    .temp-card{border-radius:14px;padding:16px 14px;position:relative;overflow:hidden;border:1px solid}
    .temp-card.chaud{background:rgba(244,63,94,.08);border-color:rgba(244,63,94,.22)}
    .temp-card.tiede{background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.22)}
    .temp-card.froid{background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.22)}
    .temp-card.nevalue{background:rgba(90,103,133,.08);border-color:rgba(90,103,133,.18)}
    .temp-ic{font-size:28px;margin-bottom:8px;display:block}
    .temp-val{font-family:var(--fd);font-size:32px;font-weight:800;line-height:1;margin-bottom:4px}
    .temp-lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
    .temp-sub{font-size:10px;opacity:.7}
    .temp-bar{position:absolute;bottom:0;left:0;height:3px;transition:width 1.2s cubic-bezier(.4,0,.2,1)}
    .temp-card.chaud .temp-val,.temp-card.chaud .temp-lbl{color:var(--rose)}
    .temp-card.tiede .temp-val,.temp-card.tiede .temp-lbl{color:var(--amber)}
    .temp-card.froid .temp-val,.temp-card.froid .temp-lbl{color:var(--blue)}
    .temp-card.nevalue .temp-val,.temp-card.nevalue .temp-lbl{color:var(--t2)}
    .temp-bar.chaud{background:var(--rose)}
    .temp-bar.tiede{background:var(--amber)}
    .temp-bar.froid{background:var(--blue)}
    .temp-bar.nevalue{background:var(--t3)}

    .fum-3col{display:grid;grid-template-columns:1.3fr 1fr 1.2fr;gap:14px;margin-bottom:16px}
    .city-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bdr)}
    .city-row:last-child{border-bottom:none}
    .city-name{font-size:12px;font-weight:600;min-width:90px;flex-shrink:0}
    .city-bar-wrap{flex:1;background:var(--navy4);border-radius:4px;height:8px;overflow:hidden}
    .city-bar-fill{height:100%;border-radius:4px;transition:width 1.4s cubic-bezier(.4,0,.2,1)}
    .city-score-val{font-family:var(--fd);font-size:12px;font-weight:800;min-width:38px;text-align:right}
    .city-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

    .obj-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--bdr)}
    .obj-row:last-child{border-bottom:none}
    .obj-rank{font-family:var(--fd);font-size:11px;font-weight:800;color:var(--t3);min-width:22px}
    .obj-text{font-size:11px;color:var(--t1);flex:1;line-height:1.4}
    .obj-cnt{font-family:var(--fd);font-size:12px;font-weight:800;min-width:24px;text-align:right}
    .obj-bar-wrap{width:60px;background:var(--navy4);border-radius:4px;height:5px;overflow:hidden}
    .obj-bar-fill{height:100%;border-radius:4px;background:var(--rose);transition:width 1.2s ease}

    .prio-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:10px;
      border:1px solid var(--bdr);margin-bottom:6px;transition:all .15s;cursor:default}
    .prio-row:hover{background:rgba(255,255,255,.03)}
    .prio-row.haute{border-color:rgba(0,212,170,.2);background:rgba(0,212,170,.04)}
    .prio-row.moyenne{border-color:rgba(245,158,11,.15)}
    .prio-row.basse{border-color:var(--bdr)}
    .prio-avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:800;flex-shrink:0;background:var(--navy4)}
    .prio-name{font-size:12px;font-weight:600;flex:1}
    .prio-city{font-size:10px;color:var(--t3)}

    .donut-wrap{display:flex;align-items:center;justify-content:center;gap:20px}
    .donut-legend{display:flex;flex-direction:column;gap:8px}
    .donut-leg-row{display:flex;align-items:center;gap:8px;font-size:11px}
    .donut-leg-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}

    .score-gauge-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0}
    .gauge-arc{position:relative;width:160px;height:80px;overflow:hidden}
    .gauge-val{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);
      font-family:var(--fd);font-size:22px;font-weight:800;white-space:nowrap}
    .gauge-label{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.06em}

    .fum-insight{border-radius:12px;padding:12px 14px;border:1px solid;margin-bottom:8px;font-size:12px;line-height:1.6}
    .fum-insight.good{background:rgba(0,212,170,.07);border-color:rgba(0,212,170,.2);color:var(--teal)}
    .fum-insight.warn{background:rgba(245,158,11,.07);border-color:rgba(245,158,11,.2);color:var(--amber)}
    .fum-insight.info{background:rgba(59,130,246,.07);border-color:rgba(59,130,246,.2);color:var(--blue)}

    .top5-list{display:flex;flex-direction:column;gap:8px}
    .top5-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;
      border:1px solid var(--bdr);background:rgba(255,255,255,.02);transition:all .15s}
    .top5-item:hover{background:rgba(255,255,255,.04);border-color:rgba(0,212,170,.2)}
    .top5-rank{font-family:var(--fd);font-size:13px;font-weight:800;min-width:22px;color:var(--t3)}
    .top5-rank.gold{color:#f59e0b}
    .top5-rank.silver{color:#94a3b8}
    .top5-rank.bronze{color:#c07a4f}
    .top5-info{flex:1;min-width:0}
    .top5-name{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .top5-meta{font-size:10px;color:var(--t3);margin-top:2px}
    .top5-score{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
    .score-ring{width:38px;height:38px;flex-shrink:0}

    @keyframes fillBar{from{width:0}to{width:var(--target-w)}}
    @keyframes countUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    .anim-in{animation:countUp .4s ease both}

    @media (max-width: 1300px){
      .fum-3col{grid-template-columns:1fr 1fr}
      .temp-grid{grid-template-columns:repeat(2,1fr)}
    }
    @media (max-width: 1200px){
      .kpi-grid{grid-template-columns:repeat(2,1fr)}
      .g2{grid-template-columns:1fr}
      .grid2{grid-template-columns:1fr}
      .pl-grid-week{grid-template-columns:repeat(2, minmax(220px,1fr))}
    }
    @media (max-width: 900px){
      .fum-3col{grid-template-columns:1fr}
      .temp-grid{grid-template-columns:repeat(2,1fr)}
    }
    @media (max-width: 860px){
      .sb{width:90px}
      .logo-t,.logo-s,.nav-lbl,.u-card div:last-child{display:none}
      .nav-it{justify-content:center}
      .content{padding:14px}
      .pl-grid-week{grid-template-columns:1fr}
    }
  `}</style>
);

/* ─────────────────────────────────────────────────────────────
  Storage helpers
───────────────────────────────────────────────────────────── */
function loadJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); if (!raw) return fallback; return JSON.parse(raw); }
  catch { return fallback; }
}
function saveJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

/* ─────────────────────────────────────────────────────────────
  IndexedDB audio
───────────────────────────────────────────────────────────── */
const AUDIO_DB = "medrep_audio_db_v1";
const AUDIO_STORE = "audios";
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(AUDIO_DB, 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(key, blob) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => { const tx = db.transaction(AUDIO_STORE, "readwrite"); tx.objectStore(AUDIO_STORE).put(blob, key); tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error); });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => { const tx = db.transaction(AUDIO_STORE, "readonly"); const rq = tx.objectStore(AUDIO_STORE).get(key); rq.onsuccess = () => resolve(rq.result || null); rq.onerror = () => reject(tx.error); });
}
async function idbDel(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => { const tx = db.transaction(AUDIO_STORE, "readwrite"); tx.objectStore(AUDIO_STORE).delete(key); tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error); });
}
async function idbClearAll() {
  const db = await idbOpen();
  return new Promise((resolve, reject) => { const tx = db.transaction(AUDIO_STORE, "readwrite"); tx.objectStore(AUDIO_STORE).clear(); tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error); });
}

/* ─────────────────────────────────────────────────────────────
  Backup
───────────────────────────────────────────────────────────── */
async function exportBackup({ includeAudio = true } = {}) {
  const payload = { version: 1, exportedAt: new Date().toISOString(), localStorage: {}, audio: includeAudio ? {} : null };
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith("medrep_")) payload.localStorage[k] = localStorage.getItem(k);
  }
  if (includeAudio) {
    try {
      const db = await idbOpen();
      const tx = db.transaction(AUDIO_STORE, "readonly");
      const store = tx.objectStore(AUDIO_STORE);
      const keys = await new Promise((resolve) => { const req = store.getAllKeys(); req.onsuccess = () => resolve(req.result || []); req.onerror = () => resolve([]); });
      for (const key of keys) {
        const blob = await new Promise((resolve) => { const r = store.get(key); r.onsuccess = () => resolve(r.result || null); r.onerror = () => resolve(null); });
        if (!blob) continue;
        const buf = await blob.arrayBuffer();
        payload.audio[key] = { type: blob.type || "audio/webm", bytes: Array.from(new Uint8Array(buf)) };
      }
    } catch (e) { console.warn("Audio export skipped:", e); }
  }
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "medrep_backup.json"; a.click();
  URL.revokeObjectURL(url);
}

async function importBackup(file, { includeAudio = true } = {}) {
  const text = await file.text();
  const payload = JSON.parse(text);
  const ls = payload?.localStorage || {};
  for (const k of Object.keys(ls)) localStorage.setItem(k, ls[k]);
  if (includeAudio && payload?.audio) {
    try {
      const db = await idbOpen();
      const tx = db.transaction(AUDIO_STORE, "readwrite");
      const store = tx.objectStore(AUDIO_STORE);
      for (const key of Object.keys(payload.audio)) {
        const item = payload.audio[key];
        if (!item?.bytes) continue;
        const bytes = new Uint8Array(item.bytes);
        const blob = new Blob([bytes], { type: item.type || "audio/webm" });
        store.put(blob, key);
      }
      await new Promise((resolve) => { tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(true); });
    } catch (e) { console.warn("Audio import skipped:", e); }
  }
  alert("Backup importé ✅ Recharge la page pour appliquer.");
}

/* ─────────────────────────────────────────────────────────────
  Utils
───────────────────────────────────────────────────────────── */
const MFR = ["Jan","Fév","Mars","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const DFR = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const CLUSTER = ["Rabat","Temara","Salé","Kénitra"];

function ymd(dt) {
  const d = new Date(dt);
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function monthKey(year, monthIndex) { return `${year}-${String(monthIndex+1).padStart(2,"0")}`; }
function isWeekday(dt) { const d = new Date(dt).getDay(); return d >= 1 && d <= 5; }
function isWedThu(dt) { const d = new Date(dt).getDay(); return d === 3 || d === 4; }
function startOfMonth(year, monthIndex) { return new Date(year, monthIndex, 1); }
function endOfMonth(year, monthIndex) { return new Date(year, monthIndex+1, 0); }
function listWorkdays(year, monthIndex) {
  const s = startOfMonth(year, monthIndex), e = endOfMonth(year, monthIndex), out = [];
  for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) if (isWeekday(d)) out.push(ymd(d));
  return out;
}
const tNow = () => new Date().toLocaleTimeString("fr",{hour:"2-digit",minute:"2-digit"});
const dtNowISO = () => new Date().toISOString();
function potRank(p) { return p==="A"?0:p==="B"?1:2; }
function stableSortDocs(docs) {
  return [...docs].sort((a,b) =>
    (a.city||"").localeCompare(b.city||"") ||
    (a.sector||"").localeCompare(b.sector||"") ||
    potRank(a.potential)-potRank(b.potential) ||
    (a.name||"").localeCompare(b.name||"")
  );
}
function clamp(n,a,b) { return Math.max(a,Math.min(b,n)); }
function normalizeText(v) { return (v??"").toString().trim().replace(/\s+/g," ").replace(/['']/g,"'").normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function normalizeKey(v) { return normalizeText(v).toLowerCase().replace(/[^a-z0-9]/g,""); }

const CITY_ALIASES = {
  rabat:"Rabat",temara:"Temara",skhirattemara:"Temara",skhirat:"Temara",
  sale:"Salé",saleeljadida:"Salé",kenitra:"Kénitra",casablanca:"Casablanca",
  casa:"Casablanca",mohammedia:"Mohammedia",marrakech:"Marrakech",agadir:"Agadir",
  fes:"Fès",fez:"Fès",meknes:"Meknès",tanger:"Tanger",oujda:"Oujda",
  tetouan:"Tétouan",tetouane:"Tétouan",eljadida:"El Jadida",jadida:"El Jadida",safi:"Safi",
};
function normalizeCity(v) {
  const raw = normalizeText(v);
  if (!raw) return "";
  const key = normalizeKey(raw);
  return CITY_ALIASES[key] || raw.replace(/\b\w/g,(m)=>m.toUpperCase());
}
function looksLikeCity(v) {
  const c = normalizeCity(v);
  return ["Rabat","Temara","Salé","Kénitra","Casablanca","Mohammedia","Marrakech","Agadir","Fès","Meknès","Tanger","Oujda","Tétouan","El Jadida","Safi"].includes(c);
}
function normalizePotential(v) {
  const s = normalizeText(v).toUpperCase();
  if (!s) return "B";
  if (s.startsWith("A")) return "A";
  if (s.startsWith("B")) return "B";
  if (s.startsWith("C")) return "C";
  if (s.includes("FORT")||s.includes("HIGH")) return "A";
  if (s.includes("MOY")||s.includes("MED")) return "B";
  if (s.includes("FAIB")||s.includes("LOW")) return "C";
  return "B";
}

const COLUMN_ALIASES = {
  id:["id","code","n","numero","num","identifiant"],
  name:["name","nom","medecin","médecin","docteur","doctor","nommedecin","nomdumedecin","dr","nomprenom"],
  city:["city","ville","localite","localité","zone","region","région"],
  sector:["sector","secteur","quartier","zonegeo","delegation","délégation","territoire"],
  potential:["potential","potentiel","segment","classe","priorite","priorité","priority"],
  phone:["phone","telephone","téléphone","tel","gsm","mobile","portable"],
  email:["email","mail","e-mail","courriel"],
  activite:["activite","activité","statut","type","cabinet","activitepro","activitépro"],
  specialite:["specialite","spécialité","specialty","sp","discipline"],
};
function findColumnIndex(headers, aliases) {
  const normalizedHeaders = headers.map(h=>normalizeKey(h));
  for (const alias of aliases) { const key = normalizeKey(alias); const exact = normalizedHeaders.findIndex(h=>h===key); if (exact>=0) return exact; }
  for (const alias of aliases) { const key = normalizeKey(alias); const contains = normalizedHeaders.findIndex(h=>h.includes(key)||key.includes(h)); if (contains>=0) return contains; }
  return -1;
}
function buildHeaderMap(headers) {
  const map = {
    id:findColumnIndex(headers,COLUMN_ALIASES.id),
    name:findColumnIndex(headers,COLUMN_ALIASES.name),
    city:findColumnIndex(headers,COLUMN_ALIASES.city),
    sector:findColumnIndex(headers,COLUMN_ALIASES.sector),
    potential:findColumnIndex(headers,COLUMN_ALIASES.potential),
    phone:findColumnIndex(headers,COLUMN_ALIASES.phone),
    email:findColumnIndex(headers,COLUMN_ALIASES.email),
    activite:findColumnIndex(headers,COLUMN_ALIASES.activite),
    specialite:findColumnIndex(headers,COLUMN_ALIASES.specialite),
  };
  if (map.city<0&&map.sector>=0) map.city=map.sector;
  return map;
}
function valueAt(row,idx) { if (idx<0) return ""; return row[idx]??""; }
function normalizeDoctorRow(row,headerMap,fallbackId) {
  const rawName=normalizeText(valueAt(row,headerMap.name));
  const rawCity=normalizeText(valueAt(row,headerMap.city));
  const rawSector=normalizeText(valueAt(row,headerMap.sector));
  const specialite=normalizeText(valueAt(row,headerMap.specialite));
  let city=normalizeCity(rawCity), sector=rawSector;
  if ((!city||city===normalizeCity(rawSector))&&looksLikeCity(rawSector)) { city=normalizeCity(rawSector); sector=""; }
  if (!sector&&specialite) sector=specialite;
  else if (sector&&specialite&&!normalizeKey(sector).includes(normalizeKey(specialite))) sector=`${sector} · ${specialite}`;
  const doctor={
    id:Number(valueAt(row,headerMap.id))||fallbackId,
    name:rawName,city,sector,
    potential:normalizePotential(valueAt(row,headerMap.potential)),
    phone:normalizeText(valueAt(row,headerMap.phone)),
    email:normalizeText(valueAt(row,headerMap.email)).toLowerCase(),
    activite:normalizeText(valueAt(row,headerMap.activite))||"Privé",
    adoptionScore:null,mainObjection:"",nextVisitGoal:"",priorityLevel:""
  };
  if (!doctor.name||!doctor.city) return null;
  return doctor;
}
function dedupeDoctors(list) {
  const seen=new Map();
  for (const d of list) {
    const key=`${normalizeKey(d.name)}__${normalizeKey(d.city)}__${normalizeKey(d.sector)}`;
    if (!seen.has(key)) seen.set(key,d);
    else {
      const prev=seen.get(key);
      seen.set(key,{...prev,...d,phone:d.phone||prev.phone,email:d.email||prev.email,activite:d.activite||prev.activite,potential:d.potential||prev.potential,adoptionScore:d.adoptionScore??prev.adoptionScore??null,mainObjection:d.mainObjection||prev.mainObjection||"",nextVisitGoal:d.nextVisitGoal||prev.nextVisitGoal||"",priorityLevel:d.priorityLevel||prev.priorityLevel||""});
    }
  }
  return Array.from(seen.values());
}
function parseCSVSmart(text) {
  const rows=[]; let row=[],cur="",inQuotes=false;
  for (let i=0;i<text.length;i++) {
    const ch=text[i],next=text[i+1];
    if (ch==='"') { if (inQuotes&&next==='"') { cur+='"'; i++; } else inQuotes=!inQuotes; }
    else if (ch===","&&!inQuotes) { row.push(cur); cur=""; }
    else if ((ch==="\n"||ch==="\r")&&!inQuotes) { if (ch==="\r"&&next==="\n") i++; row.push(cur); rows.push(row); row=[]; cur=""; }
    else cur+=ch;
  }
  if (cur.length||row.length) { row.push(cur); rows.push(row); }
  return rows.map(r=>r.map(c=>c.trim())).filter(r=>r.some(c=>normalizeText(c)));
}
async function importDoctorsFromFile(file) {
  const name=file.name.toLowerCase();
  if (name.endsWith(".json")) {
    const txt=await file.text(); const json=JSON.parse(txt);
    const list=Array.isArray(json?.doctors)?json.doctors:Array.isArray(json)?json:[];
    const out=list.map((d,i)=>({id:Number(d.id)||i+1,name:normalizeText(d.name),city:normalizeCity(d.city),sector:normalizeText(d.sector),potential:normalizePotential(d.potential),phone:normalizeText(d.phone),email:normalizeText(d.email).toLowerCase(),activite:normalizeText(d.activite)||"Privé",adoptionScore:d?.adoptionScore??null,mainObjection:d?.mainObjection??"",nextVisitGoal:d?.nextVisitGoal??"",priorityLevel:d?.priorityLevel??""})).filter(d=>d.name&&d.city);
    return stableSortDocs(dedupeDoctors(out));
  }
  if (name.endsWith(".csv")) {
    const txt=await file.text(); const rows=parseCSVSmart(txt);
    if (rows.length<2) throw new Error("CSV vide ou invalide.");
    const headers=rows[0]; const headerMap=buildHeaderMap(headers);
    if (headerMap.name<0||(headerMap.city<0&&headerMap.sector<0)) throw new Error("Colonnes introuvables.");
    const out=rows.slice(1).map((row,i)=>normalizeDoctorRow(row,headerMap,i+1)).filter(Boolean);
    return stableSortDocs(dedupeDoctors(out));
  }
  if (name.endsWith(".xlsx")||name.endsWith(".xls")) {
    const buffer=await file.arrayBuffer(); const wb=XLSX.read(buffer,{type:"array"});
    const firstSheet=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(firstSheet,{header:1,raw:false,defval:""});
    if (!rows.length||rows.length<2) throw new Error("Fichier Excel vide ou invalide.");
    const headers=rows[0]; const headerMap=buildHeaderMap(headers);
    if (headerMap.name<0||(headerMap.city<0&&headerMap.sector<0)) throw new Error("Colonnes introuvables dans Excel.");
    const out=rows.slice(1).map((row,i)=>normalizeDoctorRow(row,headerMap,i+1)).filter(Boolean);
    return stableSortDocs(dedupeDoctors(out));
  }
  throw new Error("Format non supporté. Utilise .xlsx, .xls, .csv ou .json");
}

function groupWorkdaysByWeek(workdays) {
  const weeks=[]; let current=[];
  for (const day of workdays) {
    const d=new Date(day),weekday=d.getDay();
    if (weekday===1&&current.length) { weeks.push(current); current=[]; }
    current.push(day);
    if (weekday===5) { weeks.push(current); current=[]; }
  }
  if (current.length) weeks.push(current);
  return weeks;
}

function extractAdoptionInsights(text) {
  const raw=text||"";
  const scoreMatch=raw.match(/Score\s*:\s*(\d{1,3})\s*\/\s*100/i)||raw.match(/score d['']adoption.*?(\d{1,3})\s*\/\s*100/i);
  const priorityMatch=raw.match(/Priorité\s*:\s*(haute|moyenne|basse)/i)||raw.match(/Niveau de priorité\s*:\s*(haute|moyenne|basse)/i);
  const objectionMatch=raw.match(/Frein principal\s*[:\-]\s*(.+)/i);
  const nextVisitMatch=raw.match(/##\s*Objectif next visit\s*([\s\S]*?)(##|$)/i)||raw.match(/Objectif next visit\s*[:\-]?\s*([\s\S]*?)(##|$)/i);
  const score=scoreMatch?Math.max(0,Math.min(100,parseInt(scoreMatch[1],10))):null;
  const priorityLevel=priorityMatch?priorityMatch[1].toLowerCase():"";
  const mainObjection=objectionMatch?objectionMatch[1].trim():"";
  let nextVisitGoal="";
  if (nextVisitMatch?.[1]) nextVisitGoal=nextVisitMatch[1].replace(/^-+\s*/gm,"").replace(/\n+/g," ").trim();
  return {adoptionScore:Number.isFinite(score)?score:null,mainObjection,nextVisitGoal,priorityLevel};
}

function priorityBadgeClass(level) {
  const v=(level||"").toLowerCase();
  if (v==="haute") return "tA";
  if (v==="moyenne") return "tB";
  return "tC";
}
function scoreColor(score) {
  if (score==null) return "var(--t2)";
  if (score>=76) return "var(--teal)";
  if (score>=51) return "var(--blue)";
  if (score>=26) return "var(--amber)";
  return "var(--rose)";
}
function tempLabel(score) {
  if (score==null) return "non-évalué";
  if (score>=76) return "chaud";
  if (score>=26) return "tiède";
  return "froid";
}

/* ─────────────────────────────────────────────────────────────
  Providers
───────────────────────────────────────────────────────────── */
const PROVIDERS = {
  gemini:{id:"gemini",name:"Google Gemini",icon:"✦",color:"#4285f4",models:["gemini-2.5-flash","gemini-3-flash-preview","gemini-3.1-flash-lite-preview","gemini-3.1-pro-preview"],defaultModel:"gemini-2.5-flash",detect:(key)=>key.startsWith("AIza")},
  openai:{id:"openai",name:"OpenAI",icon:"◐",color:"#10a37f",models:["gpt-4o-mini","gpt-4o","gpt-4-turbo","gpt-3.5-turbo"],defaultModel:"gpt-4o-mini",detect:(key)=>key.startsWith("sk-")&&!key.startsWith("sk-ant-")},
  anthropic:{id:"anthropic",name:"Anthropic Claude",icon:"◈",color:"#d97706",models:["claude-3-5-sonnet-20241022","claude-3-haiku-20240307"],defaultModel:"claude-3-5-sonnet-20241022",detect:(key)=>key.startsWith("sk-ant-")},
  groq:{id:"groq",name:"Groq",icon:"⚡",color:"#f55036",models:["llama-3.3-70b-versatile","llama-3.1-8b-instant","mixtral-8x7b-32768"],defaultModel:"llama-3.3-70b-versatile",detect:(key)=>key.startsWith("gsk_")},
  openrouter:{id:"openrouter",name:"OpenRouter",icon:"🔀",color:"#6366f1",models:["google/gemini-1.5-flash","openai/gpt-4o-mini","anthropic/claude-3.5-sonnet"],defaultModel:"google/gemini-1.5-flash",detect:(key)=>key.startsWith("sk-or-")},
};
function detectProvider(apiKey) {
  if (!apiKey) return null;
  const key=apiKey.trim();
  const order=["anthropic","groq","openrouter","gemini","openai"];
  for (const id of order) if (PROVIDERS[id]?.detect?.(key)) return PROVIDERS[id];
  if (key.startsWith("sk-")) return PROVIDERS.openai;
  return null;
}

const SYS_PROMPT="Tu es un assistant personnel IA spécialisé en visite médicale en neurologie au Maroc. Ton rôle est d'aider un délégué médical à développer l'adoption et la prescription de Fumetil de manière éthique, scientifique, crédible et conforme. Tu aides à préparer les visites, analyser les comptes-rendus, détecter les signaux d'intérêt, comprendre les objections, identifier les leviers d'adoption, et proposer la meilleure stratégie pour faire progresser chaque neurologue vers une prescription. Tu dois raisonner comme un coach terrain orienté performance, mais toujours dans un cadre compliant. Tu ne dois jamais inventer de données cliniques, exagérer l'efficacité, faire des promesses thérapeutiques, proposer du hors AMM, ou donner des affirmations non validées. Tu dois toujours rester factuel, utile, concret, orienté terrain, actionnable, et adapté à la réalité des visites médicales. Quand tu analyses un médecin ou un compte-rendu, tu dois aider le délégué à savoir : 1) où en est le médecin dans son niveau d'adoption de Fumetil, 2) quelle est sa probabilité de prescription, 3) quels sont ses freins principaux, 4) quels sont les leviers d'influence autorisés, 5) quel argumentaire est le plus pertinent, 6) quelles questions poser à la prochaine visite, 7) quelles actions concrètes entreprendre, 8) quel objectif précis viser à la prochaine visite. Tu réponds toujours en français, dans un style clair, structuré, terrain, synthétique mais utile. Tu dois produire des réponses directement exploitables par un délégué médical en visite.";

/* LLM calls */
async function callGemini(prompt,apiKey,model,sys) {
  const tryModel=async(m)=>{
    const url=`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system_instruction:{parts:[{text:sys}]},contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:0.6,maxOutputTokens:2048}})});
    if (!r.ok) { let msg=`Erreur Gemini HTTP ${r.status}`; try{const e=await r.json();msg=e?.error?.message||msg;}catch{} throw new Error(msg); }
    const d=await r.json();
    return d?.candidates?.[0]?.content?.parts?.[0]?.text||"Pas de réponse.";
  };
  try { return await tryModel(model||"gemini-2.5-flash"); }
  catch(e) { const msg=String(e.message||""); if (msg.includes("not found")||msg.includes("not supported")) return await tryModel("gemini-2.5-flash"); throw e; }
}
async function callOpenAILike(url,prompt,apiKey,model,sys,extraHeaders={}) {
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`,...extraHeaders},body:JSON.stringify({model,messages:[{role:"system",content:sys},{role:"user",content:prompt}],temperature:0.6,max_tokens:1400})});
  if (!r.ok) { let msg=`Erreur HTTP ${r.status}`; try{const e=await r.json();msg=e?.error?.message||msg;}catch{} throw new Error(msg); }
  const d=await r.json();
  return d?.choices?.[0]?.message?.content||"Pas de réponse.";
}
async function callAnthropic(prompt,apiKey,model,sys) {
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify({model,max_tokens:1400,temperature:0.6,system:sys,messages:[{role:"user",content:prompt}]})});
  if (!r.ok) { let msg=`Erreur Anthropic HTTP ${r.status}`; try{const e=await r.json();msg=e?.error?.message||e?.message||msg;}catch{} throw new Error(msg); }
  const d=await r.json();
  return d?.content?.map(x=>x?.text||"").join("\n").trim()||"Pas de réponse.";
}
async function callLLM(prompt,apiKey,provider,model,systemPrompt=SYS_PROMPT) {
  const p=provider||detectProvider(apiKey);
  if (!p) throw new Error("Provider non reconnu.");
  const m=model||p.defaultModel;
  if (p.id==="gemini") return callGemini(prompt,apiKey,m,systemPrompt);
  if (p.id==="anthropic") return callAnthropic(prompt,apiKey,m,systemPrompt);
  const urls={openai:"https://api.openai.com/v1/chat/completions",groq:"https://api.groq.com/openai/v1/chat/completions",openrouter:"https://openrouter.ai/api/v1/chat/completions"};
  if (!urls[p.id]) throw new Error(`Provider ${p.name} non supporté.`);
  const extraHeaders=p.id==="openrouter"?{"HTTP-Referer":window?.location?.origin||"http://localhost:5173","X-Title":"MedRep AI"}:{};
  return callOpenAILike(urls[p.id],prompt,apiKey,m,systemPrompt,extraHeaders);
}

/* Base doctors */
const DOCS_FALLBACK=[
  {id:1,name:"Dr. Lyoussi Mouna",city:"Temara",sector:"",potential:"B",phone:"",email:"",activite:"Privé",adoptionScore:42,mainObjection:"Manque de données locales sur Fumetil",nextVisitGoal:"Partager étude comparative",priorityLevel:"moyenne"},
  {id:2,name:"Dr. Moutie Wafaa",city:"Rabat",sector:"",potential:"A",phone:"",email:"",activite:"Privé",adoptionScore:78,mainObjection:"",nextVisitGoal:"Consolider prescription régulière",priorityLevel:"haute"},
  {id:3,name:"Dr. El Fakir Wafaa",city:"Temara",sector:"",potential:"B",phone:"",email:"",activite:"Privé",adoptionScore:18,mainObjection:"Préfère alternative habituelle",nextVisitGoal:"Identifier patients éligibles",priorityLevel:"basse"},
  {id:4,name:"Dr. Jouehari Abdelhafid",city:"Rabat",sector:"",potential:"A",phone:"",email:"",activite:"Privé",adoptionScore:65,mainObjection:"Coût perçu trop élevé pour patient",nextVisitGoal:"Présenter données pharmaco-économiques",priorityLevel:"haute"},
  {id:5,name:"Dr. Haiat Sara",city:"Temara",sector:"",potential:"A",phone:"",email:"",activite:"Privé",adoptionScore:null,mainObjection:"",nextVisitGoal:"",priorityLevel:""},
];

/* ─────────────────────────────────────────────────────────────
  ── FUMETIL COMMERCIAL DASHBOARD ──
───────────────────────────────────────────────────────────── */

/* SVG Donut chart */
function DonutChart({ data, size = 120 }) {
  const r = 46, cx = 60, cy = 60;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--navy4)", border: "1px solid var(--bdr)" }} />;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const slice = { ...d, dash, offset, pct };
    offset += dash;
    return slice;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--navy4)" strokeWidth="16" />
      {slices.map((s, i) => (
        <circle
          key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth="16"
          strokeDasharray={`${s.dash} ${circumference - s.dash}`}
          strokeDashoffset={-s.offset}
          style={{ transition: "stroke-dasharray .8s ease, stroke-dashoffset .8s ease" }}
        />
      ))}
    </svg>
  );
}

/* Animated score gauge (semicircle) */
function ScoreGauge({ score, size = 160 }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score ?? 0), 100);
    return () => clearTimeout(t);
  }, [score]);
  const r = 56, cx = 80, cy = 80;
  const circumference = Math.PI * r; // half circle
  const pct = animated / 100;
  const dash = pct * circumference;
  const color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: size, height: size / 2 + 24 }}>
      <svg width={size} height={size} viewBox="0 0 160 160" style={{ position: "absolute", top: 0, left: 0 }}>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--navy4)" strokeWidth="14" strokeLinecap="round" />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
        <text x={cx} y={cy + 10} textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="22" fontWeight="800" fill={color}>
          {score ?? "—"}
        </text>
        <text x={cx} y={cy + 26} textAnchor="middle" fontFamily="DM Sans,sans-serif" fontSize="9" fill="var(--t3)">
          / 100
        </text>
      </svg>
    </div>
  );
}

/* Animated progress bar */
function AnimBar({ pct, color, height = 8, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 80 + delay); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div style={{ background: "var(--navy4)", borderRadius: 4, height, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", borderRadius: 4, background: color,
        width: `${w}%`, transition: `width 1.1s cubic-bezier(.4,0,.2,1) ${delay}ms`,
        boxShadow: `0 0 8px ${color}55`
      }} />
    </div>
  );
}

function FumetilDashboard({ doctors, setPage }) {
  const evaluated = doctors.filter(d => d.adoptionScore != null);
  const chauds = evaluated.filter(d => d.adoptionScore >= 76);
  const tiedesArr = evaluated.filter(d => d.adoptionScore >= 26 && d.adoptionScore < 76);
  const froids = evaluated.filter(d => d.adoptionScore < 26);
  const nonEvalues = doctors.filter(d => d.adoptionScore == null);
  const total = doctors.length || 1;

  const avgScore = evaluated.length
    ? Math.round(evaluated.reduce((s, d) => s + d.adoptionScore, 0) / evaluated.length)
    : null;

  // Score moyen par ville
  const cityScores = useMemo(() => {
    const map = {};
    for (const d of evaluated) {
      if (!map[d.city]) map[d.city] = { sum: 0, count: 0 };
      map[d.city].sum += d.adoptionScore;
      map[d.city].count++;
    }
    return Object.entries(map)
      .map(([city, { sum, count }]) => ({ city, avg: Math.round(sum / count), count }))
      .sort((a, b) => b.avg - a.avg);
  }, [evaluated]);

  // Top objections
  const objections = useMemo(() => {
    const freq = {};
    for (const d of doctors) {
      const obj = (d.mainObjection || "").trim();
      if (!obj) continue;
      // Normalize slightly
      const key = obj.toLowerCase().slice(0, 80);
      freq[key] = (freq[key] || { text: obj, count: 0 });
      freq[key].count++;
    }
    return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 7);
  }, [doctors]);

  // Top priorités
  const highPrio = useMemo(() =>
    doctors
      .filter(d => d.priorityLevel === "haute")
      .sort((a, b) => (b.adoptionScore ?? -1) - (a.adoptionScore ?? -1))
      .slice(0, 6),
    [doctors]
  );

  // Top 5 médecins à visiter (score haut + priorité haute)
  const top5 = useMemo(() => {
    return [...doctors]
      .filter(d => d.priorityLevel || d.adoptionScore != null)
      .sort((a, b) => {
        const prioOrder = { haute: 0, moyenne: 1, basse: 2, "": 3 };
        const pDiff = (prioOrder[a.priorityLevel] ?? 3) - (prioOrder[b.priorityLevel] ?? 3);
        if (pDiff !== 0) return pDiff;
        return (b.adoptionScore ?? -1) - (a.adoptionScore ?? -1);
      })
      .slice(0, 5);
  }, [doctors]);

  // Insights automatiques
  const insights = useMemo(() => {
    const list = [];
    if (chauds.length >= total * 0.3)
      list.push({ type: "good", msg: `🔥 ${chauds.length} médecins chauds (${Math.round(chauds.length/total*100)}%) — pipeline de prescription solide !` });
    if (froids.length >= total * 0.4)
      list.push({ type: "warn", msg: `❄️ ${froids.length} médecins froids (${Math.round(froids.length/total*100)}%) nécessitent une stratégie de réchauffement.` });
    if (nonEvalues.length > 0)
      list.push({ type: "info", msg: `📋 ${nonEvalues.length} médecins sans score IA — lance l'analyse depuis les Comptes-rendus.` });
    if (objections.length > 0)
      list.push({ type: "warn", msg: `⚠️ Frein #1 : "${objections[0]?.text?.slice(0, 60)}" (${objections[0]?.count}x) — prépare un contre-argumentaire.` });
    if (cityScores.length > 0)
      list.push({ type: "good", msg: `📍 Ville la plus avancée : ${cityScores[0].city} (score moyen ${cityScores[0].avg}/100).` });
    return list;
  }, [chauds, froids, nonEvalues, objections, cityScores, total]);

  const donutData = [
    { label: "Chauds", value: chauds.length, color: "var(--rose)" },
    { label: "Tièdes", value: tiedesArr.length, color: "var(--amber)" },
    { label: "Froids", value: froids.length, color: "var(--blue)" },
    { label: "N/A", value: nonEvalues.length, color: "var(--t3)" },
  ];

  const maxCityScore = cityScores[0]?.avg || 100;
  const maxObjCount = objections[0]?.count || 1;

  const rankClass = (i) => i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";

  const initials = (name) => {
    const parts = name.replace(/^Dr\.?\s*/i, "").split(" ");
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  };

  return (
    <div className="content">
      {/* Hero */}
      <div className="fum-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="fum-hero-title">📊 Tableau de bord Fumetil</div>
            <div className="fum-hero-sub">
              Suivi commercial · {doctors.length} médecins · {evaluated.length} évalués par IA
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-p" onClick={() => setPage("reports")}>📝 Analyser</button>
            <button className="btn btn-g" onClick={() => setPage("doctors")}>👨‍⚕️ Médecins</button>
          </div>
        </div>
      </div>

      {/* Température grid */}
      <div className="temp-grid">
        {[
          { cls: "chaud", ic: "🔥", val: chauds.length, lbl: "Chauds", sub: "Score ≥ 76/100", pct: chauds.length / total * 100 },
          { cls: "tiede", ic: "🌡️", val: tiedesArr.length, lbl: "Tièdes", sub: "Score 26–75/100", pct: tiedesArr.length / total * 100 },
          { cls: "froid", ic: "❄️", val: froids.length, lbl: "Froids", sub: "Score < 26/100", pct: froids.length / total * 100 },
          { cls: "nevalue", ic: "📋", val: nonEvalues.length, lbl: "Non évalués", sub: "Analyse IA requise", pct: nonEvalues.length / total * 100 },
        ].map((t) => (
          <div key={t.cls} className={`temp-card ${t.cls}`}>
            <span className="temp-ic">{t.ic}</span>
            <div className="temp-val anim-in">{t.val}</div>
            <div className="temp-lbl">{t.lbl}</div>
            <div className="temp-sub">{t.sub}</div>
            <div className={`temp-bar ${t.cls}`} style={{ width: `${t.pct}%` }} />
          </div>
        ))}
      </div>

      {/* 3-col section */}
      <div className="fum-3col">

        {/* Score par ville */}
        <div className="card">
          <div className="card-t">📍 Score moyen d'adoption par ville</div>
          {cityScores.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>Aucun score IA disponible. Lance l'analyse depuis les comptes-rendus.</div>
          ) : (
            cityScores.map((c, i) => (
              <div key={c.city} className="city-row">
                <div className="city-dot" style={{ background: scoreColor(c.avg) }} />
                <div className="city-name">{c.city}</div>
                <AnimBar pct={(c.avg / 100) * 100} color={scoreColor(c.avg)} delay={i * 80} />
                <div className="city-score-val" style={{ color: scoreColor(c.avg) }}>{c.avg}</div>
                <div style={{ fontSize: 10, color: "var(--t3)", minWidth: 28 }}>/{c.count}</div>
              </div>
            ))
          )}
          {cityScores.length > 0 && (
            <div className="mini" style={{ marginTop: 10 }}>
              Score / nombre de médecins évalués dans chaque ville.
            </div>
          )}
        </div>

        {/* Donut + gauge */}
        <div className="card">
          <div className="card-t">🎯 Score moyen global</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <ScoreGauge score={avgScore} size={160} />
            <div className="donut-wrap">
              <DonutChart data={donutData} size={100} />
              <div className="donut-legend">
                {donutData.map(d => (
                  <div key={d.label} className="donut-leg-row">
                    <div className="donut-leg-dot" style={{ background: d.color }} />
                    <span style={{ color: "var(--t2)" }}>{d.label}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "var(--fd)", fontWeight: 800, color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top objections */}
        <div className="card">
          <div className="card-t">🚧 Top objections / freins détectés</div>
          {objections.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>Aucun frein enregistré. Les freins sont extraits automatiquement après analyse IA.</div>
          ) : (
            objections.map((o, i) => (
              <div key={i} className="obj-row">
                <div className="obj-rank">#{i + 1}</div>
                <div className="obj-text">{o.text.length > 55 ? o.text.slice(0, 55) + "…" : o.text}</div>
                <div className="obj-bar-wrap">
                  <div className="obj-bar-fill" style={{ width: `${(o.count / maxObjCount) * 100}%` }} />
                </div>
                <div className="obj-cnt" style={{ color: "var(--rose)" }}>{o.count}x</div>
              </div>
            ))
          )}
          <div className="mini" style={{ marginTop: 10 }}>
            Extraits automatiquement depuis les analyses IA. Lance l'analyse pour alimenter ce panneau.
          </div>
        </div>
      </div>

      {/* Insights + Top priorités + Top 5 */}
      <div className="g2" style={{ marginBottom: 16 }}>

        {/* Insights auto */}
        <div className="card">
          <div className="card-t">💡 Insights automatiques</div>
          {insights.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}>
              Analyse les comptes-rendus pour générer des insights.
            </div>
          ) : (
            insights.map((ins, i) => (
              <div key={i} className={`fum-insight ${ins.type}`}>
                {ins.msg}
              </div>
            ))
          )}
          <div className="sep" />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-p" onClick={() => setPage("reports")}>⚡ Lancer analyses IA</button>
            <button className="btn btn-g" onClick={() => setPage("planning")}>📅 Planning</button>
          </div>
        </div>

        {/* Top priorités haute */}
        <div className="card">
          <div className="card-t">
            🏆 Priorités hautes
            <span className="pill" style={{ borderColor: "rgba(0,212,170,.3)", color: "var(--teal)" }}>{highPrio.length}</span>
          </div>
          {highPrio.length === 0 ? (
            <div className="empty" style={{ padding: 20 }}>Aucun médecin classé "haute priorité".</div>
          ) : (
            highPrio.map(d => (
              <div key={d.id} className="prio-row haute">
                <div className="prio-avatar" style={{ background: "linear-gradient(135deg,var(--teal),#00a884)", color: "var(--navy)" }}>
                  {initials(d.name).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="prio-name">{d.name}</div>
                  <div className="prio-city">{d.city}{d.sector ? ` · ${d.sector}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span className={`tag t${d.potential || "C"}`}>{d.potential}</span>
                  {d.adoptionScore != null && (
                    <span style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 800, color: scoreColor(d.adoptionScore) }}>
                      {d.adoptionScore}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top 5 médecins à prioriser */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-t">
          🥇 Top 5 médecins à prioriser cette semaine
          <span className="mini" style={{ margin: 0 }}>Triés par priorité IA + score d'adoption</span>
        </div>
        {top5.length === 0 ? (
          <div className="empty" style={{ padding: 24 }}>Lance l'analyse IA pour alimenter le top 5.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
            {top5.map((d, i) => (
              <div key={d.id} className="top5-item">
                <div className={`top5-rank ${rankClass(i)}`}>#{i + 1}</div>
                <div className="top5-info">
                  <div className="top5-name">{d.name}</div>
                  <div className="top5-meta">
                    {d.city}{d.sector ? ` · ${d.sector}` : ""} · {d.activite || "Privé"}
                  </div>
                  {d.nextVisitGoal && (
                    <div style={{ fontSize: 10, color: "var(--teal)", marginTop: 4, lineHeight: 1.4 }}>
                      🎯 {d.nextVisitGoal.slice(0, 70)}{d.nextVisitGoal.length > 70 ? "…" : ""}
                    </div>
                  )}
                </div>
                <div className="top5-score">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="var(--navy4)" strokeWidth="4" />
                    <circle cx="22" cy="22" r="18" fill="none"
                      stroke={scoreColor(d.adoptionScore)}
                      strokeWidth="4"
                      strokeDasharray={`${((d.adoptionScore ?? 0) / 100) * 113} 113`}
                      strokeDashoffset="28"
                      strokeLinecap="round"
                      style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 4px ${scoreColor(d.adoptionScore)}88)` }}
                    />
                    <text x="22" y="26" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="11" fontWeight="800" fill={scoreColor(d.adoptionScore)}>
                      {d.adoptionScore ?? "?"}
                    </text>
                  </svg>
                  <span className={`tag ${priorityBadgeClass(d.priorityLevel)}`} style={{ fontSize: 9 }}>
                    {d.priorityLevel || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Répartition potentiel A/B/C */}
      <div className="card">
        <div className="card-t">📈 Répartition potentiel × température</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {["A", "B", "C"].map(pot => {
            const potDocs = doctors.filter(d => d.potential === pot);
            const potChauds = potDocs.filter(d => d.adoptionScore != null && d.adoptionScore >= 76).length;
            const potTiedes = potDocs.filter(d => d.adoptionScore != null && d.adoptionScore >= 26 && d.adoptionScore < 76).length;
            const potFroids = potDocs.filter(d => d.adoptionScore != null && d.adoptionScore < 26).length;
            const potNA = potDocs.filter(d => d.adoptionScore == null).length;
            const t = potDocs.length || 1;
            return (
              <div key={pot} style={{ background: "var(--navy3)", borderRadius: 12, padding: 14, border: "1px solid var(--bdr)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span className={`tag t${pot}`} style={{ fontSize: 14, padding: "4px 10px" }}>{pot}</span>
                  <span style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 800 }}>{potDocs.length}</span>
                </div>
                {[
                  { label: "🔥 Chauds", val: potChauds, color: "var(--rose)" },
                  { label: "🌡️ Tièdes", val: potTiedes, color: "var(--amber)" },
                  { label: "❄️ Froids", val: potFroids, color: "var(--blue)" },
                  { label: "📋 N/A", val: potNA, color: "var(--t3)" },
                ].map((row, ri) => (
                  <div key={ri} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: "var(--t2)", minWidth: 60 }}>{row.label}</div>
                    <AnimBar pct={(row.val / t) * 100} color={row.color} height={6} delay={ri * 60} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: row.color, minWidth: 16 }}>{row.val}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Dashboard (home)
───────────────────────────────────────────────────────────── */
function Dashboard({ doctors, setPage, hasApi, provider }) {
  const byCity = useMemo(() => { const o = {}; doctors.forEach(d => { o[d.city] = (o[d.city] || 0) + 1; }); return o; }, [doctors]);
  const cntA = doctors.filter(d => d.potential === "A").length;
  const cntCluster = doctors.filter(d => CLUSTER.includes(d.city)).length;
  const evaluated = doctors.filter(d => d.adoptionScore != null);
  const chauds = evaluated.filter(d => d.adoptionScore >= 76).length;
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
        <div className="kpi" style={{ "--ac": "var(--rose)" }}>
          <div className="kpi-lbl">Chauds 🔥</div><div className="kpi-val">{chauds}</div>
          <div className="kpi-d" style={{ color: "var(--rose)" }}>Score ≥ 76</div><div className="kpi-ic">🔥</div>
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
            <button className="btn btn-p" onClick={() => setPage("fumetil")}>📊 Dashboard Fumetil</button>
            <button className="btn btn-g" onClick={() => setPage("planning")}>📅 Planning</button>
            <button className="btn btn-blue" onClick={() => setPage("reports")}>📝 Comptes-rendus</button>
          </div>
          <div className="mini" style={{ marginTop: 12 }}>
            Tout est sauvegardé automatiquement. Le dashboard Fumetil analyse ton pipeline commercial.
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
            <div className="ok">✅ IA active : analyse les comptes-rendus pour enrichir le dashboard Fumetil.</div>
          ) : (
            <div className="warn">⚠️ Configure une clé API pour activer l'analyse IA et alimenter le dashboard commercial.</div>
          )}
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-g" onClick={() => setPage("settings")}>⚙️ Paramètres</button>
            <button className="btn btn-blue" onClick={() => setPage("fumetil")}>📊 Dashboard Fumetil</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Settings
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
    setTesting(true); setTestResult(null);
    try {
      const p = activeProvider || detectProvider(key);
      if (!p) throw new Error("Provider non reconnu.");
      const m = model || p.defaultModel;
      await callLLM("Réponds uniquement par: OK", key, p, m, "Tu réponds seulement OK.");
      setTestResult({ ok: true, msg: `✓ Connexion ${p.name} réussie` });
      setApiKey(key); setProvider(p); setModel(p.defaultModel);
    } catch (e) { setTestResult({ ok: false, msg: `✗ ${e.message}` }); }
    setTesting(false);
  };
  const save = () => {
    const key = draft.trim();
    const p = activeProvider || detectProvider(key);
    setApiKey(key);
    if (p) { setProvider(p); setModel(p.defaultModel); }
    setTestResult({ ok: true, msg: "✓ Sauvegardé." });
  };
  const [includeAudio, setIncludeAudio] = useState(true);
  return (
    <div className="content" style={{ maxWidth: 900 }}>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-t">🔑 Clé API</div>
        <div className="mini" style={{ marginBottom: 10 }}>Colle ta clé (Gemini commence par <b>AIza</b>). Stockée localement.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input className="fi" type="password" placeholder="AIzaSy... / sk-..." value={draft}
            onChange={(e) => { setDraft(e.target.value); setManualProvider(null); setTestResult(null); }}
            style={{ flex: 1, fontFamily: "monospace" }} />
          <button className="btn btn-blue" onClick={testKey} disabled={testing || !draft.trim()}>
            {testing ? <><span className="sp" style={{ borderTopColor: "var(--blue)" }} /> Test...</> : "Tester"}
          </button>
          <button className="btn btn-p" onClick={save} disabled={!draft.trim()}>Sauvegarder</button>
        </div>
        {testResult && (
          <div style={{ marginTop: 10, padding: "9px 14px", borderRadius: 10, fontSize: 12,
            background: testResult.ok ? "rgba(0,212,170,.1)" : "rgba(244,63,94,.1)",
            color: testResult.ok ? "var(--teal)" : "var(--rose)",
            border: `1px solid ${testResult.ok ? "rgba(0,212,170,.2)" : "rgba(244,63,94,.2)"}` }}>
            {testResult.msg}
          </div>
        )}
      </div>
      {activeProvider && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-t" style={{ color: activeProvider.color }}>{activeProvider.icon} Modèle ({activeProvider.name})</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {activeProvider.models.map(m => (
              <button key={m} className={`btn ${model === m ? "btn-p" : "btn-g"}`}
                style={model === m ? { background: activeProvider.color } : {}}
                onClick={() => setModel(m)}>{m}</button>
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-t">💾 Backup — Export / Import</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label className="pill" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={includeAudio} onChange={(e) => setIncludeAudio(e.target.checked)} style={{ accentColor: "#00d4aa" }} />
            Inclure audio
          </label>
          <button className="btn btn-p" onClick={() => exportBackup({ includeAudio })}>⬇️ Exporter backup</button>
          <label className="btn btn-blue" style={{ cursor: "pointer" }}>
            ⬆️ Importer backup
            <input type="file" accept="application/json" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f, { includeAudio }); e.target.value = ""; }} />
          </label>
          <button className="btn btn-rose" onClick={async () => {
            if (!confirm("Réinitialiser toutes les données locales ?")) return;
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith("medrep_")) keys.push(k); }
            keys.forEach(k => localStorage.removeItem(k));
            try { await idbClearAll(); } catch {}
            alert("Données supprimées. Recharge la page.");
          }}>🧨 Reset local</button>
        </div>
        <div className="warn" style={{ marginTop: 12 }}>⚠️ Sur Vercel, tes données restent dans le navigateur. Utilise le Backup pour partager entre appareils.</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Doctors Page
───────────────────────────────────────────────────────────── */
function DoctorsPage({ doctors, setDoctors }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [importing, setImporting] = useState(false);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter(d =>
      (d.name||"").toLowerCase().includes(s) || (d.city||"").toLowerCase().includes(s) ||
      (d.sector||"").toLowerCase().includes(s) || (d.potential||"").toLowerCase().includes(s) ||
      (d.mainObjection||"").toLowerCase().includes(s) || (d.nextVisitGoal||"").toLowerCase().includes(s) ||
      (d.priorityLevel||"").toLowerCase().includes(s)
    );
  }, [doctors, q]);
  const nextId = useMemo(() => (doctors.reduce((m, d) => Math.max(m, d.id || 0), 0) + 1), [doctors]);
  const upsert = (doc) => {
    setDoctors(prev => {
      const nd = { ...doc, adoptionScore: doc?.adoptionScore ?? null, mainObjection: doc?.mainObjection ?? "", nextVisitGoal: doc?.nextVisitGoal ?? "", priorityLevel: doc?.priorityLevel ?? "" };
      const exists = prev.some(x => x.id === nd.id);
      return stableSortDocs(exists ? prev.map(x => x.id === nd.id ? nd : x) : [...prev, nd]);
    });
  };
  const remove = (id) => { if (!confirm("Supprimer ?")) return; setDoctors(prev => prev.filter(x => x.id !== id)); };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ doctors }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "medrep_doctors.json"; a.click(); URL.revokeObjectURL(url);
  };
  const exportCSV = () => {
    const header = ["id","name","city","sector","potential","phone","email","activite","adoptionScore","mainObjection","nextVisitGoal","priorityLevel"];
    const lines = [header.join(",")];
    for (const d of doctors) { const row = header.map(k => { const v = (d[k]??"").toString().replaceAll('"','""'); return `"${v}"`; }); lines.push(row.join(",")); }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "medrep_doctors.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const handleImport = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const list = await importDoctorsFromFile(file);
      if (!list.length) { alert("Aucun médecin valide."); return; }
      setDoctors(list); alert(`Import OK ✅ (${list.length} médecins)`);
    } catch (e) { alert(`Erreur import ❌\n${e.message}`); }
    finally { setImporting(false); }
  };
  return (
    <div className="content">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-t">👨‍⚕️ Liste des médecins <span className="pill">{doctors.length}</span></div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="fi" placeholder="Recherche…" value={q} onChange={e=>setQ(e.target.value)} style={{ flex: 1, minWidth: 280 }} />
          <button className="btn btn-p" onClick={() => { setShowNew(true); setEditing({ id: nextId, name:"",city:"",sector:"",potential:"B",phone:"",email:"",activite:"Privé",adoptionScore:null,mainObjection:"",nextVisitGoal:"",priorityLevel:"" }); }}>➕ Ajouter</button>
        </div>
        <div className="sep" />
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button className="btn btn-g" onClick={exportJSON}>⬇️ JSON</button>
          <button className="btn btn-g" onClick={exportCSV}>⬇️ CSV</button>
          <label className="btn btn-blue" style={{ cursor:"pointer" }}>
            {importing ? "Import..." : "⬆️ Import Excel / CSV / JSON"}
            <input type="file" accept=".xlsx,.xls,.csv,.json" style={{ display:"none" }} onChange={async(e)=>{ const f=e.target.files?.[0]; if(f) await handleImport(f); e.target.value=""; }} />
          </label>
          <button className="btn btn-rose" onClick={() => { if(!confirm("Reset liste ?")) return; setDoctors(DOCS_FALLBACK); }}>🧹 Reset</button>
        </div>
      </div>
      <div className="card">
        <div className="tw">
          <table>
            <thead><tr>
              <th>Nom</th><th>Ville</th><th>Secteur</th><th>Potentiel</th>
              <th>Adoption</th><th>Température</th><th>Frein principal</th><th>Priorité</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight:700 }}>{d.name}</td>
                  <td>{d.city}</td>
                  <td>{d.sector||"—"}</td>
                  <td><span className={`tag t${d.potential||"C"}`}>{d.potential||"C"}</span></td>
                  <td><span style={{ fontWeight:700, color:scoreColor(d.adoptionScore) }}>{d.adoptionScore==null?"—":`${d.adoptionScore}/100`}</span></td>
                  <td>
                    <span style={{ fontSize:12 }}>
                      {d.adoptionScore==null?"📋 N/A":d.adoptionScore>=76?"🔥 Chaud":d.adoptionScore>=26?"🌡️ Tiède":"❄️ Froid"}
                    </span>
                  </td>
                  <td style={{ maxWidth:200 }}><div style={{ whiteSpace:"normal",lineHeight:1.5 }}>{d.mainObjection||"—"}</div></td>
                  <td><span className={`tag ${priorityBadgeClass(d.priorityLevel)}`}>{d.priorityLevel||"—"}</span></td>
                  <td>
                    <div style={{ display:"flex",gap:8 }}>
                      <button className="btn btn-g" onClick={()=>{ setShowNew(false); setEditing({...d}); }}>✏️</button>
                      <button className="btn btn-rose" onClick={()=>remove(d.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={9}><div className="empty">Aucun résultat.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <Modal title={showNew?"Ajouter un médecin":"Éditer médecin"} subtitle="Modifications sauvegardées automatiquement."
          onClose={()=>setEditing(null)}
          actions={[
            {label:"Annuler",kind:"g",onClick:()=>setEditing(null)},
            {label:"Enregistrer",kind:"p",onClick:()=>{
              if (!editing.name?.trim()) return alert("Nom requis.");
              if (!editing.city?.trim()) return alert("Ville requise.");
              const p=(editing.potential||"B").toString().toUpperCase().slice(0,1);
              upsert({...editing,city:normalizeCity(editing.city),sector:normalizeText(editing.sector),phone:normalizeText(editing.phone),email:normalizeText(editing.email).toLowerCase(),activite:normalizeText(editing.activite),potential:["A","B","C"].includes(p)?p:"B",adoptionScore:editing.adoptionScore==null?null:Math.max(0,Math.min(100,Number(editing.adoptionScore))),mainObjection:normalizeText(editing.mainObjection),nextVisitGoal:normalizeText(editing.nextVisitGoal),priorityLevel:(editing.priorityLevel||"").toLowerCase()});
              setEditing(null);
            }},
          ]}>
          <div className="grid2">
            <div className="fg"><label className="fl">Nom</label><input className="fi" value={editing.name} onChange={e=>setEditing(p=>({...p,name:e.target.value}))} /></div>
            <div className="fg"><label className="fl">Ville</label><input className="fi" value={editing.city} onChange={e=>setEditing(p=>({...p,city:e.target.value}))} /></div>
            <div className="fg"><label className="fl">Secteur</label><input className="fi" value={editing.sector||""} onChange={e=>setEditing(p=>({...p,sector:e.target.value}))} /></div>
            <div className="fg"><label className="fl">Potentiel</label>
              <select className="fs" value={editing.potential||"B"} onChange={e=>setEditing(p=>({...p,potential:e.target.value}))}>
                <option value="A">A</option><option value="B">B</option><option value="C">C</option>
              </select>
            </div>
            <div className="fg"><label className="fl">Téléphone</label><input className="fi" value={editing.phone||""} onChange={e=>setEditing(p=>({...p,phone:e.target.value}))} /></div>
            <div className="fg"><label className="fl">Email</label><input className="fi" value={editing.email||""} onChange={e=>setEditing(p=>({...p,email:e.target.value}))} /></div>
            <div className="fg"><label className="fl">Activité</label><input className="fi" value={editing.activite||""} onChange={e=>setEditing(p=>({...p,activite:e.target.value}))} /></div>
            <div className="fg"><label className="fl">Score d'adoption (0-100)</label>
              <input className="fi" type="number" min={0} max={100} value={editing.adoptionScore??""} onChange={e=>setEditing(p=>({...p,adoptionScore:e.target.value===""?null:Math.max(0,Math.min(100,parseInt(e.target.value,10)||0))}))} />
            </div>
            <div className="fg" style={{ gridColumn:"1 / -1" }}><label className="fl">Frein principal</label><textarea className="fta" value={editing.mainObjection||""} onChange={e=>setEditing(p=>({...p,mainObjection:e.target.value}))} /></div>
            <div className="fg" style={{ gridColumn:"1 / -1" }}><label className="fl">Objectif next visit</label><textarea className="fta" value={editing.nextVisitGoal||""} onChange={e=>setEditing(p=>({...p,nextVisitGoal:e.target.value}))} /></div>
            <div className="fg"><label className="fl">Priorité</label>
              <select className="fs" value={editing.priorityLevel||""} onChange={e=>setEditing(p=>({...p,priorityLevel:e.target.value}))}>
                <option value="">—</option><option value="haute">haute</option><option value="moyenne">moyenne</option><option value="basse">basse</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Planning
───────────────────────────────────────────────────────────── */
function pickEvenly(days, target) {
  if (target<=0) return []; if (target>=days.length) return [...days];
  const step=days.length/target, chosen=[];
  for (let i=0;i<target;i++) { const idx=Math.floor(i*step); chosen.push(days[idx]); }
  return Array.from(new Set(chosen)).slice(0,target);
}
function generatePlanning({ doctors, year, monthIndex, perDay, clusterDaysTarget }) {
  const workdays=listWorkdays(year,monthIndex);
  const plan={};
  workdays.forEach(d=>{plan[d]=[];});
  const allSorted=stableSortDocs(doctors);
  const clusterDocs=allSorted.filter(d=>CLUSTER.includes(d.city));
  const wedThu=workdays.filter(d=>isWedThu(d));
  const target=clamp(clusterDaysTarget,0,wedThu.length);
  const clusterDays=pickEvenly(wedThu,target);
  const idToDoc=new Map();
  doctors.forEach(d=>idToDoc.set(d.id,d));
  const inCluster=(id)=>CLUSTER.includes(idToDoc.get(id)?.city);
  const canPlaceOnDay=(id,day)=>(!inCluster(id)||isWedThu(day));
  const takeForDay=(poolIds,day,k)=>{
    const taken=[];
    for (let i=0;i<poolIds.length&&taken.length<k;) { const id=poolIds[i]; if(canPlaceOnDay(id,day)){taken.push(id);poolIds.splice(i,1);}else i++; }
    return taken;
  };
  const clusterPool=clusterDocs.map(d=>d.id);
  for (const day of clusterDays) { const slots=perDay-plan[day].length; if(slots<=0) continue; plan[day].push(...takeForDay(clusterPool,day,slots)); }
  const used=new Set(Object.values(plan).flat());
  const remainingUnique=allSorted.map(d=>d.id).filter(id=>!used.has(id));
  for (const day of workdays) { const slots=perDay-plan[day].length; if(slots<=0) continue; plan[day].push(...takeForDay(remainingUnique,day,slots)); }
  const visitedOnce=new Set(Object.values(plan).flat());
  const allVisitedOnce=visitedOnce.size>=doctors.length;
  if (allVisitedOnce) {
    const repeatPool=allSorted.map(d=>d.id);
    for (const day of workdays) {
      while(plan[day].length<perDay) { const idx=repeatPool.findIndex(id=>canPlaceOnDay(id,day)); if(idx===-1) break; const id=repeatPool.splice(idx,1)[0]; plan[day].push(id); repeatPool.push(id); }
    }
  }
  const scheduledOnce=new Set(Object.values(plan).flat());
  const backlog=doctors.filter(d=>!scheduledOnce.has(d.id)).map(d=>d.id);
  return { plan, backlog, meta:{year,monthIndex,perDay,clusterDaysTarget,clusterDays} };
}

function PlanningPage({ doctors }) {
  const [year, setYear] = useState(2026);
  const [monthIndex, setMonthIndex] = useState(2);
  const [perDay, setPerDay] = useState(6);
  const [clusterDaysTarget, setClusterDaysTarget] = useState(6);
  const storageKey = useMemo(()=>`medrep_planning_${monthKey(year,monthIndex)}`,[year,monthIndex]);
  const workdays = useMemo(()=>listWorkdays(year,monthIndex),[year,monthIndex]);
  const docById = useMemo(()=>{ const m=new Map(); doctors.forEach(d=>m.set(d.id,d)); return m; },[doctors]);
  const [planState, setPlanState] = useState(()=>{ const saved=loadJSON(storageKey,null); if(saved?.plan) return saved; return generatePlanning({doctors,year,monthIndex,perDay,clusterDaysTarget}); });
  useEffect(()=>{ const saved=loadJSON(storageKey,null); if(saved?.plan) setPlanState(saved); else setPlanState(generatePlanning({doctors,year,monthIndex,perDay,clusterDaysTarget})); },[storageKey]);
  useEffect(()=>saveJSON(storageKey,planState),[storageKey,planState]);
  const regenerate=()=>setPlanState(generatePlanning({doctors,year,monthIndex,perDay,clusterDaysTarget}));
  const clearMonth=()=>{ const blank={}; workdays.forEach(d=>(blank[d]=[])); setPlanState({plan:blank,backlog:doctors.map(d=>d.id),meta:{year,monthIndex,perDay,clusterDaysTarget,clusterDays:[]}}); };
  const scheduledOnceSet=useMemo(()=>new Set(Object.values(planState.plan||{}).flat()),[planState.plan]);
  const allVisitedOnce=doctors.length>0&&scheduledOnceSet.size>=doctors.length;
  const [dragId, setDragId]=useState(null);
  const [dropDay, setDropDay]=useState(null);
  const [dropBacklog, setDropBacklog]=useState(false);
  const isDocInPlan=(id,plan)=>{ for (const k of Object.keys(plan)) if((plan[k]||[]).includes(id)) return true; return false; };
  const onDropToDay=(day)=>{
    if (!dragId) return;
    setPlanState(prev=>{
      const plan={...prev.plan};
      const alreadyIn=isDocInPlan(dragId,plan);
      const doc=docById.get(dragId);
      if (doc&&CLUSTER.includes(doc.city)&&!isWedThu(day)) { alert("Cluster : uniquement Mer/Jeu ✅"); return prev; }
      if (alreadyIn&&!allVisitedOnce) { alert("Pas de 2ème visite avant que tous soient planifiés ✅"); return prev; }
      Object.keys(plan).forEach(k=>{plan[k]=(plan[k]||[]).filter(id=>id!==dragId);});
      const backlog=(prev.backlog||[]).filter(id=>id!==dragId);
      plan[day]=[...(plan[day]||[]),dragId];
      return {...prev,plan,backlog};
    });
    setDragId(null); setDropDay(null); setDropBacklog(false);
  };
  const onDropToBacklog=()=>{
    if (!dragId) return;
    setPlanState(prev=>{ const plan={...prev.plan}; Object.keys(plan).forEach(k=>{plan[k]=(plan[k]||[]).filter(id=>id!==dragId);}); const backlog=[dragId,...(prev.backlog||[]).filter(id=>id!==dragId)]; return {...prev,plan,backlog}; });
    setDragId(null); setDropDay(null); setDropBacklog(false);
  };
  const removeFromDay=(day,id)=>{ setPlanState(prev=>{ const plan={...prev.plan,[day]:(prev.plan[day]||[]).filter(x=>x!==id)}; const backlog=[id,...(prev.backlog||[]).filter(x=>x!==id)]; return {...prev,plan,backlog}; }); };
  const totalScheduled=Object.values(planState.plan||{}).flat().length;
  const activeDays=Object.entries(planState.plan||{}).filter(([,arr])=>(arr||[]).length>0).length;
  const weeks=useMemo(()=>groupWorkdaysByWeek(workdays),[workdays]);
  const realBacklog=useMemo(()=>{ const scheduled=new Set(Object.values(planState.plan||{}).flat()); return doctors.filter(d=>!scheduled.has(d.id)).map(d=>d.id); },[doctors,planState.plan]);
  return (
    <div className="content">
      <div className="pl-toolbar">
        <div style={{ minWidth:170 }}><label className="fl">Mois</label><select className="fs" value={monthIndex} onChange={e=>setMonthIndex(parseInt(e.target.value,10))}>{MFR.map((m,i)=><option key={m} value={i}>{m}</option>)}</select></div>
        <div style={{ minWidth:120 }}><label className="fl">Année</label><input className="fi" type="number" value={year} onChange={e=>setYear(parseInt(e.target.value||"2026",10))} /></div>
        <div style={{ minWidth:150 }}><label className="fl">Visites / jour</label><input className="fi" type="number" min={3} max={12} value={perDay} onChange={e=>setPerDay(parseInt(e.target.value||"6",10))} /></div>
        <div style={{ minWidth:210 }}><label className="fl">Jours cluster (Mer/Jeu)</label><input className="fi" type="number" min={0} max={workdays.filter(isWedThu).length} value={clusterDaysTarget} onChange={e=>setClusterDaysTarget(parseInt(e.target.value||"6",10))} /></div>
        <div style={{ display:"flex",gap:8 }}><button className="btn btn-p" onClick={regenerate}>⚡ Générer</button><button className="btn btn-g" onClick={clearMonth}>🧹 Vider</button></div>
        <div style={{ marginLeft:"auto",display:"flex",gap:8,flexWrap:"wrap" }}>
          <span className="pill">📅 {activeDays} jours actifs</span>
          <span className="pill" style={{ borderColor:"rgba(0,212,170,.35)" }}>✅ {totalScheduled} planifiées</span>
          <span className="pill" style={{ borderColor:allVisitedOnce?"rgba(0,212,170,.35)":"rgba(245,158,11,.35)",color:allVisitedOnce?"var(--teal)":"var(--amber)" }}>{allVisitedOnce?"Repeats autorisés":"Repeats bloqués"}</span>
        </div>
      </div>
      <div className="ok" style={{ marginBottom:12 }}>
        ✅ Planning persistant (par mois). Priorité A puis B puis C.<br/>
        📍 Cluster (Rabat/Salé/Temara/Kénitra) uniquement <b>Mer/Jeu</b>.<br/>
        🚫 Pas de médecin 2x tant que tous ne sont pas planifiés 1 fois.
      </div>
      <div className="card" style={{ marginBottom:12 }}>
        <div className="card-t">Backlog (non planifiés) <span className="pill">{realBacklog.length}</span></div>
        <div onDragOver={e=>{e.preventDefault();setDropBacklog(true);setDropDay(null);}} onDragLeave={()=>setDropBacklog(false)} onDrop={e=>{e.preventDefault();onDropToBacklog();}} className={dropBacklog?"drop-hint":""} style={{ padding:10,borderRadius:12,minHeight:70 }}>
          {realBacklog.length===0&&<div className="empty" style={{ padding:18 }}>Tout est planifié ✅</div>}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,minmax(200px,1fr))",gap:10 }}>
            {realBacklog.slice(0,40).map(id=>{ const d=docById.get(id); if(!d) return null; return (
              <div key={id} className={`chip ${dragId===id?"dragging":""}`} draggable onDragStart={()=>setDragId(id)} onDragEnd={()=>{setDragId(null);setDropBacklog(false);setDropDay(null);}}>
                <div className="chip-l"><div className="chip-n">{d.name}</div><div className="chip-s">{d.city}{d.sector?` · ${d.sector}`:""}</div></div>
                <span className={`tag t${d.potential||"C"}`}>{d.potential||"C"}</span>
              </div>
            ); })}
          </div>
        </div>
      </div>
      {weeks.map((weekDays,wi)=>{
        const weekVisits=weekDays.reduce((acc,day)=>acc+((planState.plan?.[day]||[]).length),0);
        const weekTarget=weekDays.length*perDay;
        const weekClusterDays=weekDays.filter(isWedThu).length;
        return (
          <div key={`week_${wi}`} className="week-block">
            <div className="week-head">
              <div><div className="week-title">Semaine {wi+1}</div><div className="week-sub">{weekDays.length} jours · {weekVisits}/{weekTarget} visites</div></div>
              <div className="week-kpis">
                <span className="mini-pill">📅 {weekDays.length} jours</span>
                <span className="mini-pill">🧠 {weekVisits} visites</span>
                <span className="mini-pill">📍 {weekClusterDays} Mer/Jeu</span>
              </div>
            </div>
            <div className="pl-grid-week">
              {weekDays.map(day=>{
                const dt=new Date(day),list=planState.plan?.[day]||[],isClDay=isWedThu(day);
                const statusClass=list.length===0?"emptyday":list.length>=perDay?"full":"partial";
                return (
                  <div key={day} className={`pl-day ${isClDay?"cl":""} ${statusClass} ${dropDay===day?"drop-hint":""}`}
                    onDragOver={e=>{e.preventDefault();setDropDay(day);setDropBacklog(false);}} onDragLeave={()=>setDropDay(null)} onDrop={e=>{e.preventDefault();onDropToDay(day);}}>
                    <div className="pl-dh">
                      <div>
                        <div className="pl-dn" style={{ color:isClDay?"var(--teal)":"var(--t1)" }}>{DFR[dt.getDay()]} {dt.getDate()} {MFR[dt.getMonth()]}</div>
                        <div className="pl-sub">{isClDay?"📍 Cluster autorisé":"Journée standard"}</div>
                        <div className="pl-day-topbadges">
                          {isClDay&&<span className="soft-badge ok">Mer/Jeu</span>}
                          {list.length>=perDay&&<span className="soft-badge ok">Complet</span>}
                          {list.length>0&&list.length<perDay&&<span className="soft-badge warn">Partiel</span>}
                          {list.length===0&&<span className="soft-badge">Vide</span>}
                        </div>
                      </div>
                      <span className="pill" style={{ padding:"4px 8px" }}>{list.length}/{perDay}</span>
                    </div>
                    <div className="pl-vs">
                      {list.length===0&&<div style={{ fontSize:11,color:"var(--t3)" }}>Dépose des médecins ici.</div>}
                      {list.map(id=>{ const d=docById.get(id); if(!d) return null; return (
                        <div key={id} className={`chip ${dragId===id?"dragging":""}`} draggable onDragStart={()=>setDragId(id)} onDragEnd={()=>{setDragId(null);setDropBacklog(false);setDropDay(null);}}>
                          <div className="chip-l">
                            <div className="chip-n">{d.name}</div>
                            <div className="chip-s">{d.city}{d.sector?` · ${d.sector}`:""}{CLUSTER.includes(d.city)?" · 📍cluster":""}</div>
                          </div>
                          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                            <span className={`tag t${d.potential||"C"}`}>{d.potential||"C"}</span>
                            <button className="btn btn-g" style={{ padding:"5px 8px",fontSize:11 }} onClick={()=>removeFromDay(day,id)}>✕</button>
                          </div>
                        </div>
                      ); })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="pl-footnote">💾 Tout est sauvegardé par mois. Tu peux générer puis ajuster à la main (Drag & drop).</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Reports Page
───────────────────────────────────────────────────────────── */
function ReportsPage({ doctors, setDoctors, apiKey, provider, model, setPage }) {
  const reportsKey="medrep_reports_v1",actionsKey="medrep_actions_v1";
  const [selectedId, setSelectedId]=useState(doctors[0]?.id||null);
  const [reports, setReports]=useState(()=>loadJSON(reportsKey,{}));
  const [actions, setActions]=useState(()=>loadJSON(actionsKey,{}));
  useEffect(()=>saveJSON(reportsKey,reports),[reports]);
  useEffect(()=>saveJSON(actionsKey,actions),[actions]);
  const docById=useMemo(()=>{ const m=new Map(); doctors.forEach(d=>m.set(d.id,d)); return m; },[doctors]);
  const selectedDoctor=selectedId?docById.get(selectedId):null;
  const doctorReports=(selectedId&&reports[selectedId])?reports[selectedId]:[];
  const [text, setText]=useState("");
  const [transcript, setTranscript]=useState("");
  const [saving, setSaving]=useState(false);
  const [dictating, setDictating]=useState(false);
  const speechRef=useRef(null);
  const speechSupported=useMemo(()=>typeof window!=="undefined"&&(window.SpeechRecognition||window.webkitSpeechRecognition),[]);
  const startDictation=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) return alert("Dictée non supportée. Utilise Chrome/Edge.");
    const rec=new SR(); rec.lang="fr-FR"; rec.interimResults=true; rec.continuous=true;
    rec.onresult=(e)=>{ let ft=""; for(let i=e.resultIndex;i<e.results.length;i++){const chunk=e.results[i][0]?.transcript||"";if(e.results[i].isFinal)ft+=chunk+" ";} if(ft) setTranscript(prev=>(prev+" "+ft).trim()); };
    rec.onerror=()=>setDictating(false); rec.onend=()=>setDictating(false);
    speechRef.current=rec; setDictating(true); rec.start();
  };
  const stopDictation=()=>{ try{speechRef.current?.stop();}catch{} setDictating(false); };
  const [recording, setRecording]=useState(false);
  const mediaRecRef=useRef(null),chunksRef=useRef([]);
  const mediaSupported=useMemo(()=>typeof window!=="undefined"&&navigator?.mediaDevices?.getUserMedia,[]);
  const startRecording=async()=>{
    if (!mediaSupported) return alert("Audio non supporté.");
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const mr=new MediaRecorder(stream); chunksRef.current=[];
    mr.ondataavailable=e=>{if(e.data?.size)chunksRef.current.push(e.data);};
    mr.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());};
    mediaRecRef.current=mr; setRecording(true); mr.start();
  };
  const stopRecordingAndSave=async()=>{
    if (!mediaRecRef.current) return null; setRecording(false);
    const mr=mediaRecRef.current;
    const done=new Promise(resolve=>{
      const prev=mr.onstop; mr.onstop=async()=>{try{prev&&prev();}catch{} const blob=new Blob(chunksRef.current,{type:"audio/webm"}); resolve(blob);};
    });
    mr.stop(); return await done;
  };
  const addReport=async({audioBlob=null}={})=>{
    if (!selectedId) return;
    const content=(text||"").trim(), trans=(transcript||"").trim();
    if (!content&&!trans&&!audioBlob) return alert("Écris un compte-rendu ou fais une dictée/audio.");
    setSaving(true);
    try {
      const rId=`r_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      let audioKey=null;
      if (audioBlob) { audioKey=`audio_${rId}`; await idbPut(audioKey,audioBlob); }
      const item={id:rId,createdAt:dtNowISO(),text:content,transcript:trans,audioKey};
      setReports(prev=>{ const list=prev[selectedId]?[...prev[selectedId]]:[]; list.unshift(item); return {...prev,[selectedId]:list}; });
      setText(""); setTranscript("");
    } finally { setSaving(false); }
  };
  const playAudio=async(audioKey)=>{
    if (!audioKey) return; const blob=await idbGet(audioKey); if (!blob) return alert("Audio introuvable.");
    const url=URL.createObjectURL(blob); const a=new Audio(url); a.onended=()=>URL.revokeObjectURL(url); a.play();
  };
  const deleteReport=async(rid)=>{
    if (!selectedId||!confirm("Supprimer ?")) return;
    const rep=doctorReports.find(x=>x.id===rid);
    if (rep?.audioKey) { try{await idbDel(rep.audioKey);}catch{} }
    setReports(prev=>({...prev,[selectedId]:(prev[selectedId]||[]).filter(x=>x.id!==rid)}));
  };
  const [analyzing, setAnalyzing]=useState(false);
  const [aiErr, setAiErr]=useState("");
  const analyze=async()=>{
    if (!apiKey) return setPage("settings");
    if (!selectedDoctor) return;
    const last=doctorReports.slice(0,5);
    if (last.length===0) return alert("Ajoute au moins un compte-rendu avant l'analyse IA.");
    const prompt=`Tu es chargé d'analyser un neurologue dans le cadre de la promotion de Fumetil.\n\nCONTEXTE : Le but est d'aider le délégué médical à faire progresser ce médecin vers la prescription de Fumetil, de manière scientifique, crédible, éthique et conforme.\n\nFICHE MÉDECIN :\n- Nom : ${selectedDoctor.name}\n- Ville : ${selectedDoctor.city}\n- Secteur : ${selectedDoctor.sector||"—"}\n- Potentiel : ${selectedDoctor.potential||"—"}\n\nDERNIERS COMPTES-RENDUS :\n${last.map((r,i)=>`[${i+1}]\nDate : ${r.createdAt}\nTexte : ${r.text||"—"}\nDictée : ${r.transcript||"—"}`).join("\n")}\n\nFORMAT DE SORTIE OBLIGATOIRE :\n\n## Score d'adoption Fumetil\n- Score : X/100\n- Stade : froid / intérêt faible / potentiel de prescription / prescripteur probable\n- Probabilité actuelle de prescription : faible / moyenne / élevée\n\n## Lecture de la situation\n- Résumé clair\n\n## Signaux positifs détectés\n- Liste\n\n## Freins / objections\n- Frein principal : ...\n\n## Leviers d'influence autorisés\n- ...\n\n## Argumentaire recommandé\n- ...\n\n## Questions de découverte à poser\n- ...\n\n## Prochaines actions concrètes\n- ...\n\n## Objectif next visit\n- ...\n\n## Niveau de priorité\n- Priorité : haute / moyenne / basse`;
    setAnalyzing(true); setAiErr("");
    try {
      const out=await callLLM(prompt,apiKey,provider,model);
      const insights=extractAdoptionInsights(out);
      setActions(prev=>({...prev,[selectedId]:{generatedAt:dtNowISO(),text:out}}));
      setDoctors(prev=>stableSortDocs(prev.map(doc=>doc.id===selectedId?{...doc,adoptionScore:insights.adoptionScore,mainObjection:insights.mainObjection||doc.mainObjection||"",nextVisitGoal:insights.nextVisitGoal||doc.nextVisitGoal||"",priorityLevel:insights.priorityLevel||doc.priorityLevel||""}:doc)));
    } catch(e) { setAiErr(e.message); }
    setAnalyzing(false);
  };
  if (!doctors.length) return <div className="content"><div className="card"><div className="empty">Aucun médecin.</div></div></div>;
  return (
    <div className="content">
      <div className="g2" style={{ alignItems:"start" }}>
        <div className="card">
          <div className="card-t">🧾 Compte-rendu visite</div>
          <div className="fg">
            <label className="fl">Médecin</label>
            <select className="fs" value={selectedId||""} onChange={e=>setSelectedId(parseInt(e.target.value,10))}>
              {doctors.map(d=><option key={d.id} value={d.id}>{d.name} — {d.city}{d.sector?` (${d.sector})`:""}</option>)}
            </select>
          </div>
          <div className="grid2">
            <div className="fg"><label className="fl">Compte-rendu (texte)</label><textarea className="fta" placeholder="Échanges, intérêt, objections..." value={text} onChange={e=>setText(e.target.value)} /></div>
            <div className="fg">
              <label className="fl">Dictée</label>
              <textarea className="fta" placeholder={speechSupported?"Clique Démarrer...":"Non supporté."} value={transcript} onChange={e=>setTranscript(e.target.value)} />
              <div style={{ display:"flex",gap:8,marginTop:8 }}>
                <button className="btn btn-blue" disabled={!speechSupported||dictating} onClick={startDictation}>🎙️ Démarrer</button>
                <button className="btn btn-g" disabled={!dictating} onClick={stopDictation}>⏹️ Stop</button>
              </div>
            </div>
          </div>
          <div className="sep" />
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
            <button className="btn btn-p" disabled={saving} onClick={()=>addReport({audioBlob:null})}>{saving?<span className="sp"/>:"💾 Sauvegarder"}</button>
            <button className="btn btn-g" onClick={()=>{setText("");setTranscript("");}}>🧹 Effacer</button>
            <span className="pill" style={{ marginLeft:"auto" }}>{doctorReports.length} CR</span>
          </div>
          <div className="sep" />
          <div className="card-t" style={{ marginBottom:8 }}>🎧 Enregistrement audio</div>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <button className="btn btn-blue" disabled={!mediaSupported||recording} onClick={startRecording}>⏺️ Enregistrer</button>
            <button className="btn btn-g" disabled={!recording} onClick={async()=>{ const blob=await stopRecordingAndSave(); if(!blob) return; await addReport({audioBlob:blob}); }}>⏹️ Stop + Sauver</button>
          </div>
        </div>
        <div className="card">
          <div className="card-t">🤖 Actions IA <span className="pill" style={{ borderColor:apiKey?"rgba(0,212,170,.35)":"rgba(244,63,94,.35)",color:apiKey?"var(--teal)":"var(--rose)" }}>{apiKey?"IA ON":"IA OFF"}</span></div>
          {!apiKey&&<div className="warn" style={{ marginBottom:10 }}>⚠️ Configure l'API dans Paramètres.</div>}
          <button className="btn btn-p" onClick={analyze} disabled={!apiKey||analyzing||!selectedDoctor}>{analyzing?<><span className="sp"/> Analyse…</>:"⚡ Analyser le médecin"}</button>
          {aiErr&&<div className="warn" style={{ marginTop:10 }}>⚠️ {aiErr}</div>}
          <div className="sep" />
          {!actions[selectedId]?.text?(
            <div className="empty" style={{ padding:20 }}>Lance l'analyse IA après avoir ajouté des comptes-rendus.</div>
          ):(
            <div>
              <div className="mini" style={{ marginBottom:8 }}>Généré: {new Date(actions[selectedId].generatedAt).toLocaleString("fr-FR")}</div>
              <div style={{ whiteSpace:"pre-wrap",lineHeight:1.7,fontSize:13,background:"rgba(255,255,255,.02)",border:"1px solid var(--bdr)",borderRadius:12,padding:12 }}>{actions[selectedId].text}</div>
              <div style={{ display:"flex",gap:8,marginTop:10 }}>
                <button className="btn btn-g" onClick={()=>navigator.clipboard.writeText(actions[selectedId].text)}>📋 Copier</button>
                <button className="btn btn-rose" onClick={()=>{if(confirm("Supprimer ?")) setActions(p=>({...p,[selectedId]:null}));}}>🗑️</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ height:12 }} />
      <div className="card">
        <div className="card-t">📚 Historique comptes-rendus</div>
        {doctorReports.length===0?(
          <div className="empty" style={{ padding:22 }}>Aucun compte-rendu.</div>
        ):(
          <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10 }}>
            {doctorReports.slice(0,10).map(r=>(
              <div key={r.id} style={{ border:"1px solid var(--bdr)",borderRadius:12,padding:12,background:"rgba(255,255,255,.02)" }}>
                <div style={{ display:"flex",justifyContent:"space-between",gap:10 }}>
                  <div style={{ fontFamily:"var(--fd)",fontWeight:800,fontSize:12 }}>{new Date(r.createdAt).toLocaleString("fr-FR")}</div>
                  <div style={{ display:"flex",gap:8 }}>
                    {r.audioKey&&<button className="btn btn-g" style={{ padding:"5px 10px" }} onClick={()=>playAudio(r.audioKey)}>▶︎</button>}
                    <button className="btn btn-rose" style={{ padding:"5px 10px" }} onClick={()=>deleteReport(r.id)}>🗑️</button>
                  </div>
                </div>
                <div className="mini" style={{ marginTop:8 }}><b>Texte:</b> {r.text?r.text.slice(0,240):"—"}</div>
                <div className="mini" style={{ marginTop:8 }}><b>Dictée:</b> {r.transcript?r.transcript.slice(0,240):"—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Assistant
───────────────────────────────────────────────────────────── */
function NoApiBanner({ setPage }) {
  return (
    <div className="content" style={{ display:"flex",justifyContent:"center",alignItems:"center",minHeight:"70vh" }}>
      <div className="card" style={{ maxWidth:720 }}>
        <div style={{ fontSize:46,opacity:.8,marginBottom:12 }}>🔑</div>
        <div style={{ fontFamily:"var(--fd)",fontSize:22,fontWeight:800,marginBottom:10 }}>Assistant IA non configuré</div>
        <div style={{ color:"var(--t2)",lineHeight:1.7,marginBottom:14 }}>Ajoute ta clé API dans <strong>Paramètres</strong>.</div>
        <button className="btn btn-p" onClick={()=>setPage("settings")}>⚙️ Configurer →</button>
      </div>
    </div>
  );
}
function Assistant({ apiKey, provider, model, setPage }) {
  const [msgs, setMsgs]=useState([{ role:"assistant", text:`Bonjour ! ${provider?.icon||"✦"}\nJe suis ton assistant IA terrain orienté Fumetil.\n\nJe peux t'aider à préparer tes visites, gérer les objections, identifier les neurologues les plus réceptifs, et définir l'objectif de la prochaine visite.`, time:tNow() }]);
  const [inp, setInp]=useState("");
  const [loading, setLoading]=useState(false);
  const [err, setErr]=useState("");
  const bot=useRef(null);
  useEffect(()=>{bot.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);
  const send=async()=>{
    const m=inp.trim(); if(!m||loading||!apiKey) return;
    setErr(""); setInp(""); setMsgs(p=>[...p,{role:"user",text:m,time:tNow()}]); setLoading(true);
    try { const r=await callLLM(m,apiKey,provider,model); setMsgs(p=>[...p,{role:"assistant",text:r,time:tNow()}]); }
    catch(e) { setErr(e.message); }
    setLoading(false);
  };
  if (!apiKey) return <NoApiBanner setPage={setPage} />;
  return (
    <div className="content" style={{ padding:0 }}>
      <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 52px)" }}>
        <div style={{ flex:1,overflowY:"auto",padding:16 }}>
          {msgs.map((m,i)=>(
            <div key={i} style={{ marginBottom:10,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"78%",background:m.role==="user"?(provider?.color||"var(--teal)"):"var(--navy3)",color:m.role==="user"?"var(--navy)":"var(--t1)",border:`1px solid ${m.role==="user"?"transparent":"var(--bdr)"}`,borderRadius:12,padding:"10px 12px",whiteSpace:"pre-wrap",lineHeight:1.6,fontSize:13,fontWeight:m.role==="user"?600:400 }}>
                {m.text}
                <div style={{ fontSize:10,opacity:.6,marginTop:6,textAlign:m.role==="user"?"right":"left" }}>{m.time}</div>
              </div>
            </div>
          ))}
          {loading&&<div className="pill"><span className="sp"/> Génération…</div>}
          {err&&<div style={{ marginTop:10,color:"var(--rose)",fontSize:12 }}>⚠️ {err}</div>}
          <div ref={bot} />
        </div>
        <div style={{ borderTop:"1px solid var(--bdr)",padding:12,background:"rgba(10,15,30,0.5)" }}>
          <div style={{ display:"flex",gap:8 }}>
            <textarea className="fi" style={{ flex:1,resize:"none" }} rows={2} placeholder="Pose ta question… (Entrée pour envoyer)" value={inp} onChange={e=>setInp(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} />
            <button className="btn btn-p" onClick={send} disabled={!inp.trim()||loading} style={{ background:provider?.color||"var(--teal)" }}>{loading?<span className="sp"/>:"↑"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Modal */
function Modal({ title, subtitle, children, onClose, actions=[] }) {
  return (
    <div className="ov" onMouseDown={onClose}>
      <div className="mo" onMouseDown={e=>e.stopPropagation()}>
        <div className="mo-t">{title}</div>
        {subtitle&&<div className="mo-s">{subtitle}</div>}
        {children}
        <div className="mo-f">
          {actions.map((a,i)=><button key={i} className={`btn ${a.kind==="p"?"btn-p":a.kind==="blue"?"btn-blue":a.kind==="rose"?"btn-rose":"btn-g"}`} onClick={a.onClick} disabled={a.disabled}>{a.label}</button>)}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  APP
───────────────────────────────────────────────────────────── */
export default function App() {
  const enrichDoctor=(d)=>({...d,adoptionScore:d?.adoptionScore??null,mainObjection:d?.mainObjection??"",nextVisitGoal:d?.nextVisitGoal??"",priorityLevel:d?.priorityLevel??""});
  const [doctors, setDoctors]=useState(()=>{ const saved=loadJSON("medrep_doctors_v1",null); if(Array.isArray(saved)&&saved.length) return stableSortDocs(saved.map(enrichDoctor)); return stableSortDocs(DOCS_FALLBACK.map(enrichDoctor)); });
  useEffect(()=>saveJSON("medrep_doctors_v1",doctors),[doctors]);
  const [apiKey, setApiKey]=useState(()=>(localStorage.getItem("medrep_apiKey")||""));
  const [provider, setProvider]=useState(()=>detectProvider(localStorage.getItem("medrep_apiKey")||""));
  const [model, setModel]=useState(()=>(localStorage.getItem("medrep_model")||""));
  useEffect(()=>{try{localStorage.setItem("medrep_apiKey",apiKey||"");}catch{}},[apiKey]);
  useEffect(()=>{try{localStorage.setItem("medrep_model",model||"");}catch{}},[model]);
  useEffect(()=>{setProvider(detectProvider(apiKey));},[apiKey]);
  const hasApi=!!apiKey.trim();
  const [page, setPage]=useState("dashboard");

  const NAV=[
    {sec:"Principal",items:[
      {id:"dashboard",ic:"⊞",lbl:"Dashboard"},
      {id:"fumetil",ic:"📊",lbl:"Fumetil CRM",badge:"NEW"},
      {id:"assistant",ic:provider?.icon||"✦",lbl:"Assistant IA",needsApi:true},
    ]},
    {sec:"Terrain",items:[
      {id:"planning",ic:"📅",lbl:"Planning visites"},
      {id:"reports",ic:"📝",lbl:"Comptes-rendus"},
      {id:"doctors",ic:"👨‍⚕️",lbl:"Médecins"},
    ]},
    {sec:"Compte",items:[
      {id:"settings",ic:"⚙️",lbl:"Paramètres"},
    ]},
  ];

  const TITLES={
    dashboard:"Vue d'ensemble",
    fumetil:"Dashboard Commercial Fumetil",
    assistant:`Assistant IA · ${provider?.name||"Non configuré"}`,
    planning:"Planning · Génération & optimisation",
    reports:"Comptes-rendus · Actions IA",
    doctors:"Médecins · Base & édition",
    settings:"Paramètres & API"
  };

  const render=()=>{
    switch(page){
      case "dashboard": return <Dashboard doctors={doctors} setPage={setPage} hasApi={hasApi} provider={provider} />;
      case "fumetil":   return <FumetilDashboard doctors={doctors} setPage={setPage} />;
      case "assistant": return <Assistant apiKey={apiKey} provider={provider} model={model||provider?.defaultModel} setPage={setPage} />;
      case "planning":  return <PlanningPage doctors={doctors} />;
      case "reports":   return <ReportsPage doctors={doctors} setDoctors={setDoctors} apiKey={apiKey} provider={provider} model={model||provider?.defaultModel} setPage={setPage} />;
      case "doctors":   return <DoctorsPage doctors={doctors} setDoctors={setDoctors} />;
      case "settings":  return <SettingsPage apiKey={apiKey} setApiKey={setApiKey} model={model||provider?.defaultModel} setModel={setModel} provider={provider} setProvider={setProvider} />;
      default: return null;
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
            <div><div className="logo-t">MedRep AI</div><div className="logo-s">Neurologie · Maroc</div></div>
          </div>
          <nav className="sb-nav">
            {NAV.map(s=>(
              <div key={s.sec} className="nav-sec">
                <div className="nav-lbl">{s.sec}</div>
                {s.items.map(it=>(
                  <div key={it.id} className={`nav-it${page===it.id?" on":""}`} onClick={()=>setPage(it.id)}>
                    <span style={{ fontSize:14,width:20,textAlign:"center",flexShrink:0 }}>{it.ic}</span>
                    {it.lbl}
                    {it.badge&&<span className="nav-badge ok" style={{ background:"var(--violet)",color:"#fff" }}>{it.badge}</span>}
                    {it.needsApi&&(hasApi?<span className="nav-badge ok">ON</span>:<span className="nav-badge">OFF</span>)}
                  </div>
                ))}
              </div>
            ))}
          </nav>
          <div className="sb-foot">
            <div style={{ padding:"0 10px 8px",fontSize:10,color:"var(--t3)",display:"flex",alignItems:"center",gap:6 }}>
              {hasApi?(
                <><span style={{ width:6,height:6,borderRadius:"50%",background:provider?.color||"#4285f4",boxShadow:`0 0 5px ${provider?.color||"#4285f4"}`,display:"inline-block" }}/>{provider?.name||"IA"} · {(model||provider?.defaultModel)}</>
              ):(
                <><span style={{ width:6,height:6,borderRadius:"50%",background:"var(--t3)",display:"inline-block" }}/>IA non configurée</>
              )}
            </div>
            <div className="u-card">
              <div className="u-av">DM</div>
              <div><div style={{ fontSize:12,fontWeight:600 }}>Délégué Médical</div><div style={{ fontSize:10,color:"var(--t3)" }}>Maroc · Neurologie</div></div>
            </div>
          </div>
        </aside>
        <main className="main">
          <div className="topbar">
            <div className="tb-title">{TITLES[page]}</div>
            {!hasApi&&<button className="btn btn-blue" style={{ fontSize:11 }} onClick={()=>setPage("settings")}>🔑 Configurer API</button>}
            {hasApi&&<button className="btn btn-g" style={{ fontSize:11 }} onClick={()=>setPage("assistant")}>{provider?.icon||"✦"} Assistant IA</button>}
            <button className="btn btn-p" style={{ fontSize:11 }} onClick={()=>setPage("fumetil")}>📊 Fumetil CRM</button>
          </div>
          {render()}
        </main>
      </div>
    </>
  );
}
