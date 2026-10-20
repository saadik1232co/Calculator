# App Roles: OmniCalc Suite

This document defines the primary user roles for the OmniCalc multi-mode calculator web application. Each role describes a real person, their practical context, what they interact with in the application, and the strict negative boundaries the application must enforce.

---

## Role Definitions

- **App Role R-1 (Everyday Consumer)**. "An Everyday Consumer is an individual shopping on a defined budget who needs to verify actual out-of-pocket retail costs before purchasing. They can select the discount calculator, enter original prices, toggle percentage or dollar-off promotions, adjust sales tax rates, scale quantities, reset values to baseline defaults, and view their total savings. They must never be shown negative prices, have sales tax calculated on pre-discount amounts, or have their entered figures wiped when navigating between tabs."

- **App Role R-2 (Prospective Homebuyer)**. "A Prospective Homebuyer is a property seeker evaluating the long-term affordability of purchasing real estate within their recurring income. They can adjust property prices, down payments, interest rates, and loan terms, customize escrow taxes, insurance, and HOA dues, simulate early debt payoff with extra monthly principal, inspect annual amortization tables, and restore default scenarios. They must never encounter division-by-zero crashes on zero-interest loans, be permitted down payments exceeding home values, or trigger infinite calculation loops during payoff simulations."

- **App Role R-3 (Desk Worker)**. "A Desk Worker is a professional or administrative employee who performs rapid numerical tallies, audits figures, and balances daily ledgers during work tasks. They can perform continuous arithmetic operations using on-screen buttons or keyboard shortcuts, store and recall figures using memory registers (MC, MR, M+, M-), inspect historical calculation logs, and load previous results back into the active expression. They must never see unhandled division-by-zero crashes, experience floating-point precision drift (e.g. 0.30000000000000004), or lose active calculation state when switching between calculator modules."

---

## Summary Matrix

| Role | Primary Module | Core Needs | Invariant Boundaries |
| :--- | :--- | :--- | :--- |
| **Everyday Consumer** | Discount & Sale Calculator | True out-of-pocket cost, sales tax estimation, quantity scaling, quick resets | Floored at $0.00; tax only on discounted subtotal; zero data loss on tab navigation |
| **Prospective Homebuyer** | Mortgage & Loan Estimator | Complete monthly carrying cost (P&I, tax, insurance, HOA), extra payment savings, annual amortization | No division-by-zero at 0% interest; down payment clamped to home price; bounded simulation loops |
| **Desk Worker** | Standard Arithmetic Calculator | Rapid keyboard entry, memory keys (MC/MR/M+/M-), calculation history drawer | Graceful division-by-zero error state; zero floating-point drift; state preserved across tabs |
