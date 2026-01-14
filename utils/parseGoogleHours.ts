/**
 * parseGoogleHours.ts
 * 
 * Converts Google Places opening hours to our internal format.
 * 
 * Google format: "Monday: 8:00 AM – 6:00 PM" or "Monday: Closed"
 * Our format: { day: 'Mon', open: '08:00', close: '18:00', closed: false, slots: [...] }
 */

export interface BusinessHour {
    day: string;
    open: string;
    close: string;
    closed: boolean;
    slots?: { open: string; close: string }[];
}

const DAY_MAP: Record<string, string> = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun',
};

/**
 * Converts various time formats to 24h "HH:MM"
 * Handles: "8:00 AM", "5 PM", "5:00\u202fPM" (non-breaking space), etc.
 */
function parseTime(timeStr: string): string {
    // Normalize whitespace (including non-breaking spaces)
    const normalized = timeStr.trim().replace(/[\s\u00A0\u202F]+/g, ' ');

    // Try format with minutes: "8:00 AM" or "10:30 PM"
    let match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    // Try format without minutes: "5 AM" or "5 PM"
    if (!match) {
        match = normalized.match(/^(\d{1,2})\s*(AM|PM)$/i);
        if (match) {
            // Insert "00" for minutes
            match = [match[0], match[1], '00', match[2]];
        }
    }

    if (!match) {
        console.warn(`⚠️ parseGoogleHours: Could not parse time "${timeStr}"`);
        return '09:00'; // fallback
    }

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Parses Google's weekdayDescriptions array into our hours format.
 * 
 * @param weekdayDescriptions - Array like ["Monday: 8:00 AM – 6:00 PM", ...]
 * @returns Array of BusinessHour objects
 */
export function parseGoogleHours(weekdayDescriptions: string[]): BusinessHour[] {
    const hours: BusinessHour[] = [];

    for (const desc of weekdayDescriptions) {
        // Format: "Monday: 8:00 AM – 6:00 PM" or "Monday: Closed" or "Monday: Open 24 hours"
        const colonIndex = desc.indexOf(':');
        if (colonIndex === -1) continue;

        const dayName = desc.substring(0, colonIndex).trim();
        const timeRange = desc.substring(colonIndex + 1).trim();

        const shortDay = DAY_MAP[dayName];
        if (!shortDay) continue;

        // Handle "Closed"
        if (timeRange.toLowerCase() === 'closed') {
            hours.push({
                day: shortDay,
                open: '09:00',
                close: '17:00',
                closed: true,
                slots: [],
            });
            continue;
        }

        // Handle "Open 24 hours"
        if (timeRange.toLowerCase().includes('24 hours')) {
            hours.push({
                day: shortDay,
                open: '00:00',
                close: '23:59',
                closed: false,
                slots: [{ open: '00:00', close: '23:59' }],
            });
            continue;
        }

        // Handle regular hours: "8:00 AM – 6:00 PM" or split shifts: "8:00 AM – 12:00 PM, 4:00 PM – 10:00 PM"
        // Note: Google uses en-dash (–) not hyphen (-)

        // Split by comma first to handle multiple shifts
        const shiftParts = timeRange.split(/\s*,\s*/);
        const slots: { open: string; close: string }[] = [];

        for (const shift of shiftParts) {
            const timeParts = shift.trim().split(/\s*[–-]\s*/);
            if (timeParts.length === 2) {
                let openStr = timeParts[0].trim();
                let closeStr = timeParts[1].trim();

                // Check if opening time is missing AM/PM (e.g., "5" in "5–7 pm")
                const openHasPeriod = /am|pm/i.test(openStr);
                const closeHasPeriod = /am|pm/i.test(closeStr);

                // If open is missing period but close has it, inherit from close
                if (!openHasPeriod && closeHasPeriod) {
                    const closePeriod = closeStr.match(/(am|pm)/i)?.[1] || 'PM';
                    openStr = openStr + ' ' + closePeriod;
                }

                const openTime = parseTime(openStr);
                const closeTime = parseTime(closeStr);
                slots.push({ open: openTime, close: closeTime });
            }
        }

        if (slots.length > 0) {
            hours.push({
                day: shortDay,
                open: slots[0].open,
                close: slots[slots.length - 1].close,
                closed: false,
                slots,
            });
        }
    }

    // Ensure all 7 days exist (fill missing with defaults)
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result: BusinessHour[] = [];

    for (const day of dayOrder) {
        const existing = hours.find(h => h.day === day);
        if (existing) {
            result.push(existing);
        } else {
            // Default to closed for missing days
            result.push({
                day,
                open: '09:00',
                close: '17:00',
                closed: true,
                slots: [],
            });
        }
    }

    return result;
}
