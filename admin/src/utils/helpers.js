/**
 * Helper utility functions
 */

import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Format a date for display
 *
 * @param {string|Date} date - The date to format
 * @param {string} formatString - Optional format string
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, formatString = 'MMM d, yyyy') => {
    if (!date) return 'N/A';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return format(dateObj, formatString);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
};

/**
 * Format a timestamp for display in chat messages
 * Shows time for today, "Yesterday" for yesterday, and date for older
 *
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} - Formatted timestamp string
 */
export const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    try {
        const date = new Date(timestamp);

        if (isToday(date)) {
            return format(date, 'h:mm a');
        } else if (isYesterday(date)) {
            return `Yesterday, ${format(date, 'h:mm a')}`;
        } else {
            return format(date, 'MMM d, h:mm a');
        }
    } catch (error) {
        console.error('Error formatting message time:', error);
        return '';
    }
};

/**
 * Format a time duration in seconds to human-readable format
 *
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration string
 */
export const formatDuration = (seconds) => {
    if (typeof seconds !== 'number') return 'N/A';

    if (seconds < 60) {
        return `${seconds} sec`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} min`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
};

/**
 * Format a relative time from now
 *
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted relative time
 */
export const formatTimeAgo = (date) => {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
        console.error('Error formatting time ago:', error);
        return '';
    }
};

/**
 * Truncate a string if it's longer than maxLength
 *
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated string
 */
export const truncateString = (str, maxLength = 100) => {
    if (!str) return '';

    if (str.length <= maxLength) return str;

    return `${str.substring(0, maxLength)}...`;
};

/**
 * Get initials from a name
 *
 * @param {string} name - The name to get initials from
 * @returns {string} - Initials
 */
export const getInitials = (name) => {
    if (!name) return '?';

    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

/**
 * Generate a color based on a string (e.g., for avatar backgrounds)
 *
 * @param {string} str - The string to generate color from
 * @returns {string} - Hex color code
 */
export const stringToColor = (str) => {
    if (!str) return '#3B82F6'; // Default blue

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }

    return color;
};

/**
 * Parse error message from API response
 *
 * @param {Object} error - Error object from catch
 * @returns {string} - Error message
 */
export const parseErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred';

    if (error.response) {
        // Server responded with non-2xx status
        if (error.response.data && error.response.data.message) {
            return error.response.data.message;
        }

        if (error.response.data && error.response.data.error) {
            return error.response.data.error;
        }

        return `Server error: ${error.response.status}`;
    } else if (error.request) {
        // Request was made but no response received
        return 'No response from server. Please check your internet connection.';
    } else {
        // Something else happened
        return error.message || 'An error occurred';
    }
};

/**
 * Debounce a function
 *
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};