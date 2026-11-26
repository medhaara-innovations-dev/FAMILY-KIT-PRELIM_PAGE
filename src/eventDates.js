const DAY = 86400000;

export function calendarDate(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const monthIndex = (date) => date.getUTCFullYear() * 12 + date.getUTCMonth();

export function occurrenceList(events, from, to, repeatLimit = to) {
  const results = [];
  for (const event of events) {
    const { exceptions, completedOccurrences, ...base } = event;
    if (base.recurrence === "none") {
      if (base.startDate <= to && base.endDate >= from) results.push(base);
      continue;
    }
    const start = Date.parse(base.startDate);
    const duration = Date.parse(base.endDate) - start;
    const first = monthIndex(new Date(start));
    const earliest = monthIndex(new Date(Date.parse(from) - duration));
    const last = monthIndex(new Date(repeatLimit));
    const step = base.recurrence === "monthly" ? 1 : 12;
    const firstOccurrence = first + Math.max(0, Math.ceil((earliest - first) / step)) * step;
    for (let index = firstOccurrence; index <= last; index += step) {
      const year = Math.floor(index / 12);
      const month = index % 12;
      const originalDay = Number(base.startDate.slice(8));
      const endOfMonth = new Date(0);
      endOfMonth.setUTCFullYear(year, month + 1, 0);
      const lastDay = endOfMonth.getUTCDate();
      if (step === 12 && originalDay > lastDay) continue;
      const date = calendarDate(year, month, Math.min(originalDay, lastDay));
      const dateValue = Date.parse(date);
      if (date > repeatLimit || exceptions?.[date]) continue;
      const endDate = new Date(dateValue + duration).toISOString().slice(0, 10);
      if (endDate >= from) results.push({ ...base, startDate: date, endDate, occurrenceDate: date, completed: Boolean(completedOccurrences?.[date]) });
    }
    for (const [occurrenceDate, change] of Object.entries(exceptions || {})) {
      if (!change.cancelled && change.startDate <= to && change.endDate >= from) {
        results.push({ ...base, ...change, recurrence: base.recurrence, occurrenceDate, completed: Boolean(completedOccurrences?.[occurrenceDate]) });
      }
    }
  }
  return results.sort((a, b) => `${a.startDate}${a.startTime}`.localeCompare(`${b.startDate}${b.startTime}`));
}

export function completedEventList(events) {
  return events.flatMap((event) => {
    if (event.recurrence === "none") return event.completed ? [event] : [];
    return Object.keys(event.completedOccurrences || {}).flatMap((originalDate) => {
      const date = event.exceptions?.[originalDate]?.startDate || originalDate;
      return occurrenceList([event], date, date)
        .filter((item) => item.occurrenceDate === originalDate && item.completed);
    });
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function calendarHorizon(date, days) {
  return new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);
}

export function countEventEntries(events, today) {
  let firstDate = today;
  for (const event of events) {
    if (event.startDate < firstDate) firstDate = event.startDate;
    for (const change of Object.values(event.exceptions || {})) {
      if (!change.cancelled && change.startDate < firstDate) firstDate = change.startDate;
    }
  }
  return occurrenceList(events, firstDate, "9999-12-31", calendarHorizon(today, 366)).length;
}

export function formatEventDate(date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}
