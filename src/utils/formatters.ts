/**
 * Formats a number as Vietnamese currency (VND).
 * @example formatCurrency(84500000) → "₫84.500.000"
 */
export function formatCurrency(
  amount: number,
  currency = "VND",
  locale = "vi-VN"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a Date or ISO string to a localized date string.
 * @example formatDate("2024-01-15") → "15 tháng 1, 2024"
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
  locale = "vi-VN"
): string {
  const d = typeof date === "string" ? parseUtcDate(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Safely parses an ISO date string from backend database as UTC if timezone is missing
 */
export function parseUtcDate(dateString: string): Date {
  let str = dateString.trim();
  if (!str.endsWith("Z") && !str.includes("+") && !str.match(/-\d{2}:\d{2}$/)) {
    str += "Z";
  }
  return new Date(str);
}

/**
 * Formats message timestamp to accurate local time (e.g. "11:33 AM" or "11:33")
 */
export function formatMessageTime(dateString?: string | Date | null): string {
  if (!dateString) return "";
  try {
    const d = typeof dateString === "string" ? parseUtcDate(dateString) : dateString;
    if (isNaN(d.getTime())) return "";

    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Formats a Date or ISO string to a relative time string.
 * @example formatRelativeTime("2024-01-10") → "5 ngày trước"
 */
export function formatRelativeTime(date: Date | string, locale = "vi-VN"): string {
  const d = typeof date === "string" ? parseUtcDate(date) : date;
  const diffMs = d.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  return rtf.format(diffDay, "day");
}

/**
 * Truncates a string to a maximum length and appends an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Generates initials from a full name (up to 2 characters).
 * @example getInitials("Nguyễn Văn A") → "NA"
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

/**
 * Formats a file size in bytes to a human-readable string (e.g. "1.2 MB", "450 KB")
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
}

/**
 * Cleans up and formats document/file names by stripping query params, GUID prefixes, and path artifacts.
 * @example formatCleanFileName("a74c5ede5e324153a5644afbccdcf6cb_bookings-report-2026-08-14.pdf?sv=2025...") → "bookings-report-2026-08-14.pdf"
 */
export function formatCleanFileName(fileNameOrUrl?: string | null): string {
  if (!fileNameOrUrl) return "Tệp đính kèm";
  try {
    // 1. Strip query string and hash
    let clean = fileNameOrUrl.split("?")[0].split("#")[0];
    
    // 2. Extract basename if it's a full URL or path
    clean = clean.split("/").pop() || clean;
    
    // 3. Decode URI components in case of URL encoded names
    try {
      clean = decodeURIComponent(clean);
    } catch {
      // ignore
    }

    // 4. Strip 32-character hex GUID or UUID with underscore prefix
    // e.g. "a74c5ede5e324153a5644afbccdcf6cb_filename.pdf" or "12345678-1234-1234-1234-123456789abc_filename.pdf"
    clean = clean.replace(/^[a-f0-9]{32}_/i, "");
    clean = clean.replace(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_/i, "");

    return clean || "Tệp đính kèm";
  } catch {
    return fileNameOrUrl || "Tệp đính kèm";
  }
}

