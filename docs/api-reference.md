# mcp-feedback-enhanced 后端 API 参考文档

> 本文档基于源码分析生成，供前端重构参考。
> 覆盖文件：`web/routes/main_routes.py`、`server.py`、`web/main.py`、`web/models/`

---

## 一、HTTP REST API

### 基础信息
- **框架**: FastAPI + uvicorn
- **默认端口**: 8765（可通过 `MCP_WEB_PORT` 环境变量修改）
- **默认主机**: 127.0.0.1（可通过 `MCP_WEB_HOST` 环境变量修改）

---

### `GET /`
**功能**: 主页 / 反馈页面（HTML）

**响应**:
- 若无活跃会话 → 渲染 `index.html`（等待页面），`has_session: false`
- 若有活跃会话 → 渲染 `feedback.html`（反馈页面）

**模板变量（有会话时）**:
```
project_directory: str   # 项目目录路径
summary: str             # AI 工作摘要（支持 Markdown）
title: str               # "Interactive Feedback - 回饋收集"
version: str             # 版本号
has_session: bool        # true
layout_mode: str         # 从 ui_settings.json 读取，默认 "combined-vertical"
```

---

### `GET /api/translations`
**功能**: 获取多语言翻译数据

**响应** (`Content-Type: application/json`):
```json
{
  "zh-TW": { "key": "value" },
  "zh-CN": { "key": "value" },
  "en":    { "key": "value" }
}
```
从 `web/locales/{lang}/translation.json` 文件加载。

---

### `GET /api/session-status`
**功能**: 获取当前会话状态（简要版）

**请求头** (可选): `Accept-Language`

**响应（无活跃会话）**:
```json
{
  "has_session": false,
  "status": "no_session",
  "messageCode": "session.no_active"
}
```

**响应（有活跃会话）**:
```json
{
  "has_session": true,
  "status": "active",
  "session_info": {
    "project_directory": "string",
    "summary": "string",
    "feedback_completed": false
  }
}
```

---

### `GET /api/current-session`
**功能**: 获取当前会话详细信息

**响应（无会话）**: HTTP 404
```json
{
  "error": "No active session",
  "messageCode": "session.no_active"
}
```

**响应（有会话）**: HTTP 200
```json
{
  "session_id": "uuid-string",
  "project_directory": "string",
  "summary": "string",
  "feedback_completed": false,
  "command_logs": ["string"],
  "images_count": 0
}
```

---

### `GET /api/all-sessions`
**功能**: 获取所有会话的实时状态列表（按创建时间倒序）

**响应**:
```json
{
  "sessions": [
    {
      "session_id": "uuid-string",
      "project_directory": "string",
      "summary": "string",
      "status": "waiting | active | feedback_submitted | completed | error | timeout | expired",
      "status_message": "string",
      "created_at": 1234567890000,
      "last_activity": 1234567890000,
      "feedback_completed": false,
      "has_websocket": true,
      "is_current": true,
      "user_messages": [
        {
          "timestamp": 1234567890000,
          "content": "string",
          "images": [],
          "submission_method": "manual",
          "type": "feedback"
        }
      ]
    }
  ]
}
```

**错误响应**: HTTP 500
```json
{
  "error": "Failed to get sessions: <detail>",
  "messageCode": "sessions.get_failed"
}
```

---

### `POST /api/add-user-message`
**功能**: 向当前会话添加用户消息记录

**请求体** (JSON):
```json
{
  "content": "string",
  "images": [],
  "submission_method": "manual"
}
```

**响应（成功）**:
```json
{
  "status": "success",
  "messageCode": "message.user_recorded"
}
```

**响应（无会话）**: HTTP 404
```json
{
  "error": "No active session",
  "messageCode": "session.no_active"
}
```

**响应（服务器错误）**: HTTP 500
```json
{
  "error": "Failed to add user message: <detail>",
  "messageCode": "message.add_failed"
}
```

---

### `POST /api/save-settings`
**功能**: 保存 UI 设置到 `~/.config/mcp-feedback-enhanced/ui_settings.json`

**请求体** (JSON): 任意 JSON 对象，常见字段：
```json
{
  "layoutMode": "combined-vertical",
  "logLevel": "INFO",
  "enable_base64_detail": false
}
```

**响应（成功）**:
```json
{
  "status": "success",
  "messageCode": "settings.saved"
}
```

**响应（失败）**: HTTP 500
```json
{
  "status": "error",
  "message": "Save failed: <detail>",
  "messageCode": "settings.save_failed"
}
```

---

### `GET /api/load-settings`
**功能**: 从本地文件加载 UI 设置

**响应**: 完整的 settings JSON 对象（文件不存在时返回 `{}`）

**响应（失败）**: HTTP 500
```json
{
  "status": "error",
  "message": "Load failed: <detail>",
  "messageCode": "settings.load_failed"
}
```

---

### `POST /api/clear-settings`
**功能**: 删除本地 UI 设置文件

**响应（成功）**:
```json
{
  "status": "success",
  "messageCode": "settings.cleared"
}
```

**响应（失败）**: HTTP 500
```json
{
  "status": "error",
  "message": "Clear failed: <detail>",
  "messageCode": "settings.clear_failed"
}
```

---

### `GET /api/load-session-history`
**功能**: 从 `~/.config/mcp-feedback-enhanced/session_history.json` 加载会话历史

**响应**:
```json
{
  "sessions": [],
  "lastCleanup": 0
}
```

文件不存在时返回上述空结构。

---

### `POST /api/save-session-history`
**功能**: 保存会话历史记录到本地文件

**请求体** (JSON):
```json
{
  "sessions": [],
  "lastCleanup": 1234567890000
}
```

**响应（成功）**:
```json
{
  "status": "success",
  "messageCode": "session_history.saved",
  "params": { "count": 5 }
}
```

存储的文件格式：
```json
{
  "version": "1.0",
  "sessions": [],
  "lastCleanup": 0,
  "savedAt": 1234567890000
}
```

---

### `GET /api/log-level`
**功能**: 获取当前日志级别设置

**响应**:
```json
{
  "logLevel": "INFO"
}
```
可能的值: `"DEBUG"` | `"INFO"` | `"WARN"` | `"ERROR"`

---

### `POST /api/log-level`
**功能**: 更新日志级别

**请求体** (JSON):
```json
{
  "logLevel": "DEBUG"
}
```
有效值: `"DEBUG"` | `"INFO"` | `"WARN"` | `"ERROR"`

**响应（成功）**:
```json
{
  "status": "success",
  "logLevel": "DEBUG",
  "messageCode": "log_level.updated"
}
```

**响应（无效值）**: HTTP 400
```json
{
  "error": "Invalid log level",
  "messageCode": "log_level.invalid"
}
```

---

## 二、WebSocket 接口

### 连接路径
```
ws://{host}:{port}/ws?lang=zh-TW
```

**Query 参数** (可选):
- `lang` (str): 语言代码，默认 `zh-TW`（由前端实际处理，后端记录但不强制）

**连接前提**: 必须存在活跃会话，否则服务端以 `code=4004, reason="No active session"` 拒绝连接。

**注意**: 每个会话只维护一个 WebSocket 连接；新连接建立时会替换旧连接。

---

### 服务端 → 客户端（推送消息）

#### `connection_established` — 连接建立确认
```json
{
  "type": "connection_established",
  "messageCode": "websocket.connected"
}
```

#### `session_updated` — 新会话创建通知
```json
{
  "type": "session_updated",
  "action": "new_session_created",
  "messageCode": "session.created",
  "session_info": {
    "session_id": "uuid",
    "project_directory": "string",
    "summary": "string",
    "status": "waiting"
  }
}
```

#### `status_update` — 会话状态快照
```json
{
  "type": "status_update",
  "status_info": {
    "status": "waiting | active | feedback_submitted | completed | error | timeout | expired",
    "message": "string",
    "feedback_completed": false,
    "has_websocket": true,
    "created_at": 1234567890.0,
    "last_activity": 1234567890.0,
    "project_directory": "string",
    "summary": "string",
    "session_id": "uuid"
  }
}
```

#### `command_output` — 命令实时输出（流式）
```json
{
  "type": "command_output",
  "output": "string\n"
}
```

#### `command_complete` — 命令执行完成
```json
{
  "type": "command_complete",
  "exit_code": 0
}
```

#### `command_error` — 命令执行错误
```json
{
  "type": "command_error",
  "error": "string"
}
```

#### `notification` — 通用通知（多种场景复用）
```json
{
  "type": "notification",
  "code": "i18n.message.code",
  "severity": "success | warning | error | info",
  "status": "string",   // 可选，反馈提交时附带当前状态
  "reason": "string"    // 可选，cleanup 时附带原因
}
```
常见触发场景：
- 反馈提交成功: `severity=success`
- 超时/过期清理: `severity=warning, reason=timeout|expired|memory_pressure|...`

#### `heartbeat_response` — 心跳响应
```json
{
  "type": "heartbeat_response",
  "timestamp": 1234567890000
}
```
`timestamp` 原样回传客户端发送的值。

#### `ping` — 服务端主动连接检测
```json
{
  "type": "ping",
  "timestamp": 1234567890.0
}
```

---

### 客户端 → 服务端（发送消息）

#### `submit_feedback` — 提交用户反馈（核心）
```json
{
  "type": "submit_feedback",
  "feedback": "string",
  "images": [
    {
      "name": "filename.png",
      "data": "<base64-encoded-string>",
      "size": 102400
    }
  ],
  "settings": {
    "image_size_limit": 1048576,
    "enable_base64_detail": false
  }
}
```
- `images` 可为空数组
- `settings` 可省略
- `image_size_limit`: 字节数，`0` 表示不限制，默认 `1048576`（1MB）
- `enable_base64_detail`: 是否在文本反馈中包含完整 base64 数据

#### `run_command` — 执行命令
```json
{
  "type": "run_command",
  "command": "npm test"
}
```
**安全限制（后端拒绝含以下字符/模式的命令）**:
`;`、`&&`、`||`、`|`、`>`、`<`、`` ` ``、`$(`、`rm -rf`、`del /f`、`format`、`fdisk`

#### `get_status` — 请求会话状态
```json
{
  "type": "get_status"
}
```
服务端响应 `status_update` 消息。

#### `heartbeat` — 心跳保活
```json
{
  "type": "heartbeat",
  "timestamp": 1234567890000
}
```
服务端响应 `heartbeat_response`。

#### `user_timeout` — 用户手动触发超时
```json
{
  "type": "user_timeout"
}
```
触发 `_cleanup_resources_on_timeout()`，清理会话所有资源。

#### `pong` — 响应服务端 ping
```json
{
  "type": "pong",
  "timestamp": 1234567890.0
}
```

#### `update_timeout_settings` — 更新超时配置
```json
{
  "type": "update_timeout_settings",
  "settings": {
    "enabled": true,
    "seconds": 3600
  }
}
```
- `enabled: false` 时停用超时计时器
- `enabled: true` 时启动倒计时，超时后会话自动进入 `TIMEOUT` 状态

---

## 三、MCP Tools

MCP Server 名称: `互動式回饋收集 MCP`

### Tool 1: `interactive_feedback`

**功能**: 核心工具，LLM agent 用于收集用户交互反馈。工具调用会阻塞直到用户提交反馈或超时。

**参数**:

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `project_directory` | `str` | `"."` | 项目目录路径（不存在时自动回退到 `os.getcwd()`） |
| `summary` | `str` | `"我已完成了您請求的任務。"` | AI 工作摘要说明，支持 Markdown |
| `timeout` | `int` | `86400` | 等待用户反馈的超时时间（秒），默认 24 小时 |

**返回值类型**: `list`，混合类型列表

**返回元素**:
- `TextContent(type="text", text=<formatted_string>)`: 格式化的文字反馈
- `MCPImage(data=<bytes>, format="png"|"jpeg"|"gif")`: 用户上传的图片对象

**文字反馈格式示例**:
```
=== 用戶回饋 ===
用户的文字反馈内容

=== 命令執行日誌 ===
命令输出内容

=== 圖片附件概要 ===
用戶提供了 2 張圖片：
  1. screenshot.png (512.0 KB)
     Base64 預覽: iVBORw0KGgo...
     完整 Base64 長度: 699840 字符
```

**错误情况**:
- 用户取消: `[TextContent(text="用戶取消了回饋。")]`
- 异常: `[TextContent(text=<用户友好错误信息>)]`

**工作流程**:
1. 检测运行环境（SSH/WSL/Local）
2. 获取/创建 `WebUIManager` 单例
3. 创建新的 `WebFeedbackSession`（每次调用都创建新会话）
4. 启动 uvicorn 服务器（若未运行）
5. 智能开启浏览器（检测已有活跃标签页则发 `session_updated` 通知，否则开新窗口）
6. 阻塞等待 `feedback_completed` 事件（最长 `timeout-5` 秒）
7. 处理图片（base64 解码 → `MCPImage` 对象）
8. 返回结果列表

---

### Tool 2: `get_system_info`

**功能**: 获取当前系统环境信息，用于诊断和调试。

**参数**: 无

**返回值**: `str`，JSON 格式字符串

**返回结构**:
```json
{
  "平台": "linux | win32 | darwin",
  "Python 版本": "3.11.5",
  "WSL 環境": false,
  "遠端環境": false,
  "介面類型": "Web UI",
  "環境變數": {
    "SSH_CONNECTION": null,
    "SSH_CLIENT": null,
    "DISPLAY": ":0",
    "VSCODE_INJECTION": null,
    "SESSIONNAME": null,
    "WSL_DISTRO_NAME": null,
    "WSL_INTEROP": null,
    "WSLENV": null
  }
}
```

**环境判断逻辑**:
- **WSL**: 检测 `/proc/version` 含 `microsoft/wsl`，或 `WSL_DISTRO_NAME`/`WSL_INTEROP`/`WSLENV` 环境变量，或 `/mnt/c` 路径存在
- **远端环境**: 非 WSL 时，检测 `SSH_*` 环境变量、`/.dockerenv` 文件、Linux 下无 `DISPLAY` 变量等

---

## 四、数据模型

### `FeedbackResult` (TypedDict)
```typescript
{
  command_logs: string;       // 命令执行日志（换行拼接）
  interactive_feedback: string; // 用户文字反馈
  images: ImageDict[];        // 处理后的图片列表
}
```

### `ImageDict` (图片对象)
```typescript
{
  name: string;   // 文件名
  data: bytes;    // 原始字节数据（Python bytes）
  size: number;   // 字节数
}
```

### `SessionStatus` 枚举（单向状态机）
```
WAITING → ACTIVE → FEEDBACK_SUBMITTED → COMPLETED  (正常流程)
任意状态 ─────────────────────────────→ ERROR       (错误终态)
任意状态 ─────────────────────────────→ TIMEOUT     (超时终态)
任意状态 ─────────────────────────────→ EXPIRED     (过期终态)
```

| 状态值 | 说明 |
|--------|------|
| `waiting` | 等待用户操作 |
| `active` | 会话已激活 |
| `feedback_submitted` | 用户已提交反馈，等待下次 MCP 调用 |
| `completed` | 会话已完成（终态） |
| `error` | 错误（终态） |
| `timeout` | 超时（终态） |
| `expired` | 已过期（终态） |

### `CleanupReason` 枚举

| 值 | 说明 |
|----|------|
| `timeout` | 超时清理 |
| `expired` | 过期清理（空闲超过 `max_idle_time`，默认 1800s） |
| `memory_pressure` | 内存压力清理 |
| `manual` | 手动清理 |
| `error` | 错误清理 |
| `shutdown` | 系统关闭清理 |

---

## 五、环境变量配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `MCP_WEB_PORT` | `8765` | Web 服务端口（`0` = 系统自动分配） |
| `MCP_WEB_HOST` | `127.0.0.1` | Web 服务绑定地址 |
| `MCP_DEBUG` | `false` | 启用调试日志（`true`/`1`/`yes`/`on`） |
| `MCP_DESKTOP_MODE` | `false` | 启用桌面应用模式（Tauri），替代浏览器 |
| `MCP_TEST_MODE` | `false` | 测试模式（禁用端口自动清理） |
| `FASTMCP_LOG_LEVEL` | `INFO` | FastMCP 日志级别 |

---

## 六、本地持久化文件

### 配置目录: `~/.config/mcp-feedback-enhanced/`

| 文件名 | 说明 |
|--------|------|
| `ui_settings.json` | UI 设置（布局模式、日志级别、图片设置等） |
| `session_history.json` | 会话历史记录（含版本号 `"1.0"`） |

### 临时缓存目录
`~/.cache/interactive-feedback-mcp-web/` — 用于存储临时反馈结果 JSON 文件

---

## 七、静态资源

- `/static/*` → `web/static/` 目录（CSS、JS、图片等）

---

## 八、会话生命周期管理

### 自动清理策略
- **`auto_cleanup_delay`**: 默认 3600s，创建时启动定时器
- **`max_idle_time`**: 默认 1800s，超出则 `is_expired()` 返回 `true`
- **内存压力清理**: 优先清理 `COMPLETED > EXPIRED > ERROR > TIMEOUT` 状态的会话，每次最多清理 5 个

### 会话唯一性
- 系统只维护**单一活跃会话**（`current_session`）
- 新会话创建时，旧会话进入 `COMPLETED` 状态
- WebSocket 连接在新旧会话之间转移（不断开）

### 图片大小限制
- 默认每张图片最大 **1MB**（`MAX_IMAGE_SIZE = 1 * 1024 * 1024`）
- 可通过 `submit_feedback` 的 `settings.image_size_limit` 覆盖（`0` = 不限制）
- 支持格式: `image/png`, `image/jpeg`, `image/jpg`, `image/gif`, `image/bmp`, `image/webp`
