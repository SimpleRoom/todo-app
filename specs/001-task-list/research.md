# Phase 0 Research: 任务清单应用

**Date**: 2026-06-29
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

本文件记录 Phase 0 研究阶段的关键技术决策，每条决策包含：选择、理由、备选方案。

---

## R1: 任务 ID 生成策略

**Decision**: 使用 `crypto.randomUUID()` 生成 UUID v4 字符串。

**Rationale**:
- 浏览器原生 API，无需依赖，零成本（宪章 I 简洁优先）
- 全局唯一性保证，跨标签页生成不冲突（宪章 IV 数据可靠）
- 与导入导出 JSON 自然兼容（字符串字段）
- 现代浏览器全部支持（Chrome 92+、Edge 92+、Firefox 95+、Safari 15.4+，均在我们支持的"最近 2 年版本"范围内）

**Alternatives considered**:
- `Date.now() + Math.random()`：可读性好但理论上有极小概率冲突，且多标签页同时操作可能撞 ID
- `nanoid` 库：功能等价但引入额外依赖，违反宪章 I"依赖精简"原则
- 递增整数：需要额外的计数器持久化，且导入合并时易冲突

---

## R2: 跨标签页同步策略

**Decision**: 监听 `window.addEventListener('storage', handler)` 事件，事件触发时重新从 localStorage 读取任务列表与筛选状态并替换本地 React state。

**Rationale**:
- `storage` 事件是浏览器原生跨标签页通信机制，仅在**其他**标签页修改 localStorage 时触发（不在当前标签页触发），天然适合"订阅"模式
- 全量替换而非增量合并：百条量级任务下性能无忧，避免复杂的 diff/merge 逻辑（宪章 I 简洁优先）
- 与 React state 配合简单：在 hook 中 `setState(newState)` 即可触发重渲染

**Alternatives considered**:
- `BroadcastChannel` API：功能等价但浏览器兼容性略差（Safari 15.4+ 才支持），且 `storage` 事件已足够
- `CustomEvent` + `localStorage` 写入标记：复杂且不可靠
- 轮询 `localStorage`：性能浪费，违反性能目标

**Edge cases handled**:
- 同一标签页的修改不触发 `storage` 事件 → 由 React state 自身更新流程覆盖
- 多标签页几乎同时修改不同任务 → 后写入者整体覆盖前写入者，但因操作粒度小（单条 CRUD），实际丢失概率极低；spec 已在 Edge Cases 中明确"后写入者覆盖"语义
- 编辑态下另一标签页删除任务 → 在保存时校验任务是否仍存在（FR-019 + Edge Case）

---

## R3: localStorage 数据结构与版本迁移

**Decision**: 采用带版本号的封装格式，单一 JSON 字符串存储任务数组。

```typescript
// localStorage key: "todoapp:tasks:v1"
// value 结构：
{
  "version": 1,
  "tasks": [
    { "id": "uuid", "title": "...", "description": "", "completed": false, "createdAt": 1719650000000 }
  ]
}

// localStorage key: "todoapp:filter:v1"
// value 结构：
"all"  // 直接存储枚举字符串
```

**Rationale**:
- 外层 `{ version, tasks }` 包装为未来 schema 变更提供迁移入口（宪章 III"数据结构升级 MUST 通过版本号字段管理"）
- 任务以数组而非对象 map 存储：序列化体积更小，遍历渲染更直接；按 `createdAt` 倒序排列后存储，读取即用
- `createdAt` 使用毫秒时间戳（数字），便于排序与跨时区一致；展示层再格式化为中文日期
- 筛选状态直接存字符串：单值无需包装

**Migration strategy**:
- 读取时检查 `version` 字段；缺失视为版本 1，尝试解析为 `{ tasks: [...] }`
- 解析失败（数据损坏）→ 返回空数组 + 控制台告警（FR-010 容错降级）
- 未来版本升级时，在 `storage.ts` 中添加 `migrate(from, to)` 函数链式调用

**Alternatives considered**:
- IndexedDB：功能更强但对百条量级数据是过度工程，且 API 复杂（宪章 I）
- 每条任务独立 key：写入放大，跨标签页同步事件爆炸
- 不带版本号直接存数组：无法未来迁移，违反宪章 III

---

## R4: 隐私模式与配额异常降级

**Decision**: 在 `storage.ts` 中封装 `safeGet` / `safeSet`，捕获所有异常并返回降级结果。

```typescript
// 伪代码
function isStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
```

**Rationale**:
- Safari 隐私模式下 `setItem` 抛 `QuotaExceededError`，需在写入时 try/catch
- 启动时探测一次可用性，不可用则切换为内存态（Map），界面正常使用，仅刷新后丢失
- 配额超限时（写入失败）向用户提示"存储空间已满，请删除部分任务后重试"，操作不静默失败（FR 配额超限 Edge Case）

**Alternatives considered**:
- 启动时拒绝运行：用户体验差，违反宪章 IV"零容忍数据丢失"的精神（虽然隐私模式本质就会丢失，但不应阻塞使用）
- 静默忽略错误：违反"不静默失败"原则

---

## R5: 二次确认弹窗实现

**Decision**: 实现通用 `<ConfirmDialog>` 组件，通过 props 接收 `message`、`onConfirm`、`onCancel`，由调用方控制显示。

**Rationale**:
- 单条删除与批量删除复用同一组件（宪章 I 简洁优先，避免重复）
- 弹窗使用固定定位 + 半透明遮罩，符合清新简洁风格
- 通过键盘 Esc 关闭等同点击"取消"，符合无障碍最佳实践
- 不引入第三方 Modal 库（如 Headless UI），保持依赖精简

**Alternatives considered**:
- `window.confirm()`：原生弹窗样式不可控，与中文清新风格冲突，且无法自定义文案中的动态数量（"选中 N 条"）
- 第三方 Dialog 库：过度工程

---

## R6: 文件下载与上传

**Decision**:
- 下载：创建 `<a>` 元素，`href = URL.createObjectURL(jsonBlob)`，`download = filename`，触发点击后 `revokeObjectURL`
- 上传：`<input type="file" accept=".json">`，通过 `FileReader.readAsText` 读取并 `JSON.parse`

**Rationale**:
- 均为浏览器原生 API，零依赖
- 文件名格式 `todo-backup-YYYYMMDD-HHMMSS.json` 便于按时间排序备份文件
- `URL.revokeObjectURL` 防止内存泄漏

**Alternatives considered**:
- File System Access API（`showSaveFilePicker`）：更现代但浏览器支持不全（Safari 不支持），违反"现代浏览器全覆盖"目标
- 第三方 file-saver 库：功能等价但增加依赖

---

## R7: Tailwind 清新简洁风格配置

**Decision**: 5 色主色调，浅色背景，圆角 + 轻微阴影，字体使用系统默认中文字体栈。

```javascript
// tailwind.config.js 关键配置
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',      // 主色：蓝
        primaryHover: '#2563eb',
        success: '#10b981',      // 完成态：绿
        danger: '#ef4444',       // 删除：红
        background: '#f9fafb',   // 背景：浅灰白
        surface: '#ffffff',      // 卡片：白
        text: '#1f2937',         // 主文本：深灰
        muted: '#6b7280',        // 次要文本：中灰
      },
      borderRadius: { DEFAULT: '8px' },
      boxShadow: { subtle: '0 1px 3px rgba(0,0,0,0.05)' },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"',
               '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
}
```

**Rationale**:
- 5 色主调符合宪章 I"配色 MUST 限制在 5 种主色以内"
- 浅色背景 + 白色卡片 + 轻微阴影 = 清新简洁视觉
- 系统字体栈在 macOS（PingFang SC）与 Windows（Microsoft YaHei）下均有原生中文支持，无字体加载延迟（SC-008 首屏 < 1 秒）

**Alternatives considered**:
- CSS Modules：可行但失去 Tailwind 的原子化效率与一致性
- styled-components：运行时开销，违反首屏性能目标
- 引入 UI 库（如 Ant Design、Arco）：违反宪章 I"禁止引入重型 UI 框架"

---

## R8: React 状态管理策略

**Decision**: 使用自定义 hooks（`useTasks`、`useFilter`、`useSelection`）+ React Context 在 `App` 层提供，不引入 Redux/Zustand 等状态库。

**Rationale**:
- 应用状态简单：任务列表、筛选、选中态三块，无需状态库
- 自定义 hook + Context 完全满足需求，且保持依赖精简（宪章 I）
- 数据层（`taskRepository`）与状态层（hooks）解耦，便于单元测试 mock（宪章 V）

**Alternatives considered**:
- Redux Toolkit：对单视图应用过度工程
- Zustand：轻量但仍属额外依赖，无明确收益
- 直接在组件中调 localStorage：违反宪章 V"数据层与视图层解耦"

---

## R9: 测试策略

**Decision**: 三层测试金字塔。

| 层级 | 工具 | 覆盖目标 |
|------|------|---------|
| 单元 | Vitest | `services/*`、`utils/*` 全覆盖；`hooks/*` 通过 `@testing-library/react-hooks` 或 `renderHook` |
| 组件 | Vitest + Testing Library | 所有 `components/*` 的交互与渲染，含空状态、错误提示 |
| 端到端 | Playwright | 7 个用户故事各 1 个 spec 文件 + 跨标签页同步 spec |

**Rationale**:
- 数据层 100% 单元覆盖是宪章 V 的硬性要求
- 组件测试覆盖交互逻辑与中文文案断言
- E2E 覆盖用户故事验收场景，跨标签页 spec 通过 `context.newPage()` 模拟多标签
- 由于使用纯 JavaScript（非 TypeScript），测试同时承担类型回归守护职责（运行时类型断言）

**Alternatives considered**:
- 仅 E2E：反馈慢，定位问题困难
- 仅单元：无法验证用户真实流程
- Jest：与 Vite 集成不如 Vitest 原生

---

## R10: Vite 配置要点

**Decision**:
- 开发：`vite` 默认端口 5173，HMR 开启
- 构建：`vite build` 输出至 `dist/`，基路径 `./` 便于静态托管
- 测试：`vitest` 配置 `environment: 'jsdom'`，globals: true
- 别名：`@` → `src/`

**Rationale**:
- 基路径 `./` 让产物可直接通过 `index.html` 打开或托管在任意子路径
- `@` 别名简化导入路径

---

## 总结

所有 NEEDS CLARIFICATION 项已在 Phase 0 前置的 Technical Context 中明确，无遗留。本阶段 10 项决策均基于宪章五项原则与 spec 需求，可直接进入 Phase 1 设计。
