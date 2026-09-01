export const GS = () => (
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

    /* Bouton menu mobile : masqué par défaut, affiché sous 860px */
    .hamburger { display: none; }

    /* --- IMPRESSION / EXPORT PDF --- */
    @media print {
      @page { size: A4; margin: 12mm; }
      body, .root, .main, .content { background: #fff !important; color: #111 !important; }
      .bg, .sb, .topbar, .no-print, .hamburger, .ov { display: none !important; }
      .main { width: 100% !important; margin: 0 !important; }
      .card, .kpi, .temp-card { background: #fff !important; border: 1px solid #ccc !important;
        box-shadow: none !important; break-inside: avoid; page-break-inside: avoid; }
      .card-t, .kpi-val, .kpi-lbl, .mini, td, th { color: #111 !important; }
      .g2, .grid2, .fum-3col, .cd-section, .cd-section-2 { display: block !important; }
      a[href]:after { content: ""; }
    }

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
