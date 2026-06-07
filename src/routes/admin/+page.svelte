<script lang="ts">
  import { fullName } from '$lib/types';
  let { data } = $props();

  const statusColor: Record<string, string> = {
    pending: 'gray',
    in_progress: 'blue',
    submitted: 'purple',
    approved: 'green',
    completed: 'green',
    rejected: 'red',
    overdue: 'red'
  };

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="page-head">
  <div>
    <h1>Operations Dashboard</h1>
    <p>{new Date(data.today + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{#if data.generated > 0} · {data.generated} new task{data.generated === 1 ? '' : 's'} generated{/if}</p>
  </div>
  <a class="btn primary" href="/admin/approvals">Review approvals ({data.stats.submitted})</a>
</div>

<div class="stat-grid">
  <div class="stat">
    <div class="label">Today's tasks</div>
    <div class="value">{data.stats.total}</div>
  </div>
  <div class="stat">
    <div class="label">Completed / submitted</div>
    <div class="value green">{data.stats.done}</div>
  </div>
  <div class="stat">
    <div class="label">Open</div>
    <div class="value orange">{data.stats.pending}</div>
  </div>
  <div class="stat">
    <div class="label">Overdue</div>
    <div class="value red">{data.stats.overdue}</div>
  </div>
  <div class="stat">
    <div class="label">Compliance today</div>
    <div class="value">{data.stats.compliance === null ? '—' : data.stats.compliance + '%'}</div>
    <div class="sub">{data.stats.employees} active employees</div>
  </div>
</div>

<div class="card">
  <h2>Locations overview</h2>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Location</th><th>Brand</th><th>Tasks today</th><th>Done</th><th>Overdue</th><th>Compliance</th></tr>
      </thead>
      <tbody>
        {#each data.locationStats as l}
          <tr>
            <td class="font-semibold">{l.name}</td>
            <td>{l.brand?.name ?? '—'}</td>
            <td>{l.total}</td>
            <td>{l.done}</td>
            <td>{#if l.overdue > 0}<span class="badge red">{l.overdue}</span>{:else}0{/if}</td>
            <td>
              {#if l.compliance === null}
                <span class="muted">no tasks</span>
              {:else}
                <div class="row-flex">
                  <div class="bar"><div style="width: {l.compliance}%"></div></div>
                  <span>{l.compliance}%</span>
                </div>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<div class="card">
  <h2>Today's tasks</h2>
  {#if data.instances.length === 0}
    <div class="empty">No tasks due today. Create task templates under <a href="/admin/tasks">Tasks</a>.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Task</th><th>Location</th><th>Due</th><th>Priority</th><th>Status</th></tr>
        </thead>
        <tbody>
          {#each data.instances as i}
            <tr>
              <td class="font-semibold">{i.template?.name}</td>
              <td>{i.template?.location?.name ?? 'All'}</td>
              <td>{fmtTime(i.due_at)}</td>
              <td><span class="badge {i.template?.priority === 'critical' ? 'red' : i.template?.priority === 'high' ? 'orange' : 'gray'}">{i.template?.priority}</span></td>
              <td><span class="badge {statusColor[i.status] ?? 'gray'}">{i.status.replace('_', ' ')}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<div class="card">
  <h2>Recent activity</h2>
  {#if data.recentAudit.length === 0}
    <div class="empty">No activity yet.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Entity</th></tr></thead>
        <tbody>
          {#each data.recentAudit as a}
            <tr>
              <td class="muted">{new Date(a.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
              <td>{fullName(a.actor) || 'System'}</td>
              <td><span class="badge gray">{a.action}</span></td>
              <td class="muted">{a.entity_type ?? ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
