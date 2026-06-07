/** Parse a ?month=YYYY-MM param (default: current month) into useful values. */
export function resolveMonth(monthParam: string | null) {
	const now = new Date();
	let year = now.getFullYear();
	let month = now.getMonth(); // 0-based
	const m = monthParam?.match(/^(\d{4})-(\d{2})$/);
	if (m) {
		year = parseInt(m[1], 10);
		month = parseInt(m[2], 10) - 1;
	}
	const start = new Date(year, month, 1, 0, 0, 0, 0);
	const end = new Date(year, month + 1, 1, 0, 0, 0, 0); // exclusive
	const pad = (n: number) => String(n).padStart(2, '0');
	const monthStr = `${year}-${pad(month + 1)}`;
	const firstOfMonth = `${year}-${pad(month + 1)}-01`;
	const label = start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
	return { year, month, start, end, monthStr, firstOfMonth, label };
}
