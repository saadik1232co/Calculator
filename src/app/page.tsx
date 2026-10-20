"use client";

import React, { useState, useCallback } from "react";
import Header, { CalculatorTab } from "@/components/Header";
import ArithmeticCalculator from "@/components/ArithmeticCalculator";
import MortgageCalculator from "@/components/MortgageCalculator";
import DiscountCalculator from "@/components/DiscountCalculator";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ShieldCheck, Sparkles } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>("arithmetic");

  const handleTabChange = useCallback((tab: CalculatorTab) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 w-[600px] h-[400px] bg-violet-600/5 rounded-full blur-[160px]" />
      </div>

      {/* Sticky Header with Segmented Navigation */}
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 z-10 flex flex-col items-center">
        {/* Module Title / Description Banner */}
        <div className="text-center mb-8 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-400 mb-3 shadow-inner">
            <Sparkles size={13} />
            {activeTab === "arithmetic" && "Standard IEEE 754 Precision Engine"}
            {activeTab === "mortgage" && "Amortization & Payoff Simulation"}
            {activeTab === "discount" && "Primary Discount & Tax Engine"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeTab === "arithmetic" && "Standard Arithmetic Calculator"}
            {activeTab === "mortgage" && "Mortgage & Loan Estimator"}
            {activeTab === "discount" && "Discount & Sales Tax Calculator"}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {activeTab === "arithmetic" &&
              "High-precision arithmetic with division-by-zero protection, keyboard trapping, and calculation history."}
            {activeTab === "mortgage" &&
              "Simulate monthly payments, 0% interest fallbacks, down payment caps, and accelerated extra payment payoffs."}
            {activeTab === "discount" &&
              "Calculate primary discounts (% or $ off), discount caps, sales tax on discounted subtotals, and export itemized receipts."}
          </p>
        </div>

        {/* Tab Modules: Render all simultaneously with CSS visibility toggles to preserve state */}
        <div className="w-full flex-1 flex flex-col justify-center">
          <div className={activeTab === "arithmetic" ? "block" : "hidden"}>
            <ErrorBoundary fallbackTitle="Arithmetic Calculator Error">
              <ArithmeticCalculator isActive={activeTab === "arithmetic"} />
            </ErrorBoundary>
          </div>
          <div className={activeTab === "mortgage" ? "block" : "hidden"}>
            <ErrorBoundary fallbackTitle="Mortgage Calculator Error">
              <MortgageCalculator />
            </ErrorBoundary>
          </div>
          <div className={activeTab === "discount" ? "block" : "hidden"}>
            <ErrorBoundary fallbackTitle="Discount Calculator Error">
              <DiscountCalculator />
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Verification Invariants & Security Strip */}
      <footer className="border-t border-slate-900/80 bg-slate-950/60 backdrop-blur-md z-10 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="font-medium text-slate-400">
              Verified Invariants:
            </span>
            <span className="text-slate-500">
              No Division by Zero • Precision Drift Fixed • Clamped Boundaries
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Next.js 16 App Router</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Lucide React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
