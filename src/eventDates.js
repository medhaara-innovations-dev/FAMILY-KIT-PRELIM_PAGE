const DAY = 86400000;

export function calendarDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function occurrenceList(events, from, to, yearlyLimit = to) {
  const results = [];
  for (const event of events) {
    const { exceptions, ...base } = event;
    if (base.recurrence !== "yearly") {
      if (base.startDate <= to && base.endDate >= from) results.push(base);
      continue;
    }
    const start = Date.parse(base.startDate);
    const duration = Date.parse(base.endDate) - start;
    const firstYear = Math.max(Number(base.startDate.slice(0, 4)), new Date(Date.parse(from) - duration).getUTCFullYear());
    const lastYear = Number(yearlyLimit.slice(0, 4));
    for (let year = firstYear; year <= lastYear; year += 1) {
      const date = `${year}${base.startDate.slice(4)}`;
      const dateValue = Date.parse(date);
      if (date > yearlyLimit || !Number.isFinite(dateValue) || new Date(dateValue).toISOString().slice(0, 10) !== date || exceptions?.[date]) continue;
      const endDate = new Date(dateValue + duration).toISOString().slice(0, 10);
      if (endDate >= from) results.push({ ...base, startDate: date, endDate, occurrenceDate: date });
    }
    for (const [occurrenceDate, change] of Object.entries(exceptions || {})) {
      if (!change.cancelled && change.startDate <= to && change.endDate >= from) {
        results.push({ ...base, ...change, occurrenceDate });
      }
    }
  }
  return results.sort((a, b) => `${a.startDate}${a.startTime}`.localeCompare(`${b.startDate}${b.startTime}`));
}

export function calendarHorizon(date, days) {
  return new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);
}

export function formatEventDate(date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}
