// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import { findRows, paint, ANCHOR_CLASS, OVERLAY_CLASS, PILL_SLOT } from "../src/content/wishlist-rows";

beforeEach(() => {
  document.body.innerHTML = "";
});

/** Modelled on the profile games list (steamcommunity.com/id/<vanity>/games),
 *  a React list with hashed class names: per game, a capsule thumbnail from the
 *  store CDN and a title link to the store page, plus hours and achievement
 *  links that name no app. Community chrome (header, footer) links the store
 *  too and must never yield a row. */
function gamesPage(): string {
  const game = (id: number, title: string) => `
    <div class="_3qRQw">
      <a href="https://store.steampowered.com/app/${id}"><img src="https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/capsule_184x69.jpg?t=1"></a>
      <div class="_2xkLZ">
        <a class="_1t5wG" href="https://store.steampowered.com/app/${id}">${title}</a>
        <span>132.8 hrs on record</span>
        <a href="https://steamcommunity.com/id/someone/stats/${id}/achievements">Achievements</a>
      </div>
    </div>`;
  return `
    <div id="global_header"><a href="https://store.steampowered.com/app/570/">Featured</a></div>
    <div id="responsive_page_menu"><a href="https://store.steampowered.com/app/440/">TF2</a></div>
    <div class="_1FdOV">${game(292030, "The Witcher 3")}${game(1091500, "Cyberpunk 2077")}</div>
    <div id="footer"><a href="https://store.steampowered.com/app/620/">Portal 2</a></div>`;
}

describe("profile games list rows", () => {
  test("one row per game, none for chrome", () => {
    document.body.innerHTML = gamesPage();
    const rows = findRows(document.body);
    expect([...rows.keys()].sort((a, b) => a - b)).toEqual([292030, 1091500]);
    expect(rows.get(292030)!.className).toBe("_3qRQw");
    expect(rows.get(292030)!.textContent).toContain("The Witcher 3");
    expect(rows.get(1091500)!.textContent).toContain("Cyberpunk 2077");
  });

  test("the pill overlays the thumbnail", () => {
    document.body.innerHTML = gamesPage();
    const rows = findRows(document.body);
    paint(document, rows, () => document.createElement("span"), () => "supported:std::");
    const thumb = document.querySelector('img[src*="/apps/292030/"]')!;
    const host = thumb.parentElement!;
    expect(host.classList.contains(ANCHOR_CLASS)).toBe(true);
    const slot = host.querySelector(`.${PILL_SLOT}`)!;
    expect(slot).not.toBeNull();
    expect(slot.classList.contains(OVERLAY_CLASS)).toBe(true);
    expect(document.querySelectorAll(`.${PILL_SLOT}`).length).toBe(2);
  });
});
