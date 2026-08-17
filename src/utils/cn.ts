import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS class names safely.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", "bg-red-500")
 * // → "px-4 py-2 bg-red-500"  (bg-blue-500 is overridden)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
