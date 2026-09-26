import { t, uiLanguage } from "./i18n";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Plural category of `n` in the UI language, for the day forms. The i18n API
 *  has no plural support of its own, so the day message is split into one key
 *  per CLDR category (`one`/`few`/`many`/`other`) and the category is chosen
 *  here; a locale that has no form for a category falls back to `other`, which
 *  is why every locale must define `ageDaysOther`. */
function daysKey(n: number): "ageDaysOne" | "ageDaysFew" | "ageDaysMany" | "ageDaysOther" {
  let category = "other";
  try {
    category = new Intl.PluralRules(uiLanguage()).select(n);
  } catch {
    // An unknown UI language tag: English rules are as good a guess as any.
    category = new Intl.PluralRules("en").select(n);
  }
  if (category === "one") return "ageDaysOne";
  if (category === "few") return "ageDaysFew";
  if (category === "many") return "ageDaysMany";
  return "ageDaysOther";
}

/** Human-readable age for the popup's "updated …" line, e.g. "just now",
 *  "12 min ago", "3 h ago", "2 days ago". Coarse on purpose: the catalog has a
 *  12 h TTL, so minute-level precision past the first hour is noise. Negative
 *  ages (clock skew) read as "just now" rather than a nonsensical future. */
export function formatAge(ageMs: number): string {
  if (ageMs < MINUTE) return t("ageJustNow");
  if (ageMs < HOUR) return t("ageMinutes", String(Math.floor(ageMs / MINUTE)));
  if (ageMs < DAY) return t("ageHours", String(Math.floor(ageMs / HOUR)));
  const days = Math.floor(ageMs / DAY);
  return t(daysKey(days), String(days));
}
