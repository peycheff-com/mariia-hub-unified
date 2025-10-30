# Mariia Hub SDK Examples

This directory contains comprehensive examples demonstrating how to use the Mariia Hub SDK across different programming languages and use cases.

## 📁 Directory Structure

```
examples/
├── typescript/          # TypeScript/JavaScript examples
│   ├── basic-booking/
│   ├── polish-market/
│   ├── realtime-dashboard/
│   ├── mobile-app/
│   └── server-integration/
├── python/              # Python examples
│   ├── async-booking/
│   ├── websocket-client/
│   ├── batch-processing/
│   └── data-analysis/
├── php/                 # PHP examples
│   ├── laravel-integration/
│   ├── symfony-integration/
│   └── standalone-client/
├── go/                  # Go examples
│   ├── web-service/
│   ├── cli-tool/
│   └── background-worker/
├── ruby/                # Ruby examples
│   ├── rails-app/
│   ├── sinatra-service/
│   └── background-jobs/
├── java/                # Java examples
│   ├── spring-boot-app/
│   ├── console-app/
│   └── batch-processor/
└── csharp/              # C# examples
    ├── aspnet-core-app/
    ├── console-app/
    └── background-service/
```

## 🚀 Quick Start Examples

### TypeScript/JavaScript - Basic Booking

```typescript
import { createMariiaHubClient } from '@mariia-hub/api-client';

async function basicBooking() {
  const client = createMariiaHubClient({
    api: {
      apiKey: process.env.MARIIA_HUB_API_KEY
    }
  });

  try {
    // Get available services
    const services = await client.services.list({
      category: 'beauty',
      locationType: 'studio'
    });

    console.log(`Found ${services.data.length} services`);

    // Check availability for a service
    const availability = await client.bookings.checkAvailability({
      serviceId: services.data[0].id,
      date: '2024-01-15',
      groupSize: 1
    });

    if (availability.data.availableSlots.length > 0) {
      // Create booking
      const booking = await client.bookings.create({
        serviceId: services.data[0].id,
        timeSlot: availability.data.availableSlots[0],
        details: {
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '+48 123 456 789',
          consentTerms: true,
          consentMarketing: false
        }
      });

      console.log('Booking created:', booking.data.id);

      // Process payment
      const payment = await client.payments.createPaymentIntent({
        amount: services.data[0].price * 100, // Convert to cents
        currency: 'PLN',
        bookingId: booking.data.id,
        paymentMethod: 'card'
      });

      console.log('Payment intent created:', payment.data.clientSecret);
    } else {
      console.log('No available slots for selected date');
    }

  } catch (error) {
    console.error('Booking failed:', error.message);
  }
}

basicBooking();
```

### Python - Async Booking with Polish Features

```python
import asyncio
from mariia_hub import MariiaHubClient, create_polish_client
from mariia_hub.exceptions import ValidationError, RateLimitError

async def polish_market_booking():
    # Create client with Polish market configuration
    client = create_polish_client(
        api_key="your-api-key",
        enable_polish_payment_methods=True,
        enable_polish_invoicing=True
    )

    try:
        # Search for beauty services in Warsaw
        services = await client.services.search(
            query="kosmetyka",
            location_type="studio",
            max_price=500
        )

        print(f"Found {len(services.data)} beauty services")

        if services.data:
            service = services.data[0]
            print(f"Selected service: {service.name}")

            # Check availability
            availability = await client.bookings.check_availability(
                service_id=service.id,
                date="2024-01-15",
                group_size=1
            )

            if availability.data.available_slots:
                # Create booking with Polish payment method
                booking = await client.bookings.create({
                    "service_id": service.id,
                    "time_slot": availability.data.available_slots[0].dict(),
                    "details": {
                        "client_name": "Anna Kowalska",
                        "client_email": "anna@example.pl",
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

                print(f"Booking created: {booking.data.id}")

                # Create Polish invoice if needed
                if booking.data.invoice_requested:
                    invoice = await client.payments.create_invoice(
                        booking.data.payment_id,
                        {
                            "type": "vat",
                            "buyer_details": {
                                "company_name": "Anna Kowalska",
                                "nip": "123-456-78-90",
                                "address": {
                                    "street": "ul. Marszałkowska",
                                    "building_number": "1",
                                    "postal_code": "00-001",
                                    "city": "Warszawa"
                                }
                            }
                        }
                    )
                    print(f"Invoice created: {invoice.data.id}")

            else:
                print("No available slots for selected date")

    except ValidationError as e:
        print(f"Validation error: {e.field} - {e.message}")
    except RateLimitError as e:
        print(f"Rate limited. Retry after {e.retry_after} seconds")
    except Exception as e:
        print(f"Booking failed: {e}")

if __name__ == "__main__":
    asyncio.run(polish_market_booking())
```

### Real-time Dashboard Example

```typescript
// TypeScript/JavaScript - Real-time booking dashboard
import { createMariiaHubClient } from '@mariia-hub/api-client';

class BookingDashboard {
  private client;
  private bookings = new Map();
  private stats = {
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0
  };

  constructor() {
    this.client = createMariiaHubClient({
      api: { apiKey: process.env.MARIIA_HUB_API_KEY },
      websockets: {
        autoReconnect: true,
        heartbeatInterval: 30000
      }
    });
  }

  async initialize() {
    console.log('🚀 Initializing dashboard...');

    // Load existing bookings
    await this.loadExistingBookings();

    // Subscribe to real-time updates
    await this.subscribeToUpdates();

    console.log('✅ Dashboard ready!');
    this.displayStats();
  }

  private async loadExistingBookings() {
    const response = await this.client.bookings.list({
      limit: 100
    });

    response.data.forEach(booking => {
      this.bookings.set(booking.id, booking);
      this.updateStats(booking);
    });

    console.log(`📊 Loaded ${response.data.length} existing bookings`);
  }

  private async subscribeToUpdates() {
    // Subscribe to booking updates
    await this.client.websockets.subscribeToBookings((message) => {
      const booking = message.data;
      this.handleBookingUpdate(booking);
    });

    // Subscribe to availability updates
    await this.client.websockets.subscribeToAvailability((message) => {
      console.log('📅 Availability updated:', message.data);
    });

    // Subscribe to notifications
    await this.client.websockets.subscribeToNotifications((message) => {
      const notification = message.data;
      this.showNotification(notification);
    });

    console.log('🔔 Subscribed to real-time updates');
  }

  private handleBookingUpdate(booking) {
    const existing = this.bookings.get(booking.id);

    if (existing) {
      // Update existing booking
      this.updateStats(existing, true); // Remove old stats
      this.bookings.set(booking.id, booking);
      this.updateStats(booking);

      console.log(`🔄 Booking ${booking.id} updated: ${existing.status} → ${booking.status}`);
    } else {
      // New booking
      this.bookings.set(booking.id, booking);
      this.updateStats(booking);

      console.log(`✨ New booking: ${booking.id} (${booking.status})`);
    }

    this.displayStats();
  }

  private updateStats(booking, remove = false) {
    const multiplier = remove ? -1 : 1;

    this.stats.total += multiplier;

    switch (booking.status) {
      case 'confirmed':
        this.stats.confirmed += multiplier;
        this.stats.revenue += multiplier * (booking.totalAmount || 0);
        break;
      case 'pending':
        this.stats.pending += multiplier;
        break;
      case 'cancelled':
        this.stats.cancelled += multiplier;
        break;
    }
  }

  private displayStats() {
    console.clear();
    console.log('📊 BOOKING DASHBOARD');
    console.log('═'.repeat(50));
    console.log(`Total Bookings: ${this.stats.total}`);
    console.log(`✅ Confirmed: ${this.stats.confirmed}`);
    console.log(`⏳ Pending: ${this.stats.pending}`);
    console.log(`❌ Cancelled: ${this.stats.cancelled}`);
    console.log(`💰 Revenue: €${(this.stats.revenue / 100).toFixed(2)}`);
    console.log('═'.repeat(50));

    // Show recent bookings
    const recentBookings = Array.from(this.bookings.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    console.log('📋 Recent Bookings:');
    recentBookings.forEach(booking => {
      const status = this.getStatusEmoji(booking.status);
      console.log(`  ${status} ${booking.clientName} - ${booking.serviceName} (${booking.id.slice(-8)})`);
    });
  }

  private getStatusEmoji(status) {
    const emojis = {
      'pending': '⏳',
      'confirmed': '✅',
      'completed': '✨',
      'cancelled': '❌',
      'draft': '📝'
    };
    return emojis[status] || '❓';
  }

  private showNotification(notification) {
    console.log(`🔔 ${notification.title}: ${notification.message}`);
  }

  async close() {
    await this.client.close();
    console.log('👋 Dashboard closed');
  }
}

// Usage
async function main() {
  const dashboard = new BookingDashboard();

  try {
    await dashboard.initialize();

    // Keep running
    process.on('SIGINT', async () => {
      console.log('\n👋 Shutting down...');
      await dashboard.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Dashboard initialization failed:', error);
    process.exit(1);
  }
}

main();
```

## 📚 Example Categories

### 1. Basic Integration
- Service discovery and booking
- User authentication
- Payment processing
- Basic error handling

### 2. Polish Market Features
- Polish payment methods (BLIK, Przelewy24)
- VAT invoicing with Polish requirements
- Company verification (NIP, REGON)
- Polish business hours and holidays

### 3. Real-time Applications
- WebSocket integration
- Live dashboards
- Notification systems
- Collaborative tools

### 4. Mobile Applications
- Offline support
- Background sync
- Push notifications
- Local storage strategies

### 5. Server Integration
- Batch processing
- Background jobs
- Webhook handling
- Data synchronization

### 6. Framework Integration
- Laravel (PHP)
- Symfony (PHP)
- Rails (Ruby)
- Spring Boot (Java)
- ASP.NET Core (C#)
- Express.js (Node.js)

## 🛠 Running Examples

### Prerequisites

1. Get your API key from [Mariia Hub Dashboard](https://dashboard.mariia-hub.com)
2. Set up environment variables:
   ```bash
   export MARIIA_HUB_API_KEY=your-api-key
   export MARIIA_HUB_BASE_URL=https://api.mariia-hub.com/v1
   ```

### TypeScript/JavaScript Examples

```bash
cd typescript/basic-booking
npm install
npm start
```

### Python Examples

```bash
cd python/async-booking
pip install -r requirements.txt
python main.py
```

### PHP Examples

```bash
cd php/laravel-integration
composer install
php artisan serve
```

### Go Examples

```bash
cd go/web-service
go mod tidy
go run main.go
```

### Ruby Examples

```bash
cd ruby/rails-app
bundle install
rails server
```

### Java Examples

```bash
cd java/spring-boot-app
mvn spring-boot:run
```

### C# Examples

```bash
cd csharp/aspnet-core-app
dotnet restore
dotnet run
```

## 🔧 Configuration

Most examples support environment variables for configuration:

```bash
# API Configuration
MARIIA_HUB_API_KEY=your-api-key
MARIIA_HUB_BASE_URL=https://api.mariia-hub.com/v1

# WebSocket Configuration
MARIIA_HUB_WS_URL=wss://api.mariia-hub.com/ws

# Regional Settings (for Polish examples)
MARIIA_HUB_LANGUAGE=pl
MARIIA_HUB_CURRENCY=PLN

# Debug Settings
MARIIA_HUB_DEBUG=true
```

## 📝 Contributing Examples

To contribute new examples:

1. Choose the appropriate language directory
2. Create a new folder for your example
3. Include:
   - `README.md` with description
   - Source code files
   - `requirements.txt` or equivalent
   - Configuration examples
4. Follow the existing code style and patterns
5. Add comprehensive error handling
6. Include inline documentation

### Example Structure

```
examples/typescript/your-example/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── client.ts
│   └── utils.ts
├── .env.example
└── .gitignore
```

## 🆘 Getting Help

If you encounter issues with any example:

1. Check the example's README.md
2. Review the error logs
3. Verify your API key and configuration
4. Check the [main documentation](../docs/)
5. [Open an issue](https://github.com/mariia-hub/sdk/issues)

## 📄 License

All examples are licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

Happy coding! 🎉 If you have any questions or need help, don't hesitate to reach out.