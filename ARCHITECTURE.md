# 🏗️ Project Architecture

This document describes the technical implementation and design decisions of the Future Finance Planner.

## 🧠 Simulation Engine

The core logic resides in `src/utils/simulation.ts`. The simulation runs on a **monthly granularity** to provide higher accuracy for compounding effects.

### Core Equation
For each month `i`:
1. **Income**: If not retired and no active `job_loss` event: `balance += salary_i`
2. **Expenses**: `balance -= expenses_i`
3. **Life Events**: `balance -= (one_time_impact + recurring_impact)`
4. **Returns**: If `balance > 0`: `balance += balance * monthly_return_rate`

### Financial Assumptions
- **Inflation**: Compounded monthly. Expenses increase every month based on the annual inflation rate.
- **Salary Growth**: Compounded monthly. Stops at the specified retirement age.
- **Returns**: Only applied to positive balances.
- **Life Events**: Can be one-time (e.g., buying a car) or duration-based (e.g., child's college years).

## 🔄 Data Flow & State Management

The application uses a hybrid approach to state to ensure high performance:

### 1. FinanceContext (`src/context/FinanceContext.tsx`)
A standard React Context that holds the "source of truth" for all inputs and life events. It provides simple setters for UI components to trigger changes.

### 2. High-Frequency vs. Low-Frequency Updates
To maintain a 60fps interaction speed on sliders and inputs, we use the `useDeferredValue` hook in `App.tsx`:

- **High-Frequency**: Direct state from `FinanceContext` is passed to the `InputPanel`. This ensures that sliders and text inputs remain perfectly responsive.
- **Low-Frequency**: The entire state object is "deferred". The `runSimulation` function (which can be expensive with many life events) and the `ChartView` only re-render when the deferred value catches up.

## 🧱 Component Breakdown

- **InputPanel**: Handles core scalars (Salary, Balance, Inflation, etc.).
- **EventManager**: Manages the list of life events and handles the logic for adding/editing them via the `EventForm`.
- **ChartView**: A memoized component using Recharts to visualize the `balance` vs `baselineBalance`.
- **OnboardingModal**: A multi-step flow that applies presets from `src/utils/onboardingProfiles.ts`.

## 🎨 Styling Strategy

- **Tailwind CSS 4**: Used for layout and component-level styling.
- **Global CSS**: `src/index.css` contains complex "glassmorphism" effects and ambient background glows that define the app's premium aesthetic.

## 🚀 Performance Optimizations

1. **Event Pre-processing**: Life events are pre-mapped to a monthly lookup table before the main simulation loop starts to avoid O(N*M) lookups inside the loop.
2. **Float64Arrays**: Used for caching inflation and salary multipliers to speed up math operations.
3. **React.memo**: Extensively used on heavy components like `ChartView` and `DeferredResults`.
