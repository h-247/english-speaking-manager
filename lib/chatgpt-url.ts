/**
 * Validation and normalization for official ChatGPT conversation and share links.
 */

const ALLOWED_HOSTS = new Set([
  'chatgpt.com',
  'www.chatgpt.com',
  'chat.openai.com',
  'www.chat.openai.com',
]);

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'referrer',
  'source',
  'feature',
]);

export interface URLValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validates whether the given URL is a genuine, secure ChatGPT link.
 */
export function validateChatGPTUrl(rawUrl: string): URLValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'ChatGPT conversation link is required.' };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'ChatGPT conversation link cannot be empty.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Please enter a valid, well-formed URL.' };
  }

  // Enforce HTTPS
  if (parsed.protocol !== 'https:') {
    return {
      isValid: false,
      error: 'Security requirement: ChatGPT link must use secure HTTPS protocol.',
    };
  }

  // Validate hostname against authorized domains
  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return {
      isValid: false,
      error:
        'Invalid domain: Only official ChatGPT links (chatgpt.com or chat.openai.com) are accepted.',
    };
  }

  // Ensure path is not completely empty
  const pathname = parsed.pathname;
  if (pathname.length === 0) {
    return {
      isValid: false,
      error: 'Invalid ChatGPT URL: Conversation path is missing.',
    };
  }

  const normalized = normalizeChatGPTUrl(trimmed);
  return {
    isValid: true,
    normalizedUrl: normalized,
  };
}

/**
 * Normalizes a ChatGPT URL for canonical storage and duplicate detection.
 * - Converts host to canonical 'chatgpt.com'
 * - Lowercases path components where case-insensitive or keeps UUIDs lowercase
 * - Strips trailing slashes
 * - Strips marketing/tracking query parameters
 * - Removes fragments (#)
 */
export function normalizeChatGPTUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  const parsed = new URL(trimmed);

  // Normalize host: standardize chat.openai.com -> chatgpt.com
  let host = parsed.hostname.toLowerCase();
  if (host.startsWith('www.')) {
    host = host.slice(4);
  }
  if (host === 'chat.openai.com') {
    host = 'chatgpt.com';
  }

  // Normalize path: strip trailing slash (except root '/')
  let pathname = parsed.pathname;
  while (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Filter query params
  const cleanParams = new URLSearchParams();
  for (const [key, value] of parsed.searchParams.entries()) {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) {
      cleanParams.append(key, value);
    }
  }

  // Sort query params for deterministic string representation
  cleanParams.sort();
  const queryString = cleanParams.toString();

  return `https://${host}${pathname}${queryString ? `?${queryString}` : ''}`;
}
