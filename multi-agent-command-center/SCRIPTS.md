# 一键启动脚本使用说明

## 脚本列表

### macOS/Linux 系统

- **`start.sh`**: 完整版启动脚本（包含依赖安装）
- **`start-simple.sh`**: 简化版启动脚本（假设环境已配置）
- **`stop.sh`**: 停止所有服务

### Windows 系统

- **`start.bat`**: 启动脚本
- **`stop.bat`**: 停止脚本

## 使用方法

### 首次使用（推荐）

```bash
# macOS/Linux
chmod +x start.sh stop.sh
./start.sh

# Windows
双击 start.bat
```

### 环境已配置（快速启动）

```bash
# macOS/Linux
chmod +x start-simple.sh stop.sh
./start-simple.sh

# Windows  
双击 start.bat
```

### 停止服务

```bash
# macOS/Linux
./stop.sh

# Windows
双击 stop.bat
```

## 系统要求

### 通用要求
- Python 3.8+
- Node.js 16+
- npm
- Docker（用于 Redis、PostgreSQL、MongoDB）

### 数据库服务
确保以下 Docker 服务正在运行：
- **Redis**: 密码 `re2019`，端口 `6379`
- **PostgreSQL**: 密码 `0okm9ijn`，端口 `5432`
- **MongoDB**: 端口 `27017`

## 服务地址

- **后端 API**: `http://localhost:8000`
- **前端界面**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:8000/api/ws`

## 日志文件

- **后端日志**: `backend.log`
- **前端日志**: `frontend.log`
- **启动日志**: `start.log`

## 故障排除

### 依赖安装失败
如果 `start.sh` 在安装 Python 依赖时失败，请手动创建虚拟环境：

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows
pip install -r requirements.txt
cd frontend
npm install
```

然后使用 `start-simple.sh` 启动服务。

### 数据库连接问题
确保 Docker 中的数据库服务正在运行：

```bash
# 检查容器状态
docker ps

# 如果需要启动数据库
docker-compose up -d redis postgres mongodb
```

### 端口冲突
如果端口 8000 或 3000 被占用，可以修改配置：

- **后端端口**: 修改 `.env` 文件中的 `PORT` 变量
- **前端端口**: 修改 `frontend/vite.config.ts` 中的 `server.port`

## 注意事项

1. 脚本会自动创建 `.env` 文件（如果不存在）
2. 所有服务都在后台运行，可以通过日志文件查看输出
3. 使用 `Ctrl+C` 或运行 `stop.sh`/`stop.bat` 来停止服务
4. 前端开发服务器支持热重载，修改代码后会自动刷新