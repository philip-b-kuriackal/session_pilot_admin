<script lang="ts">
  let { data } = $props();
  let reports = $derived(data.whistleblowerReports || []);
</script>

<div class="page-head">
  <div>
    <h1>Whistleblower Reports</h1>
    <p>Review securely submitted anonymous and non-anonymous misconduct reports from employees.</p>
  </div>
</div>

<div class="card">
  <h2>Submitted Reports ({reports.length})</h2>
  
  {#if reports.length === 0}
    <div class="empty">No whistleblower reports have been submitted yet.</div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width: 200px;">Reporter</th>
            <th style="width: 200px;">Submitted</th>
            <th>Report Details</th>
          </tr>
        </thead>
        <tbody>
          {#each reports as report (report.id)}
            <tr>
              <td class="font-semibold" style="vertical-align: top; padding: 1.25rem 1rem;">
                👤 {report.users?.name || 'Anonymous / Former Employee'}
              </td>
              <td class="muted" style="vertical-align: top; padding: 1.25rem 1rem;">
                📅 {new Date(report.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td style="padding: 1.25rem 1rem; line-height: 1.6; color: #334155; white-space: pre-wrap; vertical-align: top;">
                {report.report_text}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
