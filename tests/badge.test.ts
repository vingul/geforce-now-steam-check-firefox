// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import {
  ensureStyles,
  placeAfter,
  placeAt,
  placeBefore,
  renderLaunchButtons,
  renderStoreBanner,
  renderWishlistPill,
} from "../src/badge/badge";
import { gfnAppUrl, gfnPlayUrl } from "../src/badge/gfn-link";
import type { BadgeState } from "../src/feed/resolve-state";

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("renderStoreBanner", () => {
  test("supported + rtx", () => {
    const el = renderStoreBanner(document, { kind: "supported", rtx: true });
    expect(el.className).toContain("gfn-check-banner--ok");
    expect(el.querySelector(".gfn-check-banner-text")!.textContent).toBe(
      "Playable on GeForce NOW",
    );
    expect(el.querySelector(".gfn-check-rtx")).not.toBeNull();
  });
  test("supported without rtx omits the RTX chip", () => {
    const el = renderStoreBanner(document, { kind: "supported", rtx: false });
    expect(el.querySelector(".gfn-check-rtx")).toBeNull();
  });
  test("not-supported", () => {
    const el = renderStoreBanner(document, { kind: "not-supported" });
    expect(el.className).toContain("gfn-check-banner--no");
    expect(el.querySelector(".gfn-check-banner-text")!.textContent).toBe(
      "Not on GeForce NOW",
    );
  });
  test("unknown", () => {
    const el = renderStoreBanner(document, { kind: "unknown" });
    expect(el.className).toContain("gfn-check-banner--unknown");
    expect(el.querySelector(".gfn-check-banner-text")!.textContent).toBe(
      "GeForce NOW: couldn't check",
    );
  });
  test("needs-permission suggests the toolbar without blaming the permission", () => {
    // The feed grant is optional — the catalog fetch clears plain CORS without it
    // (shared/feed-origin.ts) — so the usual reason for landing here is a network
    // failure. Copy that asserted the permission was the cause sent offline users
    // to a button that could not help them. It must read as a failed check first
    // and a suggestion second.
    const el = renderStoreBanner(document, { kind: "needs-permission" });
    expect(el.className).toContain("gfn-check-banner--unknown");
    const text = el.querySelector(".gfn-check-banner-text")!.textContent!;
    expect(text).toBe("GeForce NOW: couldn't check — the toolbar icon may help");
    expect(text).toContain("couldn't check");
    expect(text).not.toMatch(/\benable\b/i);
  });

  test("the banner never links anywhere, whatever ids the state carries", () => {
    // Launching moved to the buttons beside Steam's own play button, shown only
    // on an owned game: a link here offered a launch on games the account
    // cannot stream. The banner stays a plain informational <div>.
    const states: BadgeState[] = [
      { kind: "supported", rtx: true, gfnId: "e5bd86f0-3f67-4bec-a505-d1315f3c0d50", cmsId: 100885011 },
      { kind: "supported", rtx: false, gfnId: "e5bd86f0-3f67-4bec-a505-d1315f3c0d50" },
      { kind: "supported", rtx: false },
      { kind: "not-supported" },
      { kind: "unknown" },
      { kind: "needs-permission" },
    ];
    for (const state of states) {
      const el = renderStoreBanner(document, state);
      expect(el.tagName).toBe("DIV");
      expect(el.querySelector("a")).toBeNull();
      expect(el.className).not.toContain("--link");
    }
  });
});

describe("renderLaunchButtons", () => {
  const gfnId = "e5bd86f0-3f67-4bec-a505-d1315f3c0d50";
  const cmsId = 100885011;

  test("supported with both ids: app button (same tab, ends in the lockup) + web button (new tab)", () => {
    const el = renderLaunchButtons(document, { kind: "supported", rtx: false, gfnId, cmsId })!;
    expect(el).not.toBeNull();
    expect(el.className).toBe("gfn-check-launch");
    const buttons = el.querySelectorAll<HTMLAnchorElement>("a.gfn-check-launch-btn");
    expect(buttons.length).toBe(2);

    const app = buttons[0]!;
    expect(app.className).toContain("gfn-check-launch-app");
    expect(app.getAttribute("href")).toBe(gfnAppUrl(cmsId, gfnId));
    expect(app.target).toBe("");
    expect(app.querySelector(".gfn-check-launch-label")!.textContent).toBe("Play on");
    const lockup = app.querySelector(".gfn-check-lockup")!;
    expect(lockup).not.toBeNull();
    expect(lockup.getAttribute("role")).toBe("img");
    expect(lockup.getAttribute("aria-label")).toBe("GeForce NOW");
    const svg = lockup.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("108 221 584 157");
    // Layered recolouring of the monochrome source: lime outline, black eye,
    // white GEFORCE NOW letters, charcoal showing through the holes.
    const fills = new Set([...svg.querySelectorAll("path, rect, polygon")].map((n) => n.getAttribute("fill")));
    expect(fills).toEqual(new Set(["#76b900", "#000", "#fff", "#1a1a1a"]));
    expect(lockup.textContent).toBe("");

    const web = buttons[1]!;
    expect(web.className).toContain("gfn-check-launch-web");
    expect(web.getAttribute("href")).toBe(gfnPlayUrl(gfnId));
    expect(web.target).toBe("_blank");
    expect(web.rel).toBe("noopener noreferrer");
    expect(web.textContent).toBe("Play in Web");
    expect(web.querySelector(".gfn-check-lockup")).toBeNull();
  });

  test("supported with only a gfn id (stale v2 cache): web button alone", () => {
    const el = renderLaunchButtons(document, { kind: "supported", rtx: true, gfnId })!;
    const buttons = el.querySelectorAll<HTMLAnchorElement>("a.gfn-check-launch-btn");
    expect(buttons.length).toBe(1);
    expect(buttons[0]!.className).toContain("gfn-check-launch-web");
    expect(buttons[0]!.getAttribute("href")).toBe(gfnPlayUrl(gfnId));
    expect(buttons[0]!.target).toBe("_blank");
  });

  test("supported without ids (stale pre-v2 cache) renders nothing rather than a dead link", () => {
    expect(renderLaunchButtons(document, { kind: "supported", rtx: false })).toBeNull();
  });

  test("non-supported states render nothing", () => {
    expect(renderLaunchButtons(document, { kind: "not-supported" })).toBeNull();
    expect(renderLaunchButtons(document, { kind: "unknown" })).toBeNull();
    expect(renderLaunchButtons(document, { kind: "needs-permission" })).toBeNull();
  });

  test("built from DOM nodes, never innerHTML", () => {
    const el = renderLaunchButtons(document, { kind: "supported", rtx: false, gfnId, cmsId })!;
    expect(el.innerHTML).not.toContain("<script");
    const app = el.querySelector("a.gfn-check-launch-app")!;
    expect(app.childElementCount).toBe(2);
    expect(app.firstElementChild!.className).toBe("gfn-check-launch-label");
    expect(app.lastElementChild!.className).toBe("gfn-check-lockup");
  });
});

describe("placeAt", () => {
  test("after: inserts as the anchor's next sibling and is idempotent by id", () => {
    document.body.innerHTML = `<div id="wrap"><div class="btn_addtocart"><a href="steam://run/1">Play</a></div><span id="tail"></span></div>`;
    const anchor = document.querySelector(".btn_addtocart")!;
    const first = document.createElement("a");
    first.id = "slot";
    placeAt(document, anchor, "after", first);
    const second = document.createElement("a");
    second.id = "slot";
    placeAt(document, anchor, "after", second);
    expect(document.querySelectorAll("#slot").length).toBe(1);
    expect(anchor.nextElementSibling).toBe(second);
    expect(second.nextElementSibling!.id).toBe("tail");
  });

  test("append: becomes the anchor's last child", () => {
    document.body.innerHTML = `<div class="game_area_already_in_library"><span>owned</span></div>`;
    const flag = document.querySelector(".game_area_already_in_library")!;
    const el = document.createElement("a");
    el.id = "slot";
    placeAt(document, flag, "append", el);
    expect(flag.lastElementChild).toBe(el);
    expect(flag.childElementCount).toBe(2);
  });

  test("after with a detached anchor falls back to append instead of throwing", () => {
    const anchor = document.createElement("div");
    const el = document.createElement("a");
    placeAt(document, anchor, "after", el);
    expect(anchor.firstElementChild).toBe(el);
  });
});

describe("renderWishlistPill", () => {
  test("supported + rtx appends the RTX suffix", () => {
    const el = renderWishlistPill(document, { kind: "supported", rtx: true });
    expect(el.className).toContain("gfn-check-pill--ok");
    expect(el.textContent).toContain("GeForce NOW · RTX");
  });
  test("not-supported", () => {
    const el = renderWishlistPill(document, { kind: "not-supported" });
    expect(el.textContent).toContain("Not available");
  });
  test("needs-permission reads as a failed check, like unknown", () => {
    // A pill has no room to word a suggestion honestly, and a wishlist row isn't
    // where that conversation belongs — the popup has space to explain. Both
    // failure states therefore render identically here.
    const el = renderWishlistPill(document, { kind: "needs-permission" });
    expect(el.className).toContain("gfn-check-pill--unknown");
    expect(el.textContent).toContain("Couldn't check");
    expect(el.textContent).not.toMatch(/\benable\b/i);
  });
});

describe("ensureStyles", () => {
  test("injects the stylesheet exactly once", () => {
    ensureStyles(document);
    ensureStyles(document);
    expect(document.querySelectorAll("#gfn-check-style")).toHaveLength(1);
  });
});

describe("placeBefore", () => {
  test("inserts before the anchor and is idempotent by id", () => {
    document.body.innerHTML = `<div id="game_area_purchase">buy</div>`;
    const make = () => {
      const b = renderStoreBanner(document, { kind: "not-supported" });
      b.id = "gfn-check-store-slot";
      return b;
    };
    expect(placeBefore(document, "#game_area_purchase", make())).toBe(true);
    placeBefore(document, "#game_area_purchase", make());
    expect(document.querySelectorAll("#gfn-check-store-slot")).toHaveLength(1);
    const anchor = document.getElementById("game_area_purchase")!;
    expect(anchor.previousElementSibling!.id).toBe("gfn-check-store-slot");
  });
  test("falls back to body when the anchor is missing", () => {
    const b = renderStoreBanner(document, { kind: "unknown" });
    b.id = "gfn-check-store-slot";
    expect(placeBefore(document, "#nope", b)).toBe(false);
    expect(document.getElementById("gfn-check-store-slot")).not.toBeNull();
  });
});

describe("placeAfter", () => {
  test("inserts after the anchor and is idempotent by id", () => {
    document.body.innerHTML = `<div class="apphub_HeaderStandardTop">title</div><div id="next">x</div>`;
    const make = () => {
      const b = renderStoreBanner(document, { kind: "supported", rtx: false });
      b.id = "gfn-check-store-slot";
      return b;
    };
    expect(placeAfter(document, ".apphub_HeaderStandardTop", make())).toBe(true);
    placeAfter(document, ".apphub_HeaderStandardTop", make());
    expect(document.querySelectorAll("#gfn-check-store-slot")).toHaveLength(1);
    const header = document.querySelector(".apphub_HeaderStandardTop")!;
    expect(header.nextElementSibling!.id).toBe("gfn-check-store-slot");
  });
  test("returns false when the anchor is missing", () => {
    const b = renderStoreBanner(document, { kind: "unknown" });
    b.id = "gfn-check-store-slot";
    expect(placeAfter(document, "#nope", b)).toBe(false);
  });
});
