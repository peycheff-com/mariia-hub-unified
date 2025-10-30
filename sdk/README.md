# Mariia Hub SDK Ecosystem

Comprehensive SDK development package for the beauty and fitness booking platform API in multiple popular programming languages.

## Supported Languages

- **TypeScript/JavaScript** - Primary SDK with complete TypeScript definitions
- **Python** - Python 3.8+ support with asyncio and type hints
- **PHP** - PHP 8.0+ with PSR compliance
- **Go** - Go 1.19+ with modules and context support
- **Ruby** - Ruby 3.0+ with modern type annotations
- **Java** - Java 17+ with Maven and Spring Boot integration
- **C#** - .NET 6+ with NuGet and async/await support

## Package Structure

```
sdk/
├── typescript/           # npm package @mariia-hub/api-client
├── python/              # PyPI package mariia-hub
├── php/                 # Composer package mariia-hub/api
├── go/                  # Go module github.com/mariia-hub/client
├── ruby/                # Gem mariia-hub-api
├── java/                # Maven artifact com.mariia-hub:client
├── csharp/              # NuGet package MariiaHub.Client
└── docs/                # Unified documentation
```

## Core Features

### Authentication Management
- JWT token handling with refresh logic
- API key authentication
- OAuth 2.0 flow support
- Multi-provider authentication

### API Client Structure
- Organized by feature areas (bookings, services, payments, etc.)
- Fluent interface for method chaining
- Request builder pattern
- Response parsing and validation

### Real-time Capabilities
- WebSocket client integration
- Event handlers and callbacks
- Automatic reconnection logic
- Subscription management

### Error Handling
- Custom exception types
- HTTP status code mapping
- Validation error parsing
- Retry logic with exponential backoff

### Polish Market Support
- Polish language error messages where applicable
- PLN currency handling utilities
- Polish validation rules (NIP, postal codes, phone numbers)
- Localized examples and documentation

## Quick Start

### TypeScript/JavaScript
```bash
npm install @mariia-hub/api-client
```

### Python
```bash
pip install mariia-hub
```

### PHP
```bash
composer require mariia-hub/api
```

### Go
```bash
go get github.com/mariia-hub/client
```

### Ruby
```bash
gem install mariia-hub-api
```

### Java
```xml
<dependency>
    <groupId>com.mariia-hub</groupId>
    <artifactId>client</artifactId>
    <version>1.0.0</version>
</dependency>
```

### C#
```bash
dotnet add package MariiaHub.Client
```

## Documentation

See the [docs](./docs) directory for:
- Getting Started Guides for each language
- API Reference Documentation with examples
- Authentication Setup instructions
- Real-time Features usage guides
- Error Handling best practices
- Sample Applications demonstrating usage

## Development

### Building All SDKs
```bash
npm run build:all
```

### Testing All SDKs
```bash
npm run test:all
```

### Publishing
```bash
npm run publish:all
```

## License

MIT License - see LICENSE file for details.