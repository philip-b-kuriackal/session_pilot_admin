<script lang="ts">
	import { enhance } from '$app/forms';
	import { confirmSubmit } from '$lib/admin/ux';

	let { data, form } = $props();
	
	let selectedLocation = $state('');
	
	// Find if there's an existing needs list for the selected location
	let existingNeeds = $derived(data.needs.find(n => n.location_id === selectedLocation));
	
	let isLoading = $state(false);
</script>

<div class="page-head">
	<div>
		<h1>Hub: What You'll Need</h1>
		<p>List the "What You'll Need" items for each location.</p>
	</div>
</div>

<div class="card">
	<h2>Edit Location Requirements</h2>
	
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
			<input type="hidden" name="id" value={existingNeeds?.id || ''} />
			
			<div class="form-grid" style="grid-template-columns: 1fr;">
				<label class="field">
					<span>Title *</span>
					<input type="text" name="title" required placeholder="e.g. What You'll Need" value={existingNeeds?.title || "What You'll Need"} />
				</label>
			</div>

			<div class="form-grid" style="grid-template-columns: 1fr;">
				<label class="field">
					<span>Items Needed (one per line)</span>
					<textarea name="content_bullets" rows="8" placeholder="Item 1...&#10;Item 2...">{existingNeeds?.content_bullets || ''}</textarea>
				</label>
			</div>

			{/key}
		{/if}
	</form>


	{#if selectedLocation}
		<div class="form-actions" style="margin-top: 1.5rem; display: flex; justify-content: space-between;">
			<div>
				{#if existingNeeds}
					<form method="POST" action="?/delete" use:enhance onsubmit={confirmSubmit("Delete this list?")}>
						<input type="hidden" name="id" value={existingNeeds.id} />
						<button class="btn danger" type="submit">Delete List</button>
					</form>
				{/if}
			</div>
			<button class="btn primary" type="submit" form="save-form" disabled={isLoading}>
				{isLoading ? 'Saving...' : 'Save Requirements'}
			</button>
		</div>
	{:else}
		<p style="margin-top: 1rem; color: #64748b;">Please select a location above to view or edit its requirements.</p>
	{/if}
</div>
