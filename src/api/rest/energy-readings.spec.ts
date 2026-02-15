import request from "supertest";
import { DeviceBuilder } from "../../helpers/builders/device-builder";
import { ReadingBuilder } from "../../helpers/builders/reading-builder";

describe("Energy Readings REST API", () => {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  // Use existing device from mock server
  const EXISTING_DEVICE_ID = "EAGLE-200-12345";

  describe("POST /api/readings", () => {
    it("should create a new energy reading", async () => {
      const reading = {
        deviceId: EXISTING_DEVICE_ID,
        kwh: 150.5,
        voltage: 240,
        readingType: "consumption",
      };

      const response = await request(baseUrl)
        .post("/api/readings")
        .send(reading)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        deviceId: EXISTING_DEVICE_ID,
        kwh: 150.5,
        timestamp: expect.any(String),
      });
    });

    it("should validate required fields", async () => {
      const response = await request(baseUrl)
        .post("/api/readings")
        .send({})
        .expect(400);

      expect(response.body.errors).toContain(
        "deviceId must match format EAGLE-200-XXXXX",
      );
    });

    it("should reject invalid energy values", async () => {
      const reading = {
        deviceId: EXISTING_DEVICE_ID,
        kwh: -100,
        voltage: 240,
        readingType: "consumption",
      };

      await request(baseUrl).post("/api/readings").send(reading).expect(400);
    });
  });

  describe("GET /api/readings/:deviceId", () => {
    it("should retrieve readings for a device", async () => {
      const response = await request(baseUrl)
        .get(`/api/readings/${EXISTING_DEVICE_ID}`)
        .expect(200);

      // FIXED: Server returns array directly, not wrapped in { readings: [] }
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("deviceId");
      expect(response.body[0]).toHaveProperty("kwh");
      expect(response.body[0]).toHaveProperty("timestamp");
    });

    it("should return 404 for non-existent device", async () => {
      await request(baseUrl).get("/api/readings/EAGLE-200-99999").expect(404);
    });
  });

  describe("GET /api/readings/:deviceId/aggregate", () => {
    it("should return aggregated energy consumption", async () => {
      const response = await request(baseUrl)
        .get(`/api/readings/${EXISTING_DEVICE_ID}/aggregate`)
        .expect(200);

      // FIXED: Server returns simple aggregate object without period or aggregates array
      expect(response.body).toMatchObject({
        deviceId: EXISTING_DEVICE_ID,
        total: expect.any(Number),
        average: expect.any(Number),
        count: expect.any(Number),
        min: expect.any(Number),
        max: expect.any(Number),
      });

      // Verify values are reasonable
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.average).toBeGreaterThan(0);
    });
  });
});
