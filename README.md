# Future Finance Planner v2.0

A React + TypeScript simulator to model long-term personal finance in India with salary growth, inflation, returns, retirement assumptions, and life-event shocks.

## What's new in v2.0

- Onboarding flow (age, job, location) with tuned defaults.
- Searchable select inputs for common middle-class jobs and Indian cities.
- Auto-preselected life events during onboarding with one-click removal.
- Pin chart mode to keep projection visible while editing controls.
- New insights:
  - FIRE runway month (returns >= expenses + event costs)
  - Lowest + highest balance in one summary
  - Total life-event cost + costliest event
- Visual update for chart lines:
  - "With Events" is now purple
  - Both series turn red when balance drops below zero

## Quick start

```bash
npm install
npm run dev
```

App runs on Vite default local URL.

## Build & quality checks

```bash
npm run lint
npm run build
```

## Core assumptions

- Salary stops after retirement year.
- Expenses inflate monthly based on annual inflation.
- Returns compound monthly only when balance is positive.
- Life events can be one-time, duration-based, job-loss, and repeatable.

## Version

Current UI version: **v2.0**.
