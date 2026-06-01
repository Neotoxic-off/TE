// Twitter Enhanced — page-world engine.
// Injected into the X.com page context so it can hook fetch / JSON.parse / XHR
// / globals before the app reads them. Receives config from the content script
// via window.postMessage and reports live stats back the same way.
//
// Webpack chunk interception: forces feature flags and clears sensitive-media
// markers on the data as it flows through the app.

import {
  MSG,
  resolveFlagOverrides,
  type AbxSettings,
  DEFAULT_SETTINGS,
} from "../shared/config";

(function () {
  "use strict";

  // ── Mutable runtime config (defaults until first TE_CONFIG arrives) ──
  let settings: AbxSettings = DEFAULT_SETTINGS;
  let flagOverrides: Record<string, boolean> = resolveFlagOverrides(settings);

  const SENSITIVE_FALSE_KEYS = new Set([
    "possibly_sensitive",
    "possibly_sensitive_editable",
    "nsfw_user",
    "nsfw_admin",
  ]);

  const SKIP_KEYS = new Set(["window", "document", "parent", "top"]);
  const MAX_DEPTH = 40;

  // ── State ──
  let healthy = true;
  let flagsPatched = 0;
  let mediaUnblurred = 0;
  let lastHit = "—";
  let visited = new WeakSet<object>();

  // ── Stats reporting (throttled postMessage to content script) ──
  let statsTimer: number | null = null;
  function reportStats(source?: string) {
    if (source) lastHit = source;
    if (statsTimer != null) return;
    statsTimer = window.setTimeout(() => {
      statsTimer = null;
      window.postMessage(
        {
          source: MSG.stats,
          payload: { flagsPatched, mediaUnblurred, lastHit, healthy, updatedAt: Date.now() },
        },
        "*"
      );
    }, 120);
  }

  // ── Safe object guard ──
  function isPatchable(val: unknown): val is Record<string, unknown> {
    return (
      !!val &&
      typeof val === "object" &&
      !visited.has(val as object) &&
      !(val instanceof Node) &&
      val !== window &&
      val !== document
    );
  }

  // ── Core patcher ──
  function patch(obj: unknown, depth = 0): void {
    if (!settings.enabled) return;
    if (!isPatchable(obj) || depth > MAX_DEPTH) return;
    visited.add(obj as object);

    applyFlags(obj);
    if (settings.features.showSensitive) clearSensitive(obj);
    if (settings.features.bypassAgeGate) spoofBirthdate(obj);

    for (const key of Object.keys(obj)) {
      if (SKIP_KEYS.has(key)) continue;
      try {
        const child = (obj as Record<string, unknown>)[key];
        if (isPatchable(child)) patch(child, depth + 1);
      } catch {
        // property access throws → skip
      }
    }
  }

  function applyFlags(obj: Record<string, unknown>): void {
    for (const key in flagOverrides) {
      try {
        if (!(key in obj) || obj[key] === undefined) continue;
        const current = obj[key];
        if (current && typeof current === "object" && "value" in current) {
          const c = current as { value: unknown };
          if (c.value !== flagOverrides[key]) {
            c.value = flagOverrides[key];
            flagsPatched++;
          }
        } else if (obj[key] !== flagOverrides[key]) {
          obj[key] = flagOverrides[key];
          flagsPatched++;
        }
      } catch {
        // read-only / proxy → skip
      }
    }
  }

  function clearSensitive(obj: Record<string, unknown>): void {
    for (const key of SENSITIVE_FALSE_KEYS) {
      try {
        if (obj[key] === true) {
          obj[key] = false;
          if (key === "possibly_sensitive") mediaUnblurred++;
        }
      } catch {
        /* ignore */
      }
    }
    try {
      if (obj.sensitive_media_warning) {
        obj.sensitive_media_warning = null;
        mediaUnblurred++;
      }
      if (obj.mediaVisibilityResults || obj.media_visibility_results) {
        obj.mediaVisibilityResults = undefined;
        obj.media_visibility_results = undefined;
      }
      if ("display_sensitive_media" in obj && obj.display_sensitive_media !== true) {
        obj.display_sensitive_media = true;
      }
    } catch {
      /* ignore */
    }
  }

  function spoofBirthdate(obj: Record<string, unknown>): void {
    try {
      if (obj.birthdate && typeof obj.birthdate === "object") {
        Object.assign(obj.birthdate as object, {
          year: settings.birthYear,
          month: 1,
          day: 1,
        });
      }
    } catch {
      /* ignore */
    }
  }

  // ── Hook 1: globals (__INITIAL_STATE__, __META_DATA__) ──
  function hookGlobal(name: string): void {
    let stored = (window as unknown as Record<string, unknown>)[name];
    if (stored && typeof stored === "object") {
      try {
        patch(stored);
      } catch {
        healthy = false;
      }
      reportStats(name);
    }
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: () => stored,
        set(newValue) {
          try {
            patch(newValue);
          } catch {
            healthy = false;
          }
          stored = newValue;
          reportStats(name);
        },
      });
    } catch {
      // already non-configurable → existing value was patched above
    }
  }

  // ── Install hooks immediately (before app code runs) ──
  hookGlobal("__INITIAL_STATE__");
  hookGlobal("__META_DATA__");

  const nativeAssign = Object.assign;
  Object.assign = function (target: any, ...sources: any[]) {
    const result = nativeAssign(target, ...sources);
    if (
      target &&
      typeof target === "object" &&
      (target.featureSwitch || target.entities || target.users)
    ) {
      patch(target);
      reportStats("Object.assign");
    }
    return result;
  } as typeof Object.assign;

  const nativeParse = JSON.parse;
  JSON.parse = function (this: unknown, ...args: Parameters<typeof JSON.parse>) {
    const result = nativeParse.apply(this, args);
    if (
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      ((result as any).data ||
        (result as any).errors ||
        (result as any).featureSwitch ||
        (result as any).globalObjects)
    ) {
      patch(result);
      reportStats("JSON.parse");
    }
    return result;
  };

  const nativeFetch = window.fetch;
  if (typeof nativeFetch === "function") {
    window.fetch = function (this: unknown, ...args: Parameters<typeof fetch>) {
      return nativeFetch.apply(this, args).then((res: Response) => {
        try {
          const nativeJson = res.json.bind(res);
          res.json = function () {
            return nativeJson().then((data: unknown) => {
              try {
                patch(data);
                reportStats("fetch");
              } catch {
                /* ignore */
              }
              return data;
            });
          };
        } catch {
          /* ignore */
        }
        return res;
      });
    } as typeof fetch;
  }

  const nativeXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: any[]) {
    this.addEventListener("load", function (this: XMLHttpRequest) {
      try {
        const ct = this.getResponseHeader("content-type") || "";
        if (!ct.includes("json") || (this.responseType && this.responseType !== "text")) return;
        const data = nativeParse(this.responseText);
        if (data && typeof data === "object") {
          patch(data);
          reportStats("XHR");
          const json = JSON.stringify(data);
          Object.defineProperty(this, "responseText", { value: json });
          Object.defineProperty(this, "response", { value: json });
        }
      } catch {
        /* ignore */
      }
    });
    return nativeXhrOpen.apply(this, args as any);
  } as typeof XMLHttpRequest.prototype.open;

  // ── Config channel from content script ──
  window.addEventListener("message", (ev: MessageEvent) => {
    if (ev.source !== window || !ev.data || ev.data.source !== MSG.config) return;
    const next = ev.data.payload as AbxSettings;
    if (!next) return;
    settings = next;
    flagOverrides = resolveFlagOverrides(settings);
    // Re-scan known globals with refreshed config (new visited set).
    visited = new WeakSet();
    try {
      patch((window as any).__INITIAL_STATE__);
      patch((window as any).__META_DATA__);
    } catch {
      /* ignore */
    }
  });

  // Ask the content script for current settings.
  window.postMessage({ source: MSG.ready }, "*");
  reportStats();
})();
