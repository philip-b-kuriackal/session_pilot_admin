<script lang="ts">
	import { enhance } from '$app/forms';
	import { confirmSubmit } from '$lib/admin/ux';

	let { data, form } = $props();
	
	let selectedLocation = $state('');
	
	// Find if there's existing rules for the selected location
	let existingRules = $derived(data.rules.find(r => r.location_id === selectedLocation));
	
	let isLoading = $state(false);
</script>

<div class="page-head">
	<div>
		<h1>Hub: House Rules</h1>
		<p>Manage the House Rules for each location.</p>
	</div>
</div>

<div class="card">
	<h2>Edit Location House Rules</h2>
	
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
			<input type="hidden" name="id" value={existingRules?.id || ''} />
			
			<div class="form-grid" style="grid-template-columns: 1fr;">
				<label class="field">
					<span>Title *</span>
					<input type="text" name="title" required placeholder="e.g. House Rules" value={existingRules?.title || "House Rules"} />
				</label>
			</div>

			<div class="form-grid" style="grid-template-columns: 1fr;">
				<label class="field">
					<span>Rules List (one per line)</span>
					<textarea name="content_bullets" rows="8" placeholder="Rule 1...&#10;Rule 2...">{existingRules?.content_bullets || ''}</textarea>
				</label>
			</div>

			{/key}
		{/if}
	</form>


	{#if selectedLocation}
		<div class="form-actions" style="margin-top: 1.5rem; display: flex; justify-content: space-between;">
			<div>
				{#if existingRules}
					<form method="POST" action="?/delete" use:enhance onsubmit={confirmSubmit("Delete these rules?")}>
						<input type="hidden" name="id" value={existingRules.id} />
						<button class="btn danger" type="submit">Delete List</button>
					</form>
				{/if}
			</div>
			<button class="btn primary" type="submit" form="save-form" disabled={isLoading}>
				{isLoading ? 'Saving...' : 'Save Rules'}
			</button>
		</div>
	{:else}
		<p style="margin-top: 1rem; color: #64748b;">Please select a location above to view or edit its rules.</p>
	{/if}
</div>
