/**
 * Zod schemas for input validation
 * All request bodies and params validated against these schemas
 */

import { z } from 'zod';

// ============================================================================
// COMMON TYPES
// ============================================================================

/** UUID validation */
const UUIDSchema = z.string().uuid('Invalid UUID format');

/** Entity type */
const EntityTypeSchema = z.enum(['politician', 'influencer', 'brand']);

/** State code (27 Brazilian states) */
const StateCodeSchema = z
  .string()
  .length(2, 'State code must be 2 characters')
  .regex(/^[A-Z]{2}$/, 'State code must be uppercase letters')
  .refine(
    (code) => [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ].includes(code),
    { message: 'Invalid Brazilian state code' }
  );

/** Sentiment score (-1 to 1) */
const SentimentSchema = z
  .number()
  .min(-1, 'Sentiment must be >= -1')
  .max(1, 'Sentiment must be <= 1');

/** Days parameter (1-365) */
const DaysParamSchema = z
  .string()
  .or(z.number())
  .pipe(z.coerce.number().min(1).max(365));

/** Alert severity */
const SeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

// ============================================================================
// ENTITIES
// ============================================================================

export const CreateEntitySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be <= 255 characters'),
  type: EntityTypeSchema,
  description: z
    .string()
    .max(1000, 'Description must be <= 1000 characters')
    .optional(),
  url: z
    .string()
    .url('Invalid URL')
    .optional(),
});

export type CreateEntityRequest = z.infer<typeof CreateEntitySchema>;

export const UpdateEntitySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .optional(),
  type: EntityTypeSchema.optional(),
  description: z.string().max(1000).optional(),
  url: z.string().url().optional(),
  priority_regions: z
    .array(StateCodeSchema)
    .optional(),
  alert_preferences: z
    .object({
      sentiment_drop: z.boolean().optional(),
      critical_sentiment: z.boolean().optional(),
      high_volume: z.boolean().optional(),
    })
    .optional(),
});

export type UpdateEntityRequest = z.infer<typeof UpdateEntitySchema>;

export const EntityIdParamSchema = z.object({
  id: UUIDSchema,
});

// ============================================================================
// KEYWORDS
// ============================================================================

export const CreateKeywordSchema = z.object({
  keyword: z
    .string()
    .min(1, 'Keyword is required')
    .max(255, 'Keyword must be <= 255 characters'),
});

export type CreateKeywordRequest = z.infer<typeof CreateKeywordSchema>;

export const KeywordParamSchema = z.object({
  id: UUIDSchema,
  keyword: z.string(),
});

// ============================================================================
// COMPETITOR GROUPS
// ============================================================================

export const CreateCompetitorGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be <= 255 characters'),
  description: z
    .string()
    .max(1000)
    .optional(),
});

export type CreateCompetitorGroupRequest = z.infer<typeof CreateCompetitorGroupSchema>;

export const UpdateCompetitorGroupSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
});

export type UpdateCompetitorGroupRequest = z.infer<typeof UpdateCompetitorGroupSchema>;

export const AddGroupMemberSchema = z.object({
  entity_id: UUIDSchema,
});

export type AddGroupMemberRequest = z.infer<typeof AddGroupMemberSchema>;

export const GroupIdParamSchema = z.object({
  id: UUIDSchema,
});

// ============================================================================
// CHAT / CONVERSATIONS
// ============================================================================

export const CreateChatSchema = z.object({
  entity_id: UUIDSchema,
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be <= 5000 characters'),
  context: z
    .object({
      focus: z.enum(['sentiment', 'competitors', 'trends', 'general']).optional(),
      date_range: z.object({
        start: z.string().datetime().optional(),
        end: z.string().datetime().optional(),
      }).optional(),
    })
    .optional(),
});

export type CreateChatRequest = z.infer<typeof CreateChatSchema>;

export const UpdateConversationSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(255)
    .optional(),
});

export type UpdateConversationRequest = z.infer<typeof UpdateConversationSchema>;

export const ChatFollowUpSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must be <= 5000 characters'),
  conversation_id: UUIDSchema,
});

export type ChatFollowUpRequest = z.infer<typeof ChatFollowUpSchema>;

export const ConversationIdParamSchema = z.object({
  id: UUIDSchema,
});

// ============================================================================
// ALERTS / TRENDS
// ============================================================================

export const DismissTrendAlertSchema = z.object({
  reason: z
    .string()
    .max(500)
    .optional(),
});

export type DismissTrendAlertRequest = z.infer<typeof DismissTrendAlertSchema>;

export const TrendAlertIdParamSchema = z.object({
  id: UUIDSchema,
});

// ============================================================================
// NEWS
// ============================================================================

export const FetchNewsSchema = z.object({
  entity_id: UUIDSchema.optional(),
  days: DaysParamSchema.optional(),
  sentiment: z
    .enum(['positive', 'negative', 'neutral', 'all'])
    .optional(),
  source: z.string().max(100).optional(),
  region: StateCodeSchema.optional(),
});

export type FetchNewsRequest = z.infer<typeof FetchNewsSchema>;

// ============================================================================
// EVENTS / METRICS
// ============================================================================

export const CreateEventSchema = z.object({
  entity_id: UUIDSchema,
  event_type: z
    .string()
    .min(1)
    .max(50),
  severity: SeveritySchema.optional(),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateEventRequest = z.infer<typeof CreateEventSchema>;

export const AcknowledgeEventSchema = z.object({
  notes: z.string().max(500).optional(),
});

export type AcknowledgeEventRequest = z.infer<typeof AcknowledgeEventSchema>;

export const EventIdParamSchema = z.object({
  id: UUIDSchema,
});

export const CreateMetricSchema = z.object({
  entity_id: UUIDSchema,
  metric_name: z
    .string()
    .min(1)
    .max(100),
  metric_value: z.number(),
  timestamp: z.string().datetime().optional(),
});

export type CreateMetricRequest = z.infer<typeof CreateMetricSchema>;

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export const ApproveRecommendationSchema = z.object({
  implementation_notes: z.string().max(1000).optional(),
});

export type ApproveRecommendationRequest = z.infer<typeof ApproveRecommendationSchema>;

export const ReviewRecommendationSchema = z.object({
  feedback: z
    .string()
    .min(1, 'Feedback is required')
    .max(1000),
  status: z
    .enum(['helpful', 'not_helpful', 'needs_revision'])
    .optional(),
});

export type ReviewRecommendationRequest = z.infer<typeof ReviewRecommendationSchema>;

export const DismissRecommendationSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type DismissRecommendationRequest = z.infer<typeof DismissRecommendationSchema>;

export const GenerateRecommendationSchema = z.object({
  entity_id: UUIDSchema,
  context: z
    .string()
    .min(1)
    .max(5000)
    .optional(),
});

export type GenerateRecommendationRequest = z.infer<typeof GenerateRecommendationSchema>;

export const RecommendationIdParamSchema = z.object({
  id: UUIDSchema,
});

// ============================================================================
// QUERY PARAMETERS (Common)
// ============================================================================

export const PaginationSchema = z.object({
  offset: z
    .string()
    .or(z.number())
    .pipe(z.coerce.number().min(0))
    .optional(),
  limit: z
    .string()
    .or(z.number())
    .pipe(z.coerce.number().min(1).max(100))
    .optional(),
});

export const DateRangeSchema = z.object({
  days: DaysParamSchema.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export const EntityFilterSchema = z.object({
  entity_id: UUIDSchema.optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  region: StateCodeSchema.optional(),
});

// ============================================================================
// EXPORTS
// ============================================================================

/** All schemas for easy import */
export const Schemas = {
  // Entities
  CreateEntity: CreateEntitySchema,
  UpdateEntity: UpdateEntitySchema,
  EntityIdParam: EntityIdParamSchema,

  // Keywords
  CreateKeyword: CreateKeywordSchema,
  KeywordParam: KeywordParamSchema,

  // Competitor Groups
  CreateCompetitorGroup: CreateCompetitorGroupSchema,
  UpdateCompetitorGroup: UpdateCompetitorGroupSchema,
  AddGroupMember: AddGroupMemberSchema,
  GroupIdParam: GroupIdParamSchema,

  // Chat
  CreateChat: CreateChatSchema,
  UpdateConversation: UpdateConversationSchema,
  ChatFollowUp: ChatFollowUpSchema,
  ConversationIdParam: ConversationIdParamSchema,

  // Alerts
  DismissTrendAlert: DismissTrendAlertSchema,
  TrendAlertIdParam: TrendAlertIdParamSchema,

  // News
  FetchNews: FetchNewsSchema,

  // Events
  CreateEvent: CreateEventSchema,
  AcknowledgeEvent: AcknowledgeEventSchema,
  EventIdParam: EventIdParamSchema,

  // Metrics
  CreateMetric: CreateMetricSchema,

  // Recommendations
  ApproveRecommendation: ApproveRecommendationSchema,
  ReviewRecommendation: ReviewRecommendationSchema,
  DismissRecommendation: DismissRecommendationSchema,
  GenerateRecommendation: GenerateRecommendationSchema,
  RecommendationIdParam: RecommendationIdParamSchema,

  // Common
  Pagination: PaginationSchema,
  DateRange: DateRangeSchema,
  EntityFilter: EntityFilterSchema,
};
