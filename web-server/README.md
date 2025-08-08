# Web-to-APK Web Interface

A web-based interface for the Web-to-APK tool that allows users to convert web applications into Android APK files through a user-friendly web interface.

## Features

- 🌐 **Web Interface**: Easy-to-use web form for APK generation
- 📱 **Icon Management**: Upload custom icons or auto-fetch favicons
- 🔄 **Real-time Status**: Live build progress tracking
- 📦 **Direct Download**: Download generated APK files instantly
- 🐳 **Docker Ready**: Complete Docker deployment setup
- 🔒 **Security**: Rate limiting, file validation, and secure uploads
- 📱 **Responsive**: Mobile-friendly interface

## Quick Start

### Using Docker (Recommended)

1. **Build and run with Docker Compose:**
```bash
docker-compose up -d
```

2. **Or build and run manually:**
```bash
# Build the image
docker build -t web-to-apk .

# Run the container
docker run -p 3000:3000 -v $(pwd)/data:/app/web-server/data web-to-apk
```

3. **Access the web interface:**
Open http://localhost:3000 in your browser

### Local Development

1. **Install dependencies:**
```bash
cd web-server
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Access the interface:**
Open http://localhost:3000 in your browser

## Usage

### Basic Workflow

1. **Fill in App Information:**
   - App Name: The display name for your app
   - Package Name: Unique identifier (e.g., com.example.myapp)
   - Version: Version number (e.g., 1.0.0)
   - Website URL: Optional URL for favicon extraction

2. **Upload App Icon (Optional):**
   - Drag and drop or click to upload
   - Supported formats: PNG, JPG, GIF, WebP
   - Recommended size: 512x512 pixels
   - Maximum file size: 5MB

3. **Build APK:**
   - Click "Build APK" button
   - Wait for the build process to complete
   - Download the generated APK file

### Icon Handling

The system handles icons in the following priority:

1. **User Upload**: If you upload an icon, it will be processed and optimized
2. **Favicon Extraction**: If you provide a website URL, the system will try to fetch the favicon
3. **Default Icon**: If no icon is available, a high-quality default icon is used

## API Endpoints

### POST /api/build
Start a new APK build process.

**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `appName` (required): Application name
  - `packageName` (required): Package identifier
  - `version` (required): Version number
  - `websiteUrl` (optional): Website URL
  - `icon` (optional): Icon file upload

**Response:**
```json
{
  "buildId": "uuid-string",
  "status": "building",
  "message": "APK build started. Please wait..."
}
```

### GET /api/status/:buildId
Check the status of a build process.

**Response:**
```json
{
  "status": "completed|building|error",
  "downloadUrl": "/downloads/build-id/app.apk",
  "config": { ... },
  "buildTime": "2024-01-01T12:00:00.000Z"
}
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

### Security Features

- **Rate Limiting**: 10 requests per 15 minutes per IP
- **File Validation**: Strict file type and size validation
- **CORS Protection**: Cross-origin request protection
- **Helmet Security**: Security headers and CSP
- **Input Sanitization**: Form input validation and sanitization

## File Structure

```
web-server/
├── server.js              # Main server file
├── package.json           # Dependencies
├── public/                 # Static files
│   ├── index.html         # Main web interface
│   ├── styles.css         # Styling
│   └── script.js          # Client-side JavaScript
├── uploads/               # Temporary file uploads
├── downloads/             # Generated APK files
└── temp/                  # Temporary build files
```

## Docker Deployment

### Production Deployment

1. **Clone the repository:**
```bash
git clone <repository-url>
cd web-to-apk
```

2. **Configure environment:**
```bash
# Create data directories
mkdir -p data/{uploads,downloads,temp}

# Set permissions
chmod 755 data/{uploads,downloads,temp}
```

3. **Deploy with Docker Compose:**
```bash
docker-compose up -d
```

4. **Check status:**
```bash
docker-compose ps
docker-compose logs web-to-apk
```

### Custom Configuration

Edit `docker-compose.yml` to customize:

- **Port mapping**: Change `"3000:3000"` to your desired port
- **Domain**: Update Traefik labels for your domain
- **Volumes**: Adjust volume mounts for persistent storage
- **Environment**: Add custom environment variables

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Android SDK installation in container
   - Verify Java environment setup
   - Check available disk space

2. **File Upload Issues:**
   - Verify file size limits (5MB max)
   - Check supported file formats
   - Ensure proper permissions on upload directory

3. **Performance Issues:**
   - Monitor container resources
   - Check build queue length
   - Consider scaling with multiple containers

### Logs

View application logs:
```bash
# Docker Compose
docker-compose logs -f web-to-apk

# Docker
docker logs -f <container-id>
```

### Health Checks

The application includes health checks:
- HTTP endpoint: `GET /`
- Docker health check every 30 seconds
- Automatic restart on failure

## Development

### Local Setup

1. **Install dependencies:**
```bash
npm install
cd web-server && npm install
```

2. **Start development server:**
```bash
cd web-server
npm run dev
```

3. **Make changes:**
- Edit files in `web-server/public/` for frontend changes
- Edit `web-server/server.js` for backend changes
- Changes are automatically reloaded with nodemon

### Testing

Test the API endpoints:
```bash
# Test build endpoint
curl -X POST -F "appName=My Sample App" -F "packageName=com.example.mysampleapp" -F "version=1.0.0" http://localhost:3000/api/build

# Test status endpoint
curl http://localhost:3000/api/status/<build-id>
```

## Security Considerations

- **File Uploads**: All uploads are validated and stored temporarily
- **Rate Limiting**: Prevents abuse with request limits
- **Input Validation**: All form inputs are validated server-side
- **Temporary Files**: Build artifacts are cleaned up automatically
- **Container Security**: Runs with minimal privileges in container

## License

This project is part of the Web-to-APK tool suite. See the main project license for details.