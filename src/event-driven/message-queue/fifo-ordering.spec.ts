import Redis from 'ioredis';
import { ReadingBuilder } from '../../helpers/builders/reading-builder';

describe('Message Queue FIFO Ordering', () => {
  let redis: Redis;
  const QUEUE_KEY = 'energy:readings:queue';

  beforeAll(async () => {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
    });
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    // Clear queue before each test
    await redis.del(QUEUE_KEY);
  });

  describe('FIFO Queue Operations', () => {
    it('should maintain FIFO order for messages', async () => {
      const readings = Array.from({ length: 5 }, (_, i) =>
        new ReadingBuilder().withValue(100 + i).build()
      );

      // Push messages to queue
      for (const reading of readings) {
        await redis.rpush(QUEUE_KEY, JSON.stringify(reading));
      }

      // Pop messages and verify order
      const receivedReadings = [];
      for (let i = 0; i < 5; i++) {
        const message = await redis.lpop(QUEUE_KEY);
        if (message) {
          receivedReadings.push(JSON.parse(message));
        }
      }

      expect(receivedReadings).toHaveLength(5);
      expect(receivedReadings.map((r) => r.value)).toEqual([100, 101, 102, 103, 104]);
    });

    it('should handle concurrent producers', async () => {
      const producers = Array.from({ length: 3 }, (_, producerId) =>
        Array.from({ length: 10 }, (_, i) =>
          new ReadingBuilder()
            .withDeviceId(`device-${producerId}`)
            .withValue(i)
            .build()
        )
      );

      // Simulate concurrent producers
      await Promise.all(
        producers.map((readings) =>
          Promise.all(
            readings.map((reading) =>
              redis.rpush(QUEUE_KEY, JSON.stringify(reading))
            )
          )
        )
      );

      const queueLength = await redis.llen(QUEUE_KEY);
      expect(queueLength).toBe(30); // 3 producers * 10 messages
    });

    it('should support priority queues', async () => {
      const highPriorityQueue = 'energy:readings:high';
      const normalPriorityQueue = 'energy:readings:normal';

      const highPriorityReading = new ReadingBuilder()
        .withValue(1000)
        .build();
      const normalReading = new ReadingBuilder().withValue(100).build();

      await redis.rpush(normalPriorityQueue, JSON.stringify(normalReading));
      await redis.rpush(highPriorityQueue, JSON.stringify(highPriorityReading));

      // Process high priority first
      const highPriorityMessage = await redis.lpop(highPriorityQueue);
      const normalMessage = await redis.lpop(normalPriorityQueue);

      expect(JSON.parse(highPriorityMessage!).value).toBe(1000);
      expect(JSON.parse(normalMessage!).value).toBe(100);

      await redis.del(highPriorityQueue, normalPriorityQueue);
    });
  });

  describe('Message Processing', () => {
    it('should process messages with acknowledgment', async () => {
      const reading = new ReadingBuilder().build();
      const processingKey = `${QUEUE_KEY}:processing`;

      // Add to queue
      await redis.rpush(QUEUE_KEY, JSON.stringify(reading));

      // Move to processing
      const message = await redis.rpoplpush(QUEUE_KEY, processingKey);
      expect(message).toBeTruthy();

      // Simulate processing
      const processed = JSON.parse(message!);
      expect(processed.deviceId).toBe(reading.deviceId);

      // Remove from processing (acknowledge)
      await redis.lrem(processingKey, 1, message!);

      const processingLength = await redis.llen(processingKey);
      expect(processingLength).toBe(0);
    });

    it('should handle message timeouts and reprocessing', async () => {
      const reading = new ReadingBuilder().build();
      const messageId = `msg:${Date.now()}`;

      // Add message with expiry
      await redis.setex(
        `${QUEUE_KEY}:${messageId}`,
        5, // 5 seconds TTL
        JSON.stringify(reading)
      );

      const storedMessage = await redis.get(`${QUEUE_KEY}:${messageId}`);
      expect(storedMessage).toBeTruthy();

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 6000));

      const expiredMessage = await redis.get(`${QUEUE_KEY}:${messageId}`);
      expect(expiredMessage).toBeNull();
    });
  });

  describe('Dead Letter Queue', () => {
    it('should move failed messages to DLQ', async () => {
      const dlqKey = 'energy:readings:dlq';
      const reading = new ReadingBuilder().build();

      // Simulate failed processing
      const maxRetries = 3;
      for (let i = 0; i < maxRetries; i++) {
        await redis.rpush(QUEUE_KEY, JSON.stringify(reading));
        // Simulate failure
        await redis.lpop(QUEUE_KEY);
      }

      // Move to DLQ after max retries
      await redis.rpush(dlqKey, JSON.stringify(reading));

      const dlqLength = await redis.llen(dlqKey);
      expect(dlqLength).toBe(1);

      await redis.del(dlqKey);
    });
  });
});
