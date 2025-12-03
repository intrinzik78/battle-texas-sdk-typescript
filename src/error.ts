const MALFORMED_OK_MESSAGE = "malformed api response (missing data)";
const MALFORMED_GENERIC_MESSAGE = "malformed api response envelope";

export type ApiErrorKind = "NETWORK" | "TIMEOUT" | "HTTP" | "UNKNOWN";

export interface ApiErrorOptions {
    httpStatus?: number;
    apiCode?: number;
    message: string;
    apiReason?: string;
    responseBody?: unknown;
    errorKind?: ApiErrorKind;
}

export class ApiError extends Error {
    readonly httpStatus?: number;
    readonly apiCode?: number;
    readonly apiReason?: string;
    readonly responseBody?: unknown;
    readonly errorKind?: ApiErrorKind;

    constructor(opts: ApiErrorOptions) {
        super(opts.message);
        this.name = "ApiError";
        this.httpStatus = opts.httpStatus;
        this.apiCode = opts.apiCode;
        this.apiReason = opts.apiReason;
        this.responseBody = opts.responseBody;
        this.errorKind = opts.errorKind;
    }

    // ----- Static helpers -----

    // Extract the Ok part of an ApiResult-like type
    private static okPart<T>(wire: T): T extends { Ok: infer R } ? R : never {
        const anyWire = wire as any;
        return anyWire.Ok;
    }

    private static errorPart<T>(wire: T): T extends { Error: infer R } ? R : never {
        const anyWire = wire as any;
        return anyWire.Error;
    }

    // unwarps api result envelope into its Ok payload or throws ApiError using the Error payload with optional fields
    static unwrapApiResult<T extends { Ok?: unknown; Error?: unknown }>(wire: T): T extends { Ok: infer R } ? R : never {
        const anyWire = wire as any;

        // return an existing ok payload
        if (anyWire.Ok) {
            return ApiError.okPart(wire);
        }

        //  return an existing error payload
        if (anyWire.Error) {
            const err = ApiError.errorPart(wire) as {
                code?: number;
                message?: string;
                data?: { code?: number; reason?: string };
            };

            throw new ApiError({
                message: err.message ?? "no message",
                httpStatus: typeof err.code === "number" ? err.code : 500,
                apiCode: err.data?.code,
                apiReason: err.data?.reason,
                responseBody: wire
            });
        }

        // throw a generic 500 if neither ok nor error payloads exist
        throw new ApiError({
            message: MALFORMED_GENERIC_MESSAGE,
            httpStatus: 500,
            responseBody: wire,
        });
    }

    static expectData<TData>(ok: { code?: number; data?: TData },wire: unknown,context?: string): TData {

        if (typeof ok.data === "undefined") {
            throw new ApiError({
                message: context ? `${MALFORMED_OK_MESSAGE} [${context}]` : MALFORMED_OK_MESSAGE,
                httpStatus: ok.code ?? 500,
                responseBody: wire,
                errorKind: "UNKNOWN"
            });
        }

        return ok.data;
    }
}
