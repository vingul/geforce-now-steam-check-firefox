// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from "vitest";
import { findInLibraryFlag, findSteamPlayButton, isOwned } from "../src/content/ownership";

beforeEach(() => {
  document.body.innerHTML = "";
});

/** Trimmed from a real store page for an owned game. The button text is
 *  localized on purpose — detection must not depend on it. */
function ownedPurchaseArea(href: string, label = "Грати"): string {
  return `
    <div id="game_area_purchase">
      <div class="game_area_purchase_game_wrapper">
        <div class="game_area_purchase_game">
          <h1>Грати в Half-Life 2</h1>
          <div class="game_purchase_action">
            <div class="game_purchase_action_bg">
              <div class="btn_addtocart">
                <a class="btn_green_steamui btn_medium" href="${href}"><span>${label}</span></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

describe("findSteamPlayButton", () => {
  test("direct steam://run link", () => {
    document.body.innerHTML = ownedPurchaseArea("steam://run/220/");
    const a = findSteamPlayButton(document);
    expect(a).not.toBeNull();
    expect(a!.textContent).toBe("Грати");
  });

  test("javascript:ShowGotSteamModal wrapper around steam://run", () => {
    document.body.innerHTML = ownedPurchaseArea(
      "javascript:ShowGotSteamModal( 'steam://run/220' )",
      "Play Game",
    );
    expect(findSteamPlayButton(document)).not.toBeNull();
  });

  test("steam://launch counts too", () => {
    document.body.innerHTML = ownedPurchaseArea("steam://launch/220/dialog");
    expect(findSteamPlayButton(document)).not.toBeNull();
  });

  test("an unowned game's cart button is not a play button, whatever it says", () => {
    document.body.innerHTML = ownedPurchaseArea("javascript:addToCart( 123 )", "Play Game");
    expect(findSteamPlayButton(document)).toBeNull();
  });

  test("steam://install (free game not yet claimed) is not ownership", () => {
    document.body.innerHTML = ownedPurchaseArea(
      "javascript:ShowGotSteamModal( 'steam://install/570' )",
      "Play Game",
    );
    expect(findSteamPlayButton(document)).toBeNull();
  });

  test("a run link outside the purchase area does not count", () => {
    document.body.innerHTML = `
      <div id="promo"><a href="steam://run/220">Launch</a></div>
      <div id="game_area_purchase"><a href="javascript:addToCart(1)">Add to Cart</a></div>`;
    expect(findSteamPlayButton(document)).toBeNull();
  });

  test("no purchase area at all", () => {
    document.body.innerHTML = `<div class="page_title_area">Title</div>`;
    expect(findSteamPlayButton(document)).toBeNull();
  });
});

describe("findInLibraryFlag / isOwned", () => {
  test("the already-in-library flag alone marks the game owned", () => {
    document.body.innerHTML = `
      <div id="game_area_purchase">
        <div class="game_area_already_in_library ds_flag">
          <span class="ds_flag_text">Half-Life 2 вже є у вашій бібліотеці Steam</span>
        </div>
        <a href="javascript:addToCart(1)">Add to Cart</a>
      </div>`;
    expect(findInLibraryFlag(document)).not.toBeNull();
    expect(findSteamPlayButton(document)).toBeNull();
    expect(isOwned(document)).toBe(true);
  });

  test("the play button alone marks the game owned", () => {
    document.body.innerHTML = ownedPurchaseArea("steam://run/220/");
    expect(findInLibraryFlag(document)).toBeNull();
    expect(isOwned(document)).toBe(true);
  });

  test("neither signal: not owned", () => {
    document.body.innerHTML = `
      <div id="game_area_purchase">
        <div class="game_area_purchase_game">
          <a class="btn_green_steamui" href="javascript:addToCart( 123 )"><span>Грати</span></a>
        </div>
      </div>`;
    expect(isOwned(document)).toBe(false);
  });

  test("the flag outside the purchase area does not count", () => {
    document.body.innerHTML = `
      <div class="game_area_already_in_library">stray</div>
      <div id="game_area_purchase"></div>`;
    expect(isOwned(document)).toBe(false);
  });
});
