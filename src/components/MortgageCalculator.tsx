"use client";

import React, { useState, useMemo, memo } from "react";
import {
  DollarSign,
  Calendar,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  clamp,
  formatCurrency as formatCurrencyUtil,
  formatCurrencyRounded,
} from "@/lib/utils";

export const DEFAULT_MORTGAGE_STATE = {
  homePrice: 450000,
  downPaymentDollar: 90000,
  downPaymentPercent: 20,
  downPaymentMode: "percent" as const,
  loanTermYears: 30,
  interestRate: 6.5,
  annualPropertyTax: 5400,
  annualInsurance: 1400,
  monthlyHOA: 150,
  extraMonthlyPayment: 0,
};

interface AmortizationYear {
  year: number;
  startingBalance: number;
  principalPaid: number;
  interestPaid: number;
  cumulativeInterest: number;
  endingBalance: number;
}

function MortgageCalculatorComponent() {
  // Input states initialized to DEFAULT_MORTGAGE_STATE
  const [homePrice, setHomePrice] = useState<number>(
    DEFAULT_MORTGAGE_STATE.homePrice
  );
  const [downPaymentMode, setDownPaymentMode] = useState<"dollar" | "percent">(
    DEFAULT_MORTGAGE_STATE.downPaymentMode
  );
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(
    DEFAULT_MORTGAGE_STATE.downPaymentPercent
  );
  const [downPaymentDollar, setDownPaymentDollar] = useState<number>(
    DEFAULT_MORTGAGE_STATE.downPaymentDollar
  );
  const [loanTermYears, setLoanTermYears] = useState<number>(
    DEFAULT_MORTGAGE_STATE.loanTermYears
  );
  const [interestRate, setInterestRate] = useState<number>(
    DEFAULT_MORTGAGE_STATE.interestRate
  );
  const [annualPropertyTax, setAnnualPropertyTax] = useState<number>(
    DEFAULT_MORTGAGE_STATE.annualPropertyTax
  );
  const [annualInsurance, setAnnualInsurance] = useState<number>(
    DEFAULT_MORTGAGE_STATE.annualInsurance
  );
  const [monthlyHOA, setMonthlyHOA] = useState<number>(
    DEFAULT_MORTGAGE_STATE.monthlyHOA
  );
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(
    DEFAULT_MORTGAGE_STATE.extraMonthlyPayment
  );

  // Amortization table expansion state
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  // Toast confirmation state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reset Mortgage handler
  const handleResetMortgage = () => {
    setHomePrice(DEFAULT_MORTGAGE_STATE.homePrice);
    setDownPaymentMode(DEFAULT_MORTGAGE_STATE.downPaymentMode);
    setDownPaymentPercent(DEFAULT_MORTGAGE_STATE.downPaymentPercent);
    setDownPaymentDollar(DEFAULT_MORTGAGE_STATE.downPaymentDollar);
    setLoanTermYears(DEFAULT_MORTGAGE_STATE.loanTermYears);
    setInterestRate(DEFAULT_MORTGAGE_STATE.interestRate);
    setAnnualPropertyTax(DEFAULT_MORTGAGE_STATE.annualPropertyTax);
    setAnnualInsurance(DEFAULT_MORTGAGE_STATE.annualInsurance);
    setMonthlyHOA(DEFAULT_MORTGAGE_STATE.monthlyHOA);
    setExtraMonthlyPayment(DEFAULT_MORTGAGE_STATE.extraMonthlyPayment);
    setShowAmortization(false);

    setToastMessage("Mortgage inputs reset to defaults");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronize down payment inputs when home price or down payment changes
  const handlePriceChange = (value: number) => {
    const safePrice = Math.max(0, value);
    setHomePrice(safePrice);
    if (downPaymentMode === "percent") {
      setDownPaymentDollar(Math.round(safePrice * (downPaymentPercent / 100)));
    } else {
      if (downPaymentDollar > safePrice) {
        setDownPaymentDollar(safePrice);
        setDownPaymentPercent(safePrice > 0 ? 100 : 0);
      } else {
        setDownPaymentPercent(
          safePrice > 0
            ? Math.round((downPaymentDollar / safePrice) * 1000) / 10
            : 0
        );
      }
    }
  };

  const handleDownPaymentDollarChange = (dollar: number) => {
    const safePrice = Math.max(0, homePrice);
    // Down Payment Boundary Invariant: 0 <= downPayment <= homePrice
    const clampedDollar = clamp(dollar, 0, safePrice);
    setDownPaymentDollar(clampedDollar);
    setDownPaymentPercent(
      safePrice > 0 ? Math.round((clampedDollar / safePrice) * 1000) / 10 : 0
    );
  };

  const handleDownPaymentPercentChange = (pct: number) => {
    const safePrice = Math.max(0, homePrice);
    // Clamp between 0% and 100%
    const clampedPct = clamp(pct, 0, 100);
    setDownPaymentPercent(clampedPct);
    setDownPaymentDollar(Math.round(safePrice * (clampedPct / 100)));
  };

  // Perform Core Mortgage Calculations & Extra Payment Simulation
  const calculations = useMemo(() => {
    // Non-Negative Invariants
    const safeHomePrice = Math.max(0, homePrice);
    const safeDownPayment = clamp(downPaymentDollar, 0, safeHomePrice);
    const principal = Math.max(0, safeHomePrice - safeDownPayment);
    const termYears = clamp(loanTermYears, 1, 50);
    const totalMonths = termYears * 12;
    const annualRate = Math.max(0, interestRate) / 100;
    const monthlyRate = annualRate / 12;

    const safeTaxAnnual = Math.max(0, annualPropertyTax);
    const safeInsuranceAnnual = Math.max(0, annualInsurance);
    const safeHOAMonthly = Math.max(0, monthlyHOA);
    const safeExtraMonthly = Math.max(0, extraMonthlyPayment);

    const monthlyTax = safeTaxAnnual / 12;
    const monthlyInsurance = safeInsuranceAnnual / 12;

    // 0% Interest Rate Fallback Invariant:
    // When annual interest is 0%, bypass amortization formula and compute Principal / (Years * 12)
    let baseMonthlyPI = 0;
    if (principal === 0) {
      baseMonthlyPI = 0;
    } else if (annualRate === 0) {
      baseMonthlyPI = principal / totalMonths;
    } else {
      const factor = Math.pow(1 + monthlyRate, totalMonths);
      baseMonthlyPI = (principal * (monthlyRate * factor)) / (factor - 1);
    }

    // O(1) Standard Loan Total Interest Calculation:
    // In a standard fixed-rate loan, total interest is total payments minus principal
    const standardTotalInterest =
      annualRate === 0 || principal === 0
        ? 0
        : Math.max(0, totalMonths * baseMonthlyPI - principal);

    // Extra Payment Simulation Invariant:
    // Bounded by total loan months, terminates when balance <= 0.01 to prevent infinite loops,
    // and final month's principal is capped at remaining balance.
    let extraBalance = principal;
    let extraTotalInterest = 0;
    let payoffMonths = totalMonths;

    if (principal === 0) {
      payoffMonths = 0;
      extraTotalInterest = 0;
    } else if (safeExtraMonthly === 0) {
      extraTotalInterest = standardTotalInterest;
      payoffMonths = totalMonths;
    } else {
      for (let m = 1; m <= totalMonths; m++) {
        if (extraBalance <= 0.01) {
          payoffMonths = m - 1;
          break;
        }
        payoffMonths = m;

        const interest = annualRate === 0 ? 0 : extraBalance * monthlyRate;
        const targetPrincipal = baseMonthlyPI - interest + safeExtraMonthly;
        const actualPrincipal = Math.min(extraBalance, targetPrincipal);

        extraTotalInterest += interest;
        extraBalance = Math.max(0, extraBalance - actualPrincipal);
      }
    }

    const totalMonthlyPayment =
      baseMonthlyPI + monthlyTax + monthlyInsurance + safeHOAMonthly;

    const monthsSaved = Math.max(0, totalMonths - payoffMonths);
    const yearsSaved = Math.floor(monthsSaved / 12);
    const remainingMonthsSaved = monthsSaved % 12;
    const interestSaved = Math.max(
      0,
      standardTotalInterest - extraTotalInterest
    );

    const payoffYears = Math.floor(payoffMonths / 12);
    const payoffRemainingMonths = payoffMonths % 12;

    const totalCostOfLoan =
      principal +
      (safeExtraMonthly > 0 ? extraTotalInterest : standardTotalInterest) +
      safeTaxAnnual * (payoffMonths / 12) +
      safeInsuranceAnnual * (payoffMonths / 12) +
      safeHOAMonthly * payoffMonths;

    return {
      principal,
      termYears,
      totalMonths,
      annualRate,
      monthlyRate,
      baseMonthlyPI,
      monthlyTax,
      monthlyInsurance,
      safeHOAMonthly,
      safeExtraMonthly,
      totalMonthlyPayment,
      standardTotalInterest,
      extraTotalInterest,
      interestSaved,
      payoffMonths,
      payoffYears,
      payoffRemainingMonths,
      monthsSaved,
      yearsSaved,
      remainingMonthsSaved,
      totalCostOfLoan,
    };
  }, [
    homePrice,
    downPaymentDollar,
    loanTermYears,
    interestRate,
    annualPropertyTax,
    annualInsurance,
    monthlyHOA,
    extraMonthlyPayment,
  ]);

  // Compute Amortization Schedule on demand (only when open)
  const yearlySchedule = useMemo((): AmortizationYear[] => {
    if (!showAmortization || calculations.principal === 0) {
      return [];
    }

    const schedule: AmortizationYear[] = [];
    const {
      principal,
      totalMonths,
      annualRate,
      monthlyRate,
      baseMonthlyPI,
      safeExtraMonthly,
    } = calculations;

    let balance = principal;
    let currentYearPrincipal = 0;
    let currentYearInterest = 0;
    let runningCumulativeInterest = 0;
    let yearStartBalance = principal;

    for (let m = 1; m <= totalMonths; m++) {
      if (balance <= 0.01) {
        break;
      }

      const interest = annualRate === 0 ? 0 : balance * monthlyRate;
      const targetPrincipal = baseMonthlyPI - interest + safeExtraMonthly;
      const actualPrincipal = Math.min(balance, targetPrincipal);

      runningCumulativeInterest += interest;
      balance = Math.max(0, balance - actualPrincipal);

      currentYearPrincipal += actualPrincipal;
      currentYearInterest += interest;

      if (m % 12 === 0 || balance <= 0.01 || m === totalMonths) {
        const yearNumber = Math.ceil(m / 12);
        schedule.push({
          year: yearNumber,
          startingBalance: yearStartBalance,
          principalPaid: currentYearPrincipal,
          interestPaid: currentYearInterest,
          cumulativeInterest: runningCumulativeInterest,
          endingBalance: balance,
        });
        yearStartBalance = balance;
        currentYearPrincipal = 0;
        currentYearInterest = 0;
      }
    }

    return schedule;
  }, [showAmortization, calculations]);

  // Memoize breakdown percentages & style objects to prevent inline style recreation
  const breakdownWidths = useMemo(() => {
    const total = calculations.totalMonthlyPayment;
    if (total <= 0) return { pi: "0%", tax: "0%", ins: "0%", hoa: "0%" };
    return {
      pi: `${(calculations.baseMonthlyPI / total) * 100}%`,
      tax: `${(calculations.monthlyTax / total) * 100}%`,
      ins: `${(calculations.monthlyInsurance / total) * 100}%`,
      hoa: `${(calculations.safeHOAMonthly / total) * 100}%`,
    };
  }, [
    calculations.totalMonthlyPayment,
    calculations.baseMonthlyPI,
    calculations.monthlyTax,
    calculations.monthlyInsurance,
    calculations.safeHOAMonthly,
  ]);

  const piStyle = useMemo(
    () => ({ width: breakdownWidths.pi }),
    [breakdownWidths.pi]
  );
  const taxStyle = useMemo(
    () => ({ width: breakdownWidths.tax }),
    [breakdownWidths.tax]
  );
  const insStyle = useMemo(
    () => ({ width: breakdownWidths.ins }),
    [breakdownWidths.ins]
  );
  const hoaStyle = useMemo(
    () => ({ width: breakdownWidths.hoa }),
    [breakdownWidths.hoa]
  );

  const formatCurrency = (val: number): string => formatCurrencyRounded(val);
  const formatCurrencyExact = (val: number): string =>
    formatCurrencyUtil(val, 2);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Loan Inputs & Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <DollarSign className="text-indigo-400" size={20} />
                Loan Parameters
              </h2>
              <button
                type="button"
                onClick={handleResetMortgage}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors active:scale-95"
                title="Reset mortgage to defaults"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            </div>

            {toastMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 transition-all">
                <Check size={14} className="text-emerald-400" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Home Price Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label
                  htmlFor="homePrice"
                  className="font-medium text-slate-300"
                >
                  Home Price
                </label>
                <div className="flex gap-1.5">
                  {[300000, 450000, 600000, 800000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePriceChange(preset)}
                      className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition"
                    >
                      ${preset / 1000}k
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                  $
                </span>
                <input
                  id="homePrice"
                  type="number"
                  min="0"
                  step="5000"
                  value={homePrice}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            {/* Down Payment (Toggle between $ and %) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label className="font-medium text-slate-300">
                  Down Payment
                </label>
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setDownPaymentMode("percent")}
                    className={`px-2 py-0.5 rounded-md font-medium transition ${
                      downPaymentMode === "percent"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Percent (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownPaymentMode("dollar")}
                    className={`px-2 py-0.5 rounded-md font-medium transition ${
                      downPaymentMode === "dollar"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Dollar ($)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={homePrice}
                    step="1000"
                    value={downPaymentDollar}
                    onChange={(e) =>
                      handleDownPaymentDollarChange(Number(e.target.value))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={downPaymentPercent}
                    onChange={(e) =>
                      handleDownPaymentPercentChange(Number(e.target.value))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-8 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    %
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-500 font-mono pt-1">
                <span>
                  Loan Principal: {formatCurrency(calculations.principal)}
                </span>
                <span>
                  {calculations.principal === 0 && (
                    <span className="text-emerald-400 font-medium">
                      100% Down (No Loan Needed)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Loan Term & Interest Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Loan Term */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-medium text-slate-300">
                    Loan Term
                  </label>
                  <span className="text-xs text-indigo-400 font-mono">
                    {loanTermYears} Years
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 20, 30].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setLoanTermYears(term)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${
                        loanTermYears === term
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {term} Yrs
                    </button>
                  ))}
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor="interestRate" className="font-medium text-slate-300">
                    Interest Rate
                  </label>
                  <span className="text-xs text-indigo-400 font-mono">
                    {interestRate}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="interestRate"
                    type="number"
                    min="0"
                    max="20"
                    step="0.125"
                    value={interestRate}
                    onChange={(e) =>
                      setInterestRate(Math.max(0, Number(e.target.value)))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-8 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    %
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.125"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Taxes, Insurance, HOA */}
            <div className="pt-2 border-t border-slate-800/80 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Taxes, Insurance & Dues
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Property Tax / yr</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={annualPropertyTax}
                      onChange={(e) =>
                        setAnnualPropertyTax(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Home Insurance / yr</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={annualInsurance}
                      onChange={(e) =>
                        setAnnualInsurance(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400">HOA Fee / mo</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="25"
                      value={monthlyHOA}
                      onChange={(e) =>
                        setMonthlyHOA(Math.max(0, Number(e.target.value)))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Extra Monthly Payment Simulation Input */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2 bg-indigo-950/20 p-4 rounded-2xl border border-indigo-900/30">
              <div className="flex justify-between items-center text-sm">
                <label className="font-medium text-indigo-300 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-indigo-400" />
                  Extra Monthly Principal Payment
                </label>
                <span className="font-mono text-xs text-indigo-400 font-semibold">
                  +${extraMonthlyPayment}/mo
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={extraMonthlyPayment}
                  onChange={(e) =>
                    setExtraMonthlyPayment(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full bg-slate-950 border border-indigo-900/50 rounded-xl pl-8 pr-4 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Applied directly toward reducing loan principal every single
                month.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Results & Early Payoff Insights (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Payment Result Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Total Estimated Monthly Payment
              </span>
              <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
                {formatCurrencyExact(calculations.totalMonthlyPayment)}
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  /mo
                </span>
              </div>
            </div>

            {/* Visual Breakdown Progress Bar */}
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex shadow-inner">
                {/* Principal & Interest */}
                <div
                  style={piStyle}
                  className="bg-indigo-500 transition-all duration-300"
                  title="Principal & Interest"
                />
                {/* Property Tax */}
                <div
                  style={taxStyle}
                  className="bg-cyan-500 transition-all duration-300"
                  title="Property Taxes"
                />
                {/* Insurance */}
                <div
                  style={insStyle}
                  className="bg-emerald-500 transition-all duration-300"
                  title="Home Insurance"
                />
                {/* HOA */}
                <div
                  style={hoaStyle}
                  className="bg-amber-500 transition-all duration-300"
                  title="HOA Dues"
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-400 truncate">P&I:</span>
                  <span className="font-mono text-slate-200 ml-auto font-medium">
                    {formatCurrency(calculations.baseMonthlyPI)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-400 truncate">Taxes:</span>
                  <span className="font-mono text-slate-200 ml-auto font-medium">
                    {formatCurrency(calculations.monthlyTax)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-400 truncate">Insurance:</span>
                  <span className="font-mono text-slate-200 ml-auto font-medium">
                    {formatCurrency(calculations.monthlyInsurance)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-400 truncate">HOA:</span>
                  <span className="font-mono text-slate-200 ml-auto font-medium">
                    {formatCurrency(calculations.safeHOAMonthly)}
                  </span>
                </div>
              </div>
            </div>

            {/* Extra Payment Payoff Acceleration Banner */}
            {extraMonthlyPayment > 0 && calculations.principal > 0 && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <TrendingDown size={18} />
                  Early Payoff Acceleration
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>
                    Pay off in{" "}
                    <strong className="text-white font-mono">
                      {calculations.payoffYears} yrs{" "}
                      {calculations.payoffRemainingMonths} mos
                    </strong>{" "}
                    (saving{" "}
                    <strong className="text-emerald-300 font-mono">
                      {calculations.yearsSaved} yrs{" "}
                      {calculations.remainingMonthsSaved} mos
                    </strong>
                    )!
                  </p>
                  <p>
                    Total interest saved:{" "}
                    <strong className="text-emerald-400 font-mono text-sm">
                      {formatCurrency(calculations.interestSaved)}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* Lifetime Summary Stats */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Principal:</span>
                <span className="font-mono text-slate-200">
                  {formatCurrency(calculations.principal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Interest Paid:</span>
                <span className="font-mono text-slate-200">
                  {formatCurrency(
                    extraMonthlyPayment > 0
                      ? calculations.extraTotalInterest
                      : calculations.standardTotalInterest
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-semibold pt-1 border-t border-slate-800/60 text-slate-300">
                <span>Total Lifetime Out-of-Pocket:</span>
                <span className="font-mono text-indigo-400">
                  {formatCurrency(calculations.totalCostOfLoan)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amortization Schedule Accordion */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
        <button
          type="button"
          aria-label="View Annual Amortization Schedule"
          onClick={() => setShowAmortization(!showAmortization)}
          className="w-full flex justify-between items-center text-left"
        >
          <div className="flex items-center gap-2 font-bold text-slate-100 text-lg">
            <Calendar className="text-indigo-400" size={20} />
            View Annual Amortization Schedule
          </div>
          <span className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
            {showAmortization
              ? "Hide Details"
              : "View Annual Amortization Schedule"}
            {showAmortization ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </span>
        </button>

        {showAmortization && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Year</th>
                  <th className="py-2.5 px-3">Principal Paid</th>
                  <th className="py-2.5 px-3">Interest Paid</th>
                  <th className="py-2.5 px-3">Cumulative Interest</th>
                  <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {yearlySchedule.map((row) => (
                  <tr
                    key={row.year}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-indigo-400">
                      Year {row.year}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-medium">
                      +{formatCurrency(row.principalPaid)}
                    </td>
                    <td className="py-2.5 px-3 text-rose-400 font-medium">
                      {formatCurrency(row.interestPaid)}
                    </td>
                    <td className="py-2.5 px-3 text-amber-400 font-medium">
                      {formatCurrency(row.cumulativeInterest)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-100">
                      {formatCurrency(row.endingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const MortgageCalculator = memo(MortgageCalculatorComponent);
export default MortgageCalculator;
