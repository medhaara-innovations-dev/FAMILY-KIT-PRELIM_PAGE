
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./FamilyCalendar.css";

const TIME_ZONE = "Asia/Kolkata";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

function indianDate() {
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: parts.year,
    month: parts.month - 1,
    day: parts.day,
  };
}

function monthKey(date) {
  return date.year * 12 + date.month;
}

function fromMonthKey(key) {
  return {
    year: Math.floor(key / 12),
    month: ((key % 12) + 12) % 12,
  };
}

export default function FamilyCalendar({ onClose }) {
  const [today, setToday] = useState(indianDate);

  const [selectedMonth, setSelectedMonth] = useState(
    () => monthKey(indianDate())
  );

  const [followingToday, setFollowingToday] = useState(true);

  const dialogRef = useRef(null);
  const todayRef = useRef(today);

  // Keep the calendar synchronized with Indian time.
  useEffect(() => {
    const refresh = () => {
      const next = indianDate();
      const previous = todayRef.current;

      if (
        next.year !== previous.year ||
        next.month !== previous.month ||
        next.day !== previous.day
      ) {
        todayRef.current = next;
        setToday(next);

        // Automatically switch months unless the user
        // has manually navigated to another month.
        if (followingToday) {
          setSelectedMonth(monthKey(next));
        }
      }
    };

    refresh();

    const interval = window.setInterval(refresh, 15000);

    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [followingToday]);

  // Close when Escape is pressed.
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const { year, month } = fromMonthKey(selectedMonth);

  const firstDay = new Date(
    Date.UTC(year, month, 1)
  ).getUTCDay();

  const daysInMonth = new Date(
    Date.UTC(year, month + 1, 0)
  ).getUTCDate();

  const totalCells =
    Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells = Array.from(
    { length: totalCells },
    (_, index) => {
      const day = index - firstDay + 1;

      return day >= 1 && day <= daysInMonth
        ? day
        : null;
    }
  );

  function navigateMonth(delta) {
    setFollowingToday(false);
    setSelectedMonth((current) => current + delta);
  }

  function handleOutsidePointerDown(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fk-calendar-backdrop"
      onPointerDown={handleOutsidePointerDown}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="fk-calendar-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="FamilyKit calendar"
      >
        <header className="fk-calendar-header">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft size={21} />
          </button>

          <h2>
            {monthFormatter.format(
              new Date(Date.UTC(year, month, 1))
            )}
          </h2>

          <button
            type="button"
            aria-label="Next month"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight size={21} />
          </button>
        </header>

        <div
          className="fk-calendar-weekdays"
          aria-hidden="true"
        >
          {[
            "Sun",
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="fk-calendar-grid">
          {cells.map((day, index) => {
            const isToday =
              day !== null &&
              year === today.year &&
              month === today.month &&
              day === today.day;

            return (
              <div
                key={index}
                className="fk-calendar-cell"
              >
                {day !== null && (
                  <span
                    className={
                      isToday
                        ? "fk-calendar-day fk-calendar-today"
                        : "fk-calendar-day"
                    }
                    aria-label={
                      isToday
                        ? `Today, ${day}`
                        : String(day)
                    }
                    aria-current={
                      isToday ? "date" : undefined
                    }
                  >
                    {day}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
