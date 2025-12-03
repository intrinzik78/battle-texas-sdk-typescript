import { HttpCore,ClientOptions } from "./http.js";
import { LocationsClient } from "./resources/locations.js";
import { SessionsClient } from "./resources/sessions.js";
import { VerificationsClient } from "./resources/verifications.js";

export class Client {
	private core: HttpCore;

	readonly locations: LocationsClient;
	readonly sessions: SessionsClient;
	readonly verifications: VerificationsClient;

	constructor(opts: ClientOptions) {
		this.core = new HttpCore(opts);
		this.locations = new LocationsClient(this.core);
		this.sessions = new SessionsClient(this.core);
		this.verifications = new VerificationsClient(this.core);
	}
}