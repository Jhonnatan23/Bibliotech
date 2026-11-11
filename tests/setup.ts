import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Define environment variables for testing clean run without .env
process.env.NODE_ENV = 'test';
process.env.VITE_APP_ENV = 'test';
process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GOOGLE_BOOKS_API_KEY = 'test-google-books-key';
process.env.EMAIL_ENABLED = 'false';
process.env.PORT = '3000';

// Stub environment variables using Vitest vi.stubEnv
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('VITE_APP_ENV', 'test');
vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature');
vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
vi.stubEnv('GOOGLE_BOOKS_API_KEY', 'test-google-books-key');
vi.stubEnv('PORT', '3000');

// Mock IntersectionObserver and ResizeObserver for jsdom
if (typeof window !== 'undefined') {
  class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });

  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: MockResizeObserver,
  });
  Object.defineProperty(global, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: MockResizeObserver,
  });
}
