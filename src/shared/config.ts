// Shared config + types used by both the injected page script and the Next.js UI.

export const VERSION = "4.0.0";

export const STORAGE_KEY = "te_settings";
export const STATS_KEY = "te_stats";

// Message channel names (page <-> content script via window.postMessage).
export const MSG = {
  config: "TE_CONFIG", // content -> page
  stats: "TE_STATS", // page -> content
  ready: "TE_READY", // page -> content (request initial config)
} as const;

// ── User-facing features ──
// One toggle per real intent. Each maps internally to the underlying X.com
// webpack flags / DOM tweaks, so the UI never exposes cryptic duplicate flags.
export type FeatureKey =
  | "bypassAgeGate"
  | "showSensitive"
  | "restoreLogo"
  | "hideGrok"
  | "hidePremium";

export interface FeatureDef {
  key: FeatureKey;
  label: string;
  hint: string;
  /** "page" = handled by the injected hooks; "dom" = content-script DOM/CSS. */
  kind: "page" | "dom";
}

export const FEATURE_DEFS: FeatureDef[] = [
  {
    key: "bypassAgeGate",
    label: "Bypass age verification",
    hint: "Skip age-assurance prompts and Grok age limits; spoof the profile birthdate.",
    kind: "page",
  },
  {
    key: "showSensitive",
    label: "Show sensitive media",
    hint: "Remove blur, warnings and click-through interstitials on sensitive content.",
    kind: "page",
  },
  {
    key: "restoreLogo",
    label: "Restore Twitter logo",
    hint: "Swap the X brand mark for the classic blue bird.",
    kind: "dom",
  },
  {
    key: "hideGrok",
    label: "Hide Grok",
    hint: "Remove Grok from the navigation and compose bar.",
    kind: "dom",
  },
  {
    key: "hidePremium",
    label: "Hide Premium upsell",
    hint: "Remove “Subscribe to Premium” prompts and verified nags.",
    kind: "dom",
  },
];

export const DOMAINS = ["x.com", "twitter.com"] as const;
export type Domain = (typeof DOMAINS)[number];

export interface AbxSettings {
  enabled: boolean;
  features: Record<FeatureKey, boolean>;
  domains: Record<Domain, boolean>;
  /** Birthdate year used when spoofing (advanced; no dedicated UI). */
  birthYear: number;
}

export interface AbxStats {
  flagsPatched: number;
  mediaUnblurred: number;
  lastHit: string;
  healthy: boolean;
  updatedAt: number;
}

export const DEFAULT_SETTINGS: AbxSettings = {
  enabled: true,
  features: {
    bypassAgeGate: true,
    showSensitive: true,
    restoreLogo: true,
    hideGrok: false,
    hidePremium: false,
  },
  domains: { "x.com": true, "twitter.com": true },
  birthYear: 1990,
};

export const DEFAULT_STATS: AbxStats = {
  flagsPatched: 0,
  mediaUnblurred: 0,
  lastHit: "—",
  healthy: true,
  updatedAt: 0,
};

// ── Internal mapping: features → X.com webpack feature flags ──
// Forced values applied to each flag when its parent feature is ON.
const AGE_FLAGS: Record<string, boolean> = {
  rweb_age_assurance_flow_enabled: false,
  grok_settings_age_restriction_enabled: false,
};

const SENSITIVE_FLAGS: Record<string, boolean> = {
  sensitive_tweet_warnings_enabled: false,
  rweb_mvr_blurred_media_interstitial_enabled: false,
  sensitive_media_settings_enabled: true,
  responsive_web_sensitive_media_settings_enabled: true,
};

/** Resolve the effective webpack flag overrides (key -> forced value). */
export function resolveFlagOverrides(s: AbxSettings): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (s.features.bypassAgeGate) Object.assign(out, AGE_FLAGS);
  if (s.features.showSensitive) Object.assign(out, SENSITIVE_FLAGS);
  return out;
}

/** Merge stored settings with defaults so new fields never break old saves. */
export function mergeSettings(stored: Partial<AbxSettings> | undefined): AbxSettings {
  if (!stored) return clone(DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    features: { ...DEFAULT_SETTINGS.features, ...(stored.features ?? {}) },
    domains: { ...DEFAULT_SETTINGS.domains, ...(stored.domains ?? {}) },
  };
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
