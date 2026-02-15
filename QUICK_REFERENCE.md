# Quick Reference Guide

## 🚀 Most Common Commands

### Run Tests That Work Right Now

```bash
# Unit tests (no setup needed)
npm run test:unit

# Redis tests (requires Docker)
npm run services:up
npm run test:redis
npm run services:down
```

### Service Management

```bash
# Start all services
npm run services:up

# Check service status
docker-compose ps

# View logs
npm run services:logs

# Stop all services
npm run services:down
```

### Test Commands

```bash
# All tests
npm test

# Specific test suites
npm run test:unit         # Unit tests (builders)
npm run test:api          # API tests
npm run test:kafka        # Kafka tests
npm run test:redis        # Redis tests
npm run test:websocket    # WebSocket tests
npm run test:performance  # Performance tests

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e          # Run Cypress
npm run test:e2e:open     # Open Cypress UI
```

## 📊 Current Status

### ✅ Working Now (No API needed)
```bash
npm run test:unit    # 23 tests passing
npm run test:redis   # 6 tests passing (needs Docker)
```

### ⏳ Waiting for API Server
```bash
npm run test:api          # 11 tests (needs API)
npm run test:websocket    # 10 tests (needs WebSocket)
npm run test:performance  # 7 tests (needs API)
npm run test:e2e          # 8 tests (needs full app)
```

## 🔧 Troubleshooting

### Services Won't Start
```bash
# Stop everything
docker-compose down

# Remove volumes
docker-compose down -v

# Start fresh
npm run services:up
```

### Tests Failing
```bash
# Check services are running
docker-compose ps

# Restart services
npm run services:down
npm run services:up

# Wait 30 seconds, then run tests
```

### Port Conflicts
```bash
# Find what's using the port (Windows)
netstat -ano | findstr :9092

# Stop services
npm run services:down

# Kill the process or restart Docker
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `package.json` | All npm scripts and dependencies |
| `docker-compose.yml` | Infrastructure services |
| `.env` | Environment configuration |
| `jest.config.js` | Test configuration |
| `README.md` | Full documentation |
| `TEST_STATUS.md` | Current test status |

## 🎯 Test Builders

### Quick Examples

```typescript
// Create a device
import { DeviceBuilder } from './helpers/builders/device-builder';
const device = new DeviceBuilder().asSolarPanel().build();

// Create a reading
import { ReadingBuilder } from './helpers/builders/reading-builder';
const reading = new ReadingBuilder()
  .withDeviceId(device.id)
  .withValue(150.5)
  .build();

// Create time series
const readings = new ReadingBuilder()
  .buildTimeSeries(96, 15); // 96 readings, 15 min apart

// Use fixtures
import { TestFixtures } from './helpers/fixtures/test-fixtures';
const devices = TestFixtures.createStandardDeviceSet();
```

## 🌐 Service Ports

| Service | Port | URL |
|---------|------|-----|
| API | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Kafka | 9092 | localhost:9092 |
| Zookeeper | 2181 | localhost:2181 |

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| jest | Test runner |
| ts-jest | TypeScript support |
| supertest | HTTP testing |
| cypress | E2E testing |
| autocannon | Load testing |
| kafkajs | Kafka client |
| ioredis | Redis client |
| socket.io-client | WebSocket client |

## 🎓 Learning Resources

### Test Files to Study
1. `src/helpers/builders/builders.spec.ts` - Unit test examples
2. `src/event-driven/message-queue/fifo-ordering.spec.ts` - Redis examples
3. `src/api/rest/energy-readings.spec.ts` - API test examples

### Documentation
1. `README.md` - Full guide with troubleshooting
2. `SETUP_SUMMARY.md` - What was created
3. `TEST_STATUS.md` - Current test status

## ⚡ Quick Start Workflow

```bash
# 1. Install
npm install

# 2. Test builders (no services needed)
npm run test:unit

# 3. Start services
npm run services:up

# 4. Test Redis
npm run test:redis

# 5. When your API is ready
echo "API_BASE_URL=http://localhost:3000" > .env
npm test

# 6. Stop services
npm run services:down
```

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ `npm run test:unit` shows 23 passing tests
- ✅ `npm run test:redis` shows 6 passing tests
- ✅ `docker-compose ps` shows all services healthy
- ✅ No TypeScript compilation errors

## 💡 Pro Tips

1. **Run only passing tests during development:**
   ```bash
   npm run test:unit
   ```

2. **Watch mode for TDD:**
   ```bash
   npm run test:watch
   ```

3. **Check coverage:**
   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

4. **Debug a specific test:**
   ```bash
   npm test -- builders.spec
   ```

5. **Keep services running:**
   ```bash
   npm run services:up
   # Leave running while developing
   # Stop when done: npm run services:down
   ```

## 📞 Need Help?

Check these files in order:
1. `QUICK_REFERENCE.md` (this file) - Quick commands
2. `TEST_STATUS.md` - What's working now
3. `README.md` - Full documentation
4. `SETUP_SUMMARY.md` - What was created

---

**Remember:** The "failing" API tests are actually working correctly! They're just waiting for your API server to be available. The test infrastructure is complete and ready to use. 🚀
