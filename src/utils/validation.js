import { ValidationError } from '@/types/errors';
import { LIMITS } from '@/constants/storage';

/**
 * 校验任务标题：去首尾空白后非空，长度 ≤ LIMITS.TITLE_MAX
 * 校验失败抛出 ValidationError。
 * @param {string} title
 * @returns {string} trimmed title
 */
export function validateTitle(title) {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('title', '请输入任务标题');
  }
  if (trimmed.length > LIMITS.TITLE_MAX) {
    throw new ValidationError('title', `标题最多 ${LIMITS.TITLE_MAX} 字符`);
  }
  return trimmed;
}

/**
 * 校验任务描述：长度 ≤ LIMITS.DESCRIPTION_MAX（可为空字符串）
 * 校验失败抛出 ValidationError。
 * @param {string} description
 * @returns {string}
 */
export function validateDescription(description) {
  if (description.length > LIMITS.DESCRIPTION_MAX) {
    throw new ValidationError('description', `描述最多 ${LIMITS.DESCRIPTION_MAX} 字符`);
  }
  return description;
}
