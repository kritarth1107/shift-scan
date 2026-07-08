"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  RefreshCw,
  Search,
  Loader2,
  ChevronRight,
  Camera,
  ScanLine,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav, type AppTab } from "./components/bottom-nav";
import { BoxDetailSheet, type Box } from "./components/box-detail-sheet";
import { useBarcodeScanner } from "./hooks/use-barcode-scanner";

const SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ?? "";

const TAB_TITLES: Record<AppTab, string> = {
  scan: "Scan",
  search: "Search",
  cartons: "Cartons",
};

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
      toast.error("Sync failed. Check your Apps Script URL.");
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
    const url = "https://www.delhivery.com/track/package/" + tracking;
    window.open(url, "_blank");
  };

  if (!SCRIPT_URL) {
    return (
      <div className="app-shell items-center justify-center p-6">
        <div className="pro-panel w-full max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
            <WifiOff className="h-5 w-5 text-violet-400" />
          </div>
          <h1 className="font-display text-xl font-semibold">Configuration required</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Set <code className="text-violet-300">NEXT_PUBLIC_APPS_SCRIPT_URL</code> in{" "}
            <code className="text-zinc-400">.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="pro-bg" aria-hidden />

      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <h1 className="app-title">{TAB_TITLES[activeTab]}</h1>
            <p className="app-subtitle flex items-center gap-1.5">
              <span className={`status-dot ${isConnected ? "status-live" : "status-offline"}`} />
              {isConnected
                ? `${allBoxes.length} cartons${lastUpdated ? ` · ${lastUpdated}` : ""}`
                : "Connecting…"}
            </p>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="icon-btn"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="app-content">
        <div className={`app-tab-panel ${activeTab === "scan" ? "app-tab-panel-active" : ""}`}>
          <div className="scanner-full">
            <div id={readerId} className="scanner-reader absolute inset-0" />

            {!isActive && !isStarting && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-app px-8 text-center">
                {error ? (
                  <>
                    <AlertCircle className="mb-3 h-8 w-8 text-violet-400" />
                    <p className="text-sm text-zinc-400">{error}</p>
                    <button
                      onClick={() => {
                        autoStartedRef.current = false;
                        start();
                      }}
                      className="btn-primary mt-5 rounded-lg px-6 py-2.5 text-sm font-medium"
                    >
                      Retry
                    </button>
                  </>
                ) : !isConnected ? (
                  <>
                    <Loader2 className="mb-3 h-7 w-7 animate-spin text-violet-400" />
                    <p className="text-sm text-zinc-500">Syncing data…</p>
                  </>
                ) : (
                  <>
                    <div className="pro-icon-ring mb-5">
                      <ScanLine className="h-7 w-7 text-violet-300" />
                    </div>
                    <p className="font-display text-lg font-medium">Ready to scan</p>
                    <p className="mt-1 text-sm text-zinc-500">Camera starts automatically</p>
                    <button
                      onClick={start}
                      className="btn-primary mt-6 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
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
                  <div className="scan-frame relative h-24 w-[72%] rounded-lg border border-violet-400/40">
                    <span className="absolute -left-px -top-px h-4 w-4 border-l-2 border-t-2 border-violet-300/80" />
                    <span className="absolute -right-px -top-px h-4 w-4 border-r-2 border-t-2 border-violet-300/80" />
                    <span className="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-violet-300/80" />
                    <span className="absolute -bottom-px -right-px h-4 w-4 border-b-2 border-r-2 border-violet-300/80" />
                    <div className="scan-line absolute inset-x-2 h-px" />
                  </div>
                </div>
                <p className="absolute inset-x-0 bottom-6 text-center text-xs tracking-wide text-zinc-400">
                  {isStarting ? "Starting camera…" : "Align barcode within frame"}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={`app-tab-panel ${activeTab === "search" ? "app-tab-panel-active" : ""}`}>
          <div className="px-5 pt-6">
            <p className="text-sm text-zinc-500">Enter a carton code manually</p>

            <div className="mt-4 flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && findManual()}
                placeholder="BX-001"
                enterKeyHint="search"
                className="input-field flex-1 rounded-lg px-4 py-3.5 font-mono text-base text-zinc-100"
              />
              <button
                onClick={findManual}
                className="btn-primary flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-lg"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <div className="stat-pill">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Loaded</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{allBoxes.length}</p>
              </div>
              <div className="stat-pill">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Last sync</p>
                <p className="mt-2 font-mono text-sm text-zinc-400">{lastUpdated || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`app-tab-panel ${activeTab === "cartons" ? "app-tab-panel-active" : ""}`}>
          <div className="pt-3">
            <input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search by code, owner, or tracking"
              className="ios-search-bar w-[calc(100%-2rem)] text-zinc-100 outline-none focus:border-primary"
            />

            <p className="ios-section-label">{filteredBoxes.length} cartons</p>

            <div className="ios-group">
              {filteredBoxes.map((box) => (
                <button
                  key={box.code}
                  onClick={() => setCurrentBox(box)}
                  className="ios-row flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-zinc-100">{box.code}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {box.owner || "Unassigned"} · {box.items.length} items
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </button>
              ))}
              {filteredBoxes.length === 0 && (
                <div className="ios-row py-10 text-center text-sm text-zinc-500">No results found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

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
