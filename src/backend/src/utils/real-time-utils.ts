// Real-time Updates Utilities (Bloco I)

export interface RealTimeEvent {
  id: string;
  entityId: string;
  eventType: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  data: any;
  createdAt: string;
  isAcknowledged: boolean;
}

export interface WebSocketMessage {
  type: 'event' | 'metric' | 'recommendation' | 'acknowledgement';
  payload: any;
  timestamp: string;
}

// Event severity levels
export const SEVERITY_LEVELS = {
  critical: 4,
  high: 3,
  medium: 2,
  info: 1,
};

// Event types
export const EVENT_TYPES = {
  SENTIMENT_DROP: 'sentiment_drop',
  SENTIMENT_SPIKE: 'sentiment_spike',
  VOLUME_ANOMALY: 'volume_anomaly',
  NEW_TREND: 'new_trend',
  CRISIS_DETECTED: 'crisis_detected',
  COORDINATED_ATTACK: 'coordinated_attack',
  REGION_ALERT: 'region_alert',
  KEYWORD_SURGE: 'keyword_surge',
};

// Create real-time event
export function createEvent(
  entityId: string,
  eventType: string,
  severity: 'critical' | 'high' | 'medium' | 'info',
  title: string,
  description: string,
  data?: any
): Omit<RealTimeEvent, 'id' | 'createdAt' | 'isAcknowledged'> {
  return {
    entityId,
    eventType,
    severity,
    title,
    description,
    data: data || {},
  };
}

// Format event for WebSocket broadcast
export function formatEventForBroadcast(event: RealTimeEvent): WebSocketMessage {
  return {
    type: 'event',
    payload: {
      id: event.id,
      entityId: event.entityId,
      eventType: event.eventType,
      severity: event.severity,
      title: event.title,
      description: event.description,
      data: event.data,
      createdAt: event.createdAt,
      isAcknowledged: event.isAcknowledged,
    },
    timestamp: new Date().toISOString(),
  };
}

// Check if event should trigger alert
export function shouldTriggerAlert(event: RealTimeEvent): boolean {
  const criticalTypes = [
    EVENT_TYPES.CRISIS_DETECTED,
    EVENT_TYPES.COORDINATED_ATTACK,
    EVENT_TYPES.SENTIMENT_DROP,
  ];

  return (
    event.severity === 'critical' ||
    (event.severity === 'high' && criticalTypes.includes(event.eventType))
  );
}

// Get event icon
export function getEventIcon(eventType: string): string {
  const icons: Record<string, string> = {
    [EVENT_TYPES.SENTIMENT_DROP]: '📉',
    [EVENT_TYPES.SENTIMENT_SPIKE]: '📈',
    [EVENT_TYPES.VOLUME_ANOMALY]: '⚠️',
    [EVENT_TYPES.NEW_TREND]: '🌟',
    [EVENT_TYPES.CRISIS_DETECTED]: '🚨',
    [EVENT_TYPES.COORDINATED_ATTACK]: '⚔️',
    [EVENT_TYPES.REGION_ALERT]: '📍',
    [EVENT_TYPES.KEYWORD_SURGE]: '🔥',
  };

  return icons[eventType] || '📢';
}

// Get severity color
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#eab308',
    info: '#3b82f6',
  };

  return colors[severity] || '#6b7280';
}

// Get severity badge
export function getSeverityBadge(severity: string): string {
  const badges: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    info: '🔵',
  };

  return badges[severity] || '⚪';
}
