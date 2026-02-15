import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { buildSchema } from "graphql";
import { graphqlHTTP } from "express-graphql";

// ============================================================================
// TYPES
// ============================================================================

interface EnergyReading {
  id: string;
  deviceId: string;
  timestamp: string;
  kwh: number;
  voltage: number;
  readingType: "consumption" | "generation";
}

interface Device {
  id: string;
  name: string;
  status: "active" | "inactive" | "maintenance";
  type: "grid" | "solar" | "wind" | "battery";
  location: string;
  utilityId: string;
}

interface AggregateStats {
  deviceId: string;
  total: number;
  average: number;
  count: number;
  min: number;
  max: number;
}

// ============================================================================
// IN-MEMORY DATA STORES
// ============================================================================

const devices: Device[] = [
  {
    id: "EAGLE-200-12345",
    name: "Main Building Meter",
    status: "active",
    type: "grid",
    location: "Building A - Main Entrance",
    utilityId: "UTIL-001",
  },
  {
    id: "EAGLE-200-67890",
    name: "Solar Panel Array",
    status: "active",
    type: "solar",
    location: "Building A - Rooftop",
    utilityId: "UTIL-001",
  },
];

const readings: EnergyReading[] = [];
const MAX_READINGS_PER_DEVICE = 100;

// WebSocket subscriptions
const deviceSubscriptions = new Map<string, Set<string>>(); // deviceId -> Set of socketIds
const statusSubscriptions = new Set<string>(); // socketIds subscribed to status updates
const alertSubscriptions = new Map<string, Set<string>>(); // deviceId -> Set of socketIds for alerts
const roomSubscriptions = new Map<string, Set<string>>(); // room -> Set of socketIds

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return `reading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function validateDeviceId(deviceId: string): boolean {
  return /^EAGLE-200-\d{5}$/.test(deviceId);
}

function getDeviceReadings(deviceId: string): EnergyReading[] {
  return readings.filter((r) => r.deviceId === deviceId);
}

function calculateAggregates(deviceId: string): AggregateStats {
  const deviceReadings = getDeviceReadings(deviceId);

  if (deviceReadings.length === 0) {
    return {
      deviceId,
      total: 0,
      average: 0,
      count: 0,
      min: 0,
      max: 0,
    };
  }

  const values = deviceReadings.map((r) => r.kwh);
  const total = values.reduce((sum, val) => sum + val, 0);
  const average = total / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    deviceId,
    total,
    average,
    count: deviceReadings.length,
    min,
    max,
  };
}

function cleanupOldReadings(deviceId: string): void {
  const deviceReadings = getDeviceReadings(deviceId);
  if (deviceReadings.length > MAX_READINGS_PER_DEVICE) {
    // Remove oldest readings
    const toRemove = deviceReadings.length - MAX_READINGS_PER_DEVICE;
    const oldestReadings = deviceReadings
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
      .slice(0, toRemove);

    oldestReadings.forEach((reading) => {
      const index = readings.findIndex((r) => r.id === reading.id);
      if (index !== -1) {
        readings.splice(index, 1);
      }
    });
  }
}

function generateReading(device: Device): EnergyReading {
  let kwh: number;
  let readingType: "consumption" | "generation";

  if (device.type === "solar") {
    // Solar generates power (negative consumption)
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 18) {
      // Daytime generation
      kwh = -(Math.random() * 5 + 2); // -2 to -7 kWh
      readingType = "generation";
    } else {
      // Nighttime - no generation
      kwh = 0;
      readingType = "generation";
    }
  } else {
    // Grid consumption
    kwh = Math.random() * 10 + 5; // 5 to 15 kWh
    readingType = "consumption";
  }

  return {
    id: generateId(),
    deviceId: device.id,
    timestamp: new Date().toISOString(),
    kwh: Math.round(kwh * 100) / 100,
    voltage: Math.round((Math.random() * 10 + 235) * 10) / 10, // 235-245V
    readingType,
  };
}

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

// POST /api/readings - Create energy reading
app.post("/api/readings", (req: Request, res: Response) => {
  const { deviceId, kwh, voltage, readingType } = req.body;

  // Validate device ID format
  if (!deviceId || !validateDeviceId(deviceId)) {
    return res.status(400).json({
      error: "Invalid device ID format. Must match EAGLE-200-XXXXX",
      errors: ["deviceId must match format EAGLE-200-XXXXX"],
    });
  }

  // Validate kWh is not negative for consumption
  if (kwh === undefined || kwh === null) {
    return res.status(400).json({
      error: "Validation failed",
      errors: ["value is required"],
    });
  }

  if (readingType === "consumption" && kwh < 0) {
    return res.status(400).json({
      error: "Invalid kWh value",
      errors: ["Consumption readings cannot be negative"],
    });
  }

  // Check if device exists
  const device = devices.find((d) => d.id === deviceId);
  if (!device) {
    return res.status(404).json({
      error: "Device not found",
    });
  }

  const reading: EnergyReading = {
    id: generateId(),
    deviceId,
    timestamp: new Date().toISOString(),
    kwh: Math.round(kwh * 100) / 100,
    voltage: voltage || 240,
    readingType: readingType || "consumption",
  };

  readings.push(reading);
  cleanupOldReadings(deviceId);

  // Emit to WebSocket subscribers
  const subscribers = deviceSubscriptions.get(deviceId);
  if (subscribers) {
    subscribers.forEach((socketId) => {
      io.to(socketId).emit("reading:update", {
        deviceId: reading.deviceId,
        value: reading.kwh,
        timestamp: reading.timestamp,
        voltage: reading.voltage,
      });
    });
  }

  console.log(`✅ Created reading for ${deviceId}: ${kwh} kWh`);

  res.status(201).json(reading);
});

// GET /api/readings/:deviceId - Get all readings for a device
app.get("/api/readings/:deviceId", (req: Request, res: Response) => {
  const deviceId = req.params.deviceId as string;

  if (!validateDeviceId(deviceId)) {
    return res.status(400).json({
      error: "Invalid device ID format",
    });
  }

  const deviceReadings = getDeviceReadings(deviceId);

  if (deviceReadings.length === 0) {
    return res.status(404).json({
      error: "No readings found for this device",
    });
  }

  res.json(deviceReadings);
});

// GET /api/readings/:deviceId/aggregate - Get aggregated stats
app.get("/api/readings/:deviceId/aggregate", (req: Request, res: Response) => {
  const deviceId = req.params.deviceId as string;

  if (!validateDeviceId(deviceId)) {
    return res.status(400).json({
      error: "Invalid device ID format",
    });
  }

  const stats = calculateAggregates(deviceId);
  res.json(stats);
});

// GET /api/devices - Get all devices
app.get("/api/devices", (req: Request, res: Response) => {
  res.json(devices);
});

// GET /api/devices/:id - Get device by ID
app.get("/api/devices/:id", (req: Request, res: Response) => {
  const device = devices.find((d) => d.id === req.params.id);

  if (!device) {
    return res.status(404).json({
      error: "Device not found",
    });
  }

  res.json(device);
});

// PUT /api/devices/:id - Update device
app.put("/api/devices/:id", (req: Request, res: Response) => {
  const deviceIndex = devices.findIndex((d) => d.id === req.params.id);

  if (deviceIndex === -1) {
    return res.status(404).json({
      error: "Device not found",
    });
  }

  devices[deviceIndex] = {
    ...devices[deviceIndex],
    ...req.body,
    id: req.params.id, // Ensure ID doesn't change
  };

  res.json(devices[deviceIndex]);
});

// POST /api/readings/batch - Batch create readings
app.post("/api/readings/batch", (req: Request, res: Response) => {
  const { readings: batchReadings } = req.body;

  if (!Array.isArray(batchReadings)) {
    return res.status(400).json({
      error: "Batch readings must be an array",
    });
  }

  const created = batchReadings.map((reading) => {
    const newReading: EnergyReading = {
      id: generateId(),
      deviceId: reading.deviceId,
      timestamp: reading.timestamp || new Date().toISOString(),
      kwh: reading.kwh,
      voltage: reading.voltage || 240,
      readingType: reading.readingType || "consumption",
    };

    readings.push(newReading);
    return newReading;
  });

  res.status(201).json({ created: created.length, readings: created });
});

// ============================================================================
// GRAPHQL SCHEMA & RESOLVERS
// ============================================================================

const schema = buildSchema(`
  type Reading {
    id: ID!
    deviceId: String!
    kwh: Float!
    voltage: Float!
    timestamp: String!
    readingType: String!
  }

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

  type DevicesResponse {
    items: [Device!]!
    total: Int!
  }

  input DeviceFilter {
    type: [String!]
    status: [String!]
  }

  input DeviceUpdateInput {
    name: String
    status: String
    type: String
    location: String
  }

  type Query {
    device(id: ID!): Device
    devices(filter: DeviceFilter, limit: Int, offset: Int): DevicesResponse!
  }

  type Mutation {
    updateDevice(id: ID!, input: DeviceUpdateInput!): Device!
  }
`);

const root = {
  device: ({ id }: { id: string | string[] }) => {
    const deviceId = Array.isArray(id) ? id[0] : id;
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return null;

    const deviceReadings = getDeviceReadings(device.id);
    const lastReading =
      deviceReadings.length > 0
        ? deviceReadings.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )[0]
        : null;

    return {
      ...device,
      lastReading,
      readings: deviceReadings,
    };
  },

  devices: ({
    filter,
    limit,
    offset,
  }: {
    filter?: any;
    limit?: number;
    offset?: number;
  }) => {
    let filteredDevices = [...devices];

    if (filter) {
      if (filter.type) {
        const filterType = Array.isArray(filter.type)
          ? filter.type[0]
          : filter.type;
        filteredDevices = filteredDevices.filter((d) => d.type === filterType);
      }
      if (filter.status) {
        const filterStatus = Array.isArray(filter.status)
          ? filter.status[0]
          : filter.status;
        filteredDevices = filteredDevices.filter(
          (d) => d.status === filterStatus,
        );
      }
    }

    const start = offset || 0;
    const end = limit ? start + limit : filteredDevices.length;
    const paginatedDevices = filteredDevices.slice(start, end);

    return {
      items: paginatedDevices.map((device) => {
        const deviceReadings = getDeviceReadings(device.id);
        const lastReading =
          deviceReadings.length > 0
            ? deviceReadings.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime(),
              )[0]
            : null;

        return {
          ...device,
          lastReading,
          readings: deviceReadings,
        };
      }),
      total: filteredDevices.length,
    };
  },

  updateDevice: ({ id, input }: { id: string | string[]; input: any }) => {
    const deviceId = Array.isArray(id) ? id[0] : id;
    const deviceIndex = devices.findIndex((d) => d.id === deviceId);
    if (deviceIndex === -1) {
      throw new Error("Device not found");
    }

    devices[deviceIndex] = {
      ...devices[deviceIndex],
      ...input,
      id: deviceId,
    };

    // Emit status update if status changed
    if (input.status) {
      statusSubscriptions.forEach((socketId) => {
        io.to(socketId).emit("status:update", {
          deviceId,
          status: devices[deviceIndex].status,
          timestamp: new Date().toISOString(),
        });
      });
    }

    const deviceReadings = getDeviceReadings(deviceId);
    const lastReading =
      deviceReadings.length > 0
        ? deviceReadings.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )[0]
        : null;

    return {
      ...devices[deviceIndex],
      lastReading,
      readings: deviceReadings,
      updatedAt: new Date().toISOString(),
    };
  },
};

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true, // Enable GraphiQL interface
  }),
);

// ============================================================================
// WEBSOCKET SERVER
// ============================================================================

io.on("connection", (socket) => {
  console.log(`🔌 WebSocket client connected: ${socket.id}`);

  // Subscribe to device updates
  socket.on("subscribe", ({ deviceId }: { deviceId: string }) => {
    if (!deviceSubscriptions.has(deviceId)) {
      deviceSubscriptions.set(deviceId, new Set());
    }
    deviceSubscriptions.get(deviceId)!.add(socket.id);
    console.log(`📡 Client ${socket.id} subscribed to device ${deviceId}`);

    // Immediately send a test update to confirm subscription
    setTimeout(() => {
      socket.emit("reading:update", {
        deviceId,
        value: Math.random() * 100,
        timestamp: new Date().toISOString(),
        voltage: 240,
      });
    }, 100);
  });

  // Unsubscribe from device updates
  socket.on("unsubscribe", ({ deviceId }: { deviceId: string }) => {
    const subscribers = deviceSubscriptions.get(deviceId);
    if (subscribers) {
      subscribers.delete(socket.id);
      console.log(
        `📡 Client ${socket.id} unsubscribed from device ${deviceId}`,
      );
    }
    socket.emit("unsubscribed", { deviceId });
  });

  // Subscribe to status updates
  socket.on("subscribe:status", ({ deviceId }: { deviceId: string }) => {
    statusSubscriptions.add(socket.id);
    console.log(
      `📡 Client ${socket.id} subscribed to status updates for ${deviceId}`,
    );

    // Immediately send current status
    const device = devices.find((d) => d.id === deviceId);
    if (device) {
      setTimeout(() => {
        socket.emit("status:update", {
          deviceId,
          status: device.status,
          timestamp: new Date().toISOString(),
        });
      }, 100);
    }
  });

  // Subscribe to alerts
  socket.on("subscribe:alerts", ({ deviceId }: { deviceId: string }) => {
    if (!alertSubscriptions.has(deviceId)) {
      alertSubscriptions.set(deviceId, new Set());
    }
    alertSubscriptions.get(deviceId)!.add(socket.id);
    console.log(`📡 Client ${socket.id} subscribed to alerts for ${deviceId}`);

    // Immediately send a test alert
    setTimeout(() => {
      socket.emit("alert:reading", {
        deviceId,
        type: "abnormal",
        message: "Test alert: Reading above normal threshold",
        severity: "warning",
        timestamp: new Date().toISOString(),
      });
    }, 100);
  });

  // Join a room (for location-based broadcasting)
  socket.on("join:room", ({ room }: { room: string }) => {
    socket.join(room);
    if (!roomSubscriptions.has(room)) {
      roomSubscriptions.set(room, new Set());
    }
    roomSubscriptions.get(room)!.add(socket.id);
    console.log(`📡 Client ${socket.id} joined room: ${room}`);

    // Immediately send a room update
    setTimeout(() => {
      socket.emit("room:update", {
        room,
        deviceId: "test-device",
        message: "Room joined successfully",
        timestamp: new Date().toISOString(),
      });
    }, 100);
  });

  // Leave a room
  socket.on("leave:room", ({ room }: { room: string }) => {
    socket.leave(room);
    const roomSubs = roomSubscriptions.get(room);
    if (roomSubs) {
      roomSubs.delete(socket.id);
    }
    console.log(`📡 Client ${socket.id} left room: ${room}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);

    // Remove from all subscriptions
    deviceSubscriptions.forEach((subscribers) => {
      subscribers.delete(socket.id);
    });
    statusSubscriptions.delete(socket.id);
    alertSubscriptions.forEach((subscribers) => {
      subscribers.delete(socket.id);
    });
    roomSubscriptions.forEach((subscribers) => {
      subscribers.delete(socket.id);
    });
  });

  // Handle new reading from client
  socket.on("reading:new", (reading: EnergyReading) => {
    readings.push(reading);
    cleanupOldReadings(reading.deviceId);

    // Broadcast to other subscribers
    const subscribers = deviceSubscriptions.get(reading.deviceId);
    if (subscribers) {
      subscribers.forEach((subscriberId) => {
        if (subscriberId !== socket.id) {
          io.to(subscriberId).emit("reading:update", {
            deviceId: reading.deviceId,
            value: reading.kwh,
            timestamp: reading.timestamp,
            voltage: reading.voltage,
          });
        }
      });
    }
  });

  // Handle device status update from client
  socket.on(
    "device:update-status",
    ({ deviceId, status }: { deviceId: string; status: string }) => {
      const device = devices.find((d) => d.id === deviceId);
      if (device) {
        device.status = status as any;

        // Broadcast to all status subscribers
        statusSubscriptions.forEach((socketId) => {
          io.to(socketId).emit("device:status", {
            deviceId,
            status,
            timestamp: new Date().toISOString(),
          });
        });
      }
    },
  );
});

// ============================================================================
// AUTOMATIC REAL-TIME SIMULATION
// ============================================================================

function simulateRealTimeReadings() {
  devices.forEach((device) => {
    const reading = generateReading(device);
    readings.push(reading);
    cleanupOldReadings(device.id);

    // Emit to WebSocket subscribers
    const subscribers = deviceSubscriptions.get(device.id);
    if (subscribers && subscribers.size > 0) {
      subscribers.forEach((socketId) => {
        io.to(socketId).emit("reading:update", {
          deviceId: reading.deviceId,
          value: reading.kwh,
          timestamp: reading.timestamp,
          voltage: reading.voltage,
        });
      });
      console.log(
        `📊 Simulated reading for ${device.id}: ${reading.kwh} kWh (${subscribers.size} subscribers)`,
      );
    }
  });
}

// Start simulation
const SIMULATION_INTERVAL = 5000; // 5 seconds
setInterval(simulateRealTimeReadings, SIMULATION_INTERVAL);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

httpServer.listen(PORT, () => {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 ENERGY PLATFORM MOCK SERVER");
  console.log("=".repeat(70));
  console.log(`\n📍 Server running on port ${PORT}`);
  console.log(`\n🌐 REST API Endpoints:`);
  console.log(`   POST   http://localhost:${PORT}/api/readings`);
  console.log(`   POST   http://localhost:${PORT}/api/readings/batch`);
  console.log(`   GET    http://localhost:${PORT}/api/readings/:deviceId`);
  console.log(
    `   GET    http://localhost:${PORT}/api/readings/:deviceId/aggregate`,
  );
  console.log(`   GET    http://localhost:${PORT}/api/devices`);
  console.log(`   GET    http://localhost:${PORT}/api/devices/:id`);
  console.log(`   PUT    http://localhost:${PORT}/api/devices/:id`);
  console.log(`\n🔷 GraphQL Endpoint:`);
  console.log(`   POST   http://localhost:${PORT}/graphql`);
  console.log(`   UI     http://localhost:${PORT}/graphql (GraphiQL)`);
  console.log(`\n🔌 WebSocket Server:`);
  console.log(`   ws://localhost:${PORT}`);
  console.log(
    `   Events: subscribe, subscribe:status, subscribe:alerts, join:room`,
  );
  console.log(
    `   Emits: reading:update, status:update, alert:reading, room:update`,
  );
  console.log(`\n📊 Sample Devices:`);
  devices.forEach((device) => {
    console.log(`   • ${device.id} - ${device.name} (${device.type})`);
  });
  console.log(`\n⚡ Real-time Simulation:`);
  console.log(
    `   Generating readings every ${SIMULATION_INTERVAL / 1000} seconds`,
  );
  console.log(`   Keeping last ${MAX_READINGS_PER_DEVICE} readings per device`);
  console.log(`\n✅ Server ready to accept connections!`);
  console.log("=".repeat(70) + "\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
