"use client";

import { useEffect } from "react";
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
  KRITARTH: "owner-kritarth",
  SHUBHAM: "owner-shubham",
  RAHUL: "owner-rahul",
  SHOBHIT: "owner-shobhit",
};

function getOwnerStyle(owner?: string) {
  return OWNER_STYLES[(owner || "").toUpperCase()] ?? "owner-default";
}

interface BoxDetailSheetProps {
  box: Box;
  onClose: () => void;
  onCopyTracking: (tracking: string) => void;
  onTrackDelhivery: (tracking: string) => void;
}

export function BoxDetailSheet({ box, onClose, onCopyTracking, onTrackDelhivery }: BoxDetailSheetProps) {
  useEffect(() => {
    document.body.classList.add("sheet-open");
    return () => document.body.classList.remove("sheet-open");
  }, []);

  return (
    <div className="app-sheet-backdrop" onClick={onClose}>
      <div className="app-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="app-sheet-header flex items-start justify-between px-5 pb-3 pt-1">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Carton details</p>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{box.code}</h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="app-sheet-body">
          <div className="ios-group">
            <div className="ios-row flex items-center justify-between !py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`owner-badge ${getOwnerStyle(box.owner)}`}>
                  {box.owner || "Unassigned"}
                </span>
                {box.dimension && (
                  <span className="font-mono text-xs text-zinc-500">{box.dimension}</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Items</p>
                <p className="font-display text-2xl font-semibold tabular-nums metallic-purple-text">
                  {box.items.length}
                </p>
              </div>
            </div>
          </div>

          {box.deliveryType && box.deliveryType !== "-" && (
            <div className="ios-group mt-4">
              <div className="ios-row flex items-center justify-between">
                <span className="text-sm text-zinc-400">Delivery</span>
                <span className="inline-flex items-center gap-1.5 text-sm text-zinc-200">
                  <Truck className="h-3.5 w-3.5 text-violet-400" />
                  {box.deliveryType}
                </span>
              </div>
            </div>
          )}

          {box.tracking && box.tracking !== "-" && (
            <div className="ios-group mt-4">
              <button
                onClick={() => onCopyTracking(box.tracking!)}
                className="ios-row flex w-full items-center justify-between text-left"
              >
                <span className="text-sm text-zinc-400">Tracking</span>
                <span className="flex items-center gap-2 font-mono text-sm text-zinc-200">
                  <span className="max-w-[160px] truncate">{box.tracking}</span>
                  <Copy className="h-3.5 w-3.5 text-zinc-500" />
                </span>
              </button>
              {box.deliveryType?.includes("DELHIVERY") && (
                <button
                  onClick={() => onTrackDelhivery(box.tracking!)}
                  className="ios-row flex w-full items-center justify-center gap-2 text-sm text-violet-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Track on Delhivery
                </button>
              )}
            </div>
          )}

          <p className="ios-section-label">Contents</p>
          <div className="ios-group">
            {box.items.length > 0 ? (
              box.items.map((item, idx) => (
                <div key={idx} className="ios-row flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-200">{item.particular}</span>
                  <span className="qty-badge">{item.qty}</span>
                </div>
              ))
            ) : (
              <div className="ios-row py-8 text-center text-sm text-zinc-500">No items listed</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
