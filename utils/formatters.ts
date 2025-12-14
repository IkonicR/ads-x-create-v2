// Helper to format time (e.g. "09:00" -> "9am")
const formatTime = (t: string) => {
    if (!t) return '';
    const [hour, min] = t.split(':');
    const hNum = parseInt(hour, 10);
    const ampm = hNum >= 12 ? 'pm' : 'am';
    const h12 = hNum % 12 || 12;
    return `${h12}${min === '00' ? '' : ':' + min}${ampm}`;
};

export const formatBusinessHours = (hours: import('../types').BusinessHour[] | undefined, options?: { includeClosed?: boolean }): string => {
    if (!hours || hours.length === 0) return 'Standard Business Hours';

    // Helper to normalize day names (e.g. "Monday" -> "Mon")
    const normalizeDay = (d: string) => d.slice(0, 3);

    const formatDayHours = (h: import('../types').BusinessHour) => {
        if (h.closed) return 'Closed';
        if (h.slots && h.slots.length > 0) {
            return h.slots.map(s => `${formatTime(s.open)} - ${formatTime(s.close)}`).join(', ');
        }
        return `${formatTime(h.open)} - ${formatTime(h.close)}`;
    };

    // Normalize input hours
    const normalizedHours = hours.map(h => ({ ...h, day: normalizeDay(h.day) }));

    const groups: { days: string[]; time: string }[] = [];

    normalizedHours.forEach(h => {
        if (h.closed && !options?.includeClosed) return;

        const time = formatDayHours(h);
        const lastGroup = groups[groups.length - 1];

        if (lastGroup && lastGroup.time === time) {
            lastGroup.days.push(h.day);
        } else {
            groups.push({ days: [h.day], time });
        }
    });

    return groups.map(g => {
        if (g.days.length === 1) return `${g.days[0]} ${g.time}`;
        if (g.days.length > 2 && areConsecutive(g.days)) {
            return `${g.days[0]}-${g.days[g.days.length - 1]} ${g.time}`;
        }
        return `${g.days.join(', ')} ${g.time}`;
    }).join('; ');
};

const areConsecutive = (days: string[]): boolean => {
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const indices = days.map(d => dayOrder.indexOf(d));
    for (let i = 0; i < indices.length - 1; i++) {
        if (indices[i + 1] !== indices[i] + 1) return false;
    }
    return true;
};
