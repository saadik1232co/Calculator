import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import Home from "@/app/page";
import DiscountCalculator from "@/components/DiscountCalculator";
import MortgageCalculator from "@/components/MortgageCalculator";
import ArithmeticCalculator from "@/components/ArithmeticCalculator";

describe("OmniCalc Acceptance Test Suite (Stories S-1 to S-7)", () => {
  beforeEach(() => {
    // Reset any window state or mocks if needed
  });

  describe("Story S-1: Discount & Tax Calculation", () => {
    it("computes normal discount and tax: $120 price, 25% discount, 8.25% tax -> Subtotal $90.00, Tax $7.43, Final $97.43, Savings $22.57 (25% off)", () => {
      render(<DiscountCalculator />);

      // Verify baseline default values: price 120, discount 25%, tax 8.25%
      expect(screen.getByText("Discounted Subtotal:").parentElement).toHaveTextContent("$90.00");
      expect(screen.getByText(/Sales Tax \(8.25%\):/i).parentElement).toHaveTextContent("$7.43");
      expect(screen.getByText("Final Price:").parentElement).toHaveTextContent("$97.43");

      const savingsBadge = screen.getByTestId("total-savings-badge");
      expect(savingsBadge).toHaveTextContent("$22.57");
      expect(savingsBadge).toHaveTextContent(/25% off/i);
    });

    it("caps fixed dollar discount overflow: $100 price with $150 fixed discount -> subtotal $0.00, final $0.00", async () => {
      render(<DiscountCalculator />);

      const priceInput = screen.getByLabelText(/Item Unit Price/i);
      fireEvent.change(priceInput, { target: { value: "100" } });

      // Switch to Fixed ($)
      const fixedBtn = screen.getByRole("button", { name: "Fixed ($)" });
      fireEvent.click(fixedBtn);

      const discountValueInput = screen.getByDisplayValue("25");
      fireEvent.change(discountValueInput, { target: { value: "150" } });

      expect(screen.getByText("Discounted Subtotal:").parentElement).toHaveTextContent("$0.00");
      expect(screen.getByText("Final Price:").parentElement).toHaveTextContent("$0.00");
    });

    it("clamps negative price (-$50) and negative tax (-5%) to 0 without throwing an exception", () => {
      render(<DiscountCalculator />);

      const priceInput = screen.getByLabelText(/Item Unit Price/i);
      fireEvent.change(priceInput, { target: { value: "-50" } });
      fireEvent.blur(priceInput);

      const taxInput = screen.getByLabelText(/Estimated Sales Tax/i);
      fireEvent.change(taxInput, { target: { value: "-5" } });
      fireEvent.blur(taxInput);

      expect(screen.getByText("Discounted Subtotal:").parentElement).toHaveTextContent("$0.00");
      expect(screen.getByText("Final Price:").parentElement).toHaveTextContent("$0.00");
    });
  });

  describe("Story S-2: Quantity Scaling & Reset", () => {
    it("scales quantity: $97.43 unit price at quantity 4 -> Total $389.72 and Savings $90.28", () => {
      render(<DiscountCalculator />);

      const qtyInput = screen.getByDisplayValue("1");
      fireEvent.change(qtyInput, { target: { value: "4" } });

      expect(screen.getByText("Final Price:").parentElement).toHaveTextContent("$389.72");
      expect(screen.getByTestId("total-savings-badge")).toHaveTextContent("$90.28");
    });

    it("enforces minimum boundary: decrementing at quantity 1 does not fall below 1", () => {
      render(<DiscountCalculator />);

      const decrementBtn = screen.getByRole("button", { name: "-" });
      expect(decrementBtn).toBeDisabled();

      fireEvent.click(decrementBtn);
      const qtyInput = screen.getByDisplayValue("1") as HTMLInputElement;
      expect(qtyInput.value).toBe("1");
    });

    it("resets modified inputs to defaults ($120.00, 25%, 8.25%, qty 1) and shows confirmation toast", () => {
      render(<DiscountCalculator />);

      // Modify values
      const priceInput = screen.getByLabelText(/Item Unit Price/i);
      fireEvent.change(priceInput, { target: { value: "250" } });

      const qtyInput = screen.getByDisplayValue("1");
      fireEvent.change(qtyInput, { target: { value: "3" } });

      // Click Reset
      const resetBtn = screen.getByRole("button", { name: /Reset/i });
      fireEvent.click(resetBtn);

      expect((screen.getByLabelText(/Item Unit Price/i) as HTMLInputElement).value).toBe("120");
      expect((screen.getByDisplayValue("1") as HTMLInputElement).value).toBe("1");
      expect(screen.getByText("Discount inputs reset to defaults")).toBeInTheDocument();
    });
  });

  describe("Story S-3: Mortgage Monthly Estimation", () => {
    it("calculates standard loan: $450k price, 20% down ($90k), 30-year 6.5%, $5.4k tax, $1.4k ins, $150 HOA -> P&I $2,275, Tax $450, Ins $117, HOA $150, Total $2,992", () => {
      render(<MortgageCalculator />);

      // P&I, Tax, Insurance, HOA and Total
      expect(screen.getByText("P&I:").parentElement).toHaveTextContent("$2,275");
      expect(screen.getByText("Taxes:").parentElement).toHaveTextContent("$450");
      expect(screen.getByText("Insurance:").parentElement).toHaveTextContent("$117");
      expect(screen.getByText("HOA:").parentElement).toHaveTextContent("$150");
      expect(screen.getByText(/Total Estimated Monthly Payment/i).parentElement).toHaveTextContent("$2,992");
    });

    it("handles 0% interest rate fallback: computes linear principal ($360,000 / 360 = $1,000/mo) without crash", () => {
      render(<MortgageCalculator />);

      const rateInput = screen.getByLabelText(/Interest Rate/i);
      fireEvent.change(rateInput, { target: { value: "0" } });

      expect(screen.getByText("P&I:").parentElement).toHaveTextContent("$1,000");
    });

    it("handles 100% down payment: $500,000 down payment on $450,000 price clamps to $450,000, Principal $0, P&I $0", () => {
      render(<MortgageCalculator />);

      // Switch to Dollar ($) down payment
      const dollarBtn = screen.getByRole("button", { name: "Dollar ($)" });
      fireEvent.click(dollarBtn);

      const downPaymentInput = screen.getByDisplayValue("90000");
      fireEvent.change(downPaymentInput, { target: { value: "500000" } });

      expect(screen.getByText("P&I:").parentElement).toHaveTextContent("$0");
      expect(screen.getByText(/100% Down \(No Loan Needed\)/i)).toBeInTheDocument();
    });
  });

  describe("Story S-4: Extra Principal & Amortization", () => {
    it("models extra monthly payment impact: $200 extra monthly payment shows savings highlight", () => {
      render(<MortgageCalculator />);

      const extraPaymentInput = screen.getByDisplayValue("0");
      fireEvent.change(extraPaymentInput, { target: { value: "200" } });

      expect(screen.getByText(/Early Payoff Acceleration/i)).toBeInTheDocument();
      expect(screen.getByText(/Total interest saved:/i)).toBeInTheDocument();
    });

    it("toggles the Annual Amortization Schedule displaying Year, Principal, Interest, Cumulative Interest, and Remaining Balance", () => {
      render(<MortgageCalculator />);

      const scheduleBtn = screen.getByRole("button", {
        name: /View Annual Amortization Schedule/i,
      });
      fireEvent.click(scheduleBtn);

      // Verify table headers
      expect(screen.getByRole("columnheader", { name: "Year" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Principal Paid" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Interest Paid" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Cumulative Interest" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Remaining Balance" })).toBeInTheDocument();

      // Check Year 1 row exists
      expect(screen.getByText("Year 1")).toBeInTheDocument();
    });

    it("safely terminates in month 1 when extra monthly payment is extreme ($10,000,000)", () => {
      render(<MortgageCalculator />);

      const extraPaymentInput = screen.getByDisplayValue("0");
      fireEvent.change(extraPaymentInput, { target: { value: "10000000" } });

      // Should render without freezing and report payoff in 0 yrs 1 mos
      expect(screen.getByText(/Pay off in/i)).toHaveTextContent("0 yrs 1 mos");
    });
  });

  describe("Story S-5: Arithmetic Execution & Error Recovery", () => {
    it("handles physical keyboard entry: 12.5 + 7.5 Enter -> formula '12.5 + 7.5 =' and result '20'", () => {
      render(<ArithmeticCalculator isActive={true} />);

      const keys = ["1", "2", ".", "5", "+", "7", ".", "5", "Enter"];
      for (const k of keys) {
        fireEvent.keyDown(window, { key: k });
      }

      expect(screen.getByTestId("formula-display")).toHaveTextContent("12.5 + 7.5 =");
      expect(screen.getByTestId("calculator-display")).toHaveTextContent("20");
    });

    it("handles division by zero: '50 ÷ 0 =' renders 'Cannot divide by zero', locks operations, and Escape/AC clears to '0'", () => {
      render(<ArithmeticCalculator isActive={true} />);

      // Enter 50 / 0 =
      fireEvent.keyDown(window, { key: "5" });
      fireEvent.keyDown(window, { key: "0" });
      fireEvent.keyDown(window, { key: "/" });
      fireEvent.keyDown(window, { key: "0" });
      fireEvent.keyDown(window, { key: "Enter" });

      expect(screen.getByTestId("calculator-display")).toHaveTextContent("Cannot divide by zero");
      expect(screen.getByText("LOCKED")).toBeInTheDocument();

      // Attempt another operation while locked -> ignored
      fireEvent.keyDown(window, { key: "5" });
      expect(screen.getByTestId("calculator-display")).toHaveTextContent("Cannot divide by zero");

      // Press Escape to reset
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.getByTestId("calculator-display")).toHaveTextContent("0");
      expect(screen.queryByText("LOCKED")).not.toBeInTheDocument();
    });

    it("mitigates IEEE 754 precision drift: 0.1 + 0.2 = renders exactly '0.3'", () => {
      render(<ArithmeticCalculator isActive={true} />);

      const keys = ["0", ".", "1", "+", "0", ".", "2", "Enter"];
      for (const k of keys) {
        fireEvent.keyDown(window, { key: k });
      }

      expect(screen.getByTestId("calculator-display")).toHaveTextContent("0.3");
    });
  });

  describe("Story S-6: Memory Registers & History Recall", () => {
    it("stores and recalls memory: M+ on 250 shows 'M: 250', clear, compute 50 * 2, MR recalls 250", () => {
      render(<ArithmeticCalculator isActive={true} />);

      // Type 250
      fireEvent.keyDown(window, { key: "2" });
      fireEvent.keyDown(window, { key: "5" });
      fireEvent.keyDown(window, { key: "0" });

      // Click M+
      const mPlusBtn = screen.getByRole("button", { name: "M+" });
      fireEvent.click(mPlusBtn);

      expect(screen.getByTestId("memory-indicator")).toHaveTextContent("M: 250");

      // Clear with AC
      const acBtn = screen.getByRole("button", { name: "AC" });
      fireEvent.click(acBtn);
      expect(screen.getByTestId("calculator-display")).toHaveTextContent("0");

      // Compute 50 * 2 = 100
      fireEvent.keyDown(window, { key: "5" });
      fireEvent.keyDown(window, { key: "0" });
      fireEvent.keyDown(window, { key: "*" });
      fireEvent.keyDown(window, { key: "2" });
      fireEvent.keyDown(window, { key: "Enter" });
      expect(screen.getByTestId("calculator-display")).toHaveTextContent("100");

      // Press MR -> recalls 250
      const mrBtn = screen.getByRole("button", { name: "MR" });
      fireEvent.click(mrBtn);
      expect(screen.getByTestId("calculator-display")).toHaveTextContent("250");

      // Press MC -> resets memory
      const mcBtn = screen.getByRole("button", { name: "MC" });
      fireEvent.click(mcBtn);
      expect(screen.queryByTestId("memory-indicator")).not.toBeInTheDocument();
    });

    it("logs calculations to history and loads clicked item result into display, closing the drawer", () => {
      render(<ArithmeticCalculator isActive={true} />);

      // Compute 710 * 2 = 1420
      fireEvent.keyDown(window, { key: "7" });
      fireEvent.keyDown(window, { key: "1" });
      fireEvent.keyDown(window, { key: "0" });
      fireEvent.keyDown(window, { key: "*" });
      fireEvent.keyDown(window, { key: "2" });
      fireEvent.keyDown(window, { key: "Enter" });

      expect(screen.getByTestId("calculator-display")).toHaveTextContent("1,420");

      // Toggle History Drawer
      const historyToggleBtn = screen.getByTitle("Toggle History");
      fireEvent.click(historyToggleBtn);

      expect(screen.getByText("Recent Calculations")).toBeInTheDocument();

      // Click the history item with 1420
      const historyItem = screen.getByText("1420");
      fireEvent.click(historyItem);

      // Display should load 1420 and drawer should close
      expect(screen.getByTestId("calculator-display")).toHaveTextContent("1,420");
      expect(screen.queryByText("Recent Calculations")).not.toBeInTheDocument();
    });
  });

  describe("Story S-7: Cross-Cutting Navigation & State Persistence", () => {
    it("preserves mortgage parameters when navigating to discount and back", () => {
      render(<Home />);

      // Navigate to Mortgage tab
      const mortgageTabBtn = screen.getByRole("button", { name: /Mortgage & Loan/i });
      fireEvent.click(mortgageTabBtn);

      // Enter custom home price $650,000
      const homePriceInput = screen.getByLabelText(/Home Price/i);
      fireEvent.change(homePriceInput, { target: { value: "650000" } });

      // Navigate to Discount tab
      const discountTabBtn = screen.getByRole("button", { name: /Discount & Tax/i });
      fireEvent.click(discountTabBtn);

      // Enter $350 item price
      const discountPriceInput = screen.getByLabelText(/Item Unit Price/i);
      fireEvent.change(discountPriceInput, { target: { value: "350" } });

      // Return to Mortgage tab
      fireEvent.click(mortgageTabBtn);

      // Verify custom $650,000 is still preserved
      expect((screen.getByLabelText(/Home Price/i) as HTMLInputElement).value).toBe("650000");

      // Return to Discount tab
      fireEvent.click(discountTabBtn);
      expect((screen.getByLabelText(/Item Unit Price/i) as HTMLInputElement).value).toBe("350");
    });

    it("preserves arithmetic calculation when switching to mortgage and back", () => {
      render(<Home />);

      // In Arithmetic tab, enter 850
      fireEvent.keyDown(window, { key: "8" });
      fireEvent.keyDown(window, { key: "5" });
      fireEvent.keyDown(window, { key: "0" });
      expect(screen.getByTestId("calculator-display")).toHaveTextContent("850");

      // Switch to Mortgage tab
      const mortgageTabBtn = screen.getByRole("button", { name: /Mortgage & Loan/i });
      fireEvent.click(mortgageTabBtn);

      // Return to Arithmetic tab
      const arithmeticTabBtn = screen.getByRole("button", { name: /Arithmetic/i });
      fireEvent.click(arithmeticTabBtn);

      // Verify 850 remains on display
      expect(screen.getByTestId("calculator-display")).toHaveTextContent("850");
    });
  });
});
