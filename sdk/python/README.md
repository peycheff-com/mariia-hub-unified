# mariia-hub

[![Python Version](https://img.shields.io/pypi/pyversions/mariia-hub.svg)](https://pypi.org/project/mariia-hub/)
[![PyPI Version](https://img.shields.io/pypi/v/mariia-hub.svg)](https://pypi.org/project/mariia-hub/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/mariia-hub/sdk/workflows/CI/badge.svg)](https://github.com/mariia-hub/sdk/actions)
[![Code Coverage](https://codecov.io/gh/mariia-hub/sdk/branch/main/graph/badge.svg?flag=python)](https://codecov.io/gh/mariia-hub/sdk?flag=python)

A comprehensive Python SDK for the Mariia Hub beauty and fitness booking platform API with full async support and Polish market features.

## Features

- 🎯 **Full API Coverage** - Complete type hints for all API endpoints
- ⚡ **Async/Await Support** - Built on aiohttp for high-performance async operations
- 🔐 **Authentication Management** - JWT, API key, and OAuth 2.0 with auto-refresh
- 🌐 **Real-time Capabilities** - WebSocket client for live updates and notifications
- 🛡️ **Error Handling** - Comprehensive exception hierarchy with Polish market support
- 📊 **Rate Limiting** - Built-in rate limiting with automatic retry logic
- 💾 **Caching** - Thread-safe caching with configurable strategies
- 🇵🇱 **Polish Market Support** - Localized features, payment methods, and validation
- 🔒 **Type Safety** - Full Pydantic model validation
- 📦 **Easy Installation** - Available on PyPI with zero dependencies beyond aiohttp

## Installation

```bash
pip install mariia-hub
```

For development dependencies:

```bash
pip install "mariia-hub[dev]"
```

For examples and notebooks:

```bash
pip install "mariia-hub[examples]"
```

## Quick Start

### Basic Usage

```python
import asyncio
from mariia_hub import MariiaHubClient

async def main():
    client = MariiaHubClient(api_key="your-api-key")

    # Get available services
    services = await client.services.list()
    print(f"Found {len(services.data)} services")

    # Create a booking
    booking = await client.bookings.create({
        "service_id": "service-123",
        "time_slot": {
            "id": "slot-123",
            "date": "2024-01-15",
            "time": "14:00",
            "available": True,
            "location": "studio"
        },
        "details": {
            "client_name": "John Doe",
            "client_email": "john@example.com",
            "client_phone": "+48 123 456 789",
            "consent_terms": True,
            "consent_marketing": False
        }
    })

    print(f"Booking created: {booking.data.id}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Polish Market Configuration

```python
from mariia_hub import MariiaHubClient
from mariia_hub.config import PolishMarketConfig

async def main():
    client = MariiaHubClient(
        api_key="your-api-key",
        config=PolishMarketConfig(
            language="pl",
            currency="PLN",
            enable_polish_payment_methods=True,
            enable_polish_invoicing=True
        )
    )

    # Book with Polish payment methods
    booking = await client.bookings.create({
        "service_id": "service-123",
        "time_slot": {
            "id": "slot-123",
            "date": "2024-01-15",
            "time": "14:00",
            "available": True,
            "location": "studio"
        },
        "details": {
            "client_name": "Jan Kowalski",
            "client_email": "jan@example.pl",
            "client_phone": "+48 123 456 789",
            "consent_terms": True,
            "consent_marketing": False
        },
        "payment_details": {
            "method": "card",
            "currency": "PLN",
            "polish_payment_method": {
                "type": "blik",
                "blik_code": "123456"
            }
        }
    })

    print(f"Booking created with Polish payment: {booking.data.id}")

asyncio.run(main())
```

### Real-time Updates

```python
import asyncio
from mariia_hub import MariiaHubClient

async def handle_booking_update(message):
    booking = message.data
    print(f"Booking {booking.id} status: {booking.status}")

    if booking.status == "confirmed":
        print("Booking confirmed! 🎉")

async def handle_availability_update(message):
    availability = message.data
    print(f"New availability for {availability.service_id}")

async def main():
    client = MariiaHubClient(api_key="your-api-key")

    # Subscribe to booking updates
    await client.websockets.subscribe_to_bookings(handle_booking_update)

    # Subscribe to availability updates
    await client.websockets.subscribe_to_availability(handle_availability_update)

    # Keep the client running
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\nDisconnecting...")
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
```

## Configuration

### SDK Configuration

```python
from mariia_hub import MariiaHubClient
from mariia_hub.config import SDKConfig, APIConfig, WebSocketConfig

config = SDKConfig(
    api=APIConfig(
        base_url="https://api.mariia-hub.com/v1",
        timeout=30.0,
        retries=3,
        headers={"X-Custom-Header": "value"}
    ),
    websockets=WebSocketConfig(
        auto_reconnect=True,
        max_reconnect_attempts=5,
        heartbeat_interval=30
    ),
    debug=True
)

client = MariiaHubClient(api_key="your-api-key", config=config)
```

### Polish Market Configuration

```python
from mariia_hub.config import PolishMarketConfig

polish_config = PolishMarketConfig(
    language="pl",
    currency="PLN",
    timezone="Europe/Warsaw",
    enable_polish_payment_methods=True,
    enable_polish_invoicing=True,
    enable_polish_verification=True
)

client = MariiaHubClient(
    api_key="your-api-key",
    config=polish_config
)
```

## API Endpoints

### Bookings

```python
# Check availability
availability = await client.bookings.check_availability(
    service_id="service-123",
    date="2024-01-15",
    group_size=2
)

# Create booking
booking = await client.bookings.create({
    "service_id": "service-123",
    "time_slot": {...},
    "details": {...}
})

# Get user bookings
bookings = await client.bookings.list(
    status="confirmed",
    page=1,
    limit=20
)

# Reschedule booking
rescheduled = await client.bookings.reschedule(
    booking_id="booking-123",
    new_date="2024-01-16",
    new_time="15:00"
)

# Cancel booking
cancelled = await client.bookings.cancel(
    booking_id="booking-123",
    reason="Customer request"
)
```

### Services

```python
# List services
services = await client.services.list(
    category="beauty",
    featured=True,
    limit=10
)

# Get service details
service = await client.services.get("service-123")

# Search services
search_results = await client.services.search(
    query="massage",
    max_price=500,
    location_type="studio"
)

# Get service availability
availability = await client.services.get_availability(
    service_id="service-123",
    start_date="2024-01-15",
    end_date="2024-01-31"
)
```

### Payments

```python
# Create payment intent
payment_intent = await client.payments.create_payment_intent({
    "amount": 29900,  # 299.00 PLN in cents
    "currency": "PLN",
    "booking_id": "booking-123",
    "payment_method": "card"
})

# Get payment
payment = await client.payments.get_payment("payment-123")

# Create refund
refund = await client.payments.create_refund({
    "payment_id": "payment-123",
    "amount": 14900,
    "reason": "service_cancelled"
})

# Polish payment methods
payment_intent = await client.payments.create_payment_intent({
    "amount": 29900,
    "currency": "PLN",
    "booking_id": "booking-123",
    "polish_payment_details": {
        "method": "blik",
        "blik_code": "123456"
    }
})
```

### Authentication

```python
# Login
auth_response = await client.auth.login({
    "email": "user@example.com",
    "password": "password123"
})

# Register
registration = await client.auth.register({
    "email": "newuser@example.com",
    "password": "password123",
    "first_name": "Jane",
    "last_name": "Doe",
    "consents": {
        "terms": True,
        "privacy": True,
        "marketing": False
    }
})

# Get current user
user = await client.auth.get_current_user()

# Update profile
updated_user = await client.auth.update_profile({
    "first_name": "Jane",
    "last_name": "Smith"
})
```

## Error Handling

The SDK provides comprehensive exception handling:

```python
from mariia_hub.exceptions import (
    MariiaHubError,
    ValidationError,
    RateLimitError,
    AuthenticationError,
    BookingError,
    PaymentError,
    PolishMarketError
)

try:
    booking = await client.bookings.create(booking_data)
except ValidationError as e:
    print(f"Validation failed: {e.field} - {e.message}")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except AuthenticationError as e:
    print(f"Authentication failed: {e.message}")
except PolishMarketError as e:
    print(f"Polish market validation failed: {e.polish_rule}")
except BookingError as e:
    print(f"Booking error: {e.code} - {e.message}")
except MariiaHubError as e:
    print(f"API error: {e.code} - {e.message}")
```

## Polish Market Features

### Polish Validation

```python
from mariia_hub.utils.polish import PolishValidator

validator = PolishValidator()

# Validate NIP
nip_result = validator.validate_nip("123-456-78-90")
print(f"NIP valid: {nip_result.is_valid}")

# Validate REGON
regon_result = validator.validate_regon("123456785")
print(f"REGON valid: {regon_result.is_valid}")

# Validate PESEL
pesel_result = validator.validate_pesel("80010100000")
print(f"PESEL valid: {pesel_result.is_valid}")

# Validate postal code
postal_result = validator.validate_postal_code("00-001")
print(f"Postal code valid: {postal_result.is_valid}")

# Validate phone number
phone_result = validator.validate_phone_number("+48 123 456 789")
print(f"Phone valid: {phone_result.is_valid}")
```

### Polish Payment Methods

```python
# Create payment with BLIK
payment_intent = await client.payments.create_payment_intent({
    "amount": 29900,
    "currency": "PLN",
    "booking_id": "booking-123",
    "polish_payment_details": {
        "method": "blik",
        "blik_code": "123456"
    }
})

# Create payment with Przelewy24
payment_intent = await client.payments.create_payment_intent({
    "amount": 29900,
    "currency": "PLN",
    "booking_id": "booking-123",
    "polish_payment_details": {
        "method": "przelewy24",
        "return_url": "https://your-app.com/return"
    }
})

# Create payment with PBL (online banking)
payment_intent = await client.payments.create_payment_intent({
    "amount": 29900,
    "currency": "PLN",
    "booking_id": "booking-123",
    "polish_payment_details": {
        "method": "pbl",
        "bank_id": "1020"  # PKO BP
    }
})
```

### Polish Invoicing

```python
# Create payment with Polish invoice
payment_intent = await client.payments.create_payment_intent({
    "amount": 29900,
    "currency": "PLN",
    "booking_id": "booking-123",
    "polish_payment_details": {
        "method": "card",
        "polish_company_details": {
            "company_name": "Firma Sp. z o.o.",
            "nip": "123-456-78-90",
            "address": {
                "street": "ul. Jana Pawła II",
                "building_number": "43",
                "postal_code": "00-001",
                "city": "Warszawa"
            }
        }
    }
})

# Generate Polish invoice
invoice = await client.payments.create_invoice(payment_intent.data.id, {
    "type": "vat",
    "seller_details": {
        "company_name": "Twoja Firma Sp. z o.o.",
        "nip": "987-654-32-10",
        "address": {...}
    },
    "buyer_details": {
        "company_name": "Klient Sp. z o.o.",
        "nip": "123-456-78-90",
        "address": {...}
    },
    "items": [
        {
            "name": "Usługa kosmetyczna",
            "quantity": 1,
            "unit_price_net": 242.28,
            "vat_rate": 23
        }
    ]
})
```

## Advanced Usage

### Custom Error Handlers

```python
from mariia_hub.handlers import ErrorHandler

class CustomErrorHandler(ErrorHandler):
    def can_handle(self, error):
        return isinstance(error, RateLimitError)

    def handle(self, error):
        print(f"Rate limit hit: {error.retry_after}s")
        # Implement custom rate limit handling

client.add_error_handler(CustomErrorHandler())
```

### Request Interceptors

```python
async def log_request(request):
    print(f"Making request: {request.method} {request.url}")
    return request

async def handle_auth_error(error):
    if isinstance(error, AuthenticationError):
        await client.auth.refresh_tokens()
        return client.request(error.request.method, error.request.url, error.request.data)
    raise error

client.add_request_interceptor(log_request)
client.add_response_interceptor(None, handle_auth_error)  # error handler only
```

### Metrics Collection

```python
from mariia_hub.metrics import MetricsCollector

metrics = MetricsCollector()

# Get metrics
metrics_data = metrics.get_metrics()
print(f"API calls: {metrics_data.api_calls}")
print(f"Average response time: {metrics_data.average_response_time}")

# Custom metrics
metrics.increment_counter("custom_events", {"type": "user_action"})
metrics.record_histogram("process_duration", 150, {"step": "validation"})
```

### Context Managers

```python
from mariia_hub import MariiaHubClient

async def batch_operations():
    async with MariiaHubClient(api_key="your-api-key") as client:
        # Client will be automatically closed
        bookings = await client.bookings.list()
        services = await client.services.list()
        return bookings, services

# Use in production
bookings, services = await batch_operations()
```

## Environment Variables

```bash
# API Configuration
MARIIA_HUB_API_URL=https://api.mariia-hub.com/v1
MARIIA_HUB_API_KEY=your-api-key

# WebSocket Configuration
MARIIA_HUB_WS_URL=wss://api.mariia-hub.com/ws

# Regional Settings
MARIIA_HUB_DEFAULT_LANGUAGE=pl
MARIIA_HUB_DEFAULT_CURRENCY=PLN
MARIIA_HUB_DEFAULT_TIMEZONE=Europe/Warsaw

# Debug Settings
MARIIA_HUB_DEBUG=false
MARIIA_HUB_LOG_LEVEL=INFO
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic Booking Flow](./examples/basic_booking.py)
- [Polish Market Integration](./examples/polish_market.py)
- [Real-time Dashboard](./examples/realtime_dashboard.py)
- [Batch Processing](./examples/batch_processing.py)
- [Error Handling](./examples/error_handling.py)
- [Custom Configuration](./examples/custom_config.py)

## API Reference

Complete API documentation is available at [docs.mariia-hub.com/sdk/python](https://docs.mariia-hub.com/sdk/python)

### Main Classes

- **`MariiaHubClient`** - Main SDK client
- **`AsyncHttpClient`** - HTTP client with retry logic
- **`WebSocketClient`** - WebSocket client for real-time features
- **`AuthenticationManager`** - Authentication and token management
- **`RateLimitManager`** - Rate limiting and retry logic
- **`CacheManager`** - Response caching

### API Endpoints

- **`BookingsAPI`** - Booking management
- **`ServicesAPI`** - Service catalog
- **`PaymentsAPI`** - Payment processing
- **`AuthAPI`** - Authentication
- **`UsersAPI`** - User management
- **`AdminAPI`** - Admin functionality
- **`WebSocketAPI`** - Real-time events

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=mariia_hub --cov-report=html

# Run specific test categories
pytest -m "unit"
pytest -m "integration"
pytest -m "polish"

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_client.py
```

## Development

```bash
# Clone the repository
git clone https://github.com/mariia-hub/sdk.git
cd sdk/python

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install development dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install

# Run code formatting
black mariia_hub tests
isort mariia_hub tests

# Run linting
flake8 mariia_hub tests
mypy mariia_hub

# Run tests
pytest

# Build package
python -m build

# Upload to PyPI (test)
python -m twine upload --repository testpypi dist/*

# Upload to PyPI (production)
python -m twine upload dist/*
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes and version history.