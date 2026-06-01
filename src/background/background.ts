// Background (non-persistent). Seeds default settings on install and keeps the
// toolbar badge in sync with live stats.

import {
  STORAGE_KEY,
  STATS_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  mergeSettings,
  type AbxStats,
} from "../shared/config";

const api = typeof browser !== "undefined" ? browser : chrome;

api.runtime.onInstalled.addListener(async () => {
  const stored = await api.storage.local.get([STORAGE_KEY, STATS_KEY]);
  await api.storage.local.set({
    [STORAGE_KEY]: mergeSettings(stored[STORAGE_KEY]),
    [STATS_KEY]: stored[STATS_KEY] ?? DEFAULT_STATS,
  });
});

function setBadge(stats: AbxStats): void {
  const n = stats.flagsPatched + stats.mediaUnblurred;
  const text = n > 999 ? "999+" : n > 0 ? String(n) : "";
  const action = api.action ?? (api as any).browserAction;
  action?.setBadgeText?.({ text });
  action?.setBadgeBackgroundColor?.({ color: stats.healthy ? "#1d9bf0" : "#ff3333" });
}

api.storage.onChanged.addListener((changes: Record<string, { newValue?: unknown }>, area: string) => {
  if (area !== "local") return;
  if (changes[STATS_KEY]) setBadge(changes[STATS_KEY].newValue as AbxStats);
  if (changes[STORAGE_KEY]) {
    const s = mergeSettings(changes[STORAGE_KEY].newValue as Partial<typeof DEFAULT_SETTINGS>);
    const action = api.action ?? (api as any).browserAction;
    if (!s.enabled) action?.setBadgeText?.({ text: "off" });
  }
});

// Reset badge baseline so it doesn't carry across browser restarts.
void (async () => {
  const s = await api.storage.local.get(STATS_KEY);
  setBadge((s[STATS_KEY] as AbxStats) ?? DEFAULT_STATS);
})();
