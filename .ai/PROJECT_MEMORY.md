# PROJECT_MEMORY

## 项目基本信息

- **项目**：寝室卫生安排与提醒程序
- **路径**：`E:\03-Projects\dorm`
- **定位**：快速交付型全栈 MVP 应用，全寝室共享一份数据
- **技术栈**：原生 HTML/CSS/JS 前端 + Node.js 原生 http 后端（零第三方依赖）
- **持久化**：服务器 `data.json` 文件（原子写 + 单进程串行队列防并发覆盖）

## 双模式架构

前端启动时探测 `/api/state`：

- **服务器模式**：接口返回 401 → 弹出口令框；登录后 `MODE='server'`，所有增删改走 API，改完重新拉全量。**全寝室共享同一份数据。**
- **本地模式**：无后端（双击打开）→ `MODE='local'`，退回 localStorage，功能完全一致

服务器模式下自动隐藏「数据备份」卡（服务端数据本身即备份）。

## 部署（Zeabur）

仓库：`https://github.com/Mxiaocao/dorm`，分支 `master`。Dockerfile 为 `node:22-alpine`，零依赖。

**必须配的环境变量：**

- `PASSCODE` — 寝室口令。**不设就拒绝启动**（防止带弱口令上线）
- `PORT` — 平台自动注入，一般是 8080
- `DATA_DIR` — Dockerfile 已设 `/data`

**必须挂 Volume**：挂到 `/data`，Volume ID 随意如 `data`。不挂的话每次重新部署 `data.json` 会被清空。

部署顺序：**先建服务 → 再挂卷 → 重启**。反了会把卷挂到博客服务上。

## 部署（自建 VPS，已废弃）

原方案（systemd + deploy.sh + Nginx）已删除，改用 Zeabur。`deploy.sh`、`deploy.nginx.conf` 不再存在于仓库。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/login` | 口令校验 |
| GET | `/api/state` | 拉全量 |
| POST | `/api/member` · `/api/member/delete` | 成员增删（重名报错） |
| POST | `/api/task` · `/api/task/delete` | 任务增删（删任务同步清完成记录） |
| POST | `/api/done` | 标记/撤销完成 |
| POST | `/api/rotate` · `/api/rotate/delete` | 排班增删 |
| POST | `/api/rotate/generate` | **把排班写成真实任务**（按 name+date 去重，重复调用返回 0） |
| POST | `/api/reset` | 清空全部 |

除 `/api/login` 外均需请求头 `x-passcode`。

## 开发原则

1. 快速交付 MVP
2. 不做过度工程化
3. 优先解决真实使用问题
4. 功能完成后再优化
5. 避免无意义重构

## 开发流程规范

每完成一个明确功能阶段，必须：自测 → 确认正常 → Git commit。

**Commit 格式**：`type: description`，如 `feat: add task assignment system`、`fix: repair reminder logic`、`docs: update project memory`

禁止：多个阶段堆积后一次 commit；没测试直接提交。

## 当前开发状态

- [x] 项目初始化 + 记忆文档
- [x] 成员 / 任务 / 轮换 / 完成状态 / 今日提醒 五大模块
- [x] 轮换支持「跳过周末」
- [x] 本地模式导出导入备份
- [x] Node 后端 + 口令登录 + 全寝室共享数据
- [x] Zeabur 部署（Dockerfile + package.json + DATA_DIR 支持卷）
- [x] **我的任务**页：选「我是谁」，只显示自己的活 + 未来 7 天
- [x] **排班生成任务**：一键把轮换变成真实任务，进今日任务可标记完成
- [ ] 待定：法定节假日跳过
- [ ] 待定：微信/邮件主动推送提醒（现在只能被动打开页面看）

## 轮换规则说明

- 按成员添加顺序循环分配
- 勾选「跳过周末」后周六日不排班，也不占用轮换序号
- 每条规则生成 60 条排班

## 使用方式

**服务器模式**：`http://服务器IP:8099/`，输入寝室口令，全寝室共享数据。
**本地模式**：双击 `index.html`，数据存本机浏览器。

## 已知限制

- 口令是全寝室共用一个，分不清是谁操作的（不做每人独立账号）
- 轮换一次生成 60 天预排，未处理法定节假日跳过
- 无自动提醒推送，靠「今日任务」页被动查看

## 后续开发记录

### 2026-10-14

- **完成内容**：初始化项目，创建 .ai/PROJECT_MEMORY.md，git init，搭建 index.html 骨架（五个模块）
- **测试结果**：Node mock DOM 跑通核心逻辑；修掉两个 bug（renderWeek 未定义、轮换起始偏移错位）
- **Commit**：docs: initialize project memory / feat: add mvp core modules

### 2026-10-14（续）

- **完成内容**：完成历史页新增导出备份/导入备份/清空数据；轮换新增跳过周末
- **测试结果**：备份含 done 字段、导入还原、空 JSON 被拒、清空归零；跳周末确认无周六日且序号不占用
- **Commit**：feat: add data export/import backup and reset / feat: support skipping weekends in rotation schedule

### 2026-10-14（三）

- **完成内容**：发布为在线静态站点；后改为自建服务器方案，静态链接作废
- **Commit**：docs: record online link

### 2026-10-14（四）— 接入后端，全寝室共享数据

- **修改文件**：server.js（新建）、index.html（双模式改造）、deploy.sh（新建）、deploy.nginx.conf（新建）、.gitignore
- **完成内容**：
  - 后端零依赖 Node http 服务，data.json 原子写 + 串行队列防并发覆盖
  - 口令鉴权：未授权 401，重名/无效任务返回明确中文错误
  - 前端双模式：探测 /api/state 决定走服务器还是 localStorage 兜底
  - 服务器模式隐藏备份卡，操作后重新拉全量保证多端一致
  - systemd 常驻部署脚本 + Nginx 反代示例
- **测试结果**：
  - 鉴权：未授权 401、错误口令拒绝、正确口令通过
  - **抓到严重 bug 并修复**：原串行队列被 reject 污染，导致某次报错后**所有后续请求都返回那条旧错误**（表现为「加成员重名报错」后，加任务、标记完成全部失败）。修复后回归通过。
  - 并发：10 个成员同时写入无丢失
  - 级联：删任务同步清理其完成记录
  - 前端本地模式：无后端时兜底正常，成员/任务/轮换/删除/持久化全通过
- **Commit**：feat: add server backend with shared data and passcode login / feat: add deploy scripts for server and nginx

### 2026-10-14（五）— 我的任务视角 + 安全加固

- **修改文件**：server.js、index.html、.gitignore，删除 deploy.sh / deploy.nginx.conf
- **完成内容**：
  - 新增「我的任务」页（默认首页）：选「我是谁」→ 只显示自己的今日任务 + 未来 7 天，未选人时提示休息
  - 轮换新增「生成未来 60 天任务」按钮，把排班真正写成任务记录，进入今日任务可标记完成；按 name+date 去重，重复生成返回 0 不会翻倍
  - 后端新增 `/api/rotate/generate` 接口，错误分支均有中文提示（无成员 / 排班不存在 / 源任务已删）
  - **安全加固**：删掉 `PASSCODE` 默认弱口令 `dorm2026`，改为不设环境变量则拒绝启动（已验证退出码 1）
- **测试结果**：
  - 前端：生成 59 条（1 源 + 59 排班），重复生成不增加；选对人显示任务+完成按钮，选别人提示休息，标记后状态切「已完成」
  - 后端：generated 59 → 重复 0 → 总数 60；无成员/不存在排班/源任务已删三种错误均正确返回
  - 分配正确性：2 人轮换 10-14→张三、10-15→李四、10-16→张三、10-19（跳周末）→李四
- **Commit**：fix: refuse to start without PASSCODE env var, drop unused VPS scripts / feat: add my-tasks view and generate rotation into real tasks
### 2026-10-14（六）— 上线 Zeabur + 修复登录遮罩

**线上地址**：https://dorm-413.zeabur.app （项目 dorm，服务 dorm，Volume `data` → `/data`）

- **Zeabur 配置**：Variables 设 `PASSCODE`（自定义口令）+ `PORT=${ZEABUR_PORT}`；Networking 点 Generate Domain 拿免费子域
- **踩坑记录**：Zeabur 用 GitHub App 授权，只能看到安装时勾选的仓库。后建的 `dorm` 不在列表，需去 github.com/settings/installations 给 Zeabur App 加权限
- **踩坑记录（重要 bug）**：`.hide{display:none}` 优先级低于内联 `style="display:flex"`，导致**登录遮罩登录成功后永远不消失**，表现为「口令正确但进不去」。修复：`.hide{display:none!important}`。教训：给元素设内联 display 布局后，不能靠普通 class 切换显隐
- **同时加固**：doLogin 改为「验证口令 → 直接拉数据 → 成功才隐藏遮罩」，任何失败都 alert 明确原因，不再静默退回本地模式（原逻辑若 initUI 抛错会被 catch 吞掉，页面看着正常却连着本地数据）；按钮加 loading 态与防重复点击；口令框支持回车提交
- **测试**：真实 DOM mock + 本地 HTTP 服务端到端验证 —— 错误口令被拒且遮罩保留、正确口令 MODE 切 server、遮罩移除、同步提示切换、备份卡隐藏、按钮状态恢复。线上确认修复已部署
- **Commit**：edc71ec fix: login overlay never hides due to inline display beating .hide class
