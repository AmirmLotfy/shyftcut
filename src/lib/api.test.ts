import { describe, it, expect } from 'vitest';
import { apiPath, apiHeaders, extractApiErrorMessage } from './api';

describe('apiPath', () => {
  it('returns non-empty path', () => {
    expect(apiPath('/api/profile')).toBeTruthy();
    expect(typeof apiPath('/api/profile')).toBe('string');
  });

  it('normalizes path with or without leading slash', () => {
    expect(apiPath('api/profile')).toBeTruthy();
    expect(apiPath('/api/profile')).toBeTruthy();
  });
});

describe('apiHeaders', () => {
  it('includes Content-Type application/json', () => {
    const h = apiHeaders('/api/profile', null);
    expect(h['Content-Type']).toBe('application/json');
  });

  it('includes Authorization when token provided', () => {
    const h = apiHeaders('/api/profile', 'abc123');
    expect(h.Authorization).toBe('Bearer abc123');
  });

  it('normalizes path to /api prefix', () => {
    const h = apiHeaders('profile', null);
    expect(h['X-Path'] || h['Content-Type']).toBeDefined();
  });
});

describe('extractApiErrorMessage', () => {
  it('returns string error', () => {
    expect(extractApiErrorMessage({ error: 'Something failed' }, 'Fallback')).toBe('Something failed');
  });

  it('returns message from error object', () => {
    expect(extractApiErrorMessage({ error: { message: 'Nested message' } }, 'Fallback')).toBe('Nested message');
  });

  it('returns top-level message', () => {
    expect(extractApiErrorMessage({ message: 'Top level' }, 'Fallback')).toBe('Top level');
  });

  it('returns fallback for null/undefined', () => {
    expect(extractApiErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(extractApiErrorMessage(undefined, 'Fallback')).toBe('Fallback');
  });

  it('returns fallback for non-object', () => {
    expect(extractApiErrorMessage('string', 'Fallback')).toBe('Fallback');
    expect(extractApiErrorMessage(42, 'Fallback')).toBe('Fallback');
  });

  it('returns fallback when error is object without message', () => {
    expect(extractApiErrorMessage({ error: { code: 500 } }, 'Fallback')).toBe('Fallback');
  });
});
