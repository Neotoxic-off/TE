"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FEATURE_DEFS, DOMAINS, type AbxSettings, type AbxStats } from "@/src/shared/config";

/** A single labelled toggle row. */
export function ToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="block cursor-pointer text-foreground">
          {label}
        </Label>
        {hint && <p className="text-xs leading-snug text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

/** Live stat tiles fed by the page. */
export function StatTiles({ stats }: { stats: AbxStats }) {
  const tiles = [
    { k: "Flags patched", v: stats.flagsPatched },
    { k: "Media unblurred", v: stats.mediaUnblurred },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map((t) => (
        <div key={t.k} className="rounded-lg border border-border bg-background/40 p-3">
          <div className="text-2xl font-bold tabular-nums text-foreground">{t.v}</div>
          <div className="text-xs text-muted-foreground">{t.k}</div>
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ stats, enabled }: { stats: AbxStats; enabled: boolean }) {
  if (!enabled) return <Badge variant="muted">Disabled</Badge>;
  return stats.healthy ? (
    <Badge variant="ok">Active</Badge>
  ) : (
    <Badge variant="err">Error</Badge>
  );
}

/** Feature toggles block — shared by popup + options. Optionally filter by kind. */
export function FeatureList({
  settings,
  setFeature,
  disabled,
  kind,
}: {
  settings: AbxSettings;
  setFeature: (key: string, v: boolean) => void;
  disabled?: boolean;
  kind?: "page" | "dom";
}) {
  const defs = kind ? FEATURE_DEFS.filter((f) => f.kind === kind) : FEATURE_DEFS;
  return (
    <div className="divide-y divide-border">
      {defs.map((f) => (
        <ToggleRow
          key={f.key}
          id={`feature-${f.key}`}
          label={f.label}
          hint={f.hint}
          checked={!!settings.features[f.key]}
          onCheckedChange={(v) => setFeature(f.key, v)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/** Domain allowlist block. */
export function DomainList({
  settings,
  setDomain,
  disabled,
}: {
  settings: AbxSettings;
  setDomain: (d: string, v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="divide-y divide-border">
      {DOMAINS.map((d) => (
        <ToggleRow
          key={d}
          id={`domain-${d}`}
          label={d}
          checked={settings.domains[d] !== false}
          onCheckedChange={(v) => setDomain(d, v)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export { Card, CardContent, CardHeader, CardTitle, CardDescription, Separator };
