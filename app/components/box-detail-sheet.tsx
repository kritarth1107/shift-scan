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
  KRITARTH: "bg-violet-500/12 text-violet-300",
  SHUBHAM: "bg-emerald-500/12 text-emerald-300",
  RAHUL: "bg-amber-500/12 text-amber-300",
  SHOBHIT: "bg-rose-500/12 text-rose-300",
};

function getOwnerStyle(owner?: string) {
  return OWNER_STYLES[(owner || "").toUpperCase()] ?? "bg-zinc-800 text-zinc-400";
}

interface BoxDetailSheetProps {
  box: Box;
  onClose: () => void;
  onCopyTracking: (tracking: string) => void;
  onTrackDelhivery: (tracking: string) => void;
}

export function BoxDetailSheet({ box, onClose, onCopyTracking, onTrackDelhivery }: BoxDetailSheetProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-[2px]">
      <div className="animate-fade-up flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-[1.75rem] border border-subtle bg-app">
        <div className="flex flex-col items-center pt-3">
          <div className="sheet-handle" />
        </div>

        <div className="flex items-start justify-between px-5 pb-4 pt-3">
          <div>
            <p className="text-xs text-zinc-500">Carton</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{box.code}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-zinc-400 transition hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 pb-safe">
          <div className="flex items-start justify-between gap-4 rounded-2xl bg-surface p-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getOwnerStyle(box.owner)}`}>
                  {box.owner || "Unassigned"}
                </span>
                {box.dimension && (
                  <span className="font-mono text-xs text-zinc-500">{box.dimension}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Items</p>
              <p className="font-display text-3xl font-semibold tabular-nums metallic-purple-text">{box.items.length}</p>
            </div>
          </div>

          {box.deliveryType && box.deliveryType !== "-" && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-zinc-500">Delivery</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-zinc-300">
                <Truck className="h-3 w-3 text-violet-400" />
                {box.deliveryType}
              </span>
            </div>
          )}

          {box.tracking && box.tracking !== "-" && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-zinc-500">Tracking</p>
              <button
                onClick={() => onCopyTracking(box.tracking!)}
                className="input-field flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-mono text-sm text-zinc-200"
              >
                <span className="truncate">{box.tracking}</span>
                <Copy className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              </button>
              {box.deliveryType?.includes("DELHIVERY") && (
                <button
                  onClick={() => onTrackDelhivery(box.tracking!)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-subtle bg-surface py-2.5 text-xs text-zinc-300 transition hover:border-primary"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Track on Delhivery
                </button>
              )}
            </div>
          )}

          <div className="mt-6">
            <p className="mb-3 text-xs text-zinc-500">Contents</p>
            {box.items.length > 0 ? (
              <ul className="divide-y divide-white/[0.04] overflow-hidden rounded-xl border border-subtle">
                {box.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-surface px-4 py-3 text-sm">
                    <span className="text-zinc-200">{item.particular}</span>
                    <span className="font-mono tabular-nums text-zinc-500">{item.qty}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-subtle bg-surface px-4 py-8 text-center text-sm text-zinc-500">
                No items listed
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
