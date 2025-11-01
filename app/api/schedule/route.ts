import { NextRequest, NextResponse } from "next/server";
import { packTasksIntoFree, Interval } from "@/lib/scheduler";

export async function POST(req: NextRequest) {
  const { tasks, freeWindows, slotMin } = await req.json();
  const fws: Interval[] = (freeWindows ?? []).map((w: any)=>({ start: new Date(w.start), end: new Date(w.end) }));
  const result = packTasksIntoFree(tasks ?? [], fws, slotMin ?? 30);
  return NextResponse.json(result);
}
