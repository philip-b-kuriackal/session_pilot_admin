<script lang="ts">
	import { enhance } from '$app/forms';
	import { confirmSubmit } from '$lib/admin/ux';

	let { data, form } = $props();
	
	let selectedLocation = $state('');
	
	let existingEntry = $derived(data.entries.find((s: any) => s.location_id === selectedLocation));
	
	let isLoading = $state(false);
</script>

<div class="page-head">
	<div>
		<h1>Safety Guidelines</h1>
		<p>Write the Safety Guidelines for each location to appear in the Hub Handbook in the mobile app.</p>
	</div>
</div>

<div class="card">
	<h2>Edit Safety Guidelines</h2>
	
	{#if form?.message}
		<div class="alert {form.success ? 'success' : 'error'}">{form.message}</div>
	{/if}

	<form 
		id="save-form"
		method="POST" 
		action="?/save" 
		use:enhance={() => {
			isLoading = true;
			return async ({ update }) => {
				await update();
				isLoading = false;
			};
		}}
	>
		<div class="form-grid">
			<label class="field">
				<span>Location *</span>
				<select name="location_id" bind:value={selectedLocation} required>
					<option value="" disabled>-- Select a Location --</option>
					{#each data.locations as loc}
						<option value={loc.id}>{loc.name}</option>
					{/each}
				</select>
			</label>
		</div>

		{#if selectedLocation}
			{#key selectedLocation}
			<input type="hidden" name="id" value={existingEntry?.id || ''} />
			
			<div class="form-grid" style="grid-template-columns: 1fr;">
				<label class="field">
					<span>Title *</span>
					<input type="text" name="title" required placeholder="e.g. Safety Guidelines" value={existingEntry?.title || ''} />
				</label>
			</div>

			<div class="form-grid" style="grid-template-columns: 1fr;">
				<label class="field">
					<span>Details / Guidelines (one per line)</span>
					<textarea name="content_bullets" rows="8" placeholder="Guideline 1...&#10;Guideline 2...">{existingEntry?.content_bullets || ''}</textarea>
				</label>
			</div>

			{/key}
		{/if}
	</form>


	{#if selectedLocation}
		<div class="form-actions" style="margin-top: 1.5rem; display: flex; justify-content: space-between;">
			<div>
				{#if existingEntry}
					<form method="POST" action="?/delete" use:enhance onsubmit={confirmSubmit("Delete these Safety Guidelines?")}>
						<input type="hidden" name="id" value={existingEntry.id} />
						<button class="btn danger" type="submit">Delete</button>
					</form>
				{/if}
			</div>
			<button class="btn primary" type="submit" form="save-form" disabled={isLoading}>
				{isLoading ? 'Saving...' : 'Save'}
			</button>
		</div>
	{:else}
		<p style="margin-top: 1rem; color: #64748b;">Please select a location above to view or edit.</p>
	{/if}
</div>
