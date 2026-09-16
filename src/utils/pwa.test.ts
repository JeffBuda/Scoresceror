import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isIOSDevice,
  isInStandaloneMode,
  requestPersistentStorage,
  shouldShowIOSInstallPrompt,
} from './pwa';

describe('pwa utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isIOSDevice', () => {
    it('should return true for iPhone user agent', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        maxTouchPoints: 5,
      });
      expect(isIOSDevice()).toBe(true);
    });

    it('should return true for iPad user agent', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
        maxTouchPoints: 5,
      });
      expect(isIOSDevice()).toBe(true);
    });

    it('should return true for iPod user agent', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPod; CPU iPhone OS 14_0 like Mac OS X)',
        maxTouchPoints: 5,
      });
      expect(isIOSDevice()).toBe(true);
    });

    it('should return true for iPadOS Mac user agent with touch points', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
      });
      expect(isIOSDevice()).toBe(true);
    });

    it('should return false for desktop Mac user agent (no touch)', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        maxTouchPoints: 1,
      });
      expect(isIOSDevice()).toBe(false);
    });

    it('should return false for Windows user agent', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        maxTouchPoints: 0,
      });
      expect(isIOSDevice()).toBe(false);
    });

    it('should return false when navigator is undefined', () => {
      vi.stubGlobal('navigator', undefined);
      expect(isIOSDevice()).toBe(false);
    });
  });

  describe('isInStandaloneMode', () => {
    it('should return true when display-mode is standalone', () => {
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: true }),
      });
      expect(isInStandaloneMode()).toBe(true);
    });

    it('should return false when display-mode is not standalone', () => {
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      });
      expect(isInStandaloneMode()).toBe(false);
    });

    it('should return false when window is undefined', () => {
      vi.stubGlobal('window', undefined);
      expect(isInStandaloneMode()).toBe(false);
    });
  });

  describe('requestPersistentStorage', () => {
    it('should call navigator.storage.persist and return true', async () => {
      const mockPersist = vi.fn().mockResolvedValue(true);
      vi.stubGlobal('navigator', {
        storage: { persist: mockPersist },
      });
      const result = await requestPersistentStorage();
      expect(result).toBe(true);
      expect(mockPersist).toHaveBeenCalled();
    });

    it('should return true when persist resolves false', async () => {
      const mockPersist = vi.fn().mockResolvedValue(false);
      vi.stubGlobal('navigator', {
        storage: { persist: mockPersist },
      });
      const result = await requestPersistentStorage();
      expect(result).toBe(false);
      expect(mockPersist).toHaveBeenCalled();
    });

    it('should return false when persist is not available', async () => {
      vi.stubGlobal('navigator', {
        storage: {},
      });
      const result = await requestPersistentStorage();
      expect(result).toBe(false);
    });

    it('should return false when storage is not available', async () => {
      vi.stubGlobal('navigator', {});
      const result = await requestPersistentStorage();
      expect(result).toBe(false);
    });

    it('should return false when navigator is undefined', async () => {
      vi.stubGlobal('navigator', undefined);
      const result = await requestPersistentStorage();
      expect(result).toBe(false);
    });

    it('should return false if persist throws', async () => {
      const mockPersist = vi.fn().mockRejectedValue(new Error('Not allowed'));
      vi.stubGlobal('navigator', {
        storage: { persist: mockPersist },
      });
      const result = await requestPersistentStorage();
      expect(result).toBe(false);
    });
  });

  describe('shouldShowIOSInstallPrompt', () => {
    it('should return true for iOS device not in standalone mode', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        maxTouchPoints: 5,
      });
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      });
      expect(shouldShowIOSInstallPrompt()).toBe(true);
    });

    it('should return false for iOS device in standalone mode', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        maxTouchPoints: 5,
      });
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: true }),
      });
      expect(shouldShowIOSInstallPrompt()).toBe(false);
    });

    it('should return false for non-iOS device', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        maxTouchPoints: 0,
      });
      vi.stubGlobal('window', {
        matchMedia: vi.fn().mockReturnValue({ matches: false }),
      });
      expect(shouldShowIOSInstallPrompt()).toBe(false);
    });
  });
});
