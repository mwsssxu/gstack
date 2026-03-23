@echo off
REM 多 Agent 协作指挥中心 - 一键启动脚本 (Windows)

setlocal

REM 设置颜色输出函数
:colorEcho
set "str=%~2"
for /f "delims=0123456789" %%i in ("%str%") do (
    echo %str%
    goto :eof
)
if "%~1"=="0" (color 0f) & echo %str% & color
if "%~1"=="1" (color 09) & echo %str% & color
if "%~1"=="2" (color 0a) & echo %str% & color
if "%~1"=="3" (color 0b) & echo %str% & color
if "%~1"=="4" (color 0c) & echo %str% & color
if "%~1"=="5" (color 0d) & echo %str% & color
if "%~1"=="6" (color 0e) & echo %str% & color
if "%~1"=="7" (color 08) & echo %str% & color
goto :eof

call :colorEcho 6 "🚀 启动多 Agent 协作指挥中心"

REM 获取项目根目录
set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

REM 检查依赖
call :colorEcho 3 "检查系统依赖..."
where python >nul 2>&1
if %errorlevel% neq 0 (
    call :colorEcho 4 "错误: 未找到 Python，请先安装 Python"
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    call :colorEcho 4 "错误: 未找到 Node.js，请先安装 Node.js"
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    call :colorEcho 4 "错误: 未找到 npm，请先安装 npm"
    pause
    exit /b 1
)

call :colorEcho 2 "✓ 所有依赖检查通过"

REM 设置 Python 环境
call :colorEcho 3 "设置 Python 环境..."
cd /d "%PROJECT_ROOT%"

REM 创建虚拟环境（如果不存在）
if not exist "venv" (
    echo 创建 Python 虚拟环境...
    python -m venv venv
)

REM 安装 Python 依赖
if exist "requirements.txt" (
    echo 安装 Python 依赖...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call :colorEcho 6 "警告: 未找到 requirements.txt 文件"
)

call :colorEcho 2 "✓ Python 环境设置完成"

REM 设置前端环境
call :colorEcho 3 "设置前端环境..."
cd /d "%PROJECT_ROOT%\frontend"

if exist "package.json" (
    echo 安装前端依赖...
    npm install
) else (
    call :colorEcho 6 "警告: 未找到 package.json 文件"
)

call :colorEcho 2 "✓ 前端环境设置完成"

REM 启动后端服务
call :colorEcho 3 "启动后端服务..."
cd /d "%PROJECT_ROOT%"
call venv\Scripts\activate.bat

REM 检查 .env 文件
if not exist ".env" (
    echo 创建 .env 文件...
    copy .env.example .env
)

echo 后端服务将在 http://localhost:8000 运行
start /min cmd /c "python backend/main.py > backend.log 2>&1"
call :colorEcho 2 "✓ 后端服务已启动"

REM 启动前端服务
call :colorEcho 3 "启动前端服务..."
cd /d "%PROJECT_ROOT%\frontend"
echo 前端服务将在 http://localhost:3000 运行
start /min cmd /c "npm run dev > frontend.log 2>&1"
call :colorEcho 2 "✓ 前端服务已启动"

REM 显示服务状态
echo.
call :colorEcho 2 "🎉 多 Agent 协作指挥中心已成功启动！"
echo.
echo 服务地址:
echo   后端 API: http://localhost:8000
echo   前端界面: http://localhost:3000
echo.
echo 日志文件:
echo   后端日志: %PROJECT_ROOT%\backend.log
echo   前端日志: %PROJECT_ROOT%\frontend.log
echo.
echo 停止服务:
echo   运行: stop.bat
echo.
call :colorEcho 6 "注意: 请确保 Docker 中的 Redis、PostgreSQL 和 MongoDB 服务正在运行"

pause