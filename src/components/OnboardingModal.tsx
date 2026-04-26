import { useMemo, useState } from 'react';
import SearchableSelect from './SearchableSelect';
import type { LifeEvent } from '../utils/eventTemplates';
import {
  INDIAN_CITIES,
  INDIAN_JOBS,
  createSuggestedEvents,
  type JobOption,
  getTier,
  suggestOnboardingDefaults,
} from '../utils/onboardingProfiles';

interface OnboardingEvent extends LifeEvent {
  enabled: boolean;
}

interface OnboardingModalProps {
  onComplete: (values: {
    age: number;
    job: { role: string; seniority: string };
    location: string;
    tier: number;
    salary: number;
    expenses: number;
    savings: number;
    years: number;
    retireYears: number;
    life_events: Array<{ type: string; age: number; cost: number; enabled: boolean }>;
    events: LifeEvent[];
  }) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [age, setAge] = useState(28);
  const [job, setJob] = useState<JobOption | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<OnboardingEvent[]>([]);
  const [eventsCustomized, setEventsCustomized] = useState(false);

  const defaults = useMemo(
    () => suggestOnboardingDefaults(age, job?.role || 'Other', location || 'Other', job?.seniority || 'Individual Contributor'),
    [age, job?.role, job?.seniority, location],
  );

  const suggestedEvents = useMemo(
    () => createSuggestedEvents(age, defaults).map((event) => ({ ...event, enabled: true })),
    [age, defaults],
  );

  const displayedEvents = eventsCustomized ? selectedEvents : suggestedEvents;
  const activeEvents = useMemo(() => displayedEvents.filter((event) => event.enabled), [displayedEvents]);

  const suggestedSummary = useMemo(() => {
    const activeCount = activeEvents.length;
    return `Suggested defaults: Salary ₹${Math.round(defaults.salary / 1000)}K, Expenses ₹${Math.round(defaults.expenses / 1000)}K, Savings ₹${Math.round(defaults.savings / 1000)}K, Horizon ${defaults.years} yrs` +
      (activeCount ? ` · ${activeCount} event${activeCount > 1 ? 's' : ''}` : '');
  }, [defaults, activeEvents]);

  const canStart = Boolean(job && location);
  const jobOptions = useMemo(
    () =>
      INDIAN_JOBS.map((item) => ({
        value: `${item.role}__${item.seniority}`,
        label: item.label,
        keywords: [item.role, item.seniority, ...item.searchTokens],
      })),
    [],
  );
  const cityOptions = useMemo(() => INDIAN_CITIES.map((city) => ({ value: city, label: city })), []);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <h2 className="panel-title">👋 Welcome to Future Finance Planner 2.0</h2>
        <p className="panel-subtitle">Set up your baseline details to start planning.</p>

        <div className="onboarding-grid onboarding-grid-single">
          <div className="input-field-group">
            <label htmlFor="age-input" className="input-label">Age</label>
            <input
              id="age-input"
              type="number"
              min={18}
              max={60}
              value={age}
              className="currency-input onboarding-inline-input"
              onChange={(e) => {
                const parsed = Number(e.target.value);
                const nextAge = Number.isNaN(parsed) ? 18 : parsed;
                setAge(Math.max(18, Math.min(60, nextAge)));
              }}
            />
            <input
              type="range"
              min={18}
              max={60}
              value={age}
              className="slider-input"
              onChange={(e) => setAge(Math.max(18, Math.min(60, Number(e.target.value))))}
            />
          </div>

          <SearchableSelect
            id="job-input"
            label="Job"
            options={jobOptions}
            selectedValue={job ? `${job.role}__${job.seniority}` : null}
            placeholder="Search your job (e.g. Sales Manager, Software Engineer)"
            onSelect={(value) => {
              if (!value) {
                setJob(null);
                return;
              }

              const [role, seniority] = value.split('__');
              const selected = INDIAN_JOBS.find((item) => item.role === role && item.seniority === seniority) || null;
              setJob(selected);
            }}
          />

          <SearchableSelect
            id="location-input"
            label="Location"
            options={cityOptions}
            selectedValue={location}
            placeholder="Search your city"
            onSelect={setLocation}
          />

          <div className="onboarding-events">
            <h3 className="event-list-title">Life Events</h3>
            <div className="event-chips event-chips-horizontal" role="list">
              {displayedEvents.map((event) => (
                <div key={event.id} className="event-chip event-chip-selected" role="listitem">
                  <span className="chip-emoji">{event.emoji}</span>
                  <span className="chip-label">{event.label.replace(/^[^\s]+\s/, '')}</span>
                  <button
                    type="button"
                    className="event-chip-remove"
                    onClick={() => {
                      setEventsCustomized(true);
                      setSelectedEvents((prev) => {
                        const source = prev.length > 0 ? prev : suggestedEvents;
                        return source.filter((item) => item.id !== event.id);
                      });
                    }}
                    aria-label={`Remove ${event.label}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="onboarding-footer-sticky">
          <div className="insight-card insight-card-info">
            <span className="insight-icon">⚙️</span>
            <p className="insight-message">{suggestedSummary}</p>
          </div>

          <div className="event-config-actions">
            <button
              className="add-event-btn"
              disabled={!canStart}
              onClick={() => {
                if (!job || !location) {
                  return;
                }

                onComplete({
                  age,
                  job: { role: job.role, seniority: job.seniority },
                  location,
                  tier: getTier(location),
                  salary: defaults.salary,
                  expenses: defaults.expenses,
                  savings: defaults.savings,
                  years: defaults.years,
                  retireYears: defaults.retireYears,
                  life_events: activeEvents.map((event) => ({
                    type: event.label,
                    age,
                    cost: event.amount ?? 0,
                    enabled: event.enabled,
                  })),
                  events: activeEvents,
                });
              }}
            >
              Start Planning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
