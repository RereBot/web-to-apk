# Changelog

All notable changes to the Web-to-APK project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-10

### Added
- **Complete Docker Support**: Implemented one-click startup and cross-platform deployment, greatly simplifying development and usage barriers.
- **Enhanced Package Name Validation**: Strengthened frontend and backend application package name validation to prevent build failures caused by Java reserved keywords.
- **Internationalization Support**: Added i18n support for new validation error messages.

### Changed
- **Optimized Docker Image**: Reduced production image size by over 50% through multi-stage builds.
- **Improved First Build Speed**: Pre-installed Gradle in the image, reducing first build time from minutes to seconds.
- **Network Binding Fix**: Changed backend Node.js server listening address to `0.0.0.0`, resolving network access issues within containers.

### Fixed
- **TLS Protocol Compatibility**: Fixed Gradle dependency download issues in specific network environments due to TLS protocol compatibility problems.
- **Capacitor Assets Tool**: Fixed potential errors with `@capacitor/assets` tool when `manifest.json` is not found.
- **Concurrent Build Prevention**: Fixed Gradle cache file locking issues caused by concurrent build requests through frontend button disabling and backend logic reinforcement.

## [1.0.0] - 2024-02-XX

### Added

#### Core Features
- **APK Builder**: Complete APK building functionality using Capacitor framework
- **Configuration Management**: Comprehensive config parsing, validation, and management
- **Resource Processing**: Icon processing, splash screen generation, and web resource copying
- **CLI Interface**: Full-featured command-line interface with init, build, and serve commands
- **Web Interface**: Browser-based UI for visual APK building
- **Logging System**: Structured logging with multiple levels and formatters

#### CLI Commands
- `web-to-apk init` - Initialize new project with interactive setup
- `web-to-apk build` - Build APK from configuration
- `web-to-apk serve` - Start web interface server
- `web-to-apk --help` - Display help information
- `web-to-apk --version` - Show version information

#### Web Interface Features
- Visual form-based configuration
- Real-time build progress tracking
- Icon upload and preview
- Automatic favicon extraction
- APK download functionality
- Mobile-responsive design

#### Resource Processing
- **Icon Processing**: Generate all required Android icon sizes from single source
- **Splash Screen Generation**: Create adaptive splash screens for different densities
- **Web Resource Copying**: Intelligent copying of web assets with path transformation

#### Configuration Features
- JSON-based configuration files
- Template system (basic, PWA, SPA)
- Comprehensive validation with helpful error messages
- Support for custom Android permissions
- WebView configuration options
- Theme and styling customization

#### Testing
- **Unit Tests**: Comprehensive test coverage for all modules
- **Integration Tests**: End-to-end workflow testing
- **Web Server Tests**: Frontend and API testing
- **Performance Tests**: Build time and resource usage benchmarks

#### Documentation
- **README**: Comprehensive user guide with installation and usage instructions
- **API Documentation**: Complete interface and type definitions
- **Examples**: Two complete example projects (basic HTML and React)
- **Deployment Guide**: Docker and production deployment instructions

#### Examples
- **Basic HTML Example**: Simple HTML/CSS/JavaScript application
- **React Example**: Modern React application with Vite build system

#### Development Tools
- **TypeScript**: Full TypeScript implementation with strict type checking
- **ESLint**: Code linting with TypeScript-specific rules
- **Prettier**: Code formatting for consistent style
- **Jest**: Testing framework with coverage reporting

#### Build and Deployment
- **Docker Support**: Complete containerization with multi-stage builds
- **CI/CD Ready**: GitHub Actions workflow templates
- **NPM Package**: Ready for npm registry publication

### Technical Details

#### Dependencies
- **@capacitor/cli**: ^5.7.0 - Capacitor command-line interface
- **@capacitor/core**: ^5.7.0 - Capacitor core functionality
- **@capacitor/android**: ^5.7.0 - Android platform support
- **commander**: ^12.0.0 - CLI argument parsing
- **inquirer**: ^9.2.15 - Interactive command-line prompts
- **chalk**: ^4.1.2 - Terminal string styling
- **ora**: ^7.0.1 - Terminal spinners
- **sharp**: ^0.33.2 - Image processing

#### Development Dependencies
- **TypeScript**: ^5.3.3 - TypeScript compiler
- **Jest**: ^29.7.0 - Testing framework
- **ESLint**: ^8.57.0 - Code linting
- **Prettier**: ^3.2.5 - Code formatting

#### Architecture
- **Modular Design**: Clean separation of concerns with well-defined interfaces
- **Dependency Injection**: Flexible component composition
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Async/Await**: Modern asynchronous programming patterns
- **ESM Modules**: Full ES module support for better tree-shaking

#### Performance
- **Optimized Builds**: Efficient TypeScript compilation and bundling
- **Resource Optimization**: Smart image processing and compression
- **Caching**: Build artifact caching for faster subsequent builds
- **Memory Management**: Efficient memory usage during large builds

### Security
- **Input Validation**: Comprehensive validation of all user inputs
- **Path Sanitization**: Protection against path traversal attacks
- **Secure Defaults**: Safe default configurations
- **Dependency Scanning**: Regular security audits of dependencies

### Compatibility
- **Node.js**: Requires Node.js 16.0.0 or higher
- **Operating Systems**: Windows, macOS, and Linux support
- **Android**: Supports Android API level 24 and higher
- **Browsers**: Modern browser support for web interface

### Known Issues
- Large APK builds may require significant memory (>2GB RAM recommended)
- First-time builds require internet connection for dependency downloads
- Some antivirus software may flag APK files as suspicious

### Migration Guide
This is the initial release, so no migration is required.

---

## Development Notes

### Project Structure
```
web-to-apk/
├── src/                    # TypeScript source code
│   ├── apk/               # APK building functionality
│   ├── cli/               # Command-line interface
│   ├── config/            # Configuration management
│   ├── interfaces/        # TypeScript interfaces
│   ├── logging/           # Logging system
│   ├── resources/         # Resource processing
│   ├── types/             # Type definitions
│   └── webview/           # WebView configuration
├── tests/                 # Test suites
├── examples/              # Example projects
├── web-server/            # Web interface server
├── scripts/               # Build and utility scripts
└── docs/                  # Additional documentation
```

### Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.