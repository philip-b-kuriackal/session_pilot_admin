/* Admin UX kit — toasts, confirm dialog, busy-button helpers.
   Rendered by Toasts.svelte / ConfirmDialog.svelte (mounted in admin/+layout.svelte). */
import { writable } from 'svelte/store';

/* ---------- Toasts ---------- */

export type ToastKind = 'success' | 'error' | 'info';
export interface Toast {
	id: number;
	kind: ToastKind;
	message: string;
}

export const toasts = writable<Toast[]>([]);
let nextToastId = 1;

export function pushToast(kind: ToastKind, message: string, timeoutMs = 4000) {
	const id = nextToastId++;
	toasts.update((list) => [...list, { id, kind, message }]);
	setTimeout(() => dismissToast(id), timeoutMs);
	return id;
}

export function dismissToast(id: number) {
	toasts.update((list) => list.filter((t) => t.id !== id));
}

export const toast = {
	success: (message: string) => pushToast('success', message),
	error: (message: string) => pushToast('error', message, 6000),
	info: (message: string) => pushToast('info', message)
};

/* ---------- Confirm dialog ---------- */

export interface ConfirmOptions {
	title?: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
	resolve: (ok: boolean) => void;
}

export const confirmRequest = writable<ConfirmRequest | null>(null);

/** Programmatic replacement for window.confirm() — resolves true/false. */
export function confirmDialog(opts: ConfirmOptions | string): Promise<boolean> {
	const options: ConfirmOptions = typeof opts === 'string' ? { message: opts } : opts;
	return new Promise((resolve) => {
		confirmRequest.set({
			title: options.title ?? (options.danger ? 'Are you sure?' : 'Please confirm'),
			confirmLabel: options.confirmLabel ?? (options.danger ? 'Delete' : 'Confirm'),
			cancelLabel: options.cancelLabel ?? 'Cancel',
			danger: options.danger ?? false,
			message: options.message,
			resolve: (ok) => {
				confirmRequest.set(null);
				resolve(ok);
			}
		});
	});
}

/* Forms approved by the dialog get resubmitted once without re-asking. */
const approvedForms = new WeakSet<HTMLFormElement>();

/**
 * Drop-in replacement for the old
 *   onsubmit={(e) => { if (!confirm('…')) e.preventDefault(); }}
 * pattern:
 *   onsubmit={confirmSubmit('Delete this user?')}
 * Works with and without use:enhance (resubmits via requestSubmit, preserving
 * the original submitter button / formaction).
 */
export function confirmSubmit(opts: ConfirmOptions | string) {
	return (e: SubmitEvent) => {
		const formEl = e.currentTarget as HTMLFormElement;
		if (approvedForms.has(formEl)) {
			approvedForms.delete(formEl);
			return; // approved — let this submission through
		}
		e.preventDefault();
		const submitter = e.submitter as HTMLElement | null;
		const options: ConfirmOptions =
			typeof opts === 'string' ? { message: opts, danger: true } : { danger: true, ...opts };
		confirmDialog(options).then((ok) => {
			if (!ok) return;
			approvedForms.add(formEl);
			formEl.requestSubmit(submitter as HTMLButtonElement | null);
		});
	};
}

/* ---------- Busy buttons (loading state during form submission) ---------- */

const busyButtons = new Set<HTMLButtonElement>();

/** Attach as a capture submit listener on the admin shell. */
export function trackSubmit(e: SubmitEvent) {
	const btn = e.submitter as HTMLButtonElement | null;
	// defer: form data must serialize (and confirm handlers run) before we disable
	setTimeout(() => {
		if (e.defaultPrevented || !btn || btn.disabled) return;
		btn.disabled = true;
		btn.classList.add('is-loading');
		busyButtons.add(btn);
		// safety: never leave a button stuck
		setTimeout(() => releaseButton(btn), 15000);
	}, 0);
}

function releaseButton(btn: HTMLButtonElement) {
	if (!busyButtons.has(btn)) return;
	busyButtons.delete(btn);
	btn.disabled = false;
	btn.classList.remove('is-loading');
}

/** Re-enable everything — call after navigation / action result. */
export function releaseBusyButtons() {
	for (const btn of [...busyButtons]) releaseButton(btn);
}
