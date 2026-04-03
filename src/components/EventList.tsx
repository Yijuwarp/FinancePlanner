import { memo } from 'react';
import type { LifeEvent } from '../utils/eventTemplates';
import { formatEventDate } from '../utils/dateUtils';

interface EventListProps {
  events: LifeEvent[];
  editingEventId: string | null;
  highlightedEventId: string | null;
  onEditEvent: (id: string) => void;
  onRemoveEvent: (id: string) => void;
}

/**
 * Component to display the list of active life events.
 * Allows selecting for edit or removal.
 */
const EventList = memo(({
  events,
  editingEventId,
  highlightedEventId,
  onEditEvent,
  onRemoveEvent,
}: EventListProps) => {
  if (events.length === 0) return null;

  return (
    <div className="event-list">
      <h3 className="event-list-title">Active Events ({events.length})</h3>
      {events.map((event) => (
        <div
          key={event.id}
          className={`event-item ${highlightedEventId === event.id ? 'event-item-highlighted' : ''} ${editingEventId === event.id ? 'event-item-editing' : ''}`}
          onClick={() => onEditEvent(event.id)}
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
              title="Remove event"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

export default EventList;
