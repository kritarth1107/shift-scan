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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-subtle bg-app/90 backdrop-blur-xl pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around px-3 pt-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`relative flex w-20 flex-col items-center gap-1 py-2 transition active:scale-95 ${
                isActive ? "text-primary" : "text-zinc-500"
              }`}
            >
              {isActive && (
                <span className="absolute -top-2 h-0.5 w-8 rounded-full metallic-purple" />
              )}
              <span className="relative">
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                {id === "cartons" && cartonCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 min-w-[15px] rounded-full metallic-purple px-1 text-center text-[9px] font-semibold text-white">
                    {cartonCount > 99 ? "99+" : cartonCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? "text-violet-300" : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
