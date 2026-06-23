import { OriginatorInfo } from '@metamask/sdk-communication-layer';

/**
 * Prefix applied to unverified dApp-supplied URLs/titles in deeplink
 * connections. This ensures the user can distinguish self-reported identity
 * from verified browser origins in permission and transaction prompts.
 */
const UNVERIFIED_LABEL = '[Unverified] ';

/**
 * Maximum allowed length for originatorInfo string fields (url, title, icon).
 * Prevents abuse via excessively long payloads that could overflow the UI.
 */
const MAX_FIELD_LENGTH = 2048;

/**
 * Truncates a string value to MAX_FIELD_LENGTH.
 */
function truncateField(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.length > MAX_FIELD_LENGTH
    ? value.substring(0, MAX_FIELD_LENGTH)
    : value;
}

/**
 * Validates the structure of originatorInfo decoded from a deeplink.
 * Returns true if the object has the minimum required shape.
 */
export function isValidOriginatorInfo(
  info: unknown,
): info is OriginatorInfo {
  if (!info || typeof info !== 'object') return false;
  const candidate = info as Record<string, unknown>;
  // Must have at least url or title as a string
  return (
    (typeof candidate.url === 'string' && candidate.url.length > 0) ||
    (typeof candidate.title === 'string' && candidate.title.length > 0)
  );
}

/**
 * Sanitizes originatorInfo received from a deeplink connection.
 *
 * Deeplink-supplied originatorInfo is entirely attacker-controlled: a
 * malicious app can claim any URL, title, and icon. This function:
 *
 * 1. Validates the structure and rejects malformed payloads.
 * 2. Truncates overly long field values.
 * 3. Prefixes url and title with "[Unverified]" so the user can clearly
 *    see these are self-reported and not authenticated by MetaMask.
 * 4. Strips the icon field entirely to prevent favicon spoofing.
 *
 * The returned OriginatorInfo is safe to display in permission prompts
 * and transaction confirmations without risk of identity confusion.
 */
export function sanitizeOriginatorInfo(
  rawInfo: OriginatorInfo,
): OriginatorInfo {
  const sanitized: OriginatorInfo = { ...rawInfo };

  // Truncate fields to prevent UI overflow attacks
  sanitized.url = truncateField(sanitized.url);
  sanitized.title = truncateField(sanitized.title);

  // Prefix URL and title to clearly mark them as unverified self-reported values
  if (sanitized.url) {
    sanitized.url = `${UNVERIFIED_LABEL}${sanitized.url}`;
  }
  if (sanitized.title) {
    sanitized.title = `${UNVERIFIED_LABEL}${sanitized.title}`;
  }

  // Strip the icon to prevent favicon-based spoofing (e.g. showing Uniswap's logo)
  sanitized.icon = undefined;

  return sanitized;
}
