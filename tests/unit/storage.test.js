import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isStorageAvailable, safeGet, safeSet, readTasksEnvelope, writeTasksEnvelope } from '@/services/storage';
import { STORAGE_KEYS } from '@/constants/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isStorageAvailable', () => {
    it('returns true in normal jsdom environment', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    it('returns false when setItem throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota exceeded');
      });
      expect(isStorageAvailable()).toBe(false);
      spy.mockRestore();
    });
  });

  describe('safeGet', () => {
    it('returns fallback when key does not exist', () => {
      expect(safeGet('missing', { default: true })).toEqual({ default: true });
    });

    it('returns parsed JSON when key exists', () => {
      localStorage.setItem('foo', JSON.stringify({ a: 1 }));
      expect(safeGet('foo', null)).toEqual({ a: 1 });
    });

    it('returns fallback when JSON is invalid', () => {
      localStorage.setItem('foo', '{invalid json');
      expect(safeGet('foo', { fallback: true })).toEqual({ fallback: true });
    });

    it('returns fallback when storage unavailable', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('unavailable');
      });
      expect(safeGet('foo', 'fallback')).toBe('fallback');
      spy.mockRestore();
    });
  });

  describe('safeSet', () => {
    it('writes JSON and returns true on success', () => {
      expect(safeSet('foo', { a: 1 })).toBe(true);
      expect(localStorage.getItem('foo')).toBe(JSON.stringify({ a: 1 }));
    });

    it('returns false when quota exceeded', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota exceeded');
      });
      expect(safeSet('foo', { a: 1 })).toBe(false);
      spy.mockRestore();
    });
  });

  describe('readTasksEnvelope / writeTasksEnvelope', () => {
    it('returns empty array when no data', () => {
      expect(readTasksEnvelope()).toEqual([]);
    });

    it('round-trips tasks through envelope', () => {
      const tasks = [
        { id: 'a', title: 'A', description: '', completed: false, createdAt: 1000 },
      ];
      expect(writeTasksEnvelope(tasks)).toBe(true);
      expect(readTasksEnvelope()).toEqual(tasks);
    });

    it('handles envelope-shape data', () => {
      const envelope = { version: 1, tasks: [{ id: 'a', title: 'A' }] };
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(envelope));
      expect(readTasksEnvelope()).toEqual([{ id: 'a', title: 'A' }]);
    });

    it('handles raw-array data (legacy)', () => {
      const tasks = [{ id: 'a', title: 'A' }];
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      expect(readTasksEnvelope()).toEqual(tasks);
    });

    it('returns empty array for malformed shape', () => {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify({ notTasks: true }));
      expect(readTasksEnvelope()).toEqual([]);
    });
  });
});
