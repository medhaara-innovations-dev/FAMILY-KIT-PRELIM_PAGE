import { useEffect, useState } from "react";
import { getStoredSessionSubject } from "./auth/sessionManager.js";
import { calendarHorizon, occurrenceList } from "./eventDates.js";

const zone = "Asia/Kolkata";
const storagePrefix = "familykit_event_reminders_read:";

export function useReminderClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return now;
}

export function getDueEventReminders(events, now) {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: zone }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now);
  const earliest = calendarHorizon(today, -29);
  return occurrenceList(events, earliest, today)
    .filter((event) => event.reminderTime && event.startDate >= earliest &&
      (event.startDate < today || event.reminderTime <= time))
    .map((event) => ({
      event,
      id: JSON.stringify([event.eventId, event.occurrenceDate || "", event.startDate, event.reminderTime]),
      group: event.startDate === today ? "Today" : "Earlier",
    }))
    .sort((a, b) => (
      b.event.startDate.localeCompare(a.event.startDate) ||
      b.event.reminderTime.localeCompare(a.event.reminderTime)
    ));
}

function readKey() {
  const subject = getStoredSessionSubject();
  return subject ? storagePrefix + subject : null;
}

export function getReadReminderIds() {
  const key = readKey();
  try {
    const ids = key ? JSON.parse(sessionStorage.getItem(key)) : null;
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

export function markRemindersRead(ids) {
  const read = getReadReminderIds();
  for (const id of ids) read.add(id);
  const key = readKey();
  if (key) {
    try {
      sessionStorage.setItem(key, JSON.stringify([...read]));
    } catch {
      // The current screen can still update if session storage is unavailable.
    }
  }
  return read;
}
