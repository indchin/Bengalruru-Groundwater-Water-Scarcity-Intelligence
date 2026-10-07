import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    testTimeout: 10000,
    env: {
      NODE_ENV: 'test',
      DB_PATH: './data/test.db',
      ADMIN_API_KEY: 'test-admin-key',
      RATE_LIMIT_MAX: '10000', // don't let rate limiting interfere with test runs
    },
  },
});
