// Shared row types for SessionPilot Ops (pragmatic, hand-written)

export type UserRole = 'super_admin' | 'org_admin' | 'restaurant_manager' | 'shift_manager' | 'employee';
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'suspended';
export type TaskStatus =
	| 'pending'
	| 'in_progress'
	| 'submitted'
	| 'approved'
	| 'rejected'
	| 'overdue'
	| 'completed';
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type EvidenceKind = 'photo' | 'video' | 'file' | 'note';
export type AssignmentMode = 'individual' | 'job_role' | 'location';
export type ContractType = 'full_time' | 'hourly';

/** ISO weekday keys 1=Mon..7=Sun; null/absent = closed that day */
export type OpeningHours = Record<string, { open: string; close: string } | null>;

export const MANAGER_ROLES: UserRole[] = ['super_admin', 'org_admin', 'restaurant_manager', 'shift_manager'];
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'org_admin'];

export function isManagerRole(role?: string | null): boolean {
	return !!role && (MANAGER_ROLES as string[]).includes(role);
}

export interface Organization {
	id: string;
	name: string;
}

export interface Brand {
	id: string;
	organization_id: string;
	name: string;
}

export interface AppLocation {
	id: string;
	organization_id: string;
	brand_id: string | null;
	name: string;
	address: string | null;
	city: string | null;
	postal_code: string | null;
	country: string | null;
	phone: string | null;
	email: string | null;
	chat_enabled: boolean;
	attendance_qr_required: boolean;
	opening_hours: OpeningHours;
	brand?: Pick<Brand, 'name'> | null;
}

export interface Department {
	id: string;
	organization_id: string;
	name: string;
}

export interface JobRole {
	id: string;
	organization_id: string;
	/** null = universal (all locations) */
	location_id: string | null;
	name: string;
	description: string | null;
	responsibilities?: Pick<Responsibility, 'id' | 'name'>[];
}

export interface Holiday {
	id: string;
	organization_id: string;
	/** null = applies to all locations */
	location_id: string | null;
	date: string;
	name: string;
	location?: Pick<AppLocation, 'name'> | null;
}

export interface Profile {
	id: string;
	organization_id: string | null;
	location_id: string | null;
	department_id: string | null;
	job_role_id: string | null;
	role: UserRole;
	first_name: string;
	last_name: string;
	email: string | null;
	phone: string | null;
	personal_number: string | null;
	date_of_birth: string | null;
	employee_id: string | null;
	position: string | null;
	hire_date: string | null;
	status: EmployeeStatus;
	contract_type: ContractType;
	hourly_rate: number | null;
	/** contract hours per month (full-time) — drives overtime */
	monthly_hours: number | null;
	// employment-letter fields
	address: string | null;
	postal_code: string | null;
	city: string | null;
	/** paygrade: 'grupp1' | 'grupp2' | 'grupp3' */
	pay_group: string | null;
	monthly_salary: number | null;
	/** provanstallning | tillsvidare | visstid | vikariat | sasong | enstaka */
	employment_form: string | null;
	employment_end: string | null;
	occupation_code: string | null;
	bank_account: string | null;
	avatar_url: string | null;
	bio: string | null;
	created_at: string;
	// joined
	location?:
		| (Pick<AppLocation, 'id' | 'name' | 'chat_enabled' | 'attendance_qr_required'> & {
				brand?: Pick<Brand, 'name'> | null;
		  })
		| null;
	department?: Pick<Department, 'name'> | null;
	job_role?: Pick<JobRole, 'name'> | null;
}

export interface Responsibility {
	id: string;
	organization_id: string;
	/** null = universal (all locations) */
	location_id: string | null;
	department_id: string | null;
	name: string;
	description: string | null;
	estimated_minutes: number | null;
	priority: PriorityLevel;
	department?: Pick<Department, 'name'> | null;
}

export interface SopStep {
	id: string;
	sop_id: string;
	step_number: number;
	title: string;
	description: string | null;
	attachments: { type: 'image' | 'video' | 'pdf' | 'link'; url: string; label?: string }[];
}

export interface Sop {
	id: string;
	organization_id: string;
	department_id: string | null;
	name: string;
	description: string | null;
	category: string | null;
	department?: Pick<Department, 'name'> | null;
	sop_steps?: SopStep[];
}

export interface ChecklistItem {
	id: string;
	template_id: string;
	label: string;
	mandatory: boolean;
	requires_evidence: boolean;
	sort_order: number;
}

export interface TaskTemplate {
	id: string;
	organization_id: string;
	location_id: string | null;
	department_id: string | null;
	sop_id: string | null;
	responsibility_id: string | null;
	name: string;
	description: string | null;
	recurrence: RecurrenceType;
	recurrence_config: Record<string, unknown>;
	due_time: string;
	priority: PriorityLevel;
	requires_evidence: boolean;
	evidence_kind: EvidenceKind;
	requires_approval: boolean;
	assignment_mode: AssignmentMode;
	assigned_job_role_id: string | null;
	active: boolean;
	location?: Pick<AppLocation, 'name'> | null;
	department?: Pick<Department, 'name'> | null;
	sop?: Pick<Sop, 'id' | 'name'> | null;
	checklist_items?: ChecklistItem[];
}

export interface TaskInstance {
	id: string;
	template_id: string;
	location_id: string | null;
	due_date: string;
	due_at: string;
	status: TaskStatus;
	submitted_at: string | null;
	submitted_by: string | null;
	template?: TaskTemplate;
}

export interface ItemCompletion {
	id: string;
	task_instance_id: string;
	checklist_item_id: string;
	completed: boolean;
	comment: string | null;
	completed_by: string | null;
	completed_at: string;
}

export interface Evidence {
	id: string;
	task_instance_id: string;
	checklist_item_id: string | null;
	kind: EvidenceKind;
	storage_path: string | null;
	note: string | null;
	uploaded_by: string | null;
	created_at: string;
}

export interface Approval {
	id: string;
	task_instance_id: string;
	reviewed_by: string | null;
	decision: 'approved' | 'rejected';
	reason: string | null;
	notes: string | null;
	created_at: string;
}

export interface Shift {
	id: string;
	location_id: string;
	user_id: string;
	department_id: string | null;
	shift_date: string;
	start_time: string;
	end_time: string;
	role_label: string | null;
	notes: string | null;
	user?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null;
	location?: Pick<AppLocation, 'name'> | null;
}

export interface AppEvent {
	id: string;
	location_id: string | null;
	organization_id: string | null;
	title: string;
	description: string | null;
	starts_at: string;
	image_url: string | null;
	event_attendance?: { user_id: string; status: string }[];
}

export interface AppNotification {
	id: string;
	user_id: string;
	kind: string;
	title: string;
	body: string | null;
	link: string | null;
	read: boolean;
	created_at: string;
}

export interface AuditLog {
	id: string;
	organization_id: string | null;
	actor_id: string | null;
	action: string;
	entity_type: string | null;
	entity_id: string | null;
	details: Record<string, unknown>;
	created_at: string;
	actor?: Pick<Profile, 'first_name' | 'last_name'> | null;
}

export interface Company {
	id: string;
	organization_id: string;
	name: string;
	org_number: string | null;
	address: string | null;
	postal_code: string | null;
	city: string | null;
	country: string | null;
	phone: string | null;
	email: string | null;
	workplace: string | null;
	collective_agreement: string | null;
	signatory_name: string | null;
	signatory_title: string | null;
	payday: string | null;
}

export interface TimeEntry {
	id: string;
	user_id: string;
	location_id: string | null;
	clock_in: string;
	clock_out: string | null;
	breaks?: TimeBreak[];
	user?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'avatar_url'> | null;
}

export interface TimeBreak {
	id: string;
	time_entry_id: string;
	break_start: string;
	break_end: string | null;
}

export interface TimeAdjustment {
	id: string;
	user_id: string;
	/** first day of the month it applies to */
	month: string;
	minutes: number;
	reason: string;
	created_by: string | null;
	created_at: string;
}

/** Net worked minutes for a (possibly still open) entry: (out - in) - breaks. */
export function entryNetMinutes(e: TimeEntry, asOf: Date = new Date()): number {
	const start = new Date(e.clock_in).getTime();
	const end = e.clock_out ? new Date(e.clock_out).getTime() : asOf.getTime();
	let breakMs = 0;
	for (const b of e.breaks ?? []) {
		const bs = new Date(b.break_start).getTime();
		const be = b.break_end ? new Date(b.break_end).getTime() : asOf.getTime();
		breakMs += Math.max(0, be - bs);
	}
	return Math.max(0, (end - start - breakMs) / 60000);
}

export function fullName(p?: Pick<Profile, 'first_name' | 'last_name'> | null): string {
	if (!p) return '';
	return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
}

/** The restaurant name shown to a user — assigned by the admin via location. */
export function brandNameFor(profile?: Profile | null): string {
	return profile?.location?.brand?.name || profile?.location?.name || 'SessionPilot';
}
