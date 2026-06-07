<script lang="ts">
  let { data } = $props();

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
</script>

<div class="page-head">
  <div>
    <h1>Reports</h1>
    <p>Task completion and compliance across your locations and team.</p>
  </div>
</div>

<div class="card">
  <h2>Filters</h2>
  <form method="GET" class="filters">
    <label class="field">
      <span>From</span>
      <input type="date" name="from" value={data.from} />
    </label>
    <label class="field">
      <span>To</span>
      <input type="date" name="to" value={data.to} />
    </label>
    <label class="field">
      <span>Location</span>
      <select name="location">
        <option value="">All locations</option>
        {#each data.locations as l}
          <option value={l.id} selected={l.id === data.location}>{l.name}</option>
        {/each}
      </select>
    </label>
    <button class="btn primary" type="submit" style="align-self: flex-end;">Apply</button>
  </form>
</div>

<div class="stat-grid">
  <div class="stat">
    <div class="label">Total tasks</div>
    <div class="value">{data.stats.total}</div>
  </div>
  <div class="stat">
    <div class="label">Approved</div>
    <div class="value green">{data.stats.approved}</div>
  </div>
  <div class="stat">
    <div class="label">Submitted</div>
    <div class="value">{data.stats.submitted}</div>
  </div>
  <div class="stat">
    <div class="label">Overdue</div>
    <div class="value red">{data.stats.overdue}</div>
  </div>
  <div class="stat">
    <div class="label">Rejected</div>
    <div class="value red">{data.stats.rejected}</div>
  </div>
  <div class="stat">
    <div class="label">Completion rate</div>
    <div class="value orange">{data.stats.completionRate === null ? '—' : data.stats.completionRate + '%'}</div>
    <div class="sub">approved / total</div>
  </div>
</div>

<div class="card">
  <h2>By location</h2>
  {#if data.byLocation.length === 0}
    <div class="empty">No tasks in this date range.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Location</th><th>Total</th><th>Approved</th><th>Overdue</th><th>Completion</th></tr>
        </thead>
        <tbody>
          {#each data.byLocation as l}
            <tr>
              <td class="font-semibold">{l.name}</td>
              <td>{l.total}</td>
              <td>{l.approved}</td>
              <td>{#if l.overdue > 0}<span class="badge red">{l.overdue}</span>{:else}0{/if}</td>
              <td>
                {#if l.completion === null}
                  <span class="muted">—</span>
                {:else}
                  <div class="row-flex">
                    <div class="bar"><div style="width: {l.completion}%"></div></div>
                    <span>{l.completion}%</span>
                  </div>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<div class="card">
  <h2>By employee</h2>
  {#if data.byEmployee.length === 0}
    <div class="empty">No task assignments in this date range.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Employee</th><th>Location</th><th>Assigned</th><th>Completed</th><th>Completion</th></tr>
        </thead>
        <tbody>
          {#each data.byEmployee as e}
            <tr>
              <td class="font-semibold">{e.name}</td>
              <td>{e.location}</td>
              <td>{e.assigned}</td>
              <td>{e.completed}</td>
              <td>
                <div class="row-flex">
                  <div class="bar"><div style="width: {e.completion}%"></div></div>
                  <span>{e.completion}%</span>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<div class="card">
  <h2>Recent rejections</h2>
  {#if data.recentRejections.length === 0}
    <div class="empty">No rejections in this date range.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Task</th><th>Reason</th><th>Date</th></tr>
        </thead>
        <tbody>
          {#each data.recentRejections as r}
            <tr>
              <td class="font-semibold">{r.task}</td>
              <td>{r.reason}</td>
              <td class="muted">{fmtDate(r.date)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
