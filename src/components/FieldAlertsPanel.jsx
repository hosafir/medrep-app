import { useEffect, useMemo, useState } from "react";
import { FREQ_MAP, getFrequencyDays } from "../lib/frequency.js";

export function FieldAlertsPanel({doctors, reports, setPage}){
  // `now` est calculé dans un effet (pas pendant le rendu) et rafraîchi chaque minute
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const alerts = useMemo(() => {
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

  }, [doctors, reports, now]);

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
