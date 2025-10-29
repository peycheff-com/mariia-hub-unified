#!/bin/sh

# Health check script for the application
# This script checks if the application is responding correctly

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check if the application responds to HTTP requests
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)

if [ "$response" != "200" ]; then
    echo "Health check failed with status code: $response"
    exit 1
fi

# Check if critical files exist
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    echo "index.html not found"
    exit 1
fi

# Check disk space (less than 90% usage)
disk_usage=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 90 ]; then
    echo "Disk usage too high: ${disk_usage}%"
    exit 1
fi

# Check memory usage
mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$mem_usage" -gt 90 ]; then
    echo "Memory usage too high: ${mem_usage}%"
    exit 1
fi

echo "Health check passed"
exit 0