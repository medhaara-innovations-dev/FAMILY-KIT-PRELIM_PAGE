import { connectionsEnabled, listConnectedEvents } from "./familyConnectionsApi.js";
import { authenticatedFetch } from "../auth/sessionManager.js";

const base = import.meta.env.DEV ? "/events-api" : "https://kvi1br0fnl.execute-api.ap-southeast-2.amazonaws.com";

async function request(path, method = "GET", event, signal) {
  const response = await authenticatedFetch(`${base}/events${path}`, {
    method,
    signal,
    ...(method === "GET" && { cache: "no-store" }),
    ...(event && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Could not access events. Try again.");
  return data;
}

function eventPath(id, occurrence) {
  return `/${encodeURIComponent(id)}${occurrence ? `/occurrences/${encodeURIComponent(occurrence)}` : ""}`;
}

export async function listEvents(signal) {
  const data = await request("", "GET", undefined, signal);
  if (!connectionsEnabled) return data.events;
  const shared = await listConnectedEvents(signal).catch(() => ({ events: [] }));
  return [...data.events, ...shared.events.map((event) => ({
    ...event, eventId: `shared-${event.eventId}`,
  }))];
}

export function saveEvent(event, id, occurrence) {
  return id ? request(eventPath(id, occurrence), "PUT", event) : request("", "POST", event);
}

export function deleteEvent(id, occurrence) {
  return request(eventPath(id, occurrence), "DELETE");
}
