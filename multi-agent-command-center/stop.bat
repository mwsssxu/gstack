@echo off
REM 多 Agent 协作指挥中心 - 停止脚本 (Windows)

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

call :colorEcho 3 "⏹️  停止多 Agent 协作指挥中心"

REM 获取项目根目录
set "PROJECT_ROOT=%~dp0"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

REM 查找并终止 Python 进程
echo 查找后端服务进程...
tasklist /fi "imagename eq python.exe" | findstr /i "python" >nul
if %errorlevel% equ 0 (
    echo 终止后端服务...
    taskkill /f /im python.exe >nul 2>&1
    call :colorEcho 2 "✓ 后端服务已停止"
) else (
    call :colorEcho 6 "⚠️  后端服务未运行"
)

REM 查找并终止 Node.js 进程
echo 查找前端服务进程...
tasklist /fi "imagename eq node.exe" | findstr /i "node" >nul
if %errorlevel% equ 0 (
    echo 终止前端服务...
    taskkill /f /im node.exe >nul 2>&1
    call :colorEcho 2 "✓ 前端服务已停止"
) else (
    call :colorEcho 6 "⚠️  前端服务未运行"
)

echo.
call :colorEcho 2 "✅ 所有服务已停止"

pause