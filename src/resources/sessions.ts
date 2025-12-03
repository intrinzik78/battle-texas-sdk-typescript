import type { HttpCore } from "../http.js";

import type {
    CreateSessionBody,
    ApiResultToken,
    AccessToken
} from "../generated/map";

import { ApiError } from "../error.js";

export class SessionsClient {
    constructor(private core: HttpCore) {}

    async create(body: CreateSessionBody): Promise<AccessToken> {
        const wire = await this.core.request<ApiResultToken>(
            "POST",
            "/v1/sessions",
			{
				body,
				requiresAuth: false
			}
        );

        const ok = ApiError.unwrapApiResult(wire);

        return ApiError.expectData(ok,wire,"sessions.create");
    }

    async delete(): Promise<void> {
		const wire = await this.core.request<unknown>(
			"DELETE",
			"/v1/sessions",
			{ requiresAuth: true }
		);

		if (wire && typeof wire === "object" && "Error" in (wire as any)) {
			ApiError.unwrapApiResult(wire as any);
		}

        return;
    }
}
