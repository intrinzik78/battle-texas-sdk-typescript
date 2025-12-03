import { describe, it, expect } from "vitest";
import { SessionsClient } from "../src/resources/sessions";
import { ApiError } from "../src/error";
import { FakeCore } from "./utils/fake-core";

import type {
  CreateSessionBody,
  AccessToken,
  ApiResultToken,
  ApiResultError
} from "../src/generated/map";

describe("SessionsClient", () => {
  it("create - happy path returns AccessToken", async () => {
    const body: CreateSessionBody = {
      username: "name@example.com",
      password: "correct-horse-battery-staple"
    };

    const fakeToken: AccessToken = {
      access_token: "some-mock-token"
    };

    const wire: ApiResultToken = {
      Ok: {
        code: 200,
        message: "OK",
        data: fakeToken
      }
    };

    const core = new FakeCore(async ({ method, path, options }) => {
      expect(method).toBe("POST");
      expect(path).toBe("/v1/sessions");
      expect(options.requiresAuth).toBe(false);
      expect(options.body).toEqual(body);

      return wire;
    });

    const client = new SessionsClient(core as any);

    const result = await client.create(body);

    expect(result).toEqual(fakeToken);
  });

  it("create - error path throws ApiError", async () => {
    const body: CreateSessionBody = {
        username: "name@example.com",
        password: "bad-password"
    };

    const wire: ApiResultError = {
      Error: {
        code: 401,
        message: "Unauthorized",
        data: {
          code: 1007,
          reason: "verification failed"
        }
      }
    };

    const core = new FakeCore(async () => wire);
    const client = new SessionsClient(core as any);

    await expect(client.create(body)).rejects.toBeInstanceOf(ApiError);

    try {
      await client.create(body);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);

      const e = err as ApiError;

      expect(e.httpStatus).toBe(401);
      expect(e.apiCode).toBe(1007);
      expect(e.apiReason).toBe("verification failed");
    }
  });

  it("delete - happy path (204 no content) resolves", async () => {
    const core = new FakeCore(async ({ method, path, options }) => {
      expect(method).toBe("DELETE");
      expect(path).toBe("/v1/sessions");
      expect(options.requiresAuth).toBe(true);

      // Simulate 204: HttpCore would normally return undefined / no body
      return undefined;
    });

    const client = new SessionsClient(core as any);

    await expect(client.delete()).resolves.toBeUndefined();
  });

  it("delete - error envelope throws ApiError", async () => {
    const wire: ApiResultError = {
      Error: {
        code: 429,
        message: "rate limited",
        data: {
          code: 1003,
          reason: "too many session deletes"
        }
      }
    };

    const core = new FakeCore(async () => wire);
    const client = new SessionsClient(core as any);

    await expect(client.delete()).rejects.toBeInstanceOf(ApiError);
  });
});
