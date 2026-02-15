# Mock API Server Documentation

## 🚀 Quick Start

### Start the Server

```bash
# Production mode
npm run server

# Development mode (auto-restart on changes)
npm run server:dev
```

The server will start on **http://localhost:3000**

## 📋 Features

### ✅ REST API Endpoints
- Full CRUD operations for devices and readings
- Validation for device ID format (EAGLE-200-XXXXX)
- Automatic data cleanup (keeps last 100 readings per device)

### ✅ GraphQL API
- Complete GraphQL schema with queries and mutations
- GraphiQL interface at http://localhost:3000/graphql
- Support for filtering and pagination

### ✅ WebSocket Server
- Real-time updates via Socket.IO
- Subscribe to device-specific updates
- Subscribe to status changes
- Automatic simulation every 5 seconds

### ✅ Data Simulation
- Generates realistic readings every 5 seconds
- Solar panels generate power during daytime (6 AM - 6 PM)
- Grid meters show consumption patterns
- Automatic WebSocket broadcasting

## 🌐 REST API Endpoints

### 1. Create Energy Reading

**POST** `/api/readings`

**Request Body:**
```json
{
  "deviceId": "EAGLE-200-12345",
  "kwh": 12.5,
  "voltage": 240,
  "readingType": "consumption"
}
```

**Validation Rules:**
- `deviceId` must match format `EAGLE-200-XXXXX`
- `kwh` is required
- `kwh` cannot be negative for consumption readings
- Device must exist

**Response (201):**
```json
{
  "id": "reading-1234567890-abc123",
  "deviceId": "EAGLE-200-12345",
  "timestamp": "2026-02-10T04:00:00.000Z",
  "kwh": 12.5,
  "voltage": 240,
  "readingType": "consumption"
}
```

**Error Responses:**
- `400` - Invalid device ID format or negative kWh
- `404` - Device not found

---

### 2. Get Device Readings

**GET** `/api/readings/:deviceId`

**Example:**
```bash
GET http://localhost:3000/api/readings/EAGLE-200-12345
```

**Response (200):**
```json
{
  "deviceId": "EAGLE-200-12345",
  "readings": [
    {
      "id": "reading-1234567890-abc123",
      "deviceId": "EAGLE-200-12345",
      "timestamp": "2026-02-10T04:00:00.000Z",
      "kwh": 12.5,
      "voltage": 240,
      "readingType": "consumption"
    }
  ],
  "count": 1
}
```

---

### 3. Get Aggregated Statistics

**GET** `/api/readings/:deviceId/aggregate`

**Query Parameters:**
- `period` (optional) - Time period (default: "all")

**Example:**
```bash
GET http://localhost:3000/api/readings/EAGLE-200-12345/aggregate?period=daily
```

**Response (200):**
```json
{
  "deviceId": "EAGLE-200-12345",
  "period": "daily",
  "aggregates": [
    {
      "date": "2026-02-10",
      "total": 125.5,
      "average": 10.46,
      "min": 5.2,
      "max": 15.8,
      "count": 12
    }
  ]
}
```

---

### 4. List All Devices

**GET** `/api/devices`

**Response (200):**
```json
{
  "devices": [
    {
      "id": "EAGLE-200-12345",
      "name": "Main Building Meter",
      "status": "active",
      "type": "grid",
      "location": "Building A - Main Entrance",
      "utilityId": "UTIL-001"
    },
    {
      "id": "EAGLE-200-67890",
      "name": "Solar Panel Array",
      "status": "active",
      "type": "solar",
      "location": "Building A - Rooftop",
      "utilityId": "UTIL-001"
    }
  ],
  "total": 2
}
```

---

### 5. Get Single Device

**GET** `/api/devices/:id`

**Example:**
```bash
GET http://localhost:3000/api/devices/EAGLE-200-12345
```

**Response (200):**
```json
{
  "id": "EAGLE-200-12345",
  "name": "Main Building Meter",
  "status": "active",
  "type": "grid",
  "location": "Building A - Main Entrance",
  "utilityId": "UTIL-001",
  "lastReading": {
    "id": "reading-1234567890-abc123",
    "deviceId": "EAGLE-200-12345",
    "timestamp": "2026-02-10T04:00:00.000Z",
    "kwh": 12.5,
    "voltage": 240,
    "readingType": "consumption"
  },
  "readingCount": 42
}
```

---

### 6. Update Device

**PUT** `/api/devices/:id`

**Request Body:**
```json
{
  "status": "maintenance",
  "location": "Building A - Floor 2"
}
```

**Response (200):**
```json
{
  "id": "EAGLE-200-12345",
  "name": "Main Building Meter",
  "status": "maintenance",
  "type": "grid",
  "location": "Building A - Floor 2",
  "utilityId": "UTIL-001"
}
```

**Note:** Status updates are automatically broadcast to WebSocket subscribers

---

## 🔷 GraphQL API

### Endpoint

**POST** `/graphql`

**GraphiQL UI:** http://localhost:3000/graphql

### Schema

```graphql
type Device {
  id: ID!
  name: String!
  status: String!
  type: String!
  location: String!
  utilityId: String!
  lastReading: Reading
  readings: [Reading!]!
}

type Reading {
  id: ID!
  deviceId: String!
  timestamp: String!
  kwh: Float!
  voltage: Float!
  readingType: String!
}

type DevicesResponse {
  items: [Device!]!
  total: Int!
}

input DeviceFilter {
  type: String
  status: String
}

input UpdateDeviceInput {
  name: String
  status: String
  location: String
}

type Query {
  device(id: ID!): Device
  devices(filter: DeviceFilter, limit: Int, offset: Int): DevicesResponse!
}

type Mutation {
  updateDevice(id: ID!, input: UpdateDeviceInput!): Device
}
```

### Example Queries

#### 1. Get Device by ID

```graphql
query GetDevice {
  device(id: "EAGLE-200-12345") {
    id
    name
    status
    type
    location
    lastReading {
      kwh
      timestamp
      voltage
    }
  }
}
```

#### 2. List All Devices with Pagination

```graphql
query GetDevices {
  devices(limit: 10, offset: 0) {
    total
    items {
      id
      name
      status
      type
      lastReading {
        kwh
        timestamp
      }
    }
  }
}
```

#### 3. Filter Devices by Type

```graphql
query GetSolarDevices {
  devices(filter: { type: "solar" }) {
    total
    items {
      id
      name
      type
      readings {
        kwh
        timestamp
      }
    }
  }
}
```

#### 4. Update Device

```graphql
mutation UpdateDevice {
  updateDevice(
    id: "EAGLE-200-12345"
    input: { status: "maintenance" }
  ) {
    id
    status
    updatedAt
  }
}
```

---

## 🔌 WebSocket API

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

### Events

#### 1. Subscribe to Device Updates

**Emit:** `subscribe`

```javascript
socket.emit('subscribe', { deviceId: 'EAGLE-200-12345' });

socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data.deviceId);
});
```

#### 2. Receive Reading Updates

**Listen:** `reading:update`

```javascript
socket.on('reading:update', (data) => {
  console.log('New reading:', data);
  // {
  //   deviceId: 'EAGLE-200-12345',
  //   value: 12.5,
  //   timestamp: '2026-02-10T04:00:00.000Z',
  //   voltage: 240
  // }
});
```

#### 3. Subscribe to Status Updates

**Emit:** `subscribe:status`

```javascript
socket.emit('subscribe:status', { deviceId: 'EAGLE-200-12345' });

socket.on('subscribed:status', (data) => {
  console.log('Subscribed to status updates');
});
```

#### 4. Receive Status Updates

**Listen:** `device:status`

```javascript
socket.on('device:status', (data) => {
  console.log('Status changed:', data);
  // {
  //   deviceId: 'EAGLE-200-12345',
  //   status: 'maintenance',
  //   timestamp: '2026-02-10T04:00:00.000Z'
  // }
});
```

#### 5. Unsubscribe from Device

**Emit:** `unsubscribe`

```javascript
socket.emit('unsubscribe', { deviceId: 'EAGLE-200-12345' });
```

#### 6. Send New Reading (Client-initiated)

**Emit:** `reading:new`

```javascript
socket.emit('reading:new', {
  id: 'reading-123',
  deviceId: 'EAGLE-200-12345',
  timestamp: new Date().toISOString(),
  kwh: 12.5,
  voltage: 240,
  readingType: 'consumption'
});
```

#### 7. Update Device Status (Client-initiated)

**Emit:** `device:update-status`

```javascript
socket.emit('device:update-status', {
  deviceId: 'EAGLE-200-12345',
  status: 'maintenance'
});
```

---

## 📊 Real-time Simulation

The server automatically generates readings every **5 seconds** for all devices:

### Solar Panel Behavior
- **Daytime (6 AM - 6 PM):** Generates -2 to -7 kWh (power generation)
- **Nighttime:** 0 kWh (no generation)

### Grid Meter Behavior
- **Always:** Consumes 5 to 15 kWh

### Data Management
- Keeps last **100 readings** per device
- Automatically removes older readings
- Broadcasts to WebSocket subscribers

---

## 🎯 Sample Devices

### Device 1: Main Building Meter
```json
{
  "id": "EAGLE-200-12345",
  "name": "Main Building Meter",
  "status": "active",
  "type": "grid",
  "location": "Building A - Main Entrance",
  "utilityId": "UTIL-001"
}
```

### Device 2: Solar Panel Array
```json
{
  "id": "EAGLE-200-67890",
  "name": "Solar Panel Array",
  "status": "active",
  "type": "solar",
  "location": "Building A - Rooftop",
  "utilityId": "UTIL-001"
}
```

---

## 🧪 Testing with the Mock Server

### 1. Start the Mock Server

```bash
npm run server
```

### 2. Start Infrastructure Services

```bash
npm run services:up
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api
npm run test:websocket
npm run test:performance
```

### 4. Test with curl

```bash
# Get all devices
curl http://localhost:3000/api/devices

# Get device readings
curl http://localhost:3000/api/readings/EAGLE-200-12345

# Create a reading
curl -X POST http://localhost:3000/api/readings \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "EAGLE-200-12345",
    "kwh": 12.5,
    "voltage": 240,
    "readingType": "consumption"
  }'

# Update device status
curl -X PUT http://localhost:3000/api/devices/EAGLE-200-12345 \
  -H "Content-Type: application/json" \
  -d '{"status": "maintenance"}'
```

### 5. Test GraphQL with GraphiQL

Open http://localhost:3000/graphql in your browser and try the example queries!

---

## 🔧 Configuration

### Environment Variables

```bash
PORT=3000  # Server port (default: 3000)
```

### Constants

In `mock-server.ts`:

```typescript
const MAX_READINGS_PER_DEVICE = 100;  // Max readings to keep
const SIMULATION_INTERVAL = 5000;      // Simulation interval (ms)
```

---

## 📝 Server Logs

The server provides comprehensive logging:

```
🚀 ENERGY PLATFORM MOCK SERVER
📍 Server running on port 3000
🌐 REST API Endpoints: ...
🔷 GraphQL Endpoint: ...
🔌 WebSocket Server: ...
📊 Sample Devices: ...
⚡ Real-time Simulation: ...
✅ Server ready to accept connections!

[2026-02-10T04:00:00.000Z] POST /api/readings
✅ Created reading for EAGLE-200-12345: 12.5 kWh

🔌 WebSocket client connected: abc123
📡 Client abc123 subscribed to device EAGLE-200-12345
📊 Simulated reading for EAGLE-200-12345: 10.2 kWh (1 subscribers)
```

---

## 🛑 Graceful Shutdown

The server handles graceful shutdown on `SIGTERM` and `SIGINT`:

```bash
# Press Ctrl+C
🛑 Shutting down gracefully...
✅ Server closed
```

---

## 🎉 Features Summary

| Feature | Status |
|---------|--------|
| REST API | ✅ Complete |
| GraphQL API | ✅ Complete |
| WebSocket Server | ✅ Complete |
| Real-time Simulation | ✅ Complete |
| Data Validation | ✅ Complete |
| Error Handling | ✅ Complete |
| CORS Support | ✅ Enabled |
| GraphiQL UI | ✅ Available |
| Comprehensive Logging | ✅ Complete |
| Graceful Shutdown | ✅ Complete |
| TypeScript Types | ✅ Complete |

---

## 🚀 Ready to Use!

Your mock server is production-ready and fully featured. Start it with:

```bash
npm run server
```

Then run your tests:

```bash
npm test
```

All tests should now pass! 🎉
