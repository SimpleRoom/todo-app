import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportTasks, parseImportFile, triggerDownload } from '@/services/importExport';
import { ImportFormatError } from '@/types/errors';
import { _clearAllForTests } from '@/services/taskRepository';

describe('importExport', () => {
  beforeEach(() => {
    _clearAllForTests();
  });

  describe('exportTasks', () => {
    it('returns valid filename and JSON content', () => {
      const tasks = [
        { id: 'a', title: '买牛奶', description: '下班顺路', completed: false, createdAt: 1719650000000 },
      ];
      const result = exportTasks(tasks);
      expect(result.filename).toMatch(/^todo-backup-\d{8}-\d{6}\.json$/);
      const parsed = JSON.parse(result.content);
      expect(parsed).toEqual(tasks);
    });

    it('returns empty JSON array for empty tasks (empty-array export)', () => {
      const result = exportTasks([]);
      expect(result.content).toBe('[]');
    });

    it('filename format is YYYYMMDD-HHMMSS', () => {
      const result = exportTasks([]);
      expect(result.filename).toMatch(/^todo-backup-\d{8}-\d{6}\.json$/);
    });
  });

  describe('parseImportFile', () => {
    it('parses valid file with all tasks', () => {
      const tasks = [
        { id: 'a', title: 'A', description: '', completed: false, createdAt: 1000 },
        { id: 'b', title: 'B', description: 'desc', completed: true, createdAt: 2000 },
      ];
      const result = parseImportFile(JSON.stringify(tasks));
      expect(result.tasks).toEqual(tasks);
      expect(result.invalid).toBe(0);
    });

    it('throws ImportFormatError for non-JSON text', () => {
      expect(() => parseImportFile('not json')).toThrow(ImportFormatError);
    });

    it('throws ImportFormatError for non-array JSON', () => {
      expect(() => parseImportFile('{"not":"array"}')).toThrow(ImportFormatError);
      expect(() => parseImportFile('"string"')).toThrow(ImportFormatError);
      expect(() => parseImportFile('42')).toThrow(ImportFormatError);
    });

    it('skips records missing required id field', () => {
      const text = JSON.stringify([
        { title: 'no id', description: '', completed: false, createdAt: 1000 },
        { id: 'ok', title: 'OK', description: '', completed: false, createdAt: 1000 },
      ]);
      const result = parseImportFile(text);
      expect(result.tasks.length).toBe(1);
      expect(result.invalid).toBe(1);
    });

    it('skips records missing required title field', () => {
      const text = JSON.stringify([
        { id: 'a', description: '', completed: false, createdAt: 1000 },
      ]);
      const result = parseImportFile(text);
      expect(result.tasks.length).toBe(0);
      expect(result.invalid).toBe(1);
    });

    it('skips records missing completed field', () => {
      const text = JSON.stringify([
        { id: 'a', title: 'A', description: '', createdAt: 1000 },
      ]);
      const result = parseImportFile(text);
      expect(result.invalid).toBe(1);
    });

    it('replaces missing createdAt with current timestamp (still imports)', () => {
      const text = JSON.stringify([
        { id: 'a', title: 'A', description: '', completed: false },
      ]);
      const before = Date.now();
      const result = parseImportFile(text);
      const after = Date.now();
      expect(result.tasks.length).toBe(1);
      expect(result.invalid).toBe(0);
      expect(result.tasks[0].createdAt).toBeGreaterThanOrEqual(before);
      expect(result.tasks[0].createdAt).toBeLessThanOrEqual(after);
    });

    it('truncates title exceeding 100 chars (still imports)', () => {
      const longTitle = 'a'.repeat(150);
      const text = JSON.stringify([
        { id: 'a', title: longTitle, description: '', completed: false, createdAt: 1000 },
      ]);
      const result = parseImportFile(text);
      expect(result.tasks.length).toBe(1);
      expect(result.tasks[0].title.length).toBe(100);
      expect(result.invalid).toBe(0);
    });

    it('truncates description exceeding 500 chars (still imports)', () => {
      const longDesc = 'a'.repeat(600);
      const text = JSON.stringify([
        { id: 'a', title: 'A', description: longDesc, completed: false, createdAt: 1000 },
      ]);
      const result = parseImportFile(text);
      expect(result.tasks.length).toBe(1);
      expect(result.tasks[0].description.length).toBe(500);
    });

    it('replaces invalid createdAt with current timestamp (still imports)', () => {
      const text = JSON.stringify([
        { id: 'a', title: 'A', description: '', completed: false, createdAt: -1 },
      ]);
      const before = Date.now();
      const result = parseImportFile(text);
      const after = Date.now();
      expect(result.tasks.length).toBe(1);
      expect(result.tasks[0].createdAt).toBeGreaterThanOrEqual(before);
      expect(result.tasks[0].createdAt).toBeLessThanOrEqual(after);
    });

    it('handles non-string description as empty', () => {
      const text = JSON.stringify([
        { id: 'a', title: 'A', description: 42, completed: false, createdAt: 1000 },
      ]);
      const result = parseImportFile(text);
      expect(result.tasks[0].description).toBe('');
    });

    it('skips non-object items', () => {
      const text = JSON.stringify([
        'string item',
        42,
        null,
        { id: 'ok', title: 'OK', description: '', completed: false, createdAt: 1000 },
      ]);
      const result = parseImportFile(text);
      expect(result.tasks.length).toBe(1);
      expect(result.invalid).toBe(3);
    });
  });

  describe('triggerDownload', () => {
    it('creates link, clicks it, and removes it', () => {
      const createObjectURLSpy = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.fn();
      Object.defineProperty(URL, 'createObjectURL', {
        value: createObjectURLSpy,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: revokeObjectURLSpy,
        configurable: true,
        writable: true,
      });

      const createdLinks = [];
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if (node instanceof HTMLAnchorElement) createdLinks.push(node);
        return node;
      });
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      const clickSpy = vi.fn();
      HTMLAnchorElement.prototype.click = clickSpy;

      triggerDownload('test.json', '[]');

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(createdLinks.length).toBe(1);
      expect(createdLinks[0].download).toBe('test.json');
      expect(createdLinks[0].href).toBe('blob:mock-url');
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();

      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
