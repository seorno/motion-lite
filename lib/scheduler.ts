export type Interval = { start: Date; end: Date };
export type TaskLite = {
  id: string; title: string; durationMin: number;
  priority: number; dueAt?: string | null; earliestStart?: string | null; latestFinish?: string | null;
  fixed?: boolean;
};

function intersect(a: Interval, b: Interval): Interval | null {
  const start = new Date(Math.max(+a.start, +b.start));
  const end   = new Date(Math.min(+a.end,   +b.end));
  return start < end ? { start, end } : null;
}

export function subtractBusy(dayWindow: Interval, busy: Interval[]): Interval[] {
  const blocks = [...busy].sort((x,y)=>+x.start-+y.start);
  let free: Interval[] = [];
  let cursor = new Date(dayWindow.start);
  for (const b of blocks) {
    if (b.end <= cursor || b.start >= dayWindow.end) continue;
    const clipped = intersect({start: cursor, end: dayWindow.end}, b);
    if (!clipped) continue;
    if (clipped.start > cursor) free.push({ start: new Date(cursor), end: new Date(clipped.start) });
    cursor = new Date(Math.max(+cursor, +clipped.end));
    if (cursor >= dayWindow.end) break;
  }
  if (cursor < dayWindow.end) free.push({ start: cursor, end: dayWindow.end });
  return free;
}

function scoreTask(t: TaskLite, now=new Date()) {
  const w1=0.55, w2=0.3, w3=0.1, w4=0.05;
  const dueAt = t.dueAt ? new Date(t.dueAt) : null;
  const urgency = dueAt ? 1 / Math.max(1, (dueAt.getTime()-now.getTime())/(3600e3)) : 0;
  const importance = Math.min(1, Math.max(0, t.priority/5));
  const effortPenalty = Math.log(1 + t.durationMin/60);
  const age = 0;
  return w1*urgency + w2*importance + w3*effortPenalty + w4*age;
}

export function packTasksIntoFree(
  tasks: TaskLite[],
  freeWindows: Interval[],
  slotMin=30
): { placements: {taskId: string; start: Date; end: Date}[], unscheduled: TaskLite[] } {
  const placements: {taskId: string; start: Date; end: Date}[] = [];
  const free = [...freeWindows].sort((a,b)=>+a.start-+b.start).map(f=>({ ...f }));

  const sorted = [...tasks].sort((a,b)=>scoreTask(b)-scoreTask(a));
  for (const t of sorted) {
    let placed = false;
    for (const w of free) {
      const earliest = t.earliestStart ? new Date(t.earliestStart) : w.start;
      const latest   = t.latestFinish  ? new Date(t.latestFinish)  : w.end;
      const constrained: Interval = {
        start: new Date(Math.max(+w.start, +earliest)),
        end: new Date(Math.min(+w.end,   +latest)),
      };
      const lenMin = t.durationMin;
      if (+constrained.end - +constrained.start < lenMin*60e3) continue;

      const alignedStart = new Date(Math.ceil(+constrained.start / (slotMin*60e3)) * slotMin*60e3);
      const candidateEnd = new Date(+alignedStart + lenMin*60e3);
      if (candidateEnd > constrained.end) continue;

      placements.push({ taskId: t.id, start: alignedStart, end: candidateEnd });
      if (candidateEnd < w.end) w.start = candidateEnd; else { w.start = w.end; }
      placed = true;
      break;
    }
    if (!placed) continue;
  }
  const scheduledIds = new Set(placements.map(p=>p.taskId));
  const unscheduled = tasks.filter(t=>!scheduledIds.has(t.id));
  return { placements, unscheduled };
}
