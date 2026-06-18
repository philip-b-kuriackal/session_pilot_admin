/* Shared metadata for employee-submitted reports (drives the generic form + lists). */

export type ReportKind = 'whistleblower' | 'end_of_day' | 'temperature' | 'broken_item';
export type ReportStatus = 'open' | 'in_review' | 'resolved';

export interface ReportRow {
	id: string;
	kind: ReportKind;
	subject: string;
	body: Record<string, string>;
	status: ReportStatus;
	is_anonymous: boolean;
	created_at: string;
	resolution_note?: string | null;
}

/** Admin inbox row — ReportRow plus joined reporter/location fields. */
export interface AdminReportRow extends ReportRow {
	location_id?: string | null;
	reporter_id?: string | null;
	resolved_at?: string | null;
	reporter?: { first_name: string; last_name: string } | null;
	location?: { name: string } | null;
}

export interface ReportField {
	name: string;
	label: string;
	placeholder?: string;
	type: 'text' | 'textarea' | 'checkbox';
	required?: boolean;
}

export const REPORT_KINDS: Record<
	Exclude<ReportKind, 'whistleblower'>,
	{ title: string; intro: string; fields: ReportField[]; subjectFrom: (b: Record<string, string>) => string }
> = {
	end_of_day: {
		title: 'End of day report',
		intro: 'Wrap up the day — how it went and anything the next shift should know.',
		fields: [
			{ name: 'summary', label: 'How did the day go?', placeholder: 'Busy lunch rush, calm evening…', type: 'textarea', required: true },
			{ name: 'issues', label: 'Any issues or follow-ups?', placeholder: 'Out of stock items, incidents, things to fix…', type: 'textarea' },
			{ name: 'handover', label: 'Notes for the next shift', placeholder: 'Prep done, deliveries expected…', type: 'textarea' }
		],
		subjectFrom: () =>
			`End of day — ${new Date().toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}`
	},
	temperature: {
		title: 'Temperature report',
		intro: 'Log a temperature reading for fridges, freezers or food.',
		fields: [
			{ name: 'item', label: 'What did you measure?', placeholder: 'Fridge 2, walk-in freezer, soup batch…', type: 'text', required: true },
			{ name: 'temperature', label: 'Temperature reading', placeholder: 'e.g. 4°C', type: 'text', required: true },
			{ name: 'note', label: 'Anything unusual?', placeholder: 'Door left open, compressor noise…', type: 'textarea' }
		],
		subjectFrom: (b) => `${b.item ?? 'Reading'}: ${b.temperature ?? ''}`.trim()
	},
	broken_item: {
		title: 'Broken item',
		intro: 'Report broken equipment so it gets fixed or replaced.',
		fields: [
			{ name: 'item', label: 'What item is broken?', placeholder: 'Describe in detail, or the model name…', type: 'text', required: true },
			{ name: 'details', label: 'What happened?', placeholder: 'How it broke, current state…', type: 'textarea', required: true },
			{ name: 'urgent', label: 'This blocks daily operations', type: 'checkbox' }
		],
		subjectFrom: (b) => b.item ?? 'Broken item'
	}
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
	open: 'Open',
	in_review: 'In review',
	resolved: 'Resolved'
};

export const KIND_LABELS: Record<ReportKind, string> = {
	whistleblower: 'Whistleblower',
	end_of_day: 'End of day',
	temperature: 'Temperature',
	broken_item: 'Broken item'
};
