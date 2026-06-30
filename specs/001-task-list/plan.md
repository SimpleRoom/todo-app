# Implementation Plan: 任务清单应用

**Branch**: `001-task-list` | **Date**: 2026-06-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-task-list/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

构建一个纯前端任务清单 SPA，支持任务的新增、编辑、删除、完成状态切换、状态筛选、批量删除、数据导入导出，以及跨标签页自动同步。所有数据通过 localStorage 持久化，无后端依赖。技术栈采用 React 18 + JavaScript（ES2020+） + Vite + Tailwind CSS + Vitest + Playwright，遵循宪章五项原则（简洁优先、中文体验优先、纯前端架构、数据可靠、可测试且可维护）。数据层抽象为独立模块以解耦视图与存储，并通过浏览器 `storage` 事件实现跨标签页同步。类型安全通过 JSDoc 注释 + 运行时校验 + 单元测试守护，不使用 TypeScript。

## Technical Context

**Language/Version**: JavaScript（ES2020+，通过 Vite 转译）+ React 18

**Primary Dependencies**:
- `react` / `react-dom` 18.x — UI 渲染
- `vite` 5.x — 构建与开发服务器
- `tailwindcss` 3.x — 样式（清新简洁风格，5 色主色调）
- `vitest` 1.x — 单元测试
- `@playwright/test` 1.x — 端到端测试
- `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` — 组件测试
- `@vitest/coverage-v8` — 覆盖率

**Type Safety**: 纯 JavaScript（无 TypeScript 编译步骤）；通过 JSDoc 类型注解提供 IDE 提示，运行时校验守护数据完整性，单元测试覆盖核心逻辑

**Storage**: 浏览器 localStorage（唯一持久化存储），键名 `todoapp:tasks:v1`（任务）与 `todoapp:filter:v1`（筛选状态）；带版本号字段以便未来迁移

**Testing**:
- 单元测试：Vitest（数据层、工具函数、状态逻辑）
- 组件测试：Vitest + Testing Library（React 组件交互）
- 端到端测试：Playwright（用户故事全流程，含跨标签页同步）

**Target Platform**: 现代浏览器（Chrome、Edge、Safari、Firefox 最近 2 年版本），不支持 IE

**Project Type**: 单页应用（SPA），静态托管，无服务端

**Performance Goals**:
- 首屏可交互 < 1 秒（SC-008）
- 任务列表操作（增删改切换）< 100ms 响应
- 跨标签页同步延迟 < 1 秒（SC-009）

**Constraints**:
- 纯前端，无后端调用（宪章 III）
- localStorage 单配额 5MB，任务数预期 ≤ 数百条
- 离线可用，隐私模式降级（SC-007）
- 100% 简体中文界面（宪章 II）

**Scale/Scope**: 单用户单设备，7 个用户故事，1 个主界面 + 编辑态 + 多选模式 + 设置入口

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 检查项 | 状态 | 说明 |
|------|--------|------|------|
| I. 简洁优先 | 单一目的、最小步骤、渐进披露 | ✅ 通过 | 批量操作通过"可选模式"避免主界面复杂度；编辑态为就地渐进披露；不引入分类/标签/拖拽 |
| II. 中文体验优先 | 默认简体中文、中文日期格式 | ✅ 通过 | 所有文案使用简体中文；日期格式 `YYYY年MM月DD日 HH:MM`；无英文残留 |
| III. 纯前端架构 | localStorage 持久化、抽象数据层、版本迁移 | ✅ 通过 | 数据层独立模块 `src/services/storage.ts`；键名带 `:v1` 版本；隐私模式降级 |
| IV. 数据可靠 | 立即持久化、二次确认、并发安全 | ✅ 通过 | 所有变更立即写入；删除/批量删除二次确认；storage 事件跨标签页同步；导入导出兜底 |
| V. 可测试且可维护 | 数据层与视图层分离、独立可测试 | ✅ 通过 | 数据层、状态层、视图层三层分离；数据层可 mock；每个模块独立单元测试 |

**结论**: 全部原则通过，无违规需在 Complexity Tracking 中论证。

## Project Structure

### Documentation (this feature)

```text
specs/001-task-list/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── data-layer.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
.
├── index.html
├── package.json
├── vite.config.js
├── vitest.config.js
├── tailwind.config.js
├── postcss.config.js
├── playwright.config.js
├── src/
│   ├── main.jsx                  # 应用入口
│   ├── App.jsx                   # 根组件，组合各区域
│   ├── types/
│   │   ├── task.js               # Task / FilterState 的 JSDoc 类型定义
│   │   └── errors.js             # 错误类（ValidationError 等）
│   ├── constants/
│   │   └── storage.js            # localStorage 键名、版本号、字符上限常量
│   ├── services/
│   │   ├── storage.js            # 数据层：localStorage 读写 + 版本迁移 + 异常降级
│   │   ├── taskRepository.js     # 任务仓储：CRUD + 跨标签页同步订阅
│   │   └── importExport.js       # 导入导出：JSON 序列化、文件下载、合并校验
│   ├── hooks/
│   │   ├── useTasks.js           # 任务列表状态 + actions（add/update/toggle/remove/batchRemove）
│   │   ├── useFilter.js          # 筛选状态 + setFilter
│   │   ├── useSelection.js       # 多选选中态 + selectAll/clear/exit
│   │   └── useCrossTabSync.js    # 订阅 storage 事件并刷新本地状态
│   ├── components/
│   │   ├── AddTaskForm.jsx       # 新增区域：标题/描述输入 + 添加按钮
│   │   ├── TaskItem.jsx          # 单条任务行（含完成切换、编辑、删除按钮）
│   │   ├── TaskItemEdit.jsx      # 编辑态行（标题/描述输入 + 保存/取消）
│   │   ├── TaskList.jsx          # 任务列表容器（含空状态）
│   │   ├── FilterTabs.jsx        # 全部/未完成/已完成 三标签
│   │   ├── BatchToolbar.jsx      # 多选模式工具栏（全选/删除所选/退出）
│   │   ├── ConfirmDialog.jsx     # 通用二次确认弹窗
│   │   ├── SettingsMenu.jsx      # 设置入口（齿轮图标，导入/导出）
│   │   └── EmptyState.jsx        # 空状态提示
│   ├── utils/
│   │   ├── id.js                 # 唯一 id 生成
│   │   ├── datetime.js           # 中文日期格式化
│   │   └── validation.js         # 标题/描述校验（非空、字符上限）
│   └── styles/
│       └── index.css             # Tailwind 入口 + 全局变量
├── tests/
│   ├── setup.js
│   ├── unit/
│   │   ├── storage.test.js
│   │   ├── taskRepository.test.js
│   │   ├── importExport.test.js
│   │   ├── validation.test.js
│   │   └── datetime.test.js
│   ├── component/
│   │   ├── AddTaskForm.test.jsx
│   │   ├── TaskItem.test.jsx
│   │   ├── TaskItemEdit.test.jsx
│   │   ├── TaskList.test.jsx
│   │   ├── FilterTabs.test.jsx
│   │   ├── BatchToolbar.test.jsx
│   │   ├── ConfirmDialog.test.jsx
│   │   └── SettingsMenu.test.jsx
│   └── e2e/
│       ├── us1-add-view.spec.js
│       ├── us2-toggle.spec.js
│       ├── us3-delete.spec.js
│       ├── us4-filter.spec.js
│       ├── us5-edit.spec.js
│       ├── us6-batch-delete.spec.js
│       ├── us7-import-export.spec.js
│       └── cross-tab-sync.spec.js
└── .github/
    └── copilot-instructions.md   # 代理上下文（含 SPECKIT 标记）
```

**Structure Decision**: 采用单项目结构（Option 1 演化版），无后端目录。三层职责分离：
- `src/services/` 数据层：localStorage 抽象、仓储、导入导出，独立可测试
- `src/hooks/` 状态层：React hooks 封装业务状态与 actions，连接数据层与视图层
- `src/components/` 视图层：纯展示组件，通过 props 接收状态与回调

## Complexity Tracking

> 无违规，本表留空。
