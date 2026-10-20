# OmniCalc Suite: Multi-Mode Calculator (Next.js 16+ App Router)

A high-precision, multi-module calculator web application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Lucide React** icons. Styled in a modern dark slate palette (`#020617` background) with typography powered by Google's `Inter` font.

---

## Modules & Features

### 1. Standard Arithmetic Calculator
- **High-Precision Evaluation**: Addition, subtraction, multiplication, and division with floating-point drift mitigation (`Math.round(result * 1e10) / 1e10`).
- **Memory Registers**: Full hardware-style memory controls (`MC`, `MR`, `M+`, `M−`) with active visual badge indicator (`M: value`).
- **Calculation History & Recall**: Prepend chronological log of up to 20 past equations with timestamps; clicking any entry restores its value into the active display.
- **Keyboard Trapping & Listener Isolation**: Global key events intercepted strictly when the Arithmetic tab is active with `event.preventDefault()` on keys like `/`, `Enter`, and `Backspace`. Listeners reference a mutable `handlersRef` so they are never torn down or re-attached on individual keystrokes.

### 2. Mortgage & Loan Estimator
- **Interactive Financing Simulation**: Real-time monthly payment calculation covering Principal & Interest, Property Taxes, Homeowners Insurance, and HOA dues.
- **Dual Down Payment Modes**: Seamlessly toggle between percentage (`%`) and fixed dollar (`$`) inputs with automatic boundary clamping.
- **Early Payoff Acceleration**: Extra monthly payment simulator computing years/months saved and total interest reduction.
- **Annual Amortization Schedule**: Expandable year-by-year schedule detailing `Year`, `Principal Paid`, `Interest Paid`, `Cumulative Interest`, and `Remaining Balance` with deferred on-demand calculation.
- **Dedicated Reset**: Header reset button restoring standard default values ($450k price, 20% down, 6.5% interest, 30 yrs) with confirmation toast.

### 3. Discount & Sales Tax Calculator
- **Discount & Pricing Engine**: Supports percentage (`%`) or fixed dollar (`$`) discounts with quantity scaling and zero-floor protection.
- **Sales Tax Calculation**: Strictly assessed on the discounted subtotal, never on the pre-discount retail price.
- **Itemized Final Price Breakdown**: 5-line receipt card detailing Original Price, Primary Discount, Discounted Subtotal, Sales Tax, and Final Price.
- **One-Click Receipt Export**: Formats an itemized digital breakdown and copies it to clipboard with legacy fallback support.
- **Dedicated Reset**: Header reset button restoring baseline defaults ($120.00 price, 25% discount, 8.25% tax, quantity 1) with confirmation toast.

### 4. Cross-Cutting State Persistence
- All module interfaces remain mounted in the DOM using CSS display toggles (`block` / `hidden`).
- Inputs, slider positions, memory registers, active calculations, and results persist across tab switches without resetting.

---

## Performance & Code-Quality Optimizations

- **Keyboard Event Listener Isolation**: The global `keydown` event listener in `ArithmeticCalculator` attaches once upon tab activation and delegates to a synchronized `handlersRef`, eliminating teardown and re-registration overhead on every keystroke.
- **Render Cascade Prevention**: `ArithmeticCalculator`, `MortgageCalculator`, `DiscountCalculator`, and `Header` are wrapped in `React.memo`, and navigation handlers in `page.tsx` use `useCallback`. Typing or dragging sliders in one tab causes **zero** re-renders or recalculations in the other tabs.
- **$O(1)$ Closed-Form Amortization Calculations**: Standard loan total interest is computed directly via $\max(0, \text{totalMonths} \times \text{monthlyPI} - \text{principal})$ instead of running a 360-iteration monthly loop.
- **Deferred Schedule Allocation**: The 30-year amortization schedule object array is calculated on-demand only when the accordion table is expanded.
- **Shared Pure Helpers**: Centralized pure mathematical utilities in `src/lib/utils.ts` (`clamp`, `roundSafe`, `safeDivide`, `formatCurrency`, `formatCurrencyRounded`, `formatNumber`, `countDigits`).
- **Defensive Error Boundaries**: Individual module containers are wrapped in `ErrorBoundary` components to catch runtime exceptions without crashing the parent application.
- **Dynamic Inline Style Elimination**: Progress bar width calculations use memoized style objects instead of re-instantiating dynamic inline styles during render cycles.
- **Strict TypeScript Types**: Eliminated implicit `any` types with typed error guards (`catch (err: unknown)`).

---

## Acceptance Criteria & Invariants (Stories S-1 to S-7)

| Story | Domain | Edge Case & Invariant Handling |
| :--- | :--- | :--- |
| **S-1** | **Discount & Tax** | Evaluates $120.00 at 25% discount + 8.25% tax $\rightarrow$ Subtotal $90.00, Tax $7.43, Final $97.43, Total Savings $22.57 (25% off). Fixed discount overflow ($150 on $100) floors at $0.00. Negative inputs clamp to 0. |
| **S-2** | **Quantity & Reset** | Multiplies $97.43 unit price at quantity 4 $\rightarrow$ Total $389.72, Savings $90.28. Quantity decrement button locks at 1 (no zero or negative values). Reset button cleanly restores defaults. |
| **S-3** | **Mortgage Estimation** | Computes standard loan ($450k price, 20% down, 30-yr 6.5%, $5.4k tax, $1.4k ins, $150 HOA) $\rightarrow$ P&I $2,275, Tax $450, Ins $117, HOA $150, Total $2,992/mo. 0% interest fallback executes linear principal ($360k/360 = $1,000/mo). Down payment capped at 100%. |
| **S-4** | **Extra Principal & Amortization** | Models extra monthly contribution savings. Amortization toggle renders Year 1–30 breakdown with Principal, Interest, Cumulative Interest, and Remaining Balance. Extreme payments ($10M) terminate safely in month 1. |
| **S-5** | **Arithmetic Execution** | Keyboard entry `12.5 + 7.5 Enter` produces formula `12.5 + 7.5 =` and output `20`. Division by zero (`50 ÷ 0 =`) renders `"Cannot divide by zero"` and locks operations until `AC` or `Escape`. Eliminates `0.1 + 0.2` drift $\rightarrow$ `0.3`. |
| **S-6** | **Memory & History** | Stores memory with `M+` (`M: 250`), recalls with `MR`, clears with `MC`. Prepend history drawer stores 20 records with timestamps; clicking loads result into display and closes drawer. |
| **S-7** | **State Persistence** | Custom parameters in Mortgage, Discount, and Arithmetic modules persist seamlessly across tab switches via CSS display state retention. |

---

## Tech Stack & Architecture

- **Framework**: [Next.js](https://nextjs.org/) 16.4+ (App Router, Turbopack, Client Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 with Slate-950 dark theme (`#020617`), [PostCSS](https://postcss.org/), [Autoprefixer](https://github.com/postcss/autoprefixer)
- **Icons**: [Lucide React](https://lucide.dev/) (Tree-shaken named imports)
- **Typography**: Google Font `Inter` via `next/font/google`
- **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/), `@testing-library/jest-dom`
- **Linting**: [ESLint](https://eslint.org/) 9+ with `eslint-config-next`

### Project Structure
```
antigravity/
├── __tests__/
│   └── calculator.test.tsx      # Comprehensive acceptance test suite (Stories S-1 to S-7)
├── docs/
│   ├── app_roles.md             # Role-based definitions and user personas
│   ├── jobs_to_be_done.md       # Jobs-to-be-done (JTBD) framework & outcomes
│   └── user_stories.md          # User stories (S-1 to S-7) & acceptance criteria
├── lib/
│   └── utils.ts                 # Root re-export for pure helpers
├── src/
│   ├── app/
│   │   ├── globals.css          # Tailwind CSS styles and ambient glow
│   │   ├── layout.tsx           # Root layout with Inter font and metadata
│   │   └── page.tsx             # Single-page application host with ErrorBoundaries
│   ├── components/
│   │   ├── ArithmeticCalculator.tsx # Module 1: Arithmetic engine with Memory & History
│   │   ├── MortgageCalculator.tsx   # Module 2: Mortgage estimator with Amortization schedule
│   │   ├── DiscountCalculator.tsx   # Module 3: Discount & sales tax engine with reset
│   │   ├── ErrorBoundary.tsx        # Defensive error boundary component
│   │   └── Header.tsx               # Sticky header with segmented tab controls
│   ├── lib/
│   │   └── utils.ts                 # Shared pure math & formatting utilities
│   └── utils/
│       └── clipboard.ts             # Robust clipboard copy with document.execCommand fallback
├── test/
│   └── setup.ts                 # Vitest jest-dom setup
├── transcripts/
│   └── session-01.md            # Human-readable conversation & architecture log
├── next.config.js               # Next.js Turbopack configuration
├── package.json                 # Project dependencies and npm scripts
├── postcss.config.js            # PostCSS & Autoprefixer configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vitest.config.mjs            # Vitest testing configuration
└── README.md
```

---

## Prerequisites

- **Node.js**: Tested on **Node 24.22.0** (it is recommended to run on this version; compatible with `>= 18.18.0`).
- **Package Manager**: `npm` (>= 9.0) or `pnpm` (>= 8.0)

---

## Installation & Setup

1. **Clone or Download ZIP and Unzip**:
   - Clone the repository or download the ZIP archive and unzip it into your desired folder.
   - Open your terminal (Git Bash, PowerShell, or Command Prompt) and navigate into the project directory:
     ```bash
     cd antigravity
     ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Starts the local dev server with Turbopack hot reloading |
| `npm run build` | `next build` | Compiles the production build with type checking and static generation |
| `npm run start` | `next start` | Runs the compiled production server |
| `npm run lint` | `eslint` | Runs ESLint across all source files |
| `npm test` | `vitest run` | Executes all 19 automated acceptance tests across Stories S-1 to S-7 |

---

## Session Transcripts

Detailed chronological dialog, architectural decisions, and turn-by-turn logs are preserved in:
- [transcripts/session-01.md](file:///d:/antigravity/transcripts/session-01.md)

---

## License

MIT
