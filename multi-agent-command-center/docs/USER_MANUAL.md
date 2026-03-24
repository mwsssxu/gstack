# 多 Agent 协作指挥中心用户手册

## 目录
1. [快速开始](#快速开始)
2. [系统要求](#系统要求)
3. [安装指南](#安装指南)
4. [启动服务](#启动服务)
5. [使用指南](#使用指南)
6. [常见问题](#常见问题)

---

## 快速开始

### 最快启动方式

如果您已经配置好环境，只需运行：

```bash
cd multi-agent-command-center
./start-simple.sh
```

然后访问 `http://localhost:3000` 即可使用。

---

## 系统要求

### 必需软件

| 软件 | 版本要求 | 用途 |
|------|---------|------|
| Python | 3.11+ | 后端运行环境 |
| Node.js | 16+ | 前端运行环境 |
| npm | 7+ | 前端包管理 |
| Git | 2.0+ | 版本控制 |

### 推荐软件

| 软件 | 用途 |
|------|------|
| Docker | 运行数据库服务（Redis、PostgreSQL、MongoDB） |
| VS Code | 开发和调试 |

### 数据库服务（可选）

- **Redis**: 用于缓存和消息队列
  - 端口：6379
  - 密码：re2019

- **PostgreSQL**: 用于结构化数据存储
  - 端口：5432
  - 密码：0okm9ijn

- **MongoDB**: 用于文档存储
  - 端口：27017

---

## 安装指南

### 1. 克隆项目

```bash
git clone https://github.com/mwsssxu/gstack.git
cd gstack/multi-agent-command-center
```

### 2. 后端环境设置

#### macOS/Linux

```bash
# 创建虚拟环境
python3.11 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

#### Windows

```cmd
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

### 3. 前端环境设置

```bash
cd frontend
npm install
```

### 4. 配置文件

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
# LLM API 密钥（至少配置一个）
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 启动服务

### 方式一：一键启动脚本（推荐）

#### macOS/Linux

```bash
# 首次使用（包含环境配置）
./start.sh

# 快速启动（环境已配置）
./start-simple.sh
```

#### Windows

```cmd
start.bat
```

### 方式二：手动启动

#### 启动后端

```bash
cd multi-agent-command-center
source venv/bin/activate  # Windows: venv\Scripts\activate
python backend/main.py
```

后端将在 `http://localhost:8000` 运行。

#### 启动前端

```bash
cd multi-agent-command-center/frontend
npm run dev
```

前端将在 `http://localhost:3000` 运行。

### 停止服务

#### macOS/Linux

```bash
./stop.sh
```

#### Windows

```cmd
stop.bat
```

---

## 使用指南

### 访问界面

1. **前端界面**: `http://localhost:3000`
   - 主仪表板
   - Agent 管理
   - 工作流监控
   - 任务进度

2. **后端 API 文档**: `http://localhost:8000/docs`
   - Swagger UI 交互式文档
   - API 测试界面

3. **健康检查**: `http://localhost:8000/api/agents`
   - 检查后端服务状态

### 主要功能

#### 1. Agent 管理

- 查看 Agent 列表
- 查看每个 Agent 的状态和能力
- 实时监控 Agent 执行状态

#### 2. 工作流监控

- 可视化工作流状态
- 查看当前执行步骤
- 监控工作流进度

#### 3. 任务进度

- 实时任务进度更新
- 任务执行时间线
- 任务状态追踪

#### 4. 实时通信

- WebSocket 实时数据更新
- 状态变化即时通知

---

## 常见问题

### Q1: Python 版本不兼容

**问题**: 使用 Python 3.13 时依赖安装失败

**解决方案**: 使用 Python 3.11 或 3.12

```bash
# 安装 Python 3.11
brew install python@3.11

# 使用 Python 3.11 创建虚拟环境
python3.11 -m venv venv
```

### Q2: Rust 编译错误

**问题**: pydantic-core 编译失败

**解决方案**: 升级 Rust 到最新版本

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### Q3: 后端服务无法启动

**问题**: 端口被占用

**解决方案**: 检查端口占用并释放

```bash
# 检查 8000 端口
lsof -i :8000

# 终止占用进程
kill -9 <PID>
```

### Q4: 前端无法连接后端

**问题**: 前端显示连接错误

**解决方案**: 

1. 确认后端正在运行
2. 检查 Vite 代理配置
3. 查看浏览器控制台错误信息

### Q5: 数据库连接失败

**问题**: PostgreSQL 连接错误

**解决方案**: 

默认使用 SQLite，无需额外配置。如需使用 PostgreSQL：

1. 确保 PostgreSQL 服务运行
2. 创建数据库
3. 修改 `.env` 中的数据库 URL

---

## 日志文件

- **后端日志**: `multi-agent-command-center/backend.log`
- **前端日志**: `multi-agent-command-center/frontend.log`
- **启动日志**: `multi-agent-command-center/start.log`

---

## 获取帮助

- **GitHub Issues**: https://github.com/mwsssxu/gstack/issues
- **项目文档**: 查看 `PROJECT_PLAN.md` 和 `README.md`
- **API 文档**: http://localhost:8000/docs

---

## 版本信息

- **当前版本**: 0.1.0
- **更新日期**: 2026-03-24
- **开发状态**: 核心功能已完成，持续开发中