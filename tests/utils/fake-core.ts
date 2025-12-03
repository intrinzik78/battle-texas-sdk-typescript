/**
 * Very small fake HttpCore that lets us:
 *  - Assert method/path/options
 *  - Return whatever "wire" object we want
 */
export class FakeCore {
	constructor(
		private handler: (args: {
			method: string;
			path: string;
			options: CoreRequestOptions;
		}) => Promise<unknown>
	) {}

	request<T>(
		method: string,
		path: string,
		options: CoreRequestOptions
	): Promise<T> {
		return this.handler({ method, path, options }) as Promise<T>;
	}
}

export type CoreRequestOptions = {
	requiresAuth?: boolean;
	query?: Record<string, string>;
	body?: unknown;
	// headers?: Record<string, string>;
	// timeoutMs?: number;
};