# 🤝 Contributing to Future Finance Planner

We welcome contributions! Whether it's adding a new financial event template or improving the UI, here is how you can help.

## 🛠️ Local Development Setup

1. **Fork and Clone**: `git clone https://github.com/YOUR_USERNAME/FinancePlanner.git`
2. **Install Deps**: `npm install`
3. **Run Dev**: `npm run dev`
4. **Lint**: `npm run lint` (Please ensure all lint errors are fixed before submitting a PR)

## 📁 Directory Structure

- `src/components`: UI components.
- `src/context`: Global state management.
- `src/hooks`: Custom hooks (like `useSimulation`).
- `src/utils`: The heavy lifters.
  - `simulation.ts`: The math engine.
  - `onboardingProfiles.ts`: Data for the onboarding flow.
  - `eventTemplates.ts`: Preset templates for life events.

## 📈 Extending the App

### Adding a New City or Job Profile
Open `src/utils/onboardingProfiles.ts`.
- **Cities**: Add to the `INDIAN_CITIES` array. Include name and cost-of-living tier (1, 2, or 3).
- **Jobs**: Add to the `JOB_ROLES` object. Each role should have salary ranges for 'Junior', 'Mid', and 'Senior' levels.

### Adding a New Life Event Template
Open `src/utils/eventTemplates.ts`.
Add a new object to the `EVENT_TEMPLATES` array.
- `label`: Display name.
- `type`: `one_time`, `duration`, or `job_loss`.
- `amount`: Initial cost.
- `monthlyImpact`: Recurring cost (for duration events).
- `scaleWithInflation`: Should this event cost more as time goes on?

## 📝 Coding Standards

- **TypeScript**: Use strict typing. Avoid `any`.
- **Components**: Prefer Functional Components with Hooks.
- **Styling**: Use Tailwind CSS for almost everything. Use CSS variables for theme colors.
- **Performance**: Use `useMemo` and `useCallback` for expensive calculations or props passed to memoized components.

## ✅ Pull Request Process

1. Create a feature branch.
2. Ensure `npm run lint` and `npm run build` pass.
3. Submit the PR with a clear description of the changes.
4. If you've updated the simulation logic, please provide a summary of how the math has changed.
