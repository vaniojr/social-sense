/**
 * Tests for SQL injection prevention utilities
 * Ensures all input validation works correctly
 */

import {
  validateDaysParameter,
  isValidUUID,
  isValidStateCode,
  validateUUIDArray,
  validateStateCodeArray,
  buildSafeINClause,
} from '../src/utils/query-validation';

describe('Query Validation Utilities', () => {
  describe('validateDaysParameter', () => {
    test('accepts valid days (1-365)', () => {
      expect(validateDaysParameter('7')).toBe(7);
      expect(validateDaysParameter('1')).toBe(1);
      expect(validateDaysParameter('365')).toBe(365);
      expect(validateDaysParameter(30)).toBe(30);
    });

    test('uses default (7) when not provided', () => {
      expect(validateDaysParameter(undefined)).toBe(7);
      expect(validateDaysParameter(null as any)).toBe(7);
    });

    test('rejects days below minimum', () => {
      expect(() => validateDaysParameter('0')).toThrow('Days must be between 1 and 365');
      expect(() => validateDaysParameter('-5')).toThrow('Days must be between 1 and 365');
    });

    test('rejects days above maximum', () => {
      expect(() => validateDaysParameter('366')).toThrow('Days must be between 1 and 365');
      expect(() => validateDaysParameter('999')).toThrow('Days must be between 1 and 365');
    });

    test('rejects non-numeric values', () => {
      expect(() => validateDaysParameter('abc')).toThrow('Invalid days parameter: must be a number');
      expect(() => validateDaysParameter('7 days')).toThrow('Invalid days parameter: must be a number');
    });

    test('accepts custom min/max ranges', () => {
      expect(validateDaysParameter('15', 10, 20)).toBe(15);
      expect(() => validateDaysParameter('5', 10, 20)).toThrow();
      expect(() => validateDaysParameter('25', 10, 20)).toThrow();
    });
  });

  describe('isValidUUID', () => {
    test('accepts valid UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
      expect(isValidUUID('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBe(true);
    });

    test('rejects invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('123e4567e89b12d3a456426614174000')).toBe(false);
    });

    test('rejects malicious input', () => {
      expect(isValidUUID("'; DROP TABLE entities; --")).toBe(false);
      expect(isValidUUID('${process.env.API_KEY}')).toBe(false);
    });
  });

  describe('isValidStateCode', () => {
    test('accepts valid Brazilian state codes', () => {
      expect(isValidStateCode('SP')).toBe(true);
      expect(isValidStateCode('RJ')).toBe(true);
      expect(isValidStateCode('MG')).toBe(true);
      expect(isValidStateCode('sp')).toBe(true); // case insensitive
      expect(isValidStateCode('rj')).toBe(true);
    });

    test('rejects invalid state codes', () => {
      expect(isValidStateCode('XX')).toBe(false);
      expect(isValidStateCode('SPP')).toBe(false);
      expect(isValidStateCode('S')).toBe(false);
      expect(isValidStateCode('')).toBe(false);
    });

    test('rejects malicious input', () => {
      expect(isValidStateCode("'; --")).toBe(false);
      expect(isValidStateCode('SP` OR 1=1 --')).toBe(false);
    });
  });

  describe('validateUUIDArray', () => {
    test('validates comma-separated UUIDs', () => {
      const input = '123e4567-e89b-12d3-a456-426614174000,00000000-0000-0000-0000-000000000000';
      const result = validateUUIDArray(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    test('validates array of UUIDs', () => {
      const input = ['123e4567-e89b-12d3-a456-426614174000', '00000000-0000-0000-0000-000000000000'];
      const result = validateUUIDArray(input);
      expect(result).toHaveLength(2);
    });

    test('filters out invalid UUIDs with warning', () => {
      const input = '123e4567-e89b-12d3-a456-426614174000,invalid-uuid,00000000-0000-0000-0000-000000000000';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = validateUUIDArray(input);
      expect(result).toHaveLength(2);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('throws if no valid UUIDs', () => {
      expect(() => validateUUIDArray('invalid,also-invalid')).toThrow('No valid UUIDs provided');
    });

    test('trims whitespace from input', () => {
      const input = '123e4567-e89b-12d3-a456-426614174000 , 00000000-0000-0000-0000-000000000000';
      const result = validateUUIDArray(input);
      expect(result).toHaveLength(2);
    });
  });

  describe('validateStateCodeArray', () => {
    test('validates comma-separated state codes', () => {
      const input = 'SP,RJ,MG';
      const result = validateStateCodeArray(input);
      expect(result).toHaveLength(3);
      expect(result).toEqual(['SP', 'RJ', 'MG']);
    });

    test('validates array of state codes', () => {
      const input = ['sp', 'rj', 'mg'];
      const result = validateStateCodeArray(input);
      expect(result).toHaveLength(3);
      expect(result).toEqual(['SP', 'RJ', 'MG']); // uppercase
    });

    test('filters out invalid codes', () => {
      const input = 'SP,XX,RJ,YY,MG';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = validateStateCodeArray(input);
      expect(result).toHaveLength(3);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });

    test('throws if no valid codes', () => {
      expect(() => validateStateCodeArray('XX,YY,ZZ')).toThrow('No valid state codes provided');
    });

    test('returns uppercase codes', () => {
      const input = 'sp,rJ,mG';
      const result = validateStateCodeArray(input);
      expect(result).toEqual(['SP', 'RJ', 'MG']);
    });
  });

  describe('buildSafeINClause', () => {
    test('builds IN clause with placeholders', () => {
      const [clause, params] = buildSafeINClause(['uuid1', 'uuid2', 'uuid3']);
      expect(clause).toBe('($1,$2,$3)');
      expect(params).toEqual(['uuid1', 'uuid2', 'uuid3']);
    });

    test('handles custom param offset', () => {
      const [clause, params] = buildSafeINClause(['uuid1', 'uuid2'], 5);
      expect(clause).toBe('($5,$6)');
      expect(params).toEqual(['uuid1', 'uuid2']);
    });

    test('throws for empty array', () => {
      expect(() => buildSafeINClause([])).toThrow('Cannot build IN clause with empty array');
    });

    test('handles single value', () => {
      const [clause, params] = buildSafeINClause(['uuid1']);
      expect(clause).toBe('($1)');
      expect(params).toEqual(['uuid1']);
    });
  });

  describe('SQL Injection Prevention', () => {
    test('prevents days parameter injection', () => {
      expect(() => validateDaysParameter("7; DROP TABLE entities; --")).toThrow();
      expect(() => validateDaysParameter("7 OR 1=1")).toThrow();
      expect(() => validateDaysParameter("7' OR '1'='1")).toThrow();
    });

    test('prevents UUID injection', () => {
      const malicious = "123e4567-e89b-12d3-a456-426614174000'; DROP TABLE entities; --";
      expect(isValidUUID(malicious)).toBe(false);
    });

    test('prevents state code injection', () => {
      expect(isValidStateCode("SP' OR '1'='1")).toBe(false);
      expect(isValidStateCode("SP; DROP TABLE--")).toBe(false);
      expect(isValidStateCode("SP` OR 1=1 `")).toBe(false);
    });

    test('buildSafeINClause prevents IN clause injection', () => {
      const ids = ['uuid1', "uuid2'); DROP TABLE entities; --"];
      const [clause, params] = buildSafeINClause(ids);
      // Injection attempt is passed as parameter, not SQL
      expect(clause).toBe('($1,$2)');
      expect(params[1]).toContain('DROP TABLE'); // Safe - it's a parameter value
    });
  });
});
