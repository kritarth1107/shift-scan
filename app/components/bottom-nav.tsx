"use client";

import { Search, Package, ScanLine } from "lucide-react";

export type AppTab = "scan" | "search" | "cartons";

const TAB_LABELS: Record<AppTab, string> = {
  scan: "Scan",
  search: "Search",
  cartons: "Cartons",
};

interface BottomNavProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: AppTab[] = ["search", "scan", "cartons"];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="app-tab-bar">
      <div className="app-tab-bar-inner">
        {TABS.map((id) => {
          if (id === "scan") {
            const isActive = activeTab === "scan";
            return (
              <button
                key={id}
                onClick={() => onChange("scan")}
                className={`app-tab-scan ${isActive ? "app-tab-scan-active" : ""}`}
                aria-label="Scan"
              >
                <span className="app-tab-scan-ring">
                  <ScanLine className="h-6 w-6" strokeWidth={2.25} />
                </span>
                <span className="text-[10px] font-semibold tracking-wide">{TAB_LABELS.scan}</span>
              </button>
            );
          }

          const isActive = activeTab === id;
          const Icon = id === "search" ? Search : Package;

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`app-tab ${isActive ? "app-tab-active" : ""}`}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
              <span>{TAB_LABELS[id]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
