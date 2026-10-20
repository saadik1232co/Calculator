"use client";

import React, { memo } from "react";
import { Calculator, Home, Tag } from "lucide-react";

export type CalculatorTab = "arithmetic" | "mortgage" | "discount";

interface HeaderProps {
  activeTab: CalculatorTab;
  onTabChange: (tab: CalculatorTab) => void;
}

const TABS = [
  {
    id: "arithmetic" as CalculatorTab,
    label: "Arithmetic",
    icon: Calculator,
    badge: "Standard",
  },
  {
    id: "mortgage" as CalculatorTab,
    label: "Mortgage & Loan",
    icon: Home,
    badge: "Estimator",
  },
  {
    id: "discount" as CalculatorTab,
    label: "Discount & Tax",
    icon: Tag,
    badge: "Sales",
  },
] as const;

function HeaderComponent({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Calculator className="text-indigo-400" size={20} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                Multi-Mode Calculator
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Precision arithmetic • Amortization simulation • Discount & sales tax
            </p>
          </div>
        </div>

        {/* Segmented Tab Control */}
        <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner w-full sm:w-auto overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

const Header = memo(HeaderComponent);
export default Header;
