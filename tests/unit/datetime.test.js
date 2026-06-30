import { describe, it, expect } from 'vitest';
import { formatChineseDateTime, formatExportTimestamp } from '@/utils/datetime';

describe('formatChineseDateTime', () => {
  it('formats a known timestamp correctly', () => {
    const timestamp = new Date(2026, 5, 29, 14, 30).getTime();
    const result = formatChineseDateTime(timestamp);
    expect(result).toBe('2026年06月29日 14:30');
  });

  it('pads single-digit month/day/hour/minute with zeros', () => {
    const timestamp = new Date(2026, 0, 5, 3, 7).getTime();
    const result = formatChineseDateTime(timestamp);
    expect(result).toBe('2026年01月05日 03:07');
  });

  it('returns empty string for invalid timestamp', () => {
    expect(formatChineseDateTime(NaN)).toBe('');
  });

  it('matches expected YYYY年MM月DD日 HH:MM format', () => {
    const timestamp = new Date(2026, 11, 31, 23, 59).getTime();
    expect(formatChineseDateTime(timestamp)).toMatch(/^\d{4}年\d{2}月\d{2}日 \d{2}:\d{2}$/);
  });
});

describe('formatExportTimestamp', () => {
  it('formats as YYYYMMDD-HHMMSS', () => {
    const timestamp = new Date(2026, 5, 29, 14, 30, 45).getTime();
    expect(formatExportTimestamp(timestamp)).toBe('20260629-143045');
  });

  it('pads single digits', () => {
    const timestamp = new Date(2026, 0, 5, 3, 7, 9).getTime();
    expect(formatExportTimestamp(timestamp)).toBe('20260105-030709');
  });

  it('returns string fallback for invalid timestamp', () => {
    const result = formatExportTimestamp(NaN);
    expect(typeof result).toBe('string');
  });
});
