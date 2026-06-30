# Data Model: 任务清单应用

**Date**: 2026-06-29
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

---

## Entities

### Task（任务）

任务清单的核心实体，对应一条用户任务。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `string` | 非空、UUID v4、全局唯一 | 新增时由 `crypto.randomUUID()` 生成；导入时保留原 id |
| `title` | `string` | 非空（去首尾空白后）、1 ≤ length ≤ 100 | 任务标题，必填 |
| `description` | `string` | 0 ≤ length ≤ 500 | 任务描述，可空 |
| `completed` | `boolean` | — | 是否已完成，新增时为 `false` |
| `createdAt` | `number` | 正整数、毫秒时间戳 | 创建时间，由 `Date.now()` 生成；编辑时不变 |

**JSDoc 定义**（`src/types/task.js`）:

```javascript
/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {boolean} completed
 * @property {number} createdAt
 */

/**
 * @typedef {'all' | 'active' | 'completed'} FilterState
 */
```

**Validation rules**:
- 标题：去除首尾空白后非空，长度 1-100
- 描述：长度 0-500（可为空字符串）
- `completed` 必须为布尔值
- `createdAt` 必须为正整数

### FilterState（筛选状态）

枚举值，表示当前列表筛选条件。

| 取值 | 含义 |
|------|------|
| `"all"` | 全部任务 |
| `"active"` | 未完成任务（`completed === false`） |
| `"completed"` | 已完成任务（`completed === true`） |

**JSDoc 定义**:

```javascript
/**
 * @typedef {'all' | 'active' | 'completed'} FilterState
 */
```

### SelectionState（多选选中态）

多选模式下的选中任务 id 集合。

```javascript
/** @type {Set<string>} */
// SelectionState 通过 Set<string> 表示，无独立类型定义
```

---

## State Transitions

### Task 状态机

```text
                  add()
                    │
                    ▼
              ┌─────────────┐
              │  Uncompleted │◄──────┐
              │  (completed  │       │ toggle() 取消完成
              │   = false)   │       │
              └─────────────┘       │
                    │ toggle()      │
                    │ 标记完成       │
                    ▼               │
              ┌─────────────┐
              │  Completed   │
              │  (completed  │
              │   = true)    │
              └─────────────┘
                    │
                    │ remove() 或 batchRemove()
                    ▼
                 [deleted]
```

**允许的转换**:
- `Uncompleted` ↔ `Completed`（通过 `toggle`）
- 任意状态 → `[deleted]`（通过 `remove` 或 `batchRemove`）
- `title`/`description` 可通过 `update` 修改，不改变 `completed` 状态

---

## Storage Schema

### localStorage 键值

| 键名 | 值结构 | 说明 |
|------|--------|------|
| `todoapp:tasks:v1` | `{"version": 1, "tasks": Task[]}` | 全部任务，按 `createdAt` 倒序存储 |
| `todoapp:filter:v1` | `FilterState` 字符串 | 当前筛选状态 |

**版本迁移**: 读取时检查 `version` 字段；缺失或为 1 → 直接使用 `tasks` 数组；未来版本 → 调用 `migrate(from, to)` 链。

---

## Import/Export JSON Schema

### 导出文件格式

文件名：`todo-backup-YYYYMMDD-HHMMSS.json`
内容：JSON 数组，每个元素为 Task 对象。

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "买牛奶",
    "description": "下班顺路",
    "completed": false,
    "createdAt": 1719650000000
  }
]
```

### 导入校验规则

| 校验项 | 失败处理 |
|--------|---------|
| 文件非 JSON 或非数组 | 整体拒绝，提示"文件格式无效" |
| 元素缺 `id` 字段 | 跳过该记录，控制台告警 |
| 元素缺 `title` 字段 | 跳过该记录，控制台告警 |
| 元素缺 `completed` 字段 | 跳过该记录，控制台告警 |
| 元素缺 `createdAt` 字段 | 跳过该记录，控制台告警 |
| `title` 超过 100 字符 | 截断至 100，控制台告警，仍导入 |
| `description` 超过 500 字符 | 截断至 500，控制台告警，仍导入 |
| `createdAt` 非法（负数/非数字/非日期） | 替换为 `Date.now()`，控制台告警，仍导入 |
| `id` 与本地已有任务重复 | 跳过该记录（保留本地版本） |

**导入结果提示**: `"成功导入 N 条，跳过 M 条无效记录"`

---

## Invariants（数据不变量）

- 同一 `id` 在任务列表中唯一存在
- `createdAt` 在创建后永不改变（编辑、完成切换均不影响）
- 任务列表始终按 `createdAt` 倒序排列（最新在前）
- `completed` 仅通过 `toggle` 操作改变，编辑不改变 `completed`
- 所有持久化操作（add/update/toggle/remove/batchRemove/import）完成后，localStorage 状态与内存状态一致
