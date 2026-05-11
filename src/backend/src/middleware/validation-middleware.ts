/**
 * Express middleware for Zod validation
 * Validates request body, params, and query
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory for validating request body
 * @param schema - Zod schema to validate against
 * @returns Express middleware
 *
 * @example
 * app.post('/api/entities', validateBody(CreateEntitySchema), async (req, res) => {
 *   // req.body is now type-safe and validated
 * });
 */
export function validateBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          error: 'Validation failed',
          details: formattedErrors,
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware factory for validating request params
 * @param schema - Zod schema to validate against
 * @returns Express middleware
 *
 * @example
 * app.delete('/api/entities/:id', validateParams(EntityIdParamSchema), async (req, res) => {
 *   // req.params is now validated
 * });
 */
export function validateParams(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Invalid URL parameters',
          details: formattedErrors,
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware factory for validating query parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware
 *
 * @example
 * app.get('/api/entities', validateQuery(EntityFilterSchema), async (req, res) => {
 *   // req.query is now validated
 * });
 */
export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'Invalid query parameters',
          details: formattedErrors,
        });
      }
      next(error);
    }
  };
}

/**
 * Validate any object against a schema (for internal use)
 * @param schema - Zod schema
 * @param data - Data to validate
 * @param errorMessage - Custom error message
 * @returns Validated data or throws error
 */
export async function validateData<T>(
  schema: ZodSchema,
  data: unknown,
  errorMessage: string = 'Validation failed'
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new Error(`${errorMessage}: ${JSON.stringify(details)}`);
    }
    throw error;
  }
}

/**
 * Compose multiple validation middleware
 * @param validators - Array of middleware functions
 * @returns Single middleware
 *
 * @example
 * app.post('/api/entities',
 *   composeValidators([
 *     validateBody(CreateEntitySchema),
 *     validateQuery(PaginationSchema),
 *   ]),
 *   handler
 * );
 */
export function composeValidators(
  validators: Array<(req: Request, res: Response, next: NextFunction) => void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    let index = 0;

    const executeNext = () => {
      if (index < validators.length) {
        const middleware = validators[index++];
        middleware(req, res, () => {
          executeNext();
        });
      } else {
        next();
      }
    };

    executeNext();
  };
}

/**
 * Safe parse with fallback (doesn't throw, returns null if invalid)
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validated data or null
 */
export async function tryValidate<T>(
  schema: ZodSchema,
  data: unknown
): Promise<T | null> {
  try {
    return await schema.parseAsync(data);
  } catch {
    return null;
  }
}
