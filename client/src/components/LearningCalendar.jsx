import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const WEEKDAY_COUNT = 7;
const WEEKS_SHOWN = 6;

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Builds a 6-week (42-day) grid starting on the Monday on/before the 1st of the month,
// so every month renders a consistent, non-jumping grid height.
function buildGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstWeekday);

  return Array.from({ length: WEEKDAY_COUNT * WEEKS_SHOWN }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
}

// events: [{ date: Date, title, type ('live'|'in_person'|'classroom'), href }]
function LearningCalendar({ events }) {
  const { t, i18n } = useTranslation();
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));

  const grid = useMemo(() => buildGrid(monthDate), [monthDate]);
  const today = useMemo(() => new Date(), []);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      const key = event.date.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    return map;
  }, [events]);

  const monthLabel = monthDate.toLocaleDateString(i18n.resolvedLanguage || i18n.language, {
    month: 'long',
    year: 'numeric',
  });

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.resolvedLanguage || i18n.language, { weekday: 'short' });
    return grid.slice(0, 7).map((d) => formatter.format(d));
  }, [grid, i18n.resolvedLanguage, i18n.language]);

  const goToPrevMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToToday = () => setMonthDate(startOfMonth(new Date()));

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button type="button" className="btn-secondary calendar__nav-btn" onClick={goToPrevMonth} aria-label={t('myLearning.previousMonth')}>
          &larr;
        </button>
        <button type="button" className="calendar__month-label" onClick={goToToday}>
          {monthLabel}
        </button>
        <button type="button" className="btn-secondary calendar__nav-btn" onClick={goToNextMonth} aria-label={t('myLearning.nextMonth')}>
          &rarr;
        </button>
      </div>

      <div className="calendar__weekdays">
        {weekdayLabels.map((label, i) => (
          <div key={i} className="calendar__weekday">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar__grid">
        {grid.map((date) => {
          const dayEvents = eventsByDay.get(date.toDateString()) || [];
          const isCurrentMonth = date.getMonth() === monthDate.getMonth();
          const isToday = sameDay(date, today);
          return (
            <div key={date.toISOString()} className={`calendar__day${isCurrentMonth ? '' : ' calendar__day--muted'}${isToday ? ' calendar__day--today' : ''}`}>
              <span className="calendar__day-number">{date.getDate()}</span>
              <div className="calendar__day-events">
                {dayEvents.slice(0, 2).map((event, i) =>
                  event.href ? (
                    <a key={i} href={event.href} className="calendar__event" data-type={event.type} title={event.title}>
                      {event.title}
                    </a>
                  ) : (
                    <span key={i} className="calendar__event" data-type={event.type} title={event.title}>
                      {event.title}
                    </span>
                  )
                )}
                {dayEvents.length > 2 && (
                  <span className="calendar__event-more">{t('myLearning.moreEvents', { count: dayEvents.length - 2 })}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LearningCalendar;
