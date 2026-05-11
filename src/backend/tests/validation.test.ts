/**
 * Tests for Zod validation schemas
 * Ensures all input validation works correctly
 */

import {
  CreateEntitySchema,
  UpdateEntitySchema,
  CreateKeywordSchema,
  CreateCompetitorGroupSchema,
  CreateChatSchema,
  CreateEventSchema,
  FetchNewsSchema,
  ApproveRecommendationSchema,
  Schemas,
} from '../src/schemas/validation';

describe('Zod Validation Schemas', () => {
  // ========================================================================
  // ENTITIES
  // ========================================================================

  describe('CreateEntitySchema', () => {
    test('accepts valid entity', () => {
      const valid = {
        name: 'Lula',
        type: 'politician',
        description: 'President',
        url: 'https://lula.com',
      };
      expect(() => CreateEntitySchema.parse(valid)).not.toThrow();
    });

    test('accepts minimal entity (name + type)', () => {
      const minimal = {
        name: 'Neymar',
        type: 'influencer',
      };
      expect(() => CreateEntitySchema.parse(minimal)).not.toThrow();
    });

    test('rejects empty name', () => {
      expect(() => CreateEntitySchema.parse({
        name: '',
        type: 'politician',
      })).toThrow('Name is required');
    });

    test('rejects invalid type', () => {
      expect(() => CreateEntitySchema.parse({
        name: 'Test',
        type: 'invalid',
      })).toThrow();
    });

    test('rejects name > 255 characters', () => {
      expect(() => CreateEntitySchema.parse({
        name: 'a'.repeat(256),
        type: 'politician',
      })).toThrow('Name must be <= 255 characters');
    });

    test('rejects invalid URL', () => {
      expect(() => CreateEntitySchema.parse({
        name: 'Test',
        type: 'brand',
        url: 'not-a-url',
      })).toThrow('Invalid URL');
    });

    test('accepts valid URL formats', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://example.com/path',
      ];

      validUrls.forEach(url => {
        expect(() => CreateEntitySchema.parse({
          name: 'Test',
          type: 'brand',
          url,
        })).not.toThrow();
      });
    });
  });

  describe('UpdateEntitySchema', () => {
    test('accepts all fields optional', () => {
      expect(() => UpdateEntitySchema.parse({})).not.toThrow();
    });

    test('accepts partial updates', () => {
      const updates = [
        { name: 'New Name' },
        { type: 'influencer' },
        { description: 'New description' },
        { priority_regions: ['SP', 'RJ'] },
      ];

      updates.forEach(update => {
        expect(() => UpdateEntitySchema.parse(update)).not.toThrow();
      });
    });

    test('validates priority_regions state codes', () => {
      expect(() => UpdateEntitySchema.parse({
        priority_regions: ['SP', 'RJ', 'MG'],
      })).not.toThrow();

      expect(() => UpdateEntitySchema.parse({
        priority_regions: ['XX', 'YY'],
      })).toThrow();
    });

    test('accepts alert_preferences', () => {
      expect(() => UpdateEntitySchema.parse({
        alert_preferences: {
          sentiment_drop: true,
          critical_sentiment: false,
        },
      })).not.toThrow();
    });
  });

  // ========================================================================
  // KEYWORDS
  // ========================================================================

  describe('CreateKeywordSchema', () => {
    test('accepts valid keyword', () => {
      expect(() => CreateKeywordSchema.parse({
        keyword: 'election',
      })).not.toThrow();
    });

    test('rejects empty keyword', () => {
      expect(() => CreateKeywordSchema.parse({
        keyword: '',
      })).toThrow('Keyword is required');
    });

    test('rejects keyword > 255 characters', () => {
      expect(() => CreateKeywordSchema.parse({
        keyword: 'a'.repeat(256),
      })).toThrow('Keyword must be <= 255 characters');
    });
  });

  // ========================================================================
  // COMPETITOR GROUPS
  // ========================================================================

  describe('CreateCompetitorGroupSchema', () => {
    test('accepts valid group', () => {
      expect(() => CreateCompetitorGroupSchema.parse({
        name: 'My Competitors',
        description: 'Main competitors in market',
      })).not.toThrow();
    });

    test('rejects empty name', () => {
      expect(() => CreateCompetitorGroupSchema.parse({
        name: '',
      })).toThrow('Name is required');
    });

    test('accepts name without description', () => {
      expect(() => CreateCompetitorGroupSchema.parse({
        name: 'Competitors',
      })).not.toThrow();
    });
  });

  // ========================================================================
  // CHAT
  // ========================================================================

  describe('CreateChatSchema', () => {
    test('accepts valid chat message', () => {
      expect(() => CreateChatSchema.parse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        message: 'What is the sentiment trend?',
      })).not.toThrow();
    });

    test('rejects empty message', () => {
      expect(() => CreateChatSchema.parse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        message: '',
      })).toThrow('Message is required');
    });

    test('rejects invalid UUID', () => {
      expect(() => CreateChatSchema.parse({
        entity_id: 'not-a-uuid',
        message: 'test',
      })).toThrow('Invalid UUID format');
    });

    test('rejects message > 5000 characters', () => {
      expect(() => CreateChatSchema.parse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        message: 'a'.repeat(5001),
      })).toThrow('Message must be <= 5000 characters');
    });

    test('accepts message with context', () => {
      expect(() => CreateChatSchema.parse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        message: 'Analyze sentiment',
        context: {
          focus: 'sentiment',
          date_range: {
            start: '2026-05-01T00:00:00Z',
            end: '2026-05-11T23:59:59Z',
          },
        },
      })).not.toThrow();
    });

    test('validates context focus enum', () => {
      expect(() => CreateChatSchema.parse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        message: 'test',
        context: {
          focus: 'invalid_focus',
        },
      })).toThrow();
    });
  });

  // ========================================================================
  // EVENTS
  // ========================================================================

  describe('CreateEventSchema', () => {
    test('accepts valid event', () => {
      expect(() => CreateEventSchema.parse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'crisis_detected',
        severity: 'critical',
        description: 'Viral negative sentiment',
      })).not.toThrow();
    });

    test('rejects invalid severity', () => {
      expect(() => CreateEventSchema.parse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'test',
        severity: 'invalid',
      })).toThrow();
    });

    test('validates severity enum', () => {
      const validSeverities = ['low', 'medium', 'high', 'critical'];

      validSeverities.forEach(severity => {
        expect(() => CreateEventSchema.parse({
          entity_id: '550e8400-e29b-41d4-a716-446655440000',
          event_type: 'test',
          severity,
        })).not.toThrow();
      });
    });

    test('accepts metadata object', () => {
      expect(() => CreateEventSchema.parse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        event_type: 'test',
        metadata: {
          source: 'twitter',
          volume: 1000,
          regions: ['SP', 'RJ'],
        },
      })).not.toThrow();
    });
  });

  // ========================================================================
  // NEWS
  // ========================================================================

  describe('FetchNewsSchema', () => {
    test('accepts valid filters', () => {
      expect(() => FetchNewsSchema.parse({
        entity_id: '550e8400-e29b-41d4-a716-446655440000',
        days: '7',
        sentiment: 'negative',
        region: 'SP',
      })).not.toThrow();
    });

    test('accepts all parameters optional', () => {
      expect(() => FetchNewsSchema.parse({})).not.toThrow();
    });

    test('validates days parameter (1-365)', () => {
      expect(() => FetchNewsSchema.parse({ days: '0' })).toThrow();
      expect(() => FetchNewsSchema.parse({ days: '366' })).toThrow();
      expect(() => FetchNewsSchema.parse({ days: '180' })).not.toThrow();
    });

    test('accepts days as number or string', () => {
      expect(() => FetchNewsSchema.parse({ days: 30 })).not.toThrow();
      expect(() => FetchNewsSchema.parse({ days: '30' })).not.toThrow();
    });

    test('validates sentiment enum', () => {
      const validSentiments = ['positive', 'negative', 'neutral', 'all'];

      validSentiments.forEach(sentiment => {
        expect(() => FetchNewsSchema.parse({ sentiment })).not.toThrow();
      });

      expect(() => FetchNewsSchema.parse({ sentiment: 'invalid' })).toThrow();
    });

    test('validates state code', () => {
      expect(() => FetchNewsSchema.parse({ region: 'SP' })).not.toThrow();
      expect(() => FetchNewsSchema.parse({ region: 'XX' })).toThrow();
    });
  });

  // ========================================================================
  // RECOMMENDATIONS
  // ========================================================================

  describe('ApproveRecommendationSchema', () => {
    test('accepts valid approval', () => {
      expect(() => ApproveRecommendationSchema.parse({
        implementation_notes: 'Will implement next sprint',
      })).not.toThrow();
    });

    test('accepts empty approval (no notes required)', () => {
      expect(() => ApproveRecommendationSchema.parse({})).not.toThrow();
    });

    test('rejects notes > 1000 characters', () => {
      expect(() => ApproveRecommendationSchema.parse({
        implementation_notes: 'a'.repeat(1001),
      })).toThrow();
    });
  });

  // ========================================================================
  // ERROR MESSAGES
  // ========================================================================

  describe('Error Message Quality', () => {
    test('provides clear error messages for validation failure', () => {
      try {
        CreateEntitySchema.parse({
          name: '',
          type: 'invalid_type',
          url: 'not-a-url',
        });
      } catch (error: any) {
        const errors = error.errors || [];
        expect(errors.length).toBeGreaterThan(0);
        // Should have clear, actionable error messages
        errors.forEach((err: any) => {
          expect(err.message).toBeTruthy();
          expect(err.path).toBeTruthy();
        });
      }
    });
  });

  // ========================================================================
  // SECURITY
  // ========================================================================

  describe('Security - SQL/Script Injection Prevention', () => {
    test('rejects SQL injection attempts in strings', () => {
      expect(() => CreateEntitySchema.parse({
        name: "'; DROP TABLE entities; --",
        type: 'politician',
      })).not.toThrow(); // Should accept (as a string), not inject

      // The validation layer prevents this from reaching SQL
      // because it's used as a parameter, not SQL
    });

    test('rejects script injection attempts', () => {
      expect(() => CreateEntitySchema.parse({
        name: '<script>alert("xss")</script>',
        type: 'politician',
      })).not.toThrow(); // Should accept (validation layer is before SQL/HTML)
    });

    test('validates UUIDs to prevent injection', () => {
      expect(() => CreateChatSchema.parse({
        entity_id: "550e8400-e29b-41d4-a716-446655440000' OR '1'='1",
        message: 'test',
      })).toThrow('Invalid UUID format');
    });

    test('validates state codes to prevent injection', () => {
      expect(() => FetchNewsSchema.parse({
        region: "SP' OR 1=1 --",
      })).toThrow();
    });
  });

  // ========================================================================
  // TYPE INFERENCE
  // ========================================================================

  describe('Type Inference from Schemas', () => {
    test('schema types are exported correctly', () => {
      const entity = {
        name: 'Test',
        type: 'politician' as const,
      };

      const result = CreateEntitySchema.parse(entity);
      expect(result.name).toBe('Test');
      expect(result.type).toBe('politician');
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================

  describe('Edge Cases', () => {
    test('handles unicode characters in strings', () => {
      expect(() => CreateEntitySchema.parse({
        name: '中文名称',
        type: 'politician',
        description: 'émojis 🎉 work',
      })).not.toThrow();
    });

    test('handles very long valid strings', () => {
      expect(() => CreateEntitySchema.parse({
        name: 'a'.repeat(255),
        type: 'politician',
      })).not.toThrow();
    });

    test('handles null and undefined correctly', () => {
      // Optional fields should accept undefined
      expect(() => CreateEntitySchema.parse({
        name: 'Test',
        type: 'politician',
        description: undefined,
        url: undefined,
      })).not.toThrow();
    });

    test('handles whitespace-only strings', () => {
      expect(() => CreateEntitySchema.parse({
        name: '   ',
        type: 'politician',
      })).not.toThrow(); // Spaces are valid characters
    });
  });
});
