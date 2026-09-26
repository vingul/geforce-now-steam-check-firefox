/** Does the user already own the game on this store page?
 *
 *  Steam never says so in a machine-readable attribute, and the button copy is
 *  localized ("Play Game" / "Грати" / "Spielen"), so the text is never consulted.
 *  Two structural signals are used instead, either of which is enough:
 *
 *  1. The purchase area's *play* button. For an owned game the green button is an
 *     anchor whose `href` launches the Steam client — `steam://run/<appid>` (or
 *     `steam://launch/…`), either directly or wrapped as
 *     `javascript:ShowGotSteamModal('steam://run/<appid>')` when the store cannot
 *     tell whether the client is installed. A not-yet-owned game never carries a
 *     run link: its button adds to cart or claims a free license, and the one
 *     `steam://` route it can carry is `install/`, which is deliberately *not*
 *     matched here.
 *  2. The "<Game> is already in your Steam library" flag Steam server-renders
 *     above the purchase block. Its class is stable and not localized even though
 *     its text is.
 *
 *  Both live inside `#game_area_purchase`, so a `steam://run/` link elsewhere on
 *  the page (a promo, another extension's UI) cannot count as ownership. These are
 *  live-Steam-markup selectors, and so — per CLAUDE.md — the thing most likely to
 *  drift; `docs/pre-release-testing.md` §B.1 covers them by hand. */

export const PURCHASE_AREA_SELECTOR = "#game_area_purchase";
export const IN_LIBRARY_SELECTOR = ".game_area_already_in_library";

const RUN_LINK_PATTERN = /steam:\/\/(?:run|launch)\//;

/** The store's own play button for an owned game, or null when there is none.
 *  Exported separately from `isOwned` because the caller also uses it as the
 *  placement anchor for our button. */
export function findSteamPlayButton(doc: Document): HTMLAnchorElement | null {
  const area = doc.querySelector(PURCHASE_AREA_SELECTOR);
  if (area === null) return null;
  for (const a of area.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    if (RUN_LINK_PATTERN.test(a.getAttribute("href") ?? "")) return a;
  }
  return null;
}

/** The "already in your library" flag, or null. */
export function findInLibraryFlag(doc: Document): HTMLElement | null {
  const area = doc.querySelector(PURCHASE_AREA_SELECTOR);
  if (area === null) return null;
  return area.querySelector<HTMLElement>(IN_LIBRARY_SELECTOR);
}

export function isOwned(doc: Document): boolean {
  return findSteamPlayButton(doc) !== null || findInLibraryFlag(doc) !== null;
}

/** Where a "Play on GeForce NOW" button belongs on an owned game's page.
 *
 *  Next to Steam's own play button when there is one — its `.btn_addtocart`
 *  wrapper is the inline-block Steam lays the buttons out with, so a sibling
 *  after it lines up as one more button; the bare anchor is the fallback when
 *  the wrapper is gone. Failing that, inside the "already in your library" flag,
 *  which is the only other place that says the game is owned. `null` means the
 *  game is not owned (or the page has no purchase area yet) and nothing should
 *  be injected. */
export function ownedButtonAnchor(
  doc: Document,
): { el: Element; mode: "after" | "append" } | null {
  const play = findSteamPlayButton(doc);
  if (play !== null) return { el: play.closest(".btn_addtocart") ?? play, mode: "after" };
  const flag = findInLibraryFlag(doc);
  if (flag !== null) return { el: flag, mode: "append" };
  return null;
}
