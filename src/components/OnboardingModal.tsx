import { useEffect, useMemo, useState } from 'react';
import SearchableSelect from './SearchableSelect';
import { EVENT_TEMPLATES, type LifeEvent } from '../utils/eventTemplates';
import {
  INDIAN_CITIES,
  INDIAN_JOBS,
  createSuggestedEvents,
  suggestLifeEventKeys,
  suggestOnboardingDefaults,
} from '../utils/onboardingProfiles';

interface OnboardingModalProps {
  onComplete: (values: {
    age: number;
    salary: number;
    expenses: number;
    years: number;
    retireYears: number;
    events: LifeEvent[];
  }) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [age, setAge] = useState(28);
  const [job, setJob] = useState('Software Engineer');
  const [location, setLocation] = useState('Bengaluru');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    setSelectedKeys(suggestLifeEventKeys(age, job));
  }, [age, job, location]);

  const defaults = useMemo(() => suggestOnboardingDefaults(age, job, location), [age, job, location]);

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <h2 className="panel-title">👋 Welcome to Future Finance Planner 2.0</h2>
        <p className="panel-subtitle">Tell us a little about you to pre-fill realistic defaults.</p>

        <div className="onboarding-grid">
          <div className="input-field-group">
            <label htmlFor="age-input" className="input-label">Age</label>
            <input
              id="age-input"
              type="number"
              min={18}
              max={65}
              value={age}
              className="currency-input"
              onChange={(e) => setAge(Math.max(18, Math.min(65, parseInt(e.target.value) || 18)))}
            />
          </div>

          <SearchableSelect
            id="job-input"
            label="Job"
            options={INDIAN_JOBS}
            value={job}
            onChange={setJob}
          />

          <SearchableSelect
            id="location-input"
            label="Location"
            options={INDIAN_CITIES}
            value={location}
            onChange={setLocation}
          />
        </div>

        <div className="insights-container">
          <div className="insight-card insight-card-info">
            <span className="insight-icon">⚙️</span>
            <p className="insight-message">
              Suggested defaults: Salary ₹{Math.round(defaults.salary / 1000)}K, Expenses ₹{Math.round(defaults.expenses / 1000)}K, Horizon {defaults.years} yrs.
            </p>
          </div>
        </div>

        <div className="onboarding-events">
          <h3 className="event-list-title">Preselected life events (click to remove):</h3>
          <div className="event-chips">
            {selectedKeys.map((key) => (
              <button
                key={key}
                className="event-chip event-chip-selected"
                type="button"
                onClick={() => setSelectedKeys((prev) => prev.filter((v) => v !== key))}
              >
                <span className="chip-emoji">{EVENT_TEMPLATES[key].emoji}</span>
                <span className="chip-label">{EVENT_TEMPLATES[key].label}</span>
              </button>
            ))}
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
                years: defaults.years,
                retireYears: defaults.retireYears,
                events: createSuggestedEvents(selectedKeys),
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
