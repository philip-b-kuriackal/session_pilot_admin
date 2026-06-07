<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  const statusBadge: Record<string, string> = {
    pending: 'gray',
    in_progress: 'blue',
    submitted: 'purple',
    approved: 'green',
    completed: 'green',
    rejected: 'red',
    overdue: 'red'
  };

  const weekdayMap: Record<number, string> = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    7: 'Sun'
  };

  function fmtTime(t: string | null): string {
    return t ? t.slice(0, 5) : '—';
  }

  /** Human recurrence summary plus due time, e.g. "Daily · 10:00". */
  function whenSummary(t: any): string {
    const cfg = t.recurrence_config ?? {};
    const time = fmtTime(t.due_time);
    let head: string;
    switch (t.recurrence) {
      case 'daily':
        head = 'Daily';
        break;
      case 'once':
        head = cfg.date ? `Once ${cfg.date}` : 'Once';
        break;
      case 'weekly': {
        const days = (cfg.weekdays ?? []).map((d: number) => weekdayMap[d]).filter(Boolean);
        head = days.length ? `Weekly ${days.join(' ')}` : 'Weekly';
        break;
      }
      case 'monthly':
        head = `Monthly day ${cfg.day_of_month ?? 1}`;
        break;
      case 'custom':
        head = `Every ${cfg.every_n_days ?? 1} days`;
        break;
      default:
        head = t.recurrence;
    }
    return `${head} · ${time}`;
  }

  function assignmentSummary(t: any): string {
    if (t.assignment_mode === 'location') return 'Everyone';
    if (t.assignment_mode === 'job_role') return `Role: ${t.assigned_job_role?.name ?? '—'}`;
    const n = t.task_template_assignees?.[0]?.count ?? 0;
    return `${n} ${n === 1 ? 'person' : 'people'}`;
  }
</script>

<div class="page-head">
  <div>
    <h1>Tasks</h1>
    <p>Recurring task templates and the instances they generate.</p>
  </div>
  <a class="btn primary" href="/admin/tasks/new">+ New task</a>
</div>

{#if form?.message}<div class="alert error">{form.message}</div>{/if}
{#if form?.success && form?.generated !== undefined}
  <div class="alert success">Generated {form.generated} task instance{form.generated === 1 ? '' : 's'}.</div>
{/if}

<!-- ===================== Templates list ===================== -->
<div class="card">
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Where</th><th>When</th><th>Assigned</th>
          <th>Approval</th><th>Active</th>
        </tr>
      </thead>
      <tbody>
        {#each data.templates as t}
          <tr>
            <td class="font-semibold"><a href="/admin/tasks/{t.id}">{t.name}</a></td>
            <td>{t.location?.name ?? 'All'}</td>
            <td>{whenSummary(t)}</td>
            <td>{assignmentSummary(t)}</td>
            <td>
              {#if t.requires_approval}
                <span class="badge orange">Required</span>
              {:else}
                <span class="muted">—</span>
              {/if}
            </td>
            <td>
              <form method="POST" action="?/toggleActive" use:enhance>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="active" value={t.active} />
                <button class="badge-btn badge {t.active ? 'green' : 'gray'}" type="submit" title="Click to toggle">
                  {t.active ? 'active' : 'inactive'}
                </button>
              </form>
            </td>
          </tr>
        {:else}
          <tr><td colspan="6" class="empty">No task templates yet. Create one with “+ New task”.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- ===================== Generated tasks ===================== -->
<div class="card">
  <div class="gen-head">
    <h2>Generated tasks</h2>
    <div class="row-flex">
      <form method="GET" class="row-flex">
        <input type="date" name="date" value={data.date} />
        <button class="btn" type="submit">View</button>
      </form>
      <form method="POST" action="?/generate" use:enhance>
        <input type="hidden" name="date" value={data.date} />
        <button class="btn primary" type="submit">Generate</button>
      </form>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Task</th><th>Location</th><th>Due</th><th>Status</th></tr>
      </thead>
      <tbody>
        {#each data.instances as inst}
          <tr>
            <td class="font-semibold">{inst.template?.name ?? '—'}</td>
            <td>{inst.template?.location?.name ?? 'All'}</td>
            <td>{new Date(inst.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td><span class="badge {statusBadge[inst.status] ?? 'gray'}">{inst.status.replace('_', ' ')}</span></td>
          </tr>
        {:else}
          <tr><td colspan="4" class="empty">No tasks generated for this date.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .gen-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.9rem;
  }
  .gen-head h2 {
    margin-bottom: 0;
  }
  td a {
    color: inherit;
    text-decoration: none;
    font-weight: 600;
  }
  td a:hover {
    color: #3e6b00;
  }
  .badge-btn {
    border: none;
    cursor: pointer;
    font-family: inherit;
  }
</style>
