import { useDeferredValue, lazy, Suspense, memo, useMemo, useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import InputPanel from './components/InputPanel';
import EventManager from './components/EventManager';
import Insights from './components/Insights';
import OnboardingModal from './components/OnboardingModal';
import { useSimulation } from './hooks/useSimulation';

const APP_VERSION = 'v2.0';

// Lazy-load the chart chunk. Safe now that vite.config.ts forces a single React
// copy via resolve.dedupe — the original root cause of the dispatcher error.
const ChartView = lazy(() => import('./components/ChartView'));

// Simple loading placeholder for the chart
const ChartSkeleton = () => (
  <div className="chart-view" style={{ height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-8 w-48 bg-slate-700 rounded" />
      <div className="h-64 w-full bg-slate-800 rounded mx-8" />
    </div>
  </div>
);

/**
 * Heavy results container. ONLY re-renders when deferred values change.
 * This is the core of the 60fps interaction strategy.
 */
const DeferredResults = memo(({ 
  state, 
  isLagging,
  setFilterLevel,
  pinChart,
  setPinChart
}: any) => {
  const { data, insights } = useSimulation(state);

  return (
    <>
      {/* Chart - Hero section */}
      <section className={`chart-section ${pinChart ? 'chart-section-pinned' : ''}`} id="chart-section">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartView
            data={data}
            events={state.events}
            highlightedEventId={state.highlightedEventId}
            filterLevel={state.filterLevel}
            isLagging={isLagging}
          />
        </Suspense>

        <div className="chart-filters">
          <div className="filter-group">
            <label htmlFor="impact-filter" className="filter-label">Show markers for:</label>
            <select 
              id="impact-filter" 
              value={state.filterLevel} 
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="filter-select"
            >
              <option value="high">High Impact only</option>
              <option value="medium">Medium Impact+</option>
              <option value="all">All Events</option>
            </select>
          </div>
          <button
            type="button"
            className={`pin-chart-btn ${pinChart ? 'pin-chart-btn-active' : ''}`}
            onClick={() => setPinChart(!pinChart)}
          >
            {pinChart ? '📌 Chart pinned' : '📍 Pin chart'}
          </button>
          <p className="filter-hint">
            * Red line always shows 100% accurate financial impact.
          </p>
        </div>
      </section>

      {/* Insights */}
      <section className="insights-section" id="insights-section">
        <Insights insights={insights} />
      </section>
    </>
  );
});

/**
 * Main Content Component: Splits state into high-frequency and deferred streams.
 */
const AppContent = memo(() => {
  const finance = useFinance();
  const [pinChart, setPinChart] = useState(false);

  // HIGH FREQUENCY: These are passed directly to inputs for 60fps local feedback
  const {
    balance, salary, expenses, years,
    inflation, salaryGrowth, returns,
    retireYears, scaleEventsWithInflation,
    events, highlightedEventId, filterLevel,
    setBalance, setSalary, setExpenses, setYears,
    setInflation, setSalaryGrowth, setReturns,
    setRetireYears, setScaleEventsWithInflation,
    addEvent, updateEvent, removeEvent, highlightEvent,
    setFilterLevel, applyOnboardingDefaults, onboardingComplete
  } = finance;

  // LOW FREQUENCY: Defer the entire state object for heavy calculations
  // We use useMemo to create a stable object that only changes when the values change
  const currentState = useMemo(() => ({
    balance, salary, expenses, years, inflation,
    salaryGrowth, returns, events, retireYears,
    scaleEventsWithInflation, highlightedEventId, filterLevel
  }), [
    balance, salary, expenses, years, inflation,
    salaryGrowth, returns, events, retireYears,
    scaleEventsWithInflation, highlightedEventId, filterLevel
  ]);

  const deferredState = useDeferredValue(currentState);
  const isLagging = currentState !== deferredState;

  return (
    <main className="app-main">
      {!onboardingComplete && <OnboardingModal onComplete={applyOnboardingDefaults} />}
      <DeferredResults 
        state={deferredState} 
        isLagging={isLagging}
        setFilterLevel={setFilterLevel}
        pinChart={pinChart}
        setPinChart={setPinChart}
      />

      {/* Controls */}
      <section className="controls-section" id="controls-section">
        <div className="controls-grid">
          <InputPanel
            balance={balance}
            salary={salary}
            expenses={expenses}
            years={years}
            inflation={inflation}
            salaryGrowth={salaryGrowth}
            returns={returns}
            onBalanceChange={setBalance}
            onSalaryChange={setSalary}
            onExpensesChange={setExpenses}
            onYearsChange={setYears}
            onInflationChange={setInflation}
            onSalaryGrowthChange={setSalaryGrowth}
            onReturnsChange={setReturns}
            retireYears={retireYears}
            onRetireYearsChange={setRetireYears}
            scaleEventsWithInflation={scaleEventsWithInflation}
            onScaleEventsWithInflationChange={setScaleEventsWithInflation}
          />
          <EventManager
            events={events}
            onAddEvent={addEvent}
            onUpdateEvent={updateEvent}
            onRemoveEvent={removeEvent}
            highlightedEventId={highlightedEventId}
            onHighlightEvent={highlightEvent}
          />
        </div>
      </section>
    </main>
  );
});

function App() {
  return (
    <FinanceProvider>
      <div className="app">
        {/* Ambient background effects */}
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
        <div className="bg-glow bg-glow-3" />

        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <div className="logo-group">
              <span className="logo-icon">💰</span>
              <div>
                <h1 className="app-title">Future Finance Planner {APP_VERSION}</h1>
                <p className="app-tagline">Plan your financial future in India</p>
              </div>
            </div>
          </div>
        </header>

        <AppContent />

        {/* Footer */}
        <footer className="app-footer">
          <p>Future Finance Planner — Simulation only. Not financial advice.</p>
        </footer>
      </div>
    </FinanceProvider>
  );
}

export default App;
