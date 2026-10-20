# User Stories & Acceptance Criteria: OmniCalc Suite

This document defines the User Stories, Implementation Status, and bound Acceptance Criteria for the OmniCalc web application. Every user story explicitly links to the Job To Be Done it serves and the Role it belongs to. Acceptance criteria are nested directly beneath each story following the `Given [starting state], when [action], then [observable result]` structure, covering standard flows, boundaries, invalid entries, and continuation.

---

## Discount & Sale Calculation

- **User Story S-1 (serves J-1, Implemented)**. "As an Everyday Consumer, I want to calculate discounted retail prices with customizable sales tax, so that I can see my exact out-of-pocket cost and total dollar savings before purchasing."
  - Given an original price of $120.00, a discount of 25%, and a sales tax rate of 8.25%, when I view the calculation, then I see a discounted subtotal of $90.00, an estimated tax of $7.43, a final price of $97.43, and a total savings badge of $22.57 (25% off).
  - Given a fixed dollar discount of $150.00 on an original price of $100.00, when I calculate the total, then the discount is capped at $100.00, the subtotal is floored at $0.00, and the final price displays $0.00 with no negative totals.
  - Given a negative price of -$50.00 or negative tax of -5% entered into the inputs, when I submit or change focus, then the inputs automatically clamp to 0 and the final price renders $0.00 without throwing an exception.

- **User Story S-2 (serves J-1, Implemented)**. "As an Everyday Consumer, I want to scale my discount calculation across multiple identical items and reset my inputs to defaults, so that I can evaluate bulk purchase costs and quickly start a fresh calculation."
  - Given an item with a final unit price of $97.43 and a current quantity of 1, when I increment the quantity counter to 4, then the final total updates immediately to $389.72 and the total savings update to $90.28.
  - Given a quantity of 1, when I click the decrement button, then the quantity remains 1 and does not decrement to 0 or negative values.
  - Given custom modified discount and price values, when I click the Reset button in the discount header, then all inputs restore to their initial defaults ($120.00 price, 25% discount, 8.25% tax, quantity 1) and a confirmation toast appears.

---

## Mortgage & Housing Cost Calculation

- **User Story S-3 (serves J-2, Implemented)**. "As a Prospective Homebuyer, I want to estimate my complete monthly housing payment including principal, interest, taxes, insurance, and HOA dues, so that I understand the full recurring cost of owning a specific home."
  - Given a home price of $450,000, a 20% down payment ($90,000), a 30-year fixed term at 6.5% interest, $5,400/year property tax, $1,400/year insurance, and $150/month HOA, when I inspect the loan summary, then I see a monthly principal and interest payment of $2,275, property tax of $450, insurance of $117, HOA of $150, and a total monthly payment of $2,992.
  - Given an interest rate set to 0.0%, when I calculate the payment, then the application executes the linear zero-interest calculation ($360,000 / 360 months = $1,000/month principal) and does not crash with a division-by-zero error.
  - Given a down payment amount entered as $500,000 on a $450,000 home, when I evaluate the inputs, then the down payment is clamped to $450,000 (100%), the loan principal becomes $0, and monthly principal & interest renders as $0.

- **User Story S-4 (serves J-3, Implemented)**. "As a Prospective Homebuyer, I want to model extra monthly principal contributions and inspect an annual amortization schedule, so that I can see how much interest and time I save over the life of the loan."
  - Given a 30-year loan of $360,000 at 6.5% interest, when I enter an extra monthly payment of $200, then I see a highlight message showing exact thousands saved in lifetime interest and years/months cut from the repayment term.
  - Given an active mortgage calculation, when I toggle the "View Annual Amortization Schedule" button, then an annual breakdown table appears listing Year 1 through 30 with Principal Paid, Interest Paid, Cumulative Interest, and Remaining Balance for each year.
  - Given an extra monthly payment entered as $10,000,000 which far exceeds the outstanding balance, when the simulation executes, then the payoff loop safely terminates in month 1 once the balance reaches $0.00 without causing an infinite loop or browser hang.

---

## Desk Arithmetic & Operational Calculation

- **User Story S-5 (serves J-4, Implemented)**. "As a Desk Worker, I want to perform multi-step arithmetic using both keypad buttons and physical keyboard keys, so that I can compute figures quickly with zero precision drift or unhandled math errors."
  - Given the arithmetic calculator is active, when I press 1, 2, ., 5, +, 7, ., 5, Enter on my physical keyboard, then the formula line displays 12.5 + 7.5 = and the main display shows 20.
  - Given an entry of 50 followed by ÷ and 0 and =, when I evaluate, then the display renders "Cannot divide by zero", operational buttons remain locked, and pressing AC or the Escape key clears the screen back to 0.
  - Given an active display showing 0.1, when I press + and 0.2 and =, then the display outputs exactly 0.3 without floating-point artifacts (such as 0.30000000000000004).

- **User Story S-6 (serves J-4, Implemented)**. "As a Desk Worker, I want to store intermediate figures in memory registers and recall prior calculations from a log, so that I can reuse figures without manually copying them."
  - Given a displayed value of 250, when I click M+, then the memory indicator updates to "M: 250", and when I clear the screen, compute 50 × 2, and press MR, then 250 is recalled to the active display.
  - Given multiple completed calculations, when I click the "History" button, then an overlay drawer displays up to 20 chronological calculation records with timestamps, formulas, and results.
  - Given an entry in the history drawer with result "1,420", when I click that entry, then "1420" loads immediately into the calculator display and the history drawer closes.

---

## Cross-Cutting Navigation & State Persistence

- **User Story S-7 (serves J-1, J-2, J-4, Implemented)**. "As any App Role (Everyday Consumer, Prospective Homebuyer, or Desk Worker), I want my inputs, active calculations, and states to be preserved when I navigate between tabs, so that I can cross-reference numbers without retyping them."
  - Given I have entered a $650,000 home price in the Mortgage tab, when I switch to the Discount tab and enter a $350 item, and then switch back to the Mortgage tab, then my $650,000 home price and its calculated monthly payment remain fully intact.
  - Given I have an ongoing calculation of 850 in the Arithmetic tab, when I switch to the Mortgage tab to check a payment and return to the Arithmetic tab, then 850 remains on the display and the memory register remains unchanged.
  - Given I switch tabs repeatedly while the browser window size changes between mobile and desktop widths, when I return to any tab, then all interactive sliders, input fields, and calculation results remain visible, correctly formatted, and reactive.

---

## Planned Backlog Features

- **User Story S-8 (serves J-2, Not implemented)**. "As a Prospective Homebuyer, I want to compare two mortgage scenarios side-by-side (such as 15-year fixed versus 30-year fixed), so that I can evaluate tradeoffs between monthly payment burden and overall interest expense."
  - Given a loan principal of $400,000 at 6.5%, when I select "Compare Scenarios" with 15-year and 30-year terms, then I see two parallel comparison columns displaying monthly payment ($3,485 vs. $2,528) and total lifetime interest ($227,358 vs. $510,179).
  - Given the side-by-side comparison view, when I adjust the interest rate on the 15-year option, then the 30-year option remains fixed as a benchmark and a delta badge highlights the updated differences in payments.
  - Given the comparison view, when I click "Apply Scenario A", then Scenario A's values populate the primary loan calculator and close the comparison view.

- **User Story S-9 (serves J-1, Not implemented)**. "As an Everyday Consumer, I want to track calculated items against a target shopping budget, so that I can ensure my total basket does not exceed my available spending limit."
  - Given a target budget set to $200.00 and a calculated item totaling $45.00, when I click "Add to Basket", then the running basket total updates to $45.00 and remaining budget displays $155.00.
  - Given a remaining budget of $20.00 and an item totaling $35.00, when I click "Add to Basket", then the remaining balance displays -$15.00 in red with an "Over Budget" alert.
  - Given an active shopping basket with multiple items, when I click "Clear Basket", then all items are removed and the remaining balance resets to the initial budget of $200.00.
