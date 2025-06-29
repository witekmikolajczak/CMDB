/**
 * Utility functions for formatting dates and times consistently across the application
 */

/**
 * Formats a date in dd/mm/yyyy format
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  try {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    // Default format if something goes wrong
    return date.toLocaleDateString();
  }
}

/**
 * Formats a time in 24-hour format (HH:MM)
 * @param date Date to extract time from
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  try {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    // Default format if something goes wrong
    return date.toLocaleTimeString();
  }
}

/**
 * Formats a datetime with date in dd/mm/yyyy format and time in 24-hour format
 * @param date Date to format
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date): string {
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(date);
  return `${formattedDate} ${formattedTime}`;
}


