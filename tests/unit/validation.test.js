import { describe, it, expect } from 'vitest';
import { validateTitle, validateDescription } from '@/utils/validation';
import { ValidationError } from '@/types/errors';

describe('validateTitle', () => {
  it('accepts valid non-empty title', () => {
    expect(validateTitle('买牛奶')).toBe('买牛奶');
  });

  it('trims whitespace', () => {
    expect(validateTitle('  买牛奶  ')).toBe('买牛奶');
  });

  it('throws ValidationError for empty string', () => {
    expect(() => validateTitle('')).toThrow(ValidationError);
  });

  it('throws ValidationError for whitespace-only string', () => {
    expect(() => validateTitle('   ')).toThrow(ValidationError);
  });

  it('accepts title at exactly 100 chars', () => {
    const title = 'a'.repeat(100);
    expect(validateTitle(title)).toBe(title);
  });

  it('throws ValidationError when title exceeds 100 chars', () => {
    const title = 'a'.repeat(101);
    expect(() => validateTitle(title)).toThrow(ValidationError);
  });

  it('error message mentions 标题', () => {
    try {
      validateTitle('');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e instanceof ValidationError).toBe(true);
      expect(e.field).toBe('title');
      expect(e.message).toContain('标题');
    }
  });
});

describe('validateDescription', () => {
  it('accepts empty description', () => {
    expect(validateDescription('')).toBe('');
  });

  it('accepts valid description', () => {
    expect(validateDescription('下班顺路')).toBe('下班顺路');
  });

  it('accepts description at exactly 500 chars', () => {
    const desc = 'a'.repeat(500);
    expect(validateDescription(desc)).toBe(desc);
  });

  it('throws ValidationError when description exceeds 500 chars', () => {
    const desc = 'a'.repeat(501);
    expect(() => validateDescription(desc)).toThrow(ValidationError);
  });

  it('error message mentions 描述', () => {
    try {
      validateDescription('a'.repeat(501));
      throw new Error('should have thrown');
    } catch (e) {
      expect(e instanceof ValidationError).toBe(true);
      expect(e.field).toBe('description');
      expect(e.message).toContain('描述');
    }
  });
});
