import { MFR } from "./dates.js";
import { parseCSVSmart } from "./importDoctors.js";
import { findColumnIndex, normalizeKey, normalizeText, valueAt } from "./normalize.js";

/* ─────────────────────────────────────────────────────────────
   VENTES & OBJECTIFS — logique pure (testée dans __tests__/sales.test.js)

   Vente  : { id, period:"YYYY-MM", accountId, accountName, product, channel, units, revenue }
   Objectif: { id, scope:"global"|"account"|"product", refId, metric:"revenue"|"units",
               period:"YYYY-MM"|"YYYY", value }
───────────────────────────────────────────────────────────── */

export const CHANNELS = [
  { id: "sell_in", label: "Sell-in (ventes au client)", ic: "📦" },
  { id: "sell_out", label: "Sell-out (sorties patient)", ic: "🛒" },
];

export const METRICS = [
  { id: "revenue", label: "Chiffre d'affaires", unit: "MAD" },
  { id: "units", label: "Unités / boîtes", unit: "u" },
];

export const OBJECTIVE_SCOPES = [
  { id: "global", label: "Global (tout le portefeuille)" },
  { id: "account", label: "Un compte" },
  { id: "product", label: "Un produit" },
];

/* ─── Périodes ─── */

const MONTH_WORDS = {
  jan: 1, fev: 2, feb: 2, mar: 3, avr: 4, apr: 4, mai: 5, may: 5, jui: 6, jun: 6,
  jul: 7, aou: 8, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Convertit une valeur hétérogène en période "YYYY-MM" (ou null) */
export function parsePeriod(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }
  const raw = normalizeText(value);

  let m = raw.match(/^(\d{4})[-/](\d{1,2})$/);                       // 2026-08
  if (m) return fmtPeriod(m[1], m[2]);

  m = raw.match(/^(\d{1,2})[-/](\d{4})$/);                            // 08/2026
  if (m) return fmtPeriod(m[2], m[1]);

  m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);               // 05/08/2026
  if (m) return fmtPeriod(m[3], m[2]);

  m = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);                // 2026-08-05
  if (m) return fmtPeriod(m[1], m[2]);

  m = normalizeKey(raw).match(/^([a-z]{3,})(\d{4})$/);                // aout2026, sept 2026
  if (m && MONTH_WORDS[m[1].slice(0, 3)]) return fmtPeriod(m[2], MONTH_WORDS[m[1].slice(0, 3)]);

  return null;
}

function fmtPeriod(year, month) {
  const mi = parseInt(month, 10);
  if (!mi || mi < 1 || mi > 12) return null;
  return `${year}-${String(mi).padStart(2, "0")}`;
}

/** Libellé lisible : "2026-08" → "Aoû 2026" */
export function periodLabel(period) {
  if (!period) return "—";
  const [y, m] = period.split("-");
  if (!m) return y;
  return `${MFR[parseInt(m, 10) - 1]} ${y}`;
}

/** N derniers mois jusqu'à `until` inclus (par défaut : aujourd'hui) */
export function lastPeriods(n, until = new Date()) {
  const out = [];
  const d = new Date(until.getFullYear(), until.getMonth(), 1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/** Même mois de l'année précédente */
export function samePeriodLastYear(period) {
  const [y, m] = period.split("-");
  return `${parseInt(y, 10) - 1}-${m}`;
}

/* ─── Nombres ─── */

/** Accepte "1 234,50", "1,234.50", "12 000 MAD" → nombre */
export function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let s = normalizeText(value).replace(/[^\d,.-]/g, "");
  if (!s) return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.split(",").length > 2 ? s.replace(/,/g, "") : s.replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function formatMAD(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} MAD`;
}

/* ─── Import ─── */

const SALES_ALIASES = {
  period: ["periode", "période", "mois", "date", "month", "periode de vente"],
  account: ["compte", "client", "etablissement", "établissement", "pharmacie", "officine", "clinique", "hopital", "account"],
  product: ["produit", "product", "reference", "référence", "marque", "sku"],
  units: ["unites", "unités", "quantite", "quantité", "qte", "qty", "boites", "boîtes", "units", "volume"],
  revenue: ["ca", "chiffre", "chiffre d'affaires", "montant", "valeur", "revenue", "total", "prix"],
  channel: ["canal", "channel", "type", "flux"],
};

export function buildSalesHeaderMap(headers) {
  return {
    period: findColumnIndex(headers, SALES_ALIASES.period),
    account: findColumnIndex(headers, SALES_ALIASES.account),
    product: findColumnIndex(headers, SALES_ALIASES.product),
    units: findColumnIndex(headers, SALES_ALIASES.units),
    revenue: findColumnIndex(headers, SALES_ALIASES.revenue),
    channel: findColumnIndex(headers, SALES_ALIASES.channel),
  };
}

export function normalizeChannel(value) {
  const k = normalizeKey(value);
  if (!k) return "sell_in";
  if (k.includes("out") || k.includes("sortie") || k.includes("patient")) return "sell_out";
  return "sell_in";
}

export function normalizeSaleRow(row, hm, index, fallbackProduct = "") {
  const period = parsePeriod(valueAt(row, hm.period));
  if (!period) return null;
  const revenue = parseNumber(valueAt(row, hm.revenue));
  const units = parseNumber(valueAt(row, hm.units));
  if (!revenue && !units) return null;
  return {
    id: `sale_${period}_${index}_${Math.abs(index * 2654435761 % 100000)}`,
    period,
    accountId: null,
    accountName: normalizeText(valueAt(row, hm.account)),
    product: normalizeText(valueAt(row, hm.product)) || fallbackProduct,
    channel: normalizeChannel(valueAt(row, hm.channel)),
    units,
    revenue,
  };
}

/** Rattache les ventes aux comptes existants par nom (normalisé) */
export function linkSalesToAccounts(sales, accounts) {
  const byKey = new Map(accounts.map(a => [normalizeKey(a.name), a.id]));
  return sales.map(s => (s.accountId ? s : { ...s, accountId: byKey.get(normalizeKey(s.accountName)) || null }));
}

export async function importSalesFromFile(file, { accounts = [], fallbackProduct = "" } = {}) {
  const name = file.name.toLowerCase();
  let rows;

  if (name.endsWith(".csv")) {
    rows = parseCSVSmart(await file.text());
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
  } else {
    throw new Error("Format non supporté (utilise .xlsx, .xls ou .csv).");
  }

  if (!rows || rows.length < 2) throw new Error("Fichier vide.");
  const hm = buildSalesHeaderMap(rows[0]);
  if (hm.period < 0) throw new Error("Colonne période/mois introuvable.");
  if (hm.revenue < 0 && hm.units < 0) throw new Error("Colonne CA ou quantité introuvable.");

  const out = rows.slice(1)
    .map((r, i) => normalizeSaleRow(r, hm, i + 1, fallbackProduct))
    .filter(Boolean);
  if (!out.length) throw new Error("Aucune ligne de vente exploitable.");
  return linkSalesToAccounts(out, accounts);
}

/* ─── Agrégats ─── */

const val = (s, metric) => (metric === "units" ? s.units : s.revenue) || 0;

export function filterSales(sales, { period, periods, accountId, product, channel } = {}) {
  return sales.filter(s => {
    if (period && s.period !== period) return false;
    if (periods && !periods.includes(s.period)) return false;
    if (accountId && s.accountId !== accountId) return false;
    if (product && s.product !== product) return false;
    if (channel && s.channel !== channel) return false;
    return true;
  });
}

export function sumSales(sales, metric = "revenue") {
  return sales.reduce((s, x) => s + val(x, metric), 0);
}

/** Série temporelle : [{ period, label, value }] */
export function seriesByPeriod(sales, periods, metric = "revenue") {
  return periods.map(p => ({
    period: p,
    label: periodLabel(p),
    value: sumSales(filterSales(sales, { period: p }), metric),
  }));
}

/** Regroupement générique : "accountId" | "product" | "channel" */
export function groupBy(sales, key, metric = "revenue") {
  const map = new Map();
  for (const s of sales) {
    const k = s[key] || "—";
    map.set(k, (map.get(k) || 0) + val(s, metric));
  }
  return [...map.entries()]
    .map(([k, value]) => ({ key: k, value }))
    .sort((a, b) => b.value - a.value);
}

/** Croissance en % entre deux valeurs (null si base nulle) */
export function growth(current, previous) {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/* ─── Objectifs ─── */

export function createObjective(partial = {}) {
  return {
    id: partial.id || `obj_${partial.scope || "global"}_${partial.period || ""}_${partial.refId || "all"}`,
    scope: partial.scope || "global",
    refId: partial.refId || null,
    metric: partial.metric === "units" ? "units" : "revenue",
    period: partial.period || "",
    value: parseNumber(partial.value),
  };
}

/** L'objectif couvre-t-il cette période ? (annuel "2026" couvre "2026-xx") */
export function objectiveCoversPeriod(objective, period) {
  if (!objective.period) return false;
  if (objective.period.length === 4) return period.startsWith(objective.period);
  return objective.period === period;
}

/** Ventes concernées par un objectif sur une période donnée */
export function salesForObjective(objective, sales, periods) {
  return sales.filter(s => {
    if (periods && !periods.includes(s.period)) return false;
    if (!objectiveCoversPeriod(objective, s.period)) return false;
    if (objective.scope === "account" && s.accountId !== objective.refId) return false;
    if (objective.scope === "product" && s.product !== objective.refId) return false;
    return true;
  });
}

/**
 * Avancement d'un objectif.
 * `elapsedRatio` (0-1) permet de comparer au rythme attendu (pacing).
 */
export function objectiveProgress(objective, sales, { elapsedRatio = 1 } = {}) {
  const concerned = salesForObjective(objective, sales);
  const actual = sumSales(concerned, objective.metric);
  const target = objective.value || 0;
  const rate = target ? Math.round((actual / target) * 1000) / 10 : null;
  const expected = target * Math.min(Math.max(elapsedRatio, 0), 1);
  const projection = elapsedRatio > 0 ? actual / Math.min(Math.max(elapsedRatio, 0.01), 1) : 0;
  return {
    actual,
    target,
    rate,
    gap: actual - target,
    expected,
    onTrack: target ? actual >= expected : null,
    projection: Math.round(projection),
    projectedRate: target ? Math.round((projection / target) * 1000) / 10 : null,
  };
}

/** Part de l'année/du mois déjà écoulée, pour le pacing */
export function elapsedRatioForPeriod(period, now = new Date()) {
  if (!period) return 1;
  if (period.length === 4) {
    const year = parseInt(period, 10);
    if (now.getFullYear() > year) return 1;
    if (now.getFullYear() < year) return 0;
    const start = new Date(year, 0, 1), end = new Date(year + 1, 0, 1);
    return (now - start) / (end - start);
  }
  const [y, m] = period.split("-").map(Number);
  const start = new Date(y, m - 1, 1), end = new Date(y, m, 1);
  if (now >= end) return 1;
  if (now < start) return 0;
  return (now - start) / (end - start);
}

/** Synthèse d'un compte : CA période, évolution, poids dans le total */
export function accountSalesSummary(accountId, sales, periods, metric = "revenue") {
  const current = filterSales(sales, { accountId, periods });
  const value = sumSales(current, metric);
  const prevPeriods = periods.map(samePeriodLastYear);
  const previous = sumSales(filterSales(sales, { accountId, periods: prevPeriods }), metric);
  const total = sumSales(filterSales(sales, { periods }), metric);
  return {
    value,
    previous,
    growth: growth(value, previous),
    share: total ? Math.round((value / total) * 1000) / 10 : 0,
    lines: current.length,
  };
}
