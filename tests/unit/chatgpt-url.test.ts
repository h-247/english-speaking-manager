import { describe, it, expect } from 'vitest';
import { validateChatGPTUrl, normalizeChatGPTUrl } from '@/lib/chatgpt-url';

describe('validateChatGPTUrl', () => {
  it('accepts official HTTPS chatgpt.com conversation URLs', () => {
    const res = validateChatGPTUrl('https://chatgpt.com/c/67104b2b-1234-8001-a1b2-c3d4e5f67890');
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('accepts official HTTPS chat.openai.com links', () => {
    const res = validateChatGPTUrl('https://chat.openai.com/c/67104b2b-1234-8001-a1b2-c3d4e5f67890');
    expect(res.isValid).toBe(true);
  });

  it('accepts official share links', () => {
    const res = validateChatGPTUrl('https://chatgpt.com/share/67104b2b-1234-8001-a1b2-c3d4e5f67890');
    expect(res.isValid).toBe(true);
  });

  it('accepts GPTs custom conversation links', () => {
    const res = validateChatGPTUrl('https://chatgpt.com/g/g-abc1234/c/67104b2b-1234-8001-a1b2-c3d4e5f67890');
    expect(res.isValid).toBe(true);
  });

  it('rejects non-HTTPS URLs', () => {
    const res = validateChatGPTUrl('http://chatgpt.com/c/12345');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('HTTPS');
  });

  it('rejects deceptive lookalike domains', () => {
    expect(validateChatGPTUrl('https://chatgpt.fake.com/c/123').isValid).toBe(false);
    expect(validateChatGPTUrl('https://chatgpt-clone.xyz/c/123').isValid).toBe(false);
    expect(validateChatGPTUrl('https://open-ai.com/c/123').isValid).toBe(false);
    expect(validateChatGPTUrl('https://google.com').isValid).toBe(false);
  });

  it('rejects invalid or empty URLs', () => {
    expect(validateChatGPTUrl('').isValid).toBe(false);
    expect(validateChatGPTUrl('   ').isValid).toBe(false);
    expect(validateChatGPTUrl('not-a-url').isValid).toBe(false);
    expect(validateChatGPTUrl('javascript:alert(1)').isValid).toBe(false);
  });
});

describe('normalizeChatGPTUrl', () => {
  it('standardizes chat.openai.com to chatgpt.com', () => {
    const url1 = 'https://chat.openai.com/c/abc-123';
    const url2 = 'https://chatgpt.com/c/abc-123';
    expect(normalizeChatGPTUrl(url1)).toBe(normalizeChatGPTUrl(url2));
  });

  it('strips trailing slashes from path', () => {
    const raw = 'https://chatgpt.com/c/abc-123/';
    expect(normalizeChatGPTUrl(raw)).toBe('https://chatgpt.com/c/abc-123');
  });

  it('removes tracking query parameters (utm_*, ref, etc.)', () => {
    const raw = 'https://chatgpt.com/c/abc-123?utm_source=twitter&ref=share&keep=yes';
    const normalized = normalizeChatGPTUrl(raw);
    expect(normalized).toBe('https://chatgpt.com/c/abc-123?keep=yes');
  });

  it('removes URL fragments (#)', () => {
    const raw = 'https://chatgpt.com/c/abc-123#bottom';
    expect(normalizeChatGPTUrl(raw)).toBe('https://chatgpt.com/c/abc-123');
  });

  it('allows duplicate detection between links with different casing or query order', () => {
    const linkA = 'https://ChatGPT.com/c/abc-123/?b=2&a=1';
    const linkB = 'https://chat.openai.com/c/abc-123?a=1&b=2';
    expect(normalizeChatGPTUrl(linkA)).toBe(normalizeChatGPTUrl(linkB));
  });
});
