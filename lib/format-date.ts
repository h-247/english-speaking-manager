/**
 * Formats ISO timestamps in Asia/Ho_Chi_Minh timezone (ICT, UTC+7) with English locale.
 */

export function formatDate(
  isoDate: string | null | undefined,
  includeTime = true,
): string {
  if (!isoDate) return '—';

  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '—';

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }
        : {}),
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return '—';
  }
}

export function formatDateShort(isoDate: string | null | undefined): string {
  return formatDate(isoDate, false);
}
