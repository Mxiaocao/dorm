# PROJECT_MEMORY

## 项目基本信息

- **项目**：寝室卫生安排与提醒程序
- **路径**：`E:\03-Projects\dorm`
- **定位**：快速交付型全栈 / 单机 Web MVP 应用
- **当前技术栈**：原生 HTML + CSS + JavaScript（单页应用），数据存 localStorage，零依赖、零构建

## 开发原则

1. 快速交付 MVP
2. 不做过度工程化
3. 优先解决真实使用问题
4. 功能完成后再优化
5. 避免无意义重构

## 开发流程规范

每完成一个明确功能阶段，必须：

1. 自测功能
2. 确认运行正常
3. Git commit

**Commit 格式**：`type: description`

- `feat: add task assignment system`
- `fix: repair reminder logic`
- `docs: update project memory`

禁止：

- 多个阶段堆积后一次 commit
- 没测试直接提交

## 当前开发状态

- [x] Step 1：项目初始化 + 记忆文档
- [x] Step 2~6：MVP 全部模块（成员 / 任务 / 轮换 / 完成状态 / 今日提醒）
- [x] 数据备份：导出/导入 JSON + 一键清空
- [x] 轮换支持「跳过周末」
- [ ] 待定：按人查看「我今天该干什么」视角

## 在线地址

- 访问链接：https://dorm-hygiene-78406.app.workbuddy.host/
- 纯静态站点（index.html），每次改完代码需重新发布才能生效
- 注意：线上版与本地版数据各自独立（不同浏览器的 localStorage 不互通），多人共用需靠导出/导入备份同步

## 使用方式

双击打开 `index.html` 即可，无需安装、无需联网。
数据存于浏览器 localStorage，换设备或清缓存前请到「完成历史」页底部导出备份。

## 轮换规则说明

- 按成员添加顺序循环分配
- 勾选「跳过周末」后周六日不排班，也不占用轮换序号
- 每条规则生成 60 条排班

## 后续开发记录

### 2026-10-14

- **完成内容**：初始化项目，创建 .ai/PROJECT_MEMORY.md，git init，搭建 index.html 应用骨架（成员管理 / 任务管理 / 轮换 / 历史 / 今日提醒 五个模块）
- **测试结果**：Node 环境 mock DOM 跑通全部核心逻辑（轮换 A→B→C→D 循环、完成/撤销、增删、持久化）；修掉两个 bug（renderWeek 未定义、轮换起始偏移错位）
- **Commit**：docs: initialize project memory / feat: add mvp core modules

### 已知限制

- 数据存 localStorage，换浏览器/清缓存会丢（已有导出备份兜底）
- 轮换一次生成 60 天预排，未处理法定节假日跳过

### 2026-10-14（续）

- **完成内容**：① 完成历史页新增「导出备份文件 / 导入备份 / 清空全部数据」；② 轮换新增「跳过周末」选项
- **修改文件**：index.html
- **测试结果**：备份序列化含 done 字段、导入还原 1 任务 + 1 完成记录、空 JSON 被正确拒绝、清空后三项归零；跳周末排班确认无周六日且序号不占用，不跳周末时 ABCD 严格循环
- **Commit**：feat: add data export/import backup and reset / feat: support skipping weekends in rotation schedule

### 2026-10-14（三）

- **完成内容**：发布为在线静态站点，链接 https://dorm-hygiene-78406.app.workbuddy.host/
- **测试结果**：部署沙箱探活通过（verified=true），可公开访问
- **Commit**：docs: record online link
- **重要限制**：线上是纯静态版，数据仍存各人浏览器本地，多人不互通数据