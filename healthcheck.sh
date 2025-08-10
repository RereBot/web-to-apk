#!/bin/bash

# Web-to-APK Health Check Script

# Check if the web server is responding
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check passed - HTTP $HTTP_STATUS"
    exit 0
else
    echo "❌ Health check failed - HTTP $HTTP_STATUS"
    exit 1
fi