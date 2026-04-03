import { useDeferredValue, lazy, Suspense, memo } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import InputPanel from './components/InputPanel';
import EventManager from './components/EventManager';
import Insights from './components/Insights';
import { useSimulation } from './hooks/useSimulation';

// Lazy-load the chart chunk. Safe now that vite.config.ts forces a single React
// copy via resolve.dedupe — the original root cause of the dispatcher error.
const ChartView = lazy(() => import('./components/ChartView'));

// Simple loading placeholder for the chart (still kept for structure)
const ChartSkeleton = () => (
  <div className="chart-view" style={{ height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-8 w-48 bg-slate-700 rounded" />
      <div className="h-64 w-full bg-slate-800 rounded mx-8" />
    </div>
  </div>
);

/**
 * Main Content Component: Consumes FinanceContext and runs simulation.
 * Decoupled from the FinanceProvider to prevent full app re-renders on context updates.
 */
const AppContent = memo(() => {
  const {
    balance, salary, expenses, years,
    inflation, salaryGrowth, returns,
    retireYears, scaleEventsWithInflation,
    events, highlightedEventId, filterLevel,
    setBalance, setSalary, setExpenses, setYears,
    setInflation, setSalaryGrowth, setReturns,
    setRetireYears, setScaleEventsWithInflation,
    addEvent, updateEvent, removeEvent, highlightEvent,
    setFilterLevel
  } = useFinance();

  // Defer simulation inputs to allow UI to stay responsive during rapid sliding
  const deferredBalance = useDeferredValue(balance);
  const deferredSalary = useDeferredValue(salary);
  const deferredExpenses = useDeferredValue(expenses);
  const deferredYears = useDeferredValue(years);
  const deferredInflation = useDeferredValue(inflation);
  const deferredSalaryGrowth = useDeferredValue(salaryGrowth);
  const deferredReturns = useDeferredValue(returns);
  const deferredEvents = useDeferredValue(events);
  const deferredRetireYears = useDeferredValue(retireYears);
  const deferredScaleEventsWithInflation = useDeferredValue(scaleEventsWithInflation);

  // Run the throttled simulation logic
  const { data, insights } = useSimulation({
    balance: deferredBalance,
    salary: deferredSalary,
    expenses: deferredExpenses,
    years: deferredYears,
    inflation: deferredInflation,
    salaryGrowth: deferredSalaryGrowth,
    returns: deferredReturns,
    events: deferredEvents,
    retireYears: deferredRetireYears,
    scaleEventsWithInflation: deferredScaleEventsWithInflation,
  });

  const isLagging = 
    deferredBalance !== balance ||
    deferredSalary !== salary ||
    deferredExpenses !== expenses ||
    deferredYears !== years ||
    deferredInflation !== inflation ||
    deferredSalaryGrowth !== salaryGrowth ||
    deferredReturns !== returns ||
    deferredEvents !== events ||
    deferredRetireYears !== retireYears;

  return (
    <main className="app-main">
      {/* Chart - Hero section */}
      <section className="chart-section" id="chart-section">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartView
            data={data}
            events={deferredEvents}
            highlightedEventId={highlightedEventId}
            filterLevel={filterLevel}
            isLagging={isLagging}
          />
        </Suspense>

        <div className="chart-filters">
          <div className="filter-group">
            <label htmlFor="impact-filter" className="filter-label">Show markers for:</label>
            <select 
              id="impact-filter" 
              value={filterLevel} 
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="filter-select"
            >
              <option value="high">High Impact only</option>
              <option value="medium">Medium Impact+</option>
              <option value="all">All Events</option>
            </select>
          </div>
          <p className="filter-hint">
            * Red line always shows 100% accurate financial impact.
          </p>
        </div>
      </section>

      {/* Insights */}
      <section className="insights-section" id="insights-section">
        <Insights insights={insights} />
      </section>

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
                <h1 className="app-title">Future Finance Planner</h1>
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
