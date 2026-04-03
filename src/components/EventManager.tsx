import { useState, memo, useCallback } from 'react';
import type { LifeEvent } from '../utils/eventTemplates';
import { EVENT_TEMPLATES } from '../utils/eventTemplates';
import EventForm from './EventForm';
import EventList from './EventList';

interface EventManagerProps {
  events: LifeEvent[];
  onAddEvent: (event: LifeEvent) => void;
  onUpdateEvent: (event: LifeEvent) => void;
  onRemoveEvent: (id: string) => void;
  highlightedEventId?: string | null;
  onHighlightEvent: (id: string | null) => void;
}

/**
 * Orchestrator component for managed financial life events.
 * Handles template selection and coordinates between the form and the list.
 */
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

  const editingEvent = editingEventId ? events.find(e => e.id === editingEventId) || null : null;
  
  // Calculate template for form even if editing (so we know the type/description)
  const activeTemplate = selectedTemplateKey ? EVENT_TEMPLATES[selectedTemplateKey] : 
    (editingEvent ? Object.values(EVENT_TEMPLATES).find(t => editingEvent.label.includes(t.label)) || null : null);

  const handleTemplateClick = useCallback((key: string) => {
    setSelectedTemplateKey(prev => prev === key ? null : key);
    setEditingEventId(null);
    onHighlightEvent(null);
  }, [onHighlightEvent]);

  const handleEditClick = useCallback((id: string) => {
    if (editingEventId === id) {
      setEditingEventId(null);
      onHighlightEvent(null);
    } else {
      setEditingEventId(id);
      setSelectedTemplateKey(null);
      onHighlightEvent(id);
    }
  }, [editingEventId, onHighlightEvent]);

  const handleSave = useCallback((formData: Partial<LifeEvent>) => {
    if (editingEventId && editingEvent) {
      onUpdateEvent({ ...editingEvent, ...formData } as LifeEvent);
    } else if (selectedTemplateKey && activeTemplate) {
      const newEvent: LifeEvent = {
        id: `${selectedTemplateKey}-${Date.now()}`,
        type: activeTemplate.type,
        label: `${activeTemplate.emoji} ${activeTemplate.label}`,
        emoji: activeTemplate.emoji,
        ...formData,
      } as LifeEvent;
      onAddEvent(newEvent);
    }
    setEditingEventId(null);
    setSelectedTemplateKey(null);
    onHighlightEvent(null);
  }, [editingEventId, editingEvent, selectedTemplateKey, activeTemplate, onUpdateEvent, onAddEvent, onHighlightEvent]);

  const handleCancel = useCallback(() => {
    setEditingEventId(null);
    setSelectedTemplateKey(null);
    onHighlightEvent(null);
  }, [onHighlightEvent]);

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
              onClick={() => handleTemplateClick(key)}
            >
              <span className="chip-emoji">{template.emoji}</span>
              <span className="chip-label">{template.label}</span>
            </button>
          ))}
        </div>
      )}

      {(selectedTemplateKey || editingEventId) && (
        <EventForm
          template={activeTemplate}
          editingEvent={editingEvent}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <EventList
        events={events}
        editingEventId={editingEventId}
        highlightedEventId={highlightedEventId ?? null}
        onEditEvent={handleEditClick}
        onRemoveEvent={onRemoveEvent}
      />
    </div>
  );
});

export default EventManager;
