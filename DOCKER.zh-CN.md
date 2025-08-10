# Web-to-APK Docker 使用指南

本指南介绍如何使用 Docker 部署和开发 Web-to-APK 工具。

## 快速开始

### 使用 Docker Run

```bash
# 拉取并运行最新镜像
docker run -d \
  --name web-to-apk \
  -p 3000:3000 \
  -v web-to-apk-downloads:/app/web-server/downloads \
  rerebot/web-to-apk:latest

# 访问 Web 界面
open http://localhost:3000
```

### 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 镜像信息

- **基础镜像**: Ubuntu 22.04
- **Node.js**: 20.x (通过 nvm 安装)
- **Java**: OpenJDK 17
- **Android SDK**: API 35, Build Tools 34.0.0
- **镜像大小**: ~3.3GB
- **暴露端口**: 3000

## 环境变量

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `NODE_ENV` | `production` | Node.js 环境 |
| `PORT` | `3000` | 服务器端口 |
| `ANDROID_SDK_ROOT` | `/opt/android-sdk` | Android SDK 路径 |
| `ANDROID_HOME` | `/opt/android-sdk` | Android 主目录路径 |
| `JAVA_HOME` | `/usr/lib/jvm/java-17-openjdk-amd64` | Java 主目录路径 |

## 数据卷

### 推荐的数据卷配置

```bash
docker run -d \
  --name web-to-apk \
  -p 3000:3000 \
  -v web-to-apk-downloads:/app/web-server/downloads \
  -v web-to-apk-uploads:/app/web-server/uploads \
  rerebot/web-to-apk:latest
```

- `/app/web-server/downloads` - 生成的 APK 文件
- `/app/web-server/uploads` - 上传的文件（图标、密钥库）

## 健康检查

容器包含内置的健康检查，用于验证 Web 服务器是否正常响应：

```bash
# 检查容器健康状态
docker ps

# 手动健康检查
docker exec web-to-apk /usr/local/bin/healthcheck.sh
```

## 开发模式

用于开发环境的实时代码重载：

```bash
# 使用开发环境 compose 文件
docker-compose -f docker-compose.dev.yml up -d

# 或直接挂载源代码
docker run -d \
  --name web-to-apk-dev \
  -p 3000:3000 \
  -v $(pwd)/web-server:/app/web-server \
  -e NODE_ENV=development \
  rerebot/web-to-apk:latest
```

## 构建 APK

### 调试版 APK

1. 打开 http://localhost:3000
2. 填写应用详情：
   - 应用名称：`我的测试应用`
   - 包名：`com.example.testapp`
   - 网站 URL：`https://example.com`
3. 点击"构建 APK"
4. 下载生成的 APK

### 发布版 APK（签名）

1. 准备您的密钥库文件
2. 打开 http://localhost:3000
3. 填写应用详情
4. 勾选"创建发布版本"
5. 上传密钥库文件
6. 输入密钥库密码和密钥别名
7. 点击"构建 APK"
8. 下载签名的 APK

## 性能调优

### 资源限制

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

### 构建优化

- **并发构建**：容器可以处理 2-3 个并发构建
- **内存使用**：每个构建使用约 1-2GB 内存
- **构建时间**：调试版 APK 约 2-3 分钟，发布版 APK 约 3-5 分钟

## 故障排除

### 容器无法启动

```bash
# 查看日志
docker logs web-to-apk

# 常见问题：
# 1. 端口 3000 已被占用
# 2. 内存不足（需要 4GB+）
# 3. Docker 守护进程未运行
```

### 构建失败

```bash
# 在构建过程中查看容器日志
docker logs web-to-apk -f

# 常见问题：
# 1. 包名格式无效
# 2. 网络连接问题
# 3. 磁盘空间不足
```

### 性能问题

```bash
# 监控资源使用情况
docker stats web-to-apk

# 检查可用磁盘空间
docker exec web-to-apk df -h

# 清理旧的构建文件
docker exec web-to-apk find /app/web-server/downloads -name "*.apk" -mtime +7 -delete
```

## 安全考虑

### 网络安全

```bash
# 仅绑定到本地主机
docker run -d \
  --name web-to-apk \
  -p 127.0.0.1:3000:3000 \
  rerebot/web-to-apk:latest
```

### 文件权限

容器默认以 root 用户运行。对于生产环境，建议：

```dockerfile
# 创建非 root 用户
RUN useradd -m -u 1000 webtoapk
USER webtoapk
```

### 密钥库安全

- 密钥库文件在使用后会自动删除
- 密码不会被记录或存储
- 发布版构建请使用安全网络

## 高级配置

### 自定义 Android SDK

```bash
# 挂载自定义 SDK
docker run -d \
  --name web-to-apk \
  -p 3000:3000 \
  -v /path/to/android-sdk:/opt/android-sdk \
  -e ANDROID_SDK_ROOT=/opt/android-sdk \
  rerebot/web-to-apk:latest
```

### 代理配置

```bash
# 设置代理环境变量
docker run -d \
  --name web-to-apk \
  -p 3000:3000 \
  -e HTTP_PROXY=http://proxy.example.com:8080 \
  -e HTTPS_PROXY=http://proxy.example.com:8080 \
  rerebot/web-to-apk:latest
```

## 支持

- **GitHub Issues**: [报告错误和功能请求](https://github.com/RereBot/web-to-apk/issues)
- **文档**: [完整文档](https://github.com/RereBot/web-to-apk)
- **Docker Hub**: [官方镜像](https://hub.docker.com/r/rerebot/web-to-apk)

## 许可证

此 Docker 镜像和 Web-to-APK 项目采用 MIT 许可证。