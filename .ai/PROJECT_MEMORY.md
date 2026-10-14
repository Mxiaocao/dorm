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
- [x] Step 2~6：MVP 全部模块（成员 / 任务 / 轮换 / 完成状态 / 今日提醒）已一次性实现
- [ ] 待定：数据导出备份、部署为在线链接

## 后续开发记录

### 2026-10-14

- **完成内容**：初始化项目，创建 .ai/PROJECT_MEMORY.md，git init，搭建 index.html 应用骨架（成员管理 / 任务管理 / 轮换 / 历史 / 今日提醒 五个模块）
- **测试结果**：Node 环境 mock DOM 跑通全部核心逻辑（轮换 A→B→C→D 循环、完成/撤销、增删、持久化）；修掉两个 bug（renderWeek 未定义、轮换起始偏移错位）
- **Commit**：docs: initialize project memory / feat: add mvp core modules

### 已知限制

- 数据存 localStorage，换浏览器/清缓存会丢，未做导出备份
- 轮换一次生成 60 天预排，未处理节假日跳过