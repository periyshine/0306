#!/bin/bash

# Fitness Tracker PWA - Startup Script
# This script starts a local web server for testing the PWA

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 健身追踪仪表盘 PWA 启动脚本${NC}\n"

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo -e "${BLUE}📡 使用 Python 3 启动服务器...${NC}"
    echo -e "${YELLOW}💡 在浏览器中打开: http://localhost:8080${NC}"
    echo -e "${YELLOW}⏹️  按 Ctrl+C 停止服务器${NC}\n"
    python3 start-server.py
# Check if python is available ( Python 2 )
elif command -v python &> /dev/null; then
    echo -e "${BLUE}📡 使用 Python 启动服务器...${NC}"
    echo -e "${YELLOW}💡 在浏览器中打开: http://localhost:8080${NC}"
    echo -e "${YELLOW}⏹️  按 Ctrl+C 停止服务器${NC}\n"
    python start-server.py
# Check if php is available
elif command -v php &> /dev/null; then
    echo -e "${BLUE}📡 使用 PHP 启动服务器...${NC}"
    echo -e "${YELLOW}💡 在浏览器中打开: http://localhost:8080${NC}"
    echo -e "${YELLOW}⏹️  按 Ctrl+C 停止服务器${NC}\n"
    php -S localhost:8080
# Check if node is available
elif command -v node &> /dev/null; then
    echo -e "${BLUE}📡 使用 Node.js 启动服务器（需要安装 http-server）...${NC}"
    if command -v npx &> /dev/null; then
        echo -e "${YELLOW}💡 在浏览器中打开: http://localhost:8080${NC}"
        echo -e "${YELLOW}⏹️  按 Ctrl+C 停止服务器${NC}\n"
        npx http-server -p 8080 -c-1
    else
        echo -e "${YELLOW}⚠️  未找到 npx，正在安装 http-server...${NC}"
        npm install -g http-server
        http-server -p 8080 -c-1
    fi
else
    echo -e "${YELLOW}❌ 未找到可用的服务器工具${NC}"
    echo -e "${BLUE}请安装以下之一: Python 3, PHP, 或 Node.js${NC}"
    echo -e "${BLUE}然后重新运行此脚本${NC}\n"
    echo "• Python 3: brew install python3 (macOS) 或 apt install python3 (Linux)"
    echo "• PHP: brew install php (macOS) 或 apt install php (Linux)"
    echo "• Node.js: 访问 https://nodejs.org 下载安装"
fi
