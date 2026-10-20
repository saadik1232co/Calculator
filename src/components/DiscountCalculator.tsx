"use client";

import React, { useState, useMemo, memo } from "react";
import {
  Tag,
  Percent,
  Copy,
  Check,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { copyToClipboard } from "@/utils/clipboard";
import { clamp, formatCurrency } from "@/lib/utils";

export const DEFAULT_DISCOUNT_STATE = {
  originalPrice: 120.0,
  primaryType: "percent" as const,
  primaryValue: 25,
  taxRate: 8.25,
  quantity: 1,
};

function DiscountCalculatorComponent() {
  const [originalPrice, setOriginalPrice] = useState<number>(
    DEFAULT_DISCOUNT_STATE.originalPrice
  );
  const [quantity, setQuantity] = useState<number>(
    DEFAULT_DISCOUNT_STATE.quantity
  );
  const [primaryType, setPrimaryType] = useState<"percent" | "dollar">(
    DEFAULT_DISCOUNT_STATE.primaryType
  );
  const [primaryValue, setPrimaryValue] = useState<number>(
    DEFAULT_DISCOUNT_STATE.primaryValue
  );
  const [taxRate, setTaxRate] = useState<number>(
    DEFAULT_DISCOUNT_STATE.taxRate
  );

  // Copy feedback state
  const [copied, setCopied] = useState<boolean>(false);

  // Toast confirmation state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reset Discount handler
  const handleResetDiscount = () => {
    setOriginalPrice(DEFAULT_DISCOUNT_STATE.originalPrice);
    setPrimaryType(DEFAULT_DISCOUNT_STATE.primaryType);
    setPrimaryValue(DEFAULT_DISCOUNT_STATE.primaryValue);
    setTaxRate(DEFAULT_DISCOUNT_STATE.taxRate);
    setQuantity(DEFAULT_DISCOUNT_STATE.quantity);

    setToastMessage("Discount inputs reset to defaults");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Restrict quantity to positive integers >= 1 Invariant
  const handleQuantityChange = (val: number) => {
    const safeQty = Math.max(1, Math.floor(val || 1));
    setQuantity(safeQty);
  };

  // Safe handlers for primary discount
  const handlePrimaryValueChange = (val: number) => {
    if (primaryType === "percent") {
      // Clamp percentage discount between 0% and 100%
      setPrimaryValue(clamp(val, 0, 100));
    } else {
      // Fixed dollar discount clamped to non-negative numbers
      setPrimaryValue(Math.max(0, val));
    }
  };

  // Compute Discount Metrics
  // Eliminating secondDiscountAmount and computing subtotal directly as priceAfterFirst
  const discountMetrics = useMemo(() => {
    const safePrice = Math.max(0, originalPrice);
    const safeQty = Math.max(1, Math.floor(quantity || 1));
    const totalOriginal = safePrice * safeQty;

    // Apply Primary Discount & compute subtotal directly as priceAfterFirst:
    // Clamp percentage to 100%, and fixed dollar to the current unit price.
    // Subtotal must never fall below $0.00.
    const unitDiscount =
      primaryType === "percent"
        ? safePrice * (clamp(primaryValue, 0, 100) / 100)
        : Math.min(safePrice, Math.max(0, primaryValue));
    const unitSubtotal = Math.max(0, safePrice - unitDiscount);
    const safeTaxRate = Math.max(0, taxRate);
    const unitTax = Math.round(unitSubtotal * (safeTaxRate / 100) * 100) / 100;
    const unitFinal = Math.round((unitSubtotal + unitTax) * 100) / 100;

    const subtotal = Math.round(unitSubtotal * safeQty * 100) / 100;
    const priceAfterFirst = subtotal;
    const primaryDiscountAmount =
      Math.round((totalOriginal - subtotal) * 100) / 100;
    const taxAmount = Math.round(unitTax * safeQty * 100) / 100;
    const finalPrice = Math.round(unitFinal * safeQty * 100) / 100;
    const totalSavings = Math.max(0, totalOriginal - finalPrice);
    const effectiveDiscountPercent =
      totalOriginal > 0 ? (totalSavings / totalOriginal) * 100 : 0;
    const pricePerUnit = unitFinal;

    return {
      safePrice,
      safeQty,
      totalOriginal,
      primaryDiscountAmount,
      priceAfterFirst,
      subtotal,
      safeTaxRate,
      taxAmount,
      finalPrice,
      totalSavings,
      effectiveDiscountPercent,
      pricePerUnit,
    };
  }, [originalPrice, quantity, primaryType, primaryValue, taxRate]);

  // Copy Breakdown with Clipboard Fallback
  const handleCopyBreakdown = async () => {
    const receiptText = [
      "========================================",
      "       DISCOUNT & SALES TAX RECEIPT     ",
      "========================================",
      `Original Price:        ${formatCurrency(
        discountMetrics.totalOriginal
      )} (${discountMetrics.safeQty} × ${formatCurrency(
        discountMetrics.safePrice
      )})`,
      `Primary Discount (${
        primaryType === "percent" ? `${primaryValue}%` : `$${primaryValue}`
      }):  -${formatCurrency(discountMetrics.primaryDiscountAmount)}`,
      "----------------------------------------",
      `Discounted Subtotal:   ${formatCurrency(discountMetrics.subtotal)}`,
      `Sales Tax (${discountMetrics.safeTaxRate}%):         +${formatCurrency(
        discountMetrics.taxAmount
      )}`,
      "========================================",
      `FINAL PRICE:           ${formatCurrency(discountMetrics.finalPrice)}`,
      `TOTAL SAVINGS:         ${formatCurrency(
        discountMetrics.totalSavings
      )} (${discountMetrics.effectiveDiscountPercent.toFixed(1)}% OFF)`,
      `Final Cost Per Unit:   ${formatCurrency(
        discountMetrics.pricePerUnit
      )} / item`,
      "========================================",
      "Calculated via Antigravity Multi-Calc",
    ].join("\n");

    const success = await copyToClipboard(receiptText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Product & Discount Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Tag className="text-indigo-400" size={20} />
                Price & Discount Details
              </h2>
              <button
                type="button"
                onClick={handleResetDiscount}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors active:scale-95"
                title="Reset discount to defaults"
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

            {/* Price & Quantity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unit Price */}
              <div className="space-y-2">
                <label
                  htmlFor="unitPrice"
                  className="text-sm font-medium text-slate-300"
                >
                  Item Unit Price
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    $
                  </span>
                  <input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) =>
                      setOriginalPrice(Math.max(0, Number(e.target.value)))
                    }
                    onBlur={() => setOriginalPrice((p) => Math.max(0, p))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {/* Quantity Input (clamped >= 1) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                  <span>Quantity</span>
                  <span className="text-xs text-slate-500">Min: 1</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-lg flex items-center justify-center transition disabled:opacity-30"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(Number(e.target.value))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 text-center text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold text-lg flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Discount */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-sm">
                <label className="font-medium text-slate-300 flex items-center gap-1.5">
                  <Percent size={15} className="text-indigo-400" />
                  Primary Discount
                </label>
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrimaryType("percent")}
                    className={`px-2 py-0.5 rounded-md font-medium transition ${
                      primaryType === "percent"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Percent (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrimaryType("dollar")}
                    className={`px-2 py-0.5 rounded-md font-medium transition ${
                      primaryType === "dollar"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Fixed ($)
                  </button>
                </div>
              </div>

              {/* Value input and presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    {primaryType === "dollar" ? "$" : "%"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={primaryType === "percent" ? 100 : undefined}
                    step={primaryType === "percent" ? 1 : 0.5}
                    value={primaryValue}
                    onChange={(e) =>
                      handlePrimaryValueChange(Number(e.target.value))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                {primaryType === "percent" && (
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {[10, 15, 20, 30, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPrimaryValue(preset)}
                        className={`text-xs px-2.5 py-2 rounded-xl font-mono transition border ${
                          primaryValue === preset
                            ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sales Tax Rate */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="taxRate" className="font-medium text-slate-300">
                  Estimated Sales Tax (%)
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  Applied strictly to discounted subtotal
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    id="taxRate"
                    type="number"
                    min="0"
                    step="0.05"
                    value={taxRate}
                    onChange={(e) =>
                      setTaxRate(Math.max(0, Number(e.target.value)))
                    }
                    onBlur={() => setTaxRate((t) => Math.max(0, t))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-8 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    %
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 5, 7, 8.25, 10].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTaxRate(t)}
                      className={`text-xs px-2 py-2 rounded-xl font-mono transition border ${
                        taxRate === t
                          ? "bg-cyan-600/30 border-cyan-500 text-cyan-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {t}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Final Price Hero Card & Receipt Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-100 text-lg">
                <Receipt size={18} className="text-cyan-400" />
                Final Price Hero Card
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {discountMetrics.safeQty} items
              </span>
            </div>

            {/* Savings Highlight Badge */}
            <div
              data-testid="total-savings-badge"
              className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 block">
                  Total Savings
                </span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {formatCurrency(discountMetrics.totalSavings)}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
                {primaryType === "percent"
                  ? `${primaryValue}% off`
                  : `${Math.round(
                      (discountMetrics.primaryDiscountAmount /
                        (discountMetrics.totalOriginal || 1)) *
                        100
                    )}% off`}
              </span>
            </div>

            {/* 5-Line Clean Breakdown: Original Price, Primary Discount, Discounted Subtotal, Sales Tax, Final Price */}
            <div className="space-y-2.5 text-xs font-mono">
              {/* Line 1: Original Price */}
              <div className="flex justify-between text-slate-400">
                <span>
                  Original Price ({discountMetrics.safeQty} ×{" "}
                  {formatCurrency(discountMetrics.safePrice)}):
                </span>
                <span className="text-slate-200">
                  {formatCurrency(discountMetrics.totalOriginal)}
                </span>
              </div>

              {/* Line 2: Primary Discount */}
              <div className="flex justify-between text-emerald-400 pl-2 border-l-2 border-emerald-500/40">
                <span>
                  Primary Discount (
                  {primaryType === "percent"
                    ? `${primaryValue}%`
                    : `$${primaryValue}`}
                  ):
                </span>
                <span>-{formatCurrency(discountMetrics.primaryDiscountAmount)}</span>
              </div>

              {/* Line 3: Discounted Subtotal */}
              <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-300 font-semibold">
                <span>Discounted Subtotal:</span>
                <span className="text-slate-100">
                  {formatCurrency(discountMetrics.subtotal)}
                </span>
              </div>

              {/* Line 4: Sales Tax */}
              <div className="flex justify-between text-slate-400">
                <span>Sales Tax ({discountMetrics.safeTaxRate}%):</span>
                <span className="text-slate-200">
                  +{formatCurrency(discountMetrics.taxAmount)}
                </span>
              </div>

              {/* Line 5: Final Price */}
              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline font-sans">
                <span className="text-sm font-bold text-slate-200">
                  Final Price:
                </span>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 font-mono">
                    {formatCurrency(discountMetrics.finalPrice)}
                  </span>
                  {discountMetrics.safeQty > 1 && (
                    <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                      {formatCurrency(discountMetrics.pricePerUnit)} / item
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* One-Click Copy Breakdown Button with Clipboard Fallback */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyBreakdown}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-950/40"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-emerald-400" />
                    <span className="text-emerald-300">
                      Receipt Copied to Clipboard!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy Breakdown to Clipboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DiscountCalculator = memo(DiscountCalculatorComponent);
export default DiscountCalculator;
