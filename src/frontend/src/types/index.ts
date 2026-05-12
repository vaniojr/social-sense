/**
 * Centralized TypeScript Types for Social Sense
 * Import from this file instead of defining types locally
 */

// ============================================================================
// ENTITY TYPES
// ============================================================================

export type EntityType = 'politician' | 'influencer' | 'brand';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description?: string;
  url?: string;
  created_at: string;
  updated_at?: string;
}

export interface EntityFormData {
  name: string;
  type: EntityType;
  description: string;
  url: string;
}

// ============================================================================
// SENTIMENT & ANALYSIS TYPES
// ============================================================================

export interface SentimentScore {
  score: number | string;
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  confidence: number;
}

export interface RegionalSentiment {
  state_code: string;
  state_name: string;
  region: string;
  avg_sentiment: string | number;
  mention_volume: number;
  top_themes: string[];
  last_updated: string;
}

export interface RegionalSentimentResponse {
  states: RegionalSentiment[];
  total_states: number;
  statistics: {
    best_state: RegionalSentiment | null;
    worst_state: RegionalSentiment | null;
    average_sentiment: number | null;
  };
  timestamp: string;
}

// ============================================================================
// ALERT TYPES
// ============================================================================

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  alert_type: string;
  triggered_at: string;
  is_active: boolean;
}

// ============================================================================
// CHAT & CONVERSATION TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// NEWS TYPES
// ============================================================================

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  source: string;
  url: string;
  published_at: string;
  entity_id: string;
  sentiment_score?: number;
  themes?: string[];
  region?: string;
}

export interface NewsFilter {
  entityId?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'all';
  days?: number;
  region?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// COMPETITOR TYPES
// ============================================================================

export interface CompetitorGroup {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  members?: Entity[];
}

export interface CompetitorComparison {
  entities: Entity[];
  metrics: {
    sentiment_trend: Record<string, number[]>;
    mention_volume: Record<string, number[]>;
    top_themes: string[];
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, string>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface EntityContextType {
  entities: Entity[];
  selectedId: string;
  selected: Entity | null;
  loading: boolean;
  error: string | null;
  setSelectedId: (id: string) => void;
  refreshEntities: () => Promise<void>;
}
