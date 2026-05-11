/**
 * Security utilities for validated database queries
 * Prevents SQL injection by validating input parameters
 */

/**
 * Validates day parameter is within acceptable range
 * @param days - Number of days from query param (untrusted)
 * @param min - Minimum allowed (default 1)
 * @param max - Maximum allowed (default 365)
 * @returns Validated number
 * @throws Error if invalid
 */
export function validateDaysParameter(
  days: string | number | undefined,
  min: number = 1,
  max: number = 365
): number {
  const daysStr = String(days || '7').trim();

  if (!daysStr) {
    return min; // Empty string defaults to min
  }

  // Check if the entire string is numeric (including optional minus sign and decimal point)
  // This prevents partial parsing like '7 days' -> 7
  if (!/^-?\d+(\.\d+)?$/.test(daysStr)) {
    throw new Error(`Invalid days parameter: must be a number`);
  }

  const parsed = Math.floor(parseFloat(daysStr));

  if (isNaN(parsed)) {
    throw new Error(`Invalid days parameter: must be a number`);
  }

  if (parsed < min || parsed > max) {
    throw new Error(`Days must be between ${min} and ${max}, got: ${parsed}`);
  }

  return parsed;
}

/**
 * Validates UUID format (basic check)
 * @param uuid - UUID string to validate
 * @returns true if valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates state code is valid Brazilian state
 * @param stateCode - State code (e.g., 'SP', 'RJ')
 * @returns true if valid
 */
export function isValidStateCode(stateCode: string): boolean {
  const validStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  return validStates.includes(stateCode.toUpperCase());
}

/**
 * Safe way to build INTERVAL clause with validated days
 * DO NOT use string interpolation - use this instead
 * @param days - Number of days (will be validated)
 * @returns Tuple of [intervalSQL, parameters]
 *
 * @example
 * const [intervalClause, params] = getIntervalClause(req.query.days);
 * const sql = `SELECT * FROM table WHERE created_at > NOW() - ${intervalClause}`;
 * pool.query(sql, params);
 */
export function getIntervalClause(days: string | number | undefined): [string, any[]] {
  const validatedDays = validateDaysParameter(days);
  // Using INTERVAL with parameterized value
  return [`INTERVAL '1 day' * $1`, [validatedDays]];
}

/**
 * Example of SAFE usage:
 *
 * const [intervalClause, intervalParams] = getIntervalClause(req.query.days);
 * const result = await pool.query(
 *   `SELECT * FROM sentiment_scores
 *    WHERE entity_id = $1
 *    AND created_at > NOW() - ${intervalClause}`,
 *   [entityId, ...intervalParams]  // Note the spread
 * );
 */

/**
 * Validates and sanitizes array of UUIDs
 * @param ids - Comma-separated UUIDs or array
 * @returns Array of valid UUIDs
 */
export function validateUUIDArray(ids: string | string[]): string[] {
  let idArray: string[] = [];

  if (typeof ids === 'string') {
    idArray = ids.split(',').map(id => id.trim());
  } else {
    idArray = ids;
  }

  const validated = idArray.filter(id => {
    if (!isValidUUID(id)) {
      console.warn(`⚠️  Invalid UUID filtered out: ${id}`);
      return false;
    }
    return true;
  });

  if (validated.length === 0) {
    throw new Error('No valid UUIDs provided');
  }

  return validated;
}

/**
 * Validates and sanitizes array of state codes
 * @param codes - Comma-separated state codes or array
 * @returns Array of valid state codes (uppercase)
 */
export function validateStateCodeArray(codes: string | string[]): string[] {
  let codeArray: string[] = [];

  if (typeof codes === 'string') {
    codeArray = codes.split(',').map(code => code.trim());
  } else {
    codeArray = codes;
  }

  const validated = codeArray.filter(code => {
    if (!isValidStateCode(code)) {
      console.warn(`⚠️  Invalid state code filtered out: ${code}`);
      return false;
    }
    return true;
  });

  if (validated.length === 0) {
    throw new Error('No valid state codes provided');
  }

  return validated.map(code => code.toUpperCase());
}

/**
 * Safely build IN clause for parameterized queries
 * @param ids - Array of UUIDs or values
 * @param paramOffset - Starting param number (default 1)
 * @returns Tuple of [sql_fragment, array_of_values]
 *
 * @example
 * const [inClause, inParams] = buildSafeINClause(['uuid1', 'uuid2']);
 * const sql = `SELECT * FROM entities WHERE id IN (${inClause})`;
 * pool.query(sql, inParams);
 */
export function buildSafeINClause(
  ids: string[],
  paramOffset: number = 1
): [string, string[]] {
  if (ids.length === 0) {
    throw new Error('Cannot build IN clause with empty array');
  }

  const placeholders = ids
    .map((_, index) => `$${paramOffset + index}`)
    .join(',');

  return [`(${placeholders})`, ids];
}
