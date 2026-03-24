# 开发指南 - 多 Agent 协作指挥中心

## 目录
1. [开发环境设置](#开发环境设置)
2. [项目架构](#项目架构)
3. [核心组件说明](#核心组件说明)
4. [开发流程](#开发流程)
5. [API 开发指南](#api-开发指南)
6. [前端开发指南](#前端开发指南)
7. [测试指南](#测试指南)

---

## 开发环境设置

### 必需工具

- **Python 3.11+**: 推荐使用 pyenv 管理 Python 版本
- **Node.js 16+**: 推荐使用 nvm 管理 Node.js 版本
- **Docker**: 用于本地数据库服务
- **VS Code**: 推荐 IDE

### VS Code 扩展

推荐安装以下扩展：

- Python
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Hero

### 环境配置

1. **Python 环境**

```bash
# 安装 pyenv（如果需要）
brew install pyenv

# 安装 Python 3.11
pyenv install 3.11.5

# 创建虚拟环境
python3.11 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 安装开发依赖
pip install -r requirements-dev.txt  # 如果存在
```

2. **Node.js 环境**

```bash
# 安装 nvm（如果需要）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js
nvm install 18
nvm use 18

# 安装前端依赖
cd frontend
npm install
```

---

## 项目架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     前端层 (React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Agent    │  │ Workflow │  │ Task     │             │
│  │ 管理     │  │ 监控     │  │ 进度     │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket / REST API
┌────────────────────┴────────────────────────────────────┐
│                     后端层 (FastAPI)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Agent    │  │ Workflow │  │ Event    │             │
│  │ Registry │  │ Engine   │  │ Bus      │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                   数据层 (多数据库)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ SQLite/  │  │ Redis    │  │ MongoDB  │             │
│  │PostgreSQL│  │ (缓存)   │  │ (工件)   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

### 目录结构详解

```
multi-agent-command-center/
├── backend/                    # 后端代码
│   ├── agents/                # Agent 实现
│   │   ├── base_agent.py      # Agent 基类
│   │   └── product_thinker.py # 具体 Agent 实现
│   ├── core/                  # 核心引擎
│   │   ├── agent_registry.py  # Agent 注册中心
│   │   ├── event_bus.py       # 事件总线
│   │   ├── state_manager.py   # 状态管理器
│   │   └── workflow_engine.py # 工作流引擎
│   ├── models/                # 数据模型
│   │   ├── __init__.py        # 数据库连接
│   │   └── database.py        # SQLAlchemy 模型
│   ├── api/                   # API 路由
│   │   └── routes.py          # REST API 和 WebSocket
│   ├── config/                # 配置
│   │   └── settings.py        # 应用配置
│   └── main.py               # 应用入口
│
├── frontend/                  # 前端代码
│   ├── src/
│   │   ├── components/        # React 组件
│   │   ├── hooks/             # 自定义 Hooks
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API 服务
│   │   ├── store/             # Zustand 状态管理
│   │   └── App.tsx           # 主应用组件
│   ├── public/                # 静态资源
│   └── vite.config.ts         # Vite 配置
│
└── docs/                      # 文档
    ├── USER_MANUAL.md         # 用户手册
    └── DEVELOPMENT_GUIDE.md   # 开发指南
```

---

## 核心组件说明

### 1. Agent 系统

#### Agent 基类

所有 Agent 都继承自 `BaseAgent`：

```python
from agents.base_agent import BaseAgent

class MyCustomAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="my_custom_agent",
            description="自定义 Agent 描述",
            capabilities=["capability1", "capability2"]
        )
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        # 实现 Agent 逻辑
        result = self._do_something(context)
        return {
            "status": "completed",
            "result": result
        }
```

#### Agent 注册

```python
from core.agent_registry import AgentRegistry

registry = AgentRegistry()
registry.register_agent(MyCustomAgent(), {
    "enabled": True,
    "priority": 1
})
```

### 2. 工作流引擎

#### 定义工作流

```python
from core.workflow_engine import WorkflowDefinition, WorkflowStep

workflow = WorkflowDefinition(
    id="example_workflow",
    name="示例工作流",
    steps=[
        WorkflowStep(
            agent_name="product_thinker",
            requires_confirmation=False
        ),
        WorkflowStep(
            agent_name="strategy_planner",
            requires_confirmation=True
        )
    ]
)
```

#### 执行工作流

```python
from core.workflow_engine import WorkflowEngine, ExecutionContext

engine = WorkflowEngine(agent_registry, state_manager, event_bus)
context = ExecutionContext({"user_idea": "我的想法"})

await engine.execute_workflow(workflow, context)
```

### 3. 事件总线

事件总线使用 Redis Pub/Sub 实现事件驱动：

```python
from core.event_bus import EventBus

event_bus = EventBus()

# 发布事件
await event_bus.publish("agent.completed", {
    "agent_name": "product_thinker",
    "result": result
})

# 订阅事件
await event_bus.subscribe("agent.completed", handle_agent_completed)
```

---

## 开发流程

### 添加新 Agent

1. 创建 Agent 文件

```bash
touch backend/agents/my_agent.py
```

2. 实现 Agent 类

```python
# backend/agents/my_agent.py
from agents.base_agent import BaseAgent

class MyAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="my_agent",
            description="我的 Agent",
            capabilities=["capability1"]
        )
    
    async def execute(self, context):
        # 实现逻辑
        pass
```

3. 注册 Agent

在 `backend/initialize.py` 中添加：

```python
from agents.my_agent import MyAgent

registry.register_agent(MyAgent(), {"enabled": True})
```

### 添加新 API 端点

1. 在 `backend/api/routes.py` 中添加路由：

```python
@router.get("/my-endpoint")
async def my_endpoint():
    return {"message": "Hello"}
```

2. 测试 API

访问 `http://localhost:8000/docs` 使用 Swagger UI 测试。

---

## API 开发指南

### REST API 规范

- 使用名词复数形式：`/agents`, `/workflows`
- 使用 HTTP 方法表示操作：
  - GET: 获取资源
  - POST: 创建资源
  - PUT: 更新资源
  - DELETE: 删除资源

### 响应格式

成功响应：

```json
{
  "status": "success",
  "data": {...}
}
```

错误响应：

```json
{
  "status": "error",
  "message": "错误信息",
  "code": "ERROR_CODE"
}
```

---

## 前端开发指南

### 组件开发

使用函数组件和 Hooks：

```typescript
import React, { useEffect } from 'react';
import { useStore } from '../store';

export const MyComponent: React.FC = () => {
  const agents = useStore((state) => state.agents);
  
  useEffect(() => {
    // 副作用
  }, []);
  
  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
};
```

### 状态管理

使用 Zustand：

```typescript
import { create } from 'zustand';

interface MyState {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyState>((set) => ({
  value: '',
  setValue: (value) => set({ value })
}));
```

### 样式规范

使用 Tailwind CSS：

```typescript
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-semibold text-gray-900">
    标题
  </h2>
</div>
```

---

## 测试指南

### 后端测试

```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_agents.py

# 带覆盖率报告
pytest --cov=backend tests/
```

### 前端测试

```bash
# 运行测试
npm test

# 带覆盖率报告
npm test -- --coverage
```

---

## 调试技巧

### 后端调试

1. 使用日志：

```python
import logging
logger = logging.getLogger(__name__)

logger.debug("调试信息")
logger.info("普通信息")
logger.error("错误信息")
```

2. 使用调试器：

```python
import pdb; pdb.set_trace()
```

### 前端调试

1. 使用浏览器开发工具
2. 使用 React DevTools
3. 使用 console.log：

```typescript
console.log('调试信息', data);
```

---

## 代码规范

### Python 代码规范

- 遵循 PEP 8
- 使用类型注解
- 编写文档字符串

### TypeScript 代码规范

- 使用 ESLint 和 Prettier
- 使用类型注解
- 遵循 React 最佳实践

---

## 性能优化

### 后端优化

- 使用异步 I/O
- 添加数据库索引
- 使用 Redis 缓存

### 前端优化

- 使用 React.memo
- 使用 useMemo 和 useCallback
- 代码分割

---

## 部署指南

详细部署指南请参考 `docs/DEPLOYMENT.md`（待创建）。

---

## 贡献指南

请查看 [CONTRIBUTING.md](../CONTRIBUTING.md) 了解如何贡献代码。

---

## 更新日志

查看 [CHANGELOG.md](../CHANGELOG.md) 了解版本更新历史。