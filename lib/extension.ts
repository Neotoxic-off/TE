// Browser-extension storage access + React hooks for the UI pages.
// Works under both Firefox (`browser`) and Chromium (`chrome`). Falls back to
// localStorage when opened outside an extension context (e.g. `next dev`).

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  STORAGE_KEY,
  STATS_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  mergeSettings,
  type AbxSettings,
  type AbxStats,
} from "../src/shared/config";

type StorageArea = {
  get(keys: string | string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

interface ExtApi {
  storage: {
    local: StorageArea;
    onChanged: {
      addListener(cb: (changes: Record<string, { newValue?: unknown }>, area: string) => void): void;
      removeListener(cb: (changes: Record<string, { newValue?: unknown }>, area: string) => void): void;
    };
  };
}

function getApi(): ExtApi | null {
  if (typeof globalThis === "undefined") return null;
  const g = globalThis as unknown as { browser?: ExtApi; chrome?: ExtApi };
  const api = g.browser ?? g.chrome;
  if (api?.storage?.local) {
    // chrome.storage uses callbacks in MV2-Chrome; Firefox + MV3 return promises.
    return api;
  }
  return null;
}

// ── localStorage fallback (dev mode in the browser) ──
const fallback = {
  get(keys: string[]) {
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(k) : null;
      if (raw) out[k] = JSON.parse(raw);
    }
    return Promise.resolve(out);
  },
  set(items: Record<string, unknown>) {
    if (typeof localStorage !== "undefined") {
      for (const [k, v] of Object.entries(items)) localStorage.setItem(k, JSON.stringify(v));
      window.dispatchEvent(new CustomEvent("te-fallback-change", { detail: items }));
    }
    return Promise.resolve();
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<AbxSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const api = getApi();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const store = api ? api.storage.local : fallback;
      const data = await store.get([STORAGE_KEY]);
      if (alive) {
        setSettings(mergeSettings(data[STORAGE_KEY] as Partial<AbxSettings>));
        setLoaded(true);
      }
    };
    void load();

    if (api) {
      const onChange = (changes: Record<string, { newValue?: unknown }>, area: string) => {
        if (area === "local" && changes[STORAGE_KEY]) {
          setSettings(mergeSettings(changes[STORAGE_KEY].newValue as Partial<AbxSettings>));
        }
      };
      api.storage.onChanged.addListener(onChange);
      return () => {
        alive = false;
        api.storage.onChanged.removeListener(onChange);
      };
    }
    const onFb = () => void load();
    window.addEventListener("te-fallback-change", onFb);
    return () => {
      alive = false;
      window.removeEventListener("te-fallback-change", onFb);
    };
  }, [api]);

  const update = useCallback(
    (patch: Partial<AbxSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        const store = api ? api.storage.local : fallback;
        void store.set({ [STORAGE_KEY]: next });
        return next;
      });
    },
    [api]
  );

  const setFeature = useCallback(
    (key: string, value: boolean) =>
      setSettings((prev) => {
        const next = { ...prev, features: { ...prev.features, [key]: value } };
        const store = api ? api.storage.local : fallback;
        void store.set({ [STORAGE_KEY]: next });
        return next;
      }),
    [api]
  );

  const setDomain = useCallback(
    (domain: string, value: boolean) =>
      setSettings((prev) => {
        const next = { ...prev, domains: { ...prev.domains, [domain]: value } };
        const store = api ? api.storage.local : fallback;
        void store.set({ [STORAGE_KEY]: next });
        return next;
      }),
    [api]
  );

  const reset = useCallback(() => {
    const store = api ? api.storage.local : fallback;
    void store.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
    setSettings(DEFAULT_SETTINGS);
  }, [api]);

  return { settings, loaded, update, setFeature, setDomain, reset, isExtension: !!api };
}

export function useStats() {
  const [stats, setStats] = useState<AbxStats>(DEFAULT_STATS);
  const api = getApi();

  useEffect(() => {
    let alive = true;
    const store = api ? api.storage.local : fallback;
    void store.get([STATS_KEY]).then((d) => {
      if (alive && d[STATS_KEY]) setStats(d[STATS_KEY] as AbxStats);
    });

    if (api) {
      const onChange = (changes: Record<string, { newValue?: unknown }>, area: string) => {
        if (area === "local" && changes[STATS_KEY]) {
          setStats(changes[STATS_KEY].newValue as AbxStats);
        }
      };
      api.storage.onChanged.addListener(onChange);
      return () => {
        alive = false;
        api.storage.onChanged.removeListener(onChange);
      };
    }
    return () => {
      alive = false;
    };
  }, [api]);

  return stats;
}
