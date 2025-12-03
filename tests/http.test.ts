// tests/http-core.test.ts
import { describe, it, expect } from "vitest";
import { HttpCore, type ClientOptions } from "../src/http";
import { ApiError } from "../src/error";
import { jsonResponse } from "./utils/json-response";

describe("HttpCore", () => {
  it("builds URL with baseUrl + path + query params", async () => {
    let capturedUrl: string | null = null;

    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      return jsonResponse({ Ok: { code: 200, message: "OK" } });
    };

    const opts: ClientOptions = {
      baseUrl: "https://api.example.com",
      timeoutMs: 2000,
      fetchImpl
    };

    const core = new HttpCore(opts);

    await core.request<unknown>("GET", "/v1/locations", {
        requiresAuth: false,
        query: { nearest_zipcode: "77004", foo: "bar" }
    });

    expect(capturedUrl).toBe(
      "https://api.example.com/v1/locations?nearest_zipcode=77004&foo=bar"
    );
  });

  it("adds Authorization header when requiresAuth and token present", async () => {
    let capturedInit: RequestInit | undefined;

    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedInit = init;
      return jsonResponse({ Ok: { code: 200, message: "OK" } });
    };

    const opts: ClientOptions = {
      baseUrl: "https://api.example.com",
      timeoutMs: 2000,
      getToken: () => "eyJ.mock.token",
      fetchImpl
    };

    const core = new HttpCore(opts);

    await core.request<unknown>("GET", "/v1/locations", {
      requiresAuth: true
    });

    const headers = capturedInit?.headers as Record<string, string>;
    // Depending on how you built headers, you may need different access here
    expect(headers["Authorization"] || headers["authorization"]).toBe(
      "Bearer eyJ.mock.token"
    );
  });

  it("does not add Authorization header when requiresAuth is false", async () => {
    let capturedInit: RequestInit | undefined;

    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedInit = init;
      return jsonResponse({ Ok: { code: 200, message: "OK" } });
    };

    const opts: ClientOptions = {
      baseUrl: "https://api.example.com",
      timeoutMs: 2000,
      getToken: () => "eyJ.mock.token",
      fetchImpl
    };

    const core = new HttpCore(opts);

    await core.request<unknown>("GET", "/v1/locations", {
      requiresAuth: false
    });

    const headers = (capturedInit?.headers ?? {}) as Record<string, string>;
    expect(headers["Authorization"] || headers["authorization"]).toBeUndefined();
  });

  it("serializes JSON body for POST", async () => {
    let capturedInit: RequestInit | undefined;
    const body = { username: "name@example.com", password: "pw" };

    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedInit = init;
      return jsonResponse({ Ok: { code: 200, message: "OK" } });
    };

    const opts: ClientOptions = {
      baseUrl: "https://api.example.com",
      timeoutMs: 2000,
      fetchImpl
    };

    const core = new HttpCore(opts);

    await core.request<unknown>("POST", "/v1/sessions", {
      requiresAuth: false,
      body
    });

    expect(capturedInit?.method).toBe("POST");
    expect(capturedInit?.body).toBe(JSON.stringify(body));

    const headers = capturedInit?.headers as Record<string, string>;
    expect(
      (headers["Content-Type"] || headers["content-type"]).startsWith("application/json")
    ).toBe(true);
  });

  it("returns parsed JSON for 200 JSON response", async () => {
    const wire = { Ok: { code: 200, message: "OK" } };

    const fetchImpl = async () => jsonResponse(wire);

    const opts: ClientOptions = {
      baseUrl: "https://api.example.com",
      timeoutMs: 2000,
      fetchImpl
    };

    const core = new HttpCore(opts);

    const result = await core.request<typeof wire>("GET", "/health", {
      requiresAuth: false
    });

    expect(result).toEqual(wire);
  });

  it("returns undefined for 204 no content", async () => {
    const fetchImpl = async () =>
      ({
          ok: true,
          status: 204,
          headers: {
          get() {
              return null;
          }
          },
          async text() {
            // No content
            return "";
          },
          async json() {
          throw new Error("should not parse json for 204");
          }
      } as any);

        const opts: ClientOptions = {
          baseUrl: "https://api.example.com",
          timeoutMs: 2000,
          fetchImpl
        };

    const core = new HttpCore(opts);

    const result = await core.request<unknown>("DELETE", "/v1/sessions", {
		requiresAuth: true
    });

    expect(result).toBeUndefined();
  });

  it("propagates fetch errors (network failure)", async () => {
    const fetchImpl = async () => {
      throw new Error("network down");
    };

    const opts: ClientOptions = {
      baseUrl: "https://api.example.com",
      timeoutMs: 2000,
      fetchImpl
    };

    const core = new HttpCore(opts);

    await expect(
      core.request<unknown>("GET", "/v1/locations", { requiresAuth: false })
    ).rejects.toBeInstanceOf(ApiError);

    try {
      await core.request<unknown>("GET", "/v1/locations", { requiresAuth: false });
    } catch (err) {
      const e = err as ApiError;
      expect(e.httpStatus).toBe(0);
      expect(e.errorKind).toBe("NETWORK");
      // optional: keep this if you care about message
      expect(e.message).toBe("Network error");
    }
  });

  it("classifies AbortError as TIMEOUT", async () => {
    // Simulate what fetch would do on an aborted request
    const fetchImpl = async () => {
      const err = new Error("aborted");
      (err as any).name = "AbortError"; // isAbortError() checks this
      throw err;
    };

    const opts: ClientOptions = {
      baseUrl: "https://api.example.com",
      timeoutMs: 2000,
      fetchImpl
    };

    const core = new HttpCore(opts);

    await expect(
      core.request<unknown>("GET", "/v1/locations", { requiresAuth: false })
    ).rejects.toBeInstanceOf(ApiError);

    try {
      await core.request<unknown>("GET", "/v1/locations", { requiresAuth: false });
    } catch (err) {
      const e = err as ApiError;

      expect(e.httpStatus).toBe(0);
      expect(e.errorKind).toBe("TIMEOUT");
      expect(e.message).toBe("Request timed out");
      // optional: you *could* also assert responseBody is the original error
      // expect(e.responseBody).toBeInstanceOf(Error);
    }
  });
});