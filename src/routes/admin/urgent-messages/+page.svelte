<script lang="ts">
	import { enhance } from '$app/forms';
	import { confirmSubmit } from '$lib/admin/ux';

	let { data, form } = $props();
	
	let selectedLocation = $state('');
	
	let filteredUsers = $derived(
		selectedLocation 
			? data.users.filter(u => u.location_id === selectedLocation)
			: []
	);

	function formatDate(iso: string) {
		if (!iso) return '-';
		return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
	}
</script>

<svelte:head>
	<title>Urgent Messages — Admin</title>
</svelte:head>

<div class="admin-content">
	<div class="page-head">
		<h1>Urgent Messages</h1>
		<p>Send high-priority pop-ups directly to employee screens.</p>
	</div>

	<div class="card" style="max-width: 800px;">
		<h2 style="display: flex; align-items: center; gap: 0.5rem; color: var(--danger)">
			<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
			Send Urgent Message
		</h2>
		
		<form method="POST" action="?/send" use:enhance style="margin-top: 1rem;">
			<div class="form-grid">
				<div class="field">
					<span>Location</span>
					<select name="locationId" bind:value={selectedLocation} required>
						<option value="">Select a location</option>
						{#each data.locations as loc}
							<option value={loc.id}>{loc.name}</option>
						{/each}
					</select>
				</div>
				
				<div class="field">
					<span>Recipient</span>
					<select name="recipientId" required disabled={!selectedLocation}>
						<option value="ALL">All Users at Location</option>
						{#each filteredUsers as user}
							<option value={user.id}>{user.first_name} {user.last_name} ({user.role || 'Employee'})</option>
						{/each}
					</select>
				</div>

				<div class="field full" style="margin-top: 0.5rem;">
					<span>Message</span>
					<textarea 
						name="messageText" 
						placeholder="Type your urgent message here. This will pop up on their screen..."
						required
					></textarea>
				</div>
			</div>

			{#if form?.error}
				<div class="alert error" style="margin-top: 1rem;">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="alert success" style="margin-top: 1rem;">
					Message(s) sent successfully!
				</div>
			{/if}

			<div class="form-actions">
				<button type="submit" class="btn primary">Send Urgent Message</button>
			</div>
		</form>
	</div>

	<div class="card" style="margin-top: 1rem;">
		<h2>Sent Messages</h2>
		<p class="muted" style="margin-bottom: 1rem;">Track read receipts from employees.</p>

		{#if data.entries.length === 0}
			<div class="empty">No urgent messages sent yet.</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Recipient</th>
							<th>Location</th>
							<th>Message</th>
							<th>Status</th>
							<th style="text-align: right">Action</th>
						</tr>
					</thead>
					<tbody>
						{#each data.entries as msg}
							<tr>
								<td>
									<div style="font-weight: 600;">{msg.profiles?.first_name} {msg.profiles?.last_name}</div>
									<div class="muted">Sent by {msg.sender?.first_name} {msg.sender?.last_name}</div>
								</td>
								<td class="muted">{msg.locations?.name || '-'}</td>
								<td>
									<div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title={msg.message_text}>
										{msg.message_text}
									</div>
									<div class="muted" style="font-size: 0.7rem;">{formatDate(msg.created_at)}</div>
								</td>
								<td>
									{#if msg.is_read}
										<span class="badge green">Read at {formatDate(msg.read_at)}</span>
									{:else}
										<span class="badge orange">Unread</span>
									{/if}
								</td>
								<td style="text-align: right">
									<form method="POST" action="?/delete" use:enhance={confirmSubmit} style="display: inline;">
										<input type="hidden" name="id" value={msg.id} />
										<button type="submit" class="btn danger sm" title="Delete Message">
											Delete
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
