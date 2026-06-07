<script lang="ts">
  import { goto } from '$app/navigation';

  let { data } = $props();

  const person = $derived(data.person);
  const company = $derived(data.company);

  // ── Derived display / prefill helpers ──────────────────────────────
  function fmt(v: unknown): string {
    return v == null ? '' : String(v);
  }

  // Company address combined: "address, postal_code city"
  const companyAddress = $derived(
    company
      ? [company.address, [company.postal_code, company.city].filter(Boolean).join(' ')]
          .filter(Boolean)
          .join(', ')
      : ''
  );

  const companyDisplayName = $derived((company?.name ?? '').toUpperCase());

  // Employment form mapping → reference checkbox ids
  const employmentForm = $derived(person?.employment_form ?? '');

  // Pay group → radio index (1/2/3)
  const payGroup = $derived(person?.pay_group ?? '');

  // Veckoarbetstid
  const isFullTime = $derived(person?.contract_type === 'full_time');
  const weeklyHours = $derived(
    !isFullTime && person?.monthly_hours != null
      ? String(Math.round((person.monthly_hours / 4.33) * 10) / 10)
      : ''
  );

  // Salary display
  const monthlySalary = $derived(
    person?.monthly_salary != null ? `${person.monthly_salary} SEK` : ''
  );
  const hourlyRate = $derived(person?.hourly_rate != null ? String(person.hourly_rate) : '');

  // Signature date "city–YYYY-MM-DD" computed once client-side
  function today(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
  let sigDate = $state(
    (company?.city ? `${company.city}–` : '') + today()
  );

  // ── Toolbar actions ────────────────────────────────────────────────
  function onCompanyChange(e: Event) {
    const id = (e.currentTarget as HTMLSelectElement).value;
    goto(`?company=${id}`, { keepFocus: true, noScroll: true });
  }

  function clearForm() {
    if (!confirm('Vill du rensa alla fält?')) return;
    const doc = document.getElementById('document');
    if (!doc) return;
    doc
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea'
      )
      .forEach((el) => (el.value = ''));
    doc.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((el) => (el.checked = false));
    doc.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((el) => (el.checked = false));
  }

  function exportPDF() {
    window.print();
  }
</script>

<svelte:head>
  <title>Anställningsbevis – {person?.first_name} {person?.last_name}</title>
</svelte:head>

<!-- ── TOOLBAR ── -->
<div class="toolbar">
  <div class="toolbar-left">
    <a class="back-link" href="/admin/users">← Back</a>
    <div>
      <div class="toolbar-title">Anställningsbevis – Offer letter</div>
      <div class="toolbar-sub">Hotell, restaurang &amp; casinopersonal · HRF</div>
    </div>
  </div>
  <div class="toolbar-actions">
    <select class="company-dropdown" value={company?.id ?? ''} onchange={onCompanyChange}>
      {#each data.companies as c}
        <option value={c.id}>{c.name}</option>
      {/each}
    </select>
    <button class="btn btn-outline" onclick={clearForm}>Rensa formulär</button>
    <button class="btn btn-primary" onclick={exportPDF}>⬇ Exportera PDF</button>
  </div>
</div>

<!-- ── DOCUMENT ── -->
<div class="doc-wrapper">
<div id="document">

  <!-- Header -->
  <div class="doc-header" style="grid-template-columns:1fr; padding: 16px 28px;">
    <div class="company-name-display" style="border-top:none; margin-top:0; padding-top:0;">{companyDisplayName}</div>
  </div>

  <!-- FÖRETAG -->
  <div class="section">
    <div class="section-title">Företag</div>
    <div class="section-body">
      <div class="field-grid cols-2-1">
        <div class="field">
          <span class="field-label">Namn</span>
          <input type="text" placeholder="Företagsnamn" value={fmt(company?.name)} />
        </div>
        <div class="field">
          <span class="field-label">Telefon</span>
          <input type="tel" placeholder="0XX XXX XXX" value={fmt(company?.phone)} />
        </div>
      </div>
      <div class="field-grid cols-2-1">
        <div class="field">
          <span class="field-label">Adress</span>
          <input type="text" placeholder="Gatuadress, postnummer och ort" value={companyAddress} />
        </div>
        <div class="field">
          <span class="field-label">Organisationsnummer</span>
          <input type="text" placeholder="XXXXXX-XXXX" value={fmt(company?.org_number)} />
        </div>
      </div>
      <div class="field-grid cols-1">
        <div class="field">
          <span class="field-label">Arbetsplats</span>
          <input type="text" placeholder="Namn på arbetsplatsen" value={fmt(company?.workplace)} />
        </div>
      </div>
    </div>
  </div>

  <!-- PERSONUPPGIFTER -->
  <div class="section">
    <div class="section-title">Personuppgifter</div>
    <div class="section-body">
      <div class="field-grid cols-1-1-1r">
        <div class="field">
          <span class="field-label">Förnamn</span>
          <input type="text" placeholder="Förnamn" value={fmt(person?.first_name)} />
        </div>
        <div class="field">
          <span class="field-label">Efternamn</span>
          <input type="text" placeholder="Efternamn" value={fmt(person?.last_name)} />
        </div>
        <div class="field">
          <span class="field-label">Personnummer</span>
          <input type="text" placeholder="YYYYMMDD-XXXX" value={fmt(person?.personal_number)} />
        </div>
      </div>
      <div class="field-grid cols-addr">
        <div class="field">
          <span class="field-label">Adress</span>
          <input type="text" placeholder="Gatuadress" value={fmt(person?.address)} />
        </div>
        <div class="field">
          <span class="field-label">Postnummer</span>
          <input type="text" placeholder="XXX XX" value={fmt(person?.postal_code)} />
        </div>
        <div class="field">
          <span class="field-label">Postadress</span>
          <input type="text" placeholder="Ort" value={fmt(person?.city)} />
        </div>
      </div>
      <div class="field-grid cols-2-1">
        <div class="field">
          <span class="field-label">E-post</span>
          <input type="email" placeholder="epost@exempel.se" value={fmt(person?.email)} />
        </div>
        <div class="field">
          <span class="field-label">Telefon</span>
          <input type="tel" placeholder="+46 XXX XXX XXX" value={fmt(person?.phone)} />
        </div>
      </div>
      <div class="field-grid cols-2-1">
        <div class="field">
          <span class="field-label">Anställningsnummer</span>
          <input type="text" placeholder="" value={fmt(person?.employee_id)} />
        </div>
        <div class="field">
          <span class="field-label">Mobilnummer</span>
          <input type="tel" placeholder="+46 7XX XXX XXX" value={fmt(person?.phone)} />
        </div>
      </div>
    </div>
  </div>

  <!-- ANSTÄLLNINGSFORM -->
  <div class="section">
    <div class="section-title">Anställningsform (ange endast ett alternativ)</div>
    <div class="check-section">
      <div class="check-row">
        <input type="checkbox" class="check-box" id="prov" name="ansform" checked={employmentForm === 'provanstallning'} />
        <label for="prov">Provanställning</label>
        <div class="date-range"><span>Från</span><input type="text" id="prov_from" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'provanstallning' ? fmt(person?.hire_date) : ''} /></div>
        <div class="date-range"><span>Tom</span><input type="text" id="prov_tom" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'provanstallning' ? fmt(person?.employment_end) : ''} /></div>
      </div>
      <div class="check-row">
        <input type="checkbox" class="check-box" id="tillsv" name="ansform" checked={employmentForm === 'tillsvidare'} />
        <label for="tillsv">Tillsvidareanställning</label>
        <div class="date-range"><span>Från</span><input type="text" id="tillsv_from" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'tillsvidare' ? fmt(person?.hire_date) : ''} /></div>
        <div class="date-range"></div>
      </div>

      <div class="check-row header-row">
        <span></span>
        <span>Tidsbegränsade anställningar</span>
        <span></span><span></span>
      </div>

      <div class="check-row indent">
        <input type="checkbox" class="check-box" id="allman" name="ansform" checked={employmentForm === 'visstid'} />
        <label for="allman">Allmän visstidsanställning</label>
        <div class="date-range"><span>Från</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'visstid' ? fmt(person?.hire_date) : ''} /></div>
        <div class="date-range"><span>Tom</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'visstid' ? fmt(person?.employment_end) : ''} /></div>
      </div>
      <div class="check-row indent">
        <input type="checkbox" class="check-box" id="vikariat" name="ansform" checked={employmentForm === 'vikariat'} />
        <label for="vikariat">Vikariat</label>
        <div class="date-range"><span>Från</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'vikariat' ? fmt(person?.hire_date) : ''} /></div>
        <div class="date-range"><span>Tom</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'vikariat' ? fmt(person?.employment_end) : ''} /></div>
      </div>
      <div class="check-row indent" style="grid-template-columns:28px 180px 1fr; gap:8px;">
        <input type="checkbox" class="check-box" id="ejvikariat" name="ansform" />
        <label for="ejvikariat">Icke tidsbestämt vikariat</label>
        <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--text-muted);flex-wrap:wrap;">
          <span>Från</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" style="width:110px;font-size:12px;font-family:var(--font);border:none;border-bottom:1px solid var(--border);background:transparent;outline:none;" />
          <span>till dess namn/befattning</span><input type="text" placeholder="" style="width:140px;font-size:12px;font-family:var(--font);border:none;border-bottom:1px solid var(--border);background:transparent;outline:none;" />
          <span>återkommer i tjänst dock längst till</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" style="width:110px;font-size:12px;font-family:var(--font);border:none;border-bottom:1px solid var(--border);background:transparent;outline:none;" />
        </div>
      </div>
      <div class="check-row indent">
        <input type="checkbox" class="check-box" id="sason" name="ansform" checked={employmentForm === 'sasong'} />
        <label for="sason">Säsongsarbete</label>
        <div class="date-range"><span>Från</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'sasong' ? fmt(person?.hire_date) : ''} /></div>
        <div class="date-range"><span>Tom</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'sasong' ? fmt(person?.employment_end) : ''} /></div>
      </div>
      <div class="check-row indent">
        <input type="checkbox" class="check-box" id="over67" name="ansform" />
        <label for="over67">Arbetstagare som har fyllt 67 år</label>
        <div class="date-range"><span>Från</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" /></div>
        <div class="date-range"><span>Tom</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" /></div>
      </div>
      <div class="check-row indent">
        <input type="checkbox" class="check-box" id="enstaka" name="ansform" checked={employmentForm === 'enstaka'} />
        <label for="enstaka">Anställning för enstaka dagar</label>
        <div class="date-range"><span>Från</span><input type="text" placeholder="ÅÅÅÅ-MM-DD" value={employmentForm === 'enstaka' ? fmt(person?.hire_date) : ''} /></div>
        <div class="date-range"></div>
      </div>
    </div>
  </div>

  <!-- ARBETSTIDER -->
  <div class="section work-section">
    <div class="section-title">Arbetstider och uppgifter om anställningen</div>
    <div style="display:grid;grid-template-columns:1fr 2fr 1fr;border-top:1px solid var(--border);">
      <div class="group-select">
        <span class="field-label">Anställning</span>
        <label class="group-option"><input type="radio" name="grupp" class="radio-box" checked={payGroup === 'grupp1'} /> Grupp 1, kvalificerat yrkesarbete</label>
        <label class="group-option"><input type="radio" name="grupp" class="radio-box" checked={payGroup === 'grupp2'} /> Grupp 2, yrkesarbete</label>
        <label class="group-option"><input type="radio" name="grupp" class="radio-box" checked={payGroup === 'grupp3'} /> Grupp 3, yrkesarbetare, ej fyllda 20 år</label>
      </div>
      <div style="border-right:1px solid var(--border);border-bottom:1px solid var(--border);padding:8px 10px;">
        <div class="field-label">Yrkesbenämning eller tjänstetitel</div>
        <input type="text" placeholder="T.ex. Head Chef – Indian Cuisine" value={fmt(person?.position)} style="font-family:var(--font);font-size:14px;font-weight:500;border:none;border-bottom:1px solid transparent;background:transparent;color:var(--text);outline:none;width:100%;margin-top:4px;" />
        <div class="field-label" style="margin-top:12px;">Huvudsakliga arbetsuppgifter</div>
        <input type="text" placeholder="T.ex. As per SSYK code 3451" style="font-family:var(--font);font-size:13px;border:none;border-bottom:1px solid transparent;background:transparent;color:var(--text);outline:none;width:100%;margin-top:4px;" />
      </div>
      <div class="time-field">
        <span class="field-label">Genomsnittlig veckoarbetstid (fylls ej vid anställning för enstaka dagar)</span>
        <div class="tid-options">
          <label class="tid-option"><input type="radio" name="tid" class="radio-box" checked={isFullTime} /> Heltid</label>
        </div>
        <div class="tid-options" style="margin-top:4px;">
          <label class="tid-option"><input type="radio" name="tid" class="radio-box" checked={!isFullTime} /> Deltid</label>
          <input class="deltid-input" type="text" placeholder="" value={weeklyHours} />
          <span style="font-size:11px;color:var(--text-muted);">tim/v</span>
        </div>
      </div>
    </div>
  </div>

  <!-- VID ANSTÄLLNINGENS TILLTRÄDE -->
  <div class="section">
    <div class="section-title">Vid anställningens tillträde gäller</div>
    <div class="salary-grid">
      <div class="field" style="border-bottom:1px solid var(--border);">
        <span class="field-label">Månadslön</span>
        <input type="text" placeholder="T.ex. 42000 SEK" value={monthlySalary} />
      </div>
      <div class="field" style="border-bottom:1px solid var(--border);">
        <span class="field-label">Timlön</span>
        <input type="text" placeholder="" value={hourlyRate} />
      </div>
      <div class="kost-field">
        <span class="field-label">Kost</span>
        <div class="kost-options">
          <label class="kost-option"><input type="radio" name="kost" class="radio-box" /> Kost <input class="kost-amount" type="text" placeholder="" /> kr/dag</label>
          <label class="kost-option"><input type="radio" name="kost" class="radio-box" checked /> Ej kost</label>
        </div>
      </div>
      <div class="yrkes-field">
        <span class="field-label">Styrkt yrkesvana</span>
        <div class="yrkes-options">
          <label class="yrkes-option"><input type="radio" name="yrkes" class="radio-box" /> Ja <input class="yrkes-years" type="text" placeholder="" /> år</label>
          <label class="yrkes-option"><input type="radio" name="yrkes" class="radio-box" /> Nej</label>
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;border-top:1px solid var(--border);">
      <div class="field" style="border-bottom:1px solid var(--border);">
        <span class="field-label">Uppstigning­sregler – Se kollektivavtal</span>
        <input type="text" placeholder="HRF" value={fmt(company?.collective_agreement)} />
      </div>
      <div class="field" style="border-bottom:1px solid var(--border);">
        <span class="field-label">Semester</span>
        <input type="text" placeholder="25 sem.dagar enligt kollektivavtal" />
      </div>
      <div class="field" style="border-bottom:1px solid var(--border);">
        <span class="field-label">Arbetstillstånd / Uppehållstillstånd</span>
        <input type="text" placeholder="" />
      </div>
      <div class="field" style="border-bottom:1px solid var(--border);">
        <span class="field-label">Läkarintyg / Friskintyg</span>
        <input type="text" placeholder="" />
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid var(--border);">
      <div class="field" style="border-bottom:1px solid var(--border);">
        <span class="field-label">Yrkeskod</span>
        <input type="text" placeholder="T.ex. 3451" value={fmt(person?.occupation_code)} />
      </div>
      <div class="field" style="border-bottom:1px solid var(--border);">
        <span class="field-label">Löneut­betalningsdag</span>
        <input type="text" placeholder="T.ex. 27th" value={fmt(company?.payday)} />
      </div>
      <div class="field" style="border-bottom:1px solid var(--border);">
        <span class="field-label">Lönekontonummer</span>
        <input type="text" placeholder="" value={fmt(person?.bank_account)} />
      </div>
    </div>
  </div>

  <!-- ÖVRIGA VILLKOR -->
  <div class="section">
    <div class="section-title">Övriga villkor för anställningen</div>
    <div class="notes-field">
      <textarea rows="3" placeholder="Ange eventuella övriga villkor här…"></textarea>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="section">
    <div class="sig-block">
      <div class="sig-date">
        <span>Ort och datum:</span>
        <input type="text" placeholder="T.ex. Umeå–2026-04-08" style="width:220px;" value={sigDate} />
      </div>
      <div class="sig-grid">
        <div>
          <div class="sig-line">Arbetsgivarens underskrift</div>
        </div>
        <div>
          <div class="sig-line">Arbetstagarens underskrift</div>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="doc-footer">
    Anställningen gäller i övrigt kollektivavtal för hotell- och restaurangpersonal träffat mellan VISITA och Hotell- och restaurangfacket (HRF)
  </div>

</div><!-- #document -->
</div><!-- .doc-wrapper -->

<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

  :global(body) {
    font-family: 'IBM Plex Sans', sans-serif;
    background: #f0ece4;
    color: #1a1612;
    min-height: 100vh;
    padding: 0;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  :root {
    --bg: #f0ece4;
    --surface: #faf8f4;
    --border: #c8bfaa;
    --border-dark: #8a7d6a;
    --text: #1a1612;
    --text-muted: #6b5f52;
    --accent: #1a3a5c;
    --accent-light: #e8eef5;
    --check: #1a3a5c;
    --font: 'IBM Plex Sans', sans-serif;
    --mono: 'IBM Plex Mono', monospace;
  }

  /* ── TOP BAR ── */
  .toolbar {
    background: var(--accent);
    color: #fff;
    padding: 14px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
  }
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .back-link {
    color: #fff;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    opacity: 0.85;
    white-space: nowrap;
  }
  .back-link:hover {
    opacity: 1;
  }
  .toolbar-title {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .toolbar-sub {
    font-size: 11px;
    opacity: 0.65;
    margin-top: 2px;
    font-weight: 300;
  }
  .toolbar-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .company-dropdown {
    font-family: var(--font);
    font-size: 13px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1.5px solid rgba(255, 255, 255, 0.45);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    cursor: pointer;
    outline: none;
    max-width: 220px;
  }
  .company-dropdown option {
    color: #1a1612;
  }

  .btn {
    font-family: var(--font);
    font-size: 13px;
    font-weight: 500;
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.02em;
  }
  .btn-outline {
    background: transparent;
    border: 1.5px solid rgba(255, 255, 255, 0.45);
    color: #fff;
  }
  .btn-outline:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fff;
  }
  .btn-primary {
    background: #fff;
    color: var(--accent);
  }
  .btn-primary:hover {
    background: #e8eef5;
  }

  /* ── DOCUMENT WRAPPER ── */
  .doc-wrapper {
    max-width: 860px;
    margin: 28px auto 60px;
    padding: 0 24px;
  }

  /* ── DOCUMENT ── */
  #document {
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  }

  /* ── HRF HEADER ── */
  .doc-header {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 0;
    border-bottom: 3px solid var(--text);
    padding: 20px 28px;
    align-items: start;
  }
  .company-name-display {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 12px;
    text-align: left;
    grid-column: 1 / -1;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }

  /* ── SECTIONS ── */
  .section {
    border-bottom: 2px solid var(--text);
  }
  .section-title {
    background: var(--text);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 5px 10px;
  }
  .section-body {
    padding: 0;
  }

  /* ── FIELD GRID ── */
  .field-grid {
    display: grid;
    border-top: 1px solid var(--border);
  }
  .field-grid.cols-1 {
    grid-template-columns: 1fr;
  }
  .field-grid.cols-2 {
    grid-template-columns: 1fr 1fr;
  }
  .field-grid.cols-3 {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .field-grid.cols-2-1 {
    grid-template-columns: 2fr 1fr;
  }
  .field-grid.cols-1-1-1r {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .field-grid.cols-addr {
    grid-template-columns: 2fr 1fr 2fr;
  }

  .field {
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 6px 10px 8px;
    min-height: 46px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .field:last-child {
    border-right: none;
  }

  .field-label {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
    margin-bottom: 3px;
    pointer-events: none;
  }

  .field input[type='text'],
  .field input[type='email'],
  .field input[type='tel'],
  .field input[type='date'] {
    font-family: var(--font);
    font-size: 13px;
    font-weight: 400;
    border: none;
    border-bottom: 1px solid transparent;
    background: transparent;
    color: var(--text);
    outline: none;
    width: 100%;
    padding: 1px 0;
    transition: border-color 0.15s;
  }
  .field input:focus {
    border-bottom-color: var(--accent);
  }
  .field input::placeholder {
    color: #c8bfaa;
  }

  /* ── CHECKBOX ROWS ── */
  .check-section {
    padding: 0;
  }
  .check-row {
    display: grid;
    grid-template-columns: 28px 200px 1fr 1fr;
    align-items: center;
    border-bottom: 1px solid var(--border);
    min-height: 34px;
    padding: 4px 10px;
    gap: 8px;
  }
  .check-row.indent {
    padding-left: 36px;
    grid-template-columns: 28px 180px 1fr 1fr;
  }
  .check-row.header-row {
    background: #f5f2ee;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--text-muted);
  }

  .check-row label {
    font-size: 12px;
    cursor: pointer;
  }
  .date-range {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .date-range input {
    width: 110px;
    font-size: 12px;
    font-family: var(--font);
    border: none;
    border-bottom: 1px solid var(--border);
    background: transparent;
    outline: none;
  }
  .date-range input:focus {
    border-bottom-color: var(--accent);
  }
  .date-range span {
    white-space: nowrap;
  }

  .check-box {
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--border-dark);
    background: #fff;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .check-box:checked {
    background: var(--check);
    border-color: var(--check);
  }
  .check-box:checked::after {
    content: '';
    display: block;
    width: 8px;
    height: 5px;
    border-left: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: rotate(-45deg) translate(1px, -1px);
  }

  .radio-box {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border: 1.5px solid var(--border-dark);
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    flex-shrink: 0;
  }
  .radio-box:checked {
    background: var(--check);
    border-color: var(--check);
  }

  .group-select {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 8px 10px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .group-option {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    cursor: pointer;
  }

  .time-field {
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    gap: 4px;
  }
  .tid-options {
    display: flex;
    gap: 16px;
    margin-top: 4px;
  }
  .tid-option {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    cursor: pointer;
  }
  .deltid-input {
    width: 50px;
    font-size: 12px;
    font-family: var(--font);
    border: none;
    border-bottom: 1px solid var(--border);
    background: transparent;
    outline: none;
  }
  .deltid-input:focus {
    border-bottom-color: var(--accent);
  }

  /* ── SALARY ROW ── */
  .salary-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr 1.2fr;
    border-top: 1px solid var(--border);
  }

  .kost-field {
    padding: 8px 10px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .kost-options {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
  }
  .kost-option {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    cursor: pointer;
  }
  .kost-amount {
    width: 80px;
    font-size: 12px;
    font-family: var(--font);
    border: none;
    border-bottom: 1px solid var(--border);
    background: transparent;
    outline: none;
  }
  .kost-amount:focus {
    border-bottom-color: var(--accent);
  }

  .yrkes-field {
    padding: 8px 10px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .yrkes-options {
    display: flex;
    gap: 16px;
    margin-top: 4px;
    flex-wrap: wrap;
  }
  .yrkes-option {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    cursor: pointer;
  }
  .yrkes-years {
    width: 32px;
    font-size: 12px;
    font-family: var(--font);
    border: none;
    border-bottom: 1px solid var(--border);
    background: transparent;
    outline: none;
  }
  .yrkes-years:focus {
    border-bottom-color: var(--accent);
  }

  /* ── EXTRA NOTES ── */
  .notes-field {
    padding: 10px 10px;
    border-bottom: 1px solid var(--border);
    min-height: 60px;
  }
  .notes-field textarea {
    font-family: var(--font);
    font-size: 13px;
    border: none;
    background: transparent;
    color: var(--text);
    outline: none;
    width: 100%;
    resize: vertical;
    min-height: 42px;
  }

  /* ── SIGNATURES ── */
  .sig-block {
    padding: 16px 10px 10px;
    border-bottom: 1px solid var(--border);
    font-size: 12px;
  }
  .sig-date {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sig-date input {
    font-family: var(--font);
    font-size: 13px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: transparent;
    outline: none;
  }
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-top: 8px;
  }
  .sig-line {
    border-top: 1px solid var(--text);
    padding-top: 4px;
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 32px;
  }

  /* ── FOOTER ── */
  .doc-footer {
    padding: 10px 28px;
    font-size: 10px;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.5;
    border-top: 1px solid var(--border);
  }

  /* ── PRINT / PDF CLEAN ── */
  @page {
    size: A4 portrait;
    margin: 8mm 8mm 8mm 8mm;
  }

  @media print {
    :global(html),
    :global(body) {
      width: 210mm;
      background: white !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      display: none !important;
    }
    .doc-wrapper {
      margin: 0 !important;
      padding: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
    }
    #document {
      box-shadow: none !important;
      border: 1px solid #999 !important;
      width: 100% !important;
      font-size: 11px !important;
    }
    .section-title {
      font-size: 10px !important;
      padding: 4px 8px !important;
    }
    .field {
      min-height: 36px !important;
      padding: 4px 8px 5px !important;
    }
    .field-label {
      font-size: 8px !important;
    }
    .field input {
      font-size: 11px !important;
    }
    .check-row {
      min-height: 26px !important;
      padding: 3px 8px !important;
      font-size: 11px !important;
    }
    .check-row label {
      font-size: 11px !important;
    }
    .date-range input {
      font-size: 10px !important;
      width: 90px !important;
    }
    .group-option,
    .kost-option,
    .yrkes-option,
    .tid-option {
      font-size: 10px !important;
    }
    .sig-block {
      padding: 10px 8px 8px !important;
    }
    .doc-footer {
      font-size: 9px !important;
    }
    .notes-field textarea {
      font-size: 11px !important;
    }
    .check-box,
    .radio-box {
      width: 11px !important;
      height: 11px !important;
    }
    .section {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }

  /* responsive */
  @media (max-width: 600px) {
    .field-grid.cols-3,
    .field-grid.cols-addr {
      grid-template-columns: 1fr;
    }
    .salary-grid {
      grid-template-columns: 1fr 1fr;
    }
    .check-row {
      grid-template-columns: 28px 1fr;
    }
    .date-range {
      display: none;
    }
  }
</style>
