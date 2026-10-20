"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import {
  Delete,
  History,
  Trash2,
  AlertCircle,
  CornerDownLeft,
} from "lucide-react";
import { roundSafe, formatNumber, countDigits } from "@/lib/utils";

interface ArithmeticCalculatorProps {
  isActive: boolean;
}

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp?: string;
}

// Execute mathematical operation
function executeOperation(
  op: "+" | "-" | "×" | "÷",
  prev: number,
  curr: number
): { result: number | null; error?: string } {
  if (op === "÷" && curr === 0) {
    return { result: null, error: "Cannot divide by zero" };
  }

  let res = 0;
  switch (op) {
    case "+":
      res = prev + curr;
      break;
    case "-":
      res = prev - curr;
      break;
    case "×":
      res = prev * curr;
      break;
    case "÷":
      res = prev / curr;
      break;
  }

  const rounded = roundSafe(res);
  if (!isFinite(rounded) || isNaN(rounded)) {
    return { result: null, error: "Cannot divide by zero" };
  }
  return { result: rounded };
}

function ArithmeticCalculatorComponent({ isActive }: ArithmeticCalculatorProps) {
  const [display, setDisplay] = useState<string>("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [pendingOperator, setPendingOperator] = useState<
    "+" | "-" | "×" | "÷" | null
  >(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [historyExpression, setHistoryExpression] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);

  // Clear all states
  const handleAllClear = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
    setIsLocked(false);
    setHistoryExpression("");
  }, []);

  // Clear current entry or unlock
  const handleClearEntry = useCallback(() => {
    if (isLocked) {
      handleAllClear();
    } else {
      setDisplay("0");
    }
  }, [isLocked, handleAllClear]);

  // Memory handlers
  const handleMemoryAdd = useCallback(() => {
    if (isLocked) return;
    const current = parseFloat(display) || 0;
    setMemory((prev) => roundSafe(prev + current));
    setWaitingForOperand(true);
  }, [isLocked, display]);

  const handleMemorySubtract = useCallback(() => {
    if (isLocked) return;
    const current = parseFloat(display) || 0;
    setMemory((prev) => roundSafe(prev - current));
    setWaitingForOperand(true);
  }, [isLocked, display]);

  const handleMemoryRecall = useCallback(() => {
    if (isLocked) return;
    setDisplay(String(memory));
    setWaitingForOperand(true);
  }, [isLocked, memory]);

  const handleMemoryClear = useCallback(() => {
    setMemory(0);
  }, []);

  // Handle digit inputs
  const handleDigit = useCallback(
    (digit: string) => {
      if (isLocked) return;

      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
        return;
      }

      // Check max character limit (15 digits) to prevent overflow
      if (countDigits(display) >= 15) return;

      if (display === "0") {
        setDisplay(digit);
      } else if (display === "-0") {
        setDisplay(`-${digit}`);
      } else {
        setDisplay((prev) => prev + digit);
      }
    },
    [isLocked, waitingForOperand, display]
  );

  // Handle decimal input without duplication
  const handleDecimal = useCallback(() => {
    if (isLocked) return;

    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }

    // Decimal Point Duplication Invariant
    if (display.includes(".")) return;

    setDisplay((prev) => prev + ".");
  }, [isLocked, waitingForOperand, display]);

  // Handle Sign Negation (Prevent "-0")
  const handleToggleSign = useCallback(() => {
    if (isLocked) return;

    // Prevent "-0" when toggling on zero or empty state
    const num = parseFloat(display);
    if (isNaN(num) || num === 0) {
      setDisplay("0");
      return;
    }

    if (display.startsWith("-")) {
      setDisplay(display.slice(1));
    } else {
      setDisplay("-" + display);
    }
  }, [isLocked, display]);

  // Handle Percentage
  const handlePercent = useCallback(() => {
    if (isLocked) return;
    const current = parseFloat(display);
    if (isNaN(current)) return;

    const result = roundSafe(current / 100);
    setDisplay(String(result));
  }, [isLocked, display]);

  // Handle Backspace
  const handleBackspace = useCallback(() => {
    if (isLocked || waitingForOperand) return;

    if (display.length > 1) {
      const next = display.slice(0, -1);
      if (next === "-" || next === "") {
        setDisplay("0");
      } else {
        setDisplay(next);
      }
    } else {
      setDisplay("0");
    }
  }, [isLocked, waitingForOperand, display]);

  // Handle Operators
  const handleOperator = useCallback(
    (op: "+" | "-" | "×" | "÷") => {
      if (isLocked) return;

      const current = parseFloat(display);

      // Operator Switching: overwrite pending operator if waiting for operand
      if (pendingOperator !== null && waitingForOperand) {
        setPendingOperator(op);
        if (previousValue !== null) {
          setHistoryExpression(`${roundSafe(previousValue)} ${op}`);
        }
        return;
      }

      if (previousValue === null) {
        setPreviousValue(current);
        setPendingOperator(op);
        setHistoryExpression(`${roundSafe(current)} ${op}`);
        setWaitingForOperand(true);
      } else if (pendingOperator !== null) {
        const { result, error } = executeOperation(
          pendingOperator,
          previousValue,
          current
        );

        if (error || result === null) {
          setDisplay("Cannot divide by zero");
          setIsLocked(true);
          setHistoryExpression(`${roundSafe(previousValue)} ${pendingOperator} 0 =`);
          setPreviousValue(null);
          setPendingOperator(null);
          return;
        }

        setPreviousValue(result);
        setDisplay(String(result));
        setPendingOperator(op);
        setHistoryExpression(`${roundSafe(result)} ${op}`);
        setWaitingForOperand(true);
      }
    },
    [isLocked, display, pendingOperator, waitingForOperand, previousValue]
  );

  // Handle Equals
  const handleEquals = useCallback(() => {
    if (isLocked) return;
    if (previousValue === null || pendingOperator === null) return;

    const current = parseFloat(display);
    const { result, error } = executeOperation(
      pendingOperator,
      previousValue,
      current
    );

    const fullExpr = `${roundSafe(previousValue)} ${pendingOperator} ${roundSafe(
      current
    )} =`;

    if (error || result === null) {
      setDisplay("Cannot divide by zero");
      setIsLocked(true);
      setHistoryExpression(fullExpr);
      setPreviousValue(null);
      setPendingOperator(null);
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          expression: fullExpr,
          result: "Error: Divide by 0",
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 19),
      ]);
      return;
    }

    setHistoryExpression(fullExpr);
    setDisplay(String(result));
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        expression: fullExpr,
        result: String(result),
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 19),
    ]);

    setPreviousValue(null);
    setPendingOperator(null);
    setWaitingForOperand(true);
  }, [isLocked, previousValue, pendingOperator, display]);

  // Maintain latest handlers in a mutable ref to eliminate keyboard listener re-attachments
  const handlersRef = useRef({
    handleDigit,
    handleDecimal,
    handleOperator,
    handleEquals,
    handleBackspace,
    handleAllClear,
    handleClearEntry,
    handlePercent,
  });

  // Synchronize ref after render to satisfy React 19 / compiler rules
  useEffect(() => {
    handlersRef.current = {
      handleDigit,
      handleDecimal,
      handleOperator,
      handleEquals,
      handleBackspace,
      handleAllClear,
      handleClearEntry,
      handlePercent,
    };
  });

  // Keyboard Event Trapping: Active ONLY when this tab is selected
  // Listener is attached once on activation and never torn down on keystrokes
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is inside an input/textarea element
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key;
      const {
        handleDigit: onDigit,
        handleDecimal: onDecimal,
        handleOperator: onOperator,
        handleEquals: onEquals,
        handleBackspace: onBackspace,
        handleAllClear: onAllClear,
        handleClearEntry: onClearEntry,
        handlePercent: onPercent,
      } = handlersRef.current;

      if (key >= "0" && key <= "9") {
        event.preventDefault();
        onDigit(key);
      } else if (key === ".") {
        event.preventDefault();
        onDecimal();
      } else if (key === "+") {
        event.preventDefault();
        onOperator("+");
      } else if (key === "-") {
        event.preventDefault();
        onOperator("-");
      } else if (key === "*" || key === "x" || key === "X") {
        event.preventDefault();
        onOperator("×");
      } else if (key === "/") {
        // Prevent default browser quick find
        event.preventDefault();
        onOperator("÷");
      } else if (key === "Enter" || key === "=") {
        // Prevent default form submission or button click
        event.preventDefault();
        onEquals();
      } else if (key === "Backspace") {
        // Prevent default back navigation
        event.preventDefault();
        onBackspace();
      } else if (key === "Escape") {
        event.preventDefault();
        onAllClear();
      } else if (key === "%") {
        event.preventDefault();
        onPercent();
      } else if (key === "c" || key === "C") {
        event.preventDefault();
        onClearEntry();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  const loadFromHistory = (item: HistoryItem) => {
    if (isLocked) setIsLocked(false);
    const cleanResult = item.result.replace(/,/g, "");
    if (cleanResult.startsWith("Error")) {
      setDisplay("0");
    } else {
      setDisplay(cleanResult);
    }
    setPreviousValue(null);
    setPendingOperator(null);
    setWaitingForOperand(true);
    setHistoryExpression(`Ans = ${item.result}`);
    setShowHistory(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Calculator Shell */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Display Screen */}
        <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 mb-5 shadow-inner">
          {/* Sub-header: Previous Expression / Status */}
          <div className="flex items-center justify-between text-xs font-mono h-5 mb-1 text-slate-400">
            <span
              data-testid="formula-display"
              className="truncate max-w-[260px] tracking-wide"
            >
              {historyExpression || "\u00A0"}
            </span>
            <div className="flex items-center gap-2">
              {memory !== 0 && (
                <span
                  data-testid="memory-indicator"
                  className="inline-flex items-center gap-1 text-cyan-400 text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded font-mono"
                >
                  M: {formatNumber(String(memory))}
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center gap-1 text-rose-400 text-[11px] font-semibold animate-pulse">
                  <AlertCircle size={12} />
                  LOCKED
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1 rounded-md transition-colors ${
                  showHistory
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                title="Toggle History"
              >
                <History size={14} />
              </button>
            </div>
          </div>

          {/* Main Output Display */}
          <div className="text-right overflow-x-auto select-all">
            <span
              data-testid="calculator-display"
              className={`font-mono font-medium tracking-tight block ${
                display === "Cannot divide by zero"
                  ? "text-rose-400 text-2xl font-bold py-1.5"
                  : display.length > 11
                  ? "text-3xl text-slate-100"
                  : "text-4xl text-slate-100"
              }`}
            >
              {formatNumber(display)}
            </span>
          </div>
        </div>

        {/* Collapsible History Drawer */}
        {showHistory && (
          <div className="mb-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <History size={12} /> Recent Calculations
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-slate-500 hover:text-rose-400 flex items-center gap-1"
                >
                  <Trash2 size={11} /> Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-slate-600 text-center py-3">
                No calculations yet
              </p>
            ) : (
              <div className="space-y-1.5">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors flex justify-between items-center group font-mono"
                  >
                    <span className="text-slate-400 truncate max-w-[190px]">
                      {item.expression}
                    </span>
                    <span className="text-indigo-400 font-semibold group-hover:text-cyan-400">
                      {item.result}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Memory Registers Row */}
        <div className="grid grid-cols-4 gap-2 mb-3 select-none">
          <button
            type="button"
            onClick={handleMemoryClear}
            className="h-10 rounded-xl font-semibold text-xs bg-slate-800/70 hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 border border-slate-700/40 transition-all active:scale-95"
            title="Memory Clear"
          >
            MC
          </button>
          <button
            type="button"
            onClick={handleMemoryRecall}
            className="h-10 rounded-xl font-semibold text-xs bg-slate-800/70 hover:bg-slate-700/70 text-slate-400 hover:text-slate-200 border border-slate-700/40 transition-all active:scale-95"
            title="Memory Recall"
          >
            MR
          </button>
          <button
            type="button"
            onClick={handleMemoryAdd}
            className="h-10 rounded-xl font-semibold text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/25 transition-all active:scale-95"
            title="Memory Add"
          >
            M+
          </button>
          <button
            type="button"
            onClick={handleMemorySubtract}
            className="h-10 rounded-xl font-semibold text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/25 transition-all active:scale-95"
            title="Memory Subtract"
          >
            M−
          </button>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2.5 select-none">
          {/* Row 1 */}
          <button
            type="button"
            onClick={handleAllClear}
            className="h-14 rounded-2xl font-semibold text-sm bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 active:scale-95 transition-all border border-rose-500/20"
          >
            AC
          </button>
          <button
            type="button"
            onClick={handleToggleSign}
            disabled={isLocked}
            className="h-14 rounded-2xl font-semibold text-sm bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 active:scale-95 transition-all border border-slate-700/50 disabled:opacity-40"
          >
            ±
          </button>
          <button
            type="button"
            onClick={handlePercent}
            disabled={isLocked}
            className="h-14 rounded-2xl font-semibold text-sm bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 active:scale-95 transition-all border border-slate-700/50 disabled:opacity-40"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => handleOperator("÷")}
            disabled={isLocked}
            className={`h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 border ${
              pendingOperator === "÷"
                ? "bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20"
                : "bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border-indigo-500/30"
            } disabled:opacity-40`}
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => handleDigit("7")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleDigit("8")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleDigit("9")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleOperator("×")}
            disabled={isLocked}
            className={`h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 border ${
              pendingOperator === "×"
                ? "bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20"
                : "bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border-indigo-500/30"
            } disabled:opacity-40`}
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            type="button"
            onClick={() => handleDigit("4")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleDigit("5")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleDigit("6")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleOperator("-")}
            disabled={isLocked}
            className={`h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 border ${
              pendingOperator === "-"
                ? "bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20"
                : "bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border-indigo-500/30"
            } disabled:opacity-40`}
          >
            −
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => handleDigit("1")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleDigit("2")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleDigit("3")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleOperator("+")}
            disabled={isLocked}
            className={`h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 border ${
              pendingOperator === "+"
                ? "bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20"
                : "bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border-indigo-500/30"
            } disabled:opacity-40`}
          >
            +
          </button>

          {/* Row 5 */}
          <button
            type="button"
            onClick={() => handleDigit("0")}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDecimal}
            disabled={isLocked}
            className="h-14 rounded-2xl font-bold text-lg bg-slate-800/50 text-slate-100 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 disabled:opacity-40"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isLocked}
            className="h-14 rounded-2xl font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 active:scale-95 transition-all border border-slate-700/40 flex items-center justify-center disabled:opacity-40"
            title="Backspace"
          >
            <Delete size={18} />
          </button>
          <button
            type="button"
            onClick={handleEquals}
            disabled={isLocked}
            className="h-14 rounded-2xl font-bold text-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 border border-indigo-400/30 disabled:opacity-40 flex items-center justify-center"
          >
            =
          </button>
        </div>

        {/* Keyboard Shortcut Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CornerDownLeft size={11} /> Keyboard active
          </span>
          <span className="font-mono">
            [0-9] [+-*/] [Enter =] [Esc AC] [Del]
          </span>
        </div>
      </div>
    </div>
  );
}

const ArithmeticCalculator = memo(ArithmeticCalculatorComponent);
export default ArithmeticCalculator;
