import { useState, useCallback, useDeferredValue, lazy, Suspense } from 'react';
import InputPanel from './components/InputPanel';
import EventManager from './components/EventManager';
import Insights from './components/Insights';
import { useSimulation } from './hooks/useSimulation';
import type { LifeEvent } from './utils/eventTemplates';

// Lazy load chart as it's the largest part of the bundle
const ChartView = lazy(() => import('./components/ChartView'));

// Simple loading placeholder
const ChartSkeleton = () => (
  <div className="chart-view" style={{ height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="h-8 w-48 bg-slate-700 rounded" />
      <div className="h-64 w-full bg-slate-800 rounded mx-8" />
    </div>
  </div>
);

function App() {
  // Core financial inputs
  const [balance, setBalance] = useState(300000); // ₹3L
  const [salary, setSalary] = useState(80000); // ₹80K
  const [expenses, setExpenses] = useState(40000); // ₹40K
  const [years, setYears] = useState(10);

  // Advanced settings
  const [inflation, setInflation] = useState(6);
  const [salaryGrowth, setSalaryGrowth] = useState(10);
  const [returns, setReturns] = useState(8);
  const [retireYears, setRetireYears] = useState(25);
  const [scaleEventsWithInflation, setScaleEventsWithInflation] = useState(false);

  // Events
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  // Defer simulation inputs to prevent jank during rapid slider/keyboard input
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

  const [filterLevel, setFilterLevel] = useState<'all' | 'medium' | 'high'>('high');

  // Simulation runs with deferred values
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

  const handleAddEvent = useCallback((event: LifeEvent) => {
    setEvents(prev => [...prev, event]);
  }, []);

  const handleUpdateEvent = useCallback((updatedEvent: LifeEvent) => {
    setEvents(prev => prev.map(e => (e.id === updatedEvent.id ? updatedEvent : e)));
  }, []);

  const handleRemoveEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (highlightedEventId === id) {
      setHighlightedEventId(null);
    }
  }, [highlightedEventId]);

  const handleHighlightEvent = useCallback((id: string | null) => {
    setHighlightedEventId(id);
  }, []);

  return (
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

      {/* Main content */}
      <main className="app-main">
        {/* Chart - Hero section */}
        <section className="chart-section" id="chart-section">
          <Suspense fallback={<ChartSkeleton />}>
            <ChartView
              data={data}
              events={events}
              highlightedEventId={highlightedEventId}
              filterLevel={filterLevel}
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
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onRemoveEvent={handleRemoveEvent}
              highlightedEventId={highlightedEventId}
              onHighlightEvent={handleHighlightEvent}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Future Finance Planner — Simulation only. Not financial advice.</p>
      </footer>
    </div>
  );
}

export default App;

