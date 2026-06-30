import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllTasks,
  addTask,
  updateTask,
  toggleTask,
  removeTask,
  batchRemoveTasks,
  importTasks,
  subscribe,
  _clearAllForTests,
} from '@/services/taskRepository';
import { ValidationError, NotFoundError, StorageError } from '@/types/errors';

describe('taskRepository', () => {
  beforeEach(() => {
    _clearAllForTests();
  });

  describe('getAllTasks', () => {
    it('returns empty array when no tasks', () => {
      expect(getAllTasks()).toEqual([]);
    });

    it('returns tasks sorted by createdAt descending', () => {
      const t1 = addTask({ title: '旧任务', description: '' });
      const t2 = addTask({ title: '新任务', description: '' });
      const all = getAllTasks();
      expect(all[0].id).toBe(t2.id);
      expect(all[1].id).toBe(t1.id);
    });
  });

  describe('addTask', () => {
    it('creates task with generated id and createdAt', () => {
      const task = addTask({ title: '买牛奶', description: '下班顺路' });
      expect(task.id).toBeTruthy();
      expect(task.title).toBe('买牛奶');
      expect(task.description).toBe('下班顺路');
      expect(task.completed).toBe(false);
      expect(typeof task.createdAt).toBe('number');
      expect(task.createdAt).toBeGreaterThan(0);
    });

    it('trims title whitespace', () => {
      const task = addTask({ title: '  买牛奶  ', description: '' });
      expect(task.title).toBe('买牛奶');
    });

    it('throws ValidationError when title is empty', () => {
      expect(() => addTask({ title: '', description: '' })).toThrow(ValidationError);
      expect(() => addTask({ title: '   ', description: '' })).toThrow(ValidationError);
    });

    it('throws ValidationError when title exceeds 100 chars', () => {
      const longTitle = 'a'.repeat(101);
      expect(() => addTask({ title: longTitle, description: '' })).toThrow(ValidationError);
    });

    it('throws ValidationError when description exceeds 500 chars', () => {
      const longDesc = 'a'.repeat(501);
      expect(() => addTask({ title: '合法', description: longDesc })).toThrow(ValidationError);
    });

    it('throws StorageError when write fails', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota');
      });
      expect(() => addTask({ title: 'x', description: '' })).toThrow(StorageError);
      spy.mockRestore();
    });
  });

  describe('updateTask', () => {
    it('updates title and description, preserves id/createdAt/completed', () => {
      const task = addTask({ title: '原标题', description: '原描述' });
      const updated = updateTask(task.id, { title: '新标题', description: '新描述' });
      expect(updated.title).toBe('新标题');
      expect(updated.description).toBe('新描述');
      expect(updated.id).toBe(task.id);
      expect(updated.createdAt).toBe(task.createdAt);
      expect(updated.completed).toBe(task.completed);
    });

    it('throws NotFoundError when id does not exist', () => {
      expect(() => updateTask('nonexistent', { title: 'x', description: '' })).toThrow(NotFoundError);
    });

    it('throws ValidationError when title empty', () => {
      const task = addTask({ title: '原', description: '' });
      expect(() => updateTask(task.id, { title: '', description: '' })).toThrow(ValidationError);
    });
  });

  describe('toggleTask', () => {
    it('toggles completed false → true', () => {
      const task = addTask({ title: 'x', description: '' });
      const toggled = toggleTask(task.id);
      expect(toggled.completed).toBe(true);
    });

    it('toggles completed true → false', () => {
      const task = addTask({ title: 'x', description: '' });
      toggleTask(task.id);
      const toggledAgain = toggleTask(task.id);
      expect(toggledAgain.completed).toBe(false);
    });

    it('throws NotFoundError when id does not exist', () => {
      expect(() => toggleTask('nonexistent')).toThrow(NotFoundError);
    });
  });

  describe('removeTask', () => {
    it('removes task', () => {
      const task = addTask({ title: 'x', description: '' });
      removeTask(task.id);
      expect(getAllTasks()).toEqual([]);
    });

    it('throws NotFoundError when id does not exist', () => {
      expect(() => removeTask('nonexistent')).toThrow(NotFoundError);
    });
  });

  describe('batchRemoveTasks', () => {
    it('removes multiple tasks and returns removed ids', () => {
      const t1 = addTask({ title: '1', description: '' });
      const t2 = addTask({ title: '2', description: '' });
      const t3 = addTask({ title: '3', description: '' });
      const removed = batchRemoveTasks([t1.id, t3.id]);
      expect(removed).toEqual(expect.arrayContaining([t1.id, t3.id]));
      expect(getAllTasks().map((t) => t.id)).toEqual([t2.id]);
    });

    it('returns empty array when ids empty', () => {
      expect(batchRemoveTasks([])).toEqual([]);
    });

    it('returns empty array when no id matches', () => {
      expect(batchRemoveTasks(['nonexistent'])).toEqual([]);
    });

    it('handles partial match (some ids already gone)', () => {
      const t1 = addTask({ title: '1', description: '' });
      const removed = batchRemoveTasks([t1.id, 'gone']);
      expect(removed).toEqual([t1.id]);
    });
  });

  describe('importTasks', () => {
    it('imports all new tasks', () => {
      const tasks = [
        { id: 'a', title: 'A', description: '', completed: false, createdAt: 1000 },
        { id: 'b', title: 'B', description: '', completed: true, createdAt: 2000 },
      ];
      const result = importTasks(tasks);
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(getAllTasks().length).toBe(2);
    });

    it('skips duplicate ids (keeps local)', () => {
      const existing = addTask({ title: '本地', description: '' });
      const tasks = [
        { id: existing.id, title: '远程覆盖', description: '', completed: true, createdAt: 0 },
        { id: 'new', title: '新任务', description: '', completed: false, createdAt: 1000 },
      ];
      const result = importTasks(tasks);
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      const all = getAllTasks();
      const local = all.find((t) => t.id === existing.id);
      expect(local.title).toBe('本地');
    });

    it('returns zero counts for empty input', () => {
      expect(importTasks([])).toEqual({ imported: 0, skipped: 0 });
    });
  });

  describe('subscribe', () => {
    it('calls listener when storage event fires for tasks key', () => {
      const listener = vi.fn();
      const unsub = subscribe(listener);
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'todoapp:tasks:v1' }),
      );
      expect(listener).toHaveBeenCalledTimes(1);
      unsub();
    });

    it('calls listener when storage event fires for filter key', () => {
      const listener = vi.fn();
      const unsub = subscribe(listener);
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'todoapp:filter:v1' }),
      );
      expect(listener).toHaveBeenCalledTimes(1);
      unsub();
    });

    it('does not call listener for unrelated keys', () => {
      const listener = vi.fn();
      const unsub = subscribe(listener);
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'unrelated' }),
      );
      expect(listener).not.toHaveBeenCalled();
      unsub();
    });

    it('unsubscribe stops notifications', () => {
      const listener = vi.fn();
      const unsub = subscribe(listener);
      unsub();
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'todoapp:tasks:v1' }),
      );
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
