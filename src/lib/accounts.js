import { normalizeCity, normalizeKey, normalizeText } from "./normalize.js";

/* ─────────────────────────────────────────────────────────────
   Modèle KAM : COMPTES (établissements) et CONTACTS (personnes)
   Logique pure, sans React — testée dans __tests__/accounts.test.js
───────────────────────────────────────────────────────────── */

export const ACCOUNT_TYPES = [
  { id: "hopital", label: "Hôpital public", ic: "🏥" },
  { id: "clinique", label: "Clinique privée", ic: "🏨" },
  { id: "cabinet", label: "Cabinet de groupe", ic: "🩺" },
  { id: "pharmacie", label: "Pharmacie", ic: "💊" },
  { id: "groupement", label: "Groupement / centrale", ic: "🔗" },
  { id: "labo", label: "Laboratoire d'analyses", ic: "🧪" },
];

export const CONTACT_ROLES = [
  { id: "prescripteur", label: "Prescripteur", ic: "✍️" },
  { id: "chef_service", label: "Chef de service", ic: "👑" },
  { id: "pharmacien", label: "Pharmacien", ic: "💊" },
  { id: "acheteur", label: "Acheteur / Approvisionnement", ic: "🛒" },
  { id: "direction", label: "Direction / DAF", ic: "🏛️" },
  { id: "kol", label: "Leader d'opinion (KOL)", ic: "🎤" },
  { id: "autre", label: "Autre", ic: "👤" },
];

/** Niveaux de compte (segmentation KAM) */
export const ACCOUNT_TIERS = ["A", "B", "C"];

export const accountTypeInfo = (type) =>
  ACCOUNT_TYPES.find(t => t.id === type) || { id: "autre", label: "Autre", ic: "🏢" };

export const contactRoleInfo = (role) =>
  CONTACT_ROLES.find(r => r.id === role) || CONTACT_ROLES[CONTACT_ROLES.length - 1];

/** Identifiant stable dérivé du nom + ville (évite les doublons à l'import) */
export function accountKey(name, city) {
  return `${normalizeKey(name)}__${normalizeKey(city)}`;
}

export function createAccount(partial = {}) {
  return {
    id: partial.id || `acc_${accountKey(partial.name || "compte", partial.city || "")}`,
    name: normalizeText(partial.name) || "Nouveau compte",
    type: partial.type || "clinique",
    city: normalizeCity(partial.city || ""),
    address: normalizeText(partial.address || ""),
    tier: ACCOUNT_TIERS.includes(partial.tier) ? partial.tier : "B",
    parentId: partial.parentId || null,
    phone: partial.phone || "",
    email: partial.email || "",
    objective: partial.objective || "",
    notes: partial.notes || "",
    createdAt: partial.createdAt || new Date().toISOString(),
  };
}

/** Un secteur ressemble-t-il à un établissement (vs un simple quartier) ? */
const ESTABLISHMENT_RE = /(clinique|polyclinique|h[oô]pital|chu|chr|centre|center|institut|pharmacie|laboratoire|cabinet)/i;

export function looksLikeEstablishment(sector) {
  return ESTABLISHMENT_RE.test(sector || "");
}

/** Devine le type de compte à partir de son libellé */
export function guessAccountType(name) {
  const n = normalizeKey(name);
  if (/polyclinique|clinique/.test(n)) return "clinique";
  if (/hopital|chu|chr/.test(n)) return "hopital";
  if (/pharmacie/.test(n)) return "pharmacie";
  if (/laboratoire|labo/.test(n)) return "labo";
  if (/groupement|centrale/.test(n)) return "groupement";
  return "cabinet";
}

/**
 * Génère les comptes à partir du portefeuille existant :
 * chaque secteur qui ressemble à un établissement devient un compte.
 * @returns {{accounts: Array, links: Object}} links = { [doctorId]: accountId }
 */
export function deriveAccountsFromContacts(contacts, existingAccounts = []) {
  const byKey = new Map(existingAccounts.map(a => [accountKey(a.name, a.city), a]));
  const accounts = [...existingAccounts];
  const links = {};

  for (const c of contacts) {
    if (!looksLikeEstablishment(c.sector)) continue;
    const name = normalizeText(c.sector);
    const city = normalizeCity(c.city);
    const key = accountKey(name, city);
    let acc = byKey.get(key);
    if (!acc) {
      acc = createAccount({ name, city, type: guessAccountType(name), tier: c.potential || "B" });
      byKey.set(key, acc);
      accounts.push(acc);
    }
    links[c.id] = acc.id;
  }
  return { accounts, links };
}

/** Contacts rattachés à un compte */
export function contactsOfAccount(accountId, contacts) {
  return contacts.filter(c => c.accountId === accountId);
}

/** Quadrant de la matrice influence (1-5) × soutien (1-5) */
export function stakeholderQuadrant(contact) {
  const inf = Number(contact?.influence) || 0;
  const sup = Number(contact?.support) || 0;
  if (!inf || !sup) return { id: "unknown", label: "Non qualifié", color: "var(--t3)", advice: "Qualifier influence et soutien." };
  const high = v => v >= 4;
  const low = v => v <= 2;
  if (high(inf) && high(sup)) return { id: "champion", label: "Champion", color: "var(--teal)", advice: "À mobiliser : témoignages, staff, parrainage." };
  if (high(inf) && low(sup)) return { id: "bloqueur", label: "Opposant clé", color: "var(--rose)", advice: "Priorité absolue : comprendre le frein, apporter la preuve." };
  if (low(inf) && high(sup)) return { id: "soutien", label: "Soutien", color: "var(--blue)", advice: "Relais utile : l'aider à porter le message vers les décideurs." };
  if (low(inf) && low(sup)) return { id: "peripherique", label: "Périphérique", color: "var(--t3)", advice: "Effort limité, entretien basse fréquence." };
  return { id: "aconvaincre", label: "À convaincre", color: "var(--amber)", advice: "Zone médiane : cibler les objections concrètes." };
}

/** Agrégats d'un compte : couverture, adoption, activité */
export function accountStats(account, contacts, reports = {}, now = Date.now()) {
  const list = contactsOfAccount(account.id, contacts);
  const scored = list.filter(c => c.adoptionScore != null);
  const avgAdoption = scored.length
    ? Math.round(scored.reduce((s, c) => s + c.adoptionScore, 0) / scored.length)
    : null;

  let lastVisit = null;
  let visits90 = 0;
  let totalVisits = 0;
  let covered = 0;

  for (const c of list) {
    const rs = reports[c.id] || [];
    totalVisits += rs.length;
    if (rs.length) covered++;
    for (const r of rs) {
      const t = new Date(r.createdAt).getTime();
      if (Number.isNaN(t)) continue;
      if (!lastVisit || t > lastVisit) lastVisit = t;
      if ((now - t) / 86400000 <= 90) visits90++;
    }
  }

  const champions = list.filter(c => stakeholderQuadrant(c).id === "champion").length;
  const blockers = list.filter(c => stakeholderQuadrant(c).id === "bloqueur").length;

  return {
    contacts: list.length,
    covered,
    coverageRate: list.length ? Math.round((covered / list.length) * 100) : 0,
    avgAdoption,
    totalVisits,
    visits90,
    lastVisit,
    daysSinceLastVisit: lastVisit ? Math.floor((now - lastVisit) / 86400000) : null,
    champions,
    blockers,
  };
}

/** Score d'attractivité d'un compte pour prioriser les efforts KAM (0-100) */
export function accountPriorityScore(account, contacts, reports = {}, now = Date.now()) {
  const s = accountStats(account, contacts, reports, now);
  const tier = account.tier === "A" ? 35 : account.tier === "B" ? 22 : 10;
  const size = Math.min(s.contacts * 3, 18);
  const adoption = s.avgAdoption != null ? Math.round(s.avgAdoption * 0.2) : 6;
  const champion = Math.min(s.champions * 6, 12);
  const blocker = -Math.min(s.blockers * 6, 12);
  const staleness = s.daysSinceLastVisit == null ? 8 : s.daysSinceLastVisit > 60 ? 10 : 0;
  const raw = tier + size + adoption + champion + blocker + staleness;
  return Math.max(0, Math.min(100, raw));
}

/** Alertes actionnables au niveau compte */
export function accountAlerts(accounts, contacts, reports = {}, now = Date.now()) {
  const out = [];
  for (const a of accounts) {
    const s = accountStats(a, contacts, reports, now);
    if (s.contacts === 0) {
      out.push({ accountId: a.id, type: "info", ic: "👥", msg: "Aucun contact rattaché" });
      continue;
    }
    if (s.blockers > 0) out.push({ accountId: a.id, type: "warn", ic: "⛔", msg: `${s.blockers} opposant(s) clé(s) à traiter` });
    if (s.coverageRate < 50) out.push({ accountId: a.id, type: "warn", ic: "🎯", msg: `Couverture ${s.coverageRate}% des contacts` });
    if (s.daysSinceLastVisit != null && s.daysSinceLastVisit > 60 && a.tier === "A") {
      out.push({ accountId: a.id, type: "risk", ic: "⚠️", msg: `Compte A sans visite depuis ${s.daysSinceLastVisit} j` });
    }
    if (s.champions === 0 && a.tier === "A") out.push({ accountId: a.id, type: "info", ic: "🏆", msg: "Aucun champion identifié" });
  }
  return out;
}
