/**
 * Utility Functions Tests
 * Tests helper functions used throughout the backend
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
    test('should validate days within range (1-365)', () => {
      expect(validateDaysParameter('7')).toBe(7);
      expect(validateDaysParameter('1')).toBe(1);
      expect(validateDaysParameter('365')).toBe(365);
      expect(validateDaysParameter(30)).toBe(30);
    });

    test('should use default value 7 when undefined/null', () => {
      expect(validateDaysParameter(undefined)).toBe(7);
      expect(validateDaysParameter(null as any)).toBe(7);
      expect(validateDaysParameter('')).toBe(7);
    });

    test('should reject days below minimum', () => {
      expect(() => validateDaysParameter('0')).toThrow();
      expect(() => validateDaysParameter('-5')).toThrow();
      expect(() => validateDaysParameter('-365')).toThrow();
    });

    test('should reject days above maximum', () => {
      expect(() => validateDaysParameter('366')).toThrow();
      expect(() => validateDaysParameter('999')).toThrow();
      expect(() => validateDaysParameter('1000')).toThrow();
    });

    test('should reject non-numeric values', () => {
      expect(() => validateDaysParameter('abc')).toThrow();
      expect(() => validateDaysParameter('7 days')).toThrow();
      expect(() => validateDaysParameter('NaN')).toThrow();
    });

    test('should support custom min/max', () => {
      expect(validateDaysParameter('15', 10, 20)).toBe(15);
      expect(() => validateDaysParameter('5', 10, 20)).toThrow();
      expect(() => validateDaysParameter('25', 10, 20)).toThrow();
    });

    test('should handle floating point gracefully', () => {
      // parseInt removes decimal part
      expect(validateDaysParameter('7.5')).toBe(7);
      expect(validateDaysParameter('30.9')).toBe(30);
    });
  });

  describe('isValidUUID', () => {
    test('should accept valid UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
      expect(isValidUUID('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF')).toBe(true);
    });

    test('should be case-insensitive', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidUUID(uuid.toLowerCase())).toBe(true);
      expect(isValidUUID(uuid.toUpperCase())).toBe(true);
    });

    test('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('550e8400e89b12d3a456426614174000')).toBe(false);
    });

    test('should reject malicious input', () => {
      expect(isValidUUID("550e8400-e89b-41d4-a716-446655440000'; DROP--")).toBe(false);
      expect(isValidUUID('${process.env.API_KEY}')).toBe(false);
      expect(isValidUUID('<script>alert("xss")</script>')).toBe(false);
    });

    test('should reject null/undefined', () => {
      expect(isValidUUID(null as any)).toBe(false);
      expect(isValidUUID(undefined as any)).toBe(false);
    });
  });

  describe('isValidStateCode', () => {
    test('should accept valid Brazilian state codes', () => {
      const validCodes = [
        'SP', 'RJ', 'MG', 'BA', 'SC', 'RS', 'PR', 'PE',
        'CE', 'PA', 'GO', 'PB', 'MA', 'ES', 'PI', 'RN',
        'AL', 'MT', 'MS', 'DF', 'RO', 'AC', 'AM', 'RR', 'AP', 'TO', 'SE'
      ];

      validCodes.forEach(code => {
        expect(isValidStateCode(code)).toBe(true);
      });
    });

    test('should be case-insensitive', () => {
      expect(isValidStateCode('sp')).toBe(true);
      expect(isValidStateCode('Sp')).toBe(true);
      expect(isValidStateCode('SP')).toBe(true);
    });

    test('should reject invalid codes', () => {
      expect(isValidStateCode('XX')).toBe(false);
      expect(isValidStateCode('YY')).toBe(false);
      expect(isValidStateCode('ZZ')).toBe(false);
    });

    test('should reject wrong format', () => {
      expect(isValidStateCode('S')).toBe(false);
      expect(isValidStateCode('SPP')).toBe(false);
      expect(isValidStateCode('')).toBe(false);
      expect(isValidStateCode('1P')).toBe(false);
    });

    test('should reject malicious input', () => {
      expect(isValidStateCode("SP'; --")).toBe(false);
      expect(isValidStateCode("SP' OR '1'='1")).toBe(false);
      expect(isValidStateCode('SP`test`')).toBe(false);
    });
  });

  describe('validateUUIDArray', () => {
    test('should validate comma-separated UUIDs', () => {
      const input = '550e8400-e29b-41d4-a716-446655440000,00000000-0000-0000-0000-000000000000';
      const result = validateUUIDArray(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    test('should validate array of UUIDs', () => {
      const input = [
        '550e8400-e29b-41d4-a716-446655440000',
        '00000000-0000-0000-0000-000000000000'
      ];
      const result = validateUUIDArray(input);
      expect(result).toHaveLength(2);
    });

    test('should filter invalid UUIDs with warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const input = '550e8400-e29b-41d4-a716-446655440000,invalid-uuid,00000000-0000-0000-0000-000000000000';

      const result = validateUUIDArray(input);

      expect(result).toHaveLength(2);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should throw if no valid UUIDs', () => {
      expect(() => validateUUIDArray('invalid,also-invalid')).toThrow(
        'No valid UUIDs provided'
      );
    });

    test('should trim whitespace', () => {
      const input = '550e8400-e29b-41d4-a716-446655440000 , 00000000-0000-0000-0000-000000000000';
      const result = validateUUIDArray(input);
      expect(result).toHaveLength(2);
    });

    test('should handle empty/null gracefully', () => {
      expect(() => validateUUIDArray('')).toThrow();
      expect(() => validateUUIDArray([])).toThrow();
    });
  });

  describe('validateStateCodeArray', () => {
    test('should validate comma-separated state codes', () => {
      const input = 'SP,RJ,MG';
      const result = validateStateCodeArray(input);
      expect(result).toHaveLength(3);
      expect(result).toEqual(['SP', 'RJ', 'MG']);
    });

    test('should validate array of state codes', () => {
      const input = ['sp', 'rj', 'mg'];
      const result = validateStateCodeArray(input);
      expect(result).toHaveLength(3);
      expect(result).toEqual(['SP', 'RJ', 'MG']);
    });

    test('should return uppercase codes', () => {
      const input = 'sp,rJ,mG';
      const result = validateStateCodeArray(input);
      expect(result).toEqual(['SP', 'RJ', 'MG']);
    });

    test('should filter invalid codes', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const input = 'SP,XX,RJ,YY,MG';

      const result = validateStateCodeArray(input);

      expect(result).toHaveLength(3);
      expect(result).toEqual(['SP', 'RJ', 'MG']);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });

    test('should throw if no valid codes', () => {
      expect(() => validateStateCodeArray('XX,YY,ZZ')).toThrow(
        'No valid state codes provided'
      );
    });
  });

  describe('buildSafeINClause', () => {
    test('should build IN clause with placeholders', () => {
      const [clause, params] = buildSafeINClause(['uuid1', 'uuid2', 'uuid3']);
      expect(clause).toBe('($1,$2,$3)');
      expect(params).toEqual(['uuid1', 'uuid2', 'uuid3']);
    });

    test('should handle custom param offset', () => {
      const [clause, params] = buildSafeINClause(['uuid1', 'uuid2'], 5);
      expect(clause).toBe('($5,$6)');
      expect(params).toEqual(['uuid1', 'uuid2']);
    });

    test('should throw for empty array', () => {
      expect(() => buildSafeINClause([])).toThrow(
        'Cannot build IN clause with empty array'
      );
    });

    test('should handle single value', () => {
      const [clause, params] = buildSafeINClause(['uuid1']);
      expect(clause).toBe('($1)');
      expect(params).toEqual(['uuid1']);
    });

    test('should handle large arrays', () => {
      const ids = Array.from({ length: 100 }, (_, i) => `uuid${i}`);
      const [clause, params] = buildSafeINClause(ids);

      expect(clause).toContain('($1');
      expect(clause).toContain('$100)');
      expect(params).toHaveLength(100);
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should prevent days parameter injection', () => {
      expect(() => validateDaysParameter("7; DROP TABLE entities; --")).toThrow();
      expect(() => validateDaysParameter("7 OR 1=1")).toThrow();
      expect(() => validateDaysParameter("7' OR '1'='1")).toThrow();
    });

    test('should prevent UUID injection', () => {
      const malicious = "550e8400-e29b-41d4-a716-446655440000'; DROP--";
      expect(isValidUUID(malicious)).toBe(false);
    });

    test('should prevent state code injection', () => {
      expect(isValidStateCode("SP' OR '1'='1")).toBe(false);
      expect(isValidStateCode("SP; DROP TABLE--")).toBe(false);
      expect(isValidStateCode("SP` OR 1=1 `")).toBe(false);
    });

    test('should make buildSafeINClause injection-safe', () => {
      const ids = ['uuid1', "uuid2'); DROP TABLE--"];
      const [clause, params] = buildSafeINClause(ids);

      // Injection attempt is passed as parameter, not SQL
      expect(clause).toBe('($1,$2)');
      expect(params[1]).toContain('DROP TABLE');
      // Safe because it's a parameter value, not SQL
    });
  });

  describe('Edge Cases', () => {
    test('should handle unicode characters', () => {
      expect(isValidStateCode('中文')).toBe(false);
      expect(isValidStateCode('SP')).toBe(true);
    });

    test('should handle whitespace-only strings', () => {
      expect(isValidStateCode('  ')).toBe(false);
      expect(isValidUUID('   ')).toBe(false);
    });

    test('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      expect(isValidUUID(longString)).toBe(false);
      expect(isValidStateCode(longString)).toBe(false);
    });
  });
});
