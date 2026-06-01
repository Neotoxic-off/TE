// Replaces X's brand mark with the classic Twitter bird, in the page DOM.
// Runs in the isolated content-script world (shared DOM). X re-renders its
// header logo on navigation, so a MutationObserver re-applies the swap.
//
// Matching is structural (the logo lives inside the Home link / aria-label="X")
// with a `d`-prefix fallback, because X ships several logo path variants by
// size and matching `d` alone is brittle.

// Anchors that contain the brand mark SVG.
const LOGO_CONTAINERS = [
  'a[aria-label="X"]',
  'a[href="/home"][role="link"]',
  'h1[role="heading"] a[href="/home"]',
];

// Known X logo path prefixes (different sizes / build variants).
const X_PATH_PREFIXES = ["M21.742 21.75", "M18.244 2.25", "M13.3174 10.7749", "M2.34"];

// Classic Twitter bird, 0 0 24 24 viewBox.
const BIRD_PATH =
  "M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578 9.3 9.3 0 0 1-2.958 1.13 4.66 4.66 0 0 0-7.938 4.25 13.229 13.229 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.824a4.647 4.647 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.737 4.568 4.692 4.692 0 0 1-2.104.08 4.661 4.661 0 0 0 4.352 3.234 9.348 9.348 0 0 1-5.786 1.995 9.5 9.5 0 0 1-1.112-.065 13.175 13.175 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.47 9.47 0 0 0 2.323-2.41z";

const BIRD_BLUE = "#1d9bf0";
const MARK = "data-te-bird"; // marks paths we've already swapped

let observer: MutationObserver | null = null;
let enabled = false;
let scheduled = false;

function looksLikeX(d: string): boolean {
  return X_PATH_PREFIXES.some((p) => d.startsWith(p));
}

function swapPath(p: SVGPathElement): void {
  if (p.hasAttribute(MARK)) return;
  const d = p.getAttribute("d") || "";
  p.dataset.teOriginalD = d;
  p.setAttribute("d", BIRD_PATH);
  p.setAttribute("fill", BIRD_BLUE);
  p.setAttribute(MARK, "1");
  // Ensure the parent <svg> viewBox fits the bird (X marks are also 0 0 24 24,
  // but force it in case a variant differs).
  const svg = p.closest("svg");
  if (svg && svg.getAttribute("viewBox") !== "0 0 24 24") {
    svg.dataset.teOriginalVb = svg.getAttribute("viewBox") || "";
    svg.setAttribute("viewBox", "0 0 24 24");
  }
}

function swapIn(root: ParentNode): void {
  // 1) Structural: any path inside a known logo container.
  for (const sel of LOGO_CONTAINERS) {
    root.querySelectorAll<HTMLElement>(sel).forEach((a) => {
      a.querySelectorAll<SVGPathElement>("svg path:not([" + MARK + "])").forEach(swapPath);
    });
  }
  // 2) Fallback: any unmarked path whose `d` matches a known X signature.
  root.querySelectorAll<SVGPathElement>("svg path:not([" + MARK + "])").forEach((p) => {
    if (looksLikeX(p.getAttribute("d") || "")) swapPath(p);
  });
}

function revert(): void {
  document.querySelectorAll<SVGPathElement>("path[" + MARK + "]").forEach((p) => {
    const orig = p.dataset.teOriginalD;
    if (orig) p.setAttribute("d", orig);
    p.removeAttribute("fill");
    p.removeAttribute(MARK);
    delete p.dataset.teOriginalD;
    const svg = p.closest("svg");
    if (svg?.dataset.teOriginalVb !== undefined) {
      if (svg.dataset.teOriginalVb) svg.setAttribute("viewBox", svg.dataset.teOriginalVb);
      delete svg.dataset.teOriginalVb;
    }
  });
}

function schedule(): void {
  if (scheduled || !enabled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    if (enabled) swapIn(document);
  });
}

/** Enable/disable the logo swap. Safe to call repeatedly with settings updates. */
export function setLogoSwap(on: boolean): void {
  if (on === enabled) {
    if (on) schedule();
    return;
  }
  enabled = on;

  if (!on) {
    observer?.disconnect();
    observer = null;
    revert();
    return;
  }

  const start = () => {
    swapIn(document);
    observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
}
