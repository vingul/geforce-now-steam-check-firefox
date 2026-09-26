// @vitest-environment jsdom
import { afterEach, describe, expect, test } from "vitest";
import de from "../src/_locales/de/messages.json";
import en from "../src/_locales/en/messages.json";
import es from "../src/_locales/es/messages.json";
import fr from "../src/_locales/fr/messages.json";
import it from "../src/_locales/it/messages.json";
import ja from "../src/_locales/ja/messages.json";
import pl from "../src/_locales/pl/messages.json";
import pt_BR from "../src/_locales/pt_BR/messages.json";
import ru from "../src/_locales/ru/messages.json";
import uk from "../src/_locales/uk/messages.json";
import zh_CN from "../src/_locales/zh_CN/messages.json";
import manifest from "../src/manifest.json";
import { localizeDocument, t } from "../src/shared/i18n";
import { formatAge } from "../src/shared/format-age";

type Messages = Record<string, { message: string; placeholders?: Record<string, { content: string }> }>;

// Every shipped locale, imported statically: the browser tsconfig has no node
// types, and listing them here also makes adding a locale a visible test change.
const tables: Record<string, Messages> = { de, en, es, fr, it, ja, pl, pt_BR, ru, uk, zh_CN };
const locales = Object.keys(tables);
const load = (locale: string): Messages => tables[locale]!;
const placeholdersOf = (message: string): string[] =>
  [...message.matchAll(/\$([A-Z]+)\$/g)].map((m) => m[1]!).sort();

describe("_locales", () => {
  test("English is the default locale and ships Ukrainian", () => {
    expect(manifest.default_locale).toBe("en");
    expect(locales).toContain("en");
    expect(locales).toContain("uk");
  });

  for (const locale of locales) {
  test(`${locale} has exactly the English keys, with matching placeholders`, () => {
    const messages = load(locale);
    expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
    for (const [key, entry] of Object.entries(messages)) {
      const enEntry = (en as Messages)[key]!;
      expect(entry.message, `${locale}/${key} is empty`).not.toBe("");
      expect(placeholdersOf(entry.message), `${locale}/${key} placeholders`).toEqual(
        placeholdersOf(enEntry.message),
      );
      for (const name of placeholdersOf(entry.message)) {
        expect(entry.placeholders?.[name.toLowerCase()]?.content, `${locale}/${key} $${name}$`).toBe(
          enEntry.placeholders?.[name.toLowerCase()]?.content,
        );
      }
    }
  });
  }

  test("the manifest's name, description and action title are message references", () => {
    expect(manifest.name).toBe("__MSG_extName__");
    expect(manifest.description).toBe("__MSG_extDescription__");
    expect(manifest.action.default_title).toBe("__MSG_extName__");
  });
});

/** Stand in for `browser.i18n` with one locale's table, the way Firefox would. */
function withLocale(locale: string, uiLanguage: string): void {
  const messages = load(locale);
  (globalThis as { browser?: unknown }).browser = {
    i18n: {
      getMessage(key: string, subs: string | string[] = []): string {
        const entry = messages[key];
        if (entry === undefined) return "";
        const list = Array.isArray(subs) ? subs : [subs];
        return entry.message.replace(/\$([A-Z]+)\$/g, (whole, name: string) => {
          const content = entry.placeholders?.[name.toLowerCase()]?.content;
          return content === undefined ? whole : (list[Number(content.slice(1)) - 1] ?? "");
        });
      },
      getUILanguage: () => uiLanguage,
    },
  };
}

afterEach(() => {
  delete (globalThis as { browser?: unknown }).browser;
});

describe("t()", () => {
  test("without the i18n API, falls back to English with substitutions", () => {
    expect(t("bannerSupported")).toBe("Playable on GeForce NOW");
    expect(t("popupCatalogLine", "2,000", "3 h ago")).toBe("Catalog: 2,000 Steam games · updated 3 h ago");
    expect(t("ageMinutes", "12")).toBe("12 min ago");
  });

  test("with the i18n API, uses the locale's message", () => {
    withLocale("uk", "uk");
    expect(t("bannerSupported")).toBe("Доступно на GeForce NOW");
    expect(t("launchPlayOn")).toBe("Грати на");
    expect(t("popupCatalogLine", "2 000", "3 год тому")).toBe("Каталог: 2 000 ігор Steam · оновлено 3 год тому");
  });

  test("a key the locale lacks falls back to English rather than an empty label", () => {
    withLocale("uk", "uk");
    (globalThis as unknown as { browser: { i18n: { getMessage: () => string } } }).browser.i18n.getMessage = () => "";
    expect(t("pillNotSupported")).toBe("Not available");
  });
});

describe("formatAge plurals", () => {
  test("Ukrainian day forms follow CLDR one/few/many", () => {
    withLocale("uk", "uk");
    const DAY = 86_400_000;
    expect(formatAge(DAY)).toBe("1 день тому");
    expect(formatAge(2 * DAY)).toBe("2 дні тому");
    expect(formatAge(5 * DAY)).toBe("5 днів тому");
    expect(formatAge(21 * DAY)).toBe("21 день тому");
    expect(formatAge(22 * DAY)).toBe("22 дні тому");
    expect(formatAge(25 * DAY)).toBe("25 днів тому");
    expect(formatAge(3 * 3_600_000)).toBe("3 год тому");
    expect(formatAge(0)).toBe("щойно");
  });

  test("Polish day forms", () => {
    withLocale("pl", "pl");
    const DAY = 86_400_000;
    expect(formatAge(DAY)).toBe("1 dzień temu");
    expect(formatAge(3 * DAY)).toBe("3 dni temu");
    expect(formatAge(12 * DAY)).toBe("12 dni temu");
  });
});

describe("localizeDocument", () => {
  test("fills data-i18n text and titles, and the document title", () => {
    withLocale("de", "de");
    document.head.innerHTML = `<title data-i18n="extName">x</title>`;
    document.body.innerHTML = `<h1 data-i18n="extName">x</h1><button data-i18n="popupRefresh" data-i18n-title="popupRefresh">x</button>`;
    localizeDocument(document);
    expect(document.querySelector("h1")!.textContent).toBe("GeForce NOW-Check für Steam");
    expect(document.querySelector("button")!.textContent).toBe("Katalog aktualisieren");
    expect(document.querySelector("button")!.title).toBe("Katalog aktualisieren");
    expect(document.title).toBe("GeForce NOW-Check für Steam");
  });
});
