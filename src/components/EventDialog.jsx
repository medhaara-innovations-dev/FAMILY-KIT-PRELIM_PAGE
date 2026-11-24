import { useEffect, useRef, useState } from "react";
import { formatEventDate } from "../eventDates.js";

const categories = ["Personal", "Work", "Health", "Birthday", "Anniversary", "Festival", "Family", "Insurance"];

export function EventDialog({ title, onClose, busy, children }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog ref={dialog} className="fk-events-dialog" aria-label={title}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}

export function EventForm({ initial, onSave, onClose, busy, error, singleOccurrence }) {
  const [form, setForm] = useState(() => ({
    title: "", startTime: "09:00", endTime: "09:00", allDay: false, endDate: initial.startDate,
    reminderTime: "", recurrence: "none", notes: "", category: "Personal", kind: "special",
    ...initial,
  }));
  const [more, setMore] = useState(Boolean(initial.notes || initial.category !== "Personal" && initial.category));
  const update = (field, value) => setForm((previous) => ({
    ...previous,
    [field]: value,
    ...(field === "startDate" && (!previous.endDate || previous.endDate < value) && { endDate: value }),
    ...(field === "allDay" && !value && { startTime: previous.startTime || "09:00", endTime: previous.endTime || "09:00" }),
  }));
  return (
    <EventDialog title={initial.eventId ? "Edit Event" : "New Event"} onClose={onClose} busy={busy}>
      {singleOccurrence && <p>Editing the occurrence on {formatEventDate(initial.occurrenceDate)}.</p>}
      <form className="fk-events-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <label>Event title<input required maxLength={120} value={form.title} onChange={(e) => update("title", e.target.value)} /></label>
        <label className="fk-events-toggle">
          <span>All-day event</span>
          <input type="checkbox" role="switch" checked={form.allDay} onChange={(e) => update("allDay", e.target.checked)} />
        </label>
        <div className="fk-events-form-grid">
          <label>Start date<input type="date" required value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></label>
          {!form.allDay && <label>Start time<input type="time" required value={form.startTime} onChange={(e) => update("startTime", e.target.value)} /></label>}
          <label>End date<input type="date" min={form.startDate} value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></label>
          {!form.allDay && <label>End time<input type="time" required value={form.endTime} onChange={(e) => update("endTime", e.target.value)} /></label>}
        </div>
        <label className="fk-events-toggle">
          <span>Remind me</span>
          <input type="checkbox" role="switch" checked={Boolean(form.reminderTime)}
            onChange={(e) => update("reminderTime", e.target.checked ? form.allDay ? "09:00" : form.startTime : "")} />
        </label>
        {form.reminderTime && <label>Reminder time on start date (IST)<input type="time" required value={form.reminderTime}
          onChange={(e) => update("reminderTime", e.target.value)} /><small>Shown in FamilyKit when you open Events.</small></label>}
        {!singleOccurrence && <label>Repeat<select value={form.recurrence} onChange={(e) => update("recurrence", e.target.value)}>
          <option value="none">Does not repeat</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
        </select></label>}
        <div>
          <label className="fk-events-toggle">
            <span>Family event</span>
            <input type="checkbox" role="switch" checked={false} disabled aria-describedby="fk-family-event-help" />
          </label>
          <small id="fk-family-event-help" className="fk-events-sharing-help">
            Only you can see this event. Sharing requires connected family accounts.
          </small>
        </div>
        <button type="button" className="fk-events-secondary" aria-expanded={more} onClick={() => setMore(!more)}>
          {more ? "Fewer options" : "More options"}
        </button>
        {more && <>
          <label>Event type<select value={form.kind} onChange={(e) => update("kind", e.target.value)}>
            <option value="special">Special event</option><option value="reminder">Reminder</option>
          </select></label>
          <fieldset className="fk-events-categories">
            <legend>Category</legend>
            {categories.map((category) => (
              <label key={category} className="fk-events-category">
                <input type="radio" name="event-category" value={category} checked={form.category === category}
                  onChange={() => update("category", category)} />
                <span>{category}</span>
              </label>
            ))}
          </fieldset>
          <label>Additional notes<textarea rows={3} maxLength={2000} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></label>
        </>}
        {error && <p role="alert" className="fk-events-error">{error}</p>}
        <div className="fk-events-dialog-actions">
          <button type="button" disabled={busy} className="fk-events-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="fk-events-primary">{busy ? "Saving…" : initial.eventId ? "Save changes" : "Add Event"}</button>
        </div>
      </form>
    </EventDialog>
  );
}
