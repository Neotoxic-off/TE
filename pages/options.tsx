"use client";

import Head from "next/head";
import { RotateCcw, ShieldCheck, Sparkles, Globe } from "lucide-react";
import { TwitterBird } from "@/components/twitter-bird";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  FeatureList,
  DomainList,
  StatTiles,
  StatusBadge,
} from "@/components/controls";
import { useSettings, useStats } from "@/lib/extension";
import { VERSION } from "@/src/shared/config";

export default function Options() {
  const { settings, loaded, update, setFeature, setDomain, reset } = useSettings();
  const stats = useStats();
  const off = !settings.enabled;

  return (
    <>
      <Head>
        <title>Twitter Enhanced — Settings</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-5 py-8">
          {/* Hero */}
          <header className="mb-8 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-twitter/15 text-twitter">
              <TwitterBird className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight">Twitter Enhanced</h1>
                <StatusBadge stats={stats} enabled={settings.enabled} />
              </div>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                Removes age-assurance gates and sensitive-media blurring on X / Twitter by
                intercepting webpack feature flags and GraphQL responses. v{VERSION}.
              </p>
            </div>
          </header>

          {/* Master + stats */}
          <Card className="mb-5">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-twitter" /> Master switch
                  </div>
                  <p className="text-xs text-muted-foreground">Enable all enhancements globally</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(v) => update({ enabled: v })}
                  disabled={!loaded}
                />
              </div>
              <div className="sm:w-64">
                <StatTiles stats={stats} />
              </div>
            </CardContent>
          </Card>

          <div className={off ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
            <div className="grid gap-5 md:grid-cols-2">
              {/* Bypass (page-world hooks) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-twitter" /> Bypass
                  </CardTitle>
                  <CardDescription>Age gates and sensitive-media restrictions.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <FeatureList settings={settings} setFeature={setFeature} kind="page" disabled={off} />
                </CardContent>
              </Card>

              {/* Appearance (DOM/CSS) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-twitter" /> Appearance
                  </CardTitle>
                  <CardDescription>Logo and clutter on the page.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <FeatureList settings={settings} setFeature={setFeature} kind="dom" disabled={off} />
                </CardContent>
              </Card>

              {/* Domains */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-twitter" /> Domains
                  </CardTitle>
                  <CardDescription>Where the extension is active.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <DomainList settings={settings} setDomain={setDomain} disabled={off} />
                </CardContent>
              </Card>
            </div>
          </div>

          <footer className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <p className="text-xs text-muted-foreground">
              Last hit: <span className="font-medium text-foreground">{stats.lastHit}</span>
            </p>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Reset defaults
            </Button>
          </footer>
        </div>
      </main>
    </>
  );
}
