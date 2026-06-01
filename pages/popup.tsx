"use client";

import Head from "next/head";
import { ExternalLink, Settings2 } from "lucide-react";
import { TwitterBird } from "@/components/twitter-bird";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatTiles, StatusBadge, FeatureList } from "@/components/controls";
import { useSettings, useStats } from "@/lib/extension";
import { VERSION } from "@/src/shared/config";

export default function Popup() {
  const { settings, loaded, update, setFeature } = useSettings();
  const stats = useStats();

  const openOptions = () => {
    const g = globalThis as unknown as { browser?: any; chrome?: any };
    const api = g.browser ?? g.chrome;
    if (api?.runtime?.openOptionsPage) api.runtime.openOptionsPage();
    else window.open("options.html", "_blank");
  };

  return (
    <>
      <Head>
        <title>Twitter Enhanced</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="w-[340px] bg-background p-4 text-foreground">
        <header className="mb-3 flex items-center gap-2.5">
          <span className="text-twitter">
            <TwitterBird className="h-7 w-7" />
          </span>
          <div className="leading-tight">
            <h1 className="text-base font-bold">Twitter Enhanced</h1>
            <p className="text-xs text-muted-foreground">v{VERSION}</p>
          </div>
          <div className="ml-auto">
            <StatusBadge stats={stats} enabled={settings.enabled} />
          </div>
        </header>

        <div className="mb-3 flex items-center justify-between rounded-xl border border-border bg-card p-3">
          <div>
            <div className="text-sm font-semibold">Master switch</div>
            <div className="text-xs text-muted-foreground">Enable all enhancements</div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => update({ enabled: v })}
            disabled={!loaded}
          />
        </div>

        <StatTiles stats={stats} />

        <Separator className="my-3" />

        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Features
          </h2>
        </div>
        <div className={settings.enabled ? "" : "pointer-events-none opacity-50"}>
          <FeatureList settings={settings} setFeature={setFeature} disabled={!settings.enabled} />
        </div>

        <Separator className="my-3" />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={openOptions}>
            <Settings2 className="h-4 w-4" /> All settings
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="https://github.com/neo" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </main>
    </>
  );
}
