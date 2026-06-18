<script lang="ts">
  let { data } = $props();
  let stats = $derived(data.feedbackStats);
  
  // Calculate percentages
  let totalResponses = $derived(stats.total - stats.skips);
  function getPercentage(value: number) {
    if (totalResponses === 0) return 0;
    return Math.round((value / totalResponses) * 100);
  }
</script>

<div class="page-head">
  <div>
    <h1>Weekly Feedback</h1>
    <p>Monitor anonymous, aggregate mood metrics and job satisfaction indicators submitted by your restaurant team.</p>
  </div>
</div>

<div class="card">
  <h2>Weekly Mood Summary</h2>
  <p class="muted" style="margin-bottom: 2rem;">Aggregate employee mood rating count and percentage metrics for this week.</p>
  
  <div class="feedback-stats-grid">
    <div class="stat-box">
      <div class="emoji-large">😫</div>
      <div class="stat-count">{stats.emoji1}</div>
      <div class="stat-label">Struggling</div>
      <div class="stat-percent">{getPercentage(stats.emoji1)}%</div>
    </div>
    <div class="stat-box">
      <div class="emoji-large">😐</div>
      <div class="stat-count">{stats.emoji2}</div>
      <div class="stat-label">Okay</div>
      <div class="stat-percent">{getPercentage(stats.emoji2)}%</div>
    </div>
    <div class="stat-box">
      <div class="emoji-large">🙂</div>
      <div class="stat-count">{stats.emoji3}</div>
      <div class="stat-label">Good</div>
      <div class="stat-percent">{getPercentage(stats.emoji3)}%</div>
    </div>
    <div class="stat-box">
      <div class="emoji-large">🤩</div>
      <div class="stat-count">{stats.emoji4}</div>
      <div class="stat-label">Great</div>
      <div class="stat-percent">{getPercentage(stats.emoji4)}%</div>
    </div>
  </div>
  
  <div style="margin-top: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; align-items: center;">
    <div>
      <span style="font-weight: 600; color: #1e293b; font-size: 1rem;">Total Active Submissions: </span>
      <span style="font-size: 1.25rem; font-weight: 800; color: #f07122; margin-left: 0.25rem;">{totalResponses}</span>
    </div>
    <div class="muted" style="font-size: 0.9rem; font-style: italic;">
      * {stats.skips} employee{stats.skips === 1 ? '' : 's'} chose to skip feedback rating.
    </div>
  </div>
</div>

<style>
  .feedback-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1.5rem;
  }

  .stat-box {
    background: #fafafa;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.5rem 1rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }

  .emoji-large {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .stat-count {
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 600;
    margin-top: 0.25rem;
  }

  .stat-percent {
    font-size: 0.8rem;
    color: #f07122;
    font-weight: 700;
    margin-top: 0.5rem;
    background: #fff3eb;
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
  }
</style>
