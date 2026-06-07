<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { fullName } from '$lib/types';

  let { data } = $props();

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtHour(iso: string) {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function initials(p: { first_name?: string; last_name?: string } | null | undefined) {
    if (!p) return '?';
    return `${(p.first_name ?? '').charAt(0)}${(p.last_name ?? '').charAt(0)}`.toUpperCase() || '?';
  }

  function onBreak(entry: any): boolean {
    return (entry.breaks ?? []).some((b: any) => b.break_end === null);
  }

  function entriesForLocation(locId: string) {
    return data.openEntries.filter((e: any) => e.user?.location_id === locId);
  }

  const unassignedOnSite = $derived(
    data.openEntries.filter((e: any) => {
      const lid = e.user?.location_id;
      return !lid || !data.locations.some((l: any) => l.id === lid);
    })
  );

  const longDate = $derived(
    new Date(data.date + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  );

  function changeDate(d: string) {
    if (d) goto(`/admin/live?date=${d}`);
  }

  // auto-refresh ONLY when viewing today
  $effect(() => {
    if (!data.isToday) return;
    const id = setInterval(() => invalidateAll(), 30000);
    return () => clearInterval(id);
  });

  const priorityColor: Record<string, string> = {
    low: 'gray',
    medium: 'blue',
    high: 'yellow',
    critical: 'red'
  };

  // ---- deviation ordering: problems first ----
  const problemStates = ['overdue', 'missed', 'late'];
  const stateRank = (s: string) => (problemStates.includes(s) ? 0 : s === 'done_no_time' ? 1 : 2);
  const sortedDeviations = $derived(
    [...data.deviations].sort((a, b) => {
      const r = stateRank(a.state) - stateRank(b.state);
      if (r !== 0) return r;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    })
  );

  function devLabel(d: any) {
    switch (d.state) {
      case 'on_time':
        return { cls: 'green', text: 'On time', sub: d.deviationMin && d.deviationMin < 0 ? `${d.deviationMin}m early` : '' };
      case 'late':
        return { cls: 'red', text: `Late +${d.deviationMin}m`, sub: '' };
      case 'overdue':
        return { cls: 'red', text: `Overdue · ${d.lateBy}m`, sub: '' };
      case 'missed':
        return { cls: 'red', text: 'Missed', sub: '' };
      case 'done_no_time':
        return { cls: 'green', text: 'Done', sub: 'no finish time' };
      default:
        return { cls: 'gray', text: '—', sub: `Due ${fmtTime(d.deadline)}` };
    }
  }

  // ---- event timeline phrasing ----
  function quoted(ev: any): string {
    return ev.taskName ? `“${ev.taskName}”` : 'a task';
  }

  function describe(ev: any): { icon: string; text: string } {
    const a = ev.actor;
    const action: string = ev.action ?? '';
    const d = ev.details ?? {};

    switch (action) {
      case 'time.checked_in':
        return { icon: '\u{1F7E2}', text: `${a} checked in${d?.via === 'qr' ? ' via QR' : ''}` };
      case 'time.checked_out':
        return { icon: '⚪', text: `${a} checked out` };
      case 'time.break_started':
        return { icon: '☕', text: `${a} started a break` };
      case 'time.break_ended':
        return { icon: '▶️', text: `${a} ended their break` };
      case 'task.submitted':
        return { icon: '\u{1F4E4}', text: `${a} submitted ${quoted(ev)} for approval` };
      case 'task.completed':
        return { icon: '✅', text: `${a} completed ${quoted(ev)}` };
      case 'task.approved':
        return { icon: '\u{1F44D}', text: `${a} approved ${quoted(ev)}` };
      case 'task.rejected':
        return { icon: '↩️', text: `${a} returned ${quoted(ev)}` };
      case 'task_instances.generated':
        return { icon: '\u{1F5D3}️', text: `${a} generated the day’s tasks` };
      case 'post.urgent_broadcast':
        return { icon: '\u{1F6A8}', text: `${a} sent an urgent broadcast` };
      case 'user.login':
        return { icon: '\u{1F511}', text: `${a} signed in` };
      case 'user.logout':
        return { icon: '\u{1F511}', text: `${a} signed out` };
    }

    // dotted families: <entity>.<verb>
    const dot = action.indexOf('.');
    if (dot > 0) {
      const family = action.slice(0, dot);
      const verb = action.slice(dot + 1);
      const verbWord: Record<string, string> = {
        created: 'created',
        updated: 'updated',
        deleted: 'deleted',
        copied: 'copied',
        cleared: 'cleared',
        published: 'published'
      };
      const v = verbWord[verb] ?? verb.replace(/_/g, ' ');

      const familyNoun: Record<string, string> = {
        shift: 'a shift',
        sop: 'an SOP',
        task_template: 'a task template',
        responsibility: 'a responsibility',
        department: 'a department',
        job_role: 'a job role',
        location: 'a location',
        company: 'company details',
        holiday: 'a holiday',
        event: 'an event',
        post: 'a post',
        attendance_qr: 'QR attendance settings',
        attendance_display: 'the attendance display',
        chat: 'chat settings',
        profile: 'a profile',
        user: 'a user'
      };
      const noun = familyNoun[family];
      if (noun) {
        const icon =
          verb === 'created' ? '➕' : verb === 'deleted' ? '\u{1F5D1}️' : '✏️';
        return { icon, text: `${a} ${v} ${noun}` };
      }
    }

    return { icon: '•', text: `${a} · ${action}` };
  }

  // group timeline by hour
  const groupedTimeline = $derived.by(() => {
    const groups: { hour: string; items: any[] }[] = [];
    let cur: { hour: string; items: any[] } | null = null;
    for (const ev of data.timeline) {
      const h = new Date(ev.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).slice(0, 2) + ':00';
      if (!cur || cur.hour !== h) {
        cur = { hour: h, items: [] };
        groups.push(cur);
      }
      cur.items.push(ev);
    }
    return groups;
  });
</script>

<div class="page-head">
  <div>
    <h1>
      {#if data.isToday}<span class="live-dot" aria-hidden="true"></span>{/if}
      Live
      {#if !data.isToday}<span class="badge gray hist">historical view</span>{/if}
    </h1>
    <p>
      {longDate}
      {#if data.isToday}· auto-refreshes every 30s{:else}· read-only{/if}
    </p>
  </div>
  {#if data.isToday}
    <button class="btn" type="button" onclick={() => invalidateAll()}>Refresh</button>
  {/if}
</div>

<div class="date-bar">
  <button class="btn sm" type="button" onclick={() => changeDate(data.prevDate)} title="Previous day">◀</button>
  <input
    type="date"
    value={data.date}
    max={data.todayDate}
    onchange={(e) => changeDate((e.currentTarget as HTMLInputElement).value)}
  />
  <button class="btn sm" type="button" onclick={() => changeDate(data.nextDate)} title="Next day">▶</button>
  {#if !data.isToday}
    <button class="btn sm primary" type="button" onclick={() => changeDate(data.todayDate)}>Today</button>
  {/if}
</div>

<div class="stat-grid">
  <div class="stat">
    <div class="label">On shift now</div>
    <div class="value green">{data.isToday ? data.stats.onShift : '—'}</div>
    {#if data.isToday && data.stats.onBreak > 0}<div class="sub">{data.stats.onBreak} on break</div>{/if}
  </div>
  <div class="stat">
    <div class="label">Tasks finished</div>
    <div class="value">{data.stats.tasksFinished}<span class="of"> / {data.stats.tasksTotal}</span></div>
  </div>
  <div class="stat">
    <div class="label">Late</div>
    <div class="value" class:red={data.stats.tasksLate > 0}>{data.stats.tasksLate}</div>
  </div>
  <div class="stat">
    <div class="label">{data.isToday ? 'Overdue' : 'Missed'}</div>
    <div class="value" class:red={data.stats.tasksOverdueMissed > 0}>{data.stats.tasksOverdueMissed}</div>
  </div>
  <div class="stat">
    <div class="label">Events logged</div>
    <div class="value">{data.stats.events}</div>
    <div class="sub">{data.stats.peopleWorked} people on the floor</div>
  </div>
</div>

{#if data.isToday}
  <div class="card">
    <h2>Who's on now</h2>
    {#if data.openEntries.length === 0}
      <div class="empty">Nobody is checked in right now.</div>
    {:else}
      <div class="now-grid">
        {#each data.locations as l}
          {@const onSite = entriesForLocation(l.id)}
          {#if onSite.length}
            <div class="now-loc">
              <div class="now-loc-name">{l.name}</div>
              <ul class="people">
                {#each onSite as e}
                  <li>
                    <span class="avatar-sm">
                      {#if e.user?.avatar_url}<img src={e.user.avatar_url} alt="" />{:else}{initials(e.user)}{/if}
                    </span>
                    <span class="p-name">{fullName(e.user) || 'Unknown'}</span>
                    {#if onBreak(e)}
                      <span class="badge yellow">on break</span>
                    {:else}
                      <span class="badge green">since {fmtTime(e.clock_in)}</span>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {/each}
        {#if unassignedOnSite.length}
          <div class="now-loc">
            <div class="now-loc-name">Other</div>
            <ul class="people">
              {#each unassignedOnSite as e}
                <li>
                  <span class="avatar-sm">
                    {#if e.user?.avatar_url}<img src={e.user.avatar_url} alt="" />{:else}{initials(e.user)}{/if}
                  </span>
                  <span class="p-name">{fullName(e.user) || 'Unknown'}</span>
                  {#if onBreak(e)}
                    <span class="badge yellow">on break</span>
                  {:else}
                    <span class="badge green">since {fmtTime(e.clock_in)}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<div class="card">
  <h2>Deviations</h2>
  <p class="cap">Deviation = actual finish vs the scheduled deadline.</p>
  {#if sortedDeviations.length === 0}
    <div class="empty">No tasks scheduled on {longDate}.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Task</th><th>Location</th><th>Priority</th><th>Deadline</th><th>Finished</th><th>Deviation</th>
          </tr>
        </thead>
        <tbody>
          {#each sortedDeviations as d}
            {@const dl = devLabel(d)}
            <tr>
              <td class="font-semibold">{d.name}</td>
              <td>{d.location}</td>
              <td><span class="badge {priorityColor[d.priority] ?? 'gray'}">{d.priority}</span></td>
              <td>{fmtTime(d.deadline)}</td>
              <td>{d.finishedAt ? fmtTime(d.finishedAt) : '—'}</td>
              <td>
                <span class="badge {dl.cls}">{dl.text}</span>
                {#if dl.sub}<span class="dev-sub">{dl.sub}</span>{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<div class="card">
  <h2>Event timeline</h2>
  {#if data.timeline.length === 0}
    <div class="empty">No activity recorded on {longDate}.</div>
  {:else}
    <div class="tl">
      {#each groupedTimeline as g}
        <div class="tl-hour">{g.hour}</div>
        {#each g.items as ev}
          {@const desc = describe(ev)}
          <div class="tl-row">
            <span class="tl-time">{fmtHour(ev.at)}</span>
            <span class="tl-icon" aria-hidden="true">{desc.icon}</span>
            <div class="tl-body">
              <div class="tl-text">{desc.text}</div>
              {#if ev.taskLocation}<span class="tl-meta">{ev.taskLocation}</span>{/if}
              {#if ev.reason}<div class="tl-reason">Reason: {ev.reason}</div>{/if}
            </div>
          </div>
        {/each}
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-head h1 { display: flex; align-items: center; gap: 0.5rem; }
  .page-head h1 .hist { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.05em; }

  .live-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 0 0 rgba(26, 158, 78, 0.6);
    animation: live-pulse 1.6s ease-out infinite;
  }
  @keyframes live-pulse {
    0% { box-shadow: 0 0 0 0 rgba(26, 158, 78, 0.5); }
    70% { box-shadow: 0 0 0 8px rgba(26, 158, 78, 0); }
    100% { box-shadow: 0 0 0 0 rgba(26, 158, 78, 0); }
  }

  .date-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .date-bar input[type='date'] { width: auto; }

  .stat .value .of { font-size: 1rem; font-weight: 700; color: var(--muted); }

  .now-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.9rem;
  }
  .now-loc-name {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    font-weight: 700;
    margin-bottom: 0.45rem;
  }
  .people { list-style: none; display: flex; flex-direction: column; gap: 0.4rem; }
  .people li { display: flex; align-items: center; gap: 0.5rem; }
  .people .p-name { font-size: 0.84rem; font-weight: 600; }
  .people .badge { margin-left: auto; }

  .cap { color: var(--muted); font-size: 0.76rem; margin: -0.4rem 0 0.7rem; }

  .dev-sub { color: var(--muted); font-size: 0.72rem; margin-left: 0.4rem; }

  /* timeline */
  .tl { display: flex; flex-direction: column; }
  .tl-hour {
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 700;
    color: var(--muted-2);
    padding: 0.55rem 0 0.3rem;
    border-bottom: 1px solid var(--border-2);
    margin-bottom: 0.15rem;
  }
  .tl-row {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.4rem 0;
    border-bottom: 1px solid var(--border-2);
  }
  .tl-row:last-child { border-bottom: none; }
  .tl-time {
    width: 62px;
    flex-shrink: 0;
    color: var(--muted);
    font-size: 0.74rem;
    font-variant-numeric: tabular-nums;
    padding-top: 0.05rem;
  }
  .tl-icon { width: 18px; flex-shrink: 0; text-align: center; font-size: 0.9rem; line-height: 1.3; }
  .tl-body { min-width: 0; }
  .tl-text { font-size: 0.85rem; }
  .tl-meta {
    font-size: 0.72rem;
    color: var(--muted);
    background: var(--surface-2);
    border-radius: var(--radius-xs);
    padding: 0.02rem 0.35rem;
    box-shadow: inset 0 0 0 1px var(--border);
  }
  .tl-reason { font-size: 0.74rem; color: var(--muted); margin-top: 0.1rem; }
</style>
