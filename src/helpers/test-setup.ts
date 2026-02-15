// Global test setup and configuration

// Set test timeout
jest.setTimeout(30000);

// Global test hooks
beforeAll(async () => {
  console.log('Starting test suite...');
  
  // Wait for services to be ready
  await waitForServices();
});

afterAll(async () => {
  console.log('Test suite completed.');
  
  // Cleanup
  await cleanupTestData();
});

// Helper function to wait for services
async function waitForServices(): Promise<void> {
  const services = [
    { name: 'API', url: process.env.API_BASE_URL || 'http://localhost:3000' },
    { name: 'Redis', host: process.env.REDIS_HOST || 'localhost', port: 6379 },
    { name: 'Kafka', broker: process.env.KAFKA_BROKER || 'localhost:9092' },
  ];

  console.log('Waiting for services to be ready...');
  
  // Add service health check logic here if needed
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  console.log('All services ready.');
}

// Helper function to cleanup test data
async function cleanupTestData(): Promise<void> {
  // Add cleanup logic here if needed
  console.log('Cleaning up test data...');
}

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export test utilities
export const testConfig = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  wsBaseUrl: process.env.WS_BASE_URL || 'http://localhost:3000',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
};
