@echo off
REM Web-to-APK Docker Deployment Script for Windows
REM This script helps deploy Web-to-APK using Docker on Windows

setlocal enabledelayedexpansion

echo 🚀 Web-to-APK Docker Deployment Script
echo ========================================

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker environment verified

if "%1"=="" goto :menu
if "%1"=="compose" goto :deploy_compose
if "%1"=="docker" goto :deploy_docker
if "%1"=="status" goto :check_status
if "%1"=="logs" goto :show_logs
if "%1"=="stop" goto :stop_deployment
goto :menu

:deploy_compose
echo 📦 Deploying with Docker Compose...
if exist "docker-compose.yml" (
    docker-compose up -d
    echo ✅ Service deployed successfully!
    echo 🌐 Access the web interface at: http://localhost:3000
) else (
    echo ❌ docker-compose.yml not found in current directory
    pause
    exit /b 1
)
goto :end

:deploy_docker
echo 🐳 Deploying with Docker run...

REM Stop existing container if running
for /f "tokens=*" %%i in ('docker ps -q -f name=web-to-apk 2^>nul') do (
    echo 🛑 Stopping existing container...
    docker stop web-to-apk
    docker rm web-to-apk
)

REM Run new container
docker run -d ^
    --name web-to-apk ^
    -p 3000:3000 ^
    -v web-to-apk-downloads:/app/web-server/downloads ^
    -v web-to-apk-uploads:/app/web-server/uploads ^
    --restart unless-stopped ^
    rerebot/web-to-apk:latest

echo ✅ Container deployed successfully!
echo 🌐 Access the web interface at: http://localhost:3000
goto :end

:check_status
echo 📊 Checking deployment status...

for /f "tokens=*" %%i in ('docker ps -q -f name=web-to-apk 2^>nul') do (
    echo ✅ Container is running
    docker ps -f name=web-to-apk --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo 🏥 Health check...
    timeout /t 5 /nobreak >nul
    curl -s -f http://localhost:3000/ >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Service is healthy and responding
    ) else (
        echo ⚠️  Service may still be starting up
    )
    goto :end
)
echo ❌ No container found
goto :end

:show_logs
echo 📋 Showing container logs...
docker logs web-to-apk --tail 50
goto :end

:stop_deployment
echo 🛑 Stopping deployment...

if exist "docker-compose.yml" (
    docker-compose down
) else (
    docker stop web-to-apk 2>nul
    docker rm web-to-apk 2>nul
)

echo ✅ Deployment stopped
goto :end

:menu
echo.
echo Usage: %0 [command]
echo.
echo Commands:
echo   compose  - Deploy using Docker Compose (recommended)
echo   docker   - Deploy using Docker run
echo   status   - Check deployment status
echo   logs     - Show container logs
echo   stop     - Stop deployment
echo.
echo Examples:
echo   %0 compose    # Deploy with Docker Compose
echo   %0 status     # Check if service is running
echo   %0 logs       # View container logs
echo   %0 stop       # Stop the service
echo.
pause

:end
if not "%1"=="" goto :eof
pause