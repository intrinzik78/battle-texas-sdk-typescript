import type { HttpCore } from "../http";

import type {
	PublicLocation,
	ApiResultPublicLocationsList,
	ApiResultPublicLocation,
	PrivateLocation,
	ApiResultPrivateLocation
} from "../generated/map";

import { ApiError } from "../error";

export class LocationsClient {
	constructor(private core: HttpCore) {}

	async listNearestByZipcode(params: { nearestZipcode: string }): Promise<PublicLocation[]> {
		const wire = await this.core.request<ApiResultPublicLocationsList>(
			"GET",
			"/v1/locations",
			{
				query: { nearest_zipcode: params.nearestZipcode },
				requiresAuth: false
			}
		);


		const ok = ApiError.unwrapApiResult(wire);

		return ApiError.expectData(ok,wire,"locations.listNearestByZipcode");
	}

	async getPublicById(id: number): Promise<PublicLocation> {
		const wire = await this.core.request<ApiResultPublicLocation>(
			"GET",
			`/v1/locations/${id}`,
			{ requiresAuth: false }
		);

		const ok = ApiError.unwrapApiResult(wire);

		return ApiError.expectData(ok,wire,"locations.publicById");
	}

	async getPrivateById(id: number): Promise<PrivateLocation> {
		const wire = await this.core.request<ApiResultPrivateLocation>(
			"GET",
			`/v1/locations/${id}/private`,
			{ requiresAuth: true }
		);

		const ok = ApiError.unwrapApiResult(wire);

		return ApiError.expectData(ok,wire,"locations.privateById");
	}
}
