# Session Transcript: OmniCalc Development & Test Automation

- **Date**: October 20–21, 2026
- **Workspace**: `d:\antigravity`
- **Application**: OmniCalc — Multi-Mode Engineering & Financial Calculator
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Vitest, React Testing Library
- **Tested Environment**: Node.js `v24.22.0`
- **Participants**: User & Antigravity (Google DeepMind)

---

## Executive Summary

Over the course of this development session, the team initialized an empty Next.js project and engineered **OmniCalc**, an enterprise-grade, multi-mode calculator web application featuring:
1. **Standard Arithmetic Calculator** with IEEE 754 precision drift mitigation, division-by-zero engine locking, 15-digit caps, memory registers (`MC`, `MR`, `M+`, `M−`), calculation history recall, and keyboard shortcuts.
2. **Mortgage & Loan Estimator** with 0% APR linear fallback, down payment clamping, bi-weekly payment options, extra monthly principal simulations, and a full amortization schedule with cumulative interest tracking.
3. **Discount & Sales Tax Calculator** with percentage/dollar discounts, quantity scaling, negative input guards, and a one-click clipboard receipt summary.
4. **Architecture & Persistence**: Tab state persistence via CSS display toggles (`block` / `hidden`) preventing component unmounting, alongside dedicated reset handlers with toast feedback.
5. **Quality Assurance**: A 19-test automated suite using Vitest and React Testing Library validating all acceptance criteria defined in [docs/user_stories.md](file:///d:/antigravity/docs/user_stories.md) (Stories S-1 through S-7).
6. **Package Audit & Production Build**: Full dependency resolution (`postcss`, `autoprefixer`, `@types/node`), zero ESLint warnings, 100% test pass rate, and successful Next.js production build.
7. **Performance & Code-Quality Optimization**: Refactored keyboard event listener trapping via `handlersRef`, extracted pure reusable utilities to `lib/utils.ts`, eliminated unnecessary re-renders via `React.memo` and `useCallback`, optimized amortization math to $O(1)$, eliminated inline style object creation, and introduced defensive `ErrorBoundary` module protections.

---

## Chronological Session Log

### Turn 1: Project Initialization

**User Prompt**:
> first of all set up a next js empty project

**Actions Taken**:
- Bootstrapped a clean Next.js 16 App Router application in `d:\antigravity` using `create-next-app` with TypeScript, Tailwind CSS, ESLint, `src/` directory layout, and the `@/*` import alias.
- Replaced default boilerplate with a clean starting page in [src/app/page.tsx](file:///d:/antigravity/src/app/page.tsx) and minimal styles in [src/app/globals.css](file:///d:/antigravity/src/app/globals.css).
- **Outcome**: Clean, compiling baseline project ready for feature development.

---

### Turn 2: Conversation Logging Inquiries

**User Prompt**:
> the conversation that we have here is there a way to get the transscript of this ?

**Actions Taken**:
- Clarified how Antigravity records internal execution steps and transcripts in `.system_generated/logs/transcript.jsonl` and `transcript_full.jsonl`.
- Outlined how user prompts, agent thoughts, tool invocations, and command outputs are preserved.

---

### Turn 3: Development Server Startup

**User Prompt**:
> run the project

**Actions Taken**:
- Launched the Next.js development server using `npm.cmd run dev` as a background process.
- Verified local server readiness at `http://localhost:3000`.

---

### Turn 4: OmniCalc Multi-Mode Calculator Implementation

**User Prompt**:
> Create a multi-mode calculator web app in Next.js 14+ (App Router) using TypeScript, Tailwind CSS, and Lucide React icons. 
> 
> The application must include three distinct tabbed modules:
> 1. Standard Arithmetic Calculator
> 2. Mortgage & Loan Estimator
> 3. Discount & Sales Tax Calculator
> 
> ### Architecture & Tech Stack
> - Framework: Next.js (App Router, 'use client' client components)
> - Styling: Tailwind CSS with a modern dark slate palette (#020617 background)
> - Icons: lucide-react
> - Typography: Inter font via next/font/google
> - Layout: Responsive single-page application with a sticky header and segmented tab control
> 
> ### Mandatory Edge-Case & Error-Handling Invariants (Must Not Crash)
> 
> 1. Standard Arithmetic Engine:
>    - Division by Zero: If division by 0 is attempted, return "Cannot divide by zero". Do not output Infinity or NaN. Lock further mathematical operations until the user presses AC or C.
>    - Floating-Point Imprecision: Mitigate IEEE 754 precision drift (e.g., 0.1 + 0.2) by rounding calculations using Math.round(result * 1e10) / 1e10.
>    - Decimal Point Duplication: Disallow entering more than one decimal point in a single number operand.
>    - Operator Switching: If the user clicks an operator (e.g., +) and immediately selects another (e.g., ×), overwrite the pending operator rather than executing an invalid operation.
>    - Sign Negation: Prevent "-0" when toggling ± on zero or empty states.
>    - Character Length: Cap display input at 15 digits to avoid layout overflow, and format integers with thousands-separator commas.
>    - Keyboard Trapping: Only handle keyboard events when the Arithmetic tab is active, and call event.preventDefault() on keys like /, Enter, and Backspace to avoid browser hotkey collisions.
> 
> 2. Mortgage & Loan Estimator:
>    - 0% Interest Rate Fallback: When annual interest is 0%, bypass the standard amortization formula (which divides by zero) and compute monthly payment as Principal / (Years * 12).
>    - Down Payment Boundary: Clamp down payment so it cannot exceed home price (0 <= downPayment <= homePrice). If down payment equals home price, principal is $0 and monthly payment is $0.
>    - Non-Negative Inputs: Clamp all monetary fields (price, taxes, insurance, HOA, extra payment) with Math.max(0, value).
>    - Extra Monthly Payment Simulation: Bounded by the total loan months and terminates when balance <= 0.01 to prevent infinite loops. The final month's principal is capped at the remaining balance.
> 
> 3. Discount & Sale Calculator:
>    - Discount Caps: Clamp percentage discounts between 0% and 100%, and fixed dollar discounts to the current item price. The subtotal must never fall below $0.00.
>    - Stacked Discounts: Compute secondary coupons sequentially against the discounted subtotal, not the original price.
>    - Sales Tax Calculation: Calculate sales tax strictly on the discounted subtotal, not the original pre-discount price.
>    - Quantity Input: Restrict quantity to positive integers >= 1.
>    - Clipboard Fallback: Implement a fallback to document.execCommand('copy') when navigator.clipboard is unavailable in sandboxed environments.
> 
> ### Required Deliverables & Files
> Generate the complete runnable repository structure:
> - package.json (with scripts: dev, build, start, lint)
> - tsconfig.json, next.config.js, tailwind.config.js, postcss.config.js
> - app/layout.tsx, app/globals.css, app/page.tsx
> - README.md documenting prerequisites (Node.js >= 18.18, npm/pnpm), installation steps, script commands, and verified edge-case behaviors.

**Actions Taken**:
- Installed `lucide-react`.
- Engineered modular components:
  - [src/components/ArithmeticCalculator.tsx](file:///d:/antigravity/src/components/ArithmeticCalculator.tsx): Complete arithmetic engine with state locks and keyboard trapping.
  - [src/components/MortgageCalculator.tsx](file:///d:/antigravity/src/components/MortgageCalculator.tsx): Financial engine with amortization math and visual breakdown cards.
  - [src/components/DiscountCalculator.tsx](file:///d:/antigravity/src/components/DiscountCalculator.tsx): Retail calculator with discount types, quantity controls, and stacked coupon calculations.
- Integrated tab switcher in [src/app/page.tsx](file:///d:/antigravity/src/app/page.tsx) with a dark slate palette (`#020617` base).
- Authored comprehensive project documentation in [README.md](file:///d:/antigravity/README.md).

---

### Turn 5: Feature Simplification — Removal of Stacked Coupons

**User Prompt**:
> In the Next.js calculator application, remove the "Stacked Coupons & Discounts" feature from the Discount & Sale Calculator module.
> 
> ### Specific Changes to Apply:
> 1. State & Logic Clean-Up:
>    - Remove the `hasExtraDiscount`, `extraDiscountType`, and `extraDiscountValue` state hooks from `app/page.tsx` (and `calculator.tsx`).
>    - In `discountMetrics`, eliminate the `secondDiscountAmount` calculation and its dependencies. Compute `subtotal` directly as `priceAfterFirst`.
>    - Update return values and dependencies for `discountMetrics` to remove `secondDiscountAmount`, ensuring no unused variable or TypeScript warnings remain.
> 
> 2. UI & Component Clean-Up:
>    - In the input column of the Discount Calculator tab, delete the entire "Stack Additional Coupon / VIP Discount" checkbox section and its conditional input card.
>    - In the results column ("Final Price Hero Card"), remove the "Extra Coupon" breakdown line item so the list displays only: Original Price, Primary Discount, Discounted Subtotal, Sales Tax, and Final Price.
> 
> 3. Verification:
>    - Ensure the primary discount (% or $ off), sales tax calculation, quantity multiplier, and comparison matrix continue to function seamlessly without errors.
>    - Run `npm run lint` and `npm run build` to confirm there are zero TypeScript compilation or linting errors.

**Actions Taken**:
- Eliminated `hasExtraDiscount`, `extraDiscountType`, and `extraDiscountValue` state variables.
- Updated `discountMetrics` in [src/components/DiscountCalculator.tsx](file:///d:/antigravity/src/components/DiscountCalculator.tsx) to compute subtotal directly as `priceAfterFirst`.
- Removed stacked coupon UI inputs and extra discount line items from the Final Price receipt card.
- Verified clean TypeScript compilation and UI alignment.

---

### Turn 6: Feature Simplification — Removal of Discount Comparison Matrix

**User Prompt**:
> In the Next.js calculator application, remove the "Discount Comparison Matrix (Tiers at 0% Tax)" / quantity breakdown table section from the Discount & Sale Calculator module.
> 
> ### Specific Changes to Apply:
> 1. UI & Layout Removal:
>    - In `app/page.tsx` (and `calculator.tsx`), navigate to the Discount & Sale Calculator tab (`activeTab === 'discount'`).
>    - Locate the secondary card in the results column containing the comparison/breakdown table (titled "Discount Comparison Matrix", "Tiers at 0% Tax", or "Quantity Breakdown Table").
>    - Delete the entire card container, its header (`<Layers ... />`), the `<table>` element, and its mapped tier/quantity rows (`[1, 2, 3, 5].map(...)`).
>    - Keep the primary "Final Price" hero card intact above it.
> 
> 2. Code & Logic Clean-Up:
>    - Remove any helper arrays, states, or calculations that exclusively served the discount comparison matrix table.
>    - If the `Layers` icon import from `lucide-react` is no longer used elsewhere in the file, remove it from the import list to avoid unused import warnings.
> 
> 3. Verification:
>    - Ensure the main Final Price card, primary discount inputs, tax calculations, and quantity counter continue to function without visual clipping or alignment issues.
>    - Run `npm run lint` and `npm run build` to verify clean compilation with zero warnings or errors.

**Actions Taken**:
- Located and excised the secondary card in [src/components/DiscountCalculator.tsx](file:///d:/antigravity/src/components/DiscountCalculator.tsx) containing the tier comparison table.
- Removed unused icon imports (`BarChart3`, `Layers`) to prevent linter warnings.
- Confirmed the 5-line receipt hero card rendered cleanly without layout distortion.

---

### Turn 7: Tab State Persistence & Reset Buttons

**User Prompt**:
> In the Next.js calculator application, fix the tab state persistence issue and add dedicated reset buttons to both the Mortgage & Loan and Discount & Sale calculators.
> 
> ### 1. Fix Tab State Persistence Across Tab Switches
> - Problem: Switching between tabs (Standard, Mortgage, Discount) unmounts components or resets inputs back to their initial default values.
> - Solution (CSS Display Toggle):
>   - Do NOT conditionally unmount tabs using `{activeTab === 'tabName' && <Component />}`.
>   - Instead, keep all three tab containers rendered in the DOM simultaneously, controlling visibility using conditional Tailwind display classes:
>     ```tsx
>     <div className={activeTab === 'arithmetic' ? 'block' : 'hidden'}>...</div>
>     <div className={activeTab === 'mortgage' ? 'block' : 'hidden'}>...</div>
>     <div className={activeTab === 'discount' ? 'block' : 'hidden'}>...</div>
>     ```
>   - This ensures that all React states, active inputs, range slider positions, and calculation outputs remain mounted in memory and strictly preserved when the user navigates back and forth between tabs.
> 
> ### 2. Add Reset Buttons for Mortgage & Discount Calculators
> - Define Default Constants:
>   - Create explicit default state constants for each module:
>     - `DEFAULT_MORTGAGE_STATE`: Home Price ($450,000), Down Payment ($90,000 / 20%), Rate (6.5%), Term (30 yrs), Property Tax ($5,400/yr), Insurance ($1,400/yr), HOA ($150/mo), Extra Payment ($0/mo).
>     - `DEFAULT_DISCOUNT_STATE`: Original Price ($120.00), Discount Type ('percent'), Discount Value (25%), Tax Rate (8.25%), Quantity (1).
> - Implement Reset Handlers:
>   - Add `handleResetMortgage()`: Resets all mortgage inputs and closes the amortization table view.
>   - Add `handleResetDiscount()`: Restores all discount, tax, and quantity values to their baseline defaults.
> - UI Implementation:
>   - In the header of the "Loan Parameters" card (Mortgage tab), add a sleek "Reset" button with a `RotateCcw` icon next to the title.
>   - In the header of the "Price & Discount Details" card (Discount tab), add an identical "Reset" button with a `RotateCcw` icon.
>   - Styling: `text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors active:scale-95`.
>   - Trigger a brief confirmation toast (e.g., "Mortgage inputs reset to defaults") when clicked.
> 
> ### 3. Verification:
> - Enter custom values in the Mortgage tab (e.g., $650,000 home price, 15-year term).
> - Switch to the Discount tab, enter custom values (e.g., $250 price, 40% discount), and switch to the Arithmetic tab.
> - Switch back to both tabs and verify all custom numbers and calculation results remain intact.
> - Click the "Reset" button on each tab and verify values cleanly restore to their defaults without page reloads.
> - Run `npm run lint` and `npm run build` to confirm zero TypeScript compilation errors.

**Actions Taken**:
- Replaced conditional unmounting with Tailwind CSS display toggles (`block` / `hidden`), preserving DOM state, active inputs, and calculation memory.
- Defined `DEFAULT_MORTGAGE_STATE` and `DEFAULT_DISCOUNT_STATE` with reset handlers and interactive confirmation toast banners.

---

### Turn 8: Automated Test Suite (Stories S-1 through S-7)

**User Prompt**:
> Read the user stories and acceptance criteria defined in `doc/user-stories.md` at the root of the project, and implement an automated test suite to verify all implemented stories (S-1 through S-7) against the Next.js application.
> 
> ### Test Setup Instructions
> 1. Testing Framework:
>    - Use Vitest (or Jest) with React Testing Library and `@testing-library/jest-dom`, or set up Playwright component tests.
>    - Ensure a test runner script is defined in `package.json` (e.g., `"test": "vitest run"`).
> 
> 2. Implement Test Suites Matching `doc/user-stories.md`:
>    Create a test suite (e.g., `__tests__/calculator.test.tsx` or `e2e/calculator.spec.ts`) asserting every acceptance criterion:
> 
>    - **Story S-1 (Discount & Tax Calculation)**:
>      - Normal calculation: Original price $120.00, 25% discount, 8.25% tax → Subtotal $90.00, Tax $7.43, Final $97.43, Savings $22.57.
>      - Fixed discount overflow: $100 price with $150 fixed discount → Subtotal floored at $0.00, Final price $0.00.
>      - Negative inputs: Negative price (-$50) and negative tax (-5%) → Auto-clamped to 0 with zero crashes.
> 
>    - **Story S-2 (Quantity Scaling & Reset)**:
>      - Quantity multiplier: $97.43 unit price at quantity 4 → Total $389.72, Savings $90.28.
>      - Minimum boundary: Decrementing at quantity 1 remains at 1 (no 0 or negative quantities).
>      - Reset button: Clicking Reset restores price ($120.00), discount (25%), tax (8.25%), and quantity (1).
> 
>    - **Story S-3 (Mortgage Monthly Estimation)**:
>      - Standard loan: $450,000 price, 20% down ($90,000), 30-year term at 6.5%, $5,400/yr tax, $1,400/yr insurance, $150/mo HOA → P&I $2,275, Tax $450, Insurance $117, Total $2,992/mo.
>      - 0% interest rate boundary: Formula switches to linear principal payment ($360,000 / 360 = $1,000/mo) with zero division-by-zero crashes.
>      - 100% down payment: $500,000 down payment on $450,000 price → Clamped to $450,000, Principal $0, P&I $0/mo.
> 
>    - **Story S-4 (Extra Principal & Amortization)**:
>      - Extra payment impact: $200 extra monthly payment calculates lifetime interest saved and reduction in loan term.
>      - Amortization table toggle: Clicking schedule button renders the 30-year amortization table with Year, Principal, Interest, and Remaining Balance columns.
>      - Extreme payment boundary: $10,000,000 extra payment terminates loop in month 1 without infinite execution or hanging.
> 
>    - **Story S-5 (Arithmetic Execution & Error Recovery)**:
>      - Physical keyboard entry: Typing "12.5+7.5{Enter}" displays formula "12.5 + 7.5 =" and result "20".
>      - Division by zero: "50 ÷ 0 =" renders "Cannot divide by zero", locks operations, and pressing Escape/AC resets display to "0".
>      - Floating-point precision: "0.1 + 0.2 =" renders exactly "0.3" without precision drift.
> 
>    - **Story S-6 (Memory Registers & History Recall)**:
>      - Memory keys: Saving 250 with M+, clearing, and pressing MR recalls 250; MC resets memory to 0.
>      - History logging and recall: Completed calculations prepend to the history drawer (up to 20 records); clicking an entry loads its result into the active display.
> 
>    - **Story S-7 (State Persistence Across Tabs)**:
>      - Enter custom values in the Mortgage tab, switch to Discount, enter a custom price, and switch back → Verify mortgage parameters remain unchanged.
>      - Enter an ongoing calculation in Arithmetic, switch to Mortgage, and return → Verify display and formula remain completely intact.
> 
> 3. Execution & Verification:
>    - Run the test suite: `npm test`
>    - If any test fails, inspect the component code, correct the underlying logic or styling, and re-run until 100% of the tests pass.
>    - Output a final execution summary confirming all acceptance criteria from `doc/user-stories.md` have passed.

**Actions Taken**:
- Installed Vitest testing stack (`vitest`, `vite`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitejs/plugin-react`).
- Added memory registers (`MC`, `MR`, `M+`, `M−`) and history recall to [src/components/ArithmeticCalculator.tsx](file:///d:/antigravity/src/components/ArithmeticCalculator.tsx).
- Added `Cumulative Interest` column to the amortization schedule in [src/components/MortgageCalculator.tsx](file:///d:/antigravity/src/components/MortgageCalculator.tsx).
- Implemented comprehensive 19-test suite in [__tests__/calculator.test.tsx](file:///d:/antigravity/__tests__/calculator.test.tsx).
- Executed tests: **19/19 passed cleanly**.

---

### Turn 9: Dependency Audit, Build Verification & README Synchronization

**User Prompt**:
> Audit the Next.js project to resolve any dependency or build errors, and synchronize the project `README.md` with the latest repository structure and features.
> 
> ### 1. Dependency Audit & Package Health
> - Verify `package.json` for proper version compatibility between Next.js (14+), React (18/19), TypeScript, Tailwind CSS, and Lucide icons.
> - Ensure all required types (`@types/react`, `@types/react-dom`, `@types/node`) and post-processing tools (`postcss`, `autoprefixer`) are present under `devDependencies`.
> - Resolve any missing, duplicate, or conflicting peer dependencies.
> - Verify that no unused packages are listed and all required imports across `app/page.tsx` and `app/layout.tsx` exist in `node_modules`.
> 
> ### 2. Build Verification & Error Resolution
> - Execute a strict linting and type-checking pass:
>   ```bash
>   npm run lint
>   ```

**Actions Taken**:
- Added `postcss` and `autoprefixer`, updated `@types/node` to `^22`.
- Ran `npm run lint` (0 errors, 0 warnings), `npm test` (19/19 passing), and `npm run build` (clean static generation).
- Synchronized [README.md](file:///d:/antigravity/README.md).

---

### Turn 10: Human-Readable Session Transcript Generation

**User Prompt**:
> of the conversation we had create a human readable transcript and save it in transcripts/session-01.md at root

**Actions Taken**:
- Authored initial human-readable transcript documenting chronological dialog, actions, technical decisions, and test results.

---

### Turn 11: Prerequisites Documentation & Setup Guidance

**User Prompt**:
> in the read me add tested on node 24.22.0 and it is recommended to run on this version and in install add unzip and then open git bash or 

**Actions Taken**:
- Updated [README.md](file:///d:/antigravity/README.md) Prerequisites with Node `24.22.0` recommendation.
- Added step-by-step unzipping and Git Bash / terminal instructions under Installation & Setup.

---

### Turn 12: Comprehensive Performance Audit & Code-Quality Refactor

**User Prompt**:
> Perform a comprehensive performance audit and code-quality refactor of the Next.js calculator application, eliminating bottlenecks that cause unnecessary re-renders, sluggish UI responses, or bundle bloat. After completing all refactoring, verify build integrity and re-run all test suites against `doc/user-stories.md`.
> 
> ### 1. React Render & Runtime Performance Optimization
> - **Resolve Keyboard Listener Re-Attachments**:
>   - In `useEffect` for keyboard shortcuts, ensure the event handler references memoized action handlers (`useCallback`) or functional state updaters so the global `keydown` event listener is not torn down and re-registered on every keystroke.
> - **Isolate Module State & Eliminate Render Cascades**:
>   - Refactor the monolithic `page.tsx` into modular subcomponents (`ArithmeticCalculator`, `MortgageCalculator`, `DiscountCalculator`) wrapped with `React.memo` where appropriate.
>   - Ensure typing numbers into one calculator tab does not trigger re-renders or state recalculations in the inactive calculator tabs.
> - **Debounce or Throttle Heavy Computations**:
>   - Ensure the 30-year amortization schedule and extra-payment simulation loops are strictly wrapped in `useMemo` with minimal primitive dependencies, and debounce slider drags if they cause frame drops.
> - **State Colocation**:
>   - Move localized UI states (e.g., history drawer toggle, amortization table open/close toggle, temporary toast messages) down into their respective child components rather than maintaining them at the root page level.
> 
> ### 2. Computational & Algorithmic Efficiency
> - **Amortization Loop Optimization**:
>   - In the mortgage payoff simulation loop, optimize loop iterations by calculating annual summaries directly when monthly granularity is not displayed, reducing iteration overhead.
> - **Shared Pure Helper Functions**:
>   - Extract reusable utilities (`clamp`, `formatCurrency`, `formatNumber`, `safeDivide`) into a dedicated `lib/utils.ts` file instead of recalculating or duplicating them inline across components.
> 
> ### 3. Bundle Size & Asset Delivery
> - **Lucide Icon Tree-Shaking**:
>   - Ensure icons are imported as named imports directly from `lucide-react` without bundling the entire icon library.
> - **CSS & Layout Efficiency**:
>   - Verify that keeping all tabs rendered for state preservation (`hidden` vs `block`) does not incur excessive layout thrashing or paint overhead.
>   - Avoid dynamic inline style objects inside render loops; use static Tailwind classes or memoized style values.
> 
> ### 4. Code Quality & Maintainability Standards
> - **Strict TypeScript Types**:
>   - Eliminate any `any` types (e.g., in error catches `catch (err: unknown)`), replacing them with typed error guards.
> - **Defensive Error Boundaries**:
>   - Wrap top-level modules in a lightweight React Error Boundary to prevent unexpected runtime errors from blanking the entire page.
> 
> ### 5. Mandatory Post-Refactor Build Check & Acceptance Criteria Verification
> After completing the performance refactor:
> 1. **Linting Pass**:
>    ```bash
>    npm run lint
>    ```

**Actions Taken**:
1. **Keyboard Event Listener Isolation**: Replaced listener teardown with `handlersRef` in [src/components/ArithmeticCalculator.tsx](file:///d:/antigravity/src/components/ArithmeticCalculator.tsx), eliminating listener recreation on keystrokes.
2. **Render Isolation**: Wrapped [`ArithmeticCalculator`](file:///d:/antigravity/src/components/ArithmeticCalculator.tsx), [`MortgageCalculator`](file:///d:/antigravity/src/components/MortgageCalculator.tsx), [`DiscountCalculator`](file:///d:/antigravity/src/components/DiscountCalculator.tsx), and [`Header`](file:///d:/antigravity/src/components/Header.tsx) with `React.memo` and memoized navigation with `useCallback`.
3. **$O(1)$ Closed-Form Amortization Math**: Calculated standard total interest in $O(1)$ and deferred 30-year schedule generation until the accordion is expanded in [src/components/MortgageCalculator.tsx](file:///d:/antigravity/src/components/MortgageCalculator.tsx).
4. **Shared Pure Helpers**: Centralized mathematical and formatting functions in [src/lib/utils.ts](file:///d:/antigravity/src/lib/utils.ts) (re-exported at [lib/utils.ts](file:///d:/antigravity/lib/utils.ts)).
5. **Defensive Error Boundaries**: Created [src/components/ErrorBoundary.tsx](file:///d:/antigravity/src/components/ErrorBoundary.tsx) to catch runtime errors per module.
6. **Strict Types**: Eliminated implicit `any` in [src/utils/clipboard.ts](file:///d:/antigravity/src/utils/clipboard.ts).
7. **Verification**: 0 lint errors, 19/19 tests passing (905ms), clean 787ms production build.

---

## Architectural Patterns & Key Implementation Details

### 1. Keyboard Listener Isolation Pattern
```typescript
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

useEffect(() => {
  if (!isActive) return;
  const handleKeyDown = (event: KeyboardEvent) => {
    // Reads handlersRef.current inside event handler
    ...
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isActive]);
```

### 2. O(1) Standard Loan Interest Calculation
```typescript
const standardTotalInterest =
  annualRate === 0 || principal === 0
    ? 0
    : Math.max(0, totalMonths * baseMonthlyPI - principal);
```

### 3. DOM Persistence via CSS Visibility
```tsx
<div className={activeTab === 'arithmetic' ? 'block' : 'hidden'}>
  <ErrorBoundary fallbackTitle="Arithmetic Calculator Error">
    <ArithmeticCalculator isActive={activeTab === 'arithmetic'} />
  </ErrorBoundary>
</div>
<div className={activeTab === 'mortgage' ? 'block' : 'hidden'}>
  <ErrorBoundary fallbackTitle="Mortgage Calculator Error">
    <MortgageCalculator />
  </ErrorBoundary>
</div>
<div className={activeTab === 'discount' ? 'block' : 'hidden'}>
  <ErrorBoundary fallbackTitle="Discount Calculator Error">
    <DiscountCalculator />
  </ErrorBoundary>
</div>
```

---

## Final Verification Summary

| Category | Command | Result |
| :--- | :--- | :--- |
| **Linting & Types** | `npm run lint` | Passed (0 errors, 0 warnings) |
| **Test Suite** | `npm test` | Passed (19 tests across Stories S-1 to S-7 in 905ms) |
| **Production Build** | `npm run build` | Passed (Compiled successfully in 787ms) |
| **Dev Server** | `npm run dev` | Active at `http://localhost:3000` (Ready in 749ms) |

---

