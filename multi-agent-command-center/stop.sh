#!/bin/bash

# 多 Agent 协作指挥中心 - 停止脚本
# 支持 macOS 和 Linux 系统

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}⏹️  停止多 Agent 协作指挥中心${NC}"

# 停止后端服务
if [ -f "$PROJECT_ROOT/backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_ROOT/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        wait $BACKEND_PID 2>/dev/null || true
    fi
    rm -f "$PROJECT_ROOT/backend.pid"
    echo -e "${GREEN}✓ 后端服务已停止${NC}"
else
    echo -e "${YELLOW}⚠️  后端服务未运行${NC}"
fi

# 停止前端服务
if [ -f "$PROJECT_ROOT/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_ROOT/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        wait $FRONTEND_PID 2>/dev/null || true
    fi
    rm -f "$PROJECT_ROOT/frontend.pid"
    echo -e "${GREEN}✓ 前端服务已停止${NC}"
else
    echo -e "${YELLOW}⚠️  前端服务未运行${NC}"
fi

echo -e "\n${GREEN}✅ 所有服务已停止${NC}"