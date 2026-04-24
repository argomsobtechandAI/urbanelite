/**
 * Formats a date string or Date object to DD-MM-YYYY format.
 * @param date - The date to format (string or Date).
 * @returns Formatted date string in DD-MM-YYYY format.
 */
export const formatDisplayDate = (date: string | Date): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return String(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        return String(date);
    }
};

/**
 * Parses a DD-MM-YYYY string into a Date object or YYYY-MM-DD string for backend.
 * @param dateStr - The date string in DD-MM-YYYY format.
 * @returns YYYY-MM-DD string.
 */
export const parseDisplayDateToISO = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }
    return dateStr;
};

/**
 * Masks a text input to DD-MM-YYYY format.
 * @param text - The raw text from input.
 * @returns Masked text.
 */
export const maskDateInput = (text: string): string => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let masked = '';
    if (cleaned.length > 0) {
        masked = cleaned.slice(0, 2);
        if (cleaned.length > 2) {
            masked += '-' + cleaned.slice(2, 4);
        }
        if (cleaned.length > 4) {
            masked += '-' + cleaned.slice(4, 8);
        }
    }
    return masked;
};
