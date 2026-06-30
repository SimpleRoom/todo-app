# Data Layer Contract: 任务清单应用

**Date**: 2026-06-29
**Spec**: [spec.md](../spec.md)
**Plan**: [plan.md](../plan.md)

本文件定义数据层（`src/services/`）的对外契约。数据层是唯一访问 localStorage 的层，视图层与状态层 MUST 通过本契约定义的接口调用，MUST NOT 直接操作 localStorage。

---

## Module: `storage.js`

底层存储抽象，提供安全的 localStorage 读写与版本管理。

### `isStorageAvailable(): boolean`

检测 localStorage 是否可用（隐私模式、禁用场景）。

- **Returns**: `true` 可用；`false` 不可用
- **Side effects**: 无
- **Contract**:
  - 通过 try/catch 写入测试键判定
  - 不可用时返回 `false`，调用方据此降级为内存态

### `safeGet<T>(key: string, fallback: T): T`

读取并反序列化 JSON 值。

- **Parameters**:
  - `key`: localStorage 键名
  - `fallback`: 读取失败或解析失败时的返回值
- **Returns**: 反序列化后的值或 `fallback`
- **Throws**: 永不抛出（内部 try/catch）
- **Contract**:
  - localStorage 不可用 → 返回 `fallback`
  - 键不存在 → 返回 `fallback`
  - JSON 解析失败 → 控制台告警 + 返回 `fallback`

### `safeSet(key: string, value: unknown): boolean`

序列化并写入 JSON 值。

- **Parameters**:
  - `key`: localStorage 键名
  - `value`: 任意可序列化值
- **Returns**: `true` 写入成功；`false` 写入失败（配额超限、隐私模式）
- **Throws**: 永不抛出
- **Contract**:
  - 写入失败时控制台告警
  - 不修改既有值

---

## Module: `taskRepository.js`

任务仓储，封装 CRUD 与跨标签页同步订阅。所有方法均在内部调用 `storage.ts`，不直接访问 localStorage。

### `getAllTasks(): Task[]`

读取全部任务，按 `createdAt` 倒序返回。

- **Returns**: `Task[]`，可能为空数组
- **Contract**:
  - localStorage 不可用或损坏 → 返回空数组 + 控制台告警
  - 数据格式异常 → 跳过无法解析的记录，返回可解析的记录

### `addTask(input: { title: string; description: string }): Task`

新增任务并立即持久化。

- **Parameters**:
  - `input.title`: 已校验非空、≤100 字符
  - `input.description`: 已校验 ≤500 字符
- **Returns**: 新创建的 `Task`（含生成的 `id` 与 `createdAt`）
- **Throws**: 当 `title` 校验失败时抛 `ValidationError`
- **Contract**:
  - `id` 通过 `crypto.randomUUID()` 生成
  - `createdAt` 通过 `Date.now()` 生成
  - `completed` 默认 `false`
  - 新任务插入到列表顶部（保持 `createdAt` 倒序）
  - 持久化失败（配额超限）→ 抛 `StorageError`，内存态保留以维持界面可用

### `updateTask(id: string, patch: { title: string; description: string }): Task`

更新任务标题与描述，保留 `id`/`createdAt`/`completed`。

- **Parameters**:
  - `id`: 目标任务 id
  - `patch.title` / `patch.description`: 已校验
- **Returns**: 更新后的 `Task`
- **Throws**:
  - `NotFoundError`：id 不存在
  - `ValidationError`：title 校验失败
- **Contract**:
  - 仅修改 `title` 与 `description`
  - 立即持久化

### `toggleTask(id: string): Task`

切换任务完成状态。

- **Parameters**: `id`
- **Returns**: 更新后的 `Task`（`completed` 取反）
- **Throws**: `NotFoundError`
- **Contract**: 立即持久化

### `removeTask(id: string): void`

删除单条任务。

- **Parameters**: `id`
- **Throws**: `NotFoundError`
- **Contract**: 立即持久化

### `batchRemoveTasks(ids: string[]): string[]`

批量删除任务。

- **Parameters**: `ids` 待删除的任务 id 数组
- **Returns**: 实际删除的 id 数组（可能少于输入，若某些 id 已不存在）
- **Throws**: 永不抛出（即使所有 id 都不存在也返回空数组）
- **Contract**: 立即持久化

### `importTasks(tasks: Task[]): { imported: number; skipped: number }`

合并导入任务到本地列表。

- **Parameters**: `tasks` 待导入的任务数组（已通过 `importExport` 模块校验）
- **Returns**:
  - `imported`: 实际新增的任务数（id 不重复的）
  - `skipped`: 因 id 重复跳过的任务数
- **Contract**:
  - id 与本地已有任务重复 → 跳过（保留本地版本）
  - 新 id → 添加到列表
  - 立即持久化
  - 导入后列表重新按 `createdAt` 倒序排列

### `subscribe(listener: () => void): () => void`

订阅跨标签页变更通知。

- **Parameters**: `listener` 回调函数，当其他标签页修改 localStorage 时被调用
- **Returns**: 取消订阅函数
- **Contract**:
  - 内部监听 `window` 的 `storage` 事件
  - 仅当相关键（`todoapp:tasks:v1`、`todoapp:filter:v1`）变更时触发 listener
  - 同一标签页内的修改不触发本事件（浏览器原生行为）
  - 返回的函数调用后移除监听

---

## Module: `importExport.js`

导入导出文件处理。

### `exportTasks(tasks: Task[]): { filename: string; content: string }`

序列化任务为导出文件。

- **Parameters**: `tasks` 全部任务
- **Returns**:
  - `filename`: `todo-backup-YYYYMMDD-HHMMSS.json`
  - `content`: JSON 字符串（Task 数组）
- **Contract**:
  - 即使 `tasks` 为空数组也返回有效 JSON `[]`
  - 时间戳取当前时刻

### `parseImportFile(text: string): { tasks: Task[]; invalid: number }`

解析并校验导入文件内容。

- **Parameters**: `text` 文件文本内容
- **Returns**:
  - `tasks`: 合法的 Task 数组
  - `invalid`: 被跳过的无效记录数
- **Throws**: `ImportFormatError`（当文件非 JSON 或非数组结构时）
- **Contract**（校验规则见 [data-model.md](../data-model.md#import-校验规则)）:
  - 非 JSON 或非数组 → 抛 `ImportFormatError`
  - 元素缺必填字段 → 跳过，`invalid++`
  - 字段超长 → 截断，仍加入 `tasks`
  - `createdAt` 非法 → 替换为当前时间戳，仍加入 `tasks`

### `triggerDownload(filename: string, content: string): void`

触发浏览器文件下载。

- **Parameters**: 文件名与内容
- **Side effects**: 创建临时 `<a>` 元素并点击，调用 `URL.revokeObjectURL`
- **Contract**: 不阻塞调用方

---

## Module: `filterRepository.js`（可选，可并入 storage 直接调用）

筛选状态读写。

### `getFilter(): FilterState`

读取当前筛选状态。

- **Returns**: `"all"` / `"active"` / `"completed"`
- **Contract**: 读取失败或值非法 → 返回 `"all"`

### `setFilter(filter: FilterState): void`

持久化筛选状态。

- **Contract**: 立即写入 `todoapp:filter:v1`

---

## Error Types

```javascript
export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends Error {
  constructor(id) {
    super(`任务不存在: ${id}`);
    this.name = 'NotFoundError';
  }
}

export class StorageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ImportFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ImportFormatError';
  }
}
```

---

## Invariants

- 所有写操作（add/update/toggle/remove/batchRemove/importTasks/setFilter）完成后，localStorage 与下次 `getAllTasks()` 读取结果一致
- 所有写操作在 localStorage 不可用时仍维护内存态一致性，并通过 `StorageError` 或降级提示让上层决定 UI 行为
- 跨标签页同步通过 `subscribe` 通知，listener 内部 SHOULD 调用 `getAllTasks()` 刷新本地状态
