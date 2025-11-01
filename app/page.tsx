'use client';

import { useState } from 'react';

type Task = {
  id: string;
  title: string;
  durationMin: number;
  priority: number;
  dueAt?: string | null;
  earliestStart?: string | null;
  latestFinish?: string | null;
  fixed?: boolean;
};

type Placement = { taskId: string; start: string; end: string; title?: string };

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [priority, setPriority] = useState(3);
  const [dueAt, setDueAt] = useState<string>('');
  const [timeMin, setTimeMin] = useState<string>(new Date().toISOString());
  const [timeMax, setTimeMax] = useState<string>(new Date(Date.now()+7*24*3600e3).toISOString());
  const [freeWindows, setFreeWindows] = useState<{start:string; end:string}[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [slotMin, setSlotMin] = useState(30);

  function addTask() {
    const t: Task = {
      id: crypto.randomUUID(),
      title,
      durationMin: Math.max(15, durationMin),
      priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null
    };
    setTasks(prev=>[...prev, t]);
    setTitle('');
    setDurationMin(60);
    setPriority(3);
    setDueAt('');
  }

  async function getFreeBusy() {
    const res = await fetch('/api/gcal/freebusy', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ timeMin, timeMax, calendarId: 'primary' })
    });
    if (!res.ok) { alert('Sign in first (top right). Also ensure Google Calendar API OAuth is set.'); return; }
    const data = await res.json();
    const busy = data.calendars?.primary?.busy ?? [];
    // Derive free windows from day-level bounds; for simplicity, treat the whole range as one window and subtract busy with server later.
    // We will pass only the complement (free) from client: split between busy blocks.
    const start = new Date(timeMin);
    const end = new Date(timeMax);
    // naive free: begin->firstBusyStart, gaps between busy, lastBusyEnd->end
    const blocks = busy.map((b:any)=>({ start: new Date(b.start), end: new Date(b.end) })).sort((a:any,b:any)=>+new Date(a.start)-+new Date(b.start));
    const fw: {start:string; end:string}[] = [];
    let cursor = new Date(start);
    for (const b of blocks) {
      if (b.start > cursor) fw.push({ start: cursor.toISOString(), end: new Date(b.start).toISOString() });
      if (b.end > cursor) cursor = new Date(b.end);
      if (cursor > end) break;
    }
    if (cursor < end) fw.push({ start: cursor.toISOString(), end: end.toISOString() });
    setFreeWindows(fw);
  }

  async function runScheduler() {
    const res = await fetch('/api/schedule', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ tasks, freeWindows, slotMin })
    });
    const data = await res.json();
    const withTitles = data.placements.map((p:any)=>({ ...p, title: tasks.find(t=>t.id===p.taskId)?.title || p.taskId }));
    setPlacements(withTitles.map((p:any)=>({ taskId: p.taskId, start: new Date(p.start).toISOString(), end: new Date(p.end).toISOString(), title: p.title })));
    if (data.unscheduled?.length) {
      alert(`${data.unscheduled.length} task(s) unscheduled — extend free window or reduce durations.`);
    }
  }

  async function createCalendarEvents() {
    const res = await fetch('/api/gcal/events', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ placements, calendarId: 'primary', summaryPrefix: 'MotionLite: ' })
    });
    const data = await res.json();
    alert(`Created ${data.createdCount} event(s) on your Google Calendar.`);
  }

  return (
    <div>
      <h1>Motion Lite — zero-cost auto-scheduler</h1>
      <div className="card">
        <h3>Add Task</h3>
        <div className="flex">
          <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
          <input type="number" min={15} step={5} value={durationMin} onChange={e=>setDurationMin(parseInt(e.target.value||'0',10))} />
          <label className="small">Duration (min)</label>
          <input type="number" min={1} max={5} value={priority} onChange={e=>setPriority(parseInt(e.target.value||'3',10))} />
          <label className="small">Priority 1–5</label>
          <input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} />
          <label className="small">Due (optional)</label>
          <button className="btn" onClick={addTask}>Add</button>
        </div>
      </div>

      <div className="card">
        <h3>Time Range & Free/Busy</h3>
        <div className="flex">
          <label>Start
            <input type="datetime-local" value={timeMin.slice(0,16)} onChange={e=>setTimeMin(new Date(e.target.value).toISOString())} />
          </label>
          <label>End
            <input type="datetime-local" value={timeMax.slice(0,16)} onChange={e=>setTimeMax(new Date(e.target.value).toISOString())} />
          </label>
          <button className="btn" onClick={getFreeBusy}>Fetch Free/Busy</button>
          <label>Slot (min)
            <input type="number" min={15} step={5} value={slotMin} onChange={e=>setSlotMin(parseInt(e.target.value||'30',10))} />
          </label>
        </div>
        <pre>{JSON.stringify(freeWindows, null, 2)}</pre>
      </div>

      <div className="card">
        <h3>Tasks</h3>
        <table>
          <thead><tr><th>Title</th><th>Dur</th><th>Prio</th><th>Due</th></tr></thead>
          <tbody>{tasks.map(t=>(
            <tr key={t.id}><td>{t.title}</td><td>{t.durationMin}m</td><td>{t.priority}</td><td>{t.dueAt? new Date(t.dueAt).toLocaleString() : '-'}</td></tr>
          ))}</tbody>
        </table>
      </div>

      <div className="card">
        <h3>Auto-schedule</h3>
        <button className="btn" onClick={runScheduler}>Pack into Free Windows</button>
        <pre>{JSON.stringify(placements, null, 2)}</pre>
        <button className="btn" onClick={createCalendarEvents} disabled={!placements.length}>Create Calendar Events</button>
      </div>
    </div>
  );
}
