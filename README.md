# Energy Platform Test Suite

[![CI](https://github.com/yuri-spizhovyi-mit/energy-platform-test-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/yuri-spizhovyi-mit/energy-platform-test-suite/actions/workflows/ci.yml)

Comprehensive test suite for the Energy Platform, covering API testing, event-driven architecture, WebSocket communication, and end-to-end scenarios.

**Test Coverage:** 97/97 tests passing ✅ (100% pass rate)

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Infrastructure](#test-infrastructure)
- [Project Structure](#project-structure)
- [Test Builders](#test-builders)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js 20+** (required for Cypress 15 compatibility)
- **Docker & Docker Compose** (for integration tests)
- **npm** or **yarn**

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy environment variables:

```bash
cp .env.example .env
```

## Running Tests

### 🚀 Quick Start (With Mock Server)

**Terminal 1 - Start Mock API Server:**
```bash
npm run server
```

**Terminal 2 - Start Infrastructure:**
```bash
npm run services:up
```

**Terminal 3 - Run Tests:**
```bash
npm test
```

That's it! All tests should now pass! ✅

### Quick Start (Unit Tests Only)

Run unit tests without external dependencies:

```bash
npm run test:unit
```

### All Tests (Requires Services)

1. **Start mock API server:**

```bash
npm run server
```

2. **Start infrastructure services:**

```bash
npm run services:up
```

3. **Run all tests:**

```bash
npm test
```

4. **Stop services when done:**

```bash
npm run services:down
```

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:unit` | Run unit tests (builders/helpers) |
| `npm run test:api` | Run REST & GraphQL API tests |
| `npm run test:kafka` | Run Kafka event flow tests |
| `npm run test:redis` | Run Redis message queue tests |
| `npm run test:websocket` | Run WebSocket real-time tests |
| `npm run test:performance` | Run performance/load tests |
| `npm run test:e2e` | Run Cypress E2E tests |
| `npm run test:e2e:open` | Open Cypress UI |
| `npm run test:all` | Run all tests (Jest + Cypress) |

### Service Management

| Command | Description |
|---------|-------------|
| `npm run services:up` | Start all infrastructure services |
| `npm run services:down` | Stop all infrastructure services |
| `npm run services:logs` | View service logs |
| `npm run services:kafka` | Start only Kafka (and Zookeeper) for event tests |

### Making Kafka work with the mock server

1. **Start Kafka** (and Zookeeper):
   ```bash
   npm run services:kafka
   ```
   Or start everything: `npm run services:up`.

2. **Start the mock server with Kafka enabled** (so it publishes reading events to Kafka):
   ```bash
   # Windows (PowerShell)
   $env:KAFKA_BROKER="127.0.0.1:9092"; npm run server

   # Windows (CMD)
   set KAFKA_BROKER=127.0.0.1:9092 && npm run server

   # macOS / Linux
   KAFKA_BROKER=127.0.0.1:9092 npm run server
   ```

3. **Run Kafka tests:**
   ```bash
   npm run test:kafka
   ```
   With Kafka running, the mock server will publish each new reading (from `POST /api/readings` and `POST /api/readings/batch`) to the `energy-readings` topic. You can override the topic with `KAFKA_TOPIC_READINGS`.

## Test Infrastructure

### Mock API Server

The test suite includes a fully functional Express.js mock server (`mock-server.ts`) that provides:

- **REST API endpoints** for energy readings and device management
- **GraphQL API** with queries and mutations
- **WebSocket server** for real-time updates
- **E2E Dashboard UI** at `/dashboard` with:
  - Device listing with real-time energy readings
  - Search and filter functionality (by type and status)
  - Responsive design (mobile, tablet, desktop)
  - WebSocket status indicator
  - Device detail pages at `/devices/:id`

**Sample Devices:**
- Device 1 (Grid, Active)
- Solar Panel Array (Solar, Active)
- Device 2 (Wind, Inactive)
- Battery Storage Unit (Battery, Maintenance)

### Docker Services

The test suite uses Docker Compose to spin up required services:

- **Kafka** (port 9092) - Event streaming
- **Zookeeper** (port 2181) - Kafka coordination
- **Redis** (port 6379) - Caching and message queues
- **PostgreSQL** (port 5432) - Database

### Starting Services

```bash
docker-compose up -d
```

### Checking Service Health

```bash
docker-compose ps
```

### Viewing Logs

```bash
docker-compose logs -f
```

### Stopping Services

```bash
docker-compose down
```

## Project Structure

```
energy-platform-test-suite/
├── src/
│   ├── api/                      # API Tests
│   │   ├── rest/                 # REST API tests
│   │   │   └── energy-readings.spec.ts
│   │   └── graphql/              # GraphQL tests
│   │       └── device-queries.spec.ts
│   ├── event-driven/             # Event-Driven Tests
│   │   ├── kafka/                # Kafka event streaming
│   │   │   └── event-flow.spec.ts
│   │   └── message-queue/        # Redis message queues
│   │       └── fifo-ordering.spec.ts
│   ├── e2e/                      # End-to-End Tests
│   │   └── cypress/
│   │       └── e2e/
│   │           └── device-dashboard.cy.ts
│   ├── performance/              # Performance Tests
│   │   └── load-testing.spec.ts
│   ├── websocket/                # WebSocket Tests
│   │   └── real-time-updates.spec.ts
│   └── helpers/                  # Test Utilities
│       ├── builders/             # Test data builders
│       │   ├── device-builder.ts
│       │   ├── reading-builder.ts
│       │   └── builders.spec.ts
│       ├── fixtures/             # Test fixtures
│       │   └── test-fixtures.ts
│       └── test-setup.ts         # Global test setup
├── .github/
│   └── workflows/
│       └── ci.yml                # CI/CD pipeline
├── docker-compose.yml            # Infrastructure services
├── jest.config.js                # Jest configuration
├── cypress.config.ts             # Cypress configuration
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies & scripts
```

## Test Builders

The test suite includes powerful builder classes for creating test data:

### DeviceBuilder

```typescript
import { DeviceBuilder, DeviceType } from './helpers/builders/device-builder';

// Create a basic device
const device = new DeviceBuilder().build();

// Create a solar panel
const solarPanel = new DeviceBuilder()
  .withName('Solar Panel 1')
  .asSolarPanel()
  .withLocation('Building A - Roof')
  .build();

// Create a device in maintenance
const maintenanceDevice = new DeviceBuilder()
  .inMaintenance()
  .build();

// Create multiple devices
const devices = new DeviceBuilder().buildMany(10);
```

### ReadingBuilder

```typescript
import { ReadingBuilder } from './helpers/builders/reading-builder';

// Create a basic reading
const reading = new ReadingBuilder().build();

// Create a reading with specific values
const customReading = new ReadingBuilder()
  .withDeviceId('device-123')
  .withValue(150.5)
  .withUnit('kWh')
  .build();

// Create time series data
const timeSeries = new ReadingBuilder()
  .withDeviceId('device-123')
  .buildTimeSeries(96, 15); // 96 readings, 15 min intervals

// Create abnormal reading
const anomaly = new ReadingBuilder()
  .withAbnormalValue()
  .build();
```

### TestFixtures

Pre-configured test scenarios:

```typescript
import { TestFixtures } from './helpers/fixtures/test-fixtures';

// Standard device set
const devices = TestFixtures.createStandardDeviceSet();

// Device with historical data
const { device, readings } = TestFixtures.createDeviceWithHistory(100);

// Anomaly scenario
const anomalyData = TestFixtures.createAnomalyScenario();

// Solar generation pattern
const solarReadings = TestFixtures.createSolarGenerationPattern('device-123');
```

## Test Coverage

**Current Status: 97/97 tests passing (100%)**

- ✅ Unit Tests: 65/65 passing
- ✅ Kafka Tests: 5/5 passing
- ✅ Performance Tests: 10/10 passing
- ✅ E2E Tests: 17/17 passing

The test suite covers:

### ✅ API Testing
- REST API endpoints (CRUD operations)
- GraphQL queries and mutations
- Request validation
- Error handling
- Response formatting

### ✅ Event-Driven Architecture
- Kafka event publishing and consuming
- Message partitioning
- Batch processing
- Error handling and retries
- Redis message queues (FIFO ordering)
- Dead letter queues

### ✅ Real-time Communication
- WebSocket connections
- Real-time data updates
- Room-based broadcasting
- Connection management
- High-frequency updates

### ✅ Performance Testing
- Load testing (100+ req/s)
- Burst traffic handling (1000 concurrent requests)
- Response time benchmarks
- Throughput testing
- Stress testing
- Memory leak detection

### ✅ End-to-End Testing
- Dashboard navigation
- Device management
- Real-time updates
- Filtering and search
- Data export
- Responsive design

## CI/CD

[![CI Status](https://github.com/yuri-spizhovyi-mit/energy-platform-test-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/yuri-spizhovyi-mit/energy-platform-test-suite/actions/workflows/ci.yml)

Tests run automatically on GitHub Actions for:
- Every push to `main` branch
- Every pull request

### Pipeline Stages

The CI pipeline runs the following jobs in parallel:

1. **Test** (~5-6 minutes)
   - Starts Kafka, Zookeeper, PostgreSQL, and Redis services
   - Runs all unit tests (65 tests)
   - Runs Kafka event flow tests (5 tests)
   - Runs performance tests (10 tests)
   - Runs Cypress E2E tests (17 tests)
   - Uploads test artifacts (videos, screenshots)

2. **Lint** (~40 seconds)
   - TypeScript type checking
   - ESLint code quality checks

### Service Configuration

The CI pipeline uses Docker containers for:
- **PostgreSQL 15** - Database tests
- **Redis 7** - Caching and message queue tests
- **Kafka + Zookeeper 7.5.0** - Event streaming tests (with dual listener configuration)

### Requirements

- Node.js 20 (for Cypress 15 compatibility)
- All services must be healthy before tests run
- E2E tests require the mock server to be running on port 3000

## Troubleshooting

### Tests Failing Due to Services Not Running

**Problem:** Tests fail with connection errors

**Solution:**
```bash
# Start services
npm run services:up

# Wait 30 seconds for services to be ready
# Then run tests
npm test
```

### Kafka Connection Errors

**Problem:** `The group coordinator is not available`

**Solution:**
```bash
# Restart Kafka
docker-compose restart kafka

# Wait 30 seconds, then run tests
```

### Port Already in Use

**Problem:** `Port 9092 is already allocated`

**Solution:**
```bash
# Stop all services
docker-compose down

# Check for processes using the port
# Windows:
netstat -ano | findstr :9092

# Kill the process or restart Docker
```

### TypeScript Errors

**Problem:** Type errors when running tests

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Redis Connection Timeout

**Problem:** Redis tests timing out

**Solution:**
```bash
# Check Redis is running
docker-compose ps redis

# Restart Redis
docker-compose restart redis
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# API Configuration
API_BASE_URL=http://localhost:3000
WS_BASE_URL=http://localhost:3000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka Configuration
KAFKA_BROKER=localhost:9092

# Test Configuration
NODE_ENV=test
```

## Contributing

1. Write tests for new features
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Run linter: `npm run lint`
5. Format code: `npm run format`

## License

ISC
