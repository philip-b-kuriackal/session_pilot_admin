// Monthly pay computation shared by the admin timesheet and the employee payslip pages.
import { entryNetMinutes, type Profile, type TimeEntry } from '$lib/types';

export interface PayslipSummary {
	/** Net worked minutes from closed entries (open entries excluded). */
	worked_minutes: number;
	/** Manager adjustment minutes (can be negative). */
	adjustment_minutes: number;
	/** worked + adjustments. */
	total_minutes: number;
	/** Contract target in minutes (full-time only), else null. */
	target_minutes: number | null;
	/** Minutes over the contract target (full-time only), else null. */
	overtime_minutes: number | null;
	/** Estimated gross pay, or null if no hourly rate / contract hours configured. */
	est_pay: number | null;
	base_pay: number | null;
	overtime_pay: number | null;
}

export type ContractFields = Pick<Profile, 'contract_type' | 'hourly_rate' | 'monthly_hours'>;

/**
 * Compute a month's pay from the employee's closed time entries + manager adjustments.
 * Full-time: pay = contract hours × rate + overtime hours × rate.
 * Hourly: pay = total worked hours × rate.
 */
export function computePayslip(
	profile: ContractFields,
	entries: TimeEntry[],
	adjustmentMinutes: number
): PayslipSummary {
	const worked = entries.filter((e) => e.clock_out).reduce((sum, e) => sum + entryNetMinutes(e), 0);
	const total = worked + adjustmentMinutes;
	const isFullTime = profile.contract_type === 'full_time';
	const monthlyHours = profile.monthly_hours ?? null;
	const rate = profile.hourly_rate ?? null;
	const target = isFullTime && monthlyHours != null ? monthlyHours * 60 : null;
	const overtime = isFullTime && monthlyHours != null ? Math.max(0, total - monthlyHours * 60) : null;

	let estPay: number | null = null;
	let basePay: number | null = null;
	let overtimePay: number | null = null;
	if (rate != null) {
		if (isFullTime) {
			if (monthlyHours != null) {
				basePay = monthlyHours * rate;
				overtimePay = ((overtime ?? 0) / 60) * rate;
				estPay = basePay + overtimePay;
			}
		} else {
			estPay = (total / 60) * rate;
		}
	}

	return {
		worked_minutes: worked,
		adjustment_minutes: adjustmentMinutes,
		total_minutes: total,
		target_minutes: target,
		overtime_minutes: overtime,
		est_pay: estPay,
		base_pay: basePay,
		overtime_pay: overtimePay
	};
}
