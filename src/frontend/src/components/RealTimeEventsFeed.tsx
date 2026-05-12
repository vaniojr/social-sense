import { useState, useEffect } from 'react';

interface RealTimeEvent {
  id: string;
  eventType: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  data: any;
  createdAt: string;
  isAcknowledged: boolean;
}

interface RealTimeEventsFeedProps {
  entityId: string;
  apiUrl: string;
  autoRefresh?: number;
}

const SEVERITY_COLORS = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  info: 'bg-blue-100 border-blue-300 text-blue-800',
};

const SEVERITY_ICONS = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  info: '🔵',
};

const EVENT_ICONS: Record<string, string> = {
  sentiment_drop: '📉',
  sentiment_spike: '📈',
  volume_anomaly: '⚠️',
  new_trend: '🌟',
  crisis_detected: '🚨',
  coordinated_attack: '⚔️',
  region_alert: '📍',
  keyword_surge: '🔥',
};

export function RealTimeEventsFeed({
  entityId,
  apiUrl,
  autoRefresh = 5000,
}: RealTimeEventsFeedProps) {
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, autoRefresh);
    return () => clearInterval(interval);
  }, [entityId, filter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let url = `${apiUrl}/api/events?entity_id=${entityId}`;
      if (filter) url += `&severity=${filter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('❌ Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (eventId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/events/${eventId}/acknowledge`, {
        method: 'POST',
      });
      if (response.ok) {
        setEvents(events.map(e =>
          e.id === eventId ? { ...e, isAcknowledged: true } : e
        ));
      }
    } catch (err) {
      console.error('❌ Error acknowledging event:', err);
    }
  };

  const filteredEvents = filter
    ? events.filter(e => e.severity === filter)
    : events;

  const unacknowledgedCount = events.filter(e => !e.isAcknowledged).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">📡 Eventos em Tempo Real</h3>
          {unacknowledgedCount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              {unacknowledgedCount} novos
            </span>
          )}
        </div>
        <button
          onClick={loadEvents}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm transition-colors"
        >
          {loading ? '⏳' : '🔄'} Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filter === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({events.length})
        </button>
        {(['critical', 'high', 'medium', 'info'] as const).map(severity => {
          const count = events.filter(e => e.severity === severity).length;
          return (
            <button
              key={severity}
              onClick={() => setFilter(severity)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filter === severity
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {SEVERITY_ICONS[severity]} {severity} ({count})
            </button>
          );
        })}
      </div>

      {/* Events list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum evento
          </div>
        ) : (
          filteredEvents.map(event => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border-2 transition-colors ${
                SEVERITY_COLORS[event.severity]
              } ${event.isAcknowledged ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {EVENT_ICONS[event.eventType] || '📢'}
                    </span>
                    <span className="font-semibold text-sm">{event.title}</span>
                    {event.isAcknowledged && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                        Reconhecido
                      </span>
                    )}
                  </div>
                  <p className="text-xs mb-2">{event.description}</p>
                  <p className="text-xs opacity-70">
                    {new Date(event.createdAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
                {!event.isAcknowledged && (
                  <button
                    onClick={() => handleAcknowledge(event.id)}
                    className="ml-3 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    ✓ OK
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
