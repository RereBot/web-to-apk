#!/bin/bash

# Web-to-APK Docker Deployment Script
# This script helps deploy Web-to-APK using Docker

set -e

echo "🚀 Web-to-APK Docker Deployment Script"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker environment verified"

# Function to deploy using Docker Compose
deploy_compose() {
    echo "📦 Deploying with Docker Compose..."
    
    if [ -f "docker-compose.yml" ]; then
        # Use docker compose (newer) or docker-compose (legacy)
        if docker compose version &> /dev/null; then
            docker compose up -d
        else
            docker-compose up -d
        fi
        
        echo "✅ Service deployed successfully!"
        echo "🌐 Access the web interface at: http://localhost:3000"
    else
        echo "❌ docker-compose.yml not found in current directory"
        exit 1
    fi
}

# Function to deploy using Docker run
deploy_docker() {
    echo "🐳 Deploying with Docker run..."
    
    # Stop existing container if running
    if docker ps -q -f name=web-to-apk | grep -q .; then
        echo "🛑 Stopping existing container..."
        docker stop web-to-apk
        docker rm web-to-apk
    fi
    
    # Run new container
    docker run -d \
        --name web-to-apk \
        -p 3000:3000 \
        -v web-to-apk-downloads:/app/web-server/downloads \
        -v web-to-apk-uploads:/app/web-server/uploads \
        --restart unless-stopped \
        rerebot/web-to-apk:latest
    
    echo "✅ Container deployed successfully!"
    echo "🌐 Access the web interface at: http://localhost:3000"
}

# Function to check deployment status
check_status() {
    echo "📊 Checking deployment status..."
    
    if docker ps -q -f name=web-to-apk | grep -q .; then
        echo "✅ Container is running"
        docker ps -f name=web-to-apk --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        # Check health
        echo "🏥 Health check..."
        sleep 5
        if curl -s -f http://localhost:3000/ > /dev/null; then
            echo "✅ Service is healthy and responding"
        else
            echo "⚠️  Service may still be starting up"
        fi
    else
        echo "❌ No container found"
    fi
}

# Function to show logs
show_logs() {
    echo "📋 Showing container logs..."
    docker logs web-to-apk --tail 50
}

# Function to stop deployment
stop_deployment() {
    echo "🛑 Stopping deployment..."
    
    if [ -f "docker-compose.yml" ]; then
        if docker compose version &> /dev/null; then
            docker compose down
        else
            docker-compose down
        fi
    else
        docker stop web-to-apk 2>/dev/null || true
        docker rm web-to-apk 2>/dev/null || true
    fi
    
    echo "✅ Deployment stopped"
}

# Main menu
case "${1:-menu}" in
    "compose")
        deploy_compose
        ;;
    "docker")
        deploy_docker
        ;;
    "status")
        check_status
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_deployment
        ;;
    "menu"|*)
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  compose  - Deploy using Docker Compose (recommended)"
        echo "  docker   - Deploy using Docker run"
        echo "  status   - Check deployment status"
        echo "  logs     - Show container logs"
        echo "  stop     - Stop deployment"
        echo ""
        echo "Examples:"
        echo "  $0 compose    # Deploy with Docker Compose"
        echo "  $0 status     # Check if service is running"
        echo "  $0 logs       # View container logs"
        echo "  $0 stop       # Stop the service"
        echo ""
        ;;
esac