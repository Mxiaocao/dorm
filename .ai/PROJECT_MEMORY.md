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

## 部署

```
目录：/var/www/dorm     端口：8099     服务名：dorm（systemd）
```

- 上传代码 → `bash deploy.sh`（装 Node、建 systemd、放行端口）
- 口令用环境变量 `PASSCODE` 配置，默认 `dorm2026`，**上线前必须改**
- 改口令：编辑 `/etc/systemd/system/dorm.service` 的 `PASSCODE`，再 `systemctl daemon-reload && systemctl restart dorm`
- 有域名可再套 `deploy.nginx.conf` + certbot 上 https

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/login` | 口令校验 |
| GET | `/api/state` | 拉全量 |
| POST | `/api/member` · `/api/member/delete` | 成员增删（重名报错） |
| POST | `/api/task` · `/api/task/delete` | 任务增删（删任务同步清完成记录） |
| POST | `/api/done` | 标记/撤销完成 |
| POST | `/api/rotate` · `/api/rotate/delete` | 排班增删 |
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
- [x] systemd 部署脚本 + Nginx 示例
- [ ] 待定：按人查看「我今天该干什么」视角
- [ ] 待定：法定节假日跳过

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