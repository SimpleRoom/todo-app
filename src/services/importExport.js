import { formatExportTimestamp } from '@/utils/datetime';
import { ImportFormatError } from '@/types/errors';
import { LIMITS } from '@/constants/storage';

/**
 * 序列化任务为导出文件（filename + JSON content）。
 * 即使 tasks 为空数组也返回 []。
 * @param {import('@/types/task').Task[]} tasks
 * @returns {{filename: string, content: string}}
 */
export function exportTasks(tasks) {
  const timestamp = Date.now();
  const filename = `todo-backup-${formatExportTimestamp(timestamp)}.json`;
  const content = JSON.stringify(tasks, null, 2);
  return { filename, content };
}

/**
 * 解析并校验导入文件内容。
 * - 非 JSON 或非数组 → 抛 ImportFormatError
 * - 元素缺必填字段 → 跳过，invalid++
 * - 字段超长 → 截断，仍加入 tasks
 * - createdAt 非法 → 替换为当前时间戳，仍加入 tasks
 * @param {string} text
 * @returns {{tasks: import('@/types/task').Task[], invalid: number}}
 */
export function parseImportFile(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ImportFormatError('文件格式无效，请选择有效的备份文件');
  }
  if (!Array.isArray(parsed)) {
    throw new ImportFormatError('文件格式无效，请选择有效的备份文件');
  }

  const tasks = [];
  let invalid = 0;
  for (const item of parsed) {
    const result = normalizeItem(item);
    if (result === null) {
      invalid++;
      continue;
    }
    tasks.push(result);
  }
  return { tasks, invalid };
}

function normalizeItem(item) {
  if (typeof item !== 'object' || item === null) {
    console.warn('[importExport] 跳过非对象记录', item);
    return null;
  }
  // 必填字段检查
  if (typeof item.id !== 'string' || item.id.length === 0) {
    console.warn('[importExport] 跳过缺 id 的记录', item);
    return null;
  }
  if (typeof item.title !== 'string') {
    console.warn('[importExport] 跳过缺 title 的记录', item);
    return null;
  }
  if (typeof item.completed !== 'boolean') {
    console.warn('[importExport] 跳过缺 completed 的记录', item);
    return null;
  }
  let createdAt = item.createdAt;
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt) || createdAt <= 0) {
    console.warn('[importExport] createdAt 非法，替换为当前时间戳', createdAt);
    createdAt = Date.now();
  }
  // description 容错
  let description = '';
  if (typeof item.description === 'string') {
    description = item.description;
  }
  // 字段超长截断
  let title = item.title;
  if (title.length > LIMITS.TITLE_MAX) {
    console.warn(`[importExport] title 超长，截断至 ${LIMITS.TITLE_MAX} 字符`);
    title = title.slice(0, LIMITS.TITLE_MAX);
  }
  if (description.length > LIMITS.DESCRIPTION_MAX) {
    console.warn(`[importExport] description 超长，截断至 ${LIMITS.DESCRIPTION_MAX} 字符`);
    description = description.slice(0, LIMITS.DESCRIPTION_MAX);
  }
  return { id: item.id, title, description, completed: item.completed, createdAt };
}

/**
 * 触发浏览器文件下载。
 * @param {string} filename
 * @param {string} content
 */
export function triggerDownload(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
