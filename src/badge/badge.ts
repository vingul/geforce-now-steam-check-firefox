import type { BadgeState } from "../feed/resolve-state";
import { BADGE_CSS } from "./badge.css";
import { resolveLaunchLinks } from "./gfn-link";

const STYLE_ID = "gfn-check-style";
const SVG_NS = "http://www.w3.org/2000/svg";

/** Records *which badge* an injected node is showing, as `stateStamp()` from
 *  resolve-state.ts. Both content scripts stamp it and compare against it to tell
 *  "already showing this" from "showing something stale" — a slot painted
 *  "couldn't check" while its lookup was pending, or a definitive answer a new
 *  catalog has since changed. One attribute name, one contract: it lives here
 *  because this module owns everything we inject into the page. */
export const STATE_ATTR = "data-gfn-state";

/** GFN mark, mirrors icons/icon.svg. Built via DOM (not innerHTML) so it needs
 *  no asset/host perms and stays clear of unsafe-assignment lint. */
function logoSvg(doc: Document): SVGElement {
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 96 96");
  svg.setAttribute("aria-hidden", "true");
  const rect = doc.createElementNS(SVG_NS, "rect");
  rect.setAttribute("width", "96");
  rect.setAttribute("height", "96");
  rect.setAttribute("rx", "18");
  rect.setAttribute("fill", "#0c1a05");
  const circle = doc.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", "48");
  circle.setAttribute("cy", "48");
  circle.setAttribute("r", "20");
  circle.setAttribute("fill", "#76b900");
  svg.append(rect, circle);
  return svg;
}

/** Inject the shared badge stylesheet once per document. */
export function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = BADGE_CSS;
  (doc.head ?? doc.documentElement).appendChild(style);
}

function modifier(state: BadgeState): "ok" | "no" | "unknown" {
  if (state.kind === "supported") return "ok";
  if (state.kind === "not-supported") return "no";
  return "unknown";
}

// Both failure states mean "the catalog fetch didn't work". They differ only in
// whether the feed grant is missing, which makes granting it worth *suggesting* —
// it bypasses any CORS problem. It is not worth asserting as the cause: the fetch
// works fine ungranted (feed-origin.ts), so the usual reason for landing here is
// simply that the network was down, and the older copy ("click the toolbar icon to
// enable checks") told those users to do something that would not have helped.
function bannerLabel(state: BadgeState): string {
  if (state.kind === "supported") return "Playable on GeForce NOW";
  if (state.kind === "not-supported") return "Not on GeForce NOW";
  if (state.kind === "needs-permission")
    return "GeForce NOW: couldn't check — the toolbar icon may help";
  return "GeForce NOW: couldn't check";
}

function pillLabel(state: BadgeState): string {
  if (state.kind === "supported") return state.rtx ? "GeForce NOW · RTX" : "GeForce NOW";
  if (state.kind === "not-supported") return "Not available";
  // No room in a pill to word a suggestion honestly, and a wishlist row is not
  // where that conversation belongs — the popup has space to explain.
  return "Couldn't check";
}

/** createElement + class + optional text — the shape every piece of badge
 *  chrome takes. Built this way, never from innerHTML, so `web-ext lint` stays
 *  clean and we need no asset or host permissions. */
function span(doc: Document, className: string, text?: string): HTMLElement {
  const el = doc.createElement("span");
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Prominent full-width banner for a store page, placed near the title.
 *
 *  Informational only: it says whether the game streams (and whether with RTX)
 *  and links nowhere. Launching lives in `renderLaunchButtons`, beside Steam's
 *  own play button and only on a game the user owns — a link here would offer
 *  a launch on games the account cannot stream, and it used to. The root is a
 *  <div>, so placeBefore/placeAfter and the id-keyed re-injection are unaffected. */
export function renderStoreBanner(doc: Document, state: BadgeState): HTMLElement {
  const el = doc.createElement("div");
  el.className = `gfn-check-banner gfn-check-banner--${modifier(state)}`;
  const logo = span(doc, "gfn-check-banner-logo");
  logo.appendChild(logoSvg(doc));
  el.appendChild(logo);
  el.appendChild(span(doc, "gfn-check-banner-text", bannerLabel(state)));
  if (state.kind === "supported" && state.rtx) {
    el.appendChild(span(doc, "gfn-check-rtx", "RTX"));
  }
  return el;
}

/** The NVIDIA GeForce NOW lockup, drawn as DOM + SVG so it needs no asset or
 *  host permission: a lime block carrying a simplified NVIDIA eye mark next to a
 *  charcoal block with "GEFORCE / NOW" stacked in white. Used as the tail of the
 *  app launch button in place of the words "GeForce NOW". */
function gfnLockup(doc: Document): HTMLElement {
  const lockup = span(doc, "gfn-check-lockup");
  lockup.setAttribute("aria-label", "GeForce NOW");
  lockup.title = "GeForce NOW";

  const nv = span(doc, "gfn-check-lockup-nv");
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 32 20");
  svg.setAttribute("aria-hidden", "true");
  // Eye outline: pointed at the left, rounded at the right.
  const outline = doc.createElementNS(SVG_NS, "path");
  outline.setAttribute(
    "d",
    "M2 10 C7 3 15 1 22 3 C27 4.5 30 7 30 10 C30 13 27 15.5 22 17 C15 19 7 17 2 10 Z",
  );
  outline.setAttribute("fill", "none");
  outline.setAttribute("stroke", "#000");
  outline.setAttribute("stroke-width", "2.2");
  outline.setAttribute("stroke-linejoin", "round");
  // The inner curl that gives the mark its spiral.
  const curl = doc.createElementNS(SVG_NS, "path");
  curl.setAttribute("d", "M9 10 C11 5.5 19 4.5 22 8 C24.5 11 21 15 16.5 14 C13.5 13.3 13 10.5 15.5 9.5");
  curl.setAttribute("fill", "none");
  curl.setAttribute("stroke", "#000");
  curl.setAttribute("stroke-width", "2.2");
  curl.setAttribute("stroke-linecap", "round");
  svg.append(outline, curl);
  nv.appendChild(svg);

  const gfn = span(doc, "gfn-check-lockup-gfn");
  gfn.appendChild(span(doc, "gfn-check-lockup-line", "GEFORCE"));
  gfn.appendChild(span(doc, "gfn-check-lockup-line", "NOW"));

  lockup.append(nv, gfn);
  return lockup;
}

function launchButton(
  doc: Document,
  className: string,
  url: string,
  label: string,
  title: string,
  newTab: boolean,
): HTMLAnchorElement {
  const a = doc.createElement("a");
  a.className = `gfn-check-launch-btn ${className}`;
  a.href = url;
  a.title = title;
  if (newTab) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  a.appendChild(span(doc, "gfn-check-launch-label", label));
  return a;
}

/** The GeForce NOW launch buttons for a store page whose game the user already
 *  owns (content/ownership.ts decides that). They sit on the same row as
 *  Steam's own play button and are styled as Steam's own medium buttons with a
 *  green tint, so they read as part of that row:
 *
 *  - "Play on" + the NVIDIA GeForce NOW lockup — the native app deep link
 *    (`geforcenow://`). Targetless: Firefox hands the custom scheme to the OS
 *    without leaving the page.
 *  - "Play in Web" — the web app, in a new tab, for a machine without the app.
 *
 *  Same link policy as `resolveLaunchLinks`: a stale cache with only a gfnId
 *  gets the web button alone, and `null` — render nothing — when the game is
 *  not supported or the cache predates deep links. Never a wrong link, only
 *  fewer. Returns one container so the caller has a single node to stamp and
 *  place. */
export function renderLaunchButtons(doc: Document, state: BadgeState): HTMLElement | null {
  const { appUrl, webUrl } = resolveLaunchLinks(state);
  if (appUrl === null && webUrl === null) return null;
  const el = span(doc, "gfn-check-launch");
  if (appUrl !== null) {
    const app = launchButton(
      doc,
      "gfn-check-launch-app",
      appUrl,
      "Play on",
      "Launch in the GeForce NOW app",
      false,
    );
    app.appendChild(gfnLockup(doc));
    el.appendChild(app);
  }
  if (webUrl !== null) {
    el.appendChild(
      launchButton(
        doc,
        "gfn-check-launch-web",
        webUrl,
        "Play in Web",
        "Open in the GeForce NOW web app (new tab)",
        true,
      ),
    );
  }
  return el;
}

/** Insert `badge` right after `anchor`, or as `anchor`'s last child, removing
 *  any prior element that shares badge.id (idempotent re-injection). The
 *  element-anchored sibling of placeBefore/placeAfter, for callers that have
 *  already resolved the anchor themselves (content/ownership.ts). */
export function placeAt(
  doc: Document,
  anchor: Element,
  mode: "after" | "append",
  badge: HTMLElement,
): void {
  if (badge.id) doc.getElementById(badge.id)?.remove();
  if (mode === "append" || anchor.parentElement === null) {
    anchor.appendChild(badge);
    return;
  }
  anchor.parentElement.insertBefore(badge, anchor.nextSibling);
}

/** Compact pill for a wishlist row. */
export function renderWishlistPill(doc: Document, state: BadgeState): HTMLElement {
  const el = span(doc, `gfn-check-pill gfn-check-pill--${modifier(state)}`);
  el.appendChild(span(doc, "gfn-check-dot"));
  const label = doc.createElement("span");
  label.textContent = pillLabel(state);
  el.appendChild(label);
  return el;
}

/** Insert `badge` immediately before the first element matching `anchorSelector`,
 *  removing any prior element that shares badge.id (idempotent re-injection).
 *  Returns true if anchored, false if it fell back to <body>. We only ever touch
 *  our own node. */
export function placeBefore(doc: Document, anchorSelector: string, badge: HTMLElement): boolean {
  if (badge.id) doc.getElementById(badge.id)?.remove();
  const anchor = doc.querySelector(anchorSelector);
  if (anchor?.parentElement) {
    anchor.parentElement.insertBefore(badge, anchor);
    return true;
  }
  (doc.body ?? doc.documentElement).appendChild(badge);
  return false;
}

/** Insert `badge` immediately after the first element matching `anchorSelector`
 *  (idempotent on badge.id). Returns true if anchored, false if no match. */
export function placeAfter(doc: Document, anchorSelector: string, badge: HTMLElement): boolean {
  if (badge.id) doc.getElementById(badge.id)?.remove();
  const anchor = doc.querySelector(anchorSelector);
  if (anchor?.parentElement) {
    anchor.parentElement.insertBefore(badge, anchor.nextSibling);
    return true;
  }
  return false;
}
