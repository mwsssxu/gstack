#!/bin/bash

# 多 Agent 协作指挥中心 - 一键启动脚本
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

# 日志文件
LOG_FILE="$PROJECT_ROOT/start.log"

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}检查系统依赖...${NC}"
    
    # 检查 Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}错误: 未找到 Python 3，请先安装 Python 3${NC}"
        exit 1
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js${NC}"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: 未找到 npm，请先安装 npm${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 所有依赖检查通过${NC}"
}

# 创建虚拟环境并安装 Python 依赖
setup_python() {
    echo -e "${BLUE}设置 Python 环境...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # 创建虚拟环境（如果不存在）
    if [ ! -d "venv" ]; then
        echo "创建 Python 虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 安装 Python 依赖
    if [ -f "requirements.txt" ]; then
        echo "安装 Python 依赖..."
        pip install -r requirements.txt
    else
        echo -e "${YELLOW}警告: 未找到 requirements.txt 文件${NC}"
    fi
    
    echo -e "${GREEN}✓ Python 环境设置完成${NC}"
}

# 安装前端依赖
setup_frontend() {
    echo -e "${BLUE}设置前端环境...${NC}"
    
    cd "$PROJECT_ROOT/frontend"
    
    # 安装 Node.js 依赖
    if [ -f "package.json" ]; then
        echo "安装前端依赖..."
        npm install
    else
        echo -e "${YELLOW}警告: 未找到 package.json 文件${NC}"
    fi
    
    echo -e "${GREEN}✓ 前端环境设置完成${NC}"
}

# 启动后端服务
start_backend() {
    echo -e "${BLUE}启动后端服务...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        echo "创建 .env 文件..."
        cp .env.example .env
    fi
    
    # 启动后端（后台运行）
    echo "后端服务将在 http://localhost:8000 运行"
    nohup python3 backend/main.py > backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo -e "${GREEN}✓ 后端服务已启动 (PID: $BACKEND_PID)${NC}"
}

# 启动前端服务
start_frontend() {
    echo -e "${BLUE}启动前端服务...${NC}"
    
    cd "$PROJECT_ROOT/frontend"
    
    # 启动前端开发服务器（后台运行）
    echo "前端服务将在 http://localhost:3000 运行"
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    echo -e "${GREEN}✓ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"
}

# 显示服务状态
show_status() {
    echo -e "\n${GREEN}🎉 多 Agent 协作指挥中心已成功启动！${NC}"
    echo -e "\n${BLUE}服务地址:${NC}"
    echo -e "  后端 API: ${YELLOW}http://localhost:8000${NC}"
    echo -e "  前端界面: ${YELLOW}http://localhost:3000${NC}"
    echo -e "\n${BLUE}日志文件:${NC}"
    echo -e "  后端日志: ${PROJECT_ROOT}/backend.log"
    echo -e "  前端日志: ${PROJECT_ROOT}/frontend.log"
    echo -e "  启动日志: ${LOG_FILE}"
    echo -e "\n${BLUE}停止服务:${NC}"
    echo -e "  运行: ${YELLOW}./stop.sh${NC}"
    echo -e "\n${YELLOW}注意: 请确保 Docker 中的 Redis、PostgreSQL 和 MongoDB 服务正在运行${NC}"
}

# 主函数
main() {
    echo -e "${BLUE}🚀 启动多 Agent 协作指挥中心${NC}"
    echo -e "${BLUE}项目路径: ${PROJECT_ROOT}${NC}\n"
    
    # 重定向输出到日志文件
    exec > >(tee -a "$LOG_FILE") 2>&1
    
    check_dependencies
    setup_python
    setup_frontend
    start_backend
    start_frontend
    show_status
    
    # 保存进程ID
    echo $BACKEND_PID > "$PROJECT_ROOT/backend.pid"
    echo $FRONTEND_PID > "$PROJECT_ROOT/frontend.pid"
}

# 处理中断信号
cleanup() {
    echo -e "\n${YELLOW}正在停止服务...${NC}"
    if [ -f "$PROJECT_ROOT/backend.pid" ]; then
        kill $(cat "$PROJECT_ROOT/backend.pid") 2>/dev/null || true
        rm -f "$PROJECT_ROOT/backend.pid"
    fi
    if [ - f"$PROJECT_ROOT/frontend.pid" ]; then
        kill $(cat "$PROJECT_ROOT/frontend.pid") 2>/dev/null || true
        rm -f "$PROJECT_ROOT/frontend.pid"
    fi
    echo -e "${GREEN}服务已停止${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 执行主函数
main "$@"