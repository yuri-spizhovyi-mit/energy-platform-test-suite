/// <reference types="jest" />
import request from "supertest";
import { DeviceBuilder } from "../../helpers/builders/device-builder";

describe("Device GraphQL Queries", () => {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  const graphqlEndpoint = "/graphql";
  // Use existing device from mock server
  const EXISTING_DEVICE_ID = "EAGLE-200-12345";

  describe("Query: device", () => {
    it("should fetch device by ID", async () => {
      const query = `
        query GetDevice($id: ID!) {
          device(id: $id) {
            id
            name
            type
            location
            status
            lastReading {
              kwh
              voltage
              timestamp
            }
          }
        }
      `;

      const response = await request(baseUrl)
        .post(graphqlEndpoint)
        .send({
          query,
          variables: { id: EXISTING_DEVICE_ID },
        })
        .expect(200);

      expect(response.body.data.device).toMatchObject({
        id: EXISTING_DEVICE_ID,
        name: expect.any(String),
        type: expect.any(String),
        status: expect.stringMatching(/active|inactive|maintenance/),
      });
    });

    it("should return null for non-existent device", async () => {
      const query = `
        query GetDevice($id: ID!) {
          device(id: $id) {
            id
            name
          }
        }
      `;

      const response = await request(baseUrl)
        .post(graphqlEndpoint)
        .send({
          query,
          variables: { id: "non-existent" },
        })
        .expect(200);

      expect(response.body.data.device).toBeNull();
    });
  });

  describe("Query: devices", () => {
    it("should fetch all devices with pagination", async () => {
      const query = `
        query GetDevices($limit: Int, $offset: Int) {
          devices(limit: $limit, offset: $offset) {
            total
            items {
              id
              name
              type
              status
            }
          }
        }
      `;

      const response = await request(baseUrl)
        .post(graphqlEndpoint)
        .send({
          query,
          variables: { limit: 10, offset: 0 },
        })
        .expect(200);

      expect(response.body.data.devices).toMatchObject({
        total: expect.any(Number),
        items: expect.any(Array),
      });
    });

    it("should filter devices by type", async () => {
      const query = `
        query GetDevicesByType($filter: DeviceFilter) {
          devices(filter: $filter) {
            items {
              id
              type
            }
          }
        }
      `;

      const response = await request(baseUrl)
        .post(graphqlEndpoint)
        .send({
          query,
          variables: {
            filter: {
              type: ["solar"],
            },
          },
        })
        .expect(200);

      const devices = response.body.data.devices.items;
      expect(devices.every((d: any) => d.type === "solar")).toBe(true);
    });
  });

  describe("Mutation: updateDevice", () => {
    it("should update device status", async () => {
      const mutation = `
        mutation UpdateDevice($id: ID!, $input: DeviceUpdateInput!) {
          updateDevice(id: $id, input: $input) {
            id
            status
          }
        }
      `;

      const response = await request(baseUrl)
        .post(graphqlEndpoint)
        .send({
          query: mutation,
          variables: {
            id: EXISTING_DEVICE_ID,
            input: { status: "maintenance" },
          },
        })
        .expect(200);

      expect(response.body.data.updateDevice).toMatchObject({
        id: EXISTING_DEVICE_ID,
        status: "maintenance",
      });
    });
  });
});
