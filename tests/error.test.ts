import { describe, it, expect } from "vitest";
import { ApiError } from "../src/error";

describe("ApiError.unwrapApiResult", () => {
  it("returns Ok payload when present", () => {
    const wire = {
        Ok: {
            code: 200,
            message: "OK",
            data: { foo: "bar" }
        }
    };

    const ok = ApiError.unwrapApiResult(wire);

    expect(ok.code).toBe(200);
    expect(ok.message).toBe("OK");
    expect(ok.data).toEqual({ foo: "bar" });
  });

  it("throws ApiError when Error with ApiErrorData is present", () => {
    const wire = {
      Error: {
        code: 400,
        message: "bad request",
        data: {
          code: 1010,
          reason: "missing query parameter"
        }
      }
    };

    expect(() => ApiError.unwrapApiResult(wire as any)).toThrow(ApiError);

    try {
      ApiError.unwrapApiResult(wire as any);
    } catch (err) {
      const e = err as ApiError;
      expect(e.httpStatus).toBe(400);
      expect(e.apiCode).toBe(1010);
      expect(e.apiReason).toBe("missing query parameter");
      expect(e.message).toBe("bad request");
      expect(e.responseBody).toEqual(wire);
    }
  });

  it("throws ApiError when response is malformed (no Ok or Error)", () => {
    const wire = { something: "weird" };

    expect(() => ApiError.unwrapApiResult(wire as any)).toThrow(ApiError);

    try {
      ApiError.unwrapApiResult(wire as any);
    } catch (err) {
      const e = err as ApiError;
      expect(e.message.toLowerCase()).toContain("malformed");
      expect(e.httpStatus).toBe(500);
      expect(e.responseBody).toEqual(wire);
    }
  });
});

describe("ApiError.expectData", () => {
    it("returns data when present", () => {
        const ok = {
            code: 200,
            message: "OK",
            data: [{ name: "Test Location" }]
        };

        const data = ApiError.expectData<typeof ok.data>(
            ok,
            { Ok: ok },
            "locations.listNearestByZipcode"
        );

        expect(Array.isArray(data)).toBe(true);
        expect(data[0]).toEqual({ name: "Test Location" });
    });

    it("throws ApiError when data is missing", () => {
        const ok = {
            code: 200,
            message: "OK"
            // data: missing
        } as any;

        let context = "locations.listNearestByZipcode";

        expect(() =>
            ApiError.expectData<any>(ok, { Ok: ok }, context)
        ).toThrow(ApiError);

        try {
            ApiError.expectData<any>(ok, { Ok: ok }, context);
        } catch (err) {
            expect(err).toBeInstanceOf(ApiError);
            const e = err as ApiError;
            expect(e.httpStatus).toBe(200);
            expect(e.message).toContain(`malformed api response (missing data) [${context}]`);
            expect(e.responseBody).toEqual({ Ok: ok });
        }
    });
});
