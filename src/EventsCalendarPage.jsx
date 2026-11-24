import FamilyBottomNav from "./components/FamilyBottomNav.jsx";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronLeft, ChevronRight, CalendarPlus, UserRound } from "lucide-react";
import { EventDialog, EventForm } from "./components/EventDialog.jsx";
import { deleteEvent, listEvents, saveEvent } from "./api/eventsApi.js";
import { calendarDate, calendarHorizon, completedEventList, formatEventDate, occurrenceList } from "./eventDates.js";
import "./EventsCalendarPage.css";

const dateParts = new Intl.DateTimeFormat("en-GB", {timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"});
const monthTitle = new Intl.DateTimeFormat("en-GB", {timeZone:"UTC",month:"long",year:"numeric"});
const cardDate = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
function cardTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}
function istToday() {
  const p = Object.fromEntries(dateParts.formatToParts(new Date()).filter(x=>x.type!=="literal").map(x=>[x.type,Number(x.value)]));
  return {year:p.year,month:p.month-1,day:p.day};
}
const keyOf = d => d.year*12+d.month;
export default function EventsCalendarPage(){
  const navigate=useNavigate();
  const location = useLocation();
  const openedDate = location.state?.eventDate || "";
  const [today,setToday]=useState(istToday);
  const [displayMonth,setDisplayMonth]=useState(() => openedDate
    ? Number(openedDate.slice(0, 4)) * 12 + Number(openedDate.slice(5, 7)) - 1
    : keyOf(istToday()));
  const [followingToday,setFollowingToday]=useState(!openedDate);
  const [filter,setFilter]=useState("All");
  const [selectedDate, setSelectedDate] = useState(openedDate);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState("");
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [reload, setReload] = useState(0);
  const eventListRef = useRef(null);
  const openedReminderRef = useRef(null);
  useEffect(() => {
    if (openedDate && !loading && !loadError) eventListRef.current?.focus();
  }, [openedDate, loading, loadError]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    listEvents(controller.signal).then((data) => {
      if (!controller.signal.aborted) setEvents(data);
    }).catch((failure) => {
      if (!controller.signal.aborted) setLoadError(failure.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [reload]);
  useEffect(()=>{
    const refresh=()=>{
      setNow(new Date());
      setToday(previous=>{
      const next=istToday();
      return next.year===previous.year&&next.month===previous.month&&next.day===previous.day?previous:next;
      });
    };
    const timer=window.setInterval(refresh,15000);
    window.addEventListener("focus",refresh);
    document.addEventListener("visibilitychange",refresh);
    return ()=>{window.clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh)};
  },[]);
  useEffect(()=>{if(followingToday)setDisplayMonth(keyOf(today))},[today,followingToday]);
  const year=Math.floor(displayMonth/12),month=((displayMonth%12)+12)%12;
  const first=new Date(Date.UTC(year,month,1)).getUTCDay();
  const days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  const cells=Array.from({length:Math.ceil((first+days)/7)*7},(_,i)=>{const d=i-first+1;return d>=1&&d<=days?d:null});
  const todayKey = calendarDate(today.year, today.month, today.day);
  useEffect(() => {
    if (!location.state?.createEvent || loading || loadError) return;
    setDialog({ mode: "edit", event: { startDate: todayKey } });
    navigate(location.pathname, { replace: true, state: null });
  }, [location, loading, loadError, navigate, todayKey]);
  useEffect(() => {
    const reminderId = location.state?.reminderEventId;
    if (!reminderId || loading || loadError || openedReminderRef.current === location.key) return;
    openedReminderRef.current = location.key;
    const event = occurrenceList(events, openedDate, openedDate).find((item) =>
      item.eventId === reminderId && item.occurrenceDate === location.state?.reminderOccurrence);
    if (event) setDialog({ mode: "view", event });
    else setStatus("This event is no longer available.");
  }, [events, loading, loadError, location, openedDate]);
  const monthEvents = occurrenceList(events, calendarDate(year, month, 1), calendarDate(year, month, days));
  const repeatLimit = selectedDate || calendarHorizon(todayKey, 366);
  const shown = filter === "Completed"
    ? completedEventList(events).filter((event) => !selectedDate || (event.startDate <= selectedDate && event.endDate >= selectedDate))
    : occurrenceList(events, selectedDate || todayKey, selectedDate || "9999-12-31", repeatLimit)
      .filter((event) => !event.completed && (filter === "All" || (filter === "Reminders"
        ? event.kind === "reminder" || event.reminderTime
        : event.kind === "special")));
  const timeNow = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now);
  const due = occurrenceList(events, todayKey, todayKey).filter((event) =>
    !event.completed && event.startDate === todayKey && event.reminderTime && event.reminderTime <= timeNow);
  function changeMonth(delta){
    setFollowingToday(false);
    setSelectedDate("");
    setDisplayMonth(value=>value+delta);
  }
  function openDialog(next) {
    setError("");
    setDialog(next);
  }
  function updateEvent(event) {
    setEvents((current) => current.some((item) => item.eventId === event.eventId)
      ? current.map((item) => item.eventId === event.eventId ? event : item)
      : [...current, event]);
  }
  async function changeCompletion() {
    if (busy) return;
    const current = dialog.event;
    const completed = !current.completed;
    setBusy(true);
    setError("");
    try {
      const { event } = await saveEvent({ completed }, current.eventId, current.occurrenceDate);
      if (current.occurrenceDate && Boolean(event.completedOccurrences?.[current.occurrenceDate]) !== completed ||
          !current.occurrenceDate && Boolean(event.completed) !== completed) {
        throw new Error("The event completion status was not saved.");
      }
      updateEvent(event);
      setDialog({ mode: "view", event: { ...current, completed } });
      setStatus(completed ? "Marked as done." : "Event reopened.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(form) {
    if (busy) return;
    if (!form.title.trim() || (form.endDate || form.startDate) + (form.allDay ? "" : form.endTime)
      < form.startDate + (form.allDay ? "" : form.startTime)) {
      setError("Enter a title and an end date and time on or after the start.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { event } = await saveEvent(form, form.eventId, dialog.single ? form.occurrenceDate : undefined);
      updateEvent(event);
      setStatus(form.eventId ? "Event updated." : "Event added to your calendar.");
      openDialog(null);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(single) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const id = dialog.event.eventId;
      const result = await deleteEvent(id, single ? dialog.event.occurrenceDate : undefined);
      if (single) updateEvent(result.event);
      else setEvents((current) => current.filter((item) => item.eventId !== id));
      setStatus(single ? "Occurrence removed." : "Event deleted.");
      openDialog(null);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="fk-events-page">
    <main className="fk-events-content">
      <div className="fk-events-heading"><button type="button" aria-label="Back to Categories" onClick={()=>navigate("/categories")}><ChevronLeft size={19}/></button><h1>Events</h1></div>
      <section className="fk-events-calendar" aria-label="Events calendar">
        <header className="fk-events-calendar-header">
          <button type="button" aria-label="Previous month" onClick={()=>changeMonth(-1)}><ChevronLeft size={19}/></button>
          <h2>{monthTitle.format(new Date(Date.UTC(year,month,1)))}</h2>
          <button type="button" aria-label="Next month" onClick={()=>changeMonth(1)}><ChevronRight size={19}/></button>
        </header>
        <div className="fk-events-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><span key={d}>{d}</span>)}</div>
        <div className="fk-events-days">{cells.map((day, i) => {
          const date = day === null ? "" : calendarDate(year, month, day);
          const hasEvent = date && monthEvents.some((event) => event.startDate <= date && event.endDate >= date);
          return <div className="fk-events-day-cell" key={i}>{date && (
            <button type="button" className={`fk-events-day ${date === todayKey ? "today" : ""}`}
              aria-current={date === todayKey ? "date" : undefined} aria-pressed={selectedDate === date}
              aria-label={`${formatEventDate(date)}${hasEvent ? ", has events" : ""}`}
              onClick={() => setSelectedDate(selectedDate === date ? "" : date)}>
              {day}{hasEvent && <i aria-hidden="true" />}
            </button>
          )}</div>;
        })}</div>
      </section>
      <button className="fk-events-create" type="button" disabled={loading || Boolean(loadError)}
        onClick={() => { setStatus(""); openDialog({ mode: "edit", event: { startDate: selectedDate || todayKey } }); }}>
        <CalendarPlus size={17}/>Create a New Event
      </button>
      <div className="fk-events-filters" role="group" aria-label="Event type">{["All","Reminders","Special events","Completed"].map(f=><button type="button" key={f} className={filter===f?"selected":""} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}</div>
      {status && <p role="status">{status}</p>}
      {due.length > 0 && <section className="fk-events-reminders" aria-label="Reminders due today">
        <h2>Reminders due today</h2>
        <ul>{due.map((event) => <li key={`${event.eventId}-${event.occurrenceDate || ""}`}>{event.title} · {event.reminderTime} IST</li>)}</ul>
      </section>}
      {loading ? <p role="status">Loading events…</p> : loadError ? (
        <p role="alert" className="fk-events-error">{loadError} <button type="button" onClick={() => setReload((count) => count + 1)}>Retry</button></p>
      ) : <section className="fk-events-upcoming" ref={eventListRef} tabIndex={-1} aria-labelledby="fk-events-list-heading">
        <h2 id="fk-events-list-heading">{selectedDate ? formatEventDate(selectedDate) : "Upcoming events"}</h2>
        {shown.length === 0 ? <p className="fk-events-empty">No events to show.</p> : shown.map((event) => (
          <button className="fk-events-item" type="button" key={`${event.eventId}-${event.occurrenceDate || ""}`}
            onClick={() => openDialog({ mode: "view", event })}>
            <span className="fk-events-item-dates">
              <time dateTime={event.startDate}>{cardDate.format(new Date(event.startDate))}</time>
              {event.endDate !== event.startDate && <time dateTime={event.endDate}>{cardDate.format(new Date(event.endDate))}</time>}
            </span>
            <span className="fk-events-item-copy">
              <strong>{event.title}</strong>
              <span className="fk-events-item-identity">
                <span className="fk-events-item-avatar"><UserRound size={13} aria-hidden="true" /></span>
                <span><b>You (Self)</b><small>{event.category}</small></span>
              </span>
            </span>
            <span className="fk-events-item-schedule">
              {event.completed ? <span className="fk-events-item-reminder">Completed</span>
                : event.reminderTime && <span className="fk-events-item-reminder"><Bell size={10} aria-hidden="true" />Reminder</span>}
              <span className="fk-events-item-times" aria-label={event.allDay ? undefined : "Times in IST"}>
                {event.allDay ? "All day" : <>
                  <time dateTime={event.startTime}>{cardTime(event.startTime)}</time>
                  {(event.endDate !== event.startDate || event.endTime !== event.startTime) &&
                    <time dateTime={event.endTime}>{cardTime(event.endTime)}</time>}
                </>}
              </span>
            </span>
          </button>
        ))}
      </section>}
    </main>
    <FamilyBottomNav active="category" />
    {dialog?.mode === "edit" && <EventForm initial={dialog.event} singleOccurrence={dialog.single}
      busy={busy} error={error} onSave={submit} onClose={() => openDialog(null)} />}
    {dialog?.mode === "view" && <EventDialog title={dialog.event.title} busy={busy} onClose={() => openDialog(null)}>
      <p>{formatEventDate(dialog.event.startDate)} {dialog.event.allDay ? "· All day" : `· ${dialog.event.startTime} IST`}</p>
      <p>Ends {formatEventDate(dialog.event.endDate)} {dialog.event.allDay ? "" : `· ${dialog.event.endTime} IST`}</p>
      <p>{dialog.event.category} · Private{dialog.event.occurrenceDate ? (dialog.event.recurrence === "monthly" ? " · Monthly series" : " · Yearly series") : ""}</p>
      {dialog.event.completed && <p role="status">Completed</p>}
      {dialog.event.reminderTime && <p>Reminder at {dialog.event.reminderTime} IST</p>}
      {dialog.event.notes && <p className="fk-events-notes">{dialog.event.notes}</p>}
      {error && <p role="alert" className="fk-events-error">{error}</p>}
      <div className="fk-events-dialog-actions">
        <button type="button" className="fk-events-secondary" disabled={busy} onClick={changeCompletion}>
          {busy ? "Updating…" : dialog.event.completed ? "Undo completion" : "Mark as done"}
        </button>
        <button type="button" disabled={busy} className="fk-events-secondary" onClick={() => openDialog(null)}>Close</button>
        <button type="button" disabled={busy} className="fk-events-secondary" onClick={() => openDialog({ ...dialog, mode: "delete" })}>Delete</button>
        {dialog.event.occurrenceDate && <button type="button" disabled={busy} className="fk-events-secondary"
          onClick={() => openDialog({ ...dialog, mode: "edit", single: true })}>Edit this occurrence</button>}
        <button type="button" disabled={busy} className="fk-events-primary" onClick={() => openDialog({
          mode: "edit", event: events.find((event) => event.eventId === dialog.event.eventId),
        })}>{dialog.event.occurrenceDate ? "Edit series" : "Edit"}</button>
      </div>
    </EventDialog>}
    {dialog?.mode === "delete" && <EventDialog title="Delete event?" busy={busy} onClose={() => openDialog(null)}>
      <p>{dialog.event.title}</p>
      {error && <p role="alert" className="fk-events-error">{error}</p>}
      <div className="fk-events-dialog-actions">
        <button type="button" className="fk-events-secondary" disabled={busy} onClick={() => openDialog(null)}>Cancel</button>
        {dialog.event.occurrenceDate && <button type="button" className="fk-events-secondary" disabled={busy}
          onClick={() => remove(true)}>Delete this occurrence</button>}
        <button type="button" className="fk-events-primary" disabled={busy}
          onClick={() => remove(false)}>{dialog.event.occurrenceDate ? "Delete series" : "Delete event"}</button>
      </div>
    </EventDialog>}
  </div>
}
