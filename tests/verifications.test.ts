// tests/verifications.test.ts
import { describe, it, expect } from "vitest";
import { VerificationsClient } from "../src/resources/verifications";
import { ApiError } from "../src/error";
import { FakeCore } from "./utils/fake-core";

import type {
  EmailVerificationPost,
  SuccessMessage,
  ApiResultError
} from "../src/generated/map";

describe("VerificationsClient", () => {
  it("createEmailVerification – happy path resolves", async () => {
    const body: EmailVerificationPost = { email: "name@example.com" };

    const wire: SuccessMessage = {
      Ok: {
        code: 201,
        message: "resource created",
        data: "verification email sent"
      }
    };

    const core = new FakeCore(async ({ method, path, options }) => {
      expect(method).toBe("POST");
      expect(path).toBe("/v1/verifications/email");
      expect(options.requiresAuth).toBe(false);
      expect(options.body).toEqual(body);

      return wire;
    });

    const client = new VerificationsClient(core as any);

    await expect(client.createEmailVerification(body)).resolves.toBeUndefined();
  });

  it("createEmailVerification – error path throws ApiError", async () => {
    const body: EmailVerificationPost = { email: "name@example.com" };

    const wire: ApiResultError = {
      Error: {
        code: 429,
        message: "rate limited",
        data: {
          code: 1003,
          reason: "new verification requested too quickly"
        }
      }
    };

    const core = new FakeCore(async () => wire);
    const client = new VerificationsClient(core as any);

    await expect(
      client.createEmailVerification(body)
    ).rejects.toBeInstanceOf(ApiError);

    try {
      await client.createEmailVerification(body);
    } catch (err) {
      const e = err as ApiError;
      expect(e.httpStatus).toBe(429);
      expect(e.apiCode).toBe(1003);
      expect(e.apiReason).toBe("new verification requested too quickly");
    }
  });

  it("patchEmailVerification – happy path resolves", async () => {
    const uuid = "mock-uuid";
    const id = 123;

    const wire: SuccessMessage = {
      Ok: {
        code: 201,
        message: "resource created",
        data: "email verified"
      }
    };

    const core = new FakeCore(async ({ method, path, options }) => {
      expect(method).toBe("PATCH");
      expect(path).toBe(`/v1/verifications/email/${uuid}/${id}`);
      expect(options.requiresAuth).toBe(false);

      return wire;
    });

    const client = new VerificationsClient(core as any);

    await expect(
      client.patchEmailVerification(uuid, id)
    ).resolves.toBeUndefined();
  });

  it("patchEmailVerification – error path throws ApiError", async () => {
    const uuid = "mock-uuid";
    const id = 123;

    const wire: ApiResultError = {
      Error: {
        code: 410,
        message: "gone",
        data: {
          code: 1005,
          reason: "verification link has expired"
        }
      }
    };

    const core = new FakeCore(async () => wire);
    const client = new VerificationsClient(core as any);

    await expect(
      client.patchEmailVerification(uuid, id)
    ).rejects.toBeInstanceOf(ApiError);

    try {
      await client.patchEmailVerification(uuid, id);
    } catch (err) {
      const e = err as ApiError;
      expect(e.httpStatus).toBe(410);
      expect(e.apiCode).toBe(1005);
      expect(e.apiReason).toBe("verification link has expired");
    }
  });
});
