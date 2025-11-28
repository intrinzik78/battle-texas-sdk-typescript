import { describe, it, expect } from "vitest";
import { LocationsClient } from "../src/resources/locations";
import { ApiError } from "../src/error";
import { FakeCore,CoreRequestOptions } from "./utils/fake-core";


import type {
	ApiResultPublicLocationsList,
	ApiResultPublicLocation,
	ApiResultPrivateLocation,
	PublicLocation,
	PrivateLocation,
    ApiResultError
} from "../src/generated/map";


describe("LocationsClient", () => {
	it("listNearestByZipcode – happy path", async () => {
		const fakeLocations: PublicLocation[] = [
			{
				name: "Battle Houston",
				address_1: "123 Some Road",
				address_2: null,
				city: "Houston",
				state: "TX",
				zipcode: "77004",
				country: "US"
			}
		];

		const wire: ApiResultPublicLocationsList = {
			Ok: {
				code: 200,
				message: "OK",
				data: fakeLocations
			}
		};

		const core = new FakeCore(async ({ method, path, options }) => {
			expect(method).toBe("GET");
			expect(path).toBe("/v1/locations");
			expect(options.requiresAuth).toBe(false);
			expect(options.query).toEqual({ nearest_zipcode: "77004" });

			return wire;
		});

		const client = new LocationsClient(core as any);

		const result = await client.listNearestByZipcode({
			nearestZipcode: "77004"
		});

		expect(result).toEqual(fakeLocations);
	});

	it("listNearestByZipcode – error path throws ApiError", async () => {
		const wire: ApiResultError = {
			Error: {
				code: 400,
				message: "bad request",
				data: {
					code: 1010,
					reason: "missing query parameter"
				}
			}
		};

		const core = new FakeCore(async () => wire);
		const client = new LocationsClient(core as any);

		await expect(
			client.listNearestByZipcode({ nearestZipcode: "bad-zip" })
		).rejects.toBeInstanceOf(ApiError);
	});

	it("publicById – calls correct path and returns public location", async () => {
		const fakeLocation: PublicLocation = {
			name: "Battle Austin",
			address_1: "456 Another St",
			address_2: null,
			city: "Austin",
			state: "TX",
			zipcode: "78701",
			country: "US"
		};

		const wire: ApiResultPublicLocation = {
			Ok: {
				code: 200,
				message: "OK",
				data: fakeLocation
			}
		};

		const core = new FakeCore(async ({ method, path, options }) => {
			expect(method).toBe("GET");
			expect(path).toBe("/v1/locations/42");
			expect(options.requiresAuth).toBe(false);
			return wire;
		});

		const client = new LocationsClient(core as any);
		const result = await client.getPublicById(42);

		expect(result).toEqual(fakeLocation);
	});

	it("privateById – requires auth and returns private location", async () => {
		const fakeLocation: PrivateLocation = {
			location_id: 42,
			business_id: 7,
			name: "Battle HQ",
			priority: 1,
			address_1: "789 Secret Ln",
			address_2: null,
			city: "Dallas",
			state: "TX",
			zipcode: "75201",
			country: "US"
		};

		const wire: ApiResultPrivateLocation = {
			Ok: {
				code: 200,
				message: "OK",
				data: fakeLocation
			}
		};

		const core = new FakeCore(async ({ method, path, options }) => {
			expect(method).toBe("GET");
			expect(path).toBe("/v1/locations/42/private");
			expect(options.requiresAuth).toBe(true);
			return wire;
		});

		const client = new LocationsClient(core as any);
		const result = await client.getPrivateById(42);

		expect(result).toEqual(fakeLocation);
	});
});