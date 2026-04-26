import { useMemo, useState } from 'react';
import SearchableSelect from './SearchableSelect';
import { EVENT_TEMPLATES, type LifeEvent } from '../utils/eventTemplates';
import {
  INDIAN_CITIES,
  INDIAN_JOBS,
  createSuggestedEvents,
  suggestOnboardingDefaults,
} from '../utils/onboardingProfiles';

interface OnboardingModalProps {
  onComplete: (values: {
    age: number;
    salary: number;
    expenses: number;
    savings: number;
    years: number;
    retireYears: number;
    events: LifeEvent[];
  }) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [age, setAge] = useState(28);
  const [job, setJob] = useState('Private Company Employee');
  const [location, setLocation] = useState('Bangalore');

  const defaults = useMemo(() => suggestOnboardingDefaults(age, job, location), [age, job, location]);
  const selectedEvents = useMemo(() => createSuggestedEvents(age, defaults), [age, defaults]);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <h2 className="panel-title">👋 Welcome to Future Finance Planner 2.0</h2>
        <p className="panel-subtitle">Tell us a little about you to pre-fill realistic defaults.</p>

        <div className="onboarding-grid">
          <div className="input-field-group">
            <label htmlFor="age-input" className="input-label">Age</label>
            <p className="input-help">Your age (used to plan long-term finances)</p>
            <input
              id="age-input"
              type="number"
              min={18}
              max={60}
              value={age}
              className="currency-input"
              onChange={(e) => setAge(Math.max(18, Math.min(60, parseInt(e.target.value) || 18)))}
            />
            <input
              type="range"
              min={18}
              max={60}
              value={age}
              className="slider-input"
              onChange={(e) => setAge(Number(e.target.value))}
            />
          </div>

          <div>
            <SearchableSelect
              id="job-input"
              label="Job"
              options={Array.from(INDIAN_JOBS)}
              value={job}
              onChange={setJob}
            />
            <p className="input-help">What best describes your work?</p>
          </div>

          <div>
            <SearchableSelect
              id="location-input"
              label="Location"
              options={INDIAN_CITIES}
              value={location}
              onChange={setLocation}
            />
            <p className="input-help">Where do you live? (affects cost of living)</p>
          </div>
        </div>

        <div className="insights-container">
          <div className="insight-card insight-card-info">
            <span className="insight-icon">⚙️</span>
            <p className="insight-message">
              Suggested defaults: Salary ₹{Math.round(defaults.salary / 1000)}K, Expenses ₹{Math.round(defaults.expenses / 1000)}K, Savings ₹{Math.round(defaults.savings / 1000)}K, Horizon {defaults.years} yrs.
            </p>
          </div>
        </div>

        <div className="onboarding-events">
          <h3 className="event-list-title">Life Events</h3>
          <p className="panel-subtitle">We’ve added common milestones — you can edit or remove them.</p>
          <div className="event-chips">
            {selectedEvents.map((event) => {
              const label = event.label.replace(/^\S+\s/, '');
              const key = Object.keys(EVENT_TEMPLATES).find((candidate) => EVENT_TEMPLATES[candidate].emoji === event.emoji && EVENT_TEMPLATES[candidate].label === label) || event.id;
              return (
                <div key={event.id} className="event-chip event-chip-selected" title={key}>
                  <span className="chip-emoji">{event.emoji}</span>
                  <span className="chip-label">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="event-config-actions">
          <button
            className="add-event-btn"
            onClick={() => {
              onComplete({
                age,
                salary: defaults.salary,
                expenses: defaults.expenses,
                savings: defaults.savings,
                years: defaults.years,
                retireYears: defaults.retireYears,
                events: selectedEvents,
              });
            }}
          >
            Start Planning
          </button>
        </div>
      </div>
    </div>
  );
}
