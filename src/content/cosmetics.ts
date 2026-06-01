// CSS-based cosmetic options applied to the X.com DOM from the content script.
// One <style> element, rebuilt whenever settings change. No DOM walking — pure
// CSS keeps it cheap and resilient to re-renders.

import type { AbxSettings } from "../shared/config";

const STYLE_ID = "te-cosmetics";

const RULES: Record<string, string> = {
  hideGrok: [
    'a[href="/i/grok"]',
    'a[href^="/i/grok"]',
    '[data-testid="grok"]',
    '[data-testid="GrokDrawer"]',
    'button[aria-label="Grok actions"]',
  ].join(",") + "{display:none !important}",

  hidePremium: [
    'a[href="/i/premium_sign_up"]',
    'a[href^="/i/premium"]',
    'a[href="/i/verified-choose"]',
    '[data-testid="premium-signup-tab"]',
    '[data-testid="super-upsell-UpsellCardRendered"]',
  ].join(",") + "{display:none !important}",
};

export function applyCosmetics(settings: AbxSettings): void {
  const on = settings.enabled;
  let css = "";
  if (on) {
    if (settings.features.hideGrok) css += RULES.hideGrok;
    if (settings.features.hidePremium) css += RULES.hidePremium;
  }

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!css) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}
