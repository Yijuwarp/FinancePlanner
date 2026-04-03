import { useState, useEffect, memo } from 'react';
import type { LifeEvent, EventTemplate } from '../utils/eventTemplates';
import { reCalculateEndDate } from '../utils/eventTemplates';
import CurrencyInput from './CurrencyInput';
import DurationInput from './DurationInput';
import type { DurationUnit } from './DurationInput';

interface EventFormProps {
  template: EventTemplate | null;
  editingEvent: LifeEvent | null;
  onSave: (event: Partial<LifeEvent>) => void;
  onCancel: () => void;
}

/**
 * Form component to configure a new or existing life event.
 * Handles inputs for date, amount, duration, and recurrence.
 */
const EventForm = memo(({
  template,
  editingEvent,
  onSave,
  onCancel,
}: EventFormProps) => {
  // Form state
  const [eventDate, setEventDate] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [monthlyImpact, setMonthlyImpact] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState(24);
  const [durationUnit, setDurationUnit] = useState<'years' | 'months'>('years');
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState<'years' | 'months'>('years');

  // Initialize for new event from template
  useEffect(() => {
    if (template && !editingEvent) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 2; 
      const y = year + Math.floor((month - 1) / 12);
      const m = ((month - 1) % 12) + 1;
      
      setEventDate(`${y}-${String(m).padStart(2, '0')}`);
      setAmount(template.defaultAmount || 0);
      setMonthlyImpact(template.defaultMonthlyImpact || 0);
      setDurationMonths(template.defaultDurationMonths || 24);
      setDurationUnit(template.defaultDurationMonths && template.defaultDurationMonths >= 12 && template.defaultDurationMonths % 12 === 0 ? 'years' : 'months');
      setRepeatEnabled(template.defaultRepeatEnabled || false);
      setRepeatInterval(template.defaultRepeatInterval || 1);
      setRepeatUnit(template.defaultRepeatUnit || 'years');
    }
  }, [template, editingEvent]);

  // Initialize for editing
  useEffect(() => {
    if (editingEvent) {
      setEventDate(editingEvent.date);
      setAmount(editingEvent.amount || 0);
      setMonthlyImpact(editingEvent.monthlyImpact || 0);
      setDurationMonths(editingEvent.durationMonths || 24);
      setRepeatEnabled(editingEvent.repeatEnabled || false);
      setRepeatInterval(editingEvent.repeatInterval || 1);
      setRepeatUnit(editingEvent.repeatUnit || 'years');
      setDurationUnit(editingEvent.durationMonths && editingEvent.durationMonths % 12 === 0 ? 'years' : 'months');
    }
  }, [editingEvent]);

  const handleSave = () => {
    onSave({
      date: eventDate,
      amount,
      monthlyImpact,
      durationMonths: durationMonths > 0 ? durationMonths : undefined,
      endDate: durationMonths > 0 ? reCalculateEndDate(eventDate, durationMonths) : undefined,
      repeatEnabled,
      repeatInterval: repeatEnabled ? repeatInterval : undefined,
      repeatUnit: repeatEnabled ? repeatUnit : undefined,
    });
  };

  const activeTemplate = template;

  if (!activeTemplate) return null;

  return (
    <div className="event-config">
      <div className="event-config-header">
        <span className="event-config-emoji">{activeTemplate.emoji}</span>
        <div>
          <h3 className="event-config-title">{activeTemplate.label}</h3>
          <p className="event-config-desc">{activeTemplate.description}</p>
        </div>
      </div>

      <div className="event-config-fields">
        <div className="config-row">
          <div className="input-field-group">
            <label className="input-label" htmlFor="event-date">📅 Date</label>
            <input
              id="event-date"
              type="month"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="date-input"
            />
          </div>
          
          {(activeTemplate.type === 'one_time' || activeTemplate.type === 'duration') && (
            <CurrencyInput
              id="event-amount"
              label="💰 One-time Cost"
              value={amount}
              onChange={setAmount}
              className="config-input-shared"
            />
          )}
        </div>

        <div className="config-row">
          {activeTemplate.type === 'duration' && (
            <CurrencyInput
              id="event-monthly"
              label={durationUnit === 'years' ? '📉 Yearly Impact' : '📉 Monthly Impact'}
              value={durationUnit === 'years' ? monthlyImpact * 12 : monthlyImpact}
              onChange={(v) => {
                setMonthlyImpact(durationUnit === 'years' ? v / 12 : v);
              }}
              className="config-input-shared"
            />
          )}

          {(activeTemplate.type === 'duration' || activeTemplate.type === 'job_loss') && (
            <DurationInput
              id="event-duration"
              label="⏳ Duration"
              value={durationMonths}
              onChange={setDurationMonths}
              unit={durationUnit}
              onUnitChange={(u) => setDurationUnit(u as DurationUnit)}
              className="config-input-shared"
            />
          )}
        </div>

        <div className="config-row repeat-config">
          <div className="setting-toggle-row">
            <label className="toggle-label" htmlFor="repeat-toggle">
              🔄 Repeat Every
            </label>
            <button
              id="repeat-toggle"
              className={`toggle-switch ${repeatEnabled ? 'active' : ''}`}
              onClick={() => setRepeatEnabled(!repeatEnabled)}
            >
              <div className="toggle-knob" />
            </button>
          </div>

          {repeatEnabled && (
            <div className="repeat-inputs fade-slide-down">
              <div className="repeat-interval-input">
                <input
                  type="number"
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                  className="currency-input no-spin"
                />
              </div>
              <div className="repeat-unit-toggle">
                <button
                  className={`unit-btn ${repeatUnit === 'years' ? 'active' : ''}`}
                  onClick={() => setRepeatUnit('years')}
                >
                  Years
                </button>
                <button
                  className={`unit-btn ${repeatUnit === 'months' ? 'active' : ''}`}
                  onClick={() => setRepeatUnit('months')}
                >
                  Months
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="event-config-actions">
        <button 
          className="add-event-btn" 
          onClick={handleSave}
          disabled={!eventDate}
          title={!eventDate ? 'Please select a date' : ''}
        >
          {editingEvent ? 'Save Changes' : '+ Add Event'}
        </button>
        <button className="cancel-event-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
});

export default EventForm;
