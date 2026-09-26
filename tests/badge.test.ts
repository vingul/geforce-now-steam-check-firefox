// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import {
  ensureStyles,
  placeAfter,
  placeAt,
  placeBefore,
  renderPlayButton,
  renderStoreBanner,
  renderWishlistPill,
} from "../src/badge/badge";
import { gfnAppUrl, gfnPlayUrl } from "../src/badge/gfn-link";

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

  test("supported with cms + gfn ids: main link opens the native app, web chip falls back", () => {
    const gfnId = "e5bd86f0-3f67-4bec-a505-d1315f3c0d50";
    const cmsId = 100885011;
    const el = renderStoreBanner(document, { kind: "supported", rtx: true, gfnId, cmsId });
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("gfn-check-banner--link");

    // Exact URL serialization is owned by gfn-link.test.ts; here we only care
    // which link goes where.
    const main = el.querySelector("a.gfn-check-banner-main")!;
    expect(main.getAttribute("href")).toBe(gfnAppUrl(cmsId, gfnId));
    // Custom-scheme links stay in-tab: Firefox hands them to the OS without
    // navigating, so no target/_blank churn.
    expect(main.getAttribute("target")).toBeNull();
    // Logo, label and chips all live inside the click target.
    expect(main.querySelector(".gfn-check-banner-text")!.textContent).toBe(
      "Playable on GeForce NOW",
    );
    expect(main.querySelector(".gfn-check-rtx")).not.toBeNull();
    expect(main.querySelector(".gfn-check-play")!.textContent).toBe("Play");

    const web = el.querySelector("a.gfn-check-web")!;
    expect(web.getAttribute("href")).toBe(gfnPlayUrl(gfnId));
    expect(web.getAttribute("target")).toBe("_blank");
    expect(web.getAttribute("rel")).toContain("noopener");
    expect(web.getAttribute("rel")).toContain("noreferrer");
  });

  test("supported with only a gfn id (stale v2 cache) links to the web app, no web chip", () => {
    const gfnId = "uuid-only";
    const el = renderStoreBanner(document, { kind: "supported", rtx: false, gfnId });
    expect(el.className).toContain("gfn-check-banner--link");
    const main = el.querySelector("a.gfn-check-banner-main")!;
    expect(main.getAttribute("href")).toBe(gfnPlayUrl(gfnId));
    expect(main.getAttribute("target")).toBe("_blank");
    expect(main.getAttribute("rel")).toContain("noopener");
    expect(main.querySelector(".gfn-check-play")!.textContent).toBe("Play ↗");
    expect(el.querySelector(".gfn-check-web")).toBeNull();
  });

  test("supported without ids (stale pre-v2 cache) stays a plain non-link banner", () => {
    const el = renderStoreBanner(document, { kind: "supported", rtx: true });
    expect(el.tagName).toBe("DIV");
    expect(el.querySelector("a")).toBeNull();
    expect(el.className).not.toContain("gfn-check-banner--link");
    expect(el.querySelector(".gfn-check-play")).toBeNull();
    expect(el.querySelector(".gfn-check-rtx")).not.toBeNull();
  });

  test("non-supported states are never links", () => {
    for (const state of [
      { kind: "not-supported" } as const,
      { kind: "unknown" } as const,
      { kind: "needs-permission" } as const,
    ]) {
      const el = renderStoreBanner(document, state);
      expect(el.tagName).toBe("DIV");
      expect(el.querySelector("a")).toBeNull();
      expect(el.className).not.toContain("gfn-check-banner--link");
      expect(el.querySelector(".gfn-check-play")).toBeNull();
    }
  });
});

describe("renderPlayButton", () => {
  const gfnId = "e5bd86f0-3f67-4bec-a505-d1315f3c0d50";
  const cmsId = 100885011;

  test("supported with both ids launches the native app, same tab", () => {
    const a = renderPlayButton(document, { kind: "supported", rtx: false, gfnId, cmsId })!;
    expect(a).not.toBeNull();
    expect(a.tagName).toBe("A");
    expect(a.className).toBe("gfn-check-playbtn");
    expect(a.getAttribute("href")).toBe(gfnAppUrl(cmsId, gfnId));
    expect(a.target).toBe("");
    expect(a.querySelector(".gfn-check-playbtn-text")!.textContent).toBe("Play on GeForce NOW");
    expect(a.querySelector(".gfn-check-playbtn-logo svg")).not.toBeNull();
  });

  test("supported with only a gfn id (stale v2 cache) degrades to the web app in a new tab", () => {
    const a = renderPlayButton(document, { kind: "supported", rtx: true, gfnId })!;
    expect(a.getAttribute("href")).toBe(gfnPlayUrl(gfnId));
    expect(a.target).toBe("_blank");
    expect(a.rel).toBe("noopener noreferrer");
    expect(a.querySelector(".gfn-check-playbtn-text")!.textContent).toBe("Play on GeForce NOW ↗");
  });

  test("supported without ids (stale pre-v2 cache) renders nothing rather than a dead link", () => {
    expect(renderPlayButton(document, { kind: "supported", rtx: false })).toBeNull();
  });

  test("non-supported states render nothing", () => {
    expect(renderPlayButton(document, { kind: "not-supported" })).toBeNull();
    expect(renderPlayButton(document, { kind: "unknown" })).toBeNull();
    expect(renderPlayButton(document, { kind: "needs-permission" })).toBeNull();
  });

  test("never built from innerHTML", () => {
    const a = renderPlayButton(document, { kind: "supported", rtx: false, gfnId, cmsId })!;
    expect(a.innerHTML).not.toContain("<script");
    expect(a.childElementCount).toBe(2);
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
