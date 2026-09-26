import { runListPage } from "./list-page";
import { GAMES_PAGE_CLASS } from "../badge/badge";

// The profile's games list (steamcommunity.com/id/<vanity>/games and
// /profiles/<id>/games): one row per owned game, a pill on each thumbnail. The
// rows derive exactly as the wishlist's do — a `/app/<id>` store link plus an
// `/apps/<id>/` capsule image per game — so the behaviour is shared with it in
// list-page.ts. The thumbnails here are smaller than wishlist capsules, so the
// document is tagged for the compact overlay variant in badge.css.ts.
document.documentElement.classList.add(GAMES_PAGE_CLASS);
runListPage("games");
