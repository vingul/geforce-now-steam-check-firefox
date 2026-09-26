import type { BadgeState } from "../feed/resolve-state";

/** Deep link into the GeForce NOW web app for one game, per NVIDIA's GFN SDK
 *  deep-linking spec (game-id plus the utm params the spec requires). `gfnId`
 *  is the catalog app UUID carried in the index as `gfnId`. */
export function gfnPlayUrl(gfnId: string): string {
  const url = new URL("https://play.geforcenow.com/games");
  url.searchParams.set("game-id", gfnId);
  url.searchParams.set("utm_source", "gfn-check-steam");
  url.searchParams.set("utm_campaign", "steam-store-banner");
  return url.toString();
}

/** Deep link into the *native* GeForce NOW client. The `geforcenow://` scheme
 *  is registered by the desktop app but undocumented: the client strips the
 *  `geforcenow://route/` prefix and treats the remainder as its `--url-route`
 *  argument, so the fragment mirrors the app's own per-game desktop shortcuts
 *  (`#?cmsId=…&launchSource=External&shortName=<uuid>&parentGameId=<uuid>`).
 *  Verified against GFN 2.0.85 on macOS; a URL without the `route/` prefix is
 *  received but rejected. Built by hand — the params live in a URL *fragment*,
 *  which URLSearchParams would serialize into a query instead. */
export function gfnAppUrl(cmsId: number, gfnId: string): string {
  const id = encodeURIComponent(gfnId);
  return (
    `geforcenow://route/#?cmsId=${String(cmsId)}&launchSource=External` +
    `&shortName=${id}&parentGameId=${id}`
  );
}

/** Which launch links a badge state can offer.
 *
 *  Only supported games link anywhere, and how far we get depends on which ids
 *  the index entry carries — a stale cache written by an older version, served
 *  after a failed refetch, is missing the newer ones:
 *
 *  - v3 entry (gfnId + cmsId) → both: native app link, plus the web link as the
 *    "no app installed" escape hatch
 *  - v2 entry (gfnId only)    → web link only
 *  - v1 entry / not supported → neither; nothing to launch
 *
 *  Degrading is always to *fewer* links, never to a wrong one. The store page
 *  renders these as the two launch buttons beside Steam's own play button
 *  (badge.ts `renderLaunchButtons`), and only for a game the user owns
 *  (content/ownership.ts) — GeForce NOW streams a Steam game only from a
 *  library that has it, so offering a launch on an unowned game would be a
 *  dead end. */
export function resolveLaunchLinks(state: BadgeState): {
  appUrl: string | null;
  webUrl: string | null;
} {
  if (state.kind !== "supported" || state.gfnId === undefined) {
    return { appUrl: null, webUrl: null };
  }
  return {
    appUrl: state.cmsId === undefined ? null : gfnAppUrl(state.cmsId, state.gfnId),
    webUrl: gfnPlayUrl(state.gfnId),
  };
}
