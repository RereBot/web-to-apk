# Web-to-APK Docker Guide

This guide explains how to use Web-to-APK with Docker for easy deployment and development.

## Quick Start

### Using Docker Run

```bash
# Pull and run the latest image
docker run -d \
  --name web-to-apk \
  -p 3000:3000 \
  -v web-to-apk-downloads:/app/web-server/downloads \
  rerebot/web-to-apk:latest

# Access the web interface
open http://localhost:3000
```

### Using Docker Compose

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

## Image Information

- **Base Image**: Ubuntu 22.04
- **Node.js**: 20.x (via nvm)
- **Java**: OpenJDK 17
- **Android SDK**: API 35, Build Tools 34.0.0
- **Image Size**: ~3.3GB
- **Exposed Port**: 3000

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` | Server port |
| `ANDROID_SDK_ROOT` | `/opt/android-sdk` | Android SDK path |
| `ANDROID_HOME` | `/opt/android-sdk` | Android home path |
| `JAVA_HOME` | `/usr/lib/jvm/java-17-openjdk-amd64` | Java home path |

## Volumes

### Recommended Volumes

```bash
docker run -d \
  --name web-to-apk \
  -p 3000:3000 \
  -v web-to-apk-downloads:/app/web-server/downloads \
  -v web-to-apk-uploads:/app/web-server/uploads \
  rerebot/web-to-apk:latest
```

- `/app/web-server/downloads` - Generated APK files
- `/app/web-server/uploads` - Uploaded files (icons, keystores)

## Health Check

The container includes a built-in health check that verifies the web server is responding:

```bash
# Check container health
docker ps

# Manual health check
docker exec web-to-apk /usr/local/bin/healthcheck.sh
```

## Development Mode

For development with live code reloading:

```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up -d

# Or mount source code directly
docker run -d \
  --name web-to-apk-dev \
  -p 3000:3000 \
  -v $(pwd)/web-server:/app/web-server \
  -e NODE_ENV=development \
  rerebot/web-to-apk:latest
```

## Building APKs

### Debug APK

1. Open http://localhost:3000
2. Fill in app details:
   - App Name: `My Test App`
   - Package Name: `com.example.testapp`
   - Website URL: `https://example.com`
3. Click "Build APK"
4. Download the generated APK

### Release APK (Signed)

1. Prepare your keystore file
2. Open http://localhost:3000
3. Fill in app details
4. Check "Create Release Version"
5. Upload keystore file
6. Enter keystore password and key alias
7. Click "Build APK"
8. Download the signed APK

## Performance Tuning

### Resource Limits

```yaml
# docker-compose.yml
services:
  web-to-apk:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'
```

### Build Optimization

- **Concurrent Builds**: The container can handle 2-3 concurrent builds
- **Memory Usage**: Each build uses ~1-2GB RAM
- **Build Time**: Debug APK ~2-3 minutes, Release APK ~3-5 minutes

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs web-to-apk

# Common issues:
# 1. Port 3000 already in use
# 2. Insufficient memory (need 4GB+)
# 3. Docker daemon not running
```

### Build Failures

```bash
# Check container logs during build
docker logs web-to-apk -f

# Common issues:
# 1. Invalid package name format
# 2. Network connectivity issues
# 3. Insufficient disk space
```

### Performance Issues

```bash
# Monitor resource usage
docker stats web-to-apk

# Check available disk space
docker exec web-to-apk df -h

# Clean up old builds
docker exec web-to-apk find /app/web-server/downloads -name "*.apk" -mtime +7 -delete
```

## Security Considerations

### Network Security

```bash
# Bind to localhost only
docker run -d \
  --name web-to-apk \
  -p 127.0.0.1:3000:3000 \
  rerebot/web-to-apk:latest
```

### File Permissions

The container runs as root by default. For production, consider:

```dockerfile
# Create non-root user
RUN useradd -m -u 1000 webtoapk
USER webtoapk
```

### Keystore Security

- Keystore files are automatically deleted after use
- Passwords are not logged or stored
- Use secure networks for release builds

## Advanced Configuration

### Custom Android SDK

```bash
# Mount custom SDK
docker run -d \
  --name web-to-apk \
  -p 3000:3000 \
  -v /path/to/android-sdk:/opt/android-sdk \
  -e ANDROID_SDK_ROOT=/opt/android-sdk \
  rerebot/web-to-apk:latest
```

### Proxy Configuration

```bash
# Set proxy environment variables
docker run -d \
  --name web-to-apk \
  -p 3000:3000 \
  -e HTTP_PROXY=http://proxy.example.com:8080 \
  -e HTTPS_PROXY=http://proxy.example.com:8080 \
  rerebot/web-to-apk:latest
```

## Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/RereBot/web-to-apk/issues)
- **Documentation**: [Full documentation](https://github.com/RereBot/web-to-apk)
- **Docker Hub**: [Official images](https://hub.docker.com/r/rerebot/web-to-apk)

## License

This Docker image and Web-to-APK project are licensed under the MIT License.