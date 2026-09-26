/** Does the user already own the game on this store page?
 *
 *  Steam never says so in a machine-readable attribute, and the button copy is
 *  localized ("Play" / "Грати" / "Spielen"), so the text is never consulted.
 *  Two structural signals are used instead, either of which is enough:
 *
 *  1. Steam's own *play* button for this app. For an owned game it is an anchor
 *     whose `href` launches the Steam client — `steam://run/<appid>` (or
 *     `steam://launch/<appid>/…`), either directly or wrapped as
 *     `javascript:ShowGotSteamModal('steam://run/<appid>')` when the store cannot
 *     tell whether the client is installed. The app id in the route must be the
 *     page's own, so a launch link for some other app (a bundle's, a demo's) is
 *     not taken as ownership of this one. A not-yet-owned game never carries a
 *     run link: its button adds to cart or claims a free license, and the one
 *     `steam://` route it can carry is `install/`, which is deliberately *not*
 *     matched here.
 *  2. The "<Game> is already in your Steam library" flag Steam server-renders
 *     above the play block. Its class is stable and not localized even though
 *     its text is.
 *
 *  Neither is scoped to `#game_area_purchase`: on the live page both sit *above*
 *  it — the flag, then a play-stats block with the button and hours played, then
 *  the purchase area — and an earlier version that looked only inside the
 *  purchase area found nothing on a page whose screenshot plainly showed both.
 *  Steam's global chrome is excluded instead, the same list wishlist-rows.ts
 *  uses, so a stray link in the header or footer cannot count. These are
 *  live-Steam-markup selectors and so — per CLAUDE.md — the thing most likely
 *  to drift; `docs/pre-release-testing.md` §B.1a covers them by hand. */

export const IN_LIBRARY_SELECTOR = ".game_area_already_in_library";

const CHROME_SELECTORS = ["#global_header", "#footer", ".footerv2", "#responsive_page_menu"];

function inChrome(el: Element): boolean {
  return CHROME_SELECTORS.some((sel) => el.closest(sel) !== null);
}

const RUN_LINK_PATTERN = /steam:\/\/(?:run|launch)\/(\d+)/;

/** Steam's own play button for `appId`, or null when there is none. Exported
 *  separately from `isOwned` because the caller also uses it as the placement
 *  anchor for our buttons. */
export function findSteamPlayButton(doc: Document, appId: number): HTMLAnchorElement | null {
  for (const a of doc.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const m = RUN_LINK_PATTERN.exec(a.getAttribute("href") ?? "");
    if (m !== null && Number(m[1]) === appId && !inChrome(a)) return a;
  }
  return null;
}

/** The "already in your library" flag, or null. */
export function findInLibraryFlag(doc: Document): HTMLElement | null {
  for (const el of doc.querySelectorAll<HTMLElement>(IN_LIBRARY_SELECTOR)) {
    if (!inChrome(el)) return el;
  }
  return null;
}

export function isOwned(doc: Document, appId: number): boolean {
  return findSteamPlayButton(doc, appId) !== null || findInLibraryFlag(doc) !== null;
}

/** Where the GeForce NOW launch buttons belong on an owned game's page.
 *
 *  Right after Steam's own play button when there is one — the buttons are
 *  styled to sit on the same row as it. If Steam has wrapped the anchor in its
 *  `.btn_addtocart` inline-block, that wrapper is the sibling to follow, so the
 *  row's layout is not disturbed; otherwise the bare anchor is. Failing a play
 *  button, inside the "already in your library" flag, which is the only other
 *  place that says the game is owned. `null` means the game is not owned (or
 *  the page has not rendered either signal yet) and nothing should be injected. */
export function ownedButtonAnchor(
  doc: Document,
  appId: number,
): { el: Element; mode: "after" | "append" } | null {
  const play = findSteamPlayButton(doc, appId);
  if (play !== null) return { el: play.closest(".btn_addtocart") ?? play, mode: "after" };
  const flag = findInLibraryFlag(doc);
  if (flag !== null) return { el: flag, mode: "append" };
  return null;
}
