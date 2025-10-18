import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { safeJsonParse } from '../scripts/parser.mjs';

describe('safeJsonParse', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should parse a valid JSON string', () => {
    const jsonString = '{"a": 1, "b": "test"}';
    const result = safeJsonParse(jsonString);
    expect(result).toEqual({ a: 1, b: 'test' });
  });

  it('should return null for an invalid JSON string', () => {
    const jsonString = '{"a": 1, "b": "test}';
    const result = safeJsonParse(jsonString);
    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle leading and trailing noise', () => {
    const jsonString = 'noise{"a": 1}noise';
    const result = safeJsonParse(jsonString);
    expect(result).toEqual({ a: 1 });
  });

  it('should return null for an empty string', () => {
    const jsonString = '';
    const result = safeJsonParse(jsonString);
    expect(result).toBeNull();
  });
});
