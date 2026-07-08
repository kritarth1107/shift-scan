"use client";

import { ScanLine, Search, Package } from "lucide-react";

export type AppTab = "scan" | "search" | "cartons";

interface BottomNavProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
  cartonCount: number;
}

const TABS: { id: AppTab; label: string; icon: typeof ScanLine }[] = [
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "search", label: "Search", icon: Search },
  { id: "cartons", label: "Cartons", icon: Package },
];

export function BottomNav({ activeTab, onChange, cartonCount }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-zinc-950/90 backdrop-blur-xl pb-safe">
      <div className="mx-auto flex max-w-md items-stretch px-2 pt-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2.5 transition active:scale-95 ${
                isActive ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-3 top-1 h-8 rounded-xl bg-cyan-500/10" />
              )}
              <span className="relative flex items-center justify-center">
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                {id === "cartons" && cartonCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 min-w-[16px] rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-zinc-950">
                    {cartonCount > 99 ? "99+" : cartonCount}
                  </span>
                )}
              </span>
              <span className={`relative text-[10px] font-medium ${isActive ? "text-cyan-300" : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
