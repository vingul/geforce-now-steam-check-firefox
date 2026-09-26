import en from "../_locales/en/messages.json";

/** User-facing strings, via the WebExtension i18n API — `_locales/<lang>/messages.json`,
 *  picked by Firefox's UI language, English as `default_locale`.
 *
 *  `t()` falls back to the bundled English table whenever the API is unavailable
 *  or has no message for the key: unit tests run in jsdom with no `browser`
 *  global, and a locale that lags behind English would otherwise render an
 *  empty label. Keys are typed against the English table, so a typo is a compile
 *  error rather than a blank string on a Steam page. */
export type MessageKey = keyof typeof en;

function hasI18n(): boolean {
  return typeof browser !== "undefined" && typeof browser.i18n?.getMessage === "function";
}

/** Substitute the named placeholders of an English fallback message from
 *  `subs`, the way `getMessage` does: each placeholder's `content` names the
 *  substitution slot (`$1`, `$2`…). */
function substitute(key: MessageKey, subs: readonly string[]): string {
  const entry = en[key] as { message: string; placeholders?: Record<string, { content: string }> };
  return entry.message.replace(/\$([A-Z]+)\$/g, (whole, name: string) => {
    const content = entry.placeholders?.[name.toLowerCase()]?.content;
    if (content === undefined) return whole;
    return subs[Number(content.slice(1)) - 1] ?? "";
  });
}

export function t(key: MessageKey, ...subs: string[]): string {
  if (hasI18n()) {
    const localized = browser.i18n.getMessage(key, subs);
    if (localized !== "") return localized;
  }
  return substitute(key, subs);
}

/** BCP 47 tag of the UI language the messages were picked for — what
 *  `Intl.PluralRules` needs to choose a plural form that matches them. */
export function uiLanguage(): string {
  if (typeof browser !== "undefined" && typeof browser.i18n?.getUILanguage === "function") {
    return browser.i18n.getUILanguage();
  }
  return "en";
}

/** Localize static markup: every element with `data-i18n="<key>"` gets that
 *  message as its text, and `data-i18n-title="<key>"` sets its title. Used by
 *  the popup and onboarding pages, whose HTML ships in English. */
export function localizeDocument(doc: Document): void {
  for (const el of doc.querySelectorAll<HTMLElement>("[data-i18n]")) {
    el.textContent = t(el.dataset["i18n"] as MessageKey);
  }
  for (const el of doc.querySelectorAll<HTMLElement>("[data-i18n-title]")) {
    el.title = t(el.dataset["i18nTitle"] as MessageKey);
  }
  const title = doc.querySelector<HTMLElement>("title[data-i18n]");
  if (title !== null) doc.title = title.textContent ?? doc.title;
}
