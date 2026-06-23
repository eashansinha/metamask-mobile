import {
  isValidOriginatorInfo,
  sanitizeOriginatorInfo,
} from './sanitizeOriginatorInfo';

describe('sanitizeOriginatorInfo', () => {
  describe('isValidOriginatorInfo', () => {
    it('returns false for null/undefined', () => {
      expect(isValidOriginatorInfo(null)).toBe(false);
      expect(isValidOriginatorInfo(undefined)).toBe(false);
    });

    it('returns false for non-object values', () => {
      expect(isValidOriginatorInfo('string')).toBe(false);
      expect(isValidOriginatorInfo(123)).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isValidOriginatorInfo({})).toBe(false);
    });

    it('returns false for object with empty url and title', () => {
      expect(isValidOriginatorInfo({ url: '', title: '' })).toBe(false);
    });

    it('returns true for object with valid url', () => {
      expect(isValidOriginatorInfo({ url: 'https://example.com' })).toBe(true);
    });

    it('returns true for object with valid title', () => {
      expect(isValidOriginatorInfo({ title: 'My dApp' })).toBe(true);
    });

    it('returns true for object with both url and title', () => {
      expect(
        isValidOriginatorInfo({ url: 'https://app.uniswap.org', title: 'Uniswap' }),
      ).toBe(true);
    });
  });

  describe('sanitizeOriginatorInfo', () => {
    it('prefixes url with [Unverified] label', () => {
      const result = sanitizeOriginatorInfo({
        url: 'https://app.uniswap.org',
        title: 'Uniswap',
        platform: 'ios',
        dappId: 'test',
      });
      expect(result.url).toBe('[Unverified] https://app.uniswap.org');
    });

    it('prefixes title with [Unverified] label', () => {
      const result = sanitizeOriginatorInfo({
        url: 'https://example.com',
        title: 'Trusted App',
        platform: 'ios',
        dappId: 'test',
      });
      expect(result.title).toBe('[Unverified] Trusted App');
    });

    it('strips the icon field to prevent favicon spoofing', () => {
      const result = sanitizeOriginatorInfo({
        url: 'https://example.com',
        title: 'Example',
        icon: 'https://app.uniswap.org/favicon.ico',
        platform: 'ios',
        dappId: 'test',
      });
      expect(result.icon).toBeUndefined();
    });

    it('truncates overly long url values to MAX_FIELD_LENGTH including prefix', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      const result = sanitizeOriginatorInfo({
        url: longUrl,
        title: 'Test',
        platform: 'ios',
        dappId: 'test',
      });
      // Final length must not exceed 2048 (prefix included)
      expect(result.url!.length).toBe(2048);
      expect(result.url!.startsWith('[Unverified] ')).toBe(true);
    });

    it('handles undefined url gracefully', () => {
      const result = sanitizeOriginatorInfo({
        url: undefined as unknown as string,
        title: 'Only Title',
        platform: 'ios',
        dappId: 'test',
      });
      expect(result.url).toBeUndefined();
      expect(result.title).toBe('[Unverified] Only Title');
    });

    it('preserves platform and dappId fields', () => {
      const result = sanitizeOriginatorInfo({
        url: 'https://example.com',
        title: 'Test',
        platform: 'android',
        dappId: 'my-dapp-id',
      });
      expect(result.platform).toBe('android');
      expect(result.dappId).toBe('my-dapp-id');
    });

    it('does not mutate the original object', () => {
      const original = {
        url: 'https://example.com',
        title: 'Test',
        icon: 'https://example.com/icon.png',
        platform: 'ios',
        dappId: 'test',
      };
      sanitizeOriginatorInfo(original);
      expect(original.url).toBe('https://example.com');
      expect(original.title).toBe('Test');
      expect(original.icon).toBe('https://example.com/icon.png');
    });
  });
});
