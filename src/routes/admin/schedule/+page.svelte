<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { fullName } from '$lib/types';
  import { confirmSubmit, confirmDialog } from '$lib/admin/ux';
  import { supabase } from '$lib/supabaseClient';

  $effect(() => {
    const channel = supabase
      .channel('public:event_attendance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_attendance' },
        () => invalidateAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });

  let { data, form } = $props();

  // Empty-state CTAs open these collapsed create panels.
  let holidayPanelOpen = $state(false);
  let eventPanelOpen = $state(false);

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /** "Mon 8 Jun" style header from a YYYY-MM-DD string + index. */
  function dayHeader(dateStr: string, idx: number): string {
    const [, m, d] = dateStr.split('-').map(Number);
    return `${DAY_NAMES[idx]} ${d} ${MONTHS[m - 1]}`;
  }

  /** "8 Jun" short label for the week range. */
  function shortDate(dateStr: string): string {
    const [, m, d] = dateStr.split('-').map(Number);
    return `${d} ${MONTHS[m - 1]}`;
  }

  /** Trim "HH:MM:SS" / "HH:MM" to "HH:MM". */
  function hhmm(t: string | null): string {
    if (!t) return '';
    return t.slice(0, 5);
  }

  /** Long-form holiday/date label. */
  function longDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  /** Format a timestamptz string for the events table. */
  function whenLabel(iso: string): string {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    return dt.toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function scheduleHref(week: string): string {
    const params = new URLSearchParams();
    if (data.locationId) params.set('location', data.locationId);
    params.set('week', week);
    params.set('view', 'week');
    return `/admin/schedule?${params.toString()}`;
  }

  /** Build an admin-schedule URL with an explicit week and/or view. */
  function buildHref(opts: { week?: string; view?: 'week' | 'month' }): string {
    const params = new URLSearchParams();
    if (data.locationId) params.set('location', data.locationId);
    params.set('week', opts.week ?? data.weekStart);
    params.set('view', opts.view ?? data.view);
    return `/admin/schedule?${params.toString()}`;
  }

  // ---- Opening hours (ISO weekday keys 1=Mon..7=Sun) ----
  /** Opening-hours entry for column index i (0=Mon). */
  function hoursFor(i: number): { open: string; close: string } | null {
    const oh = (data.location?.opening_hours ?? {}) as Record<string, { open: string; close: string } | null>;
    return oh?.[String(i + 1)] ?? null;
  }
  function hoursLabel(i: number): string {
    const h = hoursFor(i);
    return h ? `${hhmm(h.open)}–${hhmm(h.close)}` : 'Closed';
  }
  function isClosed(i: number): boolean {
    return hoursFor(i) === null;
  }

  // ---- Holidays per day ----
  const holidaysByDay = $derived(
    data.weekDates.map((d: string) => data.holidays.filter((h: any) => h.date === d))
  );
  function holidayName(i: number): string | null {
    const list = holidaysByDay[i];
    return list.length ? list.map((h: any) => h.name).join(', ') : null;
  }

  // Shifts grouped by day for the grid.
  const shiftsByDay = $derived(
    data.weekDates.map((d: string) => data.shifts.filter((s: any) => s.shift_date === d))
  );

  // ---- Role colors: stable hue from the role name hash (8 pleasant hues) ----
  const ROLE_COLORS = [
    '#e0792a', // orange
    '#2563eb', // blue
    '#16a34a', // green
    '#9333ea', // purple
    '#db2777', // pink
    '#0891b2', // teal
    '#ca8a04', // amber
    '#dc2626' // red
  ];
  function roleColor(name: string | null | undefined): string {
    const key = (name ?? '').trim().toLowerCase();
    if (!key) return 'var(--color-border)';
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return ROLE_COLORS[hash % ROLE_COLORS.length];
  }

  /** Best role name for a shift: explicit label or the user's job role. */
  function shiftRole(s: any): string | null {
    return (s.role_label && s.role_label.trim()) || s.user?.job_role?.name || null;
  }

  // ---- Missing-role analysis per day ----
  // Roles that have active staff at the location.
  const staffRoleNames = $derived(
    Array.from(
      new Set(
        data.staff
          .map((p: any) => p.job_role?.name)
          .filter((n: any): n is string => !!n && n.trim().length > 0)
      )
    ) as string[]
  );

  /** Lowercased set of required-role rows covered by the day's shifts. */
  function coveredRoles(i: number): Set<string> {
    const set = new Set<string>();
    for (const s of shiftsByDay[i]) {
      // Map the same way the planner does (label → user's job role → Other)
      set.add(rowForShift(s).trim().toLowerCase());
      const r = shiftRole(s);
      if (r) set.add(r.trim().toLowerCase());
    }
    return set;
  }

  /** Required roles with no coverage on day i. */
  function missingRoles(i: number): string[] {
    try {
      if (isClosed(i) || holidayName(i)) return [];
      const covered = coveredRoles(i);
      return (requiredRoleNames ?? []).filter((n: string) => !covered.has(n.trim().toLowerCase()));
    } catch (e) {
      console.error('missingRoles failed for day', i, e);
      return [];
    }
  }

  function joiningCount(ev: any): number {
    return (ev.event_attendance ?? []).filter((a: any) => a.status === 'joining').length;
  }

  // ============================================================
  //  DAY PLANNER MODAL
  // ============================================================

  // The YYYY-MM-DD of the day whose planner modal is open (null = closed).
  // Keyed on the date string so it survives load-data invalidation.
  let plannerDay = $state<string | null>(null);

  // ---- Draft block (the draggable/resizable rectangle being placed) ----
  let draft = $state<{ row: string; start: number; end: number } | null>(null);
  let draftUser = $state('');
  let draftSaving = $state(false);
  let plannerError = $state<string | null>(null);

  // ---- Editing an existing saved block (move/resize/reassign) ----
  let editing = $state<{
    id: string;
    row: string;
    start: number;
    end: number;
    orig: { row: string; start: number; end: number };
  } | null>(null);
  let savingEdit = $state(false);

  // Active drag gesture (not reactive — read inside window pointer handlers).
  let drag: {
    kind: 'draft' | 'shift';
    mode: 'move' | 'left' | 'right';
    trackLeft: number;
    trackWidth: number;
    grabOffset: number; // minutes between pointer and draft/editing start (move mode)
  } | null = null;

  // Timeline window: 06:00 (360 min) → 24:00 (1440 min).
  const T_START = 360;
  const T_END = 1440;
  const T_SPAN = T_END - T_START; // 1080

  /** Parse "HH:MM[:SS]" → minutes since midnight (clamped 0..1440). */
  function toMinutes(t: string | null | undefined): number {
    if (!t) return 0;
    const [h, m] = t.slice(0, 5).split(':').map(Number);
    const v = (h || 0) * 60 + (m || 0);
    return Math.max(0, Math.min(1440, v));
  }
  /** minutes → "HH:MM". */
  function fromMinutes(min: number): string {
    const m = Math.max(0, Math.min(1440, Math.round(min)));
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  // Index of the open planner day within the week (or -1).
  const plannerIdx = $derived(plannerDay ? data.weekDates.indexOf(plannerDay) : -1);
  const plannerHours = $derived(plannerIdx >= 0 ? hoursFor(plannerIdx) : null);
  const plannerClosed = $derived(plannerIdx >= 0 ? isClosed(plannerIdx) : false);
  const plannerHolidayName = $derived(plannerIdx >= 0 ? holidayName(plannerIdx) : null);
  const plannerShifts = $derived(plannerIdx >= 0 ? shiftsByDay[plannerIdx] : []);

  // Roles this restaurant REQUIRES on its schedule (configured in the location
  // hub). Falls back to roles held by active staff when none are configured.
  const requiredRoleNames = $derived.by(() => {
    const req = ((data.requiredRoles ?? []) as any[])
      .map((r) => r?.name)
      .filter((n): n is string => !!n && n.trim().length > 0);
    return req.length ? req : (staffRoleNames as string[]);
  });

  /** The requirements strip shows exactly the restaurant's required roles. */
  const reqRoleNames = $derived(requiredRoleNames);

  /** Map a shift to a timeline row label: exact role_label, else user job role, else "Other". */
  function rowForShift(s: any): string {
    const names = requiredRoleNames;
    const lower = names.map((r: string) => r.trim().toLowerCase());
    const lbl = (s.role_label ?? '').trim().toLowerCase();
    if (lbl) {
      const hit = names[lower.indexOf(lbl)];
      if (hit) return hit;
    }
    const ur = (s.user?.job_role?.name ?? '').trim().toLowerCase();
    if (ur) {
      const hit = names[lower.indexOf(ur)];
      if (hit) return hit;
    }
    return 'Other';
  }

  // Y-axis rows: the restaurant's required roles + a trailing "Other".
  const timelineRows = $derived([...requiredRoleNames, 'Other'] as string[]);

  /** Shifts assigned to a given timeline row, for the open planner day. */
  function shiftsForRow(row: string): any[] {
    return plannerShifts.filter((s: any) => rowForShift(s) === row);
  }

  /**
   * Like shiftsForRow but honours the editing override: the block being edited
   * is removed from its natural row (rendered separately via the editing layer).
   */
  function shiftsForRowDisplay(row: string): any[] {
    return shiftsForRow(row).filter((s: any) => !editing || s.id !== editing.id);
  }

  /**
   * Lane assignment (greedy interval graph coloring): sort the row's shifts by
   * start minute, then for each shift place it in the first lane whose last
   * block ends at or before this block's start; otherwise open a new lane.
   * Returns blocks decorated with { lane, lanes } where lanes = total lane count.
   */
  function layoutRow(row: string): { s: any; lane: number; lanes: number }[] {
    const items = shiftsForRowDisplay(row)
      .map((s: any) => ({ s, start: toMinutes(s.start_time), end: toMinutes(s.end_time) }))
      .sort((a, b) => a.start - b.start || a.end - b.end);
    const laneEnds: number[] = []; // last end-minute per lane
    const placed = items.map((it) => {
      let lane = laneEnds.findIndex((e) => e <= it.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(it.end);
      } else {
        laneEnds[lane] = it.end;
      }
      return { s: it.s, lane };
    });
    const lanes = Math.max(1, laneEnds.length);
    return placed.map((p) => ({ ...p, lanes }));
  }

  /** Number of lanes in a row (drives row height). */
  function rowLanes(row: string): number {
    return Math.max(1, ...layoutRow(row).map((b) => b.lanes), 1);
  }

  // Percentage geometry for a block within the 06:00–24:00 window.
  function blockLeft(s: any): number {
    const start = Math.max(T_START, toMinutes(s.start_time));
    return ((start - T_START) / T_SPAN) * 100;
  }
  function blockWidth(s: any): number {
    const start = Math.max(T_START, toMinutes(s.start_time));
    const end = Math.max(start, Math.min(T_END, toMinutes(s.end_time)));
    return Math.max(0, ((end - start) / T_SPAN) * 100);
  }

  // Open-hours band geometry for the open planner day.
  const bandLeft = $derived(
    plannerHours ? ((Math.max(T_START, toMinutes(plannerHours.open)) - T_START) / T_SPAN) * 100 : 0
  );
  const bandWidth = $derived(
    plannerHours
      ? Math.max(
          0,
          ((Math.min(T_END, toMinutes(plannerHours.close)) -
            Math.max(T_START, toMinutes(plannerHours.open))) /
            T_SPAN) *
            100
        )
      : 0
  );

  // Hour ruler ticks every 2h: 06,08,...,24.
  const rulerTicks = $derived.by(() => {
    const ticks: { label: string; left: number }[] = [];
    for (let h = 6; h <= 24; h += 2) {
      ticks.push({ label: String(h).padStart(2, '0'), left: ((h * 60 - T_START) / T_SPAN) * 100 });
    }
    return ticks;
  });

  /** Planned summary: shift count + total hours for the open day. */
  const plannedSummary = $derived.by(() => {
    let mins = 0;
    for (const s of plannerShifts) mins += Math.max(0, toMinutes(s.end_time) - toMinutes(s.start_time));
    return { count: plannerShifts.length, hours: Math.round((mins / 60) * 10) / 10 };
  });

  /** Whether a requirement role is covered (≥1 shift block) on the open day. */
  function roleCovered(rn: string): boolean {
    const key = rn.trim().toLowerCase();
    return plannerShifts.some((s: any) => rowForShift(s).trim().toLowerCase() === key);
  }

  /** Merge intervals + diff against the open window → uncovered gaps. */
  function rowGaps(row: string): { start: number; end: number }[] {
    if (!plannerHours || plannerClosed) return [];
    const open = Math.max(T_START, toMinutes(plannerHours.open));
    const close = Math.min(T_END, toMinutes(plannerHours.close));
    if (close <= open) return [];
    const iv = shiftsForRow(row) // use SAVED values (ignore editing overrides for simplicity)
      .map((s: any) => ({
        start: Math.max(open, toMinutes(s.start_time)),
        end: Math.min(close, toMinutes(s.end_time))
      }))
      .filter((i) => i.end > i.start)
      .sort((a, b) => a.start - b.start);
    const gaps: { start: number; end: number }[] = [];
    let cursor = open;
    for (const i of iv) {
      if (i.start > cursor) gaps.push({ start: cursor, end: i.start });
      cursor = Math.max(cursor, i.end);
    }
    if (cursor < close) gaps.push({ start: cursor, end: close });
    return gaps;
  }

  /** Coverage state for a required role on the open planner day. */
  function rowCoverage(row: string): 'full' | 'partial' | 'missing' {
    const has = shiftsForRow(row).length > 0;
    if (!has) return 'missing';
    return rowGaps(row).length ? 'partial' : 'full';
  }

  /** Geometry helpers for a gap segment (percentage within the timeline window). */
  function gapLeft(g: { start: number; end: number }): number {
    return ((g.start - T_START) / T_SPAN) * 100;
  }
  function gapWidth(g: { start: number; end: number }): number {
    return Math.max(0, ((g.end - g.start) / T_SPAN) * 100);
  }

  // ---- Week-grid partial-coverage analysis (any day i) ----
  /** Uncovered gaps for role `row` on grid day i (uses that day's shifts + hours). */
  function dayRowGaps(i: number, row: string): { start: number; end: number }[] {
    const h = hoursFor(i);
    if (!h) return [];
    const open = Math.max(T_START, toMinutes(h.open));
    const close = Math.min(T_END, toMinutes(h.close));
    if (close <= open) return [];
    const key = row.trim().toLowerCase();
    const iv = shiftsByDay[i]
      .filter((s: any) => rowForShift(s).trim().toLowerCase() === key)
      .map((s: any) => ({
        start: Math.max(open, toMinutes(s.start_time)),
        end: Math.min(close, toMinutes(s.end_time))
      }))
      .filter((iv2: { start: number; end: number }) => iv2.end > iv2.start)
      .sort((a: any, b: any) => a.start - b.start);
    const gaps: { start: number; end: number }[] = [];
    let cursor = open;
    for (const it of iv) {
      if (it.start > cursor) gaps.push({ start: cursor, end: it.start });
      cursor = Math.max(cursor, it.end);
    }
    if (cursor < close) gaps.push({ start: cursor, end: close });
    return gaps;
  }

  /** Required roles that are present-but-partially-covered on grid day i. */
  function partialRoles(i: number): string[] {
    try {
      if (isClosed(i) || holidayName(i)) return [];
      const covered = coveredRoles(i);
      return (requiredRoleNames ?? []).filter((n: string) => {
        const key = n.trim().toLowerCase();
        if (!covered.has(key)) return false; // missing, not partial
        return dayRowGaps(i, n).length > 0;
      });
    } catch (e) {
      console.error('partialRoles failed for day', i, e);
      return [];
    }
  }

  /** Open the planner modal for a date. */
  function openPlanner(date: string) {
    plannerDay = date;
    draft = null;
    editing = null;
    plannerError = null;
  }
  function closePlanner() {
    plannerDay = null;
    draft = null;
    editing = null;
    plannerError = null;
  }

  const SNAP = 15; // minutes
  function snap(min: number): number {
    return Math.round(min / SNAP) * SNAP;
  }
  function clampDraft(start: number, end: number): { start: number; end: number } {
    let s = Math.max(T_START, Math.min(T_END - 30, start));
    let e = Math.max(s + 30, Math.min(T_END, end));
    return { start: s, end: e };
  }

  /** Place a draft rectangle on a role row, starting near the given minute. */
  function placeDraft(role: string, startMin?: number) {
    plannerError = null;
    draftUser = '';
    const openMin = plannerHours ? toMinutes(plannerHours.open) : 540;
    const closeMin = plannerHours ? toMinutes(plannerHours.close) : 1020;
    const start = snap(startMin ?? openMin);
    const end = Math.min(start + 240, Math.max(closeMin, start + 60), T_END);
    draft = { row: role, ...clampDraft(start, end) };
  }
  function cancelDraft() {
    draft = null;
    plannerError = null;
  }

  /** Click on an empty track area → place the draft rectangle right there. */
  function onTrackClick(e: MouseEvent, role: string) {
    // While editing a saved block, clicks must not spawn a draft.
    if (editing) return;
    // Ignore clicks that originated on a block, the draft, or its delete button.
    const target = e.target as HTMLElement;
    if (target.closest('.tl-block') || target.closest('.tl-draft') || target.closest('.tl-row-add')) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = rect.width ? (e.clientX - rect.left) / rect.width : 0;
    const startMin = T_START + Math.max(0, Math.min(1, ratio)) * T_SPAN;
    placeDraft(role, startMin);
  }

  /** Pointer-x → timeline minutes, based on the drag's cached track geometry. */
  function pointerMinutes(clientX: number): number {
    if (!drag) return T_START;
    const ratio = drag.trackWidth ? (clientX - drag.trackLeft) / drag.trackWidth : 0;
    return T_START + Math.max(0, Math.min(1, ratio)) * T_SPAN;
  }

  /** Begin dragging the draft (move) or one of its edges (resize). */
  function startDrag(e: PointerEvent, mode: 'move' | 'left' | 'right') {
    if (!draft) return;
    e.preventDefault();
    e.stopPropagation();
    const track = (e.currentTarget as HTMLElement).closest('.tl-track') as HTMLElement | null;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    drag = {
      kind: 'draft',
      mode,
      trackLeft: rect.left,
      trackWidth: rect.width,
      grabOffset: mode === 'move' ? pointerXToMinutes(e.clientX, rect) - draft.start : 0
    };
  }

  /** Begin editing a SAVED block: drag body to move/reassign, edges to resize. */
  function startShiftDrag(e: PointerEvent, shift: any, mode: 'move' | 'left' | 'right') {
    e.preventDefault();
    e.stopPropagation();
    const track = (e.currentTarget as HTMLElement).closest('.tl-track') as HTMLElement | null;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const row = rowForShift(shift);
    const start = toMinutes(shift.start_time);
    const end = toMinutes(shift.end_time);
    editing = { id: shift.id, row, start, end, orig: { row, start, end } };
    drag = {
      kind: 'shift',
      mode,
      trackLeft: rect.left,
      trackWidth: rect.width,
      grabOffset: mode === 'move' ? pointerXToMinutes(e.clientX, rect) - start : 0
    };
  }
  function pointerXToMinutes(clientX: number, rect: DOMRect): number {
    const ratio = rect.width ? (clientX - rect.left) / rect.width : 0;
    return T_START + Math.max(0, Math.min(1, ratio)) * T_SPAN;
  }

  function onWindowPointerMove(e: PointerEvent) {
    if (!drag) return;

    if (drag.kind === 'shift') {
      if (!editing) return;
      const min = pointerMinutes(e.clientX);
      if (drag.mode === 'move') {
        const dur = editing.end - editing.start;
        let start = snap(min - drag.grabOffset);
        start = Math.max(T_START, Math.min(T_END - dur, start));
        // Row reassignment: hit-test the track currently under the pointer.
        let row = editing.row;
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const track = el?.closest('.tl-track') as HTMLElement | null;
        const hit = track?.getAttribute('data-row');
        if (hit && hit !== 'Other' && timelineRows.includes(hit)) row = hit;
        editing = { ...editing, row, start, end: start + dur };
      } else if (drag.mode === 'left') {
        const start = Math.min(snap(min), editing.end - 30);
        editing = { ...editing, ...clampDraft(start, editing.end) };
      } else {
        const end = Math.max(snap(min), editing.start + 30);
        editing = { ...editing, ...clampDraft(editing.start, end) };
      }
      return;
    }

    if (!draft) return;
    const min = pointerMinutes(e.clientX);
    if (drag.mode === 'move') {
      const dur = draft.end - draft.start;
      let start = snap(min - drag.grabOffset);
      start = Math.max(T_START, Math.min(T_END - dur, start));
      draft = { ...draft, start, end: start + dur };
    } else if (drag.mode === 'left') {
      const start = Math.min(snap(min), draft.end - 30);
      draft = { ...draft, ...clampDraft(start, draft.end) };
    } else {
      const end = Math.max(snap(min), draft.start + 30);
      draft = { ...draft, ...clampDraft(draft.start, end) };
    }
  }

  /** Pull a human message out of a devalue-encoded action-failure payload. */
  function parseFailureMessage(data: unknown): string {
    const fallback = 'Could not update the shift.';
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (typeof parsed === 'string') return parsed;
      if (Array.isArray(parsed)) {
        // devalue array form: find the first plausible message string.
        const msg = parsed.find(
          (v) => typeof v === 'string' && v.length > 1 && !/^\$$|^\d+$/.test(v) && /\s|[a-z]/i.test(v)
        );
        // Prefer a value following a "message" key if present.
        const idx = parsed.indexOf('message');
        if (idx >= 0 && typeof parsed[idx + 1] === 'number' && typeof parsed[parsed[idx + 1]] === 'string') {
          return parsed[parsed[idx + 1]] as string;
        }
        if (typeof msg === 'string') return msg;
      }
      if (parsed && typeof parsed === 'object' && typeof (parsed as any).message === 'string') {
        return (parsed as any).message;
      }
    } catch {
      /* fall through */
    }
    return fallback;
  }

  async function onWindowPointerUp() {
    const wasShift = drag?.kind === 'shift';
    drag = null;
    if (!wasShift || !editing) return;

    const cur = editing;
    // Nothing changed → just drop the edit.
    if (cur.row === cur.orig.row && cur.start === cur.orig.start && cur.end === cur.orig.end) {
      editing = null;
      return;
    }

    savingEdit = true;
    try {
      const fd = new FormData();
      fd.set('id', cur.id);
      fd.set('start_time', fromMinutes(cur.start));
      fd.set('end_time', fromMinutes(cur.end));
      fd.set('role_label', cur.row !== 'Other' ? cur.row : '');
      const r = await fetch('?/updateShift', { method: 'POST', body: fd });
      const res = await r.json();
      if (res?.type === 'failure') {
        plannerError = parseFailureMessage(res.data);
        editing = null;
      } else {
        plannerError = null;
        await invalidateAll();
        editing = null;
      }
    } catch (err) {
      console.error('updateShift failed', err);
      plannerError = 'Could not update the shift — network or server error.';
      editing = null;
    } finally {
      savingEdit = false;
    }
  }

  /** Staff sorted so members with the matching job role appear first. */
  function staffForRole(role: string): { matching: any[]; others: any[] } {
    const key = role.trim().toLowerCase();
    const matching: any[] = [];
    const others: any[] = [];
    for (const p of data.staff) {
      if ((p.job_role?.name ?? '').trim().toLowerCase() === key) matching.push(p);
      else others.push(p);
    }
    return { matching, others };
  }

  /** Build a "First start–end" label for a block. */
  function blockLabel(s: any): string {
    const name = (fullName(s.user) || 'Unknown').split(' ')[0];
    return `${name} ${hhmm(s.start_time)}–${hhmm(s.end_time)}`;
  }
  function blockTitle(s: any): string {
    const r = shiftRole(s);
    return `${fullName(s.user) || 'Unknown'} · ${hhmm(s.start_time)}–${hhmm(s.end_time)}${r ? ' · ' + r : ''}${s.notes ? ' · ' + s.notes : ''}`;
  }

  /** Svelte action: bring the inline add bar into view and focus its select. */
  function revealBar(node: HTMLElement) {
    node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    (node.querySelector('select') as HTMLSelectElement | null)?.focus();
  }

  function onWindowKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && plannerDay) {
      if (draft) cancelDraft();
      else closePlanner();
    }
  }

  // ============================================================
  //  MONTH VIEW — per-day coverage for the calendar grid
  // ============================================================

  /** Add n days to a YYYY-MM-DD string (client mirror of the server helper). */
  function addDaysStr(dateStr: string, n: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d + n);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  /** ISO weekday key (1=Mon..7=Sun) for a date — matches opening_hours keys. */
  function dowKey(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay(); // 0 Sun..6 Sat
    return dow === 0 ? 7 : dow;
  }

  /** Opening hours for an arbitrary date (vs hoursFor, which takes a week column). */
  function hoursForDate(dateStr: string): { open: string; close: string } | null {
    const oh = (data.location?.opening_hours ?? {}) as Record<string, { open: string; close: string } | null>;
    return oh?.[String(dowKey(dateStr))] ?? null;
  }
  function shiftsForDate(dateStr: string): any[] {
    return data.shifts.filter((s: any) => s.shift_date === dateStr);
  }
  function holidayForDate(dateStr: string): boolean {
    return data.holidays.some((h: any) => h.date === dateStr);
  }

  /** Uncovered gaps for a role on a given date (date-based twin of dayRowGaps). */
  function dateRowGaps(dateStr: string, row: string, open: number, close: number) {
    if (close <= open) return [] as { start: number; end: number }[];
    const key = row.trim().toLowerCase();
    const iv = shiftsForDate(dateStr)
      .filter((s: any) => rowForShift(s).trim().toLowerCase() === key)
      .map((s: any) => ({ start: Math.max(open, toMinutes(s.start_time)), end: Math.min(close, toMinutes(s.end_time)) }))
      .filter((i: { start: number; end: number }) => i.end > i.start)
      .sort((a: any, b: any) => a.start - b.start);
    const gaps: { start: number; end: number }[] = [];
    let cursor = open;
    for (const it of iv) {
      if (it.start > cursor) gaps.push({ start: cursor, end: it.start });
      cursor = Math.max(cursor, it.end);
    }
    if (cursor < close) gaps.push({ start: cursor, end: close });
    return gaps;
  }

  /** Coverage summary for one month-grid day cell. */
  function dayCoverage(dateStr: string): {
    status: 'closed' | 'holiday' | 'none' | 'missing' | 'partial' | 'full';
    count: number;
  } {
    const count = shiftsForDate(dateStr).length;
    if (holidayForDate(dateStr)) return { status: 'holiday', count };
    if (hoursForDate(dateStr) === null) return { status: 'closed', count };
    if (count === 0) return { status: 'none', count };
    const req = requiredRoleNames;
    if (!req.length) return { status: 'full', count };
    const covered = new Set<string>();
    for (const s of shiftsForDate(dateStr)) {
      covered.add(rowForShift(s).trim().toLowerCase());
      const r = shiftRole(s);
      if (r) covered.add(r.trim().toLowerCase());
    }
    if (req.some((n: string) => !covered.has(n.trim().toLowerCase()))) return { status: 'missing', count };
    const h = hoursForDate(dateStr)!;
    const open = Math.max(T_START, toMinutes(h.open));
    const close = Math.min(T_END, toMinutes(h.close));
    const anyGap = req.some((n: string) => dateRowGaps(dateStr, n, open, close).length > 0);
    return { status: anyGap ? 'partial' : 'full', count };
  }

  /** Navigate to the week containing a date (used by month-grid day clicks). */
  function openWeek(dateStr: string) {
    goto(buildHref({ week: dateStr, view: 'week' }));
  }

  // ============================================================
  //  DUPLICATE MODE — pick days, copy them into a target week
  // ============================================================
  let dupMode = $state(false);
  let dupSelected = $state<string[]>([]); // chosen source days (YYYY-MM-DD)
  let dupTarget = $state(''); // target week's Monday

  // Target-week options: this week's Monday plus the next 9 weeks.
  const weekOptions = $derived.by(() => {
    const opts: { value: string; label: string }[] = [];
    for (let i = 0; i < 10; i++) {
      const mon = addDaysStr(data.thisWeek, i * 7);
      opts.push({ value: mon, label: `Week of ${shortDate(mon)}` });
    }
    return opts;
  });
  $effect(() => {
    if (!dupTarget && weekOptions.length) dupTarget = (weekOptions[1] ?? weekOptions[0]).value;
  });

  function toggleDupMode() {
    dupMode = !dupMode;
    if (!dupMode) dupSelected = [];
  }
  function toggleDaySelect(dateStr: string) {
    dupSelected = dupSelected.includes(dateStr)
      ? dupSelected.filter((d) => d !== dateStr)
      : [...dupSelected, dateStr];
  }
  function cancelDup() {
    dupMode = false;
    dupSelected = [];
  }
  const dupTargetLabel = $derived(weekOptions.find((o) => o.value === dupTarget)?.label ?? '');

  // Holiday-add default date.
  let holidayDate = $state('');
  $effect(() => {
    if (!holidayDate && data.weekStart) holidayDate = data.weekStart;
  });
</script>

<svelte:window
  onkeydown={onWindowKeydown}
  onpointermove={onWindowPointerMove}
  onpointerup={onWindowPointerUp}
/>

<div class="page-head">
  <div>
    <h1>Schedule</h1>
    <p>Plan weekly shifts and publish events for your team.</p>
  </div>
</div>

<!-- Unified toolbar: location + week/month nav + view toggle + duplicate -->
<div class="card sched-toolbar">
  <div class="st-row">
    <form method="GET" class="st-loc">
      <select name="location" aria-label="Location" onchange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}>
        {#each data.locations as l}
          <option value={l.id} selected={l.id === data.locationId}>{l.name}</option>
        {/each}
      </select>
      <input type="hidden" name="week" value={data.weekStart} />
      <input type="hidden" name="view" value={data.view} />
    </form>

    {#if data.view === 'month'}
      <div class="st-weeknav">
        <a class="btn sm" href={buildHref({ week: data.prevMonth, view: 'month' })} aria-label="Previous month">←</a>
        <strong class="st-weeklabel">{data.monthLabel}</strong>
        <a class="btn sm" href={buildHref({ week: data.nextMonth, view: 'month' })} aria-label="Next month">→</a>
        <a class="btn sm" href={buildHref({ week: data.thisWeek, view: 'month' })}>Today</a>
      </div>
    {:else}
      <div class="st-weeknav">
        <a class="btn sm" href={scheduleHref(data.prevWeek)} aria-label="Previous week">←</a>
        <strong class="st-weeklabel">{shortDate(data.weekStart)} – {shortDate(data.weekEnd)}</strong>
        <a class="btn sm" href={scheduleHref(data.nextWeek)} aria-label="Next week">→</a>
        <a class="btn sm" href={scheduleHref(data.thisWeek)}>Today</a>
      </div>
    {/if}

    {#if data.locationId}
      <div class="st-tools">
        <div class="view-toggle" role="group" aria-label="View mode">
          <a class="vt" class:active={data.view === 'week'} href={buildHref({ view: 'week' })}>Week</a>
          <a class="vt" class:active={data.view === 'month'} href={buildHref({ view: 'month' })}>Month</a>
        </div>
        <button type="button" class="btn sm dup-toggle" class:dup-on={dupMode} onclick={toggleDupMode}>
          {dupMode ? '✓ Selecting days' : '⧉ Duplicate'}
        </button>
      </div>
    {/if}
  </div>
  {#if dupMode}
    <p class="dup-help">
      Tap days to select them{data.view === 'month' ? ' across the month' : ''}, then choose a target week below.
      Each day copies to the same weekday of that week.
    </p>
  {/if}
</div>

{#if !data.locationId}
  <div class="card"><div class="empty">No locations yet. Create one first.<br /><a class="btn primary" href="/admin/locations">+ Add location</a></div></div>
{:else}
  {#if data.view === 'month'}
  <!-- Month coverage calendar -->
  <div class="card">
    <h2>{data.monthLabel} — coverage</h2>
    <div class="month-grid">
      {#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as d}
        <div class="mg-dow">{d}</div>
      {/each}
      {#each data.monthWeeks as week}
        {#each week as cell}
          {@const cov = dayCoverage(cell.date)}
          {@const sel = dupMode && dupSelected.includes(cell.date)}
          <button
            type="button"
            class="mg-cell status-{cov.status}"
            class:out-month={!cell.inMonth}
            class:today={cell.isToday}
            class:dup-selected={sel}
            onclick={() => (dupMode ? toggleDaySelect(cell.date) : openWeek(cell.date))}
            title={dupMode ? 'Tap to select for duplication' : 'Open this week'}
          >
            <span class="mg-num">{cell.dayNum}</span>
            {#if dupMode}<span class="mg-check">{sel ? '☑' : '☐'}</span>{/if}
            <span class="mg-dot" aria-hidden="true"></span>
            {#if cov.count > 0}
              <span class="mg-count">{cov.count} shift{cov.count === 1 ? '' : 's'}</span>
            {:else if cov.status === 'closed'}
              <span class="mg-count muted-count">Closed</span>
            {:else if cov.status === 'holiday'}
              <span class="mg-count muted-count">Holiday</span>
            {/if}
          </button>
        {/each}
      {/each}
    </div>
    <div class="mg-legend">
      <span><i class="lg full"></i> Fully covered</span>
      <span><i class="lg partial"></i> Partial</span>
      <span><i class="lg missing"></i> Missing role</span>
      <span><i class="lg none"></i> No shifts</span>
      <span><i class="lg closed"></i> Closed / holiday</span>
    </div>
  </div>
  {:else}
  <!-- Week grid -->
  <div class="card">
    <h2>Weekly shifts</h2>
    <div class="week-grid" class:dup-mode={dupMode}>
      {#each data.weekDates as dateStr, i}
        {@const closed = isClosed(i)}
        {@const hName = holidayName(i)}
        {@const missing = missingRoles(i)}
        {@const partial = partialRoles(i)}
        <div
          class="day-col"
          class:today={dateStr === data.today}
          class:closed
          class:holiday={!!hName}
          class:dup-selected={dupMode && dupSelected.includes(dateStr)}
        >
          <button
            type="button"
            class="day-head"
            class:today={dateStr === data.today}
            onclick={() => (dupMode ? toggleDaySelect(dateStr) : openPlanner(dateStr))}
            title={dupMode ? 'Tap to select for duplication' : 'Open day planner'}
          >
            {#if dupMode}
              <span class="dh-check">{dupSelected.includes(dateStr) ? '☑' : '☐'}</span>
            {/if}
            <div class="dh-top">{dayHeader(dateStr, i)}</div>
            <div class="dh-hours">{hoursLabel(i)}</div>
          </button>

          {#if hName}
            <div class="holiday-chip" title={hName}>🎉 {hName}</div>
          {/if}

          <div class="day-body">
            {#each shiftsByDay[i] as s}
              {@const role = shiftRole(s)}
              <div class="shift-card" style="border-left-color: {roleColor(role)};">
                <button
                  type="button"
                  class="x"
                  title="Delete shift"
                  onclick={async (e) => {
                    const delForm = e.currentTarget.nextElementSibling as HTMLFormElement | null;
                    if (await confirmDialog({ message: 'Delete this shift?', danger: true })) {
                      delForm?.requestSubmit();
                    }
                  }}
                >×</button>
                <form method="POST" action="?/deleteShift" use:enhance style="display:none;">
                  <input type="hidden" name="id" value={s.id} />
                </form>
                <div class="emp">{fullName(s.user) || 'Unknown'}</div>
                <div class="time">{hhmm(s.start_time)}–{hhmm(s.end_time)}</div>
                {#if role}<div class="role" style="color: {roleColor(role)};">{role}</div>{/if}
              </div>
            {/each}

            <!-- Missing-role / no-shift warnings -->
            {#if !closed && !hName}
              {#if shiftsByDay[i].length === 0}
                <div class="warn-chip soft">No shifts planned</div>
              {:else}
                {#if missing.length}
                  <div class="missing-wrap">
                    <span class="missing-label">Missing:</span>
                    {#each missing as m}
                      <span class="warn-chip">{m}</span>
                    {/each}
                  </div>
                {/if}
                {#if partial.length}
                  <div class="missing-wrap">
                    {#each partial as p}
                      <span class="warn-chip partial">{p} · partial</span>
                    {/each}
                  </div>
                {/if}
              {/if}
            {/if}

            <!-- Open the day planner -->
            {#if !closed && !dupMode}
              <button type="button" class="add-btn" onclick={() => openPlanner(dateStr)}>＋ Plan</button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    {#if staffRoleNames.length === 0}
      <p class="muted" style="margin-top:0.75rem;">
        Tip: assign job roles to staff so missing-role coverage can be highlighted.
      </p>
    {/if}
  </div>
  {/if}

  <div class="two-col">
  <!-- Holidays -->
  <div class="card">
    <h2>Holidays</h2>
    <p class="muted" style="margin-bottom:0.9rem;">No tasks are generated on holidays.</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Name</th><th>Date</th><th>Scope</th><th></th></tr>
        </thead>
        <tbody>
          {#each data.upcomingHolidays as h}
            <tr>
              <td class="font-semibold">{h.name}</td>
              <td>{longDate(h.date)}</td>
              <td>{h.location?.name ?? 'All locations'}</td>
              <td>
                <form method="POST" action="?/deleteHoliday" use:enhance onsubmit={confirmSubmit(`Delete holiday "${h.name}"?`)}>
                  <input type="hidden" name="id" value={h.id} />
                  <button class="btn sm danger" type="submit">Delete</button>
                </form>
              </td>
            </tr>
          {:else}
            <tr><td colspan="4" class="empty">No upcoming holidays.<br /><button type="button" class="btn primary" onclick={() => (holidayPanelOpen = true)}>+ Add holiday</button></td></tr>
          {/each}
        </tbody>
      </table>
    </div>

    <details class="create-panel" style="margin-top:1rem;" bind:open={holidayPanelOpen}>
      <summary>+ Add holiday</summary>
      <div class="panel-body">
        <form method="POST" action="?/addHoliday" use:enhance>
          <div class="form-grid">
            <label class="field"><span>Name *</span><input type="text" name="name" required placeholder="e.g. Christmas Day" /></label>
            <label class="field"><span>Date *</span><input type="date" name="date" bind:value={holidayDate} required /></label>
            <label class="field">
              <span>Scope</span>
              <select name="location_id">
                <option value="">All locations</option>
                {#each data.locations as l}
                  <option value={l.id} selected={l.id === data.locationId}>{l.name}</option>
                {/each}
              </select>
            </label>
          </div>
          <div class="form-actions">
            <button class="btn primary" type="submit">Add holiday</button>
          </div>
        </form>
      </div>
    </details>
  </div>

  <!-- Events -->
  <div class="ev-stack">
  <div class="card">
  <h2>Upcoming events</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Title</th><th>Location</th><th>When</th><th>Attendees</th><th></th></tr>
      </thead>
      <tbody>
        {#each data.events as ev}
          <tr>
            <td class="font-semibold">{ev.title}</td>
            <td>{ev.location?.name ?? '—'}</td>
            <td>{whenLabel(ev.starts_at)}</td>
            <td>{joiningCount(ev)}</td>
            <td>
              <form method="POST" action="?/deleteEvent" use:enhance onsubmit={confirmSubmit(`Delete ${ev.title}?`)}>
                <input type="hidden" name="id" value={ev.id} />
                <button class="btn sm danger" type="submit">Delete</button>
              </form>
            </td>
          </tr>
        {:else}
          <tr><td colspan="5" class="empty">No upcoming events.<br /><button type="button" class="btn primary" onclick={() => (eventPanelOpen = true)}>+ Create event</button></td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<details class="create-panel" bind:open={eventPanelOpen}>
  <summary>+ Create event</summary>
  <div class="panel-body">
    <form method="POST" action="?/createEvent" use:enhance>
      <div class="form-grid">
        <label class="field"><span>Title *</span><input type="text" name="title" required placeholder="e.g. Summer kickoff" /></label>
        <label class="field">
          <span>Location</span>
          <select name="location_id">
            <option value="">— none —</option>
            {#each data.locations as l}
              <option value={l.id} selected={l.id === data.locationId}>{l.name}</option>
            {/each}
          </select>
        </label>
        <label class="field"><span>Starts at *</span><input type="datetime-local" name="starts_at" required /></label>
        <label class="field"><span>Image URL</span><input type="text" name="image_url" placeholder="/dummy_image4.jpg" /></label>
        <label class="field full"><span>Description</span><textarea name="description" placeholder="Optional description"></textarea></label>
      </div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Create event</button>
      </div>
    </form>
  </div>
</details>
  </div>
  </div>
{/if}

<!-- ============ DUPLICATE ACTION BAR ============ -->
{#if dupMode && data.locationId}
  <div class="dup-bar">
    <span class="dup-count">{dupSelected.length} day{dupSelected.length === 1 ? '' : 's'} selected</span>
    <span class="dup-arrow">→</span>
    <form
      method="POST"
      action="?/copyDays"
      class="dup-form"
      use:enhance={() => {
        return async ({ update }) => {
          // copyDays redirects to the target week on success; reset local state.
          dupMode = false;
          dupSelected = [];
          await update();
        };
      }}
      onsubmit={(e) => {
        if (!dupSelected.length) {
          e.preventDefault();
          return;
        }
        confirmSubmit({
          message: `Duplicate ${dupSelected.length} day(s) into ${dupTargetLabel}?`,
          danger: false,
          title: 'Duplicate days?',
          confirmLabel: 'Duplicate'
        })(e);
      }}
    >
      <input type="hidden" name="location_id" value={data.locationId} />
      <input type="hidden" name="sources" value={dupSelected.join(',')} />
      <label class="dup-target">
        <span>Target week</span>
        <select name="target_week_start" bind:value={dupTarget}>
          {#each weekOptions as o}
            <option value={o.value}>{o.label}</option>
          {/each}
        </select>
      </label>
      <button class="btn sm primary" type="submit" disabled={!dupSelected.length}>
        Duplicate {dupSelected.length || ''} →
      </button>
      <button class="btn sm" type="button" onclick={cancelDup}>Cancel</button>
    </form>
  </div>
{/if}

<!-- ============ DAY PLANNER MODAL ============ -->
{#if plannerDay && plannerIdx >= 0}
  <div
    class="planner-overlay"
    onclick={(e) => { if (e.target === e.currentTarget) closePlanner(); }}
    onkeydown={() => {}}
    role="presentation"
  >
    <div class="planner-panel" role="dialog" aria-modal="true" aria-label="Day planner">
      <!-- Header -->
      <div class="pl-head">
        <div>
          <h2 class="pl-title">Plan — {dayHeader(plannerDay, plannerIdx)}</h2>
          <div class="pl-loc">{data.location?.name ?? ''}</div>
        </div>
        <button type="button" class="pl-close" aria-label="Close planner" onclick={closePlanner}>×</button>
      </div>

      <!-- Subheader: opening hours + holiday -->
      <div class="pl-sub">
        {#if plannerClosed}
          <span class="pl-closed">Closed today</span>
        {:else if plannerHours}
          <span class="pl-open">Open {hhmm(plannerHours.open)}–{hhmm(plannerHours.close)}</span>
        {/if}
        {#if plannerHolidayName}
          <span class="pl-holiday-chip">🎉 {plannerHolidayName}</span>
        {/if}
      </div>

      {#if plannerError}
        <div class="alert error" style="margin-bottom: 0.75rem;">⚠️ {plannerError}</div>
      {:else if form?.message && !form?.success}
        <div class="alert error" style="margin-bottom: 0.75rem;">⚠️ {form.message}</div>
      {/if}

      <!-- Requirements strip -->
      <div class="pl-req">
        {#each reqRoleNames as rn}
          {@const cov = rowCoverage(rn)}
          {#if cov === 'full'}
            <span class="req-chip ok">{rn} ✓</span>
          {:else if cov === 'partial'}
            <span class="req-chip partial">{rn} · partial</span>
          {:else}
            <span class="req-chip missing">{rn} — missing</span>
          {/if}
        {/each}
        <span class="pl-summary">{plannedSummary.count} shifts · {plannedSummary.hours}h planned</span>
      </div>

      <!-- Timeline grid -->
      <div class="pl-timeline" class:dimmed={plannerClosed || !!plannerHolidayName}>
        <!-- Hour ruler -->
        <div class="tl-ruler-row">
          <div class="tl-rowlabel tl-rulerlabel"></div>
          <div class="tl-ruler">
            {#each rulerTicks as t}
              <div class="tl-tick" style="left: {t.left}%;">
                <span class="tl-tick-line"></span>
                <span class="tl-tick-label">{t.label}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Rows -->
        {#each timelineRows as row, ri}
          {@const blocks = layoutRow(row)}
          {@const lanes = rowLanes(row)}
          <div class="tl-row" class:alt={ri % 2 === 1}>
            <div class="tl-rowlabel">
              <span class="tl-rowname" title={row}>{row}</span>
              {#if !plannerClosed && row !== 'Other'}
                <button
                  type="button"
                  class="tl-row-add"
                  aria-label={`Add ${row} block`}
                  title={`Add ${row} block`}
                  onclick={() => placeDraft(row)}
                >＋</button>
              {/if}
            </div>
            <div
              class="tl-track"
              data-row={row}
              style="height: {28 + (lanes - 1) * 30}px;"
              role="button"
              tabindex="0"
              aria-label={`${row} timeline — click to add a block`}
              onclick={(e) => { if (!plannerClosed && row !== 'Other') onTrackClick(e, row); }}
              onkeydown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !plannerClosed && row !== 'Other') { e.preventDefault(); placeDraft(row); } }}
            >
              <!-- Open-hours band -->
              {#if plannerHours && !plannerClosed}
                <div class="tl-band" style="left: {bandLeft}%; width: {bandWidth}%;"></div>
              {/if}
              <!-- Partial-coverage gap segments (required rows only) -->
              {#if plannerHours && !plannerClosed && row !== 'Other'}
                {#each rowGaps(row) as g}
                  {@const gw = gapWidth(g)}
                  <div class="tl-gap" style="left: {gapLeft(g)}%; width: {gw}%;">
                    {#if gw > 8}
                      <span class="tl-gap-label">{fromMinutes(g.start)}–{fromMinutes(g.end)}</span>
                    {/if}
                  </div>
                {/each}
              {/if}
              <!-- Blocks -->
              {#each blocks as b}
                <div
                  class="tl-block"
                  style="left: {blockLeft(b.s)}%; width: {blockWidth(b.s)}%; top: {b.lane * 30 + 2}px; background: {roleColor(row === 'Other' ? shiftRole(b.s) : row)};"
                  title={blockTitle(b.s)}
                  onpointerdown={(e) => { if (!plannerClosed) startShiftDrag(e, b.s, 'move'); }}
                >
                  <span
                    class="tl-block-handle l"
                    onpointerdown={(e) => { if (!plannerClosed) startShiftDrag(e, b.s, 'left'); }}
                    aria-hidden="true"
                  ></span>
                  <span class="tl-block-label">{blockLabel(b.s)}</span>
                  <span
                    class="tl-block-handle r"
                    onpointerdown={(e) => { if (!plannerClosed) startShiftDrag(e, b.s, 'right'); }}
                    aria-hidden="true"
                  ></span>
                  <button
                    type="button"
                    class="tl-block-x"
                    aria-label="Delete shift"
                    onpointerdown={(e) => e.stopPropagation()}
                    onclick={async (e) => {
                      e.stopPropagation();
                      const delForm = e.currentTarget.nextElementSibling as HTMLFormElement | null;
                      if (await confirmDialog({ message: 'Delete this shift?', danger: true })) {
                        delForm?.requestSubmit();
                      }
                    }}
                  >×</button>
                  <form method="POST" action="?/deleteShift" use:enhance style="display:none;">
                    <input type="hidden" name="id" value={b.s.id} />
                  </form>
                </div>
              {/each}

              <!-- Editing layer: the saved block being moved/resized/reassigned -->
              {#if editing && editing.row === row}
                {@const ed = editing}
                {@const edShift = () => ({ id: ed.id, start_time: fromMinutes(ed.start), end_time: fromMinutes(ed.end), role_label: ed.row })}
                <div
                  class="tl-block editing"
                  style="left: {((ed.start - T_START) / T_SPAN) * 100}%; width: {((ed.end - ed.start) / T_SPAN) * 100}%; top: 2px; background: {roleColor(row === 'Other' ? 'Other' : row)};"
                  onpointerdown={(e) => startShiftDrag(e, edShift(), 'move')}
                >
                  <span
                    class="tl-block-handle l"
                    onpointerdown={(e) => startShiftDrag(e, edShift(), 'left')}
                    aria-hidden="true"
                  ></span>
                  <span class="tl-block-label">{fromMinutes(ed.start)}–{fromMinutes(ed.end)}{savingEdit ? ' · saving…' : ''}</span>
                  <span
                    class="tl-block-handle r"
                    onpointerdown={(e) => startShiftDrag(e, edShift(), 'right')}
                    aria-hidden="true"
                  ></span>
                </div>
              {/if}

              <!-- Draft rectangle: drag to move, drag the edges to resize -->
              {#if draft && draft.row === row}
                <div
                  class="tl-draft"
                  style="left: {((draft.start - T_START) / T_SPAN) * 100}%; width: {((draft.end - draft.start) / T_SPAN) * 100}%; border-color: {roleColor(row)}; background: {roleColor(row)}26; color: {roleColor(row)};"
                  onpointerdown={(e) => startDrag(e, 'move')}
                >
                  <span
                    class="tl-draft-handle l"
                    onpointerdown={(e) => startDrag(e, 'left')}
                    aria-hidden="true"
                  ></span>
                  <span class="tl-draft-label">{fromMinutes(draft.start)}–{fromMinutes(draft.end)}</span>
                  <span
                    class="tl-draft-handle r"
                    onpointerdown={(e) => startDrag(e, 'right')}
                    aria-hidden="true"
                  ></span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Confirm row for the draft rectangle -->
          {#if draft && draft.row === row && !plannerClosed}
            {@const grp = staffForRole(row)}
            <form
              method="POST"
              action="?/createShift"
              class="pl-addbar"
              use:revealBar
              use:enhance={() => {
                draftSaving = true;
                return async ({ result, update }) => {
                  draftSaving = false;
                  if (result.type === 'failure') {
                    plannerError =
                      ((result.data as Record<string, unknown>)?.message as string) ??
                      'Could not add the shift.';
                    await update({ reset: false });
                  } else if (result.type === 'error') {
                    plannerError = 'Could not add the shift — network or server error.';
                  } else {
                    plannerError = null;
                    draft = null;
                    draftUser = '';
                    await update();
                  }
                };
              }}
            >
              <input type="hidden" name="location_id" value={data.locationId} />
              <input type="hidden" name="shift_date" value={plannerDay} />
              <input type="hidden" name="role_label" value={row} />
              <input type="hidden" name="start_time" value={fromMinutes(draft.start)} />
              <input type="hidden" name="end_time" value={fromMinutes(draft.end)} />
              <span class="ab-role" style="color: {roleColor(row)};">
                {row} · {fromMinutes(draft.start)}–{fromMinutes(draft.end)}
              </span>
              {#if data.staff.length === 0}
                <span class="ab-warn">No staff at this restaurant yet — add team members in the location hub first.</span>
              {:else}
                <select name="user_id" bind:value={draftUser} required aria-label="Employee">
                  <option value="">Who's working?</option>
                  {#if grp.matching.length}
                    <optgroup label={row}>
                      {#each grp.matching as p}
                        <option value={p.id}>{fullName(p)}</option>
                      {/each}
                    </optgroup>
                  {/if}
                  {#if grp.others.length}
                    <optgroup label="Other staff">
                      {#each grp.others as p}
                        <option value={p.id}>{fullName(p)}</option>
                      {/each}
                    </optgroup>
                  {/if}
                </select>
                <button type="submit" class="btn sm primary" disabled={!draftUser || draftSaving}>
                  {draftSaving ? 'Adding…' : 'Add shift'}
                </button>
              {/if}
              <button type="button" class="btn sm" onclick={cancelDraft}>Cancel</button>
              <span class="ab-hint">drag the block to move it · drag its edges to resize</span>
            </form>
          {/if}
        {/each}
      </div>

      {#if !plannerClosed}
        <p class="pl-hint">Click anywhere on a role's timeline to drop a shift block at that time, or use the ＋ next to the role name. Drag the block to move it; drag its edges to stretch it.</p>
        <p class="pl-hint">Drag a planned block to move it, its edges to stretch, or drop it on another role's row to reassign.</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* ---- Unified toolbar ---- */
  .sched-toolbar { padding: 0.85rem 1.25rem; }

  .st-row {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  .st-loc select {
    width: auto;
    font-weight: 700;
    font-size: 0.95rem;
  }

  .st-weeknav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .st-weeklabel {
    font-size: 0.92rem;
    min-width: 130px;
    text-align: center;
  }

  .st-tools {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.9rem;
    flex-wrap: wrap;
  }

  /* ---- Week/Month view toggle ---- */
  .view-toggle {
    display: inline-flex;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }
  .view-toggle .vt {
    padding: 0.32rem 0.85rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-decoration: none;
  }
  .view-toggle .vt + .vt { border-left: 1px solid var(--color-border); }
  .view-toggle .vt.active {
    background: #111827;
    color: #fff;
  }

  /* ---- Duplicate toggle button + helper ---- */
  .dup-toggle.dup-on {
    background: #6b21a8;
    color: #fff;
    border-color: #6b21a8;
  }
  .dup-help {
    margin: 0.6rem 0 0;
    font-size: 0.78rem;
    color: #6b21a8;
    font-weight: 600;
  }

  /* ---- Selected-day highlight (week grid + month grid) ---- */
  .day-col.dup-selected,
  .mg-cell.dup-selected {
    outline: 2px solid #6b21a8;
    outline-offset: -2px;
    box-shadow: 0 0 0 4px rgba(107, 33, 168, 0.12);
  }
  .week-grid.dup-mode .day-head { cursor: copy; }
  .dh-check {
    float: right;
    font-size: 0.95rem;
    color: #6b21a8;
    line-height: 1;
  }

  /* ---- Month calendar grid ---- */
  .month-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
  }
  .mg-dow {
    text-align: center;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    padding-bottom: 0.2rem;
  }
  .mg-cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
    min-height: 64px;
    padding: 0.4rem 0.45rem;
    border: 1px solid var(--color-border);
    border-radius: 9px;
    background: #fff;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .mg-cell:hover { border-color: #6b21a8; }
  .mg-cell.out-month { opacity: 0.4; }
  .mg-cell.today {
    border-color: #b8f45a;
    background: #f6ffe9;
  }
  .mg-num { font-size: 0.82rem; font-weight: 700; color: var(--color-text); }
  .mg-check {
    position: absolute;
    top: 0.35rem;
    right: 0.4rem;
    font-size: 0.95rem;
    color: #6b21a8;
    line-height: 1;
  }
  .mg-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #d1d5db;
  }
  .mg-count { font-size: 0.68rem; color: var(--color-text-muted); font-weight: 600; }
  .mg-count.muted-count { color: #9ca3af; font-weight: 500; }

  /* coverage status colours (dot + subtle cell tint) */
  .mg-cell.status-full .mg-dot { background: #22c55e; }
  .mg-cell.status-partial .mg-dot { background: #d97706; }
  .mg-cell.status-missing .mg-dot { background: #dc2626; }
  .mg-cell.status-none .mg-dot { background: #fca5a5; }
  .mg-cell.status-closed,
  .mg-cell.status-holiday {
    background: repeating-linear-gradient(45deg, #f6f6f6, #f6f6f6 6px, #fbfbfb 6px, #fbfbfb 12px);
  }
  .mg-cell.status-closed .mg-dot,
  .mg-cell.status-holiday .mg-dot { background: #cbd5e1; }
  .mg-cell.status-holiday { background: #fff5f5; }
  .mg-cell.status-holiday .mg-dot { background: #fca5a5; }

  .mg-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    margin-top: 0.9rem;
    font-size: 0.74rem;
    color: var(--color-text-muted);
  }
  .mg-legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
  .mg-legend i.lg { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .mg-legend i.lg.full { background: #22c55e; }
  .mg-legend i.lg.partial { background: #d97706; }
  .mg-legend i.lg.missing { background: #dc2626; }
  .mg-legend i.lg.none { background: #fca5a5; }
  .mg-legend i.lg.closed { background: #cbd5e1; }

  @media (max-width: 640px) {
    .mg-cell { min-height: 52px; padding: 0.3rem; }
    .mg-count { display: none; }
  }

  /* ---- Duplicate action bar (sticky bottom) ---- */
  .dup-bar {
    position: fixed;
    left: 50%;
    bottom: 1rem;
    transform: translateX(-50%);
    z-index: 900;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding: 0.7rem 1rem;
    background: #fff;
    border: 1px solid #e9d5ff;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
    max-width: calc(100vw - 2rem);
  }
  .dup-bar .dup-count { font-weight: 700; font-size: 0.85rem; color: #6b21a8; white-space: nowrap; }
  .dup-bar .dup-arrow { color: var(--color-text-muted); }
  .dup-form {
    display: flex;
    align-items: flex-end;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .dup-target { display: flex; flex-direction: column; gap: 0.15rem; }
  .dup-target > span {
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-muted);
  }
  .dup-target select { width: auto; font-size: 0.82rem; padding: 0.3rem 0.4rem; }

  /* ---- Holidays + events side by side ---- */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    align-items: start;
  }

  @media (max-width: 1000px) {
    .two-col { grid-template-columns: 1fr; }
  }

  .ev-stack { display: flex; flex-direction: column; gap: 1.25rem; }

  .pl-hint {
    margin-top: 0.6rem;
    font-size: 0.78rem;
    color: var(--color-text-muted);
  }

  /* ---- Draft rectangle (drag/resize before confirming) ---- */
  .tl-draft {
    position: absolute;
    top: 2px;
    height: 24px;
    border: 2px dashed currentColor;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    touch-action: none;
    z-index: 5;
    min-width: 24px;
  }

  .tl-draft:active { cursor: grabbing; }

  .tl-draft-label {
    font-size: 0.68rem;
    font-weight: 800;
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
  }

  .tl-draft-handle {
    position: absolute;
    top: -6px;
    bottom: -6px;
    width: 14px;
    cursor: ew-resize;
    touch-action: none;
  }

  .tl-draft-handle::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 5px;
    height: 16px;
    border-radius: 3px;
    background: currentColor;
  }

  .tl-draft-handle.l { left: -8px; }
  .tl-draft-handle.l::after { left: 4px; }
  .tl-draft-handle.r { right: -8px; }
  .tl-draft-handle.r::after { right: 4px; }

  .ab-warn {
    font-size: 0.8rem;
    color: #b91c1c;
    font-weight: 600;
  }

  .ab-hint {
    font-size: 0.72rem;
    color: var(--color-text-muted);
    margin-left: auto;
  }

  /* ---- Week grid ---- */
  .week-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .day-col {
    border: 1px solid var(--color-border);
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    display: flex;
    flex-direction: column;
  }

  .day-col.today {
    border-color: #b8f45a;
    background: #f2ffe0;
  }

  /* Closed days: dimmed + diagonal stripes */
  .day-col.closed {
    background-image: repeating-linear-gradient(
      45deg,
      #f6f6f6,
      #f6f6f6 8px,
      #fbfbfb 8px,
      #fbfbfb 16px
    );
    opacity: 0.85;
  }
  .day-col.closed .day-body { opacity: 0.7; }

  /* Holiday days: red-tinted + dimmed body */
  .day-col.holiday {
    border-color: #fca5a5;
    background: #fff5f5;
  }
  .day-col.holiday .day-body { opacity: 0.8; }

  .day-head {
    display: block;
    width: 100%;
    text-align: left;
    font: inherit;
    cursor: pointer;
    padding: 0.45rem 0.55rem;
    border: none;
    border-bottom: 1px solid var(--color-border);
    background: #fafafa;
    white-space: nowrap;
  }
  .day-head:hover { background: #f0f0f0; }
  .day-head .dh-top {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text);
  }
  .day-head .dh-hours {
    font-size: 0.66rem;
    color: var(--color-text-muted);
    margin-top: 0.1rem;
  }
  .day-head.today .dh-top { color: #3e6b00; }
  .day-head.today {
    background: #f2ffe0;
    border-bottom-color: #f6c9a6;
  }

  .holiday-chip {
    margin: 0.4rem 0.5rem 0;
    padding: 0.25rem 0.45rem;
    background: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fca5a5;
    border-radius: 6px;
    font-size: 0.68rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .day-body {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    min-height: 90px;
  }

  .shift-card {
    position: relative;
    border: 1px solid var(--color-border);
    border-left: 4px solid var(--color-border);
    border-radius: 8px;
    padding: 0.4rem 0.5rem;
    background: #fff;
    font-size: 0.78rem;
  }
  .shift-card .emp { font-weight: 700; padding-right: 1rem; line-height: 1.2; }
  .shift-card .time { color: var(--color-text); }
  .shift-card .role { font-size: 0.7rem; font-weight: 600; margin-top: 0.1rem; }

  .shift-card .x {
    position: absolute;
    top: 0.15rem;
    right: 0.2rem;
    border: none;
    background: transparent;
    color: #b91c1c;
    font-size: 0.95rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.15rem;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .shift-card:hover .x { opacity: 1; }
  .shift-card .x:hover { background: #fef2f2; }

  /* ---- Missing-role chips ---- */
  .missing-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
  }
  .missing-label {
    font-size: 0.66rem;
    font-weight: 700;
    color: #b91c1c;
  }
  .warn-chip {
    display: inline-block;
    font-size: 0.66rem;
    font-weight: 600;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    border: 1px solid #fca5a5;
    color: #b91c1c;
    background: #fff;
  }
  .warn-chip.soft {
    border-color: #fcd34d;
    color: #b45309;
    background: #fffbeb;
  }
  .warn-chip.partial {
    border: 1px dashed #d97706;
    color: #a16207;
    background: #fef3c7;
  }

  /* ---- Inline add ---- */
  .add-btn {
    margin-top: auto;
    border: 1px dashed var(--color-border);
    background: #fff;
    color: var(--color-text-muted);
    border-radius: 8px;
    padding: 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
  }
  .add-btn:hover {
    border-color: #b8f45a;
    color: #3e6b00;
    background: #f2ffe0;
  }

  @media (max-width: 900px) {
    .week-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* ============ DAY PLANNER MODAL ============ */
  .planner-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 2.5vh 1rem;
    z-index: 1000;
  }
  .planner-panel {
    background: #fff;
    border-radius: 16px;
    padding: 1.25rem;
    width: 94vw;
    max-width: 1100px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
  }

  .pl-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  .pl-title { margin: 0; font-size: 1.05rem; }
  .pl-loc { color: var(--color-text-muted); font-size: 0.8rem; margin-top: 0.1rem; }
  .pl-close {
    border: none;
    background: transparent;
    font-size: 1.6rem;
    line-height: 1;
    cursor: pointer;
    color: var(--color-text-muted);
    padding: 0 0.25rem;
    border-radius: 6px;
  }
  .pl-close:hover { background: #f3f3f3; color: var(--color-text); }

  .pl-sub {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.8rem;
  }
  .pl-open { color: var(--color-text); font-weight: 600; }
  .pl-closed { color: #b91c1c; font-weight: 700; }
  .pl-holiday-chip {
    background: #fee2e2;
    color: #b91c1c;
    border: 1px solid #fca5a5;
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
  }

  /* Requirements strip */
  .pl-req {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0.75rem 0;
    padding: 0.5rem 0;
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
  }
  .req-chip {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
  }
  .req-chip.ok {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }
  .req-chip.partial {
    background: #fef3c7;
    color: #a16207;
    border: 1px dashed #d97706;
  }
  .req-chip.missing {
    background: #fff;
    color: #b91c1c;
    border: 1px solid #fca5a5;
  }
  .pl-summary { margin-left: auto; color: var(--color-text-muted); font-size: 0.75rem; }

  /* Timeline */
  .pl-timeline { margin-top: 0.5rem; }
  .pl-timeline.dimmed { opacity: 0.55; }

  .tl-ruler-row,
  .tl-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    align-items: stretch;
  }
  .tl-rowlabel {
    position: sticky;
    left: 0;
    z-index: 2;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    padding: 0 0.5rem;
    border-right: 1px solid var(--color-border);
    font-size: 0.72rem;
  }
  .tl-rulerlabel { border-right: 1px solid var(--color-border); }
  .tl-rowname {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text);
    font-weight: 600;
  }
  .tl-row-add {
    flex: none;
    border: 1px solid var(--color-border);
    background: #fff;
    color: var(--color-text-muted);
    border-radius: 6px;
    width: 20px;
    height: 20px;
    line-height: 1;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0;
  }
  .tl-row-add:hover { border-color: #b8f45a; color: #3e6b00; background: #f2ffe0; }

  .tl-ruler {
    position: relative;
    height: 22px;
  }
  .tl-tick {
    position: absolute;
    top: 0;
    bottom: 0;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .tl-tick-line {
    width: 1px;
    height: 6px;
    background: var(--color-border);
  }
  .tl-tick-label {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin-top: 1px;
  }

  .tl-track {
    position: relative;
    background: #f6f6f6;
    border-bottom: 1px solid var(--color-border);
    border-right: 1px solid var(--color-border);
    cursor: pointer;
    min-height: 28px;
  }
  .tl-row.alt .tl-track { background: #fafafa; }
  .tl-row.alt .tl-rowlabel { background: #fafafa; }

  .tl-band {
    position: absolute;
    top: 0;
    bottom: 0;
    background: #f0fdf4;
    border-left: 1px dashed #bbf7d0;
    border-right: 1px dashed #bbf7d0;
  }

  /* Partial-coverage gap segment (amber diagonal stripes over the band area). */
  .tl-gap {
    position: absolute;
    top: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
    background: repeating-linear-gradient(
      45deg,
      rgba(217, 119, 6, 0.25) 0 6px,
      rgba(217, 119, 6, 0.08) 6px 12px
    );
    border-top: 1px dashed #d97706;
    border-bottom: 1px dashed #d97706;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .tl-gap-label {
    font-size: 0.6rem;
    font-weight: 700;
    color: #a16207;
    white-space: nowrap;
  }

  .tl-block {
    position: absolute;
    height: 26px;
    min-width: 18px;
    border-radius: 6px;
    padding: 2px 6px;
    color: #fff;
    font-size: 0.7rem;
    line-height: 1.5;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    opacity: 0.85;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }
  .tl-block:hover { opacity: 1; }
  .tl-block-label {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }
  .tl-block-x {
    position: absolute;
    top: 1px;
    right: 1px;
    border: none;
    background: rgba(0, 0, 0, 0.25);
    color: #fff;
    border-radius: 4px;
    font-size: 0.8rem;
    line-height: 1;
    width: 16px;
    height: 16px;
    cursor: pointer;
    padding: 0;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .tl-block:hover .tl-block-x { opacity: 1; }
  .tl-block-x:hover { background: rgba(0, 0, 0, 0.45); }

  /* Saved blocks sit above gap stripes and are draggable. */
  .tl-block {
    z-index: 2;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }
  .tl-block:active { cursor: grabbing; }

  /* Edge handles on saved blocks (mirror the draft handles). */
  .tl-block-handle {
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 12px;
    cursor: ew-resize;
    touch-action: none;
    z-index: 3;
  }
  .tl-block-handle.l { left: -6px; }
  .tl-block-handle.r { right: -6px; }
  .tl-block:hover .tl-block-handle::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 14px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.8);
  }

  /* The block currently being edited: dashed ring, lifted, on top. */
  .tl-block.editing {
    z-index: 10;
    outline: 2px dashed #fff;
    outline-offset: -3px;
    opacity: 1;
    transform: scale(1.04);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  /* Add bar */
  .pl-addbar {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.85rem;
    padding: 0.65rem;
    border: 1px solid #f6c9a6;
    background: #fffaf6;
    border-radius: 10px;
  }
  .ab-role {
    font-weight: 700;
    font-size: 0.8rem;
    align-self: center;
  }
  .ab-field { display: flex; flex-direction: column; gap: 0.15rem; }
  .ab-field.grow { flex: 1 1 160px; }
  .ab-field > span {
    font-size: 0.64rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-muted);
  }
  .ab-field select,
  .ab-field input {
    font-size: 0.78rem;
    padding: 0.3rem 0.4rem;
  }
  .ab-actions { display: flex; gap: 0.4rem; margin-left: auto; }

  @media (max-width: 640px) {
    .tl-ruler-row,
    .tl-row { grid-template-columns: 84px 1fr; }
    .pl-addbar { flex-direction: column; align-items: stretch; }
    .ab-actions { margin-left: 0; justify-content: flex-end; }
  }
</style>
