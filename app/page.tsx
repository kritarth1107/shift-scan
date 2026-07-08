"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  RefreshCw,
  Search,
  Package,
  Wifi,
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

  const lookupCode = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    const found = boxesMap.get(normalized);
    if (found) {
      setCurrentBox(found);
      toast.success(`Found ${found.code}`);
    } else {
      toast.error(`No carton found for ${normalized}`);
    }
  };

  const findManual = () => {
    lookupCode(manualCode);
    setManualCode("");
  };

  const copyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    toast.success("Tracking copied");
  };

  const trackDelhivery = (tracking: string) => {
    window.open(`https://www.delhivery.com/track/package/${tracking}`, "_blank");
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
  };

  if (!SCRIPT_URL) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950 p-6 text-zinc-100">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center backdrop-blur">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <WifiOff className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Configuration needed</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Set <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-cyan-300">NEXT_PUBLIC_APPS_SCRIPT_URL</code> in{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">.env.local</code>, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-16 top-20 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl pt-safe">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600 shadow-lg shadow-cyan-500/20">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-none">ShiftScan</p>
              <p className={`mt-0.5 flex items-center gap-1 text-[10px] ${isConnected ? "text-emerald-400" : "text-amber-400"}`}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? `Live · ${lastUpdated || "synced"}` : "Offline"}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-zinc-900/80 text-zinc-300 transition hover:text-cyan-300 disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-md px-4 pb-nav pt-4">
        {activeTab === "scan" && (
          <section className="space-y-4">
            <div className="scanner-shell relative min-h-[52dvh] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
              <div id={readerId} className="scanner-reader absolute inset-0" />

              {!isActive && !isStarting && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900/95 p-8 text-center">
                  {error ? (
                    <>
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
                        <AlertCircle className="h-7 w-7 text-amber-400" />
                      </div>
                      <p className="text-sm text-zinc-300">{error}</p>
                      <button
                        onClick={() => {
                          autoStartedRef.current = false;
                          start();
                        }}
                        className="mt-5 rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950"
                      >
                        Retry camera
                      </button>
                    </>
                  ) : !isConnected ? (
                    <>
                      <Loader2 className="mb-4 h-8 w-8 animate-spin text-cyan-400" />
                      <p className="text-sm text-zinc-400">Connecting to sheet…</p>
                    </>
                  ) : (
                    <>
                      <div className="pulse-ring relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-800 ring-1 ring-white/10">
                        <ScanLine className="h-9 w-9 text-cyan-400" />
                      </div>
                      <h2 className="font-display text-xl font-semibold">Ready to scan</h2>
                      <p className="mt-1 text-sm text-zinc-400">Camera will start automatically</p>
                      <button
                        onClick={start}
                        className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 text-sm font-semibold text-zinc-950"
                      >
                        <Camera className="h-4 w-4" />
                        Start scanner
                      </button>
                    </>
                  )}
                </div>
              )}

              {(isActive || isStarting) && (
                <div className="pointer-events-none absolute inset-0 z-10">
                  <div className="flex h-full items-center justify-center">
                    <div className="scan-frame relative h-28 w-[78%] max-w-xs rounded-xl border-2 border-cyan-400/70">
                      <span className="absolute -left-0.5 -top-0.5 h-5 w-5 border-l-2 border-t-2 border-cyan-400" />
                      <span className="absolute -right-0.5 -top-0.5 h-5 w-5 border-r-2 border-t-2 border-cyan-400" />
                      <span className="absolute -bottom-0.5 -left-0.5 h-5 w-5 border-b-2 border-l-2 border-cyan-400" />
                      <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 border-b-2 border-r-2 border-cyan-400" />
                      <div className="scan-line absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 border-t border-white/5 bg-zinc-950/90 px-4 py-3 text-center">
                    <p className="text-xs text-zinc-400">
                      {isStarting ? "Starting camera…" : "Align barcode inside the frame"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-zinc-500">
              Supports QR, Code 128, Code 39 &amp; EAN barcodes
            </p>
          </section>
        )}

        {activeTab === "search" && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
              <h2 className="font-display text-2xl font-semibold">Manual lookup</h2>
              <p className="mt-1 text-sm text-zinc-400">Type a carton code if the label won&apos;t scan</p>

              <div className="mt-5 flex gap-2">
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && findManual()}
                  placeholder="BX-001"
                  autoFocus
                  className="flex-1 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3.5 font-mono text-base outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/15"
                />
                <button
                  onClick={findManual}
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-zinc-950"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Cartons loaded</p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{allBoxes.length}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-4">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Last sync</p>
                <p className="mt-2 font-mono text-sm text-zinc-300">{lastUpdated || "—"}</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "cartons" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">All cartons</h2>
              <span className="text-xs text-zinc-500">{filteredBoxes.length} total</span>
            </div>

            <input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search code, owner, tracking…"
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm outline-none focus:border-cyan-500/40"
            />

            <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40">
              {filteredBoxes.map((box) => (
                <li key={box.code}>
                  <button
                    onClick={() => setCurrentBox(box)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left transition active:bg-white/[0.04]"
                  >
                    <div>
                      <p className="font-mono text-sm font-semibold">{box.code}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {box.owner || "Unassigned"} · {box.items.length} items
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </button>
                </li>
              ))}
              {filteredBoxes.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-zinc-500">No cartons match your search</li>
              )}
            </ul>
          </section>
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={handleTabChange} cartonCount={allBoxes.length} />

      {currentBox && (
        <BoxDetailSheet
          box={currentBox}
          onClose={() => {
            setCurrentBox(null);
          }}
          onCopyTracking={copyTracking}
          onTrackDelhivery={trackDelhivery}
        />
      )}
    </div>
  );
}
