import { CLUSTER, groupWorkdaysByWeek, isWedThu, listWorkdays } from "../../lib/dates.js";
import { getFrequencyDays } from "../../lib/frequency.js";
import { potRank } from "../../lib/normalize.js";

export function pickEvenly(days, target) {
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

export function generatePlanning({ doctors, year, monthIndex, perDay, directives, allReports }) {
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
    // week = 0 → la règle s'applique à toutes les semaines du mois
    const weekDays = dir.week ? (weeks[dir.week - 1] || []) : workdays;
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
