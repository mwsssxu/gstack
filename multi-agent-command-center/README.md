# 多 Agent 协作指挥中心

一个灵活、可扩展的多 Agent 协作指挥中心，支持动态添加 Agent、可视化工作流状态和任务进度监控。

## 🎯 项目状态

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![Node](https://img.shields.io/badge/node-16+-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

### 开发进度

- ✅ **第一阶段**: 核心引擎 (已完成)
- ✅ **第二阶段**: 可视化界面 (已完成)
- 🚧 **第三阶段**: 高级功能 (开发中)
- 📅 **第四阶段**: 生产就绪 (计划中)

## 功能特性

- **灵活的 Agent 管理**: 支持动态注册和卸载 Agent
- **可视化监控**: 实时展示 Agent 职责、工作流状态和任务进度
- **文档驱动协作**: 所有 Agent 通过持久化文档进行通信
- **人类在环决策**: 关键节点支持用户确认和干预
- **可扩展架构**: 易于添加新功能和集成外部服务

## 快速开始

### 最快启动方式

```bash
# 克隆项目
git clone https://github.com/mwsssxu/gstack.git
cd gstack/multi-agent-command-center

# 一键启动（首次使用）
./start.sh

# 快速启动（环境已配置）
./start-simple.sh
```

访问 `http://localhost:3001` 查看界面。

详细安装指南请查看 [用户手册](docs/USER_MANUAL.md)。

### 服务地址

- **前端界面**: http://localhost:3001
- **后端 API**: http://localhost:8001
- **API 文档**: http://localhost:8001/docs

## 技术栈

### 后端 (Python)
- **Web 框架**: FastAPI (高性能异步)
- **数据库**: SQLite (轻量级) + Redis (缓存/消息队列)
- **LLM 集成**: LangChain + Anthropic/OpenAI SDK
- **浏览器自动化**: Playwright-Python

### 前端 (TypeScript/React)
- **框架**: React + Vite (快速开发)
- **状态管理**: Zustand (轻量级)
- **可视化**: D3.js (工作流图)
- **UI 组件**: Tailwind CSS + Headless UI
- **实时通信**: WebSocket

## 项目结构

```
multi-agent-command-center/
├── backend/                    # 后端服务
│   ├── agents/                # Agent 实现
│   ├── core/                  # 核心引擎
│   ├── services/              # 外部服务
│   ├── models/                # 数据模型
│   ├── api/                   # API 接口
│   ├── config/                # 配置
│   └── main.py               # 入口文件
├── frontend/                  # 前端界面
│   └── src/
├── docs/                      # 文档
├── tests/                     # 测试
├── docker/                    # Docker 配置
├── .env.example               # 环境变量模板
├── requirements.txt           # Python 依赖
├── package.json               # Node.js 依赖
└── README.md                  # 项目说明
```

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/multi-agent-command-center.git
cd multi-agent-command-center
```

### 2. 设置后端
```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的 API 密钥
```

### 3. 设置前端
```bash
cd frontend
npm install
```

### 4. 启动服务
```bash
# 启动后端 (在项目根目录)
python backend/main.py

# 启动前端 (在 frontend 目录)
npm run dev
```

### 5. 访问应用
打开浏览器访问 `http://localhost:3001`

## 资源需求

### 数据库
- **SQLite**: 开发和小型部署
- **PostgreSQL**: 生产环境（支持 JSON 字段），本地Docker: `postgresql://postgres:0okm9ijn@localhost:5432/command_center`
- **MongoDB**: 文档存储，本地Docker: `mongodb://localhost:27017/command_center`
- **Redis**: 缓存和消息队列，本地Docker: 密码 `re2019`，端口 `6379`

### LLM API
- Anthropic Claude API
- OpenAI API

### 存储
- 工件存储: JSON 文档
- 截图存储: 浏览器截图
- 日志存储: 系统日志

## 开发进度

项目按8周计划分阶段开发：

- **Week 1-2**: 核心引擎
- **Week 3-4**: 可视化界面  
- **Week 5-6**: 高级功能
- **Week 7-8**: 生产就绪

详细进度规划请查看 [PROJECT_PLAN.md](PROJECT_PLAN.md)

## 贡献指南

欢迎贡献！请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献流程。

## 许可证

[MIT License](LICENSE)