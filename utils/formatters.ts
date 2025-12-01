export const formatBusinessHours = (hours: { day: string; open: string; close: string; closed: boolean }[] | undefined): string => {
    if (!hours || hours.length === 0) return 'Standard Business Hours';

    // Helper to normalize day names (e.g. "Monday" -> "Mon")
    const normalizeDay = (d: string) => d.slice(0, 3);

    // Helper to format time (e.g. "09:00" -> "9am")
    const formatTime = (t: string) => {
        const [hour, min] = t.split(':');
        const hNum = parseInt(hour);
        const ampm = hNum >= 12 ? 'pm' : 'am';
        const h12 = hNum % 12 || 12;
        return `${h12}${min === '00' ? '' : ':' + min}${ampm}`;
    };

    // Normalize input hours
    const normalizedHours = hours.map(h => ({ ...h, day: normalizeDay(h.day) }));

    // 1. Check for "Daily" (All 7 days same hours)
    const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const firstDay = normalizedHours.find(h => h.day === 'Mon');

    if (firstDay && !firstDay.closed) {
        const isDaily = allDays.every(d => {
            const h = normalizedHours.find(x => x.day === d);
            return h && !h.closed && h.open === firstDay.open && h.close === firstDay.close;
        });

        if (isDaily) {
            return `Daily ${formatTime(firstDay.open)} - ${formatTime(firstDay.close)}`;
        }
    }

    // 2. Check for "Mon-Fri" (Weekdays same, Weekends different/closed)
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const isMonFriSame = weekdays.every(d => {
        const h = normalizedHours.find(x => x.day === d);
        return h && !h.closed && h.open === firstDay?.open && h.close === firstDay?.close;
    });

    if (isMonFriSame && firstDay) {
        const weekdayStr = `Mon-Fri ${formatTime(firstDay.open)} - ${formatTime(firstDay.close)}`;

        // Check weekends
        const sat = normalizedHours.find(h => h.day === 'Sat');
        const sun = normalizedHours.find(h => h.day === 'Sun');

        if ((!sat || sat.closed) && (!sun || sun.closed)) {
            return weekdayStr; // Implied weekends closed
        }

        if (sat && !sat.closed && sun && !sun.closed && sat.open === sun.open && sat.close === sun.close) {
            return `${weekdayStr}, Sat-Sun ${formatTime(sat.open)} - ${formatTime(sat.close)}`;
        }
    }

    // 3. Fallback to grouping
    const groups: { days: string[]; time: string }[] = [];

    normalizedHours.forEach(h => {
        if (h.closed) return; // Skip closed days for cleaner output

        const time = `${formatTime(h.open)} - ${formatTime(h.close)}`;
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
    }).join(', ');
};

const areConsecutive = (days: string[]): boolean => {
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const indices = days.map(d => dayOrder.indexOf(d));
    for (let i = 0; i < indices.length - 1; i++) {
        if (indices[i + 1] !== indices[i] + 1) return false;
    }
    return true;
};
