/** The NVIDIA GeForce NOW lockup, from the vector logo supplied for this fork
 *  (Adobe Illustrator export, 800×600, cropped here to the mark's own bounds).
 *
 *  The source is monochrome: one outline path draws the whole parallelogram
 *  with the eye window, the NVIDIA letters and the right-hand panel knocked
 *  out as holes, and separate paths draw the eye, the GEFORCE NOW letters and
 *  the letter counters on top. Recolouring it to the brand lockup is a matter
 *  of what shows through those holes, so it is layered: a charcoal panel under
 *  everything, a lime pad under the eye window, the outline in lime, the eye
 *  in black, the counters back in lime, and the GEFORCE NOW letters in white.
 *
 *  Built with createElementNS, never innerHTML, per the repo's injection rules.
 *  NVIDIA, GeForce and GeForce NOW are trademarks of NVIDIA Corporation; the
 *  mark identifies the service the buttons launch. */

const SVG_NS = "http://www.w3.org/2000/svg";

/** The mark's bounds inside the 800×600 export. */
export const LOCKUP_VIEWBOX = "108 221 584 157";

const LIME = "#76b900";
const CHARCOAL = "#1a1a1a";

const OUTLINE = "M108.4,221.9v155.4h541.1l41.6-155.4H108.4z M183,259.5v-8.4h59.1v62.4H183v-7.3c-25.9-2.4-35.2-29.2-35.2-29.2 S164.2,261,183,259.5L183,259.5z M163.3,348.1h-6.5v-10.3c0-3.3-0.4-5.1-1.4-6.2c-0.8-0.9-2.1-1.3-3.8-1.3h-5.2v17.8h-6.7v-23.5 h11.9c5.8,0,11.7,1.3,11.7,10.5L163.3,348.1z M181.4,348.1h-9.6l-7.6-23.5h7.2l5.3,18.6l5.5-18.6h6.8L181.4,348.1z M198.4,348.1 h-6.6v-23.4h6.6V348.1z M222.9,345c-2,2.2-3.9,3.1-9.6,3.1h-10.8v-23.4h9.3c5.3,0,8.8,0.6,11.3,3.9c1.4,1.8,2.2,4.8,2.2,8.1 C225.2,340.3,224.3,343.6,222.9,345L222.9,345z M234.9,348.1h-6.6v-23.4h6.6V348.1z M257.9,348.1l-1.4-4.1h-10.9l-1.4,4.1h-6.5 l9.3-23.4h8.9l9.4,23.5L257.9,348.1z M269.6,350c-1.8,0-3.3-1.5-3.3-3.3c0-1.8,1.5-3.3,3.3-3.3c1.8,0,3.3,1.5,3.3,3.3l0,0 C272.9,348.6,271.5,350.1,269.6,350C269.7,350.1,269.7,350.1,269.6,350L269.6,350z M643.9,369.5H290l37.5-139.8h353.8L643.9,369.5z";

const EYE: readonly string[] = [
  "M235.1,290.7c-1.5-1.5-8.9-5-10.7-6.5c-10.9,9.4-22.1,17.3-37.7,17.3c-1.2,0-2.4-0.1-3.6-0.2v4.8c1.2,0.1,2.5,0.2,3.8,0.2 C200.6,306.4,224.7,299.4,235.1,290.7z",
  "M184.7,264c15.4-0.5,25.5,13.3,25.5,13.3s-10.9,15.2-22.6,15.2c-1.5,0-3.1-0.2-4.6-0.7v4.4c1.4,0.3,2.9,0.4,4.3,0.4 c16.7,0,32.8-19.5,32.8-19.5s-14-18.3-35.4-17.6c-0.6,0-1.1,0.1-1.7,0.1v4.6C183.6,264,184.1,264,184.7,264z",
  "M163.2,279.5c3.9-3.9,9-6.4,14.5-7V268c-8,0.6-15.3,4.6-20.2,11c0,0,5.1,16.6,20.2,18.5v-4.1 C166.3,291.3,163.2,279.5,163.2,279.5z",
  "M183,274.6c-6-0.7-10.7,4.9-10.7,4.9s2.6,9.5,10.7,12.2L183,274.6L183,274.6z",
  "M193.9,284l8-6.8c0,0-5.9-7.7-15.7-7.7c-1,0-2.1,0.1-3.1,0.2v4.9C189.1,275.3,190.3,278,193.9,284z",
];

/** Counters of the knocked-out NVIDIA letters (the D's bowl, the A's
 *  triangle), which the export fills back in and so must be lime here. */
const COUNTERS: readonly string[] = [
  "M211.9,329.8H209v13.3h2.9c4.1,0,6.8-1.9,6.8-6.7S216,329.8,211.9,329.8z",
];
const A_COUNTER = "247,339.9 255.2,339.9 251.2,329";

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

function rect(doc: Document, x: number, y: number, w: number, h: number, fill: string): SVGRectElement {
  const el = doc.createElementNS(SVG_NS, "rect");
  el.setAttribute("x", String(x));
  el.setAttribute("y", String(y));
  el.setAttribute("width", String(w));
  el.setAttribute("height", String(h));
  el.setAttribute("fill", fill);
  return el;
}

export function renderGfnLockupSvg(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", LOCKUP_VIEWBOX);
  svg.setAttribute("aria-hidden", "true");
  // Charcoal shows through every hole: the right panel and the NVIDIA letters.
  svg.appendChild(rect(doc, 108, 221, 584, 157, CHARCOAL));
  // Lime pad under the eye window only (the window extends left of its frame
  // to hold the eye's outer curve, so the pad is wider than the frame's cut).
  svg.appendChild(rect(doc, 130, 245, 125, 73, LIME));
  svg.appendChild(path(doc, OUTLINE, LIME));
  for (const d of EYE) svg.appendChild(path(doc, d, "#000"));
  for (const d of COUNTERS) svg.appendChild(path(doc, d, LIME));
  const tri = doc.createElementNS(SVG_NS, "polygon");
  tri.setAttribute("points", A_COUNTER);
  tri.setAttribute("fill", LIME);
  svg.appendChild(tri);
  for (const d of GEFORCE_NOW) svg.appendChild(path(doc, d, "#fff"));
  return svg;
}
