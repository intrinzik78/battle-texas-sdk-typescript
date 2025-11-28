import { ApiError } from "./error";

export type Method = "GET" | "POST" | "PATCH" | "DELETE";

function isAbortError(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as any).name === "AbortError";
}

export interface ClientOptions {
    baseUrl: string;
    fetchImpl?: typeof fetch;
    getToken?: () => string | null | undefined;
    timeoutMs?: number;
}

export class HttpCore {
    private baseUrl: string;
    private fetchImpl: typeof fetch;
    private getToken?: () => string | null | undefined;
    private timeoutMs?: number;

    constructor(opts: ClientOptions) {
        this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
        this.fetchImpl = opts.fetchImpl ?? fetch;
        this.getToken = opts.getToken;
        this.timeoutMs = opts.timeoutMs;
    }

    async request<TWire>(
        method: Method,
        path: string,
        options?: {
            query?: Record<string, string | number | boolean | undefined>;
            body?: unknown;
            requiresAuth?: boolean;
            signal?: AbortSignal;
        }
    ): Promise<TWire> {

        const url = new URL(path, this.baseUrl);

        if (options?.query) {
            for (const [k, v] of Object.entries(options.query)) {
                if (v !== undefined) url.searchParams.set(k, String(v));
            }
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };

        if (options?.requiresAuth && this.getToken) {
            const token = this.getToken();

            if (token) headers["Authorization"] = `Bearer ${token}`;
        }

        const controller = !options?.signal && this.timeoutMs
            ? new AbortController()
            : undefined;

        const signal = options?.signal ?? controller?.signal;

        const timeoutId = controller && this.timeoutMs
            ? setTimeout(() => controller.abort(), this.timeoutMs)
            : undefined;

        let res: Response;

        try {
            res = await this.fetchImpl(url.toString(), {
                method,
                headers,
                body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
                signal
            });
        } catch (err) {
            if (timeoutId) clearTimeout(timeoutId);

            const timeout = isAbortError(err);

            throw new ApiError({
                message: timeout ? "Request timed out" : "Network error",
                httpStatus: 0,
                responseBody: err,
                errorKind: timeout ? "TIMEOUT" : "NETWORK"
            });
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }

        if (res.status === 204) {
            return undefined as TWire;
        }
        
        let json: unknown = null;
        const text = await res.text();

        if (text) {
            try {
                json = JSON.parse(text);
            } catch {
                json = text;
            }
        }

        // throw error on non-ok response
        if (!res.ok) {
            const apiErrorData = extractApiError(json);

            throw new ApiError({
                message: apiErrorData?.message ?? `HTTP ${res.status}`,
                httpStatus: res.status,
                apiCode: apiErrorData?.code,
                apiReason: apiErrorData?.reason,
                responseBody: json,
                errorKind: "HTTP"
            });
        }

        return json as TWire;
    }
}

function extractApiError(body: unknown): { code?: number; reason?: string; message?: string } | null {
    if (!body || typeof body !== "object") return null;

    const obj = body as any;
    const wrapped = obj.Error ?? obj.Ok ?? null;

    if (!wrapped || typeof wrapped !== "object") return null;

    const data = wrapped.data ?? {};
    
    return {
        code: typeof data.code === "number" ? data.code : undefined,
        reason: typeof data.reason === "string" ? data.reason : undefined,
        message: typeof wrapped.message === "string" ? wrapped.message : undefined
    };
}
