# Tasks: 任务清单应用

**Input**: Design documents from `/specs/001-task-list/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 测试任务已包含（spec 与 plan 均明确要求三层测试覆盖，符合宪章 V"可测试且可维护"）。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- 本项目为纯前端 SPA，采用单项目结构：`src/` + `tests/`

## 用户故事优先级与依赖

| 用户故事 | 优先级 | 标题 | 依赖 |
|---------|--------|------|------|
| US1 | P1 🎯 MVP | 新增与查看任务 + localStorage 持久化 | Foundational |
| US2 | P2 | 完成状态切换 | US1 |
| US3 | P3 | 删除任务（含二次确认） | US1 |
| US4 | P4 | 状态筛选 | US1 |
| US5 | P3 | 编辑任务 | US1 |
| US6 | P4 | 批量删除 | US1, US3（复用 ConfirmDialog） |
| US7 | P4 | 数据导入导出 | US1 |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目初始化与基础结构

- [X] T001 Initialize Vite + React + JavaScript project with package.json, vite.config.js at repo root
- [X] T002 Install dependencies: react, react-dom, tailwindcss, postcss, autoprefixer, vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, @playwright/test, @vitest/coverage-v8
- [X] T003 [P] Configure Tailwind CSS with 5-color palette (primary/success/danger/background/surface/text/muted), Chinese font stack (PingFang SC, Microsoft YaHei), rounded corners, subtle shadow in tailwind.config.js and postcss.config.js
- [X] T004 [P] Configure Vitest with jsdom environment, globals: true, coverage provider v8, alias `@` → `src/` in vite.config.js
- [X] T005 [P] Configure Playwright with baseURL `http://localhost:5173`, webServer pointing to `vite` dev command in playwright.config.js
- [X] T006 [P] Create src/styles/index.css with Tailwind directives (@tailwind base; @tailwind components; @tailwind utilities) and global body styles
- [X] T007 [P] Create index.html at repo root with `<div id="root">` and script tag loading `src/main.jsx`
- [X] T008 [P] Create src/main.jsx rendering `<App />` into `#root` with React 18 createRoot

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有用户故事依赖的核心数据层与类型定义

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Define Task and FilterState JSDoc types in src/types/task.js per data-model.md
- [X] T010 [P] Define storage constants (keys `todoapp:tasks:v1`, `todoapp:filter:v1`, version 1, title max 100, description max 500) in src/constants/storage.js
- [X] T011 [P] Implement id generator using crypto.randomUUID() in src/utils/id.js
- [X] T012 [P] Implement Chinese datetime formatter (YYYY年MM月DD日 HH:MM) in src/utils/datetime.js
- [X] T013 [P] Implement validation utils (validateTitle non-empty ≤100, validateDescription ≤500) in src/utils/validation.js with ValidationError class
- [X] T014 Implement storage abstraction (isStorageAvailable, safeGet, safeSet) in src/services/storage.js per contracts/data-layer.md, never throws
- [X] T015 Implement task repository (getAllTasks, addTask, updateTask, toggleTask, removeTask, batchRemoveTasks, importTasks, subscribe) in src/services/taskRepository.js per contracts/data-layer.md
- [X] T016 Implement filter repository (getFilter, setFilter) in src/services/filterRepository.js using storage.js
- [X] T017 Implement import/export module (exportTasks, parseImportFile, triggerDownload) in src/services/importExport.js per contracts/data-layer.md with ImportFormatError
- [X] T018 Define error types (ValidationError, NotFoundError, StorageError, ImportFormatError) in src/types/errors.js
- [X] T019 Write unit tests for storage.js covering available/unavailable localStorage, JSON parse failure, quota exceeded in tests/unit/storage.test.js
- [X] T020 Write unit tests for taskRepository.js covering all CRUD + subscribe (mock storage events) in tests/unit/taskRepository.test.js
- [X] T021 [P] Write unit tests for validation.js covering empty title, oversize title/description, valid inputs in tests/unit/validation.test.js
- [X] T022 [P] Write unit tests for datetime.js covering Chinese date format output in tests/unit/datetime.test.js
- [X] T023 [P] Write unit tests for importExport.js covering valid file, malformed JSON, missing fields, oversize fields, invalid createdAt, empty-array export in tests/unit/importExport.test.js

**Checkpoint**: Foundation ready - data layer fully tested, user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 新增与查看任务 (Priority: P1) 🎯 MVP

**Goal**: 用户能新增任务（标题+描述）并查看列表，刷新后任务持久化

**Independent Test**: 添加 ≥1 条任务后刷新浏览器，任务依然显示

### Tests for User Story 1

- [X] T024 [P] [US1] Write component test for AddTaskForm covering empty title validation, successful add, description optional, duplicate-title allowed (no uniqueness constraint) in tests/component/AddTaskForm.test.jsx
- [X] T025 [P] [US1] Write component test for TaskList covering empty state ("还没有任务，添加第一条吧"), rendering multiple tasks in tests/component/TaskList.test.jsx
- [X] T026 [P] [US1] Write E2E test for add-view-persist flow (add task, refresh, verify persistence) in tests/e2e/us1-add-view.spec.js

### Implementation for User Story 1

- [X] T027 [P] [US1] Create useTasks hook (tasks state, addTask action calling taskRepository) in src/hooks/useTasks.js
- [X] T028 [P] [US1] Create AddTaskForm component (title input, description input, add button, validation error display) in src/components/AddTaskForm.jsx
- [X] T029 [P] [US1] Create TaskItem component (display title, description, createdAt formatted, completed style) in src/components/TaskItem.jsx
- [X] T030 [P] [US1] Create EmptyState component with Chinese empty message in src/components/EmptyState.jsx
- [X] T031 [US1] Create TaskList component (map tasks to TaskItem, show EmptyState when empty) in src/components/TaskList.jsx
- [X] T032 [US1] Create App.jsx composing AddTaskForm + TaskList, wiring useTasks hook in src/App.jsx

**Checkpoint**: User Story 1 fully functional - can add tasks, persists across refresh

---

## Phase 4: User Story 2 - 完成状态切换 (Priority: P2)

**Goal**: 用户能切换任务完成状态，立即反映在界面并持久化

**Independent Test**: 点击任务完成切换控件，状态变化，刷新后保持

### Tests for User Story 2

- [X] T033 [P] [US2] Write component test for TaskItem toggle interaction (checkbox click, strikethrough style) in tests/component/TaskItem.test.jsx (extend existing file)
- [X] T034 [P] [US2] Write E2E test for toggle-persist flow in tests/e2e/us2-toggle.spec.js

### Implementation for User Story 2

- [X] T035 [US2] Extend useTasks hook with toggleTask action calling taskRepository.toggleTask in src/hooks/useTasks.js
- [X] T036 [US2] Extend TaskItem with checkbox/toggle control, apply strikethrough + muted style when completed in src/components/TaskItem.jsx

**Checkpoint**: User Story 1 + 2 both work independently

---

## Phase 5: User Story 3 - 删除任务 (Priority: P3)

**Goal**: 用户能删除任务，二次确认弹窗，删除后立即持久化

**Independent Test**: 点击删除 → 确认弹窗 → 确认 → 任务消失，刷新后依然消失

### Tests for User Story 3

- [X] T037 [P] [US3] Write component test for ConfirmDialog (message display, confirm callback, cancel callback, Esc key) in tests/component/ConfirmDialog.test.jsx
- [X] T038 [P] [US3] Write E2E test for delete flow (click delete, cancel, click delete again, confirm, verify gone) in tests/e2e/us3-delete.spec.js

### Implementation for User Story 3

- [X] T039 [P] [US3] Create ConfirmDialog component (overlay, message, confirm/cancel buttons, Esc to cancel) in src/components/ConfirmDialog.jsx
- [X] T040 [US3] Extend useTasks with removeTask action in src/hooks/useTasks.js
- [X] T041 [US3] Add delete button + ConfirmDialog wiring to TaskItem in src/components/TaskItem.jsx

**Checkpoint**: User Stories 1, 2, 3 all work independently

---

## Phase 6: User Story 4 - 状态筛选 (Priority: P4)

**Goal**: 用户能在 全部/未完成/已完成 间切换筛选，筛选状态持久化

**Independent Test**: 切换筛选标签，列表按条件过滤，刷新后筛选状态保持

### Tests for User Story 4

- [X] T042 [P] [US4] Write component test for FilterTabs (three tabs, active state, click triggers setFilter) in tests/component/FilterTabs.test.jsx
- [X] T043 [P] [US4] Write E2E test for filter flow (add mixed, switch tabs, refresh persistence, empty state for filtered) in tests/e2e/us4-filter.spec.js

### Implementation for User Story 4

- [X] T044 [P] [US4] Create useFilter hook (filter state, setFilter calling filterRepository) in src/hooks/useFilter.js
- [X] T045 [P] [US4] Create FilterTabs component (全部/未完成/已完成, active style) in src/components/FilterTabs.jsx
- [X] T046 [US4] Extend EmptyState with parameterized message (暂无未完成任务 / 暂无已完成任务) in src/components/EmptyState.jsx
- [X] T047 [US4] Wire FilterTabs + filtered TaskList into App, extend useTasks to expose filtered view in src/App.jsx

**Checkpoint**: User Stories 1-4 all work independently

---

## Phase 7: User Story 5 - 编辑任务 (Priority: P3)

**Goal**: 用户能编辑任务标题与描述，保留 createdAt 与 completed

**Independent Test**: 进入编辑态，修改标题描述，保存，刷新后编辑结果保持

### Tests for User Story 5

- [X] T048 [P] [US5] Write component test for TaskItemEdit (prefill, save with valid, cancel discards, empty title validation) in tests/component/TaskItemEdit.test.jsx
- [X] T049 [P] [US5] Write E2E test for edit flow (edit, save, refresh, verify; cancel discards; empty title blocked) in tests/e2e/us5-edit.spec.js

### Implementation for User Story 5

- [X] T050 [P] [US5] Create TaskItemEdit component (title input, description input, save/cancel buttons, validation) in src/components/TaskItemEdit.jsx
- [X] T051 [US5] Extend useTasks with updateTask action in src/hooks/useTasks.js
- [X] T052 [US5] Add edit button + toggle between TaskItem and TaskItemEdit in src/components/TaskItem.jsx
- [X] T053 [US5] Handle "task deleted in another tab" edge case on save (show "该任务已被删除", exit edit mode) in src/components/TaskItem.jsx

**Checkpoint**: User Stories 1-5 all work independently

---

## Phase 8: User Story 6 - 批量删除 (Priority: P4)

**Goal**: 用户能多选 + 批量删除，含全选/退出多选，二次确认提示数量

**Independent Test**: 进入多选模式，选中 2 条，批量删除确认，2 条消失其余保持

### Tests for User Story 6

- [X] T054 [P] [US6] Write component test for BatchToolbar (enter/exit batch mode, select all/clear, delete selected with count, no-selection guard, concurrent-deletion adjusts confirm count when another tab removes selected tasks) in tests/component/BatchToolbar.test.jsx
- [X] T055 [P] [US6] Write E2E test for batch delete flow (enter batch, select, confirm count, cancel, confirm, exit) in tests/e2e/us6-batch-delete.spec.js

### Implementation for User Story 6

- [X] T056 [P] [US6] Create useSelection hook (selectedIds Set, toggle, selectAll, clear, exit) in src/hooks/useSelection.js
- [X] T057 [P] [US6] Create BatchToolbar component (全选/取消全选, 删除所选, 退出多选 buttons) in src/components/BatchToolbar.jsx
- [X] T058 [US6] Extend useTasks with batchRemoveTasks action in src/hooks/useTasks.js
- [X] T059 [US6] Add "批量操作" entry button to App, conditionally render BatchToolbar + checkboxes in TaskItem, hide AddTaskForm in batch mode in src/App.jsx
- [X] T060 [US6] Wire ConfirmDialog for batch delete with dynamic count message ("确定要删除选中的 N 条任务吗？") in src/App.jsx
- [X] T061 [US6] Support multi-select under filtered view (selectAll only affects visible tasks, hidden selected tasks remain selected) in src/components/TaskList.jsx

**Checkpoint**: User Stories 1-6 all work independently

---

## Phase 9: User Story 7 - 数据导入导出 (Priority: P4)

**Goal**: 用户能导出全部任务为 JSON 文件，导入 JSON 合并到列表（重复 id 跳过）

**Independent Test**: 导出 JSON → 清空 localStorage → 导入 JSON → 任务恢复

### Tests for User Story 7

- [X] T062 [P] [US7] Write component test for SettingsMenu (gear icon, export triggers download, import triggers file picker, result toast) in tests/component/SettingsMenu.test.jsx
- [X] T063 [P] [US7] Write E2E test for export-then-import round-trip (export, clear storage, import, verify restore; malformed file rejected) in tests/e2e/us7-import-export.spec.js

### Implementation for User Story 7

- [X] T064 [P] [US7] Create SettingsMenu component (gear icon button, dropdown with 导出数据/导入数据, hidden file input for import) in src/components/SettingsMenu.jsx
- [X] T065 [US7] Wire export button to importExport.exportTasks + triggerDownload with filename `todo-backup-YYYYMMDD-HHMMSS.json` in src/components/SettingsMenu.jsx
- [X] T066 [US7] Wire import button to file reader → importExport.parseImportFile → taskRepository.importTasks, show result toast "成功导入 N 条，跳过 M 条无效记录" in src/components/SettingsMenu.jsx
- [X] T067 [US7] Handle ImportFormatError with toast "文件格式无效，请选择有效的备份文件" in src/components/SettingsMenu.jsx
- [X] T068 [US7] Add SettingsMenu to App header in src/App.jsx

**Checkpoint**: All 7 user stories functional

---

## Phase 10: Cross-Cutting Concerns — 跨标签页同步

**Purpose**: 实现 FR-012 跨标签页自动同步

- [X] T069 Create useCrossTabSync hook subscribing to taskRepository, calling useTasks refresh on storage events in src/hooks/useCrossTabSync.js
- [X] T070 Wire useCrossTabSync into App in src/App.jsx
- [X] T071 Write E2E test for cross-tab sync (open two pages, add in A, verify appears in B within 1s) in tests/e2e/cross-tab-sync.spec.js

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T072 [P] Add character counter / maxlength enforcement on title (100) and description (500) inputs in AddTaskForm and TaskItemEdit in src/components/AddTaskForm.jsx and src/components/TaskItemEdit.jsx
- [X] T073 [P] Add localStorage quota-exceeded error handling toast "存储空间已满，请删除部分任务后重试" in src/App.jsx
- [X] T074 [P] Add privacy mode detection + console warning + user toast "当前环境无法持久化数据" on startup in src/App.jsx
- [ ] T075 [P] Verify 100% Chinese text coverage across all components (no English placeholders, no untranslated strings) - manual review + snapshot test
- [ ] T076 [P] Run full unit + component + E2E test suite, fix any failing tests
- [ ] T077 [P] Run `npm run build` and verify dist/ output works via `npm run preview`
- [ ] T078 [P] Run quickstart.md validation scenarios 1-10 manually, confirm all pass
- [ ] T079 [P] Verify SC-008 first-paint < 1s using browser DevTools Performance panel
- [ ] T080 [P] Code cleanup: remove console.log debug statements (keep intentional warnings), ensure consistent code style

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1 (Phase 3) is MVP, complete first
  - US2-US7 can proceed in parallel after US1 (or sequentially by priority)
- **Cross-Cutting 同步 (Phase 10)**: Depends on US1 (needs taskRepository.subscribe + useTasks)
- **Polish (Phase 11)**: Depends on all user stories + cross-cutting complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational - No dependencies on other stories
- **US2 (P2)**: Depends on US1 (extends TaskItem + useTasks)
- **US3 (P3)**: Depends on US1 (extends TaskItem + useTasks); creates ConfirmDialog (reused by US6)
- **US4 (P4)**: Depends on US1 (adds FilterTabs to App)
- **US5 (P3)**: Depends on US1 (extends TaskItem + useTasks)
- **US6 (P4)**: Depends on US1 + US3 (reuses ConfirmDialog, extends useTasks with batchRemove)
- **US7 (P4)**: Depends on US1 (uses importExport + taskRepository.importTasks)

### Within Each User Story

- Tests written FIRST, ensure they FAIL before implementation (TDD)
- Hooks before components (hooks define actions, components consume)
- Presentational components (TaskItem, EmptyState) before container components (TaskList)
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T008)
- Foundational unit tests [P] can run in parallel (T021-T023)
- Within each user story, [P] tasks can run in parallel (e.g., component + E2E tests in parallel)
- US2, US3, US4, US5 can all start in parallel after US1 (different files, no conflicts)
- US6 must wait for US3 (ConfirmDialog)
- US7 can run in parallel with US2-US6

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write component test for AddTaskForm in tests/component/AddTaskForm.test.jsx"
Task: "Write component test for TaskList in tests/component/TaskList.test.jsx"
Task: "Write E2E test for add-view-persist flow in tests/e2e/us1-add-view.spec.js"

# Launch all independent components for User Story 1 together:
Task: "Create useTasks hook in src/hooks/useTasks.js"
Task: "Create AddTaskForm component in src/components/AddTaskForm.jsx"
Task: "Create TaskItem component in src/components/TaskItem.jsx"
Task: "Create EmptyState component in src/components/EmptyState.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T023)
3. Complete Phase 3: User Story 1 (T024-T032)
4. **STOP and VALIDATE**: Test User Story 1 independently via quickstart.md Scenario 1
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → MVP!
3. Add US2 → Test independently → Demo
4. Add US3 → Test independently → Demo
5. Add US4 → Test independently → Demo
6. Add US5 → Test independently → Demo
7. Add US6 → Test independently → Demo
8. Add US7 → Test independently → Demo
9. Add Cross-Cutting Sync → Test → Demo
10. Polish pass → Final validation

### Parallel Team Strategy

With multiple developers after Foundational phase:

- Developer A: US2 (toggle) + US4 (filter)
- Developer B: US3 (delete + ConfirmDialog) + US6 (batch, waits for US3)
- Developer C: US5 (edit) + US7 (import/export)
- After all stories: Phase 10 (cross-tab sync) + Phase 11 (polish) together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
