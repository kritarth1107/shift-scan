"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  RefreshCw,
  Search,
  WifiOff,
  Loader2,
  ChevronRight,
  Camera,
  ScanLine,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav, type AppTab } from "./components/bottom-nav";
import { BoxDetailSheet, type Box } from "./components/box-detail-sheet";
import { useBarcodeScanner } from "./hooks/use-barcode-scanner";

const SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ?? "";

export default function ShiftScan() {
  const [allBoxes, setAllBoxes] = useState<Box[]>([]);
  const [boxesMap, setBoxesMap] = useState<Map<string, Box>>(new Map());
  const [activeTab, setActiveTab] = useState<AppTab>("scan");
  const [currentBox, setCurrentBox] = useState<Box | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const autoStartedRef = useRef(false);
  const onScanRef = useRef<(code: string) => void>(() => {});

  const { readerId, isActive, isStarting, error, start, stop } = useBarcodeScanner((code) =>
    onScanRef.current(code)
  );

  const handleScannedCode = useCallback(
    (code: string) => {
      stop();
      const normalized = code.trim().toUpperCase();
      const found = boxesMap.get(normalized);

      if (found) {
        setCurrentBox(found);
        toast.success(`Found ${found.code}`);
      } else {
        toast.error(`No carton found for ${normalized}`);
        setTimeout(() => start(), 600);
      }
    },
    [boxesMap, stop, start]
  );

  useEffect(() => {
    onScanRef.current = handleScannedCode;
  }, [handleScannedCode]);

  const fetchData = useCallback(async () => {
    if (!SCRIPT_URL) {
      toast.error("Apps Script URL is not configured");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(SCRIPT_URL);
      const data = await res.json();
      if (!data.success) throw new Error("Invalid response");

      const boxes: Box[] = data.boxes || [];
      setAllBoxes(boxes);

      const newMap = new Map<string, Box>();
      boxes.forEach((box) => newMap.set(box.code.toUpperCase(), box));
      setBoxesMap(newMap);
      setIsConnected(true);

      if (data.lastUpdated) {
        setLastUpdated(
          new Date(data.lastUpdated).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }

      toast.success(`Synced ${boxes.length} cartons`);
    } catch (error) {
      console.error(error);
      setIsConnected(false);
      toast.error("Failed to sync. Check your Apps Script URL.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (SCRIPT_URL) fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab !== "scan") {
      stop();
      autoStartedRef.current = false;
    }
  }, [activeTab, stop]);

  useEffect(() => {
    if (
      activeTab === "scan" &&
      isConnected &&
      !isActive &&
      !isStarting &&
      !error &&
      !autoStartedRef.current
    ) {
      autoStartedRef.current = true;
      const timer = setTimeout(() => start(), 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isConnected, isActive, isStarting, error, start]);

  useEffect(() => {
    if (!currentBox && activeTab === "scan" && isConnected && !isActive && !isStarting && !error) {
      const timer = setTimeout(() => start(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentBox, activeTab, isConnected, isActive, isStarting, error, start]);

  const filteredBoxes = useMemo(() => {
    const q = listSearch.trim().toUpperCase();
    if (!q) return allBoxes;
    return allBoxes.filter(
      (b) =>
        b.code.toUpperCase().includes(q) ||
        (b.owner || "").toUpperCase().includes(q) ||
        (b.tracking || "").toUpperCase().includes(q)
    );
  }, [allBoxes, listSearch]);

  const findManual = () => {
    const normalized = manualCode.trim().toUpperCase();
    if (!normalized) return;

    const found = boxesMap.get(normalized);
    if (found) {
      setCurrentBox(found);
      toast.success(`Found ${found.code}`);
    } else {
      toast.error(`No carton found for ${normalized}`);
    }
    setManualCode("");
  };

  const copyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    toast.success("Tracking copied");
  };

  const trackDelhivery = (tracking: string) => {
    window.open(`https://www.delhivery.com/track/package/${tracking}`, "_blank");
  };

  if (!SCRIPT_URL) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app p-6 text-zinc-100">
        <div className="w-full max-w-sm rounded-2xl border border-subtle bg-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
            <WifiOff className="h-5 w-5 text-violet-400" />
          </div>
          <h1 className="font-display text-xl font-semibold">Setup required</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Add <code className="text-violet-300">NEXT_PUBLIC_APPS_SCRIPT_URL</code> to{" "}
            <code className="text-zinc-400">.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-app text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-subtle bg-app/80 backdrop-blur-md pt-safe">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight">ShiftScan</h1>
            <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${isConnected ? "text-zinc-500" : "text-amber-500/80"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-violet-400" : "bg-amber-400"}`} />
              {isConnected ? `${allBoxes.length} cartons · ${lastUpdated || "synced"}` : "Offline"}
            </p>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-zinc-400 transition hover:text-violet-300 disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pb-nav pt-5">
        {activeTab === "scan" && (
          <section>
            <div className="scanner-shell relative min-h-[56dvh] overflow-hidden rounded-2xl border border-subtle bg-black">
              <div id={readerId} className="scanner-reader absolute inset-0" />

              {!isActive && !isStarting && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-app/95 px-8 text-center">
                  {error ? (
                    <>
                      <AlertCircle className="mb-3 h-8 w-8 text-violet-400" />
                      <p className="text-sm text-zinc-400">{error}</p>
                      <button
                        onClick={() => {
                          autoStartedRef.current = false;
                          start();
                        }}
                        className="btn-primary mt-5 rounded-full px-6 py-2.5 text-sm font-medium transition"
                      >
                        Retry
                      </button>
                    </>
                  ) : !isConnected ? (
                    <>
                      <Loader2 className="mb-3 h-7 w-7 animate-spin text-violet-400" />
                      <p className="text-sm text-zinc-500">Syncing…</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface ring-1 ring-violet-500/20">
                        <ScanLine className="h-7 w-7 text-violet-400" />
                      </div>
                      <h2 className="font-display text-lg font-medium">Scan carton</h2>
                      <p className="mt-1 text-sm text-zinc-500">Camera starts automatically</p>
                      <button
                        onClick={start}
                        className="btn-primary mt-6 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition"
                      >
                        <Camera className="h-4 w-4" />
                        Open camera
                      </button>
                    </>
                  )}
                </div>
              )}

              {(isActive || isStarting) && (
                <div className="pointer-events-none absolute inset-0 z-10">
                  <div className="flex h-full items-center justify-center">
                    <div className="scan-frame relative h-24 w-[72%] max-w-xs rounded-lg border border-violet-400/50">
                      <span className="absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 border-violet-300" />
                      <span className="absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 border-violet-300" />
                      <span className="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-violet-300" />
                      <span className="absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-violet-300" />
                      <div className="scan-line absolute inset-x-2 h-px" />
                    </div>
                  </div>
                  <p className="absolute inset-x-0 bottom-4 text-center text-xs text-zinc-400">
                    {isStarting ? "Starting camera…" : "Align barcode in frame"}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "search" && (
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold">Search</h2>
              <p className="mt-1 text-sm text-zinc-500">Enter a carton code manually</p>
            </div>

            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && findManual()}
                placeholder="BX-001"
                autoFocus
                className="input-field flex-1 rounded-xl px-4 py-3 font-mono text-sm text-zinc-100"
              />
              <button
                onClick={findManual}
                className="btn-primary flex h-12 w-12 items-center justify-center rounded-xl transition"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-subtle bg-surface p-4">
                <p className="text-xs text-zinc-500">Loaded</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{allBoxes.length}</p>
              </div>
              <div className="rounded-xl border border-subtle bg-surface p-4">
                <p className="text-xs text-zinc-500">Last sync</p>
                <p className="mt-2 font-mono text-sm text-zinc-400">{lastUpdated || "—"}</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "cartons" && (
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-xl font-semibold">Cartons</h2>
              <span className="text-xs text-zinc-500">{filteredBoxes.length}</span>
            </div>

            <input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search…"
              className="input-field w-full rounded-xl px-4 py-3 text-sm text-zinc-100"
            />

            <ul className="divide-y divide-white/[0.04] overflow-hidden rounded-xl border border-subtle">
              {filteredBoxes.map((box) => (
                <li key={box.code}>
                  <button
                    onClick={() => setCurrentBox(box)}
                    className="flex w-full items-center justify-between bg-surface px-4 py-3.5 text-left transition active:bg-surface-raised"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-zinc-100">{box.code}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {box.owner || "Unassigned"} · {box.items.length} items
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </button>
                </li>
              ))}
              {filteredBoxes.length === 0 && (
                <li className="bg-surface px-4 py-12 text-center text-sm text-zinc-500">No results</li>
              )}
            </ul>
          </section>
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} cartonCount={allBoxes.length} />

      {currentBox && (
        <BoxDetailSheet
          box={currentBox}
          onClose={() => setCurrentBox(null)}
          onCopyTracking={copyTracking}
          onTrackDelhivery={trackDelhivery}
        />
      )}
    </div>
  );
}
