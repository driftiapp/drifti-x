import '@testing-library/jest-dom';

// Set up test environment variables
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test' });

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 