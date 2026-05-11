/**
 * VALIDATION EXAMPLES
 * Shows how to apply Zod validation to existing endpoints
 *
 * Copy-paste these patterns into main.ts to apply validation
 */

import { Express, Request, Response } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validation-middleware';
import {
  CreateEntitySchema,
  UpdateEntitySchema,
  EntityIdParamSchema,
  CreateKeywordSchema,
  KeywordParamSchema,
  CreateCompetitorGroupSchema,
  UpdateCompetitorGroupSchema,
  GroupIdParamSchema,
  AddGroupMemberSchema,
  CreateChatSchema,
  ChatFollowUpSchema,
  ConversationIdParamSchema,
  FetchNewsSchema,
  CreateEventSchema,
  AcknowledgeEventSchema,
  EventIdParamSchema,
  Schemas,
} from '../schemas/validation';

/**
 * BEFORE: POST /api/entities (without validation)
 *
 * app.post('/api/entities', async (req: Request, res: Response) => {
 *   try {
 *     const { name, type, description } = req.body; // ⚠️ No validation!
 *
 *     // Create entity...
 *   } catch (error) { ... }
 * });
 */

/**
 * AFTER: POST /api/entities (with validation)
 *
 * app.post('/api/entities',
 *   validateBody(CreateEntitySchema), // ← Add this line!
 *   async (req: Request, res: Response) => {
 *     try {
 *       const { name, type, description } = req.body; // ✅ Now validated & typed!
 *
 *       // TypeScript knows: name is string, type is 'politician'|'influencer'|'brand'
 *       // Frontend will receive clear error message if invalid
 *     } catch (error) { ... }
 *   }
 * );
 */

// ============================================================================
// PATTERN 1: Validate Body Only
// ============================================================================

/**
 * POST /api/entities - Create entity
 *
 * BEFORE:
 * app.post('/api/entities', async (req, res) => { ... });
 *
 * AFTER:
 */
export function exampleCreateEntity(app: Express) {
  app.post('/api/entities',
    validateBody(CreateEntitySchema), // ✅ Validate body
    async (req: Request, res: Response) => {
      try {
        // req.body is now:
        // {
        //   name: string (1-255 chars)
        //   type: 'politician' | 'influencer' | 'brand'
        //   description?: string (max 1000 chars)
        //   url?: string (valid URL)
        // }

        const { name, type, description, url } = req.body;

        // Create entity in database
        // ... existing code ...

        res.status(201).json({ id: 'uuid', name, type });
      } catch (error) {
        console.error('Error creating entity:', error);
        res.status(500).json({ error: 'Failed to create entity' });
      }
    }
  );
}

// ============================================================================
// PATTERN 2: Validate Body + Params
// ============================================================================

/**
 * PUT /api/entities/:id - Update entity
 *
 * BEFORE:
 * app.put('/api/entities/:id', async (req, res) => { ... });
 *
 * AFTER:
 */
export function exampleUpdateEntity(app: Express) {
  app.put('/api/entities/:id',
    validateParams(EntityIdParamSchema),    // ✅ Validate params
    validateBody(UpdateEntitySchema),        // ✅ Validate body
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params; // Validated UUID
        const { name, type, description, url, priority_regions } = req.body; // All optional & validated

        // Update entity in database
        // ... existing code ...

        res.json({ id, name, type });
      } catch (error) {
        console.error('Error updating entity:', error);
        res.status(500).json({ error: 'Failed to update entity' });
      }
    }
  );
}

// ============================================================================
// PATTERN 3: Validate Params + Delete
// ============================================================================

/**
 * DELETE /api/entities/:id - Delete entity
 *
 * BEFORE:
 * app.delete('/api/entities/:id', async (req, res) => { ... });
 *
 * AFTER:
 */
export function exampleDeleteEntity(app: Express) {
  app.delete('/api/entities/:id',
    validateParams(EntityIdParamSchema), // ✅ Validate params
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params; // Validated UUID

        // Delete entity
        // ... existing code ...

        res.json({ deleted: true });
      } catch (error) {
        console.error('Error deleting entity:', error);
        res.status(500).json({ error: 'Failed to delete entity' });
      }
    }
  );
}

// ============================================================================
// PATTERN 4: Validate Body + Complex Nested Data
// ============================================================================

/**
 * POST /api/chat - Create chat conversation
 *
 * BEFORE:
 * app.post('/api/chat', async (req, res) => { ... });
 *
 * AFTER:
 */
export function exampleCreateChat(app: Express) {
  app.post('/api/chat',
    validateBody(CreateChatSchema), // ✅ Validate body (including nested context)
    async (req: Request, res: Response) => {
      try {
        const { entity_id, message, context } = req.body;

        // req.body is now:
        // {
        //   entity_id: UUID (required)
        //   message: string (1-5000 chars)
        //   context?: {
        //     focus?: 'sentiment' | 'competitors' | 'trends' | 'general'
        //     date_range?: {
        //       start?: ISO datetime
        //       end?: ISO datetime
        //     }
        //   }
        // }

        // Create conversation
        // ... existing code ...

        res.status(201).json({ conversation_id: 'uuid' });
      } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
      }
    }
  );
}

// ============================================================================
// PATTERN 5: Validate Query Parameters (GET requests)
// ============================================================================

/**
 * GET /api/news/filter - Filter news (already has validation, but showing pattern)
 *
 * BEFORE:
 * app.get('/api/news/filter', async (req, res) => {
 *   const { entityId, days = '7' } = req.query; // ⚠️ No type safety
 * });
 *
 * AFTER:
 */
export function exampleFilterNews(app: Express) {
  app.get('/api/news/filter',
    validateQuery(FetchNewsSchema), // ✅ Validate query params
    async (req: Request, res: Response) => {
      try {
        const { entity_id, days = 7, sentiment, source, region } = req.query as any;

        // req.query is now:
        // {
        //   entity_id?: UUID
        //   days?: number (1-365)
        //   sentiment?: 'positive' | 'negative' | 'neutral' | 'all'
        //   source?: string (max 100 chars)
        //   region?: state code (SP, RJ, etc)
        // }

        // Fetch news
        // ... existing code ...

        res.json({ news: [] });
      } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
      }
    }
  );
}

// ============================================================================
// PATTERN 6: Multiple Validators (Body + Params)
// ============================================================================

/**
 * POST /api/entities/:id/keywords - Add keyword to entity
 *
 * BEFORE:
 * app.post('/api/entities/:id/keywords', async (req, res) => { ... });
 *
 * AFTER:
 */
export function exampleAddKeyword(app: Express) {
  app.post('/api/entities/:id/keywords',
    validateParams(EntityIdParamSchema),    // ✅ Validate URL params
    validateBody(CreateKeywordSchema),      // ✅ Validate body
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;          // Validated UUID
        const { keyword } = req.body;       // Validated keyword string

        // Add keyword
        // ... existing code ...

        res.status(201).json({ id, keyword });
      } catch (error) {
        console.error('Error adding keyword:', error);
        res.status(500).json({ error: 'Failed to add keyword' });
      }
    }
  );
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Validation errors are automatically handled by middleware
 *
 * If user sends invalid data:
 *
 * POST /api/entities
 * Body: { name: "", type: "invalid", url: "not a url" }
 *
 * Response (400):
 * {
 *   "error": "Validation failed",
 *   "details": [
 *     {
 *       "field": "name",
 *       "message": "String must contain at least 1 character(s)",
 *       "code": "too_small"
 *     },
 *     {
 *       "field": "type",
 *       "message": "Invalid enum value. Expected 'politician' | 'influencer' | 'brand'",
 *       "code": "invalid_enum_value"
 *     },
 *     {
 *       "field": "url",
 *       "message": "Invalid url",
 *       "code": "invalid_string"
 *     }
 *   ]
 * }
 */

// ============================================================================
// INTEGRATION CHECKLIST
// ============================================================================

/**
 * To apply validation to all endpoints:
 *
 * 1. Import at top of main.ts:
 *    import { validateBody, validateParams, validateQuery } from './middleware/validation-middleware';
 *    import { CreateEntitySchema, ... } from './schemas/validation';
 *
 * 2. For each POST/PUT endpoint, add middleware:
 *    app.post('/api/entities',
 *      validateBody(CreateEntitySchema),  // ← Add this
 *      async (req, res) => { ... }
 *    );
 *
 * 3. For each DELETE endpoint with :id param, add:
 *    app.delete('/api/entities/:id',
 *      validateParams(EntityIdParamSchema),  // ← Add this
 *      async (req, res) => { ... }
 *    );
 *
 * 4. For GET endpoints with query filters, add:
 *    app.get('/api/news/filter',
 *      validateQuery(FetchNewsSchema),  // ← Add this
 *      async (req, res) => { ... }
 *    );
 *
 * Priority order (apply in this order):
 * 1. POST /api/entities (high impact)
 * 2. PUT /api/entities/:id
 * 3. POST /api/chat (core feature)
 * 4. POST /api/competitor-groups
 * 5. POST /api/news/fetch
 * 6. All other POST/PUT endpoints
 * 7. GET endpoints with query filters (optional but good)
 */

// ============================================================================
// TESTING EXAMPLES
// ============================================================================

/**
 * Test valid request:
 *
 * curl -X POST http://localhost:5001/api/entities \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name": "Lula",
 *     "type": "politician",
 *     "description": "President"
 *   }'
 *
 * Response (201):
 * { "id": "uuid", "name": "Lula", "type": "politician" }
 */

/**
 * Test invalid request:
 *
 * curl -X POST http://localhost:5001/api/entities \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name": "",
 *     "type": "invalid"
 *   }'
 *
 * Response (400):
 * {
 *   "error": "Validation failed",
 *   "details": [...]
 * }
 */
