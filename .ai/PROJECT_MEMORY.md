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
- [ ] Step 2：成员管理
- [ ] Step 3：卫生任务管理
- [ ] Step 4：轮换安排
- [ ] Step 5：完成状态与历史
- [ ] Step 6：今日提醒视图

## 后续开发记录

### 2026-10-14

- **完成内容**：初始化项目，创建 .ai/PROJECT_MEMORY.md，git init，搭建 index.html 应用骨架（成员管理 / 任务管理 / 轮换 / 历史 / 今日提醒 五个模块）
- **测试结果**：浏览器打开 index.html 正常，各模块可交互
- **Commit**：docs: initialize project memory / feat: add mvp core modules