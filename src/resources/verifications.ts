import type { HttpCore } from "../http";

import type {
    EmailVerificationPost,
    SuccessMessage
} from "../generated/map";

import { ApiError } from "../error";

export class VerificationsClient {
    constructor(private core: HttpCore) {}

    async createEmailVerification(body: EmailVerificationPost): Promise<void> {
        const wire = await this.core.request<SuccessMessage>(
            "POST",
            "/v1/verifications/email",
            {
                body,
                requiresAuth: false
            }
        );

        ApiError.unwrapApiResult(wire);

        return;
    }

    async patchEmailVerification(uuid:string,id:number): Promise<void> {
        const wire = await this.core.request<SuccessMessage>(
            "PATCH",
            `/v1/verifications/email/${uuid}/${id}`,
            {
                requiresAuth: false
            }
        );

        ApiError.unwrapApiResult(wire);

        return;
    }
}