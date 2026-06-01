// Isolated-world content script. Bridges the page (inject.js) and the
// extension (storage + popup). Runs at document_start.
//
//   page (inject.js)  <-- window.postMessage -->  content.ts  <-->  storage / popup

import {
  MSG,
  STORAGE_KEY,
  STATS_KEY,
  mergeSettings,
  type AbxSettings,
  type AbxStats,
  type Domain,
  DOMAINS,
} from "../shared/config";
import { setLogoSwap } from "./logo";
import { applyCosmetics } from "./cosmetics";

const api = typeof browser !== "undefined" ? browser : chrome;

const host = location.hostname.replace(/^www\./, "");
const matchedDomain = DOMAINS.find((d) => host === d || host.endsWith("." + d)) as
  | Domain
  | undefined;

let currentSettings: AbxSettings | null = null;

// ── Inject the page-world script as early as possible ──
function injectPageScript(): void {
  const el = document.createElement("script");
  el.src = api.runtime.getURL("inject.js");
  el.async = false;
  (document.head || document.documentElement).appendChild(el);
  el.remove(); // tag can go; the script has already executed
}

// ── Push settings to the page ──
function sendConfig(settings: AbxSettings): void {
  // Domain gate: if this domain is disabled, send a fully-disabled config.
  const domainOn = matchedDomain ? settings.domains[matchedDomain] !== false : true;
  const effective: AbxSettings = { ...settings, enabled: settings.enabled && domainOn };
  window.postMessage({ source: MSG.config, payload: effective }, "*");
  // DOM-side features live in the content world, not the page hooks.
  setLogoSwap(effective.enabled && effective.features.restoreLogo);
  applyCosmetics(effective);
}

// ── Stats relay (page -> storage, throttled by the page already) ──
function persistStats(stats: AbxStats): void {
  api.storage.local.set({ [STATS_KEY]: stats });
}

// ── Listen to the page ──
window.addEventListener("message", (ev: MessageEvent) => {
  if (ev.source !== window || !ev.data) return;
  const { source, payload } = ev.data as { source?: string; payload?: unknown };
  if (source === MSG.ready) {
    if (currentSettings) sendConfig(currentSettings);
  } else if (source === MSG.stats && payload) {
    persistStats(payload as AbxStats);
  }
});

// ── React to settings changes from the UI ──
api.storage.onChanged.addListener((changes: Record<string, { newValue?: unknown }>, areaName: string) => {
  if (areaName !== "local" || !changes[STORAGE_KEY]) return;
  currentSettings = mergeSettings(changes[STORAGE_KEY].newValue as Partial<AbxSettings>);
  sendConfig(currentSettings);
});

// ── Boot ──
(async function boot() {
  const stored = await api.storage.local.get(STORAGE_KEY);
  currentSettings = mergeSettings(stored[STORAGE_KEY] as Partial<AbxSettings>);
  injectPageScript();
  // inject.js fires TE_READY when it loads; we answer there. Also send now in
  // case it is already listening.
  sendConfig(currentSettings);
})();
