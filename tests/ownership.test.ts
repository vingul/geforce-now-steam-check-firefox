// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import {
  findInLibraryFlag,
  findSteamPlayButton,
  isOwned,
  ownedButtonAnchor,
} from "../src/content/ownership";

const APP = 292030;

beforeEach(() => {
  document.body.innerHTML = "";
});

/** Modelled on the live page for an owned game (The Witcher 3): the
 *  "already in your library" flag and the play-stats block with Steam's play
 *  button and hours played sit ABOVE the purchase area, not inside it. The
 *  button text is localized on purpose — detection must not depend on it. */
function ownedPage(href: string, label = "Грати"): string {
  return `
    <div id="global_header"><a href="steam://run/${APP}">header noise</a></div>
    <div class="game_area_already_in_library ds_flag ds_flagged">
      <div class="ds_flag ds_owned_flag">У БІБЛІОТЕЦІ</div>
      Відьмак 3: Дикий Гін — Повне Видання уже є у вашій бібліотеці Steam
    </div>
    <div class="game_area_play_stats">
      <div class="already_owned">
        <a class="btn_blue_steamui btn_medium" href="${href}"><span>${label}</span></a>
        <div class="hours_played">132.8 год всього</div>
        <a href="https://steamcommunity.com/stats/${APP}/achievements">Переглянути мою статистику</a>
      </div>
    </div>
    <div id="game_area_purchase">
      <div class="game_area_purchase_game"><h1>Придбати DLC</h1></div>
    </div>
    <div id="footer"><a href="steam://run/${APP}">footer noise</a></div>`;
}

describe("findSteamPlayButton", () => {
  test("direct steam://run link above the purchase area", () => {
    document.body.innerHTML = ownedPage(`steam://run/${APP}/`);
    const a = findSteamPlayButton(document, APP);
    expect(a).not.toBeNull();
    expect(a!.textContent).toBe("Грати");
    expect(a!.closest(".game_area_play_stats")).not.toBeNull();
  });

  test("javascript:ShowGotSteamModal wrapper around steam://run", () => {
    document.body.innerHTML = ownedPage(`javascript:ShowGotSteamModal( 'steam://run/${APP}' )`, "Play");
    expect(findSteamPlayButton(document, APP)).not.toBeNull();
  });

  test("steam://launch counts too", () => {
    document.body.innerHTML = ownedPage(`steam://launch/${APP}/dialog`);
    expect(findSteamPlayButton(document, APP)).not.toBeNull();
  });

  test("a run link for a different app is not this page's play button", () => {
    document.body.innerHTML = `<div class="game_area_play_stats"><a href="steam://run/999">Play</a></div>`;
    expect(findSteamPlayButton(document, APP)).toBeNull();
  });

  test("an unowned game's cart button is not a play button, whatever it says", () => {
    document.body.innerHTML = `<div id="game_area_purchase"><a class="btn_green_steamui" href="javascript:addToCart( 123 )"><span>Грати</span></a></div>`;
    expect(findSteamPlayButton(document, APP)).toBeNull();
  });

  test("steam://install (free game not yet claimed) is not ownership", () => {
    document.body.innerHTML = `<div id="game_area_purchase"><a href="javascript:ShowGotSteamModal( 'steam://install/${APP}' )"><span>Play Game</span></a></div>`;
    expect(findSteamPlayButton(document, APP)).toBeNull();
  });

  test("run links inside Steam chrome are ignored", () => {
    document.body.innerHTML = `
      <div id="global_header"><a href="steam://run/${APP}">x</a></div>
      <div class="footerv2"><a href="steam://run/${APP}">x</a></div>
      <div id="responsive_page_menu"><a href="steam://run/${APP}">x</a></div>
      <div id="game_area_purchase"><a href="javascript:addToCart(1)">Add to Cart</a></div>`;
    expect(findSteamPlayButton(document, APP)).toBeNull();
  });
});

describe("findInLibraryFlag / isOwned", () => {
  test("the already-in-library flag alone marks the game owned", () => {
    document.body.innerHTML = `
      <div class="game_area_already_in_library ds_flag">
        <span class="ds_flag_text">Half-Life 2 вже є у вашій бібліотеці Steam</span>
      </div>
      <div id="game_area_purchase"><a href="javascript:addToCart(1)">Add to Cart</a></div>`;
    expect(findInLibraryFlag(document)).not.toBeNull();
    expect(findSteamPlayButton(document, APP)).toBeNull();
    expect(isOwned(document, APP)).toBe(true);
  });

  test("the play button alone marks the game owned", () => {
    document.body.innerHTML = `<div class="game_area_play_stats"><a href="steam://run/${APP}">Грати</a></div>`;
    expect(findInLibraryFlag(document)).toBeNull();
    expect(isOwned(document, APP)).toBe(true);
  });

  test("neither signal: not owned", () => {
    document.body.innerHTML = `
      <div id="game_area_purchase">
        <div class="game_area_purchase_game">
          <a class="btn_green_steamui" href="javascript:addToCart( 123 )"><span>Грати</span></a>
        </div>
      </div>`;
    expect(isOwned(document, APP)).toBe(false);
  });

  test("a flag inside Steam chrome does not count", () => {
    document.body.innerHTML = `
      <div id="global_header"><div class="game_area_already_in_library">stray</div></div>
      <div id="game_area_purchase"></div>`;
    expect(isOwned(document, APP)).toBe(false);
  });
});

describe("ownedButtonAnchor", () => {
  test("prefers the play button, as the sibling to follow", () => {
    document.body.innerHTML = ownedPage(`steam://run/${APP}`);
    const anchor = ownedButtonAnchor(document, APP)!;
    expect(anchor.mode).toBe("after");
    expect(anchor.el.tagName).toBe("A");
    expect(anchor.el.textContent).toBe("Грати");
  });

  test("follows the .btn_addtocart wrapper when Steam has one", () => {
    document.body.innerHTML = `<div class="btn_addtocart"><a href="steam://run/${APP}">Play</a></div>`;
    const anchor = ownedButtonAnchor(document, APP)!;
    expect(anchor.mode).toBe("after");
    expect(anchor.el.className).toBe("btn_addtocart");
  });

  test("falls back to appending inside the library flag", () => {
    document.body.innerHTML = `<div class="game_area_already_in_library">owned</div>`;
    const anchor = ownedButtonAnchor(document, APP)!;
    expect(anchor.mode).toBe("append");
    expect(anchor.el.className).toBe("game_area_already_in_library");
  });

  test("null when not owned", () => {
    document.body.innerHTML = `<div id="game_area_purchase"><a href="javascript:addToCart(1)">Buy</a></div>`;
    expect(ownedButtonAnchor(document, APP)).toBeNull();
  });
});
