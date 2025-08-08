# Web-to-APK 服务器部署指南

本指南介绍如何在 Linux 服务器上部署 Web-to-APK 工具及其 Web 界面。

> **💡 快速开始提示**: 如果您只是想快速测试或开发，可以直接使用 `node web-server/server.js` 启动服务。本指南主要针对生产环境的高级部署配置。

## 概述

Web-to-APK 工具提供完整的 Web 界面，允许用户：
- 通过 Web 表单将 Web 应用转换为 Android APK 文件
- 上传自定义应用图标或自动获取网站图标
- 直接下载生成的 APK 文件
- 实时监控构建进度

## 服务器环境要求

### 系统要求

- **操作系统**: Ubuntu 22.04 LTS 或 CentOS 8+ (推荐 Ubuntu)
- **内存**: 最少 4GB RAM (推荐 8GB+)
- **存储**: 最少 20GB 可用空间 (推荐 50GB+)
- **网络**: 稳定的互联网连接

### 必需软件

- **Node.js**: 版本 20.x (推荐)
- **Java JDK**: 版本 17 或更高
- **Android SDK**: API Level 24 或更高
- **PM2**: 进程管理器
- **Nginx**: 反向代理服务器 (可选但推荐)

## 环境准备

### 1. 更新系统

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. 安装 Node.js 20 (使用 nvm)

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装并使用 Node.js 20
nvm install 20
nvm use 20

# 设置默认版本
nvm alias default 20

# 验证安装
node --version
npm --version
```

### 3. 安装 Java 17

```bash
# Ubuntu/Debian
sudo apt install openjdk-17-jdk -y

# CentOS/RHEL
sudo yum install java-17-openjdk-devel -y

# 设置 JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' | sudo tee -a /etc/environment
echo 'export PATH=$PATH:$JAVA_HOME/bin' | sudo tee -a /etc/environment
source /etc/environment

# 验证安装
java -version
```

### 4. 安装 Android SDK

```bash
# 使用当前用户或创建项目目录
mkdir -p ~/projects
cd ~/projects

# 创建 Android SDK 目录
mkdir -p ~/android-sdk/cmdline-tools

# 下载 Android 命令行工具
cd /tmp
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mv cmdline-tools ~/android-sdk/cmdline-tools/latest

# 设置环境变量
echo 'export ANDROID_SDK_ROOT=$HOME/android-sdk' >> ~/.bashrc
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools' >> ~/.bashrc
source ~/.bashrc

# 接受许可证并安装必要组件
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;34.0.0"

# 验证安装
sdkmanager --list | grep "build-tools\|platforms"
```

### 5. 安装 PM2

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 设置 PM2 开机自启
sudo pm2 startup
sudo pm2 save

# 验证安装
pm2 --version
```

## 部署步骤

### 1. 克隆项目

```bash
# 克隆项目到项目目录
cd ~/projects
git clone https://github.com/RereBot/web-to-apk.git
cd web-to-apk
```

### 2. 安装项目依赖

```bash
# 安装根目录依赖
npm install --production

# 安装 web-server 依赖
cd web-server
npm install --production
cd ..
```

### 3. 构建项目

```bash
# 构建 TypeScript 项目
npm run build

# 验证构建结果
ls -la lib/
```

### 4. 配置环境变量

```bash
# 创建生产环境配置
cat > .env << EOF
NODE_ENV=production
PORT=3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
ANDROID_SDK_ROOT=$HOME/android-sdk
ANDROID_HOME=$HOME/android-sdk
JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
EOF
```

### 5. 创建数据目录

```bash
# 创建必要的数据目录
mkdir -p web-server/{uploads,downloads,temp}

# 设置适当的权限
chmod 755 web-server/{uploads,downloads,temp}
```

### 6. 使用 PM2 启动服务

```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'web-to-apk',
    script: 'web-server/server.js',
    cwd: process.env.HOME + '/projects/web-to-apk',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      ANDROID_SDK_ROOT: process.env.HOME + '/android-sdk',
      ANDROID_HOME: process.env.HOME + '/android-sdk',
      JAVA_HOME: '/usr/lib/jvm/java-17-openjdk-amd64'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=4096'
  }]
};
EOF

# 创建日志目录
mkdir -p logs

# 启动服务
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 查看服务状态
pm2 status
pm2 logs web-to-apk
```

## Nginx 反向代理配置 (推荐)

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 配置 Nginx

```bash
# 创建站点配置文件
sudo tee /etc/nginx/sites-available/web-to-apk << EOF
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    
    client_max_body_size 10M;
    
    # 主应用代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 下载文件特殊处理
    location /downloads/ {
        proxy_pass http://localhost:3000;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/web-to-apk /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 3. SSL/HTTPS 配置

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## 配置管理

### 环境变量

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `NODE_ENV` | `development` | 环境模式 |
| `PORT` | `3000` | 服务器端口 |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 限流时间窗口 (15分钟) |
| `RATE_LIMIT_MAX_REQUESTS` | `10` | 每个时间窗口最大请求数 |
| `MAX_FILE_SIZE` | `5242880` | 最大上传文件大小 (5MB) |
| `ALLOWED_FILE_TYPES` | `image/jpeg,image/png,image/gif,image/webp` | 允许的文件类型 |
| `ANDROID_SDK_ROOT` | - | Android SDK 根目录 |
| `ANDROID_HOME` | - | Android SDK 主目录 |
| `JAVA_HOME` | - | Java JDK 安装目录 |

### PM2 配置优化

```javascript
// ecosystem.config.js 高级配置
module.exports = {
  apps: [{
    name: 'web-to-apk',
    script: 'web-server/server.js',
    cwd: '/home/webapk/web-to-apk',
    instances: 'max',  // 使用所有 CPU 核心
    exec_mode: 'cluster',  // 集群模式
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      RATE_LIMIT_MAX_REQUESTS: 50
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=4096',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'web-server/uploads', 'web-server/downloads'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

## 监控和维护

### 服务健康检查

```bash
# 检查 PM2 服务状态
pm2 status

# 查看实时日志
pm2 logs web-to-apk --lines 100

# 检查服务响应
curl -I http://localhost:3000

# 检查 Nginx 状态
sudo systemctl status nginx
```

### 日志管理

```bash
# 查看应用日志
pm2 logs web-to-apk

# 查看错误日志
tail -f /home/webapk/web-to-apk/logs/err.log

# 查看访问日志
tail -f /var/log/nginx/access.log

# 日志轮转配置
sudo tee /etc/logrotate.d/web-to-apk << EOF
/home/webapk/web-to-apk/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
```

### 备份和恢复

重要目录备份：
```bash
# 创建备份脚本
cat > /home/webapk/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/backup/web-to-apk/\$(date +%Y%m%d)"
mkdir -p \$BACKUP_DIR

# 备份应用文件
tar -czf \$BACKUP_DIR/app.tar.gz -C /home/webapk web-to-apk

# 备份数据文件
cp -r /home/webapk/web-to-apk/web-server/downloads \$BACKUP_DIR/
cp -r /home/webapk/web-to-apk/web-server/uploads \$BACKUP_DIR/

# 备份配置文件
cp /home/webapk/web-to-apk/.env \$BACKUP_DIR/
cp /home/webapk/web-to-apk/ecosystem.config.js \$BACKUP_DIR/

echo "Backup completed: \$BACKUP_DIR"
EOF

chmod +x /home/webapk/backup.sh

# 设置定时备份
crontab -e
# 添加：0 2 * * * /home/webapk/backup.sh
```

### 清理维护

```bash
# 创建清理脚本
cat > /home/webapk/cleanup.sh << EOF
#!/bin/bash
# 清理 7 天前的构建文件
find /home/webapk/web-to-apk/web-server/downloads -type f -mtime +7 -delete

# 清理临时文件
rm -rf /home/webapk/web-to-apk/web-server/temp/*

# 清理旧日志
find /home/webapk/web-to-apk/logs -name "*.log" -mtime +30 -delete

# PM2 日志清理
pm2 flush

echo "Cleanup completed"
EOF

chmod +x /home/webapk/cleanup.sh

# 设置定时清理
crontab -e
# 添加：0 3 * * 0 /home/webapk/cleanup.sh
```

## 安全配置

### 文件上传安全
- 文件类型验证 (仅图片)
- 文件大小限制 (最大 5MB)
- 临时文件自动清理
- 禁止可执行文件上传

### 访问限制
- 每 IP 每 15 分钟 20 次请求限制
- 可配置的限流参数
- 防止滥用保护

### 系统安全
- 非 root 用户运行
- 安全头部设置 (Helmet.js)
- CORS 保护
- 定期安全更新

### 网络安全

```bash
# 配置防火墙 (UFW)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp  # 阻止直接访问应用端口

# 配置 fail2ban 防止暴力攻击
sudo apt install fail2ban -y

sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

sudo systemctl restart fail2ban
```

## 故障排除

### 常见问题

1. **构建失败:**
```bash
# 检查 Android SDK 安装
sdkmanager --list | grep "build-tools\|platforms"

# 检查 Java 环境
java -version
echo $JAVA_HOME

# 检查磁盘空间
df -h

# 检查环境变量
env | grep -E "(ANDROID|JAVA)"
```

2. **文件上传问题:**
```bash
# 检查上传目录权限
ls -la /home/webapk/web-to-apk/web-server/uploads/

# 检查文件大小限制
grep MAX_FILE_SIZE /home/webapk/web-to-apk/.env

# 检查可用磁盘空间
du -sh /home/webapk/web-to-apk/web-server/
```

3. **性能问题:**
```bash
# 监控系统资源
htop
free -h
iostat -x 1

# 检查 PM2 进程
pm2 monit

# 检查构建队列
ls -la /home/webapk/web-to-apk/web-server/temp/
```

4. **服务无法启动:**
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000

# 检查 PM2 日志
pm2 logs web-to-apk --err

# 手动启动测试
cd /home/webapk/web-to-apk
node web-server/server.js
```

### 调试模式

启用调试日志：
```bash
# 修改 PM2 配置
pm2 stop web-to-apk
pm2 delete web-to-apk

# 启用调试模式
NODE_ENV=development DEBUG=web-to-apk:* pm2 start ecosystem.config.js

# 查看详细日志
pm2 logs web-to-apk --lines 200
```

### 日志分析

常见日志模式监控：
```bash
# 构建失败
grep "Build failed" /home/webapk/web-to-apk/logs/*.log

# 限流触发
grep "Too many requests" /home/webapk/web-to-apk/logs/*.log

# 文件上传错误
grep "Upload error" /home/webapk/web-to-apk/logs/*.log

# Nginx 错误
sudo tail -f /var/log/nginx/error.log
```

## 扩展和性能优化

### 水平扩展

使用 PM2 集群模式：
```javascript
// ecosystem.config.js - 集群配置
module.exports = {
  apps: [{
    name: 'web-to-apk',
    script: 'web-server/server.js',
    instances: 'max',  // 或指定数量，如 4
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 性能优化

1. **系统资源优化:**
```bash
# 增加文件描述符限制
echo "webapk soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "webapk hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 优化内核参数
sudo tee -a /etc/sysctl.conf << EOF
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.netdev_max_backlog = 5000
EOF

sudo sysctl -p
```

2. **构建优化:**
- 使用构建缓存
- 并行构建处理
- 定期资源清理

3. **存储优化:**
```bash
# 设置自动压缩旧文件
find /home/webapk/web-to-apk/web-server/downloads -name "*.apk" -mtime +1 -exec gzip {} \;

# 使用 tmpfs 加速临时文件处理
sudo mount -t tmpfs -o size=2G tmpfs /home/webapk/web-to-apk/web-server/temp
```

### 负载均衡配置

```nginx
# /etc/nginx/sites-available/web-to-apk
upstream web_to_apk_backend {
    least_conn;
    server 127.0.0.1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://web_to_apk_backend;
        # ... 其他代理配置
    }
}
```

## 支持和维护

### 定期任务

1. **每日任务:**
   - 检查服务健康状态
   - 监控磁盘使用情况
   - 查看错误日志

2. **每周任务:**
   - 清理旧构建文件
   - 更新安全补丁
   - 备份配置文件

3. **每月任务:**
   - 更新系统软件包
   - 审查性能指标
   - 安全审计

### 监控设置

推荐监控工具：
- **Prometheus + Grafana** 用于指标监控
- **ELK Stack** 用于日志分析
- **Uptime Robot** 用于可用性监控
- **Zabbix** 用于系统监控

```bash
# 安装基础监控工具
sudo apt install htop iotop nethogs -y

# 创建监控脚本
cat > /home/webapk/monitor.sh << EOF
#!/bin/bash
echo "=== System Status ==="
uptime
free -h
df -h
echo "=== PM2 Status ==="
pm2 status
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager
EOF

chmod +x /home/webapk/monitor.sh
```

### 更新和升级

```bash
# 创建更新脚本
cat > /home/webapk/update.sh << EOF
#!/bin/bash
cd /home/webapk/web-to-apk

# 停止服务
pm2 stop web-to-apk

# 备份当前版本
cp -r . ../web-to-apk-backup-\$(date +%Y%m%d)

# 拉取最新代码
git pull origin main

# 安装依赖
npm install --production
cd web-server && npm install --production && cd ..

# 重新构建
npm run build

# 重启服务
pm2 restart web-to-apk

echo "Update completed"
EOF

chmod +x /home/webapk/update.sh
```

有关更多详细信息，请参阅项目文档和 [Web Server README](web-server/README.md)。