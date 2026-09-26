/** The GeForce NOW panel from the vector logo supplied for this fork (Adobe
 *  Illustrator export, 800×600): the charcoal parallelogram carrying GEFORCE
 *  NOW in white, and nothing else — the NVIDIA eye and wordmark that sit to
 *  its left in the full lockup are deliberately left out. It is rendered
 *  *onto* the green launch button as its tail, running the button's full
 *  height with no gap above or below.
 *
 *  The source's own panel is a hole in its outline path, inset from the mark's
 *  top and bottom, so the panel here is a polygon on the same slant extended to
 *  the full height of the viewBox; the GEFORCE NOW letter paths are used as
 *  they are.
 *
 *  Built with createElementNS, never innerHTML, per the repo's injection rules.
 *  GeForce and GeForce NOW are trademarks of NVIDIA Corporation; the mark
 *  identifies the service the button launches. */

const SVG_NS = "http://www.w3.org/2000/svg";

/** The panel's own bounds: its bottom-left to top-right corner horizontally,
 *  the source mark's top and bottom vertically. */
export const LOCKUP_VIEWBOX = "287.9 221.9 395.5 155.4";

const CHARCOAL = "#1a1a1a";

/** The panel on the source's slant (37.5 in x per 139.8 in y), extended from
 *  the source's inset edges (y 229.7–369.5) to the full height. */
const PANEL_POINTS = "329.6,221.9 683.4,221.9 641.8,377.3 287.9,377.3";

const GEFORCE_NOW: readonly string[] = [
  "M360.8,304.7l18.7,27.5v-27.5h8v41.4h-8.3l-18.7-27.4v27.4h-8v-41.4H360.8z",
  "M394.3,311.6c0-3.8,3.1-6.9,6.9-6.9h20.8c3.8,0,6.9,3.1,6.9,6.9v27.6c0,3.8-3.1,6.9-6.8,6.9c0,0,0,0,0,0h-20.8 c-3.8,0-6.9-3.1-6.9-6.8c0,0,0,0,0,0L394.3,311.6z M418.7,338.7c1.1,0,2.1-0.9,2.1-2c0,0,0,0,0,0v-22.5c0-1.2-0.9-2.1-2-2.2 c0,0,0,0,0,0h-14.3c-1.2,0-2.1,1-2.1,2.1c0,0,0,0,0,0v22.5c0,1.1,0.9,2.1,2,2.1c0,0,0,0,0,0H418.7z",
  "M458.1,304.7h6.8l8.5,28.2l7.6-28.2h8.2l-12.5,41.4h-7l-8.4-26.7l-7.9,26.7h-7.1l-13.3-41.4h9l8.1,28.2L458.1,304.7z",
  "M497.4,304.7v0.7h-1.8v5h-0.7v-5H493v-0.7H497.4z M502.8,304.7h0.8v5.7h-0.7v-4.4l-1.7,2.8h-0.6l-1.6-2.7v4.3h-0.7v-5.7h0.7 l1.9,3.3L502.8,304.7z",
  "M352.5,260c0-3.8,3.1-6.9,6.9-6.9h26.2v7.5h-22.9c-1.2,0-2.1,0.9-2.2,2.1V282c0,0.5,0.2,1.1,0.6,1.4l2.9,2.9 c0.4,0.4,0.9,0.6,1.5,0.6h11.1c1.1,0,2.1-0.9,2.1-2c0,0,0,0,0,0v-7.4h-9.7V270h18v17.6c0,3.8-3.1,6.9-6.9,6.9h-18.5 c-0.6,0-1.1-0.2-1.5-0.6l-7-7c-0.4-0.4-0.6-0.9-0.6-1.4V260z",
  "M402.2,260.4v9.7H419v7.3h-16.8v9.6h21v7.3h-29v-41.4h29v7.3H402.2z",
  "M437.3,294.5h-8.1v-41.4h29v7.3h-20.9v9.7h16.8v7.3h-16.8V294.5z",
  "M463.9,260c0-3.8,3.1-6.9,6.9-6.9h20.8c3.8,0,6.9,3.1,6.9,6.9v27.6c0,3.8-3.1,6.9-6.9,6.9c0,0,0,0,0,0h-20.8 c-3.8,0-6.9-3.1-6.9-6.8c0,0,0,0,0,0L463.9,260z M488.3,287.1c1.1,0,2.1-0.9,2.1-2c0,0,0,0,0,0v-22.5c0-1.2-0.9-2.1-2.1-2.1H474 c-1.2,0-2.1,1-2.1,2.1c0,0,0,0,0,0v22.5c0,1.1,0.9,2.1,2,2.1c0,0,0,0,0,0H488.3z",
  "M539.7,294.5h-8.6l-10.2-16.9h-7.6v16.9h-8v-41.4h24.8c3.8,0,6.9,3.1,6.9,6.9c0,0,0,0,0,0v10.7c0,3.8-3.1,6.9-6.9,6.9h-0.4 L539.7,294.5z M513.3,270.3h13.5c1.1,0,2.1-0.9,2.1-2c0,0,0,0,0,0v-5.6c0-1.2-0.9-2.1-2.1-2.1c0,0,0,0,0,0h-13.5L513.3,270.3z",
  "M571.7,260.4h-17.6c-1.1,0-2.1,0.9-2.1,2.1v22.6c0,1.1,0.9,2.1,2,2.1c0,0,0,0,0,0h17.6v7.3H551c-3.8,0-6.9-3.1-6.9-6.9V260 c0-3.8,3.1-6.9,6.9-6.9c0,0,0,0,0,0h20.7V260.4z",
  "M586.4,260.4v9.7h16.8v7.3h-16.8v9.6h20.9v7.3h-29v-41.4h29v7.3H586.4z",
];

function path(doc: Document, d: string, fill: string): SVGPathElement {
  const el = doc.createElementNS(SVG_NS, "path");
  el.setAttribute("d", d);
  el.setAttribute("fill", fill);
  return el;
}

export function renderGfnLockupSvg(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", LOCKUP_VIEWBOX);
  svg.setAttribute("aria-hidden", "true");
  const panel = doc.createElementNS(SVG_NS, "polygon");
  panel.setAttribute("points", PANEL_POINTS);
  panel.setAttribute("fill", CHARCOAL);
  svg.appendChild(panel);
  for (const d of GEFORCE_NOW) svg.appendChild(path(doc, d, "#fff"));
  return svg;
}
