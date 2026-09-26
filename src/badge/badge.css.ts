/** Namespaced stylesheet for all injected badges. Every selector is prefixed
 *  `gfn-check-` so we never touch markup owned by Steam or other extensions. */
export const BADGE_CSS = `
.gfn-check-banner { display:flex; align-items:center; gap:10px; width:100%;
  box-sizing:border-box; margin:10px 0; padding:11px 14px; border-radius:6px;
  border-left:5px solid; font-size:15px; line-height:1.2;
  font-family:"Motiva Sans",Arial,Helvetica,sans-serif; }
.gfn-check-banner--ok { background:linear-gradient(90deg,#1c3409,#0c1a05);
  border-color:#76b900; color:#cdee87; }
.gfn-check-banner--no { background:#23272c; border-color:#707b85; color:#c6cdd4; }
.gfn-check-banner--unknown { background:#2a2410; border-color:#b8860b; color:#e6cd84; }
.gfn-check-banner-logo { width:24px; height:24px; flex:0 0 auto; }
.gfn-check-banner-logo svg { width:100%; height:100%; display:block; }
.gfn-check-banner-text { flex:1 1 auto; font-weight:bold; }
.gfn-check-banner--ok .gfn-check-banner-text { color:#8fd11a; }
.gfn-check-banner .gfn-check-rtx { flex:0 0 auto; font-size:11px; font-weight:bold;
  padding:2px 8px; border-radius:9px; letter-spacing:.5px; white-space:nowrap;
  background:#76b900; color:#000; }

/* Launch buttons beside Steam's own play button, built to Steam's own
   .btn_medium geometry (32px tall, 15px Motiva Sans, 2px corners, 15px side
   padding, left-to-right gradient) so they read as one more button on that
   row — but tinted GeForce green instead of Steam blue. Explicit colors and no
   underline so Steam's anchor styles cannot restyle them; the hover brightens
   like Steam's. The app button ends in the NVIDIA GeForce NOW lockup, drawn in
   badge.ts, scaled to fit the button's height. */
/* No vertical-align on the row: Steam lays its play-row buttons out inline
   on the baseline, and vertical-align:middle here sat ours visibly lower than
   "Play" on the live page. Left at the default, the row shares their baseline. */
.gfn-check-launch { display:inline-flex; align-items:center; gap:6px; margin-left:6px; }
.gfn-check-launch-btn { display:inline-flex; align-items:center; gap:8px;
  box-sizing:border-box; height:32px; padding:0 15px; border-radius:2px; border:none;
  background:linear-gradient(to right,#6fb414 5%,#3f7a12 95%);
  color:#fff !important; font-size:15px; line-height:32px; font-weight:normal;
  font-family:"Motiva Sans",Arial,Helvetica,sans-serif; white-space:nowrap; cursor:pointer;
  text-decoration:none !important; text-shadow:1px 1px 0 rgba(0,0,0,.3); }
.gfn-check-launch-btn:hover { background:linear-gradient(to right,#8fd11a 5%,#4e9316 95%);
  color:#fff !important; text-decoration:none !important; }
.gfn-check-launch-btn:focus-visible { outline:2px solid #cdee87; outline-offset:2px; }
/* The app button ends in the lockup's charcoal panel, stretched to the button's
   full height; a small right padding keeps the panel's top-right corner clear
   of the button's rounded corner. */
.gfn-check-launch-app { padding-right:6px; }

/* The lockup: the GEFORCE NOW panel at the button's full height, width
   following its aspect ratio; no text-shadow so the SVG is not smeared by the
   button's. */
.gfn-check-lockup { display:inline-flex; align-items:stretch; align-self:stretch;
  height:32px; text-shadow:none; }
.gfn-check-lockup svg { height:100%; width:auto; display:block; }

.gfn-check-pill { display:inline-flex; align-items:center; gap:5px; font-size:12px;
  padding:3px 9px; border-radius:10px; white-space:nowrap; font-weight:bold;
  font-family:Arial,Helvetica,sans-serif; }
.gfn-check-pill--ok { background:#0c1a05; border:1px solid #76b900; color:#8fd11a; }
.gfn-check-pill--no { background:#23272c; border:1px solid #707b85; color:#c6cdd4; }
.gfn-check-pill--unknown { background:#2a2410; border:1px solid #b8860b; color:#e6cd84; }
.gfn-check-dot { width:7px; height:7px; border-radius:50%; flex:0 0 auto; }
.gfn-check-pill--ok .gfn-check-dot { background:#76b900; }
.gfn-check-pill--no .gfn-check-dot { background:#9aa5af; }
.gfn-check-pill--unknown .gfn-check-dot { background:#b8860b; }

/* Wishlist: overlay the pill in the bottom-right corner of the capsule. The
   pill is non-interactive so the capsule stays fully clickable underneath. */
.gfn-check-anchor { position:relative; }
.gfn-check-pill-slot--overlay { position:absolute; right:8px; bottom:8px; z-index:3;
  pointer-events:none; }
.gfn-check-pill-slot--overlay .gfn-check-pill { box-shadow:0 1px 4px rgba(0,0,0,.55); }
/* Profile games list: small thumbnails, so a compact pill tucked into the corner. */
.gfn-check-page-games .gfn-check-pill-slot--overlay { right:4px; bottom:4px; }
.gfn-check-page-games .gfn-check-pill { font-size:11px; padding:2px 7px; gap:4px; }
.gfn-check-page-games .gfn-check-dot { width:6px; height:6px; }
`;
