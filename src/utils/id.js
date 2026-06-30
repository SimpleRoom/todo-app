/**
 * 生成唯一任务 ID（UUID v4）。
 * 使用浏览器原生 crypto.randomUUID()，保证全局唯一性。
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // 兼容兜底（理论上不会触发，因为我们只支持现代浏览器）
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
