# Contributing to Web-to-APK

Thank you for your interest in contributing to Web-to-APK! We welcome contributions from the community and are grateful for your support.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.0 or higher
- **npm**: Version 8.0 or higher
- **Java JDK**: Version 17 or higher
- **Android SDK**: API Level 24 or higher
- **Git**: For version control

### Recommended Development Environment

We recommend using **WSL 2 (Windows Subsystem for Linux)** for the best development experience, especially on Windows systems.

## Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/web-to-apk.git
   cd web-to-apk
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/RereBot/web-to-apk.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   npm run web-server:install
   ```

5. **Build the project**:
   ```bash
   npm run build
   ```

6. **Run tests** to ensure everything is working:
   ```bash
   npm test
   ```

7. **Start the development server**:
   ```bash
   npm run web-server:dev
   ```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/RereBot/web-to-apk/issues) to avoid duplicates.

When creating a bug report, please include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, etc.)
- **Screenshots or logs** if applicable

Use our bug report template:

```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Environment**
- OS: [e.g., Windows 11, Ubuntu 22.04]
- Node.js version: [e.g., 20.10.0]
- Web-to-APK version: [e.g., 1.0.0]
```

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check existing feature requests** first
2. **Create a detailed proposal** with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach
   - Any potential drawbacks

### Contributing Code

#### Types of Contributions

- **Bug fixes**
- **New features**
- **Performance improvements**
- **Documentation updates**
- **Test coverage improvements**
- **Code refactoring**

#### Before You Start

1. **Check existing issues** and pull requests
2. **Create an issue** to discuss major changes
3. **Assign yourself** to the issue you're working on

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Follow our [coding standards](#coding-standards)
- Write or update tests as needed
- Update documentation if necessary
- Ensure all tests pass

### 3. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new APK signing feature"
git commit -m "fix: resolve build issue on Windows"
git commit -m "docs: update installation guide"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 4. Push and Create Pull Request

```bash
git push origin your-branch-name
```

Then create a pull request on GitHub with:

- **Clear title** describing the change
- **Detailed description** of what was changed and why
- **Reference to related issues** (e.g., "Fixes #123")
- **Screenshots** for UI changes

### 5. Code Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged

## Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for new code
- Follow **ESLint** configuration
- Use **Prettier** for code formatting
- Prefer **async/await** over promises
- Use **meaningful variable names**

### Code Style

```typescript
// Good
async function buildApk(config: BuildConfig): Promise<BuildResult> {
  try {
    const result = await executeGradleBuild(config);
    return result;
  } catch (error) {
    throw new BuildError(`Build failed: ${error.message}`);
  }
}

// Avoid
function buildApk(cfg) {
  return new Promise((resolve, reject) => {
    // ... complex callback logic
  });
}
```

### File Organization

- **Group related functionality** in modules
- **Use clear file names** that describe their purpose
- **Keep files focused** on a single responsibility
- **Export interfaces** and types appropriately

### Error Handling

- Use **custom error classes** for different error types
- Provide **meaningful error messages**
- Include **context information** in errors
- Handle errors **gracefully** in the UI

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run web server tests
npm run test:web-server
```

### Writing Tests

- Write **unit tests** for new functions
- Add **integration tests** for new features
- Use **descriptive test names**
- Follow **AAA pattern** (Arrange, Act, Assert)

```typescript
describe('buildApk', () => {
  it('should successfully build APK with valid configuration', async () => {
    // Arrange
    const config = createValidConfig();
    
    // Act
    const result = await buildApk(config);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.apkPath).toBeDefined();
  });
});
```

### Test Coverage

- Maintain **high test coverage** (aim for >80%)
- Focus on **critical paths** and **edge cases**
- Test **error conditions** as well as success paths

## Documentation

### Code Documentation

- Use **JSDoc comments** for functions and classes
- Document **complex algorithms** or business logic
- Keep comments **up-to-date** with code changes

```typescript
/**
 * Builds an Android APK from the provided configuration
 * @param config - Build configuration including app details and options
 * @param options - Additional build options
 * @returns Promise resolving to build result with APK path
 * @throws BuildError when build process fails
 */
async function buildApk(config: BuildConfig, options?: BuildOptions): Promise<BuildResult> {
  // Implementation
}
```

### README and Guides

- Update **README.md** for new features
- Add **examples** for new functionality
- Keep **installation instructions** current
- Update **troubleshooting** section as needed

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community chat
- **Pull Requests**: Code review and collaboration

### Getting Help

If you need help with contributing:

1. Check existing **documentation** and **issues**
2. Ask questions in **GitHub Discussions**
3. Reach out to **maintainers** if needed

### Recognition

Contributors are recognized in:

- **Release notes** for significant contributions
- **Contributors section** in README
- **GitHub contributors** page

## Development Workflow

### Typical Workflow

1. **Sync with upstream**:
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

3. **Develop and test**:
   ```bash
   npm run dev
   npm test
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

5. **Create pull request** on GitHub

### Release Process

Releases are handled by maintainers:

1. **Version bump** following semantic versioning
2. **Update changelog** with new features and fixes
3. **Create release tag** and GitHub release
4. **Publish to npm** (if applicable)

## Questions?

If you have questions about contributing, please:

- Check this guide first
- Search existing issues and discussions
- Create a new discussion if needed

Thank you for contributing to Web-to-APK! 🚀

---

**Happy coding!**

*This contributing guide is inspired by open source best practices and is continuously improved based on community feedback.*