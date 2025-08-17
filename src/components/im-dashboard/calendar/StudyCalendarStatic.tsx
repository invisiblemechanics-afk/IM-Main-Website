import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

/* ========== Types & Constants ========== */

type EventType = 'video' | 'breakdown' | 'practice' | 'mock' | 'misc';
type EventStatus = 'planned' | 'completed' | 'missed';

type StudyEvent = {
  id: string;
  title: string;
  type: EventType;
  date: string;          // 'YYYY-MM-DD' (local date)
  startTime?: string;    // 'HH:MM'
  durationMin?: number;
  status: EventStatus;
  link?: string;
};

type Suggestion = {
  id: string;
  title: string;
  type: EventType;
  defaultDuration: number;
  link?: string;
};

const TYPE_COLORS: Record<EventType, string> = {
  video: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  breakdown: 'bg-amber-100 text-amber-900 border-amber-200',
  practice: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  mock: 'bg-violet-100 text-violet-900 border-violet-200',
  misc: 'bg-zinc-100 text-zinc-900 border-zinc-200',
};

const STATUS_DECOR: Record<EventStatus, string> = {
  planned: '',
  completed: 'opacity-70 line-through',
  missed: 'opacity-50',
};

/* ========== Mock Data (edit freely) ========== */

const MOCK_EVENTS: StudyEvent[] = [
  { id: 'e1', title: 'Ray Optics: Lenses (video)', type: 'video', date: iso(-2), startTime: '18:30', durationMin: 35, status: 'planned', link: '/learning/video/ray-optics-lenses' },
  { id: 'e2', title: 'Work, Power & Energy (breakdowns)', type: 'breakdown', date: iso(-1), startTime: '19:00', durationMin: 45, status: 'completed', link: '/breakdowns/wpe' },
  { id: 'e3', title: 'Projectile Motion (practice 25Q)', type: 'practice', date: iso(0), startTime: '17:30', durationMin: 40, status: 'planned', link: '/practice/mech-projectile' },
  { id: 'e4', title: 'Mock Test #3', type: 'mock', date: iso(3), startTime: '09:00', durationMin: 180, status: 'planned', link: '/mock/3' },
  { id: 'e5', title: 'Kinematics: Relative Motion (video)', type: 'video', date: iso(5), startTime: '20:00', durationMin: 25, status: 'planned' },
];

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: 's1', title: 'Finish WPE breakdowns', type: 'breakdown', defaultDuration: 45, link: '/breakdowns/wpe' },
  { id: 's2', title: 'Ray Optics – Reflection (video)', type: 'video', defaultDuration: 30, link: '/learning/video/reflection' },
  { id: 's3', title: 'Kinematics practice 20Q', type: 'practice', defaultDuration: 35, link: '/practice/kinematics' },
  { id: 's4', title: 'Full Mock Test', type: 'mock', defaultDuration: 180, link: '/mock' },
];

/* ========== Utilities ========== */

function iso(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return toISODate(d);
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fromISODate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function startOfWeek(d: Date, weekStartsOn: 0 | 1 = 0) {
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  const res = new Date(d);
  res.setDate(d.getDate() - diff);
  res.setHours(0, 0, 0, 0);
  return res;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function sameDate(a: string, b: string) { return a === b; }

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ========== Subcomponents ========== */

function Toolbar({
  monthCursor, setMonthCursor, view, setView,
}: { monthCursor: Date; setMonthCursor: (d: Date) => void; view: 'month' | 'week' | 'day'; setView: (v: 'month' | 'week' | 'day') => void }) {
  const label = monthCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium text-zinc-900">{label}</h3>
        <div className="ml-2 flex items-center gap-1">
          <button onClick={() => setMonthCursor(addMonths(monthCursor, -1))}
            className="px-2 py-1 rounded-md border border-black/10 bg-white/70 hover:bg-white">‹</button>
          <button onClick={() => setMonthCursor(new Date())}
            className="px-2 py-1 rounded-md border border-black/10 bg-white/70 hover:bg-white">Today</button>
          <button onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
            className="px-2 py-1 rounded-md border border-black/10 bg-white/70 hover:bg-white">›</button>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs">
        {(['month','week','day'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-2 py-1 rounded-md border ${view===v ? 'border-black/25 bg-black/5 text-zinc-900' : 'border-black/10 bg-white/70 text-zinc-600 hover:bg-white'}`}>
            {v[0].toUpperCase()+v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }

function EventChip({
  ev, onToggle, onDelete, draggable = true,
}: { ev: StudyEvent; onToggle: (id: string) => void; onDelete: (id: string) => void; draggable?: boolean }) {
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', ev.id)}
      className={[
        'group rounded-lg border px-2 py-1 text-xs cursor-move',
        TYPE_COLORS[ev.type],
        STATUS_DECOR[ev.status],
      ].join(' ')}
      title={`${ev.title}${ev.startTime ? ` • ${ev.startTime}` : ''}${ev.durationMin ? ` • ${ev.durationMin}m` : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate">{ev.title}</div>
          <div className="text-[10px] opacity-80">
            {ev.startTime ? ev.startTime : 'Anytime'}{ev.durationMin ? ` • ${ev.durationMin}m` : ''}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {ev.link && (
            <Link to={ev.link} className="opacity-70 hover:opacity-100 underline text-[10px]">Open</Link>
          )}
          <button onClick={() => onToggle(ev.id)} className="opacity-70 hover:opacity-100 text-[10px]">
            {ev.status === 'completed' ? 'Undo' : 'Done'}
          </button>
          <button onClick={() => onDelete(ev.id)} className="opacity-70 hover:opacity-100 text-[10px]">✕</button>
        </div>
      </div>
    </div>
  );
}

function QuickAdd({
  date, onCreate, onCancel,
}: { date: string; onCreate: (e: StudyEvent) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('misc');
  const [time, setTime] = useState('18:00');
  const [dur, setDur] = useState(30);

  return (
    <div className="mt-2 rounded-xl border border-black/10 bg-white/70 p-2 text-xs">
      <div className="flex items-center gap-2">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title"
          className="flex-1 rounded-md border border-black/10 bg-white px-2 py-1 outline-none" />
        <select value={type} onChange={e=>setType(e.target.value as EventType)}
          className="rounded-md border border-black/10 bg-white px-2 py-1">
          <option value="video">Video</option>
          <option value="breakdown">Breakdown</option>
          <option value="practice">Practice</option>
          <option value="mock">Mock</option>
          <option value="misc">Misc</option>
        </select>
        <input type="time" value={time} onChange={e=>setTime(e.target.value)}
          className="rounded-md border border-black/10 bg-white px-2 py-1" />
        <input type="number" min={5} step={5} value={dur} onChange={e=>setDur(Number(e.target.value))}
          className="w-20 rounded-md border border-black/10 bg-white px-2 py-1" />
        <button
          onClick={() => onCreate({ id: cryptoRandom(), title: title || 'Study session', type, date, startTime: time, durationMin: dur, status: 'planned' })}
          className="rounded-md bg-black text-white px-3 py-1"
        >
          Add
        </button>
        <button onClick={onCancel} className="rounded-md border border-black/10 bg-white px-3 py-1">Cancel</button>
      </div>
    </div>
  );
}

function cryptoRandom() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2);
}

/* ========== Main Component ========== */

export default function StudyCalendarStatic() {
  const [monthCursor, setMonthCursor] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month'); // Week/Day are placeholders for now.
  const [events, setEvents] = useState<StudyEvent[]>(MOCK_EVENTS);
  const [showAddFor, setShowAddFor] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(MOCK_SUGGESTIONS);

  // Month matrix (6 rows x 7 cols)
  const monthMatrix = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), 0);
    const end = endOfMonth(monthCursor);
    const days: Date[] = [];
    let cur = new Date(start);
    while (days.length < 42) {
      days.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    return days;
  }, [monthCursor]);

  function dayEvents(dateISO: string) {
    return events.filter(e => sameDate(e.date, dateISO)).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }

  function moveEvent(id: string, toDateISO: string) {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, date: toDateISO } : e)));
  }

  function toggleEvent(id: string) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'completed' ? 'planned' : 'completed' } : e));
  }

  function deleteEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  function createEvent(e: StudyEvent) {
    setEvents(prev => [...prev, e]);
    setShowAddFor(null);
  }

  function addFromSuggestion(s: Suggestion, toDateISO: string) {
    const newEv: StudyEvent = {
      id: cryptoRandom(),
      title: s.title,
      type: s.type,
      date: toDateISO,
      startTime: '18:00',
      durationMin: s.defaultDuration,
      status: 'planned',
      link: s.link,
    };
    setEvents(prev => [...prev, newEv]);
  }

  const todayISO = toISODate(new Date());
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);

  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] p-4">
      {/* Header */}
      <Toolbar monthCursor={monthCursor} setMonthCursor={setMonthCursor} view={view} setView={setView} />

      {/* Suggestions row */}
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map(s => (
          <div key={s.id}
            draggable
            onDragStart={(e)=>e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'suggestion', id: s.id }))}
            className={[
              'rounded-lg border px-3 py-1 text-sm cursor-grab active:cursor-grabbing',
              TYPE_COLORS[s.type],
            ].join(' ')}
            title="Drag onto a day to schedule"
          >
            {s.title}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="mt-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-xs text-zinc-500 px-1">
          {dayNames.map(d => <div key={d} className="py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthMatrix.map((d, idx) => {
            const isoDate = toISODate(d);
            const inMonth = d >= monthStart && d <= monthEnd && d.getMonth() === monthCursor.getMonth();
            const isToday = isoDate === todayISO;
            const dayEvts = dayEvents(isoDate);
            const hiddenCount = Math.max(0, dayEvts.length - 3);
            return (
              <div
                key={idx}
                className={[
                  'rounded-xl border p-2 min-h-[112px] flex flex-col gap-1 bg-white/70',
                  'border-black/10',
                  inMonth ? '' : 'opacity-50',
                  isToday ? 'outline outline-2 outline-black/10' : '',
                ].join(' ')}
                onDragOver={(e)=>e.preventDefault()}
                onDrop={(e)=>{
                  const data = e.dataTransfer.getData('text/plain');
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.kind === 'suggestion') {
                      const s = suggestions.find(x => x.id === parsed.id);
                      if (s) addFromSuggestion(s, isoDate);
                    } else {
                      moveEvent(parsed, isoDate);
                    }
                  } catch {
                    // If it's an event id string
                    moveEvent(data, isoDate);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-500">{d.getDate()}</div>
                  <button
                    className="text-xs rounded-md border border-black/10 bg-white/70 px-1.5 py-0.5 hover:bg-white"
                    onClick={() => setShowAddFor(showAddFor === isoDate ? null : isoDate)}
                    title="Quick add"
                  >
                    +
                  </button>
                </div>

                {/* Events */}
                {dayEvts.slice(0,3).map(ev => (
                  <EventChip key={ev.id} ev={ev} onToggle={toggleEvent} onDelete={deleteEvent} />
                ))}

                {/* "+N more" */}
                {hiddenCount > 0 && (
                  <div className="text-[11px] text-zinc-600">+{hiddenCount} more</div>
                )}

                {/* Quick add form */}
                {showAddFor === isoDate && (
                  <QuickAdd date={isoDate} onCreate={createEvent} onCancel={()=>setShowAddFor(null)} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
        <span className="mr-2">Legend:</span>
        {(['video','breakdown','practice','mock','misc'] as EventType[]).map(t => (
          <span key={t} className={['rounded-md border px-2 py-0.5', TYPE_COLORS[t]].join(' ')}>
            {t[0].toUpperCase()+t.slice(1)}
          </span>
        ))}
        <span className="ml-auto text-xs">Drag suggestions onto a day • Drag events between days • Click "+" to add</span>
      </div>
    </div>
  );
}


