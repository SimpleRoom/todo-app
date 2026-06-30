<!--
  Sync Impact Report
  ===================
  Version change: 1.0.0 → 1.1.0
  Modified principles: 无（原则本身未变）
  Modified sections:
    - 技术约束（React + TypeScript → React + JavaScript）
  Added sections: 无
  Removed sections: 无
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ compatible (无 TS 引用)
    - .specify/templates/spec-template.md ✅ compatible
    - .specify/templates/tasks-template.md ✅ compatible
    - .specify/templates/checklist-template.md ✅ compatible
  Follow-up TODOs: 无
  Bump rationale: MINOR — 技术栈约束细化（移除 TypeScript，改用纯 JavaScript + JSDoc），属于" materially expanded guidance"，不构成原则性颠覆。原"可测试且可维护"原则通过运行时检查 + 单元测试覆盖 + JSDoc 类型提示守护。
-->

# TodoApp Constitution

## Core Principles

### I. 简洁优先 (Simplicity First)

界面与功能 MUST 保持清新简洁。每个功能 MUST 有明确且单一的目的，禁止添加无直接用户价值的装饰或复杂性。

- 每个界面元素 MUST 服务于用户的核心任务流程
- 交互步骤 MUST 最小化，能用一步完成绝不用两步
- 默认视图 MUST 只展示当前最需要的信息，详情通过渐进披露呈现
- 新功能提案 MUST 附带简化方案论证，证明无法用更少步骤实现

### II. 中文体验优先 (Chinese-First UX)

所有用户可见文本 MUST 以中文为首要语言。界面 MUST 从中文用户视角设计，而非从英文翻译而来。

- 默认语言 MUST 为简体中文
- 所有标签、提示、错误信息 MUST 使用自然、准确的中文表述
- 日期、时间 MUST 使用中文习惯格式（YYYY年MM月DD日、HH:MM）
- 排序与筛选 MUST 支持中文拼音排序
- 英文界面 MUST 作为可切换选项而非默认，且 MUST 通过完整国际化流程提供

### III. 纯前端架构 (Pure Frontend Architecture)

系统 MUST 为纯前端单页应用，数据 MUST 通过浏览器 localStorage 持久化，不依赖任何后端服务。

- 所有数据 MUST 通过 localStorage 同步持久化，刷新页面后状态 MUST 完整恢复
- localStorage 读写 MUST 抽象为独立的数据层模块，业务逻辑 MUST 不直接调用 localStorage API
- MUST 处理 localStorage 配额超限、序列化失败、隐私模式禁用等异常情况
- 数据结构升级 MUST 通过版本号字段管理，MUST 提供向前兼容的迁移逻辑
- 未来若引入后端或云同步 MUST 作为可选增强层，不得破坏本地优先的工作流

### IV. 数据可靠 (Data Reliability)

用户任务数据 MUST 持久且可靠，零容忍数据丢失。

- 所有任务状态变更 MUST 立即同步至 localStorage
- 删除操作 MUST 要求明确确认，且 MUST 提供撤销窗口
- 写入操作 MUST 通过统一的数据层入口，禁止组件直接修改存储
- MUST 提供数据导出（JSON）与导入能力，用户不被锁定
- 关键操作 MUST 在控制台输出可追溯的日志（开发模式）

### V. 可测试且可维护 (Testable & Maintainable)

代码 MUST 易于测试与维护，以支撑简洁原则下的长期迭代。

- 核心业务逻辑 MUST 与界面渲染分离，数据层 MUST 与视图层解耦
- 每个功能模块 MUST 独立可测试，localStorage 数据层 MUST 可被 mock
- 公共组件与数据层 API MUST 有单元测试覆盖
- 重构 MUST 在测试保护下进行，禁止无测试的大规模改动
- 项目使用纯 JavaScript（非 TypeScript）；类型安全通过 JSDoc 注释 + 运行时校验 + 单元测试共同守护。新增模块 MUST 附带 JSDoc 类型注解以便 IDE 提示与维护可读性

## 技术约束

- **前端框架**: React + JavaScript（ES2020+），组件库 MUST 保持轻量，禁止引入重型 UI 框架
- **样式**: Tailwind CSS 或 CSS Modules，视觉 MUST 保持清新统一，配色 MUST 限制在 5 种主色以内
- **数据层**: localStorage 作为唯一持久化存储，MUST 封装为独立模块并支持版本迁移
- **构建**: Vite，开发体验 MUST 流畅，热更新 MUST 秒级生效
- **测试**: Vitest（单元）+ Playwright（端到端），核心逻辑与数据层 MUST 有单元测试覆盖
- **依赖**: 生产依赖 MUST 精简，新增依赖 MUST 论证必要性
- **类型安全**: 通过 JSDoc + 运行时校验 + 单元测试守护，不引入 TypeScript 编译步骤

## 开发流程

- 所有变更 MUST 通过 PR 提交，PR MUST 关联具体用户故事
- PR MUST 包含：变更说明、测试覆盖说明、界面截图（如涉及 UI）
- 合并前 MUST 通过：lint、类型检查、测试
- 功能 MUST 按用户故事优先级（P1 → P2 → P3）递增交付
- 每个用户故事 MUST 可独立测试与部署
- 涉及 localStorage 数据结构变更 MUST 提供迁移脚本与回滚方案

## Governance

本宪章高于所有其他开发惯例与个人偏好。任何偏离 MUST 在 PR 中明确标注理由并获得批准。

修订流程：提出修订 → 记录变更内容与理由 → 获得项目维护者批准 → 更新版本号 → 同步检查所有依赖模板与文档。

所有 PR 与代码审查 MUST 验证是否符合本宪章原则。复杂性与偏离 MUST 提供明确论证。

**Version**: 1.1.0 | **Ratified**: 2026-06-29 | **Last Amended**: 2026-06-30
