import { useState, useEffect } from 'react';
import type { LifeEvent } from '../utils/eventTemplates';
import { EVENT_TEMPLATES, createEventFromTemplate, reCalculateEndDate } from '../utils/eventTemplates';

interface EventManagerProps {
  events: LifeEvent[];
  onAddEvent: (event: LifeEvent) => void;
  onUpdateEvent: (event: LifeEvent) => void;
  onRemoveEvent: (id: string) => void;
  highlightedEventId?: string | null;
  onHighlightEvent: (id: string | null) => void;
}

export default function EventManager({
  events,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
  highlightedEventId,
  onHighlightEvent,
}: EventManagerProps) {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Form state
  const [eventDate, setEventDate] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [monthlyImpact, setMonthlyImpact] = useState<number>(0);
  const [durationMonths, setDurationMonths] = useState<number>(0);

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
      setDurationMonths(template.defaultDurationMonths || 0);
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
        setDurationMonths(event.durationMonths || 0);
        
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
      };
      onAddEvent(newEvent);
      setSelectedTemplateKey(null);
    }
  };

  const handleCancel = () => {
    setEditingEventId(null);
    setSelectedTemplateKey(null);
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
                <div className="input-field-group">
                  <label className="input-label" htmlFor="event-amount">💰 One-time Cost</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">₹</span>
                    <input
                      id="event-amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="currency-input"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="config-row">
              {activeTemplate?.type === 'duration' && (
                <div className="input-field-group">
                  <label className="input-label" htmlFor="event-monthly">📉 Monthly Impact</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">₹</span>
                    <input
                      id="event-monthly"
                      type="number"
                      value={monthlyImpact}
                      onChange={(e) => setMonthlyImpact(Number(e.target.value))}
                      className="currency-input"
                    />
                  </div>
                </div>
              )}

              {(activeTemplate?.type === 'duration' || activeTemplate?.type === 'job_loss') && (
                <div className="input-field-group">
                  <label className="input-label" htmlFor="event-duration">⏳ Duration (Months)</label>
                  <input
                    id="event-duration"
                    type="number"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="currency-input border border-slate-700/50 rounded p-2"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="event-config-actions">
            <button className="add-event-btn" onClick={handleSave}>
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
}

function formatEventDate(dateKey: string): string {
  if (!dateKey) return '';
  const [year, month] = dateKey.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month - 1]} ${year}`;
}
