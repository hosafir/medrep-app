import { useEffect, useMemo, useRef, useState, useContext, createContext } from "react";
import * as XLSX from 'xlsx';

// --- CONFIGURATION JSONBIN ---
const JSONBIN_MASTER_KEY = import.meta.env.VITE_JSONBIN_KEY; 
const JSONBIN_BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID || null;
const IS_CLOUD_CONFIGURED = !!JSONBIN_MASTER_KEY;

async function loadCloudData() {
  if (!IS_CLOUD_CONFIGURED || !JSONBIN_BIN_ID) return null;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_MASTER_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.record;
  } catch (e) {
    console.error("Erreur Cloud Load:", e);
    return null;
  }
}

async function saveCloudData(data) {
  if (!IS_CLOUD_CONFIGURED) return;
  try {
    if (JSONBIN_BIN_ID) {
      await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_MASTER_KEY
        },
        body: JSON.stringify(data)
      });
      console.log("☁️ Sauvegarde Cloud réussie");
    } else {
       const res = await fetch(`https://api.jsonbin.io/v3/b`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_MASTER_KEY,
          'X-Bin-Name': 'MedRep-Data'
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.metadata?.id) {
        alert(`✅ Cloud initialisé !\n\nCopiez cet ID dans Vercel (VITE_JSONBIN_BIN_ID) :\n\n${result.metadata.id}`);
      }
    }
  } catch (e) {
    console.error("Erreur Cloud Save:", e);
  }
}
// --- FIN CONFIGURATION ---

const CHAT_HISTORY_KEY = "medrep_assistant_history_v1";

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
    .main{flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative}
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
    .chip{padding:8px 10px;border-radius:10px;background:var(--navy4);border:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;gap:8px;cursor:grab}
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
    .fum-hero{background:linear-gradient(135deg,rgba(0,212,170,.12) 0%,rgba(139,92,246,.08) 50%,rgba(59,130,246,.06) 100%);border:1px solid rgba(0,212,170,.2);border-radius:16px;padding:20px 24px;margin-bottom:16px;position:relative;overflow:hidden}
    .fum-hero::before{content:'';position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,170,.1),transparent 70%);pointer-events:none}
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
    .temp-bar.chaud{background:var(--rose)}.temp-bar.tiede{background:var(--amber)}.temp-bar.froid{background:var(--blue)}.temp-bar.nevalue{background:var(--t3)}
    .fum-3col{display:grid;grid-template-columns:1.3fr 1fr 1.2fr;gap:14px;margin-bottom:16px}
    .city-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bdr)}
    .city-row:last-child{border-bottom:none}
    .city-name{font-size:12px;font-weight:600;min-width:90px;flex-shrink:0}
    .city-bar-wrap{flex:1;background:var(--navy4);border-radius:4px;height:8px;overflow:hidden}
    .city-score-val{font-family:var(--fd);font-size:12px;font-weight:800;min-width:38px;text-align:right}
    .city-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
    .obj-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--bdr)}
    .obj-row:last-child{border-bottom:none}
    .obj-rank{font-family:var(--fd);font-size:11px;font-weight:800;color:var(--t3);min-width:22px}
    .obj-text{font-size:11px;color:var(--t1);flex:1;line-height:1.4}
    .obj-cnt{font-family:var(--fd);font-size:12px;font-weight:800;min-width:24px;text-align:right}
    .obj-bar-wrap{width:60px;background:var(--navy4);border-radius:4px;height:5px;overflow:hidden}
    .obj-bar-fill{height:100%;border-radius:4px;background:var(--rose);transition:width 1.2s ease}
    .prio-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:10px;border:1px solid var(--bdr);margin-bottom:6px;transition:all .15s;cursor:default}
    .prio-row:hover{background:rgba(255,255,255,.03)}
    .prio-row.haute{border-color:rgba(0,212,170,.2);background:rgba(0,212,170,.04)}
    .prio-name{font-size:12px;font-weight:600;flex:1}
    .prio-city{font-size:10px;color:var(--t3)}
    .top5-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid var(--bdr);background:rgba(255,255,255,.02);transition:all .15s}
    .top5-item:hover{background:rgba(255,255,255,.04);border-color:rgba(0,212,170,.2)}
    .top5-rank{font-family:var(--fd);font-size:13px;font-weight:800;min-width:22px;color:var(--t3)}
    .top5-rank.gold{color:#f59e0b}.top5-rank.silver{color:#94a3b8}.top5-rank.bronze{color:#c07a4f}
    .top5-info{flex:1;min-width:0}
    .top5-name{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .top5-meta{font-size:10px;color:var(--t3);margin-top:2px}
    .fum-insight{border-radius:12px;padding:12px 14px;border:1px solid;margin-bottom:8px;font-size:12px;line-height:1.6}
    .fum-insight.good{background:rgba(0,212,170,.07);border-color:rgba(0,212,170,.2);color:var(--teal)}
    .fum-insight.warn{background:rgba(245,158,11,.07);border-color:rgba(245,158,11,.2);color:var(--amber)}
    .fum-insight.info{background:rgba(59,130,246,.07);border-color:rgba(59,130,246,.2);color:var(--blue)}
    .opp-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;border:1px solid var(--bdr);margin-bottom:6px;transition:all .15s;cursor:pointer}
    .opp-item:hover{background:rgba(255,255,255,.04);transform:translateX(2px)}
    .opp-item.hot{border-color:rgba(0,212,170,.35);background:rgba(0,212,170,.06)}
    .opp-item.risk{border-color:rgba(244,63,94,.25);background:rgba(244,63,94,.05)}
    .opp-item.warn{border-color:rgba(245,158,11,.3);background:rgba(245,158,11,.05)}
    .opp-ic{font-size:18px;width:28px;text-align:center;flex-shrink:0}
    .opp-info{flex:1;min-width:0}
    .opp-name{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .opp-why{font-size:10px;color:var(--t2);margin-top:2px;line-height:1.4}
    .prio-ai-item{display:flex;align-items:flex-start;gap:10px;padding:9px 12px;border-radius:10px;border:1px solid var(--bdr);margin-bottom:6px}
    .prio-ai-item.h{border-color:rgba(0,212,170,.3);background:rgba(0,212,170,.05)}
    .prio-ai-item.m{border-color:rgba(245,158,11,.2);background:rgba(245,158,11,.04)}
    .prio-ai-rank{font-family:var(--fd);font-size:12px;font-weight:800;min-width:22px}
    .prio-ai-n{font-size:12px;font-weight:700;flex:1}
    .prio-ai-why{font-size:10px;color:var(--t2);margin-top:3px;line-height:1.5}
    .route-city-card{background:var(--navy3);border:1px solid var(--bdr);border-radius:12px;margin-bottom:10px;overflow:hidden}
    .route-city-hd{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(0,212,170,.06);border-bottom:1px solid var(--bdr)}
    .route-city-nm{font-family:var(--fd);font-size:13px;font-weight:800}
    .route-doc-row{display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid var(--bdr)}
    .route-doc-row:last-child{border-bottom:none}
    .route-num{font-family:var(--fd);font-size:11px;font-weight:800;color:var(--teal);min-width:22px}
    .route-info{flex:1;min-width:0}
    .route-name{font-size:11px;font-weight:700}
    .route-meta{font-size:10px;color:var(--t3)}
    .mem-item{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid var(--bdr);font-size:12px}
    .mem-item:last-child{border-bottom:none}
    .mem-key{color:var(--teal);min-width:110px;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding-top:1px;flex-shrink:0}
    .mem-val{color:var(--t1);flex:1;line-height:1.5}
    .msg-type-btn{padding:6px 14px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--bdr);color:var(--t2);background:transparent;transition:all .15s}
    .msg-type-btn.active{background:var(--tealglow);color:var(--teal);border-color:var(--bdra)}
    .msg-output{background:var(--navy4);border:1px solid rgba(0,212,170,.2);border-radius:10px;padding:14px;font-size:12px;line-height:1.8;color:var(--t1);white-space:pre-wrap;min-height:120px}
    .cd-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
    .cd-section{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px}
    .cd-section-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
    .perf-bar-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--bdr)}
    .perf-bar-row:last-child{border-bottom:none}
    .perf-lbl{font-size:11px;color:var(--t2);min-width:90px;flex-shrink:0}
    .perf-val{font-family:var(--fd);font-size:13px;font-weight:800;min-width:48px;text-align:right}
    .proba-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:700;border:1px solid}
    .proba-badge.high{background:rgba(0,212,170,.12);border-color:rgba(0,212,170,.3);color:var(--teal)}
    .proba-badge.med{background:rgba(245,158,11,.1);border-color:rgba(245,158,11,.25);color:var(--amber)}
    .proba-badge.low{background:rgba(244,63,94,.1);border-color:rgba(244,63,94,.25);color:var(--rose)}
    .vp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px);animation:fadeIn .15s ease}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .vp-modal{background:var(--navy2);border:1px solid rgba(0,212,170,.25);border-radius:20px;width:100%;max-width:960px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;animation:mi .2s ease;box-shadow:0 24px 80px rgba(0,0,0,.7)}
    .vp-header{padding:20px 24px 16px;background:linear-gradient(135deg,rgba(0,212,170,.08),rgba(139,92,246,.06));border-bottom:1px solid var(--bdr);flex-shrink:0}
    .vp-header-top{display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap}
    .vp-avatar{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--teal),#00a884);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0;color:var(--navy);box-shadow:0 0 20px var(--tealglow)}
    .vp-name{font-family:var(--fd);font-size:20px;font-weight:800;line-height:1.2;margin-bottom:4px}
    .vp-meta{font-size:12px;color:var(--t2);display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .vp-close{margin-left:auto;background:rgba(255,255,255,.08);border:1px solid var(--bdr);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:18px;color:var(--t2);transition:all .15s;flex-shrink:0}
    .vp-close:hover{background:rgba(244,63,94,.15);color:var(--rose);border-color:rgba(244,63,94,.3)}
    .vp-score-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}
    .vp-kpi{background:var(--navy3);border:1px solid var(--bdr);border-radius:10px;padding:10px 14px;flex:1;min-width:120px}
    .vp-kpi-lbl{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
    .vp-kpi-val{font-family:var(--fd);font-size:18px;font-weight:800;line-height:1}
    .vp-body{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px}
    .vp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .vp-section{background:var(--navy3);border:1px solid var(--bdr);border-radius:12px;padding:14px}
    .vp-section.accent-teal{border-color:rgba(0,212,170,.25);background:rgba(0,212,170,.04)}
    .vp-section.accent-amber{border-color:rgba(245,158,11,.2);background:rgba(245,158,11,.04)}
    .vp-section.accent-rose{border-color:rgba(244,63,94,.2);background:rgba(244,63,94,.04)}
    .vp-section.accent-blue{border-color:rgba(59,130,246,.2);background:rgba(59,130,246,.04)}
    .vp-section.accent-violet{border-color:rgba(139,92,246,.2);background:rgba(139,92,246,.04)}
    .vp-sec-title{font-family:var(--fd);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;display:flex;align-items:center;gap:6px}
    .vp-sec-body{font-size:12px;line-height:1.75;color:var(--t1)}
    .vp-sec-body.muted{color:var(--t2)}
    .vp-bullet{display:flex;gap:8px;margin-bottom:5px;font-size:12px;line-height:1.55}
    .vp-bullet-dot{width:5px;height:5px;border-radius:50%;background:var(--teal);flex-shrink:0;margin-top:6px}
    .vp-reports{display:flex;flex-direction:column;gap:8px}
    .vp-report-item{background:var(--navy4);border:1px solid var(--bdr);border-radius:10px;padding:10px 12px}
    .vp-report-date{font-size:10px;color:var(--t3);margin-bottom:4px;font-family:var(--fd);font-weight:600}
    .vp-report-text{font-size:11px;color:var(--t2);line-height:1.6}
    .vp-footer{padding:14px 24px;border-top:1px solid var(--bdr);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;background:rgba(10,15,30,.5);flex-wrap:wrap;gap:8px}
    .chip-eye{background:rgba(0,212,170,.12);border:1px solid rgba(0,212,170,.2);border-radius:6px;padding:3px 6px;font-size:10px;cursor:pointer;color:var(--teal);flex-shrink:0;transition:all .15s;white-space:nowrap}
    .chip-eye:hover{background:rgba(0,212,170,.25)}
    .chip-clickable{cursor:pointer}
    .chip-clickable:hover .chip-n{color:var(--teal)}
    .vp-ai-raw{background:var(--navy4);border:1px solid var(--bdr);border-radius:10px;padding:12px;font-size:11px;line-height:1.7;color:var(--t2);white-space:pre-wrap;max-height:300px;overflow-y:auto}
    .vp-tab-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
    .vp-tab{padding:5px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--bdr);color:var(--t2);background:transparent;transition:all .15s}
    .vp-tab.active{background:var(--tealglow);color:var(--teal);border-color:var(--bdra)}
    .vp-tab:hover:not(.active){background:var(--navy3);color:var(--t1)}
    .vp-analyzing{display:flex;flex-direction:column;align-items:center;gap:12px;padding:40px 20px;color:var(--t2);font-size:13px}
    .tl-wrap{position:relative;padding-left:22px}
    .tl-wrap::before{content:'';position:absolute;left:7px;top:4px;bottom:4px;width:2px;background:linear-gradient(to bottom,rgba(0,212,170,.6),rgba(0,212,170,.05))}
    .tl-item{position:relative;margin-bottom:12px}
    .tl-dot{position:absolute;left:-19px;top:3px;width:10px;height:10px;border-radius:50%;background:var(--teal);border:2px solid var(--navy2);box-shadow:0 0 8px rgba(0,212,170,.5)}
    .tl-dot.old{background:var(--t3);box-shadow:none}
    .tl-date{font-size:10px;color:var(--t3);font-family:var(--fd);font-weight:700;margin-bottom:3px}
    .tl-body{font-size:11px;color:var(--t2);line-height:1.6;background:var(--navy4);border:1px solid var(--bdr);border-radius:8px;padding:8px 10px}
    @keyframes countUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    .anim-in{animation:countUp .4s ease both}

    /* --- RESPONSIVE MOBILE --- */
    @media (max-width: 860px) {
      .sb { position: fixed; left: -260px; transition: left .2s ease; z-index: 100; box-shadow: none; }
      .sb.open { left: 0; box-shadow: 0 0 30px rgba(0,0,0,.5); }
      .main { width: 100%; }
      .tb-title { font-size: 14px; }
      .hamburger { display: flex !important; align-items: center; justify-content: center; width: 40px; height: 40px; background: var(--navy3); border: 1px solid var(--bdr); border-radius: 8px; color: var(--t1); font-size: 20px; cursor: pointer; margin-right: 10px; }
      .g2, .grid2, .fum-3col, .cd-section, .cd-section-2 { grid-template-columns: 1fr; }
      .kpi-grid, .cd-kpi-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
      .pl-grid-week { grid-template-columns: 1fr; gap: 8px; }
      .pl-day { min-height: auto; }
      .tw { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      table { min-width: 600px; }
      .vp-modal, .mo { max-width: 98%; width: 100%; height: 100vh; max-height: 100vh; border-radius: 0; }
      .vp-overlay { padding: 0; }
      .sb-foot { display: none; }
    }

    @media (max-width: 480px) {
      .kpi-grid, .cd-kpi-grid { grid-template-columns: 1fr; }
      .vp-score-row { flex-direction: column; gap: 6px; }
      .vp-kpi { width: 100%; }
    }
  `}</style>
);
/* ─── Storage helpers ─── */
function loadJSON(key,fallback){try{const r=localStorage.getItem(key);if(!r)return fallback;return JSON.parse(r);}catch{return fallback;}}
function saveJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}

/* ─── IndexedDB Storage (Audio + Knowledge Files) ─── */
const AUDIO_DB="medrep_audio_db_v1", AUDIO_STORE="audios", KNOWLEDGE_STORE="knowledge_files";
function idbOpen(){return new Promise((res,rej)=>{const req=indexedDB.open(AUDIO_DB,1);req.onupgradeneeded=()=>{const db=req.result;
  if(!db.objectStoreNames.contains(AUDIO_STORE))db.createObjectStore(AUDIO_STORE);
  if(!db.objectStoreNames.contains(KNOWLEDGE_STORE))db.createObjectStore(KNOWLEDGE_STORE);
};req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);});}
async function idbPut(storeName, key, value){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).put(value, key);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}
async function idbGet(storeName, key){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readonly");const rq=tx.objectStore(storeName).get(key);rq.onsuccess=()=>res(rq.result||null);rq.onerror=()=>rej(tx.error);});}
async function idbGetAll(storeName){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readonly");const rq=tx.objectStore(storeName).getAll();rq.onsuccess=()=>res(rq.result||[]);rq.onerror=()=>rej(tx.error);});}
async function idbDel(storeName, key){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).delete(key);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}
async function idbClearAll(){const db=await idbOpen();return new Promise((res,rej)=>{const tx=db.transaction([AUDIO_STORE, KNOWLEDGE_STORE],"readwrite");tx.objectStore(AUDIO_STORE).clear();tx.objectStore(KNOWLEDGE_STORE).clear();tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}
const saveKnowledgeFile = (key, blob) => idbPut(KNOWLEDGE_STORE, key, blob);
const getKnowledgeFile = (key) => idbGet(KNOWLEDGE_STORE, key);
const getAllKnowledgeFiles = () => idbGetAll(KNOWLEDGE_STORE);
const deleteKnowledgeFile = (key) => idbDel(KNOWLEDGE_STORE, key);

/* ─── Backup ─── */
async function exportBackup({includeAudio=true}={}){
  const payload={version:1,exportedAt:new Date().toISOString(),localStorage:{},audio:includeAudio?{}:null};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k)continue;if(k.startsWith("medrep_"))payload.localStorage[k]=localStorage.getItem(k);}
  if(includeAudio){try{const db=await idbOpen();const tx=db.transaction(AUDIO_STORE,"readonly");const store=tx.objectStore(AUDIO_STORE);const keys=await new Promise(r=>{const rq=store.getAllKeys();rq.onsuccess=()=>r(rq.result||[]);rq.onerror=()=>r([]);});for(const key of keys){const blob=await new Promise(r=>{const rq=store.get(key);rq.onsuccess=()=>r(rq.result||null);rq.onerror=()=>r(null);});if(!blob)continue;const buf=await blob.arrayBuffer();payload.audio[key]={type:blob.type||"audio/webm",bytes:Array.from(new Uint8Array(buf))};}}catch(e){console.warn("Audio export skipped:",e);}}
  const blob=new Blob([JSON.stringify(payload)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="medrep_backup.json";a.click();URL.revokeObjectURL(url);
}
async function importBackup(file,{includeAudio=true}={}){
  const text=await file.text();const payload=JSON.parse(text);
  const ls=payload?.localStorage||{};for(const k of Object.keys(ls))localStorage.setItem(k,ls[k]);
  if(includeAudio&&payload?.audio){try{const db=await idbOpen();const tx=db.transaction(AUDIO_STORE,"readwrite");const store=tx.objectStore(AUDIO_STORE);for(const key of Object.keys(payload.audio)){const item=payload.audio[key];if(!item?.bytes)continue;const bytes=new Uint8Array(item.bytes);const blob=new Blob([bytes],{type:item.type||"audio/webm"});store.put(blob,key);}await new Promise(r=>{tx.oncomplete=()=>r(true);tx.onerror=()=>r(true);});}catch(e){console.warn("Audio import skipped:",e);}}
  alert("Backup importé ✅ Recharge la page pour appliquer.");
}

/* ─── Utils ─── */
const MFR=["Jan","Fév","Mars","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const DFR=["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const CLUSTER=["Rabat","Temara","Salé","Kénitra"];
function ymd(dt){const d=new Date(dt);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function monthKey(year,mi){return `${year}-${String(mi+1).padStart(2,"0")}`;}
function isWeekday(dt){const d=new Date(dt).getDay();return d>=1&&d<=5;}
function isWedThu(dt){const d=new Date(dt).getDay();return d===3||d===4;}
function listWorkdays(year,mi){const s=new Date(year,mi,1),e=new Date(year,mi+1,0),out=[];for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1))if(isWeekday(d))out.push(ymd(d));return out;}
const tNow=()=>new Date().toLocaleTimeString("fr",{hour:"2-digit",minute:"2-digit"});
const dtNowISO=()=>new Date().toISOString();
function potRank(p){return p==="A"?0:p==="B"?1:2;}
function stableSortDocs(docs){return [...docs].sort((a,b)=>(a.city||"").localeCompare(b.city||"")||(a.sector||"").localeCompare(b.sector||"")||potRank(a.potential)-potRank(b.potential)||(a.name||"").localeCompare(b.name||""));}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function normalizeText(v){return(v??"").toString().trim().replace(/\s+/g," ").replace(/['']/g,"'").normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function normalizeKey(v){return normalizeText(v).toLowerCase().replace(/[^a-z0-9]/g,"");}
const CITY_ALIASES={rabat:"Rabat",temara:"Temara",skhirattemara:"Temara",skhirat:"Temara",sale:"Salé",kenitra:"Kénitra",casablanca:"Casablanca",casa:"Casablanca",mohammedia:"Mohammedia",marrakech:"Marrakech",agadir:"Agadir",fes:"Fès",fez:"Fès",meknes:"Meknès",tanger:"Tanger",oujda:"Oujda",tetouan:"Tétouan",tetouane:"Tétouan",eljadida:"El Jadida",jadida:"El Jadida",safi:"Safi"};
function normalizeCity(v){const raw=normalizeText(v);if(!raw)return"";const key=normalizeKey(raw);return CITY_ALIASES[key]||raw.replace(/\b\w/g,m=>m.toUpperCase());}
function looksLikeCity(v){const c=normalizeCity(v);return["Rabat","Temara","Salé","Kénitra","Casablanca","Mohammedia","Marrakech","Agadir","Fès","Meknès","Tanger","Oujda","Tétouan","El Jadida","Safi"].includes(c);}
function normalizePotential(v){const s=normalizeText(v).toUpperCase();if(!s)return"B";if(s.startsWith("A"))return"A";if(s.startsWith("B"))return"B";if(s.startsWith("C"))return"C";return"B";}
const COLUMN_ALIASES={id:["id","code","n","numero","num"],name:["name","nom","medecin","médecin","docteur","doctor","nommedecin","dr"],city:["city","ville","localite","zone","region"],sector:["sector","secteur","quartier","delegation","territoire"],potential:["potential","potentiel","segment","classe","priorite"],phone:["phone","telephone","tel","gsm","mobile"],email:["email","mail","e-mail"],activite:["activite","activité","statut","type","cabinet"],specialite:["specialite","spécialité","specialty","sp"]};
function findColumnIndex(headers,aliases){const nh=headers.map(h=>normalizeKey(h));for(const a of aliases){const k=normalizeKey(a);const e=nh.findIndex(h=>h===k);if(e>=0)return e;}for(const a of aliases){const k=normalizeKey(a);const c=nh.findIndex(h=>h.includes(k)||k.includes(h));if(c>=0)return c;}return -1;}
function buildHeaderMap(headers){const m={id:findColumnIndex(headers,COLUMN_ALIASES.id),name:findColumnIndex(headers,COLUMN_ALIASES.name),city:findColumnIndex(headers,COLUMN_ALIASES.city),sector:findColumnIndex(headers,COLUMN_ALIASES.sector),potential:findColumnIndex(headers,COLUMN_ALIASES.potential),phone:findColumnIndex(headers,COLUMN_ALIASES.phone),email:findColumnIndex(headers,COLUMN_ALIASES.email),activite:findColumnIndex(headers,COLUMN_ALIASES.activite),specialite:findColumnIndex(headers,COLUMN_ALIASES.specialite)};if(m.city<0&&m.sector>=0)m.city=m.sector;return m;}
function valueAt(row,idx){if(idx<0)return"";return row[idx]??"";}
function normalizeDoctorRow(row,hm,fi){
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
function dedupeDoctors(list){const seen=new Map();for(const d of list){const key=`${normalizeKey(d.name)}__${normalizeKey(d.city)}__${normalizeKey(d.sector)}`;if(!seen.has(key))seen.set(key,d);else{const prev=seen.get(key);seen.set(key,{...prev,...d,phone:d.phone||prev.phone,email:d.email||prev.email,activite:d.activite||prev.activite,potential:d.potential||prev.potential,adoptionScore:d.adoptionScore??prev.adoptionScore??null,mainObjection:d.mainObjection||prev.mainObjection||"",nextVisitGoal:d.nextVisitGoal||prev.nextVisitGoal||"",priorityLevel:d.priorityLevel||prev.priorityLevel||""});}}return Array.from(seen.values());}
function parseCSVSmart(text){const rows=[];let row=[],cur="",inQ=false;for(let i=0;i<text.length;i++){const ch=text[i],nx=text[i+1];if(ch==='"'){if(inQ&&nx==='"'){cur+='"';i++;}else inQ=!inQ;}else if(ch===","&&!inQ){row.push(cur);cur="";}else if((ch==="\n"||ch==="\r")&&!inQ){if(ch==="\r"&&nx==="\n")i++;row.push(cur);rows.push(row);row=[];cur="";}else cur+=ch;}if(cur.length||row.length){row.push(cur);rows.push(row);}return rows.map(r=>r.map(c=>c.trim())).filter(r=>r.some(c=>normalizeText(c)));}
async function importDoctorsFromFile(file){
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
function groupWorkdaysByWeek(wds){const weeks=[];let cur=[];for(const day of wds){const d=new Date(day),wd=d.getDay();if(wd===1&&cur.length){weeks.push(cur);cur=[];}cur.push(day);if(wd===5){weeks.push(cur);cur=[];}}if(cur.length)weeks.push(cur);return weeks;}
function extractAdoptionInsights(text){const raw=text||"";const sM=raw.match(/Score\s*:\s*(\d{1,3})\s*\/\s*100/i);const pM=raw.match(/Priorité\s*:\s*(haute|moyenne|basse)/i);const oM=raw.match(/Frein principal\s*[:\-]\s*(.+)/i);const nM=raw.match(/##\s*Objectif next visit\s*([\s\S]*?)(##|$)/i);const prM=raw.match(/Probabilit[ée]\s+(?:de\s+)?(?:prescription|actuelle)\s*[:\-]\s*(faible|moyenne|élevée|\d{1,3}\s*%)/i);const score=sM?Math.max(0,Math.min(100,parseInt(sM[1],10))):null;return{adoptionScore:Number.isFinite(score)?score:null,mainObjection:oM?oM[1].trim():"",nextVisitGoal:nM?nM[1].replace(/^-+\s*/gm,"").replace(/\n+/g," ").trim():"",priorityLevel:pM?pM[1].toLowerCase():"",prescriptionProba:prM?prM[1].trim():""};}
function extractAIMemory(text,existing={}){const raw=text||"",m={...existing};const p=raw.match(/pr[eé]f[eè]re\s+(?:les?\s+)?(.{8,60}?)(?:\.|,|\n)/i);if(p)m.preference=p[1].trim();const s=raw.match(/style\s+(?:de\s+)?(?:communication|d[''']approche)\s*:\s*(.{8,80}?)(?:\.|,|\n)/i);if(s)m.style=s[1].trim();const a=raw.match(/(?:argument|levier)\s+(?:efficace|pertinent)\s*:\s*(.{8,80}?)(?:\.|,|\n)/i);if(a)m.bestArg=a[1].trim();const o=raw.match(/Frein principal\s*:\s*(.{8,120}?)(?:\.|,|\n|$)/i);if(o)m.mainObjection=o[1].trim();return m;}
function computePredictiveScore(doctor,allReports){const dr=allReports[doctor.id]||[];const pot=doctor.potential==="A"?28:doctor.potential==="B"?16:6;const vis=Math.min(dr.length*6,24);const now=Date.now();const r90=dr.filter(r=>(now-new Date(r.createdAt))/86400000<=90).length;const freq=Math.min(r90*8,24);const obj=doctor.mainObjection?.trim()?-12:0;const eng=doctor.nextVisitGoal?10:0;const raw=pot+vis+freq+obj+eng;const c=Math.max(0,Math.min(100,raw));return doctor.adoptionScore!=null?Math.round(doctor.adoptionScore*0.6+c*0.4):c;}
function detectOpportunities(doctors,reports){const opps=[],now=Date.now();doctors.forEach(d=>{const score=d.adoptionScore;if(score!=null&&score>=55&&score<76&&d.potential!=="C")opps.push({type:"hot",doctor:d,reason:`Score ${score}/100 — proche de la conversion`,ic:"🎯"});if(d.potential==="A"&&score==null)opps.push({type:"warn",doctor:d,reason:"Potentiel A non encore évalué",ic:"⭐"});const sorted=[...(reports[d.id]||[])].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));if(sorted.length>0){const days=(now-new Date(sorted[0].createdAt))/86400000;if(days>45&&score!=null&&score>=50)opps.push({type:"risk",doctor:d,reason:`Pas vu depuis ${Math.round(days)}j — risque de refroidissement`,ic:"⚠️"});}if((reports[d.id]||[]).length===0&&d.potential==="A")opps.push({type:"warn",doctor:d,reason:"Potentiel A — aucun compte-rendu",ic:"🆕"});});const seen=new Set();return opps.filter(o=>{if(seen.has(o.doctor.id))return false;seen.add(o.doctor.id);return true;}).slice(0,8);}
function buildAssistantContext(doctors,reports,planning,specialty,product){
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
---`;
}
function probaLabel(p){if(!p)return null;const t=p.toLowerCase();if(t.includes("élevée")||t.includes("elevee")||(parseInt(t)>=65))return{lbl:"Élevée",cls:"high",ic:"🟢"};if(t.includes("moyenne")||(parseInt(t)>=35))return{lbl:"Moyenne",cls:"med",ic:"🟡"};return{lbl:"Faible",cls:"low",ic:"🔴"};}
function priorityBadgeClass(level){const v=(level||"").toLowerCase();if(v==="haute")return "tA";if(v==="moyenne")return "tB";return "tC";}
function scoreColor(score){if(score==null)return"var(--t2)";if(score>=76)return"var(--teal)";if(score>=51)return"var(--blue)";if(score>=26)return"var(--amber)";return"var(--rose)";}

/* ─── Visit Frequency Logic ─── */
const FREQ_MAP = {
  "weekly": { label: "Hebdomadaire", days: 7 },
  "biweekly": { label: "Bimensuelle", days: 14 },
  "monthly": { label: "Mensuelle", days: 30 },
  "quarterly": { label: "Trimestrielle", days: 90 },
  "biannual": { label: "Semestrielle", days: 180 },
  "yearly": { label: "Annuelle", days: 365 }
};
function getDefaultFrequency(potential) {
  if (potential === "A") return "monthly";
  if (potential === "B") return "quarterly";
  return "yearly";
}
function getFrequencyDays(freqKey) {
  return FREQ_MAP[freqKey]?.days || 90;
}

/* ─── Providers ─── */
const PROVIDERS={gemini:{id:"gemini",name:"Google Gemini",icon:"✦",color:"#4285f4",models:["gemini-2.5-flash","gemini-1.5-flash"],defaultModel:"gemini-2.5-flash",detect:k=>k.startsWith("AIza")},openai:{id:"openai",name:"OpenAI",icon:"◐",color:"#10a37f",models:["gpt-4o-mini","gpt-4o","gpt-3.5-turbo"],defaultModel:"gpt-4o-mini",detect:k=>k.startsWith("sk-")&&!k.startsWith("sk-ant-")},anthropic:{id:"anthropic",name:"Anthropic",icon:"◈",color:"#d97706",models:["claude-3-5-sonnet-20241022","claude-3-haiku-20240307"],defaultModel:"claude-3-5-sonnet-20241022",detect:k=>k.startsWith("sk-ant-")},groq:{id:"groq",name:"Groq",icon:"⚡",color:"#f55036",models:["llama-3.3-70b-versatile","llama-3.1-8b-instant"],defaultModel:"llama-3.3-70b-versatile",detect:k=>k.startsWith("gsk_")},openrouter:{id:"openrouter",name:"OpenRouter",icon:"🔀",color:"#6366f1",models:["google/gemini-1.5-flash","openai/gpt-4o-mini"],defaultModel:"google/gemini-1.5-flash",detect:k=>k.startsWith("sk-or-")}};
function detectProvider(apiKey){if(!apiKey)return null;const key=apiKey.trim();for(const id of["anthropic","groq","openrouter","gemini","openai"])if(PROVIDERS[id]?.detect?.(key))return PROVIDERS[id];if(key.startsWith("sk-"))return PROVIDERS.openai;return null;}
const SYS_PROMPT = `Tu es un assistant personnel IA expert pour un Délégué Médical (Visiteur Médical). Ton rôle est polyvalent :
1. **Expertise Terrain** : Aide à la préparation de visites, l'argumentation produit, la gestion des objections et la négociation.
2. **Gestion Administrative** : Aide à la rédaction de comptes-rendus, d'emails professionnels, de rapports d'activité et au suivi des objectifs.
3. **Stratégie Commerciale** : Analyse de territoire, segmentation de clientèle, priorisation des visites.
4. **Support Scientifique** : Simplification d'études cliniques, explication de mécanismes d'action (adapté au produit du délégué).
5. **Soft Skills** : Coaching en communication, gestion du stress, confiance en soi.

Tu réponds toujours en français, de manière structurée, professionnelle et opérationnelle. Tu t'adaptes à la spécialité médicale et au produit du délégué (configurés par l'utilisateur).`;

async function callGemini(prompt, apiKey, model, sys, imageData){
  const url=`https://generativelanguage.googleapis.com/v1beta/models/${model||"gemini-2.5-flash"}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const parts = [{text: prompt}];
  if(imageData?.image){
    parts.push({ inlineData: { mimeType: imageData.image.mimeType || "image/jpeg", data: imageData.image.base64 } });
  }
  const body = {
    system_instruction:{parts:[{text:sys}]},
    contents:[{role:"user", parts}],
    generationConfig:{temperature:0.6,maxOutputTokens:2048}
  };
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok){ let msg=`Erreur Gemini ${r.status}`; try{const e=await r.json(); msg=e?.error?.message||msg; }catch{} throw new Error(msg); }
  const d=await r.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text||"Pas de réponse.";
}

async function callOpenAILike(url, prompt, apiKey, model, sys, imageData, extraHeaders={}){
  const content = [];
  content.push({ type: "text", text: prompt });
  if(imageData?.image){
    content.push({ type: "image_url", image_url: { url: `data:${imageData.image.mimeType};base64,${imageData.image.base64}` } });
  }
  const body = {
    model,
    messages:[{role:"system",content:sys},{role:"user", content}],
    temperature:0.6, max_tokens:1400
  };
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${apiKey}`,...extraHeaders},body:JSON.stringify(body)});
  if(!r.ok){ let msg=`Erreur HTTP ${r.status}`; try{const e=await r.json(); msg=e?.error?.message||msg; }catch{} throw new Error(msg); }
  const d=await r.json();
  return d?.choices?.[0]?.message?.content||"Pas de réponse.";
}

async function callAnthropic(prompt, apiKey, model, sys, imageData){
  const content = [];
  content.push({ type: "text", text: prompt });
  if(imageData?.image){
    content.push({ type: "image", source: { type: "base64", media_type: imageData.image.mimeType, data: imageData.image.base64 } });
  }
  const body = {
    model, max_tokens:1400, temperature:0.6, system:sys,
    messages:[{role:"user", content}]
  };
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},body:JSON.stringify(body)});
  if(!r.ok){ let msg=`Erreur Anthropic ${r.status}`; try{const e=await r.json(); msg=e?.error?.message||msg; }catch{} throw new Error(msg); }
  const d=await r.json();
  return d?.content?.map(x=>x?.text||"").join("\n").trim()||"Pas de réponse.";
}

async function callLLM(prompt, apiKey, provider, model, sys=SYS_PROMPT, imageData=null){
  const p=provider||detectProvider(apiKey);
  if(!p)throw new Error("Provider non reconnu.");
  const m=model||p.defaultModel;
  
  if(p.id==="gemini") return callGemini(prompt, apiKey, m, sys, imageData);
  if(p.id==="anthropic") return callAnthropic(prompt, apiKey, m, sys, imageData);
  
  const urls={openai:"https://api.openai.com/v1/chat/completions", groq:"https://api.groq.com/openai/v1/chat/completions", openrouter:"https://openrouter.ai/api/v1/chat/completions"};
  if(!urls[p.id])throw new Error(`Provider ${p.name} non supporté.`);
  const extra=p.id==="openrouter"?{"HTTP-Referer":window?.location?.origin||"","X-Title":"MedRep AI"}:{};
  return callOpenAILike(urls[p.id], prompt, apiKey, m, sys, imageData, extra);
}

/* ─── Base doctors ─── */
const DOCS_FALLBACK=[
  {id:1,name:"Dr. Lyoussi Mouna",city:"Temara",sector:"",potential:"B",phone:"",email:"",activite:"Privé",adoptionScore:42,mainObjection:"Manque de données locales",nextVisitGoal:"Partager étude",priorityLevel:"moyenne", visitFrequency:"quarterly", product:"Fumetil"},
  {id:2,name:"Dr. Moutie Wafaa",city:"Rabat",sector:"",potential:"A",phone:"",email:"",activite:"Privé",adoptionScore:78,mainObjection:"",nextVisitGoal:"Consolider",priorityLevel:"haute", visitFrequency:"monthly", product:"Fumetil"},
  {id:3,name:"Dr. El Fakir Wafaa",city:"Temara",sector:"",potential:"B",phone:"",email:"",activite:"Privé",adoptionScore:18,mainObjection:"Préfère alternative habituelle",nextVisitGoal:"Identifier patients éligibles",priorityLevel:"basse", visitFrequency:"quarterly", product:"Fumetil"},
  {id:4,name:"Dr. Jouehari Abdelhafid",city:"Rabat",sector:"",potential:"A",phone:"",email:"",activite:"Privé",adoptionScore:65,mainObjection:"Coût perçu trop élevé",nextVisitGoal:"Présenter données pharmaco-économiques",priorityLevel:"haute", visitFrequency:"monthly", product:"Fumetil"},
  {id:5,name:"Dr. Haiat Sara",city:"Temara",sector:"",potential:"A",phone:"",email:"",activite:"Privé",adoptionScore:null,mainObjection:"",nextVisitGoal:"",priorityLevel:"", visitFrequency:"monthly", product:"Fumetil"},
];

/* ─── Shared small components ─── */
function AnimBar({pct,color,height=8,delay=0}){const[w,setW]=useState(0);useEffect(()=>{const t=setTimeout(()=>setW(pct),80+delay);return()=>clearTimeout(t);},[pct,delay]);return(<div style={{background:"var(--navy4)",borderRadius:4,height,overflow:"hidden",flex:1}}><div style={{height:"100%",borderRadius:4,background:color,width:`${w}%`,transition:`width 1.1s cubic-bezier(.4,0,.2,1) ${delay}ms`,boxShadow:`0 0 8px ${color}55`}}/></div>);}
function DonutChart({data,size=120}){const r=46,cx=60,cy=60;const total=data.reduce((s,d)=>s+d.value,0);if(!total)return<div style={{width:size,height:size,borderRadius:"50%",background:"var(--navy4)"}}/>;const circ=2*Math.PI*r;let off=0;const slices=data.map(d=>{const dash=(d.value/total)*circ;const s={...d,dash,offset:off};off+=dash;return s;});return(<svg width={size} height={size} viewBox="0 0 120 120" style={{transform:"rotate(-90deg)"}}><circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--navy4)" strokeWidth="16"/>{slices.map((s,i)=><circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${s.dash} ${circ-s.dash}`} strokeDashoffset={-s.offset} style={{transition:"stroke-dasharray .8s ease"}}/>)}</svg>);}
function ScoreGauge({score,size=160}){const[anim,setAnim]=useState(0);useEffect(()=>{const t=setTimeout(()=>setAnim(score??0),100);return()=>clearTimeout(t);},[score]);const r=56,cx=80,cy=80;const circ=Math.PI*r;const dash=(anim/100)*circ;const color=scoreColor(score);return(<div style={{position:"relative",width:size,height:size/2+24}}><svg width={size} height={size} viewBox="0 0 160 160" style={{position:"absolute",top:0,left:0}}><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="var(--navy4)" strokeWidth="14" strokeLinecap="round"/><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{transition:"stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 6px ${color}66)`}}/><text x={cx} y={cy+10} textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="22" fontWeight="800" fill={color}>{score??"—"}</text><text x={cx} y={cy+26} textAnchor="middle" fontFamily="DM Sans,sans-serif" fontSize="9" fill="var(--t3)">/100</text></svg></div>);}
function Modal({title,subtitle,children,onClose,actions=[]}){
  return(
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
/* ─── AI Section Parser ─── */
function parseAISections(text){if(!text)return{};const sections={};const parts=text.split(/^##\s+/m);for(const part of parts){const nl=part.indexOf("\n");if(nl<0)continue;const title=part.slice(0,nl).trim().toLowerCase();const body=part.slice(nl+1).trim();if(title.includes("score")||title.includes("adoption"))sections.score=body;else if(title.includes("lecture")||title.includes("situation"))sections.situation=body;else if(title.includes("signal"))sections.signals=body;else if(title.includes("frein")||title.includes("objection"))sections.objections=body;else if(title.includes("levier"))sections.leviers=body;else if(title.includes("argumentaire"))sections.argumentaire=body;else if(title.includes("question"))sections.questions=body;else if(title.includes("action"))sections.actions=body;else if(title.includes("objectif"))sections.nextVisit=body;else if(title.includes("priorit"))sections.priority=body;}return sections;}
function bulletLines(text){if(!text)return[];return text.split("\n").map(l=>l.replace(/^[-*•·]\s*/,"").replace(/^\d+\.\s*/,"").trim()).filter(Boolean);}
function stageInfo(text){const t=(text||"").toLowerCase();if(t.includes("prescripteur probable")||t.includes("prescripteur"))return{label:"Prescripteur probable",color:"var(--teal)",bg:"rgba(0,212,170,.12)",border:"rgba(0,212,170,.3)",ic:"🔥"};if(t.includes("potentiel de prescription"))return{label:"Potentiel prescription",color:"var(--blue)",bg:"rgba(59,130,246,.1)",border:"rgba(59,130,246,.3)",ic:"🌡️"};if(t.includes("intérêt faible")||t.includes("faible"))return{label:"Intérêt faible",color:"var(--amber)",bg:"rgba(245,158,11,.1)",border:"rgba(245,158,11,.3)",ic:"🌡️"};if(t.includes("froid"))return{label:"Froid",color:"var(--blue)",bg:"rgba(59,130,246,.08)",border:"rgba(59,130,246,.2)",ic:"❄️"};return{label:"Non évalué",color:"var(--t2)",bg:"rgba(90,103,133,.1)",border:"var(--bdr)",ic:"📋"};}

/* ─────────────────────────────────────────────────────────────
  Fumetil Dashboard
───────────────────────────────────────────────────────────── */
function FumetilDashboard({doctors,setPage, activeProduct}){
  const evaluated=doctors.filter(d=>d.adoptionScore!=null);
  const chauds=evaluated.filter(d=>d.adoptionScore>=76);
  const tiedesArr=evaluated.filter(d=>d.adoptionScore>=26&&d.adoptionScore<76);
  const froids=evaluated.filter(d=>d.adoptionScore<26);
  const nonEvalues=doctors.filter(d=>d.adoptionScore==null);
  const total=doctors.length||1;
  const avgScore=evaluated.length?Math.round(evaluated.reduce((s,d)=>s+d.adoptionScore,0)/evaluated.length):null;
  const cityScores=useMemo(()=>{const map={};for(const d of evaluated){if(!map[d.city])map[d.city]={sum:0,count:0};map[d.city].sum+=d.adoptionScore;map[d.city].count++;}return Object.entries(map).map(([city,{sum,count}])=>({city,avg:Math.round(sum/count),count})).sort((a,b)=>b.avg-a.avg);},[evaluated]);
  const objections=useMemo(()=>{const freq={};for(const d of doctors){const obj=(d.mainObjection||"").trim();if(!obj)continue;const key=obj.toLowerCase().slice(0,80);if(!freq[key])freq[key]={text:obj,count:0};freq[key].count++;}return Object.values(freq).sort((a,b)=>b.count-a.count).slice(0,7);},[doctors]);
  const highPrio=useMemo(()=>doctors.filter(d=>d.priorityLevel==="haute").sort((a,b)=>(b.adoptionScore??-1)-(a.adoptionScore??-1)).slice(0,6),[doctors]);
  const top5=useMemo(()=>[...doctors].filter(d=>d.priorityLevel||d.adoptionScore!=null).sort((a,b)=>{const po={haute:0,moyenne:1,basse:2,"":3};const pd=(po[a.priorityLevel]??3)-(po[b.priorityLevel]??3);return pd||((b.adoptionScore??-1)-(a.adoptionScore??-1));}).slice(0,5),[doctors]);
  const insights=useMemo(()=>{const list=[];if(chauds.length>=total*0.3)list.push({type:"good",msg:`🔥 ${chauds.length} médecins chauds (${Math.round(chauds.length/total*100)}%) — pipeline solide !`});if(froids.length>=total*0.4)list.push({type:"warn",msg:`❄️ ${froids.length} médecins froids — stratégie de réchauffement requise.`});if(nonEvalues.length>0)list.push({type:"info",msg:`📋 ${nonEvalues.length} médecins sans score IA — lance l'analyse.`});if(objections.length>0)list.push({type:"warn",msg:`⚠️ Frein #1 : "${objections[0]?.text?.slice(0,55)}" (${objections[0]?.count}x).`});if(cityScores.length>0)list.push({type:"good",msg:`📍 Ville la plus avancée : ${cityScores[0].city} (score moyen ${cityScores[0].avg}/100).`});return list;},[chauds,froids,nonEvalues,objections,cityScores,total]);
  const donutData=[{label:"Chauds",value:chauds.length,color:"var(--rose)"},{label:"Tièdes",value:tiedesArr.length,color:"var(--amber)"},{label:"Froids",value:froids.length,color:"var(--blue)"},{label:"N/A",value:nonEvalues.length,color:"var(--t3)"}];
  const maxObj=objections[0]?.count||1;
  const rankClass=i=>i===0?"gold":i===1?"silver":i===2?"bronze":"";
  const initials=name=>{const p=name.replace(/^Dr\.?\s*/i,"").split(" ");return((p[0]?.[0]||"")+(p[1]?.[0]||"")).toUpperCase();};
  return(
    <div className="content">
      <div className="fum-hero">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
          <div><div className="fum-hero-title">📊 Dashboard {activeProduct || "Produit"}</div><div className="fum-hero-sub">Suivi commercial · {doctors.length} médecins · {evaluated.length} évalués IA</div></div>
          <div style={{display:"flex",gap:8}}><button className="btn btn-p" onClick={()=>setPage("reports")}>📝 Analyser</button><button className="btn btn-g" onClick={()=>setPage("doctors")}>👨‍⚕️ Médecins</button></div>
        </div>
      </div>
      <div className="temp-grid">
        {[{cls:"chaud",ic:"🔥",val:chauds.length,lbl:"Chauds",sub:"Score ≥ 76/100",pct:chauds.length/total*100},{cls:"tiede",ic:"🌡️",val:tiedesArr.length,lbl:"Tièdes",sub:"Score 26–75/100",pct:tiedesArr.length/total*100},{cls:"froid",ic:"❄️",val:froids.length,lbl:"Froids",sub:"Score < 26/100",pct:froids.length/total*100},{cls:"nevalue",ic:"📋",val:nonEvalues.length,lbl:"Non évalués",sub:"Analyse IA requise",pct:nonEvalues.length/total*100}].map(t=>(
          <div key={t.cls} className={`temp-card ${t.cls}`}><span className="temp-ic">{t.ic}</span><div className="temp-val anim-in">{t.val}</div><div className="temp-lbl">{t.lbl}</div><div className="temp-sub">{t.sub}</div><div className={`temp-bar ${t.cls}`} style={{width:`${t.pct}%`}}/></div>
        ))}
      </div>
      <div className="fum-3col">
        <div className="card">
          <div className="card-t">📍 Score moyen par ville</div>
          {cityScores.length===0?<div className="empty" style={{padding:24}}>Lance les analyses IA.</div>:cityScores.map((c,i)=>(
            <div key={c.city} className="city-row"><div className="city-dot" style={{background:scoreColor(c.avg)}}/><div className="city-name">{c.city}</div><AnimBar pct={c.avg} color={scoreColor(c.avg)} delay={i*80}/><div className="city-score-val" style={{color:scoreColor(c.avg)}}>{c.avg}</div><div style={{fontSize:10,color:"var(--t3)",minWidth:28}}>/{c.count}</div></div>
          ))}
        </div>
        <div className="card">
          <div className="card-t">🎯 Score moyen global</div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <ScoreGauge score={avgScore} size={160}/>
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <DonutChart data={donutData} size={100}/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {donutData.map(d=><div key={d.label} style={{display:"flex",alignItems:"center",gap:8,fontSize:11}}><div style={{width:10,height:10,borderRadius:3,background:d.color,flexShrink:0}}/><span style={{color:"var(--t2)"}}>{d.label}</span><span style={{marginLeft:"auto",fontFamily:"var(--fd)",fontWeight:800,color:d.color}}>{d.value}</span></div>)}
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-t">🚧 Top objections détectées</div>
          {objections.length===0?<div className="empty" style={{padding:24}}>Aucun frein enregistré.</div>:objections.map((o,i)=>(
            <div key={i} className="obj-row"><div className="obj-rank">#{i+1}</div><div className="obj-text">{o.text.length>55?o.text.slice(0,55)+"…":o.text}</div><div className="obj-bar-wrap"><div className="obj-bar-fill" style={{width:`${(o.count/maxObj)*100}%`}}/></div><div className="obj-cnt" style={{color:"var(--rose)"}}>{o.count}x</div></div>
          ))}
        </div>
      </div>
      <div className="g2" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-t">💡 Insights automatiques</div>
          {insights.length===0?<div className="empty" style={{padding:20}}>Analyse les CR pour générer des insights.</div>:insights.map((ins,i)=><div key={i} className={`fum-insight ${ins.type}`}>{ins.msg}</div>)}
          <div className="sep"/>
          <div style={{display:"flex",gap:8}}><button className="btn btn-p" onClick={()=>setPage("reports")}>⚡ Lancer analyses IA</button><button className="btn btn-g" onClick={()=>setPage("planning")}>📅 Planning</button></div>
        </div>
        <div className="card">
          <div className="card-t">🏆 Priorités hautes <span className="pill" style={{borderColor:"rgba(0,212,170,.3)",color:"var(--teal)"}}>{highPrio.length}</span></div>
          {highPrio.length===0?<div className="empty" style={{padding:20}}>Aucun médecin "haute priorité".</div>:highPrio.map(d=>(
            <div key={d.id} className="prio-row haute"><div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--teal),#00a884)",color:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{initials(d.name)}</div><div style={{flex:1,minWidth:0}}><div className="prio-name">{d.name}</div><div className="prio-city">{d.city}{d.sector?` · ${d.sector}`:""}</div></div><div style={{display:"flex",gap:6,alignItems:"center"}}><span className={`tag t${d.potential||"C"}`}>{d.potential}</span>{d.adoptionScore!=null&&<span style={{fontFamily:"var(--fd)",fontSize:12,fontWeight:800,color:scoreColor(d.adoptionScore)}}>{d.adoptionScore}</span>}</div></div>
          ))}
        </div>
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-t">🥇 Top 5 médecins à prioriser cette semaine</div>
        {top5.length===0?<div className="empty" style={{padding:24}}>Lance l'analyse IA.</div>:(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
            {top5.map((d,i)=>(
              <div key={d.id} className="top5-item"><div className={`top5-rank ${rankClass(i)}`}>#{i+1}</div><div className="top5-info"><div className="top5-name">{d.name}</div><div className="top5-meta">{d.city}{d.sector?` · ${d.sector}`:""}</div>{d.nextVisitGoal&&<div style={{fontSize:10,color:"var(--teal)",marginTop:4}}>🎯 {d.nextVisitGoal.slice(0,70)}</div>}</div>
              <svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--navy4)" strokeWidth="4"/><circle cx="22" cy="22" r="18" fill="none" stroke={scoreColor(d.adoptionScore)} strokeWidth="4" strokeDasharray={`${((d.adoptionScore??0)/100)*113} 113`} strokeDashoffset="28" strokeLinecap="round" style={{transition:"stroke-dasharray 1s ease"}}/><text x="22" y="26" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="11" fontWeight="800" fill={scoreColor(d.adoptionScore)}>{d.adoptionScore??"?"}</text></svg></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Opportunity Panel
───────────────────────────────────────────────────────────── */
function OpportunityPanel({doctors,reports,setPage}){
  const opps=useMemo(()=>detectOpportunities(doctors,reports),[doctors,reports]);
  if(!opps.length)return <div className="ok" style={{fontSize:12}}>✅ Aucune opportunité critique détectée.</div>;
  return(<div>{opps.map((o,i)=><div key={i} className={`opp-item ${o.type}`} onClick={()=>setPage("reports")}><div className="opp-ic">{o.ic}</div><div className="opp-info"><div className="opp-name">{o.doctor.name}</div><div className="opp-why">{o.doctor.city} · {o.reason}</div></div><div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:800,flexShrink:0,color:scoreColor(o.doctor.adoptionScore)}}>{o.doctor.adoptionScore??""}</div></div>)}</div>);
}

/* ─────────────────────────────────────────────────────────────
  Weekly Priority Panel
───────────────────────────────────────────────────────────── */
function WeeklyPriorityPanel({doctors,apiKey,provider,model}){
  const[result,setResult]=useState(()=>loadJSON("medrep_weekly_prio",null));
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const generate=async()=>{if(!apiKey)return;setLoading(true);setErr("");try{const top=[...doctors].sort((a,b)=>(b.adoptionScore??0)-(a.adoptionScore??0)).slice(0,10);const prompt=`Génère le plan de priorisation de visites pour cette semaine.\n\nMÉDECINS :\n${top.map(d=>`- ${d.name} (${d.city}, Pot ${d.potential}, Score ${d.adoptionScore??'N/A'}/100, Frein: ${d.mainObjection||'—'})`).join("\n")}\n\nRéponds en JSON uniquement :\n{"haute":[{"name":"...","why":"..."}],"moyenne":[{"name":"...","why":"..."}],"basse":[{"name":"...","why":"..."}]}`;const raw=await callLLM(prompt,apiKey,provider,model);const clean=raw.replace(/\`\`\`json|\`\`\`/g,"").trim();const parsed=JSON.parse(clean);const data={generatedAt:dtNowISO(),priorities:parsed};setResult(data);saveJSON("medrep_weekly_prio",data);}catch(e){setErr(e.message);}setLoading(false);};
  const renderPrios=(list,cls,ic)=>(list||[]).map((item,i)=><div key={i} className={`prio-ai-item ${cls}`}><div className="prio-ai-rank">{ic}</div><div><div className="prio-ai-n">{item.name}</div><div className="prio-ai-why">{item.why}</div></div></div>);
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8,flexWrap:"wrap"}}>{result?.generatedAt&&<span className="mini" style={{margin:0}}>Généré: {new Date(result.generatedAt).toLocaleDateString("fr-FR")}</span>}<button className="btn btn-p" style={{fontSize:11}} onClick={generate} disabled={!apiKey||loading}>{loading?<><span className="sp"/> Génération…</>:"⚡ Générer priorités semaine"}</button></div>{err&&<div className="warn" style={{marginBottom:8}}>⚠️ {err}</div>}{!apiKey&&<div className="warn" style={{fontSize:11}}>🔑 Clé API requise.</div>}{result?.priorities&&<div>{renderPrios(result.priorities.haute,"h","🔥")}{renderPrios(result.priorities.moyenne,"m","🌡️")}{renderPrios(result.priorities.basse,"l","❄️")}</div>}{!result&&!loading&&<div className="empty" style={{padding:20}}>Clique sur "Générer" pour les priorités IA.</div>}</div>);
}

/* ─────────────────────────────────────────────────────────────
  Doctor Timeline
───────────────────────────────────────────────────────────── */
function DoctorTimeline({doctorId,reports}){
  const dr=useMemo(()=>(reports[doctorId]||[]).slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),[doctorId,reports]);
  if(!dr.length)return <div className="empty" style={{padding:16}}>Aucun compte-rendu.</div>;
  return(<div className="tl-wrap">{dr.map((r,i)=><div key={r.id} className="tl-item"><div className={`tl-dot ${i>0?"old":""}`}/><div className="tl-date">{new Date(r.createdAt).toLocaleString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div><div className="tl-body">{r.text&&<div><b style={{color:"var(--t1)"}}>CR :</b> {r.text.slice(0,220)}</div>}{r.transcript&&<div style={{marginTop:3}}><b style={{color:"var(--t1)"}}>Dictée :</b> {r.transcript.slice(0,220)}</div>}{!r.text&&!r.transcript&&<i>Audio uniquement.</i>}</div></div>)}</div>);
}

/* ─────────────────────────────────────────────────────────────
  Message Suggester
───────────────────────────────────────────────────────────── */
function MessageSuggesterTab({doctor,aiAction,apiKey,provider,model}){
  const[msgType,setMsgType]=useState("sms");
  const[result,setResult]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const generate=async()=>{if(!apiKey)return;setLoading(true);setErr("");setResult("");const labels={sms:"SMS de rappel (max 160 car.)",email:"email de suivi professionnel",rappel:"message de rappel visite"};const prompt=`Rédige un ${labels[msgType]} pour Dr. ${doctor.name} (${doctor.city}) dans le cadre du suivi Fumetil.\nObjectif : ${doctor.nextVisitGoal||"—"}\nFrein : ${doctor.mainObjection||"—"}\nScore : ${doctor.adoptionScore??'N/A'}/100\nRédige uniquement le message, sans commentaire.`;try{const out=await callLLM(prompt,apiKey,provider,model);setResult(out.replace(/^(Voici|Bien sûr)[^:]*/i,"").trim());}catch(e){setErr(e.message);}setLoading(false);};
  return(<div><div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>{[["sms","💬 SMS"],["email","✉️ Email"],["rappel","🔔 Rappel"]].map(([id,lbl])=><button key={id} className={`msg-type-btn${msgType===id?" active":""}`} onClick={()=>{setMsgType(id);setResult("");}}>{lbl}</button>)}</div><button className="btn btn-p" style={{marginBottom:12,width:"100%"}} onClick={generate} disabled={!apiKey||loading}>{loading?<><span className="sp"/> Génération…</>:`⚡ Générer ${msgType}`}</button>{err&&<div className="warn" style={{marginBottom:8}}>⚠️ {err}</div>}{!apiKey&&<div className="fum-insight info">🔑 Configure une clé API.</div>}{result&&<div><div className="msg-output">{result}</div>{msgType==="sms"&&<div className="mini" style={{marginTop:6}}>{result.length} car. {result.length>160?"⚠️":"✅"}</div>}<div style={{display:"flex",gap:8,marginTop:8}}><button className="btn btn-g" onClick={()=>navigator.clipboard.writeText(result)}>📋 Copier</button><button className="btn btn-g" onClick={()=>setResult("")}>🗑️ Effacer</button></div></div>}{!result&&!loading&&<div className="empty" style={{padding:20}}>Sélectionne un type et génère.</div>}</div>);
}

/* ─────────────────────────────────────────────────────────────
  Route Optimizer
───────────────────────────────────────────────────────────── */
function RouteOptimizerPanel({doctors,planState,docById}){
  const allScheduledByCity=useMemo(()=>{const allIds=Object.values(planState?.plan||{}).flat();const unique=[...new Set(allIds)];const map={};unique.forEach(id=>{const d=docById.get(id);if(!d)return;const city=d.city||"Autre";if(!map[city])map[city]=[];map[city].push(d);});Object.keys(map).forEach(city=>{map[city].sort((a,b)=>{const pa=a.potential==="A"?0:a.potential==="B"?1:2,pb=b.potential==="A"?0:b.potential==="B"?1:2;return pa-pb||(b.adoptionScore??0)-(a.adoptionScore??0);});});return map;},[planState,docById]);
  const cities=Object.keys(allScheduledByCity).sort((a,b)=>{const co=c=>CLUSTER.includes(c)?0:1;return co(a)-co(b)||a.localeCompare(b);});
  if(!cities.length)return <div className="empty" style={{padding:20}}>Génère un planning pour voir l'optimisation de tournée.</div>;
  return(<div><div className="fum-insight info" style={{marginBottom:12,fontSize:11}}>📍 {cities.length} villes · {Object.values(allScheduledByCity).flat().length} médecins. Cluster Rabat/Salé/Temara/Kénitra → Mer/Jeu.</div>{cities.map(city=>{const docs=allScheduledByCity[city];return(<div key={city} className="route-city-card"><div className="route-city-hd"><div className="route-city-nm">{CLUSTER.includes(city)?"📍 ":"🏙️ "}{city}</div><div style={{display:"flex",gap:8,alignItems:"center"}}>{CLUSTER.includes(city)&&<span className="soft-badge ok">Cluster · Mer/Jeu</span>}<span className="pill">{docs.length}</span></div></div>{docs.map((d,i)=><div key={d.id} className="route-doc-row"><div className="route-num">#{i+1}</div><div className="route-info"><div className="route-name">{d.name}</div><div className="route-meta">{d.sector||d.activite||"—"} · Pot. {d.potential}</div></div><div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>{d.adoptionScore!=null&&<span style={{fontFamily:"var(--fd)",fontSize:11,fontWeight:800,color:scoreColor(d.adoptionScore)}}>{d.adoptionScore}</span>}<span className={`tag t${d.potential}`}>{d.potential}</span></div></div>)}</div>);})}</div>);
}

/* ─────────────────────────────────────────────────────────────
  Commercial Dashboard
───────────────────────────────────────────────────────────── */
function CommercialDashboard({doctors,setPage,apiKey,provider,model, activeProduct}){
  const reports=useMemo(()=>loadJSON("medrep_reports_v1",{}),[]);
  const totalReports=useMemo(()=>Object.values(reports).reduce((s,arr)=>s+(arr?.length||0),0),[reports]);
  const totalWithReports=useMemo(()=>Object.keys(reports).filter(id=>reports[id]?.length>0).length,[reports]);
  const evaluated=doctors.filter(d=>d.adoptionScore!=null);
  const chauds=evaluated.filter(d=>d.adoptionScore>=76);
  const aConvertir=evaluated.filter(d=>d.adoptionScore>=40&&d.adoptionScore<76);
  const convRate=doctors.length?Math.round((chauds.length/doctors.length)*100):0;
  const monthlyData=useMemo(()=>{const now=new Date();return Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);const key=monthKey(d.getFullYear(),d.getMonth());const cnt=Object.values(reports).reduce((s,arr)=>s+(arr||[]).filter(r=>r.createdAt?.startsWith(key)).length,0);return{label:MFR[d.getMonth()],value:cnt};});},[reports]);
  const maxM=Math.max(...monthlyData.map(m=>m.value),1);
  const cityScores=useMemo(()=>{const map={};doctors.forEach(d=>{if(!map[d.city])map[d.city]={total:0,count:0};if(d.adoptionScore!=null){map[d.city].total+=d.adoptionScore;map[d.city].count++;}});return Object.entries(map).filter(([,v])=>v.count>0).map(([city,v])=>({city,avg:Math.round(v.total/v.count)})).sort((a,b)=>b.avg-a.avg);},[doctors]);
  const objections=useMemo(()=>{const map={};doctors.forEach(d=>{if(d.mainObjection){const k=d.mainObjection.slice(0,50);map[k]=(map[k]||0)+1;}});return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);},[doctors]);
  const predictiveScores=useMemo(()=>doctors.map(d=>computePredictiveScore(d,reports)),[doctors,reports]);
  const avgPred=predictiveScores.length?Math.round(predictiveScores.reduce((s,v)=>s+v,0)/predictiveScores.length):0;

  // NOUVEAU : Objectif Mensuel
  const target = parseInt(localStorage.getItem("medrep_monthly_target") || "60");
  const progressPct = Math.min(100, Math.round((totalReports / target) * 100));
  
  // NOUVEAU : Export PDF
  const handleExportPDF = () => window.print();

  return(
    <div className="content">
      {/* Bouton Export PDF */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-g" onClick={handleExportPDF}>📄 Exporter en PDF</button>
      </div>

      {/* NOUVEAU : Barre de Progression Objectif */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>🎯 Objectif Mensuel</span>
          <span style={{ fontFamily: "var(--fd)" }}>{totalReports} / {target} visites</span>
        </div>
        <div style={{ background: "var(--navy4)", borderRadius: 10, height: 12, overflow: 'hidden' }}>
          <div style={{ 
            width: `${progressPct}%`, 
            height: '100%', 
            background: progressPct >= 100 ? "var(--teal)" : progressPct > 50 ? "var(--amber)" : "var(--rose)", 
            transition: "width 0.5s ease",
            boxShadow: progressPct >= 100 ? "0 0 10px var(--teal)" : "none"
          }} />
        </div>
        {progressPct >= 100 && <div style={{ textAlign: 'right', color: "var(--teal)", fontSize: 11, marginTop: 4 }}>🏆 Objectif atteint !</div>}
      </div>

      <div className="cd-kpi-grid">
        <div className="kpi" style={{"--ac":"var(--teal)"}}><div className="kpi-lbl">Visites totales</div><div className="kpi-val">{totalReports}</div><div className="kpi-d" style={{color:"var(--teal)"}}>comptes-rendus</div><div className="kpi-ic">📋</div></div>
        <div className="kpi" style={{"--ac":"var(--rose)"}}><div className="kpi-lbl">Prescripteurs</div><div className="kpi-val">{chauds.length}</div><div className="kpi-d" style={{color:"var(--rose)"}}>score ≥ 76</div><div className="kpi-ic">🔥</div></div>
        <div className="kpi" style={{"--ac":"var(--amber)"}}><div className="kpi-lbl">À convertir</div><div className="kpi-val">{aConvertir.length}</div><div className="kpi-d" style={{color:"var(--amber)"}}>score 40-75</div><div className="kpi-ic">🌡️</div></div>
        <div className="kpi" style={{"--ac":"var(--violet)"}}><div className="kpi-lbl">Taux conversion</div><div className="kpi-val">{convRate}%</div><div className="kpi-d" style={{color:"var(--violet)"}}>médecins actifs</div><div className="kpi-ic">📈</div></div>
      </div>
      <div className="cd-section">
        <div className="card"><div className="card-t">📅 Activité mensuelle</div>{monthlyData.map((m,i)=><div key={i} className="perf-bar-row"><div className="perf-lbl">{m.label}</div><div style={{flex:1,background:"var(--navy4)",borderRadius:4,height:8,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:"var(--teal)",width:`${(m.value/maxM)*100}%`,transition:"width 1s ease"}}/></div><div className="perf-val" style={{color:"var(--teal)"}}>{m.value}</div></div>)}<div className="sep"/><div style={{display:"flex",gap:12}}><div style={{flex:1}}><div className="kpi-lbl">Total CR</div><div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:800,color:"var(--teal)"}}>{totalReports}</div></div><div style={{flex:1}}><div className="kpi-lbl">Médecins actifs</div><div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:800}}>{totalWithReports}</div></div></div></div>
        <div className="card"><div className="card-t">🗺️ Score moyen par ville</div>{cityScores.length===0?<div className="empty" style={{padding:20}}>Lance les analyses IA.</div>:cityScores.map((c,i)=><div key={i} className="perf-bar-row"><div className="perf-lbl" style={{fontWeight:600}}>{c.city}</div><div style={{flex:1,background:"var(--navy4)",borderRadius:4,height:8,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:scoreColor(c.avg),width:`${c.avg}%`,transition:"width 1.2s ease"}}/></div><div className="perf-val" style={{color:scoreColor(c.avg)}}>{c.avg}</div></div>)}</div>
        <div className="card"><div className="card-t">🚧 Freins {activeProduct || "Produit"}</div>{objections.length===0?<div className="empty" style={{padding:16}}>Aucun frein extrait.</div>:objections.map(([obj,cnt],i)=><div key={i} className="perf-bar-row"><div style={{flex:1,fontSize:11}}>{obj.length>45?obj.slice(0,45)+"…":obj}</div><span style={{fontFamily:"var(--fd)",fontSize:11,fontWeight:800,color:"var(--rose)"}}>{cnt}x</span></div>)}<div className="sep"/><div className="card-t" style={{marginBottom:8}}>📊 Score prédictif moyen</div><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{fontFamily:"var(--fd)",fontSize:32,fontWeight:800,color:scoreColor(avgPred)}}>{avgPred}</div><div><div style={{fontSize:11,color:"var(--t2)"}}>Score moyen calculé</div><div style={{fontSize:10,color:"var(--t3)"}}>{doctors.length} médecins</div></div></div></div>
      </div>
      <div className="cd-section-2">
        <div className="card"><div className="card-t">🎯 Opportunités détectées</div><OpportunityPanel doctors={doctors} reports={reports} setPage={setPage}/><div className="sep"/><button className="btn btn-p" style={{fontSize:11}} onClick={()=>setPage("fumetil")}>📊 Dashboard {activeProduct || "Produit"} →</button></div>
        <div className="card"><div className="card-t">🏆 Priorisation IA · Semaine</div><WeeklyPriorityPanel doctors={doctors} apiKey={apiKey} provider={provider} model={model}/></div>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────
  Field Alerts Panel
───────────────────────────────────────────────────────────── */
function FieldAlertsPanel({doctors, reports, setPage}){
  const alerts = useMemo(() => {
    const now = Date.now();
    const list = [];
    
    doctors.forEach(d => {
      const docReports = reports[d.id] || [];
      let lastVisitDate = 0;
      
      if(docReports.length > 0) {
        const sorted = [...docReports].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        lastVisitDate = new Date(sorted[0].createdAt).getTime();
      }

      const freqDays = getFrequencyDays(d.visitFrequency);
      const daysSinceLastVisit = lastVisitDate ? Math.floor((now - lastVisitDate) / 86400000) : 999; 
      
      if(daysSinceLastVisit >= freqDays) {
        const daysOverdue = daysSinceLastVisit - freqDays;
        list.push({
          doctor: d,
          daysSinceLastVisit,
          freqDays,
          daysOverdue,
          lastVisitDate,
          urgency: daysOverdue < 0 ? 0 : (d.potential === 'A' ? 3 : d.potential === 'B' ? 2 : 1)
        });
      }
    });

    return list.sort((a,b) => {
      if(b.urgency !== a.urgency) return b.urgency - a.urgency;
      return b.daysOverdue - a.daysOverdue;
    }).slice(0, 6);

  }, [doctors, reports]);

  if(alerts.length === 0) return <div className="ok">✅ Aucune visite en retard. Excellent suivi !</div>;

  const formatLast = (days) => {
    if(days >= 999) return "Jamais visité";
    if(days === 0) return "Aujourd'hui";
    return `Il y a ${days}j`;
  };

  return (
    <div>
      {alerts.map((a, i) => (
        <div key={i} className="opp-item risk" onClick={() => setPage("reports")} style={{cursor:"pointer"}}>
          <div className="opp-ic" style={{fontSize:22}}>{a.doctor.potential === 'A' ? '🔥' : '⚠️'}</div>
          <div className="opp-info">
            <div className="opp-name">{a.doctor.name}</div>
            <div className="opp-why">
              <b>{a.doctor.city}</b> · Dernière visite: {formatLast(a.daysSinceLastVisit)}<br/>
              <span style={{color:"var(--rose)"}}>Objectif dépassé de {a.daysOverdue} jours (Freq: {FREQ_MAP[a.doctor.visitFrequency]?.label})</span>
            </div>
          </div>
          <span className={`tag t${a.doctor.potential}`}>{a.doctor.potential}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Dashboard (home)
───────────────────────────────────────────────────────────── */
function Dashboard({doctors,setPage,hasApi,provider, activeProduct}){
  const reports=useMemo(()=>loadJSON("medrep_reports_v1",{}),[]);
  const cntA=doctors.filter(d=>d.potential==="A").length;
  const evaluated=doctors.filter(d=>d.adoptionScore!=null);
  const chauds=evaluated.filter(d=>d.adoptionScore>=76).length;
  const aConvertir=evaluated.filter(d=>d.adoptionScore>=40&&d.adoptionScore<76).length;
  const totalReports=useMemo(()=>Object.values(reports).reduce((s,arr)=>s+(arr?.length||0),0),[reports]);
  const apiKey=hasApi?loadJSON("medrep_apiKey",""):"";
  
  return(
    <div className="content">
      <div className="kpi-grid">
        <div className="kpi" style={{"--ac":"var(--teal)"}}><div className="kpi-lbl">Médecins</div><div className="kpi-val">{doctors.length}</div><div className="kpi-d" style={{color:"var(--teal)"}}>base terrain</div><div className="kpi-ic">🧠</div></div>
        <div className="kpi" style={{"--ac":"var(--violet)"}}><div className="kpi-lbl">Potentiel A</div><div className="kpi-val">{cntA}</div><div className="kpi-d" style={{color:"var(--teal)"}}>{doctors.length?Math.round((cntA/doctors.length)*100):0}%</div><div className="kpi-ic">⭐</div></div>
        <div className="kpi" style={{"--ac":"var(--rose)"}}><div className="kpi-lbl">Prescripteurs 🔥</div><div className="kpi-val">{chauds}</div><div className="kpi-d" style={{color:"var(--rose)"}}>Score ≥ 76</div><div className="kpi-ic">🔥</div></div>
        <div className="kpi" style={{"--ac":"var(--amber)"}}><div className="kpi-lbl">À convertir 🟡</div><div className="kpi-val">{aConvertir.length}</div><div className="kpi-d" style={{color:"var(--amber)"}}>Score 40–75</div><div className="kpi-ic">🎯</div></div>
      </div>
      
      {/* ALERES TERRAIN */}
      <div className="card" style={{marginBottom:14, borderLeft:"4px solid var(--rose)"}}>
        <div className="card-t">
          🚨 Alertes Terrain
          <span className="pill" style={{borderColor:"rgba(244,63,94,.35)",color:"var(--rose)",marginLeft:8}}>Priorité</span>
        </div>
        <FieldAlertsPanel doctors={doctors} reports={reports} setPage={setPage}/>
      </div>

      <div className="g2" style={{marginBottom:14}}>
        <div className="card"><div className="card-t">Accès rapide</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="btn btn-p" onClick={()=>setPage("commercial")}>📈 Commercial</button><button className="btn btn-p" onClick={()=>setPage("fumetil")}>📊 {activeProduct || "CRM"}</button><button className="btn btn-g" onClick={()=>setPage("planning")}>📅 Planning</button><button className="btn btn-blue" onClick={()=>setPage("reports")}>📝 Comptes-rendus</button></div><div className="mini" style={{marginTop:12}}>{totalReports} CR enregistrés · Tout sauvegardé automatiquement.</div></div>
        <div className="card"><div className="card-t">Assistant IA {hasApi?<span className="pill" style={{borderColor:(provider?.color||"var(--teal)")+"55"}}><span style={{color:provider?.color}}>{provider?.icon}</span> {provider?.name}</span>:<span className="pill" style={{borderColor:"rgba(244,63,94,.35)",color:"var(--rose)"}}>OFF</span>}</div>{hasApi?<div className="ok">✅ IA active.</div>:<div className="warn">⚠️ Configure une clé API.</div>}<div style={{marginTop:12,display:"flex",gap:8}}><button className="btn btn-g" onClick={()=>setPage("settings")}>⚙️ Paramètres</button><button className="btn btn-blue" onClick={()=>setPage("assistant")}>✦ Assistant terrain</button></div></div>
      </div>
      <div className="g2">
        <div className="card"><div className="card-t">🎯 Opportunités détectées</div><OpportunityPanel doctors={doctors} reports={reports} setPage={setPage}/></div>
        <div className="card"><div className="card-t">🏆 Priorisation IA · Semaine</div><WeeklyPriorityPanel doctors={doctors} apiKey={apiKey} provider={provider} model={null}/></div>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────
  Settings
───────────────────────────────────────────────────────────── */
function SettingsPage({apiKey,setApiKey,model,setModel,provider,setProvider, products, addProduct, deleteProduct, activeProduct, setActiveProduct}){
  const[draft,setDraft]=useState(apiKey||"");
  const[testing,setTesting]=useState(false);
  const[testResult,setTestResult]=useState(null);
  const[manualProvider,setManualProvider]=useState(null);
  
  // Infos utilisateur
  const[userSpecialty,setUserSpecialty]=useState(()=>localStorage.getItem("medrep_user_specialty")||"");
  const[userProduct,setUserProduct]=useState(()=>localStorage.getItem("medrep_user_product")||"");
  
  // NOUVEAU : Objectif Mensuel
  const[monthlyTarget, setMonthlyTarget]=useState(()=>localStorage.getItem("medrep_monthly_target")||"60");

  const activeProvider=manualProvider||detectProvider(draft);
  const testKey=async()=>{const key=draft.trim();if(!key)return;setTesting(true);setTestResult(null);try{const p=activeProvider||detectProvider(key);if(!p)throw new Error("Provider non reconnu.");const m=model||p.defaultModel;await callLLM("Réponds uniquement par: OK",key,p,m,"Tu réponds seulement OK.");setTestResult({ok:true,msg:`✓ Connexion ${p.name} réussie`});setApiKey(key);setProvider(p);setModel(p.defaultModel);}catch(e){setTestResult({ok:false,msg:`✗ ${e.message}`});}setTesting(false);};
  const save=()=>{const key=draft.trim();const p=activeProvider||detectProvider(key);setApiKey(key);if(p){setProvider(p);setModel(p.defaultModel);}setTestResult({ok:true,msg:"✓ Sauvegardé."});};

  const saveProfile=()=>{
    localStorage.setItem("medrep_user_specialty", userSpecialty);
    localStorage.setItem("medrep_user_product", userProduct);
    localStorage.setItem("medrep_monthly_target", monthlyTarget); // Sauvegarde objectif
    setTestResult({ok:true,msg:"✓ Profil et objectifs mis à jour."});
  };

  const[includeAudio,setIncludeAudio]=useState(true);
  
  return(
    <div className="content" style={{maxWidth:900}}>
      
      {/* Section Profil Utilisateur */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card-t">👤 Mon Profil Délégué</div>
        <div className="mini" style={{marginBottom:10}}>Ces informations aident l'IA à personnaliser ses réponses.</div>
        <div className="grid2">
          <div className="fg">
            <label className="fl">Spécialité Médicale</label>
            <input className="fi" placeholder="Ex: Cardiologie, Neurologie..." value={userSpecialty} onChange={e=>setUserSpecialty(e.target.value)}/>
          </div>
          <div className="fg">
            <label className="fl">Produit Principal</label>
            <input className="fi" placeholder="Ex: Fumetil..." value={userProduct} onChange={e=>setUserProduct(e.target.value)}/>
          </div>
          {/* NOUVEAU : Champ Objectif */}
          <div className="fg" style={{maxWidth: 150}}>
            <label className="fl">Objectif visites / mois</label>
            <input className="fi" type="number" min="1" value={monthlyTarget} onChange={e=>setMonthlyTarget(e.target.value)}/>
          </div>
        </div>
        <div style={{marginTop:10}}><button className="btn btn-p" onClick={saveProfile}>💾 Sauvegarder le profil</button></div>
      </div>

      <div className="card" style={{marginBottom:14}}>
        <div className="card-t">🔑 Clé API</div>
        <div className="mini" style={{marginBottom:10}}>Colle ta clé (Gemini → AIza…). Stockée localement.</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input className="fi" type="password" placeholder="AIzaSy… / sk-…" value={draft} onChange={e=>{setDraft(e.target.value);setManualProvider(null);setTestResult(null);}} style={{flex:1,fontFamily:"monospace"}}/>
          <button className="btn btn-blue" onClick={testKey} disabled={testing||!draft.trim()}>{testing?<><span className="sp" style={{borderTopColor:"var(--blue)"}}/> Test…</>:"Tester"}</button>
          <button className="btn btn-p" onClick={save} disabled={!draft.trim()}>Sauvegarder</button>
        </div>
        {testResult&&<div style={{marginTop:10,padding:"9px 14px",borderRadius:10,fontSize:12,background:testResult.ok?"rgba(0,212,170,.1)":"rgba(244,63,94,.1)",color:testResult.ok?"var(--teal)":"var(--rose)",border:`1px solid ${testResult.ok?"rgba(0,212,170,.2)":"rgba(244,63,94,.2)"}`}}>{testResult.msg}</div>}
      </div>
      
      {activeProvider&&<div className="card" style={{marginBottom:14}}><div className="card-t" style={{color:activeProvider.color}}>{activeProvider.icon} Modèle ({activeProvider.name})</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{activeProvider.models.map(m=><button key={m} className={`btn ${model===m?"btn-p":"btn-g"}`} style={model===m?{background:activeProvider.color}:{}} onClick={()=>setModel(m)}>{m}</button>)}</div></div>}
      
      <div className="card"><div className="card-t">💾 Backup</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}><label className="pill" style={{cursor:"pointer"}}><input type="checkbox" checked={includeAudio} onChange={e=>setIncludeAudio(e.target.checked)} style={{accentColor:"#00d4aa"}}/> Inclure audio</label><button className="btn btn-p" onClick={()=>exportBackup({includeAudio})}>⬇️ Exporter</button><label className="btn btn-blue" style={{cursor:"pointer"}}>⬆️ Importer<input type="file" accept="application/json" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)importBackup(f,{includeAudio});e.target.value="";}} /></label><button className="btn btn-rose" onClick={async()=>{if(!confirm("Reset ?"))return;const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith("medrep_"))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));try{await idbClearAll();}catch{}alert("Réinitialisé. Recharge la page.");}}>🧨 Reset</button></div><div className="warn" style={{marginTop:12}}>⚠️ Tes données restent dans le navigateur. Utilise le Backup pour migrer.</div></div>

      {/* GESTION DES PRODUITS */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card-t">💊 Gestion des Produits</div>
        <div className="mini" style={{marginBottom:10}}>Créez ou supprimez des espaces de travail pour chaque produit médical.</div>
        
        <div style={{marginBottom:12}}>
           {products.map(p => (
             <div key={p} className="prio-row" style={{marginBottom:4, borderColor: activeProduct === p ? "var(--teal)" : "var(--bdr)"}}>
                <span style={{fontWeight: activeProduct === p ? 700 : 400, color: activeProduct === p ? "var(--teal)" : "var(--t1)"}}>{p}</span>
                {products.length > 1 && 
                  <button className="btn btn-rose" style={{padding:"2px 8px", fontSize:10, marginLeft:"auto"}} onClick={() => deleteProduct(p)}>🗑️</button>
                }
             </div>
           ))}
        </div>

        <div style={{display:"flex", gap:8}}>
          <input className="fi" placeholder="Nouveau produit..." id="newProdInput" />
          <button className="btn btn-p" onClick={() => {
            const inp = document.getElementById("newProdInput");
            if(inp && inp.value) {
               addProduct(inp.value);
               inp.value = "";
            }
          }}>➕ Ajouter</button>
        </div>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────
  Doctors Page (Version Finale avec Jour Préféré)
───────────────────────────────────────────────────────────── */
function DoctorsPage({ doctors, setDoctors, activeProduct, products }){
  const[q,setQ]=useState("");
  const[editing,setEditing]=useState(null);
  const[showNew,setShowNew]=useState(false);
  const[importing,setImporting]=useState(false);
  
  const filtered=useMemo(()=>{
    const s=q.trim().toLowerCase();
    if(!s)return doctors;
    return doctors.filter(d=>
      (d.name||"").toLowerCase().includes(s)||
      (d.city||"").toLowerCase().includes(s)||
      (d.potential||"").toLowerCase().includes(s)||
      (d.mainObjection||"").toLowerCase().includes(s)
    );
  },[doctors,q]);
  
  const nextId=useMemo(()=>doctors.reduce((m,d)=>Math.max(m,d.id||0),0)+1,[doctors]);
  
  const upsert=doc=>{
    setDoctors(prev=>{
      const nd={
        ...doc,
        adoptionScore:doc?.adoptionScore??null,
        mainObjection:doc?.mainObjection??"",
        nextVisitGoal:doc?.nextVisitGoal??"",
        priorityLevel:doc?.priorityLevel??"",
        visitFrequency:doc?.visitFrequency||"quarterly",
        product: doc.product || activeProduct,
        preferredDay: doc?.preferredDay ?? null // Prise en compte du jour préféré
      };
      const exists=prev.some(x=>x.id===nd.id);
      return stableSortDocs(exists?prev.map(x=>x.id===nd.id?nd:x):[...prev,nd]);
    });
  };
  
  const remove=id=>{
    if(!confirm("Supprimer ?"))return;
    setDoctors(prev=>prev.filter(x=>x.id!==id));
  };
  
  const exportJSON=()=>{
    const blob=new Blob([JSON.stringify({doctors},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="medrep_doctors.json";a.click();
    URL.revokeObjectURL(url);
  };
  
  const exportCSV=()=>{
    const header=["id","name","city","sector","potential","phone","email","activite","adoptionScore","mainObjection","nextVisitGoal","priorityLevel","visitFrequency","product","preferredDay"];
    const lines=[header.join(",")];
    for(const d of doctors){
      const row=header.map(k=>`"${(d[k]??"").toString().replaceAll('"','""')}"`);
      lines.push(row.join(","));
    }
    const blob=new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="medrep_doctors.csv";a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport=async file=>{
    if(!file)return;
    setImporting(true);
    try{
      const list=await importDoctorsFromFile(file);
      if(!list.length){alert("Aucun médecin valide.");return;}
      const updatedList = list.map(d => ({...d, product: activeProduct}));
      setDoctors(prev => stableSortDocs([...prev, ...updatedList]));
      alert(`Import OK ✅ (${list.length} médecins importés dans "${activeProduct}")`);
    }catch(e){alert(`Erreur import ❌\n${e.message}`);}
    finally{setImporting(false);}
  };
  
  const allReports=useMemo(()=>loadJSON("medrep_reports_v1",{}),[]);

  // Helper jour préféré
  const dayLabels = {1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven"};

  return(
    <div className="content">
      <div className="card" style={{marginBottom:12}}>
        <div className="card-t">👨‍⚕️ Médecins <span className="pill">{doctors.length}</span> <span className="pill" style={{borderColor:"rgba(139,92,246,.3)",color:"var(--violet)"}}>{activeProduct}</span></div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <input className="fi" placeholder="Recherche…" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1,minWidth:280}}/>
          <button className="btn btn-p" onClick={()=>{setShowNew(true);setEditing({id:nextId,name:"",city:"",sector:"",potential:"B",phone:"",email:"",activite:"Privé",adoptionScore:null,mainObjection:"",nextVisitGoal:"",priorityLevel:"",visitFrequency:"quarterly", product: activeProduct, preferredDay: null});}}>➕ Ajouter</button>
        </div>
        <div className="sep"/>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-g" onClick={exportJSON}>⬇️ JSON</button>
          <button className="btn btn-g" onClick={exportCSV}>⬇️ CSV</button>
          <label className="btn btn-blue" style={{cursor:"pointer"}}>
            {importing?"Import…":"⬆️ Import"}
            <input type="file" accept=".xlsx,.xls,.csv,.json" style={{display:"none"}} onChange={async e=>{const f=e.target.files?.[0];if(f)await handleImport(f);e.target.value="";}} />
          </label>
          <button className="btn btn-rose" onClick={()=>{if(!confirm("Reset total ?"))return;setDoctors(DOCS_FALLBACK);}}>🧹 Reset</button>
        </div>
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Ville / Secteur</th>
                <th style={{textAlign:'center'}}>Pot.</th>
                <th style={{textAlign:'center'}}>Score</th>
                <th style={{textAlign:'center'}}>Jour Préféré</th> {/* Nouvelle colonne */}
                <th>Frein</th>
                <th style={{textAlign:'center'}}>Prio</th>
                <th style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8}><div className="empty">Aucun médecin pour le produit "{activeProduct}".</div></td></tr>
              )}
              {filtered.map(d => {
                const pred = computePredictiveScore(d, allReports);
                return (
                  <tr key={d.id}>
                    <td style={{fontWeight:700}}>{d.name}</td>
                    <td>{d.city} {d.sector ? <span className="mini" style={{opacity:0.7}}>· {d.sector}</span> : ""}</td>
                    <td style={{textAlign:'center'}}><span className={`tag t${d.potential||"C"}`}>{d.potential||"C"}</span></td>
                    <td style={{textAlign:'center', fontWeight:700, color:scoreColor(d.adoptionScore)}}>
                      {d.adoptionScore==null?"—":`${d.adoptionScore}`}
                    </td>
                    {/* Affichage Jour Préféré */}
                    <td style={{textAlign:'center'}}>
                      {d.preferredDay ? <span className="soft-badge ok">{dayLabels[d.preferredDay]}</span> : <span className="mini">—</span>}
                    </td>
                    <td style={{maxWidth:140, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={d.mainObjection}>{d.mainObjection||"—"}</td>
                    <td style={{textAlign:'center'}}><span className={`tag ${priorityBadgeClass(d.priorityLevel)}`}>{d.priorityLevel||"—"}</span></td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn btn-g" style={{padding:"4px 8px"}} onClick={()=>{setShowNew(false);setEditing({...d});}}>✏️</button>
                      <button className="btn btn-rose" style={{padding:"4px 8px", marginLeft:4}} onClick={()=>remove(d.id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing&&(
        <Modal title={showNew?"Ajouter un médecin":"Éditer médecin"} subtitle="Configurez les détails et le jour de visite préféré" onClose={()=>setEditing(null)}
          actions={[
            {label:"Annuler",kind:"g",onClick:()=>setEditing(null)},
            {label:"Enregistrer",kind:"p",onClick:()=>{
              if(!editing.name?.trim())return alert("Nom requis.");
              if(!editing.city?.trim())return alert("Ville requise.");
              const p=(editing.potential||"B").toString().toUpperCase().slice(0,1);
              upsert({
                ...editing,
                city:normalizeCity(editing.city),
                potential:["A","B","C"].includes(p)?p:"B",
                adoptionScore:editing.adoptionScore==null?null:Math.max(0,Math.min(100,Number(editing.adoptionScore))),
                mainObjection:normalizeText(editing.mainObjection),
                nextVisitGoal:normalizeText(editing.nextVisitGoal),
                priorityLevel:(editing.priorityLevel||"").toLowerCase(),
                preferredDay: editing.preferredDay ? parseInt(editing.preferredDay) : null
              });
              setEditing(null);
            }}
          ]}>
          <div className="grid2">
            <div className="fg"><label className="fl">Spécialité</label><input className="fi" placeholder="Cardiologie..." value={editing.specialite || ""} onChange={e=>setEditing(p => ({...p, specialite: e.target.value}))}/></div>
            <div className="fg"><label className="fl">Nom</label><input className="fi" value={editing.name} onChange={e=>setEditing(p=>({...p,name:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Ville</label><input className="fi" value={editing.city} onChange={e=>setEditing(p=>({...p,city:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Secteur / Clinique</label><input className="fi" placeholder="Ex: Clinique Marjane" value={editing.sector || ""} onChange={e=>setEditing(p=>({...p,sector:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Potentiel</label><select className="fs" value={editing.potential||"B"} onChange={e=>setEditing(p=>({...p,potential:e.target.value}))}><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
            
            {/* NOUVEAU : Sélecteur Jour Préféré */}
            <div className="fg">
              <label className="fl">Jour de visite préféré</label>
              <select className="fs" value={editing.preferredDay || ""} onChange={e=>setEditing(p=>({...p, preferredDay: e.target.value ? parseInt(e.target.value) : null}))}>
                <option value="">Aucune préférence</option>
                <option value="1">Lundi</option>
                <option value="2">Mardi</option>
                <option value="3">Mercredi</option>
                <option value="4">Jeudi</option>
                <option value="5">Vendredi</option>
              </select>
              <div className="mini" style={{marginTop:2}}>L'algo priorisera ce jour.</div>
            </div>

            <div className="fg"><label className="fl">Produit</label>
              <select className="fs" value={editing.product || activeProduct} onChange={e=>setEditing(p=>({...p,product:e.target.value}))}>
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            <div className="fg"><label className="fl">Score (0-100)</label><input className="fi" type="number" min={0} max={100} value={editing.adoptionScore??""} onChange={e=>setEditing(p=>({...p,adoptionScore:e.target.value===""?null:Math.max(0,Math.min(100,parseInt(e.target.value,10)||0))}))}/></div>
            <div className="fg" style={{gridColumn:"1 / -1"}}><label className="fl">Frein principal</label><textarea className="fta" value={editing.mainObjection||""} onChange={e=>setEditing(p=>({...p,mainObjection:e.target.value}))}/></div>
            <div className="fg" style={{gridColumn:"1 / -1"}}><label className="fl">Objectif next visit</label><textarea className="fta" value={editing.nextVisitGoal||""} onChange={e=>setEditing(p=>({...p,nextVisitGoal:e.target.value}))}/></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
/* ─── Visit Prep Modal (Version Visuelle Enrichie) ─── */
function VisitPrepModal({ doctor, reports, aiAction, apiKey, provider, model, onClose, onAnalyze, analyzing, aiErr, setDoctors }) {
  const [tab, setTab] = useState("brief");
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(doctor.nextVisitGoal || "");
  
  const doctorReports = (reports[doctor.id] || []).slice(0, 5);
  const aiText = aiAction?.text || "";
  const sections = useMemo(() => parseAISections(aiText), [aiText]);
  const hasAI = !!aiText;
  const predictiveScore = useMemo(() => computePredictiveScore(doctor, reports), [doctor, reports]);

  // --- Helpers Visuels ---
  
  // 1. Stade d'adoption (Texte -> Objet visuel)
  const stage = useMemo(() => {
    const s = (sections.score || "").toLowerCase();
    if (s.includes("prescripteur") || s.includes("adopté")) return { lbl: "Prescripteur", ic: "🔥", color: "var(--rose)", bg: "rgba(244,63,94,.1)", desc: "Fidèle et actif" };
    if (s.includes("potentiel") || s.includes("tiède")) return { lbl: "Potentiel", ic: "🌡️", color: "var(--amber)", bg: "rgba(245,158,11,.1)", desc: "En progression" };
    if (s.includes("froid") || s.includes("réfractaire")) return { lbl: "Froid", ic: "❄️", color: "var(--blue)", bg: "rgba(59,130,246,.1)", desc: "Peu intéressé" };
    if (s.includes("découverte")) return { lbl: "Découverte", ic: "🆕", color: "var(--teal)", bg: "rgba(0,212,170,.1)", desc: "Premiers contacts" };
    return { lbl: "Non évalué", ic: "📋", color: "var(--t3)", bg: "var(--navy4)", desc: "Lance l'analyse" };
  }, [sections]);

  // 2. Probabilité de Prescription (Jauge)
  const proba = useMemo(() => {
    const val = aiAction?.prescriptionProba || sections.score || "";
    const s = val.toLowerCase();
    if (s.includes("élevée") || parseInt(s) >= 65) return { pct: 85, lbl: "Élevée", ic: "🟢", color: "var(--teal)" };
    if (s.includes("moyenne") || parseInt(s) >= 35) return { pct: 50, lbl: "Moyenne", ic: "🟡", color: "var(--amber)" };
    if (s.includes("faible") || parseInt(s) >= 0) return { pct: 20, lbl: "Faible", ic: "🔴", color: "var(--rose)" };
    return { pct: 0, lbl: "N/A", ic: "⚪", color: "var(--t3)" };
  }, [aiAction, sections]);

  // 3. Température (Score Global)
  const temp = useMemo(() => {
    const s = doctor.adoptionScore;
    if (s == null) return { lbl: "N/A", ic: "❔", color: "var(--t3)", bg: "var(--navy4)" };
    if (s >= 76) return { lbl: "Chaud", ic: "🔥", color: "var(--rose)", bg: "rgba(244,63,94,.1)" };
    if (s >= 26) return { lbl: "Tiède", ic: "🌡️", color: "var(--amber)", bg: "rgba(245,158,11,.1)" };
    return { lbl: "Froid", ic: "❄️", color: "var(--blue)", bg: "rgba(59,130,246,.1)" };
  }, [doctor]);

  // 4. Sentiment Détecté
  const sentiment = useMemo(() => {
    const txt = (aiText + " " + (doctor.mainObjection || "")).toLowerCase();
    if (txt.includes("hostile") || txt.includes("refus catégorique") || txt.includes("mécontent")) return { lbl: "Hostile", ic: "😠", color: "var(--rose)" };
    if (txt.includes("sceptique") || txt.includes("réserve") || txt.includes("doute")) return { lbl: "Sceptique", ic: "🤨", color: "var(--amber)" };
    if (txt.includes("enthousiaste") || txt.includes("très intéressé") || txt.includes("partenaire")) return { lbl: "Enthousiaste", ic: "😊", color: "var(--teal)" };
    return { lbl: "Neutre", ic: "😐", color: "var(--t2)" };
  }, [aiText, doctor]);

  const initials = name => { const p = name.replace(/^Dr\.?\s*/i, "").split(" "); return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase(); };

  // Sauvegarde Objectif
  const saveGoal = () => {
    if (setDoctors) setDoctors(prev => prev.map(d => d.id === doctor.id ? { ...d, nextVisitGoal: tempGoal } : d));
    setEditingGoal(false);
  };

  // Génération Message
  const [msgType, setMsgType] = useState("email");
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgResult, setMsgResult] = useState("");
  
  const generateMessage = async () => {
    if (!apiKey) return;
    setMsgLoading(true); setMsgResult("");
    const prompt = `Rédige un ${msgType === 'email' ? 'email professionnel' : 'SMS'} pour Dr. ${doctor.name}.
Contexte: ${doctor.city}, Score ${doctor.adoptionScore}/100, Frein: ${doctor.mainObjection || "Aucun"}.
Objectif: ${tempGoal || "Découvrir le produit"}.
Tonalité: Adaptée au sentiment ${sentiment.lbl}.`;
    try {
      const out = await callLLM(prompt, apiKey, provider, model);
      setMsgResult(out);
    } catch (e) { setMsgResult("Erreur: " + e.message); }
    setMsgLoading(false);
  };

  const TABS = [
    { id: "brief", label: "📋 Brief" }, 
    { id: "objection", label: "🚧 Objection" },
    { id: "messages", label: "✉️ Messages" }, 
    { id: "actions", label: "✅ Actions" }, 
    { id: "reports", label: `📝 CR (${doctorReports.length})` },
    ...(hasAI ? [{ id: "fullai", label: "🤖 IA" }] : [])
  ];

  return (
    <div className="vp-overlay" onMouseDown={onClose}>
      <div className="vp-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="vp-header">
          <div className="vp-header-top">
            <div className="vp-avatar">{initials(doctor.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="vp-name">{doctor.name}</div>
              <div className="vp-meta">
                <span>📍 {doctor.city}{doctor.sector ? ` · ${doctor.sector}` : ""}</span>
                <span className={`tag t${doctor.potential || "C"}`}>{doctor.potential || "C"}</span>
                {/* Badge Température */}
                <span className="pill" style={{ borderColor: temp.color, color: temp.color, background: temp.bg }}>{temp.ic} {temp.lbl}</span>
              </div>
            </div>
            <button className="vp-close" onClick={onClose}>✕</button>
          </div>
          
          {/* Ligne des KPIs Visuels */}
          <div className="vp-score-row">
            {/* Score IA */}
            <div className="vp-kpi">
              <div className="vp-kpi-lbl">Score</div>
              <div className="vp-kpi-val" style={{ color: scoreColor(doctor.adoptionScore) }}>{doctor.adoptionScore != null ? `${doctor.adoptionScore}` : "—"}</div>
            </div>
            
            {/* Stade Adoption (Badge) */}
            <div className="vp-kpi" style={{ background: stage.bg, border: `1px solid ${stage.color}`, minWidth: 100 }}>
              <div className="vp-kpi-lbl" style={{ color: stage.color }}>Stade</div>
              <div style={{ fontSize: 20 }}>{stage.ic}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: stage.color, marginTop: 2 }}>{stage.lbl}</div>
            </div>

            {/* Jauge Probabilité Prescription */}
            <div className="vp-kpi" style={{ minWidth: 120 }}>
              <div className="vp-kpi-lbl">Prob. Rx</div>
              <div style={{ width: "100%", height: 6, background: "var(--navy4)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: `${proba.pct}%`, height: "100%", background: proba.color, transition: "width 0.5s", borderRadius: 3 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "var(--t3)" }}>0%</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: proba.color }}>{proba.ic} {proba.lbl}</span>
                <span style={{ fontSize: 10, color: "var(--t3)" }}>100%</span>
              </div>
            </div>

            {/* Sentiment */}
            <div className="vp-kpi">
              <div className="vp-kpi-lbl">Humeur</div>
              <span style={{ fontSize: 22 }}>{sentiment.ic}</span>
              <div style={{ fontSize: 10, color: sentiment.color, fontWeight: 600 }}>{sentiment.lbl}</div>
            </div>
          </div>

          {/* Objectif Next Visit */}
          <div style={{ marginTop: 12, background: "var(--navy3)", padding: 10, borderRadius: 8, border: "1px solid var(--bdr)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--teal)" }}>🎯 OBJECTIF</div>
              {!editingGoal && <button className="btn btn-g" style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => setEditingGoal(true)}>✏️</button>}
            </div>
            {editingGoal ? (
              <div>
                <textarea className="fta" value={tempGoal} onChange={e => setTempGoal(e.target.value)} style={{ fontSize: 12 }} rows={2} />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
                  <button className="btn btn-g" onClick={() => setEditingGoal(false)}>Annuler</button>
                  <button className="btn btn-p" onClick={saveGoal}>💾</button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--t1)", lineHeight: 1.5 }}>{tempGoal || <span style={{ color: "var(--t3)" }}>Définir un objectif...</span>}</div>
            )}
          </div>
        </div>

        {/* Tabs & Body (identique avant) */}
        <div style={{ padding: "10px 24px 0", borderBottom: "1px solid var(--bdr)" }}>
          <div className="vp-tab-row">{TABS.map(t => <button key={t.id} className={`vp-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
        </div>

        <div className="vp-body">
          {analyzing && <div className="vp-analyzing"><span className="sp" /> Analyse...</div>}
          {tab === "brief" && !analyzing && (
            <div className="vp-grid">
              <div className="vp-section accent-teal"><div className="vp-sec-title">🎯 Situation</div><div className="vp-sec-body">{sections.situation || "Lance l'analyse."}</div></div>
              <div className="vp-section accent-rose"><div className="vp-sec-title">🚧 Frein</div><div className="vp-sec-body">{doctor.mainObjection || "Aucun."}</div></div>
            </div>
          )}
          {tab === "messages" && (
            <div>
              <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                <button className={`msg-type-btn ${msgType === 'email' ? 'active' : ''}`} onClick={() => setMsgType('email')}>Email</button>
                <button className={`msg-type-btn ${msgType === 'sms' ? 'active' : ''}`} onClick={() => setMsgType('sms')}>SMS</button>
              </div>
              <button className="btn btn-p" onClick={generateMessage} disabled={!apiKey || msgLoading} style={{ width: "100%", marginBottom: 12 }}>{msgLoading ? <><span className="sp" />...</> : `✨ Générer ${msgType}`}</button>
              {msgResult && <div className="msg-output">{msgResult}</div>}
            </div>
          )}
          {tab === "actions" && !analyzing && <div className="vp-section"><div className="vp-sec-title">✅ Actions</div><div className="vp-sec-body" style={{ whiteSpace: "pre-wrap" }}>{sections.actions || "Lance l'analyse."}</div></div>}
          {tab === "reports" && <DoctorTimeline doctorId={doctor.id} reports={reports} />}
          {tab === "fullai" && hasAI && !analyzing && <div className="vp-ai-raw">{aiText}</div>}
        </div>

        <div className="vp-footer">
          <div style={{ display: "flex", gap: 8 }}>
            {!hasAI && <button className="btn btn-p" onClick={onAnalyze} disabled={!apiKey || analyzing}>⚡ Analyser</button>}
            {hasAI && <button className="btn btn-blue" onClick={onAnalyze} disabled={!apiKey || analyzing}>🔄 Re-analyser</button>}
          </div>
          <button className="btn btn-g" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Helpers & Logic Planning (Version Finale)
───────────────────────────────────────────────────────────── */
function pickEvenly(days, target) {
  if (target <= 0) return [];
  if (target >= days.length) return [...days];
  const step = days.length / target;
  const chosen = [];
  for (let i = 0; i < target; i++) {
    const idx = Math.floor(i * step);
    chosen.push(days[idx]);
  }
  return Array.from(new Set(chosen)).slice(0, target);
}

function generatePlanning({ doctors, year, monthIndex, perDay, directives, allReports }) {
  const workdays = listWorkdays(year, monthIndex);
  const plan = {};
  workdays.forEach(d => { plan[d] = []; });
  
  const usedDoctors = new Set();
  const weeks = groupWorkdaysByWeek(workdays);
  const now = Date.now();
  const idToDoc = new Map(); doctors.forEach(d => idToDoc.set(d.id, d));

  // 1. Filtrage par Fréquence
  const eligibleDoctors = doctors.filter(d => {
    const freqDays = getFrequencyDays(d.visitFrequency);
    const docReports = (allReports && allReports[d.id]) ? allReports[d.id] : [];
    if (!docReports || docReports.length === 0) return true;
    const sortedReports = [...docReports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const lastVisit = new Date(sortedReports[0].createdAt);
    return Math.floor((now - lastVisit) / 86400000) >= (freqDays - 7);
  });

  // 2. NOUVEAU : Traitement des JOURS PRÉFÉRÉS (Fixes)
  // On place ces médecins AVANT tout le monde (Contrainte forte)
  const doctorsWithPreference = eligibleDoctors.filter(d => d.preferredDay);
  const prefMap = {}; // 1=Lun, 5=Ven
  doctorsWithPreference.forEach(d => {
    const dayIdx = d.preferredDay;
    if (!prefMap[dayIdx]) prefMap[dayIdx] = [];
    prefMap[dayIdx].push(d);
  });
  // Tri par potentiel pour l'ordre dans la journée
  Object.values(prefMap).forEach(arr => arr.sort((a, b) => potRank(a.potential) - potRank(b.potential)));

  for (const day of workdays) {
    const dt = new Date(day);
    const dayIdx = dt.getDay(); // 1-5
    const candidates = prefMap[dayIdx] || [];
    
    const inCluster = id => CLUSTER.includes(idToDoc.get(id)?.city);
    // Contrainte Cluster respectée même pour les préférences
    if (inCluster(candidates[0]?.id) && !isWedThu(day)) continue; 

    for (const doc of candidates) {
      if (usedDoctors.has(doc.id)) continue;
      if (plan[day].length < perDay) {
        plan[day].push(doc.id);
        usedDoctors.add(doc.id);
      }
    }
  }

  // 3. Construction des GROUPES (Clusters)
  const normalizeLocation = (str) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';
  const groupsMap = new Map();
  
  eligibleDoctors.filter(d => !usedDoctors.has(d.id)).forEach(d => {
    const isClinic = d.sector && /clinique|hôpital|center|centre|polyclinique/i.test(d.sector);
    let groupKey, groupName, groupType;
    if (isClinic) {
      groupKey = `CLINIC::${d.city}::${normalizeLocation(d.sector)}`;
      groupName = d.sector;
      groupType = 'clinic';
    } else {
      groupKey = `CITY::${d.city}`;
      groupName = d.city;
      groupType = 'city';
    }
    if (!groupsMap.has(groupKey)) groupsMap.set(groupKey, { name: groupName, doctors: [], type: groupType, city: d.city });
    groupsMap.get(groupKey).doctors.push(d);
  });

  const groupsArray = Array.from(groupsMap.values()).sort((a, b) => {
    if (a.type === 'clinic' && b.type !== 'clinic') return -1;
    if (a.type !== 'clinic' && b.type === 'clinic') return 1;
    return b.doctors.length - a.doctors.length;
  });

  const inCluster = id => CLUSTER.includes(idToDoc.get(id)?.city);
  const canPlace = (id, day) => (!inCluster(id) || isWedThu(day));
  
  const placeGroupOnDay = (doctorsInGroup, targetDay) => {
    let placedCount = 0;
    const doctorsToPlace = doctorsInGroup.filter(d => !usedDoctors.has(d.id));
    for (const doc of doctorsToPlace) {
      if (plan[targetDay].length < perDay && canPlace(doc.id, targetDay)) {
        plan[targetDay].push(doc.id);
        usedDoctors.add(doc.id);
        placedCount++;
      }
    }
    return placedCount;
  };

  // 4. Application des DIRECTIVES PRO
  const activeDirectives = (directives || [])
    .filter(dir => {
      if (!dir.isActive) return false;
      const start = dir.startDate ? new Date(dir.startDate) : null;
      const end = dir.endDate ? new Date(dir.endDate) : null;
      if (start && now < start.getTime()) return false;
      if (end && now > end.getTime()) return false;
      return true;
    })
    .sort((a, b) => {
      const pA = a.priority || 5; 
      const pB = b.priority || 5;
      if (pA !== pB) return pB - pA; // Haute priorité d'abord
      return a.week - b.week;
    });

  activeDirectives.forEach(dir => {
    let visitCount = 0;
    const maxVisits = dir.maxVisits || Infinity;
    const weekDays = weeks[dir.week - 1] || [];
    const targetDays = weekDays.filter(day => {
      const d = new Date(day);
      return dir.days.includes(d.getDay());
    });

    const directiveCandidates = eligibleDoctors.filter(d => {
      if (usedDoctors.has(d.id)) return false;
      if (dir.products && dir.products.length > 0 && !dir.products.includes(d.product)) return false;
      if (dir.potentials && dir.potentials.length > 0 && !dir.potentials.includes(d.potential)) return false;
      if (dir.cities && dir.cities.length > 0 && !dir.cities.includes(d.city)) return false;
      if (dir.specialties && dir.specialties.length > 0 && !dir.specialties.includes(d.specialite)) return false;
      if (dir.excludeIds && dir.excludeIds.includes(d.id)) return false;
      return true;
    }).sort((a, b) => potRank(a.potential) - potRank(b.potential));

    // Sous-groupement
    const dirGroups = {};
    directiveCandidates.forEach(d => {
       const key = (d.sector && /clinique|hôpital/i.test(d.sector)) ? d.sector : d.city;
       if(!dirGroups[key]) dirGroups[key] = [];
       dirGroups[key].push(d);
    });

    for(const group of Object.values(dirGroups)) {
      if (visitCount >= maxVisits) break;
      let remaining = [...group];
      const sortedTargetDays = [...targetDays].sort((a,b) => {
         const cityA = plan[a].filter(id => idToDoc.get(id)?.city === group[0].city).length;
         const cityB = plan[b].filter(id => idToDoc.get(id)?.city === group[0].city).length;
         return cityB - cityA;
      });

      for (const day of sortedTargetDays) {
        if (remaining.length === 0 || visitCount >= maxVisits) break;
        remaining = remaining.filter(doc => {
          if (visitCount >= maxVisits) return true;
          if (plan[day].length < perDay && canPlace(doc.id, day)) {
            plan[day].push(doc.id);
            usedDoctors.add(doc.id);
            visitCount++;
            return false;
          }
          return true;
        });
      }
    }
  });

  // 5. Remplissage Standard (Cluster First)
  for (const group of groupsArray) {
    const availableDocs = group.doctors.filter(d => !usedDoctors.has(d.id));
    if (availableDocs.length === 0) continue;

    if (group.type === 'clinic') {
      let bestDay = null;
      for (const day of workdays) {
        if ((perDay - plan[day].length) >= availableDocs.length) {
           bestDay = day; break;
        }
      }
      if (bestDay) { placeGroupOnDay(availableDocs, bestDay); continue; }
    }

    const sortedDays = [...workdays].sort((a, b) => {
      const cityA = plan[a].filter(id => idToDoc.get(id)?.city === group.city).length;
      const cityB = plan[b].filter(id => idToDoc.get(id)?.city === group.city).length;
      if (cityA !== cityB) return cityB - cityA;
      return (perDay - plan[a].length) - (perDay - plan[b].length);
    });

    for (const day of sortedDays) {
      if (availableDocs.filter(d => !usedDoctors.has(d.id)).length === 0) break;
      placeGroupOnDay(availableDocs, day);
    }
  }

  const scheduled = new Set(Object.values(plan).flat());
  const backlog = eligibleDoctors.filter(d => !scheduled.has(d.id)).map(d => d.id);
  return { plan, backlog, meta: { year, monthIndex, perDay } };
}

/* ─── Directive Modal Pro ─── */
function DirectiveModal({ directive, onSave, onClose, doctors }) {
  const [form, setForm] = useState(directive || {
    id: `dir_${Date.now()}`, name: "", isActive: true,
    week: 1, days: [3, 4], startDate: "", endDate: "",
    priority: 5, maxVisits: "",
    cities: [], specialties: [], products: [], potentials: [], excludeIds: []
  });

  const allCities = useMemo(() => [...new Set(doctors.map(d => d.city))].sort(), [doctors]);
  const allSpecialties = useMemo(() => [...new Set(doctors.map(d => d.specialite).filter(Boolean))].sort(), [doctors]);
  const allProducts = useMemo(() => [...new Set(doctors.map(d => d.product).filter(Boolean))].sort(), [doctors]);
  const doctorOptions = useMemo(() => doctors.map(d => ({id: d.id, name: d.name})), [doctors]);

  const toggleDay = (day) => {
    setForm(prev => ({ ...prev, days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day].sort() }));
  };

  const toggleArray = (field, value) => {
    setForm(prev => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value] }));
  };

  const chipContainer = { display: 'flex', gap: 4, flexWrap: 'wrap', maxHeight: 100, overflowY: 'auto', padding: "4px", background: "var(--navy4)", borderRadius: 6, marginTop: 4 };

  return (
    <div className="vp-overlay" onMouseDown={onClose}>
      <div className="vp-modal" style={{ maxWidth: 700, maxHeight: '90vh' }} onMouseDown={e => e.stopPropagation()}>
        <div className="vp-header">
          <div className="vp-name">{directive ? "Modifier la Règle" : "Nouvelle Règle Intelligente"}</div>
          <div className="vp-sub">Priorité, Limites, et Ciblage.</div>
        </div>
        
        <div className="vp-body" style={{ overflowY: 'auto' }}>
          <div className="fg"><label className="fl">Nom de la règle</label><input className="fi" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Ex: Focus A - Cardiologie"/></div>

          <div className="grid2">
            <div className="fg"><label className="fl">Priorité (1-10)</label><input className="fi" type="number" min="1" max="10" value={form.priority} onChange={e => setForm(p => ({...p, priority: parseInt(e.target.value)}))} /><div className="mini">10 = Urgent</div></div>
            <div className="fg"><label className="fl">Max Visites</label><input className="fi" type="number" placeholder="Illimité" value={form.maxVisits} onChange={e => setForm(p => ({...p, maxVisits: e.target.value}))} /></div>
          </div>

          <div className="sep"/><div className="card-t" style={{fontSize: 12}}>📅 Période & Jours</div>
          <div className="grid2">
             <div className="fg"><label className="fl">Semaine</label><select className="fs" value={form.week} onChange={e => setForm(p => ({...p, week: parseInt(e.target.value)}))}>{[1,2,3,4,5].map(w => <option key={w} value={w}>Semaine {w}</option>)}</select></div>
             <div className="fg"><label className="fl">Jours</label><div style={{display: 'flex', gap: 4}}>{["Lun", "Mar", "Mer", "Jeu", "Ven"].map((d, i) => (<button key={i} className={`btn ${form.days.includes(i+1) ? "btn-p" : "btn-g"}`} style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => toggleDay(i + 1)}>{d}</button>))}</div></div>
          </div>
          <div className="grid2">
            <div className="fg"><label className="fl">Début validité</label><input className="fi" type="date" value={form.startDate} onChange={e => setForm(p => ({...p, startDate: e.target.value}))} /></div>
            <div className="fg"><label className="fl">Fin validité</label><input className="fi" type="date" value={form.endDate} onChange={e => setForm(p => ({...p, endDate: e.target.value}))} /></div>
          </div>

          <div className="sep"/><div className="card-t" style={{fontSize: 12}}>🎯 Ciblage</div>
          <div className="fg"><label className="fl">Villes</label><div style={chipContainer}>{allCities.map(c => (<button key={c} className={`btn ${form.cities.includes(c) ? "btn-p" : "btn-g"}`} style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => toggleArray("cities", c)}>{c}</button>))}</div></div>
          <div className="grid2">
            <div className="fg"><label className="fl">Produits</label><div style={chipContainer}>{allProducts.map(p => (<button key={p} className={`btn ${form.products.includes(p) ? "btn-blue" : "btn-g"}`} style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => toggleArray("products", p)}>{p}</button>))}</div></div>
            <div className="fg"><label className="fl">Potentiel</label><div style={chipContainer}>{['A', 'B', 'C'].map(p => (<button key={p} className={`btn ${form.potentials.includes(p) ? "btn-rose" : "btn-g"}`} style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => toggleArray("potentials", p)}>{p}</button>))}</div></div>
          </div>
          <div className="fg"><label className="fl">Spécialités</label><div style={chipContainer}>{allSpecialties.map(s => (<button key={s} className={`btn ${form.specialties.includes(s) ? "btn-blue" : "btn-g"}`} style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => toggleArray("specialties", s)}>{s}</button>))}</div></div>
          
          <div className="fg">
            <label className="fl">Exclure des médecins</label>
            <select multiple className="fs" style={{height: 50}} value={form.excludeIds} onChange={e => setForm(p => ({...p, excludeIds: Array.from(e.target.selectedOptions, o => o.value)}))}>
              {doctorOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

        </div>

        <div className="vp-footer"><button className="btn btn-g" onClick={onClose}>Annuler</button><button className="btn btn-p" onClick={() => onSave(form)}>💾 Sauvegarder</button></div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
  Planning Page (Finale)
───────────────────────────────────────────────────────────── */
function PlanningPage({ doctors, setDoctors, apiKey, provider, model }) {
  const [year, setYear] = useState(2026);
  const [monthIndex, setMonthIndex] = useState(2);
  const [perDay, setPerDay] = useState(6);
  
  const [directives, setDirectives] = useState(() => loadJSON("medrep_directives", []));
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);
  const [editingDirective, setEditingDirective] = useState(null);

  const storageKey = useMemo(() => `medrep_planning_${monthKey(year, monthIndex)}`, [year, monthIndex]);
  const workdays = useMemo(() => listWorkdays(year, monthIndex), [year, monthIndex]);
  const docById = useMemo(() => { const m = new Map(); doctors.forEach(d => m.set(d.id, d)); return m; }, [doctors]);
  const allReports = useMemo(() => loadJSON("medrep_reports_v1", {}), []);

  const [planState, setPlanState] = useState(() => {
    const saved = loadJSON(storageKey, null);
    if (saved?.plan) return saved;
    return generatePlanning({ doctors, year, monthIndex, perDay, directives, allReports });
  });

  useEffect(() => saveJSON("medrep_directives", directives), [directives]);
  useEffect(() => { regenerate(); }, [directives, year, monthIndex, perDay, doctors]);

  const regenerate = () => setPlanState(generatePlanning({ doctors, year, monthIndex, perDay, directives, allReports }));
  const clearMonth = () => { const blank = {}; workdays.forEach(d => (blank[d] = [])); setPlanState({ plan: blank, backlog: doctors.map(d => d.id), meta: { year, monthIndex, perDay } }); };

  const saveDirective = (dir) => {
    setDirectives(prev => { const exists = prev.find(d => d.id === dir.id); if (exists) return prev.map(d => d.id === dir.id ? dir : d); return [...prev, dir]; });
    setShowDirectiveModal(false); setEditingDirective(null);
  };

  const deleteDirective = (id) => { if(!confirm("Supprimer ?")) return; setDirectives(prev => prev.filter(d => d.id !== id)); };

  const scheduledOnceSet = useMemo(() => new Set(Object.values(planState.plan || {}).flat()), [planState.plan]);
  const allVisitedOnce = doctors.length > 0 && scheduledOnceSet.size >= doctors.length;
  const [dragId, setDragId] = useState(null); const [dropDay, setDropDay] = useState(null); const [dropBacklog, setDropBacklog] = useState(false); const isDraggingRef = useRef(false);
  const [visitPrepId, setVisitPrepId] = useState(null); const [vpAnalyzing, setVpAnalyzing] = useState(false); const [vpAiErr, setVpAiErr] = useState("");
  const [reports] = useState(() => loadJSON("medrep_reports_v1", {})); const [actions, setActions] = useState(() => loadJSON("medrep_actions_v1", {}));
  useEffect(() => { try { localStorage.setItem("medrep_actions_v1", JSON.stringify(actions)); } catch { } }, [actions]);
  const visitPrepDoctor = visitPrepId ? docById.get(visitPrepId) : null;
  const openVisitPrep = id => { setVpAiErr(""); setVisitPrepId(id); };
  
  const analyzeForVisit = async () => {
    if (!apiKey || !visitPrepDoctor) return; const docReports = (reports[visitPrepId] || []).slice(0, 5);
    if (!docReports.length) { setVpAiErr("Ajoute un CR."); return; }
    const existingMemory = loadJSON(`medrep_memory_${visitPrepId}`, {}); setVpAnalyzing(true); setVpAiErr("");
    try { const prompt = `Analyse ${visitPrepDoctor.name}.\nCR:\n${docReports.map((r, i) => `[${i+1}] ${r.text||'—'}`).join("\n")}\n## Score\n- Score : X/100`; const out = await callLLM(prompt, apiKey, provider, model); const insights = extractAdoptionInsights(out); const newMemory = extractAIMemory(out, existingMemory); setActions(prev => ({ ...prev, [visitPrepId]: { generatedAt: dtNowISO(), text: out } })); saveJSON(`medrep_memory_${visitPrepId}`, newMemory); if (setDoctors) setDoctors(prev => stableSortDocs(prev.map(doc => doc.id === visitPrepId ? { ...doc, adoptionScore: insights.adoptionScore ?? doc.adoptionScore } : doc))); } catch (e) { setVpAiErr(e.message); } setVpAnalyzing(false);
  };

  const isDocInPlan = (id, plan) => { for (const k of Object.keys(plan)) if ((plan[k] || []).includes(id)) return true; return false; };
  const onDropToDay = day => { if (!dragId) return; isDraggingRef.current = false; setPlanState(prev => { const plan = { ...prev.plan }; const doc = docById.get(dragId); if (doc && CLUSTER.includes(doc.city) && !isWedThu(day)) { alert("Cluster Mer/Jeu"); return prev; } const alreadyIn = isDocInPlan(dragId, plan); if (alreadyIn && !allVisitedOnce) { alert("1 visite max"); return prev; } Object.keys(plan).forEach(k => { plan[k] = (plan[k] || []).filter(id => id !== dragId); }); const backlog = (prev.backlog || []).filter(id => id !== dragId); plan[day] = [...(plan[day] || []), dragId]; return { ...prev, plan, backlog }; }); setDragId(null); setDropDay(null); setDropBacklog(false); };
  const onDropToBacklog = () => { if (!dragId) return; isDraggingRef.current = false; setPlanState(prev => { const plan = { ...prev.plan }; Object.keys(plan).forEach(k => { plan[k] = (plan[k] || []).filter(id => id !== dragId); }); const backlog = [dragId, ...(prev.backlog || []).filter(id => id !== dragId)]; return { ...prev, plan, backlog }; }); setDragId(null); setDropDay(null); setDropBacklog(false); };
  const removeFromDay = (day, id) => { setPlanState(prev => { const plan = { ...prev.plan, [day]: (prev.plan[day] || []).filter(x => x !== id) }; const backlog = [id, ...(prev.backlog || []).filter(x => x !== id)]; return { ...prev, plan, backlog }; }); };

  const openMap = (d) => { const query = encodeURIComponent(`${d.name} ${d.sector || ''} ${d.city}`); window.open(`https://www.google.com/maps/search/${query}`, '_blank'); };

  const totalScheduled = Object.values(planState.plan || {}).flat().length;
  const activeDays = Object.entries(planState.plan || {}).filter(([, arr]) => (arr || []).length > 0).length;
  const weeks = useMemo(() => groupWorkdaysByWeek(workdays), [workdays]);
  const realBacklog = useMemo(() => { const scheduled = new Set(Object.values(planState.plan || {}).flat()); return doctors.filter(d => !scheduled.has(d.id)).map(d => d.id); }, [doctors, planState.plan]);
  const [planTab, setPlanTab] = useState("planning");
  
  // Helper pour affichage
  const dayLabels = {1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven"};

  return (
    <div className="content">
      <div className="vp-tab-row" style={{ marginBottom: 14 }}> <button className={`vp-tab${planTab === "planning" ? " active" : ""}`} onClick={() => setPlanTab("planning")}>📅 Planning</button> <button className={`vp-tab${planTab === "route" ? " active" : ""}`} onClick={() => setPlanTab("route")}>🗺️ Tournée</button> </div>
      {planTab === "route" && <div className="card" style={{ marginBottom: 14 }}><div className="card-t">🗺️ Tournée</div><RouteOptimizerPanel doctors={doctors} planState={planState} docById={docById} /></div>}
      {planTab === "planning" && ( <>
        <div className="pl-toolbar"> <div style={{ minWidth: 150 }}><label className="fl">Mois</label><select className="fs" value={monthIndex} onChange={e => setMonthIndex(parseInt(e.target.value, 10))}>{MFR.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></div> <div style={{ minWidth: 100 }}><label className="fl">Année</label><input className="fi" type="number" value={year} onChange={e => setYear(parseInt(e.target.value || "2026", 10))} /></div> <div style={{ minWidth: 120 }}><label className="fl">Visites / jour</label><input className="fi" type="number" min={3} max={12} value={perDay} onChange={e => setPerDay(parseInt(e.target.value || "6", 10))} /></div> <div style={{ display: "flex", gap: 8 }}> <button className="btn btn-blue" onClick={() => { setEditingDirective(null); setShowDirectiveModal(true); }}>📋 Règles Pro</button> <button className="btn btn-p" onClick={regenerate}>⚡ Générer</button> <button className="btn btn-g" onClick={clearMonth}>🧹 Vider</button> </div> <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}> <span className="pill">📅 {activeDays} jours</span> <span className="pill" style={{ borderColor: "rgba(0,212,170,.35)" }}>✅ {totalScheduled} planifiées</span> </div> </div>
        {directives.length > 0 && <div className="card" style={{ marginBottom: 10, padding: "8px 12px", display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}> <span style={{ fontSize: 11, fontWeight: 700 }}>Règles actives:</span> {directives.filter(d => d.isActive).map(d => <span key={d.id} className="pill" style={{ borderColor: "var(--violet)", color: "var(--violet)", cursor: 'pointer' }} onClick={() => { setEditingDirective(d); setShowDirectiveModal(true); }}> {d.name} (S{d.week}, P{d.priority || 5}) <span style={{ marginLeft: 4, opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); deleteDirective(d.id); }}>✕</span> </span> )} </div> }
        <div className="ok" style={{ marginBottom: 12 }}>✅ Algo Pro actif (Préférences & Clusters). <b>Clic sur 📋</b> pour préparer.</div>
        <div className="card" style={{ marginBottom: 12 }}> <div className="card-t">Backlog <span className="pill">{realBacklog.length}</span></div> <div onDragOver={e => { e.preventDefault(); setDropBacklog(true); }} onDragLeave={() => setDropBacklog(false)} onDrop={e => { e.preventDefault(); onDropToBacklog(); }} className={dropBacklog ? "drop-hint" : ""} style={{ padding: 10, borderRadius: 12, minHeight: 70 }}> {realBacklog.length === 0 && <div className="empty" style={{ padding: 18 }}>Tout est planifié ✅</div>} <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(200px,1fr))", gap: 10 }}> {realBacklog.slice(0, 40).map(id => { const d = docById.get(id); if (!d) return null; return ( <div key={id} className={`chip chip-clickable ${dragId === id ? "dragging" : ""}`} draggable onDragStart={() => { isDraggingRef.current = true; setDragId(id); }} onDragEnd={() => { isDraggingRef.current = false; setDragId(null); setDropBacklog(false); }}> <div className="chip-l" onClick={() => openVisitPrep(id)}><div className="chip-n">{d.name}</div><div className="chip-s">{d.city} {d.preferredDay ? <span style={{color:"var(--teal)"}}>({dayLabels[d.preferredDay]})</span> : ""}</div></div> <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button className="chip-eye" onClick={e => { e.stopPropagation(); openMap(d); }} title="Localiser">📍</button>
          <span className={`tag t${d.potential || "C"}`}>{d.potential || "C"}</span>
          <button className="chip-eye" onClick={e => { e.stopPropagation(); openVisitPrep(id); }}>📋</button>
        </div> </div> ); })} </div> </div> </div>
        {weeks.map((weekDays, wi) => { const weekVisits = weekDays.reduce((acc, day) => acc + ((planState.plan?.[day] || []).length), 0); const weekTarget = weekDays.length * perDay; return ( <div key={`week_${wi}`} className="week-block"> <div className="week-head"><div><div className="week-title">Semaine {wi + 1}</div><div className="week-sub">{weekDays.length}j · {weekVisits}/{weekTarget}</div></div></div> <div className="pl-grid-week"> {weekDays.map(day => { const dt = new Date(day), list = planState.plan?.[day] || [], isClDay = isWedThu(day); const isDirectiveDay = directives.some(dir => dir.week === (wi+1) && dir.days.includes(dt.getDay()));
                
                // Affichage Cluster
                const locationCount = {}; 
                list.forEach(id => { const doc = docById.get(id); if(doc) { const loc = (doc.sector && /clinique|hôpital|center/i.test(doc.sector)) ? doc.sector : doc.city; locationCount[loc] = (locationCount[loc] || 0) + 1; } });
                const dominantLocation = Object.entries(locationCount).sort((a,b) => b[1] - a[1])[0];

                return ( <div key={day} className={`pl-day ${isClDay ? "cl" : ""} ${isDirectiveDay ? "full" : ""}`} onDragOver={e => { e.preventDefault(); setDropDay(day); }} onDrop={e => { e.preventDefault(); onDropToDay(day); }}> <div className="pl-dh"><div><div className="pl-dn">{DFR[dt.getDay()]} {dt.getDate()}</div>
                  {dominantLocation && (<div className="soft-badge ok" style={{marginTop:2}}>📍 {dominantLocation[0]} ({dominantLocation[1]})</div>)}
                  {isDirectiveDay && <div className="mini" style={{color:"var(--violet)"}}>📋 Directive</div>}
                </div><span className="pill">{list.length}/{perDay}</span></div> <div className="pl-vs"> {list.map(id => { const d = docById.get(id); if (!d) return null; return ( <div key={id} className="chip" draggable onDragStart={() => { isDraggingRef.current = true; setDragId(id); }}> <div className="chip-l" onClick={() => openVisitPrep(id)} style={{ cursor: "pointer" }}><div className="chip-n">{d.name}</div><div className="chip-s">{d.city}</div></div> <div style={{ display: "flex", gap: 4 }}>
                  <button className="chip-eye" onClick={() => openMap(d)} title="Localiser">📍</button>
                  <button className="chip-eye" onClick={() => openVisitPrep(id)}>📋</button>
                  <button className="btn btn-g" style={{ padding: "2px 6px", fontSize: 10 }} onClick={() => removeFromDay(day, id)}>✕</button>
                </div> </div> ); })} </div> </div> ); })} </div> </div> ); })}
      </> )}
    
      {showDirectiveModal && <DirectiveModal directive={editingDirective} onSave={saveDirective} onClose={() => { setShowDirectiveModal(false); setEditingDirective(null); }} doctors={doctors} />}
      {visitPrepDoctor && <VisitPrepModal doctor={visitPrepDoctor} reports={reports} aiAction={actions[visitPrepId]} apiKey={apiKey} provider={provider} model={model} onClose={() => { setVisitPrepId(null); }} onAnalyze={analyzeForVisit} analyzing={vpAnalyzing} aiErr={vpAiErr} setDoctors={setDoctors} />}
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────
  Reports Page (Version Corrigée Audio)
───────────────────────────────────────────────────────────── */
function ReportsPage({doctors, setDoctors, apiKey, provider, model, setPage}){
  const[selectedId,setSelectedId]=useState(doctors[0]?.id||null);
  const[reports,setReports]=useState(()=>loadJSON("medrep_reports_v1",{}));
  const[actions,setActions]=useState(()=>loadJSON("medrep_actions_v1",{}));
  
  useEffect(()=>saveJSON("medrep_reports_v1",reports),[reports]);
  useEffect(()=>saveJSON("medrep_actions_v1",actions),[actions]);
  
  const docById=useMemo(()=>{const m=new Map();doctors.forEach(d=>m.set(d.id,d));return m;},[doctors]);
  const selectedDoctor=selectedId?docById.get(selectedId):null;
  const doctorReports=(selectedId&&reports[selectedId])?reports[selectedId]:[];
  
  const[text,setText]=useState("");
  const[transcript,setTranscript]=useState("");
  const[saving,setSaving]=useState(false);
  
  // --- Dictée Vocale ---
  const[dictating,setDictating]=useState(false);
  const speechRef=useRef(null);
  const speechSupported=useMemo(()=>typeof window!=="undefined"&&!!(window.SpeechRecognition||window.webkitSpeechRecognition),[]);
  
  const startDictation=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Dictée non supportée."); return;}
    const rec=new SR();
    rec.lang="fr-FR"; rec.interimResults=true; rec.continuous=true;
    rec.onresult=e=>{
      let ft="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const chunk=e.results[i][0]?.transcript||"";
        if(e.results[i].isFinal)ft+=chunk+" ";
      }
      if(ft)setTranscript(prev=>(prev+" "+ft).trim());
    };
    rec.onerror=e=>{console.error("Speech Error:",e.error); setDictating(false);};
    rec.onend=()=>setDictating(false);
    speechRef.current=rec;
    setDictating(true);
    rec.start();
  };
  const stopDictation=()=>{try{speechRef.current?.stop();}catch{} setDictating(false);};

  // --- Audio Recording (CORRIGÉ) ---
  const[recording,setRecording]=useState(false);
  const mediaRecRef=useRef(null),chunksRef=useRef([]);
  
  const startRecording=async()=>{
    // Vérification HTTPS (nécessaire pour le micro)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
       return alert("❌ Le microphone nécessite une connexion sécurisée (HTTPS).");
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mr.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      // Nettoyage des pistes quand on arrête
      mr.onstop = () => {
         stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      alert("Impossible d'accéder au micro : " + err.message);
    }
  };

  const stopRecordingAndSave=async()=>{
    if(!mediaRecRef.current) return;
    
    return new Promise(resolve => {
      const mr = mediaRecRef.current;
      
      mr.onstop = async () => {
        // Création du blob audio
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecording(false);
        // Sauvegarde automatique
        await addReport({ audioBlob: blob });
        resolve();
      };
      
      mr.stop();
    });
  };

  // --- Ajout de rapport ---
  const addReport=async({audioBlob=null}={})=>{
    if(!selectedId)return;
    const content=(text||"").trim(),trans=(transcript||"").trim();
    if(!content&&!trans&&!audioBlob)return alert("Écris un CR ou fais une dictée.");
    setSaving(true);
    try{
      const rId=`r_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      let audioKey=null;
      if(audioBlob){audioKey=`audio_${rId}`;await idbPut(audioKey,audioBlob);}
      const item={id:rId,createdAt:dtNowISO(),text:content,transcript:trans,audioKey};
      setReports(prev=>{const list=prev[selectedId]?[...prev[selectedId]]:[];list.unshift(item);return{...prev,[selectedId]:list};});
      setText("");setTranscript("");
      if(apiKey&&selectedDoctor)setTimeout(()=>analyze(),600);
    }finally{setSaving(false);}
  };

  const playAudio=async audioKey=>{
    if(!audioKey)return;
    const blob=await idbGet(audioKey);
    if(!blob)return alert("Audio introuvable.");
    const url=URL.createObjectURL(blob);const a=new Audio(url);a.onended=()=>URL.revokeObjectURL(url);a.play();
  };
  
  const deleteReport=async rid=>{
    if(!selectedId||!confirm("Supprimer ?"))return;
    const rep=doctorReports.find(x=>x.id===rid);
    if(rep?.audioKey){try{await idbDel(rep.audioKey);}catch{}}
    setReports(prev=>({...prev,[selectedId]:(prev[selectedId]||[]).filter(x=>x.id!==rid)}));
  };
  
  // --- Analyse IA ---
  const[analyzing,setAnalyzing]=useState(false);
  const[aiErr,setAiErr]=useState("");
  
  const analyze=async()=>{
    if(!apiKey)return setPage("settings");
    if(!selectedDoctor)return;
    const last=doctorReports.slice(0,5);
    if(last.length===0)return alert("Ajoute au moins un CR.");
    setAnalyzing(true);setAiErr("");
    try{
      const prompt=`Analyse Dr. ${selectedDoctor.name} (${selectedDoctor.city}, Pot. ${selectedDoctor.potential}).\n\nCR:\n${last.map((r,i)=>`[${i+1}] ${r.text||r.transcript||"Audio"}`).join("\n")}\n\n## Score d'adoption\n- Score : X/100\n- Frein principal : ...`;
      const out=await callLLM(prompt,apiKey,provider,model);
      const insights=extractAdoptionInsights(out);
      setActions(prev=>({...prev,[selectedId]:{generatedAt:dtNowISO(),text:out,prescriptionProba:insights.prescriptionProba}}));
      setDoctors(prev=>stableSortDocs(prev.map(doc=>doc.id===selectedId?{...doc,adoptionScore:insights.adoptionScore??doc.adoptionScore,mainObjection:insights.mainObjection||doc.mainObjection}:doc)));
    }catch(e){setAiErr(e.message);}
    setAnalyzing(false);
  };

  // Templates Rapides
  const QUICK_TEMPLATES = [
    { label: "Intro", text: "Présentation du produit. " },
    { label: "Prix", text: "Objection prix. " },
    { label: "Rx", text: "Prescription validée. " },
    { label: "À revoir", text: "À revoir dans 15j. " }
  ];

  if(!doctors.length)return<div className="content"><div className="card"><div className="empty">Aucun médecin.</div></div></div>;
  
  return(
    <div className="content">
      <div className="g2" style={{alignItems:"start"}}>
        <div className="card">
          <div className="card-t">🧾 Compte-rendu</div>
          <div className="fg"><label className="fl">Médecin</label><select className="fs" value={selectedId||""} onChange={e=>setSelectedId(parseInt(e.target.value,10))}>{doctors.map(d=><option key={d.id} value={d.id}>{d.name} — {d.city}</option>)}</select></div>
          
          <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
             {QUICK_TEMPLATES.map(t => (
               <button key={t.label} className="btn btn-g" style={{ fontSize: 10, padding: "4px 8px" }} onClick={() => setText(prev => (prev || "") + t.text)}>{t.label}</button>
             ))}
          </div>

          <textarea className="fta" placeholder="Échanges, intérêt, objections..." value={text} onChange={e=>setText(e.target.value)} style={{minHeight: 120}}/>
          
          <div className="grid2" style={{marginTop:8}}>
             <div className="fg"><label className="fl">Dictée</label><textarea className="fta" placeholder="Clic Démarrer..." value={transcript} onChange={e=>setTranscript(e.target.value)}/></div>
             <div className="fg" style={{display:'flex', flexDirection:'column', gap:8}}>
                <div style={{display:'flex', gap:8}}><button className="btn btn-blue" disabled={!speechSupported||dictating} onClick={startDictation}>🎙️ Démarrer</button><button className="btn btn-g" disabled={!dictating} onClick={stopDictation}>⏹️ Stop</button></div>
                <div className="mini">Autorisez le micro si demandé.</div>
             </div>
          </div>
          
          <div className="sep"/>
          
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
             <button className="btn btn-p" disabled={saving} onClick={()=>addReport({})}>{saving?<span className="sp"/>:"💾 Sauvegarder"}</button>
             <button className="btn btn-g" onClick={()=>{setText("");setTranscript("");}}>🧹 Effacer</button>
             <span className="pill" style={{marginLeft:"auto"}}>{doctorReports.length} CR</span>
          </div>
          
          <div className="sep"/>
          <div className="card-t" style={{marginBottom:8}}>🎧 Enregistrement Audio</div>
          <div style={{display:"flex",gap:8}}>
             <button className="btn btn-blue" disabled={recording} onClick={startRecording}>⏺️ Enregistrer</button>
             <button className="btn btn-g" disabled={!recording} onClick={stopRecordingAndSave}>⏹️ Stop + Sauver</button>
             {recording && <span className="pill" style={{color:"var(--rose)", borderColor:"var(--rose)"}}>● REC</span>}
          </div>
        </div>
        
        <div className="card">
          <div className="card-t">🤖 Analyse IA <span className="pill" style={{borderColor:apiKey?"rgba(0,212,170,.35)":"rgba(244,63,94,.35)",color:apiKey?"var(--teal)":"var(--rose)"}}>{apiKey?"ON":"OFF"}</span></div>
          {!apiKey&&<div className="warn" style={{marginBottom:10}}>⚠️ Configure l'API.</div>}
          <button className="btn btn-p" onClick={analyze} disabled={!apiKey||analyzing||!selectedDoctor}>{analyzing?<><span className="sp"/> Analyse…</>:"⚡ Analyser"}</button>
          {aiErr&&<div className="warn" style={{marginTop:10}}>⚠️ {aiErr}</div>}
          <div className="sep"/>
          {!actions[selectedId]?.text?<div className="empty" style={{padding:20}}>Aucune analyse.</div>:(
            <div>
              <div style={{marginBottom:8}}><div className="mini">Généré: {new Date(actions[selectedId].generatedAt).toLocaleString("fr-FR")}</div></div>
              <div style={{whiteSpace:"pre-wrap",lineHeight:1.7,fontSize:13,background:"rgba(255,255,255,.02)",border:"1px solid var(--bdr)",borderRadius:12,padding:12,maxHeight:400,overflowY:"auto"}}>{actions[selectedId].text}</div>
              <div style={{display:"flex",gap:8,marginTop:10}}><button className="btn btn-g" onClick={()=>navigator.clipboard.writeText(actions[selectedId].text)}>📋 Copier</button></div>
            </div>
          )}
        </div>
      </div>
      <div style={{height:12}}/>
      <div className="card">
        <div className="card-t">📚 Historique</div>
        {doctorReports.length===0?<div className="empty" style={{padding:22}}>Aucun CR.</div>:(
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {doctorReports.slice(0,10).map(r=>(
              <div key={r.id} style={{border:"1px solid var(--bdr)",borderRadius:12,padding:12,background:"rgba(255,255,255,.02)"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                  <div style={{fontFamily:"var(--fd)",fontWeight:800,fontSize:12}}>{new Date(r.createdAt).toLocaleString("fr-FR")}</div>
                  <div style={{display:"flex",gap:8}}>{r.audioKey&&<button className="btn btn-g" style={{padding:"5px 10px"}} onClick={()=>playAudio(r.audioKey)}>▶︎</button>}<button className="btn btn-rose" style={{padding:"5px 10px"}} onClick={()=>deleteReport(r.id)}>🗑️</button></div>
                </div>
                <div className="mini" style={{marginTop:8}}><b>Texte:</b> {r.text?r.text.slice(0,140):"—"}</div>
                <div className="mini" style={{marginTop:4}}><b>Dictée:</b> {r.transcript?r.transcript.slice(0,140):"—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────
  Assistant (Version Complète avec Mémoire & Fichiers)
───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
  Assistant (Version Corrigée)
───────────────────────────────────────────────────────────── */
function Assistant({ apiKey, provider, model, setPage, doctors }) {
  // --- États ---
  const [msgs, setMsgs] = useState(() => {
    const saved = loadJSON(CHAT_HISTORY_KEY, null);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return [{ role: "assistant", text: `Bonjour ! Je suis votre assistant médical personnel.\n\nJe peux analyser des documents (PDF, Images, Excel) et les mémoriser pour vous.\n\nQue puis-je faire pour vous ?`, time: tNow() }];
  });

  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Gestion de la base de connaissance
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const fileInputRef = useRef(null);
  
  // CORRECTION : Déclaration de 'bot'
  const bot = useRef(null);

  // Charger les fichiers mémorisés
  useEffect(() => {
    getAllKnowledgeFiles().then(list => {
      const files = list.map((blob, i) => ({
        id: `file_${i}_${Date.now()}`,
        name: blob.name || `Fichier ${i + 1}`,
        type: blob.type,
        size: blob.size,
        storedAt: blob.storedAt || new Date().toISOString(),
        url: URL.createObjectURL(blob)
      }));
      setKnowledgeFiles(files);
    });
  }, []);

  // Sauvegarde auto
  useEffect(() => {
    saveJSON(CHAT_HISTORY_KEY, msgs);
    bot.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // --- Fonctions ---
  const clearChat = () => {
    if (!confirm("Effacer tout l'historique ?")) return;
    setMsgs([{ role: "assistant", text: `Nouvelle conversation. Je me souviens des fichiers stockés.`, time: tNow() }]);
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Gestion Fichiers
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const arrayBuffer = ev.target.result;
      const blob = new Blob([arrayBuffer], { type: file.type });
      blob.name = file.name;
      blob.storedAt = new Date().toISOString();

      await saveKnowledgeFile(`kb_${Date.now()}`, blob);

      const fileUrl = URL.createObjectURL(blob);
      setKnowledgeFiles(prev => [...prev, { name: file.name, type: file.type, size: file.size, url: fileUrl, storedAt: blob.storedAt }]);
      setMsgs(p => [...p, { role: "system", text: `📁 Fichier "${file.name}" stocké.`, time: tNow() }]);
      
      if (file.type.startsWith("image/")) {
        const base64 = arrayBufferToBase64(arrayBuffer);
        analyzeContent(`Analyse cette image ("${file.name}")`, base64, file.type);
      } else if (file.type === "text/plain" || file.name.endsWith(".md")) {
        const text = new TextDecoder().decode(arrayBuffer);
        analyzeContent(`Analyse ce document ("${file.name}") :\n\n${text.slice(0, 3000)}`, null, null);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const deleteFile = async (idx) => {
    if (!confirm("Supprimer ce fichier ?")) return;
    setKnowledgeFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Appel IA
  const analyzeContent = async (prompt, base64, mimeType) => {
    if (!apiKey) return alert("Configurez l'API.");
    setLoading(true);
    setMsgs(p => [...p, { role: "user", text: `📄 Analyse du fichier...`, time: tNow() }]);
    try {
      const imageData = base64 ? { image: { base64: base64, mimeType: mimeType } } : null;
      const ctx = buildAssistantContext(doctors, {}, {}, "", "");
      const sys = SYS_PROMPT + ctx;
      const r = await callLLM(prompt, apiKey, provider, model, sys, imageData);
      setMsgs(p => [...p.slice(0, -1), { role: "assistant", text: r, time: tNow() }]);
    } catch (e) {
      setMsgs(p => [...p.slice(0, -1), { role: "assistant", text: "Erreur: " + e.message, time: tNow() }]);
    }
    setLoading(false);
  };

  const send = async (overrideMsg) => {
    const m = (overrideMsg || inp).trim();
    if (!m || loading || !apiKey) return;
    setInp("");
    setMsgs(p => [...p, { role: "user", text: m, time: tNow() }]);
    setLoading(true);
    try {
      const ctx = buildAssistantContext(doctors, {}, {}, "", "");
      const sysExt = SYS_PROMPT + ctx;
      const r = await callLLM(m, apiKey, provider, model, sysExt);
      setMsgs(p => [...p, { role: "assistant", text: r, time: tNow() }]);
    } catch (e) {
      setMsgs(p => [...p, { role: "assistant", text: "Erreur: " + e.message, time: tNow() }]);
    }
    setLoading(false);
  };

  // --- Rendu ---
  if (!apiKey) return <div className="content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}><div className="card" style={{ maxWidth: 500, textAlign: "center" }}><div style={{ fontSize: 46, marginBottom: 12 }}>🔑</div><div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Configure l'IA</div><button className="btn btn-p" onClick={() => setPage("settings")}>⚙️ Paramètres</button></div></div>;

  return (
    <div className="content" style={{ padding: 0, display: "flex", flexDirection: "column", height: "calc(100vh - 52px)" }}>
      {/* Toolbar */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--bdr)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "rgba(10,15,30,.5)" }}>
        <button className={`vp-tab ${showKnowledge ? "active" : ""}`} onClick={() => setShowKnowledge(!showKnowledge)}>
          📁 Base de données ({knowledgeFiles.length})
        </button>
        <button className="btn btn-rose" style={{ fontSize: 11, padding: "5px 12px", marginLeft: "auto" }} onClick={clearChat}>🗑️ Nouvelle conv.</button>
      </div>

      {/* Zone Fichiers */}
      {showKnowledge && (
        <div style={{ padding: 12, background: "var(--navy2)", borderBottom: "1px solid var(--bdr)", maxHeight: 200, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>📚 Fichiers mémorisés</div>
            <label className="btn btn-p" style={{ fontSize: 10, padding: "4px 10px", cursor: "pointer" }}>
              ➕ Ajouter
              <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} accept="image/*,.pdf,.txt,.md,.csv" />
            </label>
          </div>
          {knowledgeFiles.length === 0 ?
            <div className="mini">Aucun fichier stocké.</div> :
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {knowledgeFiles.map((f, i) => (
                <div key={i} className="pill" style={{ cursor: "pointer" }}>
                  📄 {f.name}
                  <button style={{ marginLeft: 6, background: "none", border: "none", color: "var(--rose)", cursor: "pointer" }} onClick={() => deleteFile(i)}>✕</button>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ padding: "8px 16px 0", display: "flex", gap: 8, overflowX: "auto" }}>
        <button className="btn btn-g" style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => fileInputRef.current.click()}>📎 Analyser un fichier</button>
        {["Résume mes CR", "Email au Dr.", "Planification"].map((q, i) => <button key={i} className="btn btn-g" style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => send(q)} disabled={loading}>{q}</button>)}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {msgs.map((m, i) => <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}><div style={{ maxWidth: "75%", background: m.role === "user" ? (provider?.color || "#4285f4") : "var(--navy3)", color: m.role === "user" ? "#000" : "var(--t1)", padding: "8px 12px", borderRadius: 12, whiteSpace: "pre-wrap", fontSize: 13 }}>{m.text}<div style={{ fontSize: 10, opacity: .6, marginTop: 6, textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</div></div></div>)}
        {loading && <div className="pill"><span className="sp" /> Analyse...</div>}
        <div ref={bot} />
      </div>

      {/* Input Area */}
      <div style={{ padding: 10, borderTop: "1px solid var(--bdr)", background: "rgba(10,15,30,0.5)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ cursor: "pointer", padding: "6px", background: "var(--navy3)", borderRadius: 8, border: "1px solid var(--bdr)" }} title="Joindre un fichier">
            📎
            <input type="file" style={{ display: "none" }} onChange={handleFileUpload} accept="image/*,.pdf,.txt,.md,.csv" />
          </label>
          <textarea
            className="fi"
            value={inp}
            onChange={e => setInp(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Pose ta question..."
            style={{ flex: 1, resize: "none", minHeight: 44, maxHeight: 120 }}
          />
          <button className="btn btn-p" onClick={() => send()} disabled={(!inp.trim() && !loading) || loading} style={{ background: provider?.color || "var(--teal)", height: 44, width: 44 }}>{loading ? <span className="sp" /> : "↑"}</button>
        </div>
      </div>
    </div>
  );
}
/* ─── Toast Notification System ─── */
const ToastContext = createContext({ show: () => {} });

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} className={`fum-insight ${t.type === 'ok' ? 'good' : t.type === 'err' ? 'warn' : 'info'}`} style={{ animation: 'slideIn .3s ease', boxShadow: '0 4px 12px rgba(0,0,0,.3)', margin:0 }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
const useToast = () => useContext(ToastContext);
/* --- Auth Component --- */
function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert('✉️ Lien magique envoyé ! Vérifiez votre boîte mail.');
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content" style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh'}}>
      <div className="card" style={{maxWidth: 400, width: '100%'}}>
        <div className="vp-name" style={{textAlign:'center', marginBottom:20}}>🔐 Connexion Requise</div>
        <div className="mini" style={{textAlign:'center', marginBottom:20}}>
          Connectez-vous pour synchroniser vos données sur tous vos appareils.
        </div>
        <form onSubmit={handleLogin}>
          <div className="fg">
            <label className="fl">Email</label>
            <input 
              className="fi" 
              type="email" 
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn btn-p" style={{width:'100%'}} disabled={loading}>
            {loading ? <span className="sp"/> : '📧 Envoyer le lien magique'}
          </button>
        </form>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────
  APP
───────────────────────────────────────────────────────────── */
export default function App(){
  // --- States ---
  const enrich=d=>({...d,adoptionScore:d?.adoptionScore??null,mainObjection:d?.mainObjection??"",nextVisitGoal:d?.nextVisitGoal??"",priorityLevel:d?.priorityLevel??""});
  
  // 1. Charge les données Locales d'abord (pour l'affichage immédiat)
  const[doctors,setDoctors]=useState(()=>{
    const saved=loadJSON("medrep_doctors_v1",null);
    if(Array.isArray(saved)&&saved.length) return stableSortDocs(saved.map(enrich));
    return stableSortDocs(DOCS_FALLBACK.map(enrich)); // Fallback si rien
  });
  
  const[apiKey,setApiKey]=useState(()=>localStorage.getItem("medrep_apiKey")||"");
  const[provider,setProvider]=useState(()=>detectProvider(localStorage.getItem("medrep_apiKey")||""));
  const[model,setModel]=useState(()=>localStorage.getItem("medrep_model")||"");
  
  const [products, setProducts] = useState(() => loadJSON("medrep_products", ["Fumetil"]));
  const [activeProduct, setActiveProduct] = useState(() => loadJSON("medrep_active_product", "Fumetil"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // 2. Flag pour savoir si on a réussi à charger le cloud
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // --- SYNC: Load from Cloud au démarrage ---
  useEffect(() => {
    async function init() {
      const cloudData = await loadCloudData();
      if (cloudData) {
        // Si le cloud a des données, on les utilise (écrase le local)
        if (cloudData.doctors) setDoctors(stableSortDocs(cloudData.doctors.map(enrich)));
        if (cloudData.products) setProducts(cloudData.products);
        if (cloudData.activeProduct) setActiveProduct(cloudData.activeProduct);
        setCloudLoaded(true);
        console.log("✅ Données chargées depuis JSONBin");
      } else {
        console.log("ℹ️ Aucune donnée cloud trouvée (ou pas encore configuré).");
        setCloudLoaded(true);
      }
    }
    init();
  }, []);

  // --- SYNC: Save to LocalStorage (Instant) ---
  useEffect(()=>saveJSON("medrep_doctors_v1",doctors),[doctors]);
  useEffect(()=>saveJSON("medrep_products", products), [products]);
  useEffect(() => saveJSON("medrep_active_product", activeProduct), [activeProduct]);

  // --- SYNC: Save to Cloud (Debounce) ---
  useEffect(() => {
    // On ne sauvegarde sur le cloud QUE si on a réussi à charger une première fois
    // Cela évite d'écraser le cloud avec des données vides au démarrage
    if (!cloudLoaded) return;
    
    const timer = setTimeout(() => {
      console.log("☁️ Sauvegarde sur JSONBin...");
      saveCloudData({
        doctors,
        products,
        activeProduct,
        lastSaved: new Date().toISOString()
      });
    }, 3000); // Sauvegarde 3 secondes après la dernière modification

    return () => clearTimeout(timer);
  }, [doctors, products, activeProduct, cloudLoaded]);

  // --- Logique standard ---
  useEffect(()=>{setProvider(detectProvider(apiKey));},[apiKey]);

  const addProduct = (name) => {
    const cleanName = name.trim();
    if (!cleanName || products.includes(cleanName)) return;
    setProducts(prev => [...prev, cleanName]);
    setActiveProduct(cleanName);
  };

  const deleteProduct = (name) => {
    if (products.length <= 1) return alert("Impossible de supprimer le dernier produit.");
    if (!confirm(`Supprimer "${name}" ?`)) return;
    setProducts(prev => prev.filter(p => p !== name));
    setDoctors(prev => prev.filter(d => d.product !== name));
    if (activeProduct === name) setActiveProduct(products.find(p => p !== name));
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter(d => (d.product || "Fumetil") === activeProduct);
  }, [doctors, activeProduct]);

  const hasApi=!!apiKey.trim();
  const[page,setPage]=useState("dashboard");
  
  const NAV=[
    {sec:"Principal",items:[
      {id:"dashboard",ic:"⊞",lbl:"Dashboard"},
      {id:"commercial",ic:"📈",lbl:"Commercial"},
      {id:"fumetil",ic:"📊",lbl:activeProduct, badge:"CRM"},
      {id:"assistant",ic:provider?.icon||"✦",lbl:"Coach IA",needsApi:true}
    ]},
    {sec:"Terrain",items:[
      {id:"planning",ic:"📅",lbl:"Planning"},
      {id:"reports",ic:"📝",lbl:"Comptes-rendus"},
      {id:"doctors",ic:"👨‍⚕️",lbl:"Médecins"}
    ]},
    {sec:"Compte",items:[
      {id:"settings",ic:"⚙️",lbl:"Paramètres"}
    ]}
  ];
  
  const TITLES={
    dashboard:"Vue d'ensemble", commercial:"Commercial", fumetil:`Dashboard ${activeProduct}`,
    assistant:`Coach IA`, planning:"Planning", reports:"Comptes-rendus", doctors:"Médecins", settings:"Paramètres"
  };
  
  const render=()=>{
    const m=model||provider?.defaultModel;
    switch(page){
      case"dashboard":return <Dashboard doctors={filteredDoctors} setPage={setPage} hasApi={hasApi} provider={provider} activeProduct={activeProduct}/>;
      case"commercial":return <CommercialDashboard doctors={filteredDoctors} setPage={setPage} apiKey={apiKey} provider={provider} model={m} activeProduct={activeProduct}/>;
      case"fumetil":return <FumetilDashboard doctors={filteredDoctors} setPage={setPage} activeProduct={activeProduct}/>; 
      case"assistant":return <Assistant apiKey={apiKey} provider={provider} model={m} setPage={setPage} doctors={filteredDoctors}/>;
      case"planning":return <PlanningPage doctors={filteredDoctors} setDoctors={setDoctors} apiKey={apiKey} provider={provider} model={m}/>;
      case"reports":return <ReportsPage doctors={filteredDoctors} setDoctors={setDoctors} apiKey={apiKey} provider={provider} model={m} setPage={setPage}/>;
      case"doctors":return <DoctorsPage doctors={filteredDoctors} setDoctors={setDoctors} activeProduct={activeProduct} products={products}/>;
      case"settings":return <SettingsPage apiKey={apiKey} setApiKey={setApiKey} model={m} setModel={setModel} provider={provider} setProvider={setProvider} products={products} addProduct={addProduct} deleteProduct={deleteProduct} activeProduct={activeProduct} setActiveProduct={setActiveProduct}/>;
      default:return null;
    }
  };
  
  useEffect(() => { setMobileMenuOpen(false); }, [page]);

  return(
    <ToastProvider>
      <GS/>
      <div className="root">
        <div className="bg"/>
        <aside className={`sb ${mobileMenuOpen ? "open" : ""}`}>
          <div className="sb-logo">
            <div className="logo-ic">🧠</div>
            <div><div className="logo-t">MedRep AI</div><div className="logo-s">Cloud</div></div>
            {mobileMenuOpen && <button className="btn btn-g" style={{marginLeft:"auto"}} onClick={()=>setMobileMenuOpen(false)}>✕</button>}
          </div>
      
          <div style={{padding:"10px 10px 0"}}>
            <label className="fl">Produit</label>
            <select className="fs" value={activeProduct} onChange={e => setActiveProduct(e.target.value)}>
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <nav className="sb-nav">
            {NAV.map(s => (
              <div key={s.sec} className="nav-sec">
                <div className="nav-lbl">{s.sec}</div>
                {s.items.map(it => (
                  <div key={it.id} className={`nav-it${page===it.id?" on":""}`} onClick={()=>setPage(it.id)}>
                    <span style={{fontSize:14,width:20,textAlign:"center"}}>{it.ic}</span> {it.lbl}
                    {it.badge && <span className="nav-badge ok">{it.badge}</span>}
                    {it.needsApi && (hasApi ? <span className="nav-badge ok">ON</span> : <span className="nav-badge">OFF</span>)}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        
        {mobileMenuOpen && <div className="ov" style={{zIndex:90, background:'rgba(0,0,0,0.5)'}} onClick={()=>setMobileMenuOpen(false)}></div>}

        <main className="main">
          <div className="topbar">
            <button className="hamburger" style={{display:'none'}} onClick={()=>setMobileMenuOpen(true)}>☰</button>
            <div className="tb-title">{TITLES[page]}</div>
            {!hasApi && <button className="btn btn-blue" style={{fontSize:11}} onClick={()=>setPage("settings")}>🔑 API</button>}
            {hasApi && <button className="btn btn-g" style={{fontSize:11}} onClick={()=>setPage("assistant")}>Coach</button>}
          </div>
          {render()}
        </main>
      </div>
    </ToastProvider>
  );
}
