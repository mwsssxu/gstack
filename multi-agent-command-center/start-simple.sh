#!/bin/bash

# 多 Agent 协作指挥中心 - 简化启动脚本
# 假设环境已经配置完成

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🚀 启动多 Agent 协作指挥中心 (简化版)${NC}"
echo -e "${BLUE}项目路径: ${PROJECT_ROOT}${NC}\n"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo -e "${RED}错误: 未找到 Python 虚拟环境，请先运行完整版启动脚本或手动创建${NC}"
    exit 1
fi

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}错误: 未找到前端依赖，请先运行 'cd frontend && npm install'${NC}"
    exit 1
fi

# 检查服务是否正在运行
check_services() {
    BACKEND_RUNNING=false
    FRONTEND_RUNNING=false
    
    if lsof -i :8000 -t > /dev/null 2>&1; then
        BACKEND_RUNNING=true
    fi
    
    if lsof -i :3000 -t > /dev/null 2>&1; then
        FRONTEND_RUNNING=true
    fi
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}正在停止现有服务...${NC}"
    
    if [ -f "$PROJECT_ROOT/backend.pid" ]; then
        BACKEND_PID=$(cat "$PROJECT_ROOT/backend.pid")
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID 2>/dev/null || true
            sleep 1
        fi
        rm -f "$PROJECT_ROOT/backend.pid"
    fi
    
    if [ -f "$PROJECT_ROOT/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$PROJECT_ROOT/frontend.pid")
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID 2>/dev/null || true
            sleep 1
        fi
        rm -f "$PROJECT_ROOT/frontend.pid"
    fi
    
    # 确保端口被释放
    lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 1
    
    echo -e "${GREEN}✓ 现有服务已停止${NC}"
}

# 检查服务状态
check_services

if [ "$BACKEND_RUNNING" = true ] || [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${YELLOW}检测到服务正在运行${NC}"
    stop_services
    echo -e "${BLUE}正在重新启动服务...${NC}\n"
fi

# 启动后端服务
echo -e "${BLUE}启动后端服务...${NC}"
cd "$PROJECT_ROOT"
source venv/bin/activate
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已创建 .env 文件，请根据需要修改配置"
fi
nohup python3 backend/main.py > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ 后端服务已启动 (PID: $BACKEND_PID)${NC}"

# 启动前端服务
echo -e "${BLUE}启动前端服务...${NC}"
cd "$PROJECT_ROOT/frontend"
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"

# 显示服务状态
echo -e "\n${GREEN}🎉 多 Agent 协作指挥中心已成功启动！${NC}"
echo -e "\n${BLUE}服务地址:${NC}"
echo -e "  后端 API: ${YELLOW}http://localhost:8000${NC}"
echo -e "  前端界面: ${YELLOW}http://localhost:3000${NC}"
echo -e "\n${BLUE}日志文件:${NC}"
echo -e "  后端日志: ${PROJECT_ROOT}/backend.log"
echo -e "  前端日志: ${PROJECT_ROOT}/frontend.log"
echo -e "\n${BLUE}停止服务:${NC}"
echo -e "  运行: ${YELLOW}./stop.sh${NC}"
echo -e "\n${YELLOW}注意: 请确保 Docker 中的 Redis、PostgreSQL 和 MongoDB 服务正在运行${NC}"

# 保存进程ID
echo $BACKEND_PID > "$PROJECT_ROOT/backend.pid"
echo $FRONTEND_PID > "$PROJECT_ROOT/frontend.pid"