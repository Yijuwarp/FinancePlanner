import { useState, useCallback } from 'react';
import InputPanel from './components/InputPanel';
import EventManager from './components/EventManager';
import ChartView from './components/ChartView';
import Insights from './components/Insights';
import { useSimulation } from './hooks/useSimulation';
import type { LifeEvent } from './utils/eventTemplates';

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

  // Events
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  // Simulation
  const { data, insights } = useSimulation({
    balance,
    salary,
    expenses,
    years,
    inflation,
    salaryGrowth,
    returns,
    events,
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
          <ChartView
            data={data}
            events={events}
            highlightedEventId={highlightedEventId}
          />
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
