import { parseAppId } from "../feed/parse-app-id";
import { isDefinitive, resolveState, stateStamp, type BadgeState } from "../feed/resolve-state";
import { lookup } from "../shared/lookup";
import { debounce } from "../shared/debounce";
import { coalesce } from "../shared/coalesce";
import { onEpochChange } from "../shared/catalog-epoch";
import {
  STATE_ATTR,
  ensureStyles,
  placeAfter,
  placeAt,
  placeBefore,
  renderLaunchButtons,
  renderStoreBanner,
} from "../badge/badge";
import { ownedButtonAnchor } from "./ownership";
import { log } from "../shared/log";

const SLOT_ID = "gfn-check-store-slot";
const LAUNCH_SLOT_ID = "gfn-check-launch-slot";
// The banner sits right under the game title/header. We try the header anchors
// first (placed after them) and fall back to just above the purchase block.
// These are the selectors to re-verify against the live store page if placement
// drifts.
const HEADER_SELECTORS = [".apphub_HeaderStandardTop", ".page_title_area"];
const PURCHASE_SELECTOR = "#game_area_purchase";

// Two short retries, for one specific case: the MV3 background is an event page,
// so a page opened while it is still waking gets "couldn't check" and would
// otherwise keep it. Ten seconds covers that comfortably.
//
// Deliberately *not* a long backoff with focus/visibility revival. That existed to
// rescue a page whose lookups had all failed, and it cost far more than the failure
// did: "couldn't check" says plainly that it doesn't know, and a reload fixes it.
// Compare a frozen *wrong* answer — "Not on GeForce NOW" for a game that is on it —
// which looks authoritative and which a user cannot diagnose. That is the failure
// worth engineering against, and it is handled elsewhere: the stale-cache rule in
// feed-cache.ts, `isDefinitive` here and in the wishlist memo, and the epoch below.
//
// The revival machinery also misbehaved in the ordinary case. Resetting the backoff
// on every `focus` meant an actively used browser never exhausted it, turning a
// bounded retry into an open-ended one.
const RETRY_DELAYS_MS = [2_000, 10_000];

const appId = parseAppId(location.href);

let state: BadgeState | null = null;
let attempt = 0;

/** Render the badge, or replace one that is showing a stale state.
 *
 *  The state stamp is what lets a banner painted "couldn't check" be swapped out
 *  once the lookup resolves — the same trick wishlist-rows.ts uses for recycled
 *  rows. It encodes more than `kind` because a new catalog can turn one definitive
 *  answer into a different definitive answer (see resolve-state.ts). */
function paint(next: BadgeState): void {
  paintBanner(next);
  paintLaunchButtons(next);
}

function paintBanner(next: BadgeState): void {
  const stamp = stateStamp(next);
  const existing = document.getElementById(SLOT_ID);
  if (existing !== null) {
    if (existing.getAttribute(STATE_ATTR) === stamp) return;
    existing.remove();
  }
  ensureStyles(document);
  const badge = renderStoreBanner(document, next);
  badge.id = SLOT_ID;
  badge.setAttribute(STATE_ATTR, stamp);
  for (const sel of HEADER_SELECTORS) {
    if (placeAfter(document, sel, badge)) return;
  }
  placeBefore(document, PURCHASE_SELECTOR, badge);
}

/** The second injection: the GeForce NOW launch buttons beside Steam's own play
 *  button, only when the page says the user owns the game (content/ownership.ts)
 *  *and* the catalog says it streams with a link to offer. Both facts are re-read
 *  on every paint — ownership from the live DOM, the links from `next` — and the
 *  buttons are removed when either stops holding, so a rebuild of that part of
 *  the page by Steam or another extension cannot strand stale ones. Same stamp
 *  contract as the banner: an unchanged state on an attached node is a no-op. */
function paintLaunchButtons(next: BadgeState): void {
  if (appId === null) return;
  const existing = document.getElementById(LAUNCH_SLOT_ID);
  const anchor = ownedButtonAnchor(document, appId);
  const buttons = anchor === null ? null : renderLaunchButtons(document, next);
  if (anchor === null || buttons === null) {
    existing?.remove();
    return;
  }
  const stamp = stateStamp(next);
  if (existing !== null && existing.getAttribute(STATE_ATTR) === stamp) return;
  ensureStyles(document);
  buttons.id = LAUNCH_SLOT_ID;
  buttons.setAttribute(STATE_ATTR, stamp);
  placeAt(document, anchor.el, anchor.mode, buttons);
}

// Coalesced: a retry timer and a catalog epoch can both fire while a lookup is
// outstanding. Re-entering would duplicate it; dropping would discard an epoch —
// the one trigger that must not be lost, since a new catalog is exactly what
// invalidates the answer on screen.
const run = coalesce(async () => {
  if (appId === null) return;

  let next: BadgeState;
  try {
    next = resolveState(appId, await lookup([appId]));
  } catch {
    // lookup() is contracted never to reject; degrade rather than let a rejection
    // escape a timer callback.
    next = { kind: "unknown" };
  }

  state = next;
  log.info(`store app ${String(appId)} -> ${next.kind}`);
  paint(next);

  if (isDefinitive(next)) return;
  const delay = RETRY_DELAYS_MS[attempt];
  if (delay === undefined) return; // Out of retries: it stays "couldn't check" until reload.
  attempt += 1;
  setTimeout(() => void run(), delay);
});

if (appId !== null) {
  void run();

  // Re-inject if Steam or another extension (Augmented Steam / alike03's) rebuilds
  // the purchase area after us. paint() is a no-op while our node is present and
  // current, but debounce anyway: store pages mutate constantly (carousels, live
  // player counts) and there is no reason to re-check the DOM on every one.
  new MutationObserver(
    debounce(() => {
      if (state !== null) paint(state);
    }, 300),
  ).observe(document.body, { childList: true, subtree: true });

  // A new catalog landed, so even a definitive answer may now be wrong — this is
  // what makes the popup's "Refresh catalog" button repair the page you pressed it
  // for, which is otherwise a button that appears to do nothing.
  onEpochChange(() => {
    log.info("store: new catalog published, re-checking");
    attempt = 0;
    void run();
  });
}
