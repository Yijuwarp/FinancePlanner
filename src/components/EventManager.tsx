import { useState, useEffect, memo } from 'react';
import type { LifeEvent } from '../utils/eventTemplates';
import { EVENT_TEMPLATES, reCalculateEndDate } from '../utils/eventTemplates';
import CurrencyInput from './CurrencyInput';
import DurationInput from './DurationInput';
import type { DurationUnit } from './DurationInput';

interface EventManagerProps {
  events: LifeEvent[];
  onAddEvent: (event: LifeEvent) => void;
  onUpdateEvent: (event: LifeEvent) => void;
  onRemoveEvent: (id: string) => void;
  highlightedEventId?: string | null;
  onHighlightEvent: (id: string | null) => void;
}

const EventManager = memo(({
  events,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
  highlightedEventId,
  onHighlightEvent,
}: EventManagerProps) => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form state
  const [eventDate, setEventDate] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [monthlyImpact, setMonthlyImpact] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState(24);
  const [durationUnit, setDurationUnit] = useState<'years' | 'months'>('years');
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState<'years' | 'months'>('years');

  // Unified setter to prevent unit switch feedback cycles
  const handleDurationUnitChange = (newUnit: DurationUnit) => {
    setDurationUnit(newUnit);
  };

  // Initialize for new event
  useEffect(() => {
    if (selectedTemplateKey && !editingEventId) {
      const template = EVENT_TEMPLATES[selectedTemplateKey];
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
      setRepeatEnabled(false);
      setRepeatInterval(1);
      setRepeatUnit('years');
    }
  }, [selectedTemplateKey, editingEventId]);

  // Initialize for editing
  useEffect(() => {
    if (editingEventId) {
      const event = events.find(e => e.id === editingEventId);
      if (event) {
        setEventDate(event.date);
        setAmount(event.amount || 0);
        setMonthlyImpact(event.monthlyImpact || 0);
        setDurationMonths(event.durationMonths || 24);
        setRepeatEnabled(event.repeatEnabled || false);
        setRepeatInterval(event.repeatInterval || 1);
        setRepeatUnit(event.repeatUnit || 'years');
        setDurationUnit(event.durationMonths && event.durationMonths % 12 === 0 ? 'years' : 'months');
        
        // Find matching template key for UI
        const templateKey = Object.keys(EVENT_TEMPLATES).find(key => 
          event.label.includes(EVENT_TEMPLATES[key].label)
        );
        setSelectedTemplateKey(templateKey || null);
      }
    }
  }, [editingEventId, events]);

  const handleSave = () => {
    if (editingEventId) {
      const event = events.find(e => e.id === editingEventId);
      if (event) {
        const updatedEvent: LifeEvent = {
          ...event,
          date: eventDate,
          amount,
          monthlyImpact,
          durationMonths: durationMonths > 0 ? durationMonths : undefined,
          endDate: durationMonths > 0 ? reCalculateEndDate(eventDate, durationMonths) : undefined,
          repeatEnabled,
          repeatInterval: repeatEnabled ? repeatInterval : undefined,
          repeatUnit: repeatEnabled ? repeatUnit : undefined,
        };
        onUpdateEvent(updatedEvent);
        setEditingEventId(null);
        setSelectedTemplateKey(null);
      }
    } else if (selectedTemplateKey) {
      const template = EVENT_TEMPLATES[selectedTemplateKey];
      const newEvent: LifeEvent = {
        id: `${selectedTemplateKey}-${Date.now()}`,
        type: template.type,
        label: `${template.emoji} ${template.label}`,
        emoji: template.emoji,
        date: eventDate,
        amount,
        monthlyImpact,
        durationMonths: durationMonths > 0 ? durationMonths : undefined,
        endDate: durationMonths > 0 ? reCalculateEndDate(eventDate, durationMonths) : undefined,
        repeatEnabled,
        repeatInterval: repeatEnabled ? repeatInterval : undefined,
        repeatUnit: repeatEnabled ? repeatUnit : undefined,
      };
      onAddEvent(newEvent);
      setSelectedTemplateKey(null);
    }
  };

  const handleCancel = () => {
    setEditingEventId(null);
    setSelectedTemplateKey(null);
    setAmount(0);
    setMonthlyImpact(0);
    setDurationMonths(24);
    setRepeatEnabled(false);
    setRepeatInterval(1);
    onHighlightEvent(null);
  };

  const activeTemplate = selectedTemplateKey ? EVENT_TEMPLATES[selectedTemplateKey] : null;

  return (
    <div className="event-manager">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-title-icon">🎯</span>
          {editingEventId ? 'Edit Event' : 'Life Events'}
        </h2>
        <p className="panel-subtitle">
          {editingEventId ? 'Modify this event' : 'Add events to see their financial impact'}
        </p>
      </div>

      {!editingEventId && (
        <div className="event-chips">
          {Object.entries(EVENT_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              className={`event-chip ${selectedTemplateKey === key ? 'event-chip-selected' : ''}`}
              onClick={() => setSelectedTemplateKey(selectedTemplateKey === key ? null : key)}
            >
              <span className="chip-emoji">{template.emoji}</span>
              <span className="chip-label">{template.label}</span>
            </button>
          ))}
        </div>
      )}

      {selectedTemplateKey && (
        <div className="event-config">
          <div className="event-config-header">
            <span className="event-config-emoji">{activeTemplate?.emoji}</span>
            <div>
              <h3 className="event-config-title">{activeTemplate?.label}</h3>
              <p className="event-config-desc">{activeTemplate?.description}</p>
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
              
              {(activeTemplate?.type === 'one_time' || activeTemplate?.type === 'duration') && (
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
              {activeTemplate?.type === 'duration' && (
                <CurrencyInput
                  id="event-monthly"
                  label={durationUnit === 'years' ? '📉 Yearly Impact' : '📉 Monthly Impact'}
                  value={durationUnit === 'years' ? monthlyImpact * 12 : monthlyImpact}
                  onChange={(v) => {
                    // Update internal monthlyImpact based on current toggle unit
                    setMonthlyImpact(durationUnit === 'years' ? v / 12 : v);
                  }}
                  className="config-input-shared"
                />
              )}

              {(activeTemplate?.type === 'duration' || activeTemplate?.type === 'job_loss') && (
                <DurationInput
                  id="event-duration"
                  label="⏳ Duration"
                  value={durationMonths}
                  onChange={setDurationMonths}
                  unit={durationUnit}
                  onUnitChange={handleDurationUnitChange}
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
              {editingEventId ? 'Save Changes' : '+ Add Event'}
            </button>
            {editingEventId && (
              <button className="cancel-event-btn" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="event-list">
          <h3 className="event-list-title">Active Events ({events.length})</h3>
          {events.map((event) => (
            <div
              key={event.id}
              className={`event-item ${highlightedEventId === event.id ? 'event-item-highlighted' : ''} ${editingEventId === event.id ? 'event-item-editing' : ''}`}
              onClick={() => {
                setEditingEventId(editingEventId === event.id ? null : event.id);
                onHighlightEvent(highlightedEventId === event.id ? null : event.id);
              }}
            >
              <div className="event-item-info">
                <span className="event-item-label">{event.label}</span>
                <span className="event-item-date">
                  {formatEventDate(event.date)}
                  {event.endDate && ` → ${formatEventDate(event.endDate)}`}
                </span>
              </div>
              <div className="event-item-actions">
                <button
                  className="event-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveEvent(event.id);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default EventManager;

function formatEventDate(dateKey: string): string {
  if (!dateKey) return '';
  const [year, month] = dateKey.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month - 1]} ${year}`;
}
