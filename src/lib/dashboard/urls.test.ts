import { describe, expect, it } from 'vitest';

import { normalizeHttpUrl } from './urls';

describe('normalizeHttpUrl', () => {
  it('adds HTTPS to bare domains used by lead forms', () => {
    expect(normalizeHttpUrl('company.com')).toBe('https://company.com/');
    expect(normalizeHttpUrl('linkedin.com/company/luxa')).toBe(
      'https://linkedin.com/company/luxa',
    );
  });

  it('preserves valid HTTP and HTTPS links', () => {
    expect(normalizeHttpUrl('https://example.com/path?q=1')).toBe(
      'https://example.com/path?q=1',
    );
    expect(normalizeHttpUrl('http://example.com')).toBe('http://example.com/');
  });

  it('keeps empty optional fields empty', () => {
    expect(normalizeHttpUrl(undefined)).toBeUndefined();
    expect(normalizeHttpUrl('   ')).toBeUndefined();
  });

  it('rejects unsafe protocols, credentials, and relative paths', () => {
    expect(normalizeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeHttpUrl('https://user:secret@example.com')).toBeNull();
    expect(normalizeHttpUrl('/dashboard/leads')).toBeNull();
  });
});
