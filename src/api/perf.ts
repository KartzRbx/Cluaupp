/** Cold/warm timing helpers for API generate / LSP-ish lookups. */
export interface PerfSample {
	label: string;
	ms: number;
}

export function timeCall<T>(label: string, fn: () => T): { value: T; sample: PerfSample } {
	const started = Date.now();
	const value = fn();
	return { value, sample: { label, ms: Date.now() - started } };
}

export function formatPerf(samples: PerfSample[]): string {
	return samples.map((s) => `${s.label}=${s.ms}ms`).join(" ");
}
