"use client";

import { X, Truck, Copy, ExternalLink } from "lucide-react";

interface BoxItem {
  particular: string;
  qty: string;
}

export interface Box {
  code: string;
  dimension?: string;
  owner?: string;
  deliveryType?: string;
  tracking?: string;
  items: BoxItem[];
}

const OWNER_STYLES: Record<string, string> = {
  KRITARTH: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
  SHUBHAM: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
  RAHUL: "bg-amber-500/15 text-amber-300 ring-amber-500/25",
  SHOBHIT: "bg-rose-500/15 text-rose-300 ring-rose-500/25",
};

function getOwnerStyle(owner?: string) {
  return OWNER_STYLES[(owner || "").toUpperCase()] ?? "bg-zinc-800/80 text-zinc-300 ring-zinc-700";
}

interface BoxDetailSheetProps {
  box: Box;
  onClose: () => void;
  onCopyTracking: (tracking: string) => void;
  onTrackDelhivery: (tracking: string) => void;
}

export function BoxDetailSheet({ box, onClose, onCopyTracking, onTrackDelhivery }: BoxDetailSheetProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="animate-fade-up flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-zinc-950 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Carton found</p>
            <h2 className="font-display text-xl font-semibold">{box.code}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 py-4 pb-safe">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-3xl font-semibold tracking-tight">{box.code}</span>
                {box.dimension && (
                  <span className="rounded-full bg-zinc-800 px-2.5 py-1 font-mono text-xs text-zinc-400 ring-1 ring-white/5">
                    {box.dimension}
                  </span>
                )}
              </div>
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${getOwnerStyle(box.owner)}`}>
                {box.owner || "Unassigned"}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Items</p>
              <p className="font-display text-4xl font-semibold tabular-nums text-cyan-300">{box.items.length}</p>
            </div>
          </div>

          {box.deliveryType && box.deliveryType !== "-" && (
            <div className="mt-5 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Delivery</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ring-1 ${
                  box.deliveryType.includes("DELHIVERY")
                    ? "bg-blue-500/10 text-blue-300 ring-blue-500/20"
                    : "bg-amber-500/10 text-amber-300 ring-amber-500/20"
                }`}
              >
                <Truck className="h-3 w-3" />
                {box.deliveryType}
              </span>
            </div>
          )}

          {box.tracking && box.tracking !== "-" && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tracking</p>
              <button
                onClick={() => onCopyTracking(box.tracking!)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2.5 font-mono text-sm transition hover:border-cyan-500/30"
              >
                <span className="truncate">{box.tracking}</span>
                <Copy className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              </button>
              {box.deliveryType?.includes("DELHIVERY") && (
                <button
                  onClick={() => onTrackDelhivery(box.tracking!)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600/90 py-2.5 text-xs font-medium text-white transition hover:bg-blue-500"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Track on Delhivery
                </button>
              )}
            </div>
          )}

          <div className="mt-6">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">Contents</p>
            {box.items.length > 0 ? (
              <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5">
                {box.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-zinc-900/40 px-4 py-3 text-sm">
                    <span className="text-zinc-200">{item.particular}</span>
                    <span className="font-mono tabular-nums text-zinc-500">{item.qty}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-white/5 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
                No items listed
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
