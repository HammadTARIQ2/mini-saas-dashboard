import { afterEach, describe, expect, it } from 'vitest';
import { tokenStorage } from './token-storage';

describe('tokenStorage', () => {
  afterEach(() => tokenStorage.clear());

  it('persists "remember me" sessions in localStorage', () => {
    tokenStorage.set('long-lived', { remember: true });
    expect(localStorage.length).toBe(1);
    expect(sessionStorage.length).toBe(0);
    expect(tokenStorage.get()).toBe('long-lived');
  });

  it('keeps other sessions in sessionStorage only', () => {
    tokenStorage.set('short-lived', { remember: false });
    expect(localStorage.length).toBe(0);
    expect(tokenStorage.get()).toBe('short-lived');
  });

  it('replaces any previous token and clears both stores', () => {
    tokenStorage.set('old', { remember: true });
    tokenStorage.set('new', { remember: false });
    expect(localStorage.length).toBe(0);
    expect(tokenStorage.get()).toBe('new');

    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });
});
